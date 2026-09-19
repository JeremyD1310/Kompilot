export type AuditCategory = 'technical' | 'content' | 'local' | 'trust' | 'geo';
export type AuditPriority = 'P0' | 'P1' | 'P2';

export type WebsiteAuditFinding = {
  id: string;
  category: AuditCategory;
  priority: AuditPriority;
  pageUrl: string;
  title: string;
  evidence: string;
  impact: string;
  recommendation: string;
  effort: 'faible' | 'moyen' | 'élevé';
  status: 'todo';
};

export type WebsiteAuditPage = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  h1: string[];
  headings: string[];
  wordCount: number;
  internalLinks: string[];
  images: number;
  imagesWithoutAlt: number;
  schemaTypes: string[];
  hasContactDetails: boolean;
  hasSocialLinks: boolean;
  hasAuthor: boolean;
  hasPublishedDate: boolean;
};

export type WebsiteVisibilityAudit = {
  auditId: string;
  requestedUrl: string;
  canonicalOrigin: string;
  observedAt: string;
  pages: WebsiteAuditPage[];
  scores: Record<AuditCategory | 'overall', number>;
  findings: WebsiteAuditFinding[];
  limitations: string[];
  methodology: {
    maxPages: number;
    maxDepth: number;
    maxResponseBytes: number;
    robotsPolicy: string;
    scoringPolicy: string;
  };
};

const MAX_PAGES = 8;
const MAX_DEPTH = 1;
const MAX_BYTES = 750_000;
const TIMEOUT_MS = 10_000;
const USER_AGENT = 'Kompilot-Visibility-Audit/1.0 (+https://www.kompilot.fr)';

const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^192\.0\.0\./,
  /^192\.0\.2\./,
  /^192\.168\./,
  /^198\.(?:1[89])\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^(?:22[4-9]|23\d)\./,
  /^(?:24\d|25[0-5])\./,
];

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host.includes(':')) return host === '::' || host === '::1' || host.startsWith('fc') || host.startsWith('fd') || /^fe[89ab]/.test(host) || host.includes('::ffff:127.') || host.includes('::ffff:10.') || host.includes('::ffff:192.168.');
  return PRIVATE_IPV4.some(pattern => pattern.test(host));
}

function isIpLiteral(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');
}

