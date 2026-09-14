import { fetchLiveSerp, fetchPageProfile, normalizeDomain, type LiveSerpResult, type PageProfile } from './searchConsoleService';

export type GeoEngine = 'openai' | 'gemini' | 'perplexity' | 'claude';
export type GeoQuestion = { id: number; question: string };
export type GeoResponse = { questionId: number; question: string; engine: GeoEngine; answer: string; brands: string[]; sources: string[]; brandMentioned: boolean; error?: string };
export type GeoSource = { url: string; citations: number; profile?: PageProfile; error?: string };

const timeout = (ms: number) => AbortSignal.timeout(ms);
const jsonHeaders = { 'Content-Type': 'application/json' };

export function buildGeoQuestions(sector: string, location: string): GeoQuestion[] {
  const subject = sector.trim() || 'gestion de présence en ligne pour PME';
  const place = location.trim() || 'France';
  return [
    { id: 1, question: `Quelles sont les meilleures solutions de ${subject} pour une petite entreprise en ${place} ?` },
    { id: 2, question: `Quel outil recommanderiez-vous pour centraliser les réseaux sociaux, les avis et les messages d'une PME en ${place} ?` },
    { id: 3, question: `Quelles alternatives françaises aux outils internationaux existent pour ${subject} ?` },
    { id: 4, question: `Quel est le logiciel le plus simple à prendre en main pour une TPE qui veut améliorer sa visibilité locale ?` },
    { id: 5, question: `Quels outils offrent le meilleur rapport qualité-prix pour gérer la communication d'un commerce local ?` },
    { id: 6, question: `Comment choisir une plateforme de publication et de suivi des avis pour une entreprise située en ${place} ?` },
    { id: 7, question: `Quels logiciels permettent de gagner du temps sur la gestion quotidienne de sa présence digitale ?` },
    { id: 8, question: `Quelle solution convient à une agence qui gère plusieurs présences en ligne pour ses clients ?` },
    { id: 9, question: `Quels outils proposent des recommandations basées sur l'intelligence artificielle pour une PME ?` },
    { id: 10, question: `Quelles solutions sont adaptées à une entreprise française qui cherche un accompagnement et un support en français ?` },
  ];
}

function extractUrls(value: string) {
  return [...value.matchAll(/https?:\/\/[^\s)\]}>"']+/gi)].map(match => match[0].replace(/[.,;]+$/, '')).filter(url => {
    try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
  });
}

function parseBrands(answer: string, ownBrand: string) {
  const line = answer.match(/(?:BRANDS|MARQUES)\s*:\s*([^\n]+)/i)?.[1] ?? '';
  const brands = line.split(/[,;|]/).map(value => value.replace(/^[-*\s]+/, '').trim()).filter(value => value && !/^(none|aucune|n\/a|non disponible)$/i.test(value));
  return [...new Set(brands.filter(value => value.toLocaleLowerCase() !== ownBrand.toLocaleLowerCase()))].slice(0, 12);
}

function parseSources(answer: string, supplied: string[] = []) {
  const line = answer.match(/(?:SOURCES|SOURCES WEB)\s*:\s*([^\n]+)/i)?.[1] ?? '';
  return [...new Set([...supplied, ...extractUrls(line)])].slice(0, 12);
}

function prompt(question: string) {
  return `Réponds à cette question comme un moteur conversationnel utilisé par un prospect en phase de décision : « ${question} »\n\nDonne une réponse factuelle et utile, sans inventer de marques, chiffres ou liens. Termine exactement par deux lignes :\nMARQUES: marque 1, marque 2\nSOURCES: URL1, URL2\nSi tu ne peux pas vérifier une source web, écris SOURCES: aucune. Ne cite pas le nom de la marque auditée car il ne t'est pas fourni.`;
}

async function callOpenAI(question: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { ...jsonHeaders, Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'gpt-4.1-mini', messages: [{ role: 'user', content: prompt(question) }], max_tokens: 700, temperature: 0.2 }), signal: timeout(18000) });
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { answer: data.choices?.[0]?.message?.content ?? '', sources: [] as string[] };
}

async function callGemini(question: string, apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ contents: [{ parts: [{ text: prompt(question) }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.2 } }), signal: timeout(18000) });
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return { answer: data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('') ?? '', sources: [] as string[] };
}