async function assertPublicResolution(hostname: string) {
  if (isIpLiteral(hostname)) {
    if (isPrivateHostname(hostname)) throw new Error('DNS_PRIVATE_NETWORK_NOT_ALLOWED');
    return;
  }
  const answers: string[] = [];
  for (const type of ['A', 'AAAA']) {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`, {
      signal: AbortSignal.timeout(3500), headers: { Accept: 'application/dns-json' },
    });
    if (!response.ok) continue;
    const data = await response.json() as { Answer?: Array<{ data?: string }> };
    answers.push(...(data.Answer ?? []).map(answer => answer.data ?? '').filter(Boolean));
  }
  const resolvedAddresses = answers.filter(isIpLiteral);
  if (!resolvedAddresses.length) throw new Error('DNS_RESOLUTION_FAILED');
  if (resolvedAddresses.some(address => isPrivateHostname(address))) throw new Error('DNS_PRIVATE_NETWORK_NOT_ALLOWED');
}

export function validatePublicWebsiteUrl(value: string): URL {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('URL_INVALID'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL_PROTOCOL_NOT_ALLOWED');
  if (parsed.username || parsed.password) throw new Error('URL_CREDENTIALS_NOT_ALLOWED');
  if (parsed.port && !['80', '443'].includes(parsed.port)) throw new Error('URL_PORT_NOT_ALLOWED');
  // IPv6 URL literals are denied rather than partially classified: fetch
  // cannot be pinned to the validated address in this runtime.
  if (parsed.hostname.includes(':') || isPrivateHostname(parsed.hostname)) throw new Error('URL_PRIVATE_NETWORK_NOT_ALLOWED');
  parsed.hash = '';
  return parsed;
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]?.trim() ?? '';
}

function metaContent(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.map(tag => ({ name: attribute(tag, 'name').toLowerCase(), property: attribute(tag, 'property').toLowerCase(), content: attribute(tag, 'content') }))
    .find(item => item.name === name.toLowerCase() || item.property === name.toLowerCase())?.content ?? '';
}

function extractSchemaTypes(html: string) {
  const types = new Set<string>();
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visit = (value: unknown) => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) return value.forEach(visit);
        const record = value as Record<string, unknown>;
        const raw = record['@type'];
        (Array.isArray(raw) ? raw : [raw]).filter(item => typeof item === 'string').forEach(item => types.add(String(item)));
        Object.values(record).forEach(visit);
      };
      visit(JSON.parse(match[1]));
    } catch { /* Invalid JSON-LD is reported separately by absence of a usable type. */ }
  }
  return [...types].slice(0, 20);
}

function parsePage(url: string, status: number, html: string): WebsiteAuditPage {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(match => ({ level: Number(match[1]), text: cleanText(match[2]) })).filter(item => item.text);
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi)].map(match => match[1]);
  const origin = new URL(url).origin;
  const internalLinks = [...new Set(links.flatMap(link => {
    try {
      const parsed = new URL(link, url);
      parsed.hash = '';
      return parsed.origin === origin && ['http:', 'https:'].includes(parsed.protocol) ? [parsed.toString()] : [];
    } catch { return []; }
  }))].slice(0, 50);
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  const text = cleanText(html);
  const canonicalTag = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[0] ?? '';
  return {
    url,
    status,
    title: cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: metaContent(html, 'description'),
    canonical: attribute(canonicalTag, 'href'),
    h1: headings.filter(item => item.level === 1).map(item => item.text).slice(0, 5),
    headings: headings.map(item => `H${item.level}: ${item.text}`).slice(0, 50),
    wordCount: text ? text.split(/\s+/).length : 0,
    internalLinks,
    images: images.length,
    imagesWithoutAlt: images.filter(tag => !attribute(tag, 'alt')).length,
    schemaTypes: extractSchemaTypes(html),
    hasContactDetails: /(?:mailto:|tel:|\b0[1-9](?:[ .-]?\d{2}){4}\b|adresse|horaires)/i.test(html),
    hasSocialLinks: /(?:linkedin\.com|instagram\.com|facebook\.com|tiktok\.com|youtube\.com)/i.test(html),
    hasAuthor: /(?:rel=["']author|class=["'][^"']*author|"author"\s*:)/i.test(html),
    hasPublishedDate: /(?:datePublished|article:published_time|<time\b)/i.test(html),
  };
}

function robotsAllows(content: string, pathname: string) {
  let applies = false;
  const disallowed: string[] = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const [rawKey, ...parts] = line.split(':');
    const key = rawKey?.trim().toLowerCase();
    const value = parts.join(':').trim();
    if (key === 'user-agent') applies = value === '*' || value.toLowerCase().includes('kompilot');
    if (applies && key === 'disallow' && value) disallowed.push(value);
  }
  return !disallowed.some(path => pathname.startsWith(path));
}

async function safeFetchHtml(input: URL, expectedOrigin: string) {
  let current = validatePublicWebsiteUrl(input.toString());
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (current.origin !== expectedOrigin) throw new Error('CROSS_ORIGIN_REDIRECT_NOT_ALLOWED');
    await assertPublicResolution(current.hostname);
    const response = await fetch(current.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': USER_AGENT },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('REDIRECT_WITHOUT_LOCATION');
      current = validatePublicWebsiteUrl(new URL(location, current).toString());
      continue;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('text/html')) throw new Error('CONTENT_TYPE_NOT_HTML');
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_BYTES) throw new Error('PAGE_TOO_LARGE');
    const html = (await response.text()).slice(0, MAX_BYTES);
    return { response, url: current.toString(), html };
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

function finding(input: Omit<WebsiteAuditFinding, 'id' | 'status'>): WebsiteAuditFinding {
  const key = `${input.category}:${input.pageUrl}:${input.title}`;
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return { ...input, id: `finding-${(hash >>> 0).toString(16)}`, status: 'todo' };
}

function buildFindings(pages: WebsiteAuditPage[]): WebsiteAuditFinding[] {
  const findings: WebsiteAuditFinding[] = [];
  for (const page of pages) {
    const add = (value: Omit<WebsiteAuditFinding, 'id' | 'status' | 'pageUrl'>) => findings.push(finding({ ...value, pageUrl: page.url }));
    if (page.status >= 400) add({ category: 'technical', priority: 'P0', title: `Page en erreur HTTP ${page.status}`, evidence: `${page.url} répond avec le statut ${page.status}.`, impact: 'La page ne peut pas être correctement consultée ou indexée.', recommendation: 'Rétablir la page ou mettre en place une redirection pertinente.', effort: 'moyen' });
    if (!page.title) add({ category: 'technical', priority: 'P0', title: 'Balise title absente', evidence: 'Aucune balise <title> exploitable détectée.', impact: 'Les moteurs disposent de moins de contexte pour comprendre la page.', recommendation: 'Ajouter un title unique, descriptif et cohérent avec la page.', effort: 'faible' });
    if (!page.description) add({ category: 'content', priority: 'P1', title: 'Meta description absente', evidence: 'Aucune meta description détectée.', impact: 'L’extrait présenté dans les résultats est moins maîtrisé.', recommendation: 'Rédiger une description unique résumant l’offre et l’intention de la page.', effort: 'faible' });
    if (page.h1.length !== 1) add({ category: 'content', priority: page.h1.length ? 'P1' : 'P0', title: page.h1.length ? 'Plusieurs H1 détectés' : 'H1 absent', evidence: `${page.h1.length} titre H1 détecté(s).`, impact: 'La hiérarchie et le sujet principal sont moins explicites.', recommendation: 'Conserver un H1 principal clair et descriptif.', effort: 'faible' });
    if (!page.canonical) add({ category: 'technical', priority: 'P1', title: 'Canonical absente', evidence: 'Aucun lien canonical détecté dans le HTML.', impact: 'Les variantes d’URL peuvent être plus difficiles à consolider.', recommendation: 'Ajouter une canonical absolue correspondant à l’URL publique de référence.', effort: 'faible' });
    if (page.wordCount < 250) add({ category: 'content', priority: 'P1', title: 'Contenu éditorial limité', evidence: `${page.wordCount} mots observés dans le HTML analysé.`, impact: 'Les services, preuves et réponses utiles peuvent manquer de contexte.', recommendation: 'Enrichir la page avec des informations utiles, spécifiques et vérifiables.', effort: 'moyen' });
    if (page.imagesWithoutAlt > 0) add({ category: 'technical', priority: 'P2', title: 'Images sans alternative textuelle', evidence: `${page.imagesWithoutAlt} image(s) sur ${page.images} sans attribut alt exploitable.`, impact: 'Accessibilité et compréhension des images réduites.', recommendation: 'Ajouter un texte alternatif descriptif aux images informatives.', effort: 'faible' });
    if (!page.schemaTypes.length) add({ category: 'geo', priority: 'P1', title: 'Données structurées non détectées', evidence: 'Aucun type JSON-LD valide détecté.', impact: 'L’entité, les services et les contenus sont moins explicitement décrits aux moteurs.', recommendation: 'Ajouter des données structurées adaptées et fidèles au contenu visible.', effort: 'moyen' });
  }
  const homepage = pages[0];
  if (homepage && !homepage.hasContactDetails) findings.push(finding({ category: 'local', priority: 'P1', pageUrl: homepage.url, title: 'Informations locales peu visibles', evidence: 'Aucun téléphone, horaire, adresse ou lien de contact identifiable sur la page analysée.', impact: 'Les moteurs et visiteurs disposent de moins de signaux sur l’activité locale.', recommendation: 'Rendre visibles les coordonnées professionnelles et zones desservies appropriées.', effort: 'faible' }));
  if (homepage && !homepage.hasSocialLinks) findings.push(finding({ category: 'trust', priority: 'P2', pageUrl: homepage.url, title: 'Profils sociaux non reliés', evidence: 'Aucun lien vers un profil social majeur détecté.', impact: 'Le graphe public de l’entité et ses preuves externes sont moins faciles à relier.', recommendation: 'Relier uniquement les profils officiels et maintenus.', effort: 'faible' }));
  if (homepage && !homepage.hasAuthor && !homepage.hasPublishedDate) findings.push(finding({ category: 'trust', priority: 'P2', pageUrl: homepage.url, title: 'Responsabilité éditoriale peu explicite', evidence: 'Auteur et date de publication non détectés.', impact: 'La provenance et l’actualité des contenus sont moins vérifiables.', recommendation: 'Identifier les auteurs et dater les contenus éditoriaux lorsque pertinent.', effort: 'moyen' }));
  return findings.sort((a, b) => ['P0', 'P1', 'P2'].indexOf(a.priority) - ['P0', 'P1', 'P2'].indexOf(b.priority));
}

function calculateScores(findings: WebsiteAuditFinding[]) {
  const penalties: Record<AuditPriority, number> = { P0: 25, P1: 12, P2: 5 };
  const categories: AuditCategory[] = ['technical', 'content', 'local', 'trust', 'geo'];
  const scores = Object.fromEntries(categories.map(category => [category, Math.max(0, 100 - findings.filter(item => item.category === category).reduce((sum, item) => sum + penalties[item.priority], 0))])) as Record<AuditCategory, number>;
  return { ...scores, overall: Math.round(categories.reduce((sum, category) => sum + scores[category], 0) / categories.length) };
}

export async function runWebsiteVisibilityAudit(rawUrl: string): Promise<WebsiteVisibilityAudit> {
  const start = validatePublicWebsiteUrl(rawUrl);
  const origin = start.origin;
  const robotsUrl = new URL('/robots.txt', origin);
  let robots = '';
  try {
    await assertPublicResolution(robotsUrl.hostname);
    const response = await fetch(robotsUrl, { redirect: 'manual', signal: AbortSignal.timeout(5000), headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) robots = (await response.text()).slice(0, 100_000);
  } catch { /* Absence de robots exploitable : l'audit reste limité et non destructif. */ }

  const queue: Array<{ url: URL; depth: number }> = [{ url: start, depth: 0 }];
  const seen = new Set<string>();
  const pages: WebsiteAuditPage[] = [];
  const limitations: string[] = [];
  while (queue.length && pages.length < MAX_PAGES) {
    const item = queue.shift()!;
    const normalized = item.url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (robots && !robotsAllows(robots, item.url.pathname)) {
      limitations.push(`${item.url.pathname} exclue par robots.txt.`);
      continue;
    }
    try {
      const fetched = await safeFetchHtml(item.url, origin);
      const page = parsePage(fetched.url, fetched.response.status, fetched.html);
      pages.push(page);
      if (item.depth < MAX_DEPTH) {
        for (const link of page.internalLinks) {
          if (queue.length + pages.length >= MAX_PAGES * 3) break;
          const parsed = validatePublicWebsiteUrl(link);
          if (parsed.origin === origin && !/\.(?:pdf|jpe?g|png|gif|svg|webp|zip)$/i.test(parsed.pathname)) queue.push({ url: parsed, depth: item.depth + 1 });
        }
      }
    } catch (error) {
      limitations.push(`${item.url.pathname}: ${error instanceof Error ? error.message : 'PAGE_UNAVAILABLE'}`);
    }
  }
  if (!pages.length) throw new Error('WEBSITE_UNAVAILABLE_OR_BLOCKED');
  const findings = buildFindings(pages);
  return {
    auditId: crypto.randomUUID(), requestedUrl: start.toString(), canonicalOrigin: origin, observedAt: new Date().toISOString(), pages,
    scores: calculateScores(findings), findings, limitations,
    methodology: { maxPages: MAX_PAGES, maxDepth: MAX_DEPTH, maxResponseBytes: MAX_BYTES, robotsPolicy: 'robots.txt respecté lorsqu’il est disponible ; aucune authentification ni formulaire.', scoringPolicy: 'Scores déterministes fondés uniquement sur les constats observés. Aucun classement Google ni citation IA n’est estimé.' },
  };
}