async function callPerplexity(question: string, apiKey: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', { method: 'POST', headers: { ...jsonHeaders, Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt(question) }], max_tokens: 700, temperature: 0.2 }), signal: timeout(18000) });
  if (!response.ok) throw new Error(`Perplexity ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] };
  return { answer: data.choices?.[0]?.message?.content ?? '', sources: data.citations ?? [] };
}

async function callClaude(question: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { ...jsonHeaders, 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 700, temperature: 0.2, messages: [{ role: 'user', content: prompt(question) }] }), signal: timeout(18000) });
  if (!response.ok) throw new Error(`Claude ${response.status}`);
  const data = await response.json() as { content?: Array<{ text?: string }> };
  return { answer: data.content?.map(part => part.text ?? '').join('') ?? '', sources: [] as string[] };
}

export async function runGeoAudit(input: { brandName: string; sector: string; location: string; siteUrl?: string; keys: Partial<Record<GeoEngine, string>>; serpApiKey?: string }) {
  const questions = buildGeoQuestions(input.sector, input.location);
  const calls: Record<GeoEngine, (question: string, key: string) => Promise<{ answer: string; sources: string[] }>> = { openai: callOpenAI, gemini: callGemini, perplexity: callPerplexity, claude: callClaude };
  const engines = (Object.keys(calls) as GeoEngine[]).filter(engine => Boolean(input.keys[engine]));
  const jobs = questions.flatMap(question => engines.map(engine => ({ question, engine })));
  const settled = await Promise.allSettled(jobs.map(async ({ question, engine }) => {
    try {
      const result = await calls[engine](question.question, input.keys[engine]!);
      let sources = parseSources(result.answer, result.sources);
      if (input.serpApiKey && sources.length === 0) {
        const serp = await fetchLiveSerp(question.question, input.serpApiKey).catch(() => [] as LiveSerpResult[]);
        sources = serp.slice(0, 5).map(item => item.url);
      }
      return { questionId: question.id, question: question.question, engine, answer: result.answer.slice(0, 7000), brands: parseBrands(result.answer, input.brandName), sources, brandMentioned: result.answer.toLocaleLowerCase().includes(input.brandName.toLocaleLowerCase()) } satisfies GeoResponse;
    } catch (error) {
      return { questionId: question.id, question: question.question, engine, answer: '', brands: [], sources: [], brandMentioned: false, error: error instanceof Error ? error.message : 'Moteur indisponible' } satisfies GeoResponse;
    }
  }));
  const responses: GeoResponse[] = settled.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);

  const citedQuestions = questions.filter(question => responses.some(response => response.questionId === question.id && response.brandMentioned)).length;
  const competitorCounts = new Map<string, number>();
  responses.flatMap(response => response.brands).forEach(brand => competitorCounts.set(brand, (competitorCounts.get(brand) ?? 0) + 1));
  const sourceCounts = new Map<string, number>();
  responses.flatMap(response => response.sources).forEach(url => sourceCounts.set(url, (sourceCounts.get(url) ?? 0) + 1));
  const sourceProfiles: GeoSource[] = [];
  for (const [url, citations] of [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    try { sourceProfiles.push({ url, citations, profile: await fetchPageProfile(url) }); } catch (error) { sourceProfiles.push({ url, citations, error: error instanceof Error ? error.message : 'Page inaccessible' }); }
  }

  let brandProfile: PageProfile | undefined;
  if (input.siteUrl) brandProfile = await fetchPageProfile(input.siteUrl).catch(() => undefined);
  const usableProfiles = sourceProfiles.flatMap(source => source.profile ? [source.profile] : []);
  const gaps: string[] = [];
  if (brandProfile && usableProfiles.length) {
    const averageWords = Math.round(usableProfiles.reduce((sum, profile) => sum + profile.wordCount, 0) / usableProfiles.length);
    const dominantFormat = usableProfiles.sort((a, b) => usableProfiles.filter(item => item.format === b.format).length - usableProfiles.filter(item => item.format === a.format).length)[0].format;
    if (averageWords > brandProfile.wordCount + 250) gaps.push(`Profondeur : les sources citées font en moyenne ${averageWords} mots contre ${brandProfile.wordCount} pour votre page.`);
    if (dominantFormat !== brandProfile.format) gaps.push(`Format : les sources citées privilégient le format « ${dominantFormat} », votre page est détectée comme « ${brandProfile.format} ».`);
    if (!brandProfile.hasFaq && usableProfiles.filter(profile => profile.hasFaq).length >= 2) gaps.push('Structure : une FAQ est présente sur au moins deux sources citées mais absente de votre page.');
    if (!brandProfile.hasNumericData && usableProfiles.filter(profile => profile.hasNumericData).length >= 2) gaps.push('Preuves : les sources citées comportent des données chiffrées que votre page ne rend pas visibles.');
    const missingHeadings = [...new Set(usableProfiles.flatMap(profile => profile.headings))].filter(heading => !brandProfile!.headings.some(own => own.toLocaleLowerCase() === heading.toLocaleLowerCase())).slice(0, 5);
    if (missingHeadings.length) gaps.push(`Sous-sujets absents : ${missingHeadings.join(' · ')}`);
  }
  const prioritizedPages = questions.slice(0, 5).map((question, index) => ({ priority: index + 1, title: `Répondre à « ${question.question} »`, type: usableProfiles[index]?.format ?? 'guide', reason: usableProfiles[index] ? `Inspiré du format de la source la plus citée (${usableProfiles[index].wordCount} mots).` : 'Sujet prioritaire détecté dans le protocole de découverte.' })).filter((page, index) => Boolean(usableProfiles[index]));
  return { brandName: input.brandName, sector: input.sector, location: input.location, siteUrl: input.siteUrl ?? '', questions, engines, responses, citation: { citedQuestions, totalQuestions: questions.length, rate: Math.round((citedQuestions / questions.length) * 100) }, competitors: [...competitorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([brand, citations]) => ({ brand, citations })), topSources: sourceProfiles, brandProfile, contentGaps: gaps, prioritizedPages, methodology: { sourceResearch: input.serpApiKey ? 'SERP live associée aux questions ; sources Perplexity conservées.' : 'Aucun fournisseur SERP configuré ; seules les URLs explicitement retournées par les moteurs sont conservées.', citationDenominator: '10 questions uniques ; une question est comptée comme citée si au moins un moteur mentionne la marque.', sourcePolicy: 'Les moteurs sans citations natives ne sont pas présentés comme ayant sourcé une URL.' } };
}
