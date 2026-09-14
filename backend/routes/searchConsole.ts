import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeCode, refreshAccessToken, listSites, query, fetchAllRows, metricFromRows, mergePageRows, period, subtractDays, addDays, sameCalendarPeriodLastYear, normalizeDomain } from '../lib/searchConsoleService';
import { buildOrganicDeclineReport } from '../lib/organicDeclineAnalysis';

export const router = new Hono();
const provider = 'google_search_console';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GSC_DEFAULT_END_LAG_DAYS = 3;
async function user(c: any) { const a = await createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization')); return a.valid ? a.userId : null; }
function store(c: any) { const b = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY }); return { b, s: createSecureTokenStore(b, c.env.TOKEN_ENCRYPTION_KEY) }; }
function config(c: any) { return c.env.GOOGLE_BUSINESS_CLIENT_ID && c.env.GOOGLE_BUSINESS_CLIENT_SECRET; }
function searchConsoleConfig(c: any) { return config(c) && c.env.TOKEN_ENCRYPTION_KEY; }
function redirect(c: any) { return c.env.SEARCH_CONSOLE_REDIRECT_URI || `${c.env.BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/search-console/oauth/callback`; }

router.get('/api/search-console/oauth/connect', async c => {
  const uid = await user(c); if (!uid) return c.json({ error: 'Unauthorized' }, 401); if (!searchConsoleConfig(c)) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);
  const state = await createOAuthState(uid, c.env.GOOGLE_BUSINESS_CLIENT_SECRET); const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', c.env.GOOGLE_BUSINESS_CLIENT_ID); u.searchParams.set('redirect_uri', redirect(c)); u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly openid email profile'); u.searchParams.set('access_type', 'offline'); u.searchParams.set('prompt', 'consent'); u.searchParams.set('state', state);
  return c.json({ url: u.toString() });
});
router.get('/api/search-console/oauth/callback', async c => {
  const code = c.req.query('code'), state = c.req.query('state'); if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);
  try { const uid = await readOAuthState(state, c.env.GOOGLE_BUSINESS_CLIENT_SECRET); const t = await exchangeCode(code, c.env.GOOGLE_BUSINESS_CLIENT_ID, c.env.GOOGLE_BUSINESS_CLIENT_SECRET, redirect(c));
    await createSecureTokenStore(createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY }), c.env.TOKEN_ENCRYPTION_KEY).save({ userId: uid, provider, accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(), scopes: [GSC_SCOPE] });
    return c.redirect(`${c.env.APP_URL || 'https://kompilot.fr'}/organic-audit?gsc_connected=true`);
  } catch (e) { return c.json({ error: 'GSC_UPSTREAM_ERROR', details: e instanceof Error ? e.message : 'OAuth failed' }, 502); }
});
router.get('/api/search-console/oauth/status', async c => { const uid = await user(c); if (!uid) return c.json({ error: 'Unauthorized' }, 401); if (!searchConsoleConfig(c)) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503); try { const { s } = store(c); const t = await s.getByUser(uid, provider); if (!t) return c.json({ connected: false, sites: [] }); return c.json({ connected: true, expiresAt: t.expiresAt, sites: await listSites(await s.decryptAccessToken(t.accessToken)) }); } catch { return c.json({ connected: false, sites: [] }); } });
router.post('/api/search-console/oauth/disconnect', async c => { const uid = await user(c); if (!uid) return c.json({ error: 'Unauthorized' }, 401); const { s } = store(c); await s.revoke(uid, provider); return c.json({ success: true }); });

router.get('/api/search-console/audit', async c => {
  const uid = await user(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  if (!searchConsoleConfig(c)) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);
  const { s } = store(c);
  const tokenRow = await s.getByUser(uid, provider);
  if (!tokenRow) return c.json({ error: 'GSC_NOT_CONNECTED' }, 503);
  const siteUrl = c.req.query('siteUrl') || c.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);

  const rawEnd = c.req.query('endDate');
  const end = rawEnd ? new Date(`${rawEnd}T00:00:00Z`) : subtractDays(new Date(), 3);
  if (isNaN(end.getTime())) return c.json({ error: 'Invalid endDate' }, 400);

  try {
    let token = await s.decryptAccessToken(tokenRow.accessToken);
    const refreshToken = tokenRow.refreshToken ? await s.decryptRefreshToken(tokenRow.refreshToken) : '';
    if (new Date(tokenRow.expiresAt).getTime() < Date.now() + 60000 && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken, c.env.GOOGLE_BUSINESS_CLIENT_ID, c.env.GOOGLE_BUSINESS_CLIENT_SECRET);
      token = refreshed.access_token;
      await s.save({ userId: uid, provider, accessToken: token, refreshToken, expiresAt: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(), scopes: [GSC_SCOPE] });
    }

    // Three non-overlapping 90-day windows, plus the matching windows one year earlier.
    const m0m3 = period(end, 90);
    const m3m6 = period(addDays(end, -90), 90);
    const m6m9 = period(addDays(end, -180), 90);
    const lastYearEnd = sameCalendarPeriodLastYear(end);
    const y0y3 = period(lastYearEnd, 90);
    const y3y6 = period(addDays(lastYearEnd, -90), 90);
    const y6y9 = period(addDays(lastYearEnd, -180), 90);
    const [recentRows, middleRows, oldestRows, yearRecentRows, yearMiddleRows, yearOldestRows, queryPageRows] = await Promise.all([
      fetchAllRows(token, siteUrl, m0m3.startDate, m0m3.endDate, ['page']),
      fetchAllRows(token, siteUrl, m3m6.startDate, m3m6.endDate, ['page']),
      fetchAllRows(token, siteUrl, m6m9.startDate, m6m9.endDate, ['page']),
      fetchAllRows(token, siteUrl, y0y3.startDate, y0y3.endDate, ['page']),
      fetchAllRows(token, siteUrl, y3y6.startDate, y3y6.endDate, ['page']),
      fetchAllRows(token, siteUrl, y6y9.startDate, y6y9.endDate, ['page']),
      fetchAllRows(token, siteUrl, m0m3.startDate, m0m3.endDate, ['query', 'page']),
    ]);
    const recent = mergePageRows(recentRows.rows);
    const middle = mergePageRows(middleRows.rows);
    const oldest = mergePageRows(oldestRows.rows);
    const yearRecent = mergePageRows(yearRecentRows.rows);
    const yearMiddle = mergePageRows(yearMiddleRows.rows);
    const yearOldest = mergePageRows(yearOldestRows.rows);
    const pages = new Set([...recent.keys(), ...middle.keys(), ...oldest.keys()]);
    const ownDomain = normalizeDomain(siteUrl);
    const serpCache = new Map<string, LiveSerpResult[]>();
    const candidateRows: Array<{ url: string; a: ReturnType<typeof metricFromRows>; b: ReturnType<typeof metricFromRows>; d: ReturnType<typeof metricFromRows>; firstChange: number; secondChange: number; atRisk: number }> = [];
    let seasonalPagesRemoved = 0;

    for (const url of pages) {
      const a = recent.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const b = middle.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const d = oldest.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      // Strictly descending clicks across both transitions. Zero-volume rows are not treated as a signal.
      if (!(d.clicks > b.clicks && b.clicks > a.clicks && d.clicks > 0)) continue;
      const firstChange = declineRate(a.clicks, b.clicks);
      const secondChange = declineRate(b.clicks, d.clicks);
      const priorRecent = yearRecent.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const priorMiddle = yearMiddle.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const priorOldest = yearOldest.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const priorFirstChange = declineRate(priorRecent.clicks, priorMiddle.clicks);
      const priorSecondChange = declineRate(priorMiddle.clicks, priorOldest.clicks);
      if (Math.abs(firstChange - priorFirstChange) <= 0.05 && Math.abs(secondChange - priorSecondChange) <= 0.05) {
        seasonalPagesRemoved++;
        continue;
      }
      candidateRows.push({ url, a, b, d, firstChange, secondChange, atRisk: Math.max(0, Math.round((b.clicks - a.clicks) / 3)) });
    }
    candidateRows.sort((left, right) => right.atRisk - left.atRisk);

    type Action = { priority: 1 | 2 | 3; title: string; details: string };
    type Competitor = { url: string; title: string; position: number; format: PageProfile['format']; wordCount: number; latestYear: number | null; headings: string[] };
    type Decline = { url: string; monthlyClicksAtRisk: number; trajectory: { m0m3: ReturnType<typeof metricFromRows>; m3m6: ReturnType<typeof metricFromRows>; m6m9: ReturnType<typeof metricFromRows> }; changes: { m3m6ToM0m3: number; m6m9ToM3m6: number }; seasonality: { classified: boolean; reason: string; matchingPriorYearChange: number }; diagnosis: { query: string; summary: string; gaps: string[]; pageProfile: PageProfile; competitors: Competitor[] }; actions: Action[] };
    const decliningPages: Decline[] = [];
    let candidatesWithoutEvidence = 0;
    const pageLimit = 40;
    const consideredCandidates = candidateRows.slice(0, pageLimit);

    for (const candidate of consideredCandidates) {
      const pageProfile = await fetchPageProfile(candidate.url).catch(() => null);
      if (!pageProfile) { candidatesWithoutEvidence++; continue; }
      const queryRows = queryPageRows.rows.filter(row => row.keys?.[1] === candidate.url).sort((left, right) => (Number(right.clicks) || 0) - (Number(left.clicks) || 0));
      const queryCandidates = queryRows.map(row => ({ text: row.keys?.[0] || '', position: Number(row.position) || 100 })).filter(row => row.text).slice(0, 5);
      const competitorResults: Array<LiveSerpResult & { query: string }> = [];
      for (const queryCandidate of queryCandidates) {
        let serp = serpCache.get(queryCandidate.text);
        if (!serp) {
          serp = await fetchLiveSerp(queryCandidate.text, c.env.SERP_API_KEY).catch(() => []);
          serpCache.set(queryCandidate.text, serp);
        }
        for (const result of serp) {
          if (normalizeDomain(result.domain) === ownDomain || result.url === candidate.url || result.position >= queryCandidate.position) continue;
          if (!competitorResults.some(item => item.url === result.url)) competitorResults.push({ ...result, query: queryCandidate.text });
        }
      }
      const topCompetitors = competitorResults.slice(0, 3);
      if (topCompetitors.length < 3) { candidatesWithoutEvidence++; continue; }
      const competitors: Competitor[] = [];
      for (const result of topCompetitors) {
        const profile = await fetchPageProfile(result.url).catch(() => null);
        if (profile) competitors.push({ url: result.url, title: result.title, position: result.position, format: profile.format, wordCount: profile.wordCount, latestYear: profile.latestYear, headings: profile.headings.slice(0, 12) });
      }
      if (competitors.length < 3) { candidatesWithoutEvidence++; continue; }
      const ownHeadings = new Set(pageProfile.headings.map(heading => heading.toLocaleLowerCase('fr-FR')));
      const competitorHeadingGaps = [...new Set(competitors.flatMap(competitor => competitor.headings).filter(heading => !ownHeadings.has(heading.toLocaleLowerCase('fr-FR'))))].slice(0, 4);
      const avgWordCount = competitors.reduce((sum, competitor) => sum + competitor.wordCount, 0) / competitors.length;
      const gaps = [...competitorHeadingGaps];
      if (competitors.filter(competitor => competitor.format !== pageProfile.format).length >= 2) gaps.push(`Format dominant concurrent : ${competitors[0].format}, contre ${pageProfile.format} pour la page`);
      if (avgWordCount > pageProfile.wordCount + 300) gaps.push(`Profondeur moyenne concurrente : ${Math.round(avgWordCount).toLocaleString('fr-FR')} mots contre ${pageProfile.wordCount.toLocaleString('fr-FR')}`);
      if (competitors.filter(competitor => competitor.latestYear && (!pageProfile.latestYear || competitor.latestYear > pageProfile.latestYear)).length >= 2) gaps.push('Données plus fraîches détectées chez au moins deux concurrents');
      if (!pageProfile.hasFaq && competitors.filter(competitor => competitor.headings.some(heading => /faq|question/i.test(heading))).length >= 2) gaps.push('FAQ ou questions fréquentes présentes chez au moins deux concurrents');
      if (!pageProfile.hasNumericData && competitors.filter(competitor => competitor.wordCount > 0).length >= 2) gaps.push('Preuves et données chiffrées à renforcer sur la page');
      const primaryQuery = queryCandidates[0]?.text || 'requête principale non disponible';
      const primaryGap = gaps[0] || 'Sous-intention éditoriale visible dans les titres concurrents mais absente de la page';
      const diagnosisSummary = `Sur « ${primaryQuery} », les 3 résultats concurrents observés avant la page couvrent ${primaryGap.toLocaleLowerCase('fr-FR')}. La comparaison porte sur le contenu HTML réellement récupéré, le format, la profondeur et la fraîcheur.`;
      decliningPages.push({
        url: candidate.url,
        monthlyClicksAtRisk: candidate.atRisk,
        trajectory: { m0m3: candidate.a, m3m6: candidate.b, m6m9: candidate.d },
        changes: { m3m6ToM0m3: candidate.firstChange, m6m9ToM3m6: candidate.secondChange },
        seasonality: { classified: false, reason: 'La trajectoire actuelle ne reproduit pas suffisamment les deux variations observées sur les fenêtres correspondantes de l’année précédente.', matchingPriorYearChange: priorFirstChange },
        diagnosis: { query: primaryQuery, summary: diagnosisSummary, gaps: gaps.slice(0, 6), pageProfile, competitors },
        actions: [
          { priority: 1, title: `Refondre la section « ${primaryGap.replace(/[.]/g, '')} »`, details: `Ajouter cette section après « ${pageProfile.headings[0] || 'l’introduction'} », avec un exemple concret, une réponse directe à l’intention « ${primaryQuery} » et un lien vers la preuve ou la source utilisée.` },
          { priority: 2, title: 'Actualiser les preuves et les données', details: `Remplacer les chiffres non datés par des données vérifiables avec leur année ou leur source, ajouter un tableau comparatif de décision et préciser la date de mise à jour visible dans la page.` },
          { priority: 3, title: 'Recomposer le maillage autour de la requête', details: `Depuis 3 pages fortes du même cluster, ajouter un lien contextuel vers cette URL avec des ancres variées autour de « ${primaryQuery} », puis vérifier qu’aucune autre URL ne cible la même intention.` },
        ],
      });
    }
    decliningPages.sort((left, right) => right.monthlyClicksAtRisk - left.monthlyClicksAtRisk);
    const totals = (rows: ReturnType<typeof mergePageRows>) => metricFromRows([...rows.values()].map(value => value as ReturnType<typeof metricFromRows>));
    return c.json({
      siteUrl,
      methodology: { windows: ['M0-M3', 'M3-M6', 'M6-M9'], windowDays: 90, endDate: m0m3.endDate, seasonalComparison: { y0y3, y3y6, y6y9 }, seasonalTolerance: 0.05, serpCompetitorRule: '3 URLs réelles devant la page sur une requête GSC de la page', pageAnalysisLimit: pageLimit, note: 'Une page n’est affichée qu’après récupération de son contenu et de trois URLs concurrentes réelles. Aucune recommandation n’est générée sans ces preuves.' },
      periods: { m0m3, m3m6, m6m9, y0y3, y3y6, y6y9 },
      aggregate: { m0m3: totals(recent), m3m6: totals(middle), m6m9: totals(oldest) },
      decliningPages,
      summary: { pagesChecked: pages.size, candidatesBeforeSerp: candidateRows.length, earlyWarnings: decliningPages.length, monthlyClicksAtRisk: decliningPages.reduce((sum, page) => sum + page.monthlyClicksAtRisk, 0), seasonalPagesRemoved, candidatesWithoutEvidence: candidatesWithoutEvidence + Math.max(0, candidateRows.length - consideredCandidates.length), truncated: recentRows.truncated || middleRows.truncated || oldestRows.truncated || yearRecentRows.truncated || yearMiddleRows.truncated || yearOldestRows.truncated || queryPageRows.truncated },
    });
  } catch (e) { return c.json({ error: 'GSC_UPSTREAM_ERROR', details: e instanceof Error ? e.message : 'Search Console request failed' }, 502); }
});

router.get('/api/search-console/content-gap', async c => {
  const uid = await user(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  if (!config(c) || !c.env.SERP_API_KEY) return c.json({ error: 'SEO_GAP_DATA_NOT_CONFIGURED', details: 'Search Console et SERP data provider requis.' }, 503);
  const { s } = store(c);
  const tokenRow = await s.getByUser(uid, provider);
  if (!tokenRow) return c.json({ error: 'GSC_NOT_CONNECTED' }, 503);

  let body: { siteUrl?: string; competitorUrls?: string[]; country?: string; language?: string } = {};
  try { body = await c.req.json(); } catch { /* empty body handled below */ }
  const siteUrl = body.siteUrl || c.env.SEARCH_CONSOLE_SITE_URL;
  const competitorUrls = [...new Set((body.competitorUrls ?? []).map(value => value.trim()).filter(Boolean))].slice(0, 3);
  if (!siteUrl || competitorUrls.length !== 3) return c.json({ error: 'SEO_GAP_INPUTS_REQUIRED', details: 'URL du site et exactement 3 URLs concurrentes requis.' }, 400);
  const country = body.country || 'France';
  const language = body.language || 'français';

  try {
    let token = await s.decryptAccessToken(tokenRow.accessToken);
    const refreshToken = tokenRow.refreshToken ? await s.decryptRefreshToken(tokenRow.refreshToken) : '';
    if (new Date(tokenRow.expiresAt).getTime() < Date.now() + 60000 && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken, c.env.GOOGLE_BUSINESS_CLIENT_ID, c.env.GOOGLE_BUSINESS_CLIENT_SECRET);
      token = refreshed.access_token;
      await s.save({ userId: uid, provider, accessToken: token, refreshToken, expiresAt: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(), scopes: [GSC_SCOPE] });
    }
    const end = subtractDays(new Date(), 3);
    const current = period(end, 90);
    const sc = await fetchAllRows(token, siteUrl, current.startDate, current.endDate, ['query']);
    const ownImpressions = new Set(sc.rows.map(row => (row.keys?.[0] || '').trim().toLocaleLowerCase('fr-FR')).filter(Boolean));
    const competitorDomains = competitorUrls.map(normalizeDomain);
    const competitorSerps = new Map<string, LiveSerpResult[]>();
    const competitorKeywordCounts = new Map<string, number>();
    const candidateKeywords = new Set<string>();
    for (const competitorUrl of competitorUrls) {
      const profile = await fetchPageProfile(competitorUrl).catch(() => null);
      const seed = [profile?.title, ...(profile?.headings ?? [])].filter(Boolean).flatMap(text => text!.toLocaleLowerCase('fr-FR').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3)).slice(0, 30);
      for (const keyword of seed) {
        const serp = await fetchLiveSerp(keyword, c.env.SERP_API_KEY);
        const inTop10 = serp.some(result => competitorDomains.includes(normalizeDomain(result.domain)) && result.position <= 10);
        if (inTop10) {
          candidateKeywords.add(keyword);
          competitorKeywordCounts.set(keyword, (competitorKeywordCounts.get(keyword) ?? 0) + 1);
          competitorSerps.set(keyword, [...(competitorSerps.get(keyword) ?? []), ...serp]);
        }
      }
    }
    const candidates = [...candidateKeywords].filter(keyword => (competitorKeywordCounts.get(keyword) ?? 0) >= 2 && !ownImpressions.has(keyword));
    const keywordResults: Array<Record<string, unknown>> = [];
    for (const keyword of candidates.slice(0, 60)) {
      const accents = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const variants = [...new Set([keyword, accents])];
      const volumes = await Promise.all(variants.map(variant => fetchLiveSerp(variant, c.env.SERP_API_KEY).catch(() => [])));
      const liveSerp = volumes[0] ?? [];
      if (!liveSerp.length) continue;
      const estimatedVolume = Math.max(0, Math.round(liveSerp.reduce((sum, item) => sum + Math.max(0, 101 - item.position), 0) * 2));
      const authorityDomains = new Set(['wikipedia.org', 'youtube.com', 'amazon.fr', 'leboncoin.fr', 'service-public.fr', 'gouv.fr']);
      const top5 = liveSerp.filter(item => item.position <= 5).slice(0, 5);
      if (estimatedVolume <= 100 || top5.length < 5 || top5.some(item => authorityDomains.has(normalizeDomain(item.domain)) || normalizeDomain(item.domain).endsWith('.gouv.fr'))) continue;
      const serpProfiles: PageProfile[] = [];
      for (const result of top5) {
        const profile = await fetchPageProfile(result.url).catch(() => null);
        if (profile) serpProfiles.push(profile);
      }
      if (serpProfiles.length < 3) continue;
      const difficulty = Math.round(Math.min(99, serpProfiles.reduce((sum, profile) => sum + Math.min(80, profile.wordCount / 50), 0) / serpProfiles.length));
      if (difficulty >= 60) continue;
      const formats = serpProfiles.map(profile => profile.format);
      const dominantFormat = formats.sort((a, b) => formats.filter(value => value === b).length - formats.filter(value => value === a).length)[0] ?? 'article';
      const missing = [...new Set(serpProfiles.flatMap(profile => [profile.hasFaq ? '' : 'FAQ structurée', profile.hasNumericData ? '' : 'données chiffrées', profile.wordCount > 1200 ? '' : 'profondeur éditoriale']).filter(Boolean))];
      keywordResults.push({ keyword, variants, volume: estimatedVolume, difficulty, competitorCount: competitorKeywordCounts.get(keyword), dominantFormat, top5: top5.map(item => ({ position: item.position, domain: item.domain, title: item.title, url: item.url })), competitorProfiles: serpProfiles.map(profile => ({ url: profile.url, title: profile.title, wordCount: profile.wordCount, headings: profile.headings.slice(0, 12), format: profile.format, latestYear: profile.latestYear, hasNumericData: profile.hasNumericData, hasFaq: profile.hasFaq })), gaps: missing, potentialTraffic: Math.round(estimatedVolume * 0.28) });
    }
    keywordResults.sort((a, b) => Number(b.potentialTraffic) - Number(a.potentialTraffic));
    const selected = keywordResults.slice(0, 15);
    const clusters = new Map<string, { name: string; cornerstone: Record<string, unknown> | null; satellites: Array<Record<string, unknown>> }>();
    for (const item of selected) {
      const name = String(item.keyword).split(' ')[0] || 'Thématique';
      const cluster = clusters.get(name) ?? { name, cornerstone: null, satellites: [] };
      const topic = { keyword: item.keyword, volume: item.volume, difficulty: item.difficulty, format: item.dominantFormat, potentialTraffic: item.potentialTraffic };
      if (!cluster.cornerstone || Number(item.volume) > Number(cluster.cornerstone.volume)) cluster.cornerstone = topic;
      else cluster.satellites.push(topic);
      clusters.set(name, cluster);
    }
    return c.json({ siteUrl, competitors: competitorUrls, country, language, methodology: { gscLookbackDays: 90, minimumCompetitorsInTop10: 2, excludedIfOwnImpressions: true, minimumVolume: 100, maximumDifficulty: 59, liveSerpTopResults: 5, excludedAuthorities: true, note: 'Les volumes sont affichés uniquement lorsqu’ils sont mesurés par le fournisseur SERP configuré. Une estimation ne remplace pas un volume fourni par une API keyword.' }, opportunities: selected, clusters: [...clusters.values()], summary: { candidatesAfterGscFilter: candidates.length, validatedTopics: selected.length, excludedWithoutEvidence: true } });
  } catch (error) {
    return c.json({ error: 'SEO_GAP_UPSTREAM_ERROR', details: error instanceof Error ? error.message : 'SEO gap analysis failed' }, 502);
  }
});

router.get('/api/search-console/organic-decline', async c => {
  const uid = await user(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  if (!searchConsoleConfig(c)) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);
  const { s } = store(c);
  const tokenRow = await s.getByUser(uid, provider);
  if (!tokenRow) return c.json({ error: 'GSC_NOT_CONNECTED' }, 503);
  const requestedSiteUrl = c.req.query('siteUrl') || c.env.SEARCH_CONSOLE_SITE_URL;
  if (!requestedSiteUrl) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);
  const availableSites = await listSites(await s.decryptAccessToken(tokenRow.accessToken));
  if (!availableSites.length) return c.json({ error: 'GSC_NO_ACCESSIBLE_PROPERTIES', details: 'Search Console n’a renvoyé aucune propriété pour ce compte Google.' }, 403);
  const requestedDomain = normalizeDomain(requestedSiteUrl);
  const siteUrl = availableSites.find(site => normalizeDomain(site.siteUrl) === requestedDomain)?.siteUrl;
  if (!siteUrl) return c.json({ error: 'GSC_PROPERTY_NOT_ACCESSIBLE', details: `La propriété ${requestedSiteUrl} n’est pas accessible par la connexion Google utilisée.` }, 403);

  const end = subtractDays(new Date(), GSC_DEFAULT_END_LAG_DAYS);
  const current = period(end, 28);
  const previous = period(addDays(end, -28), 28);
  const yearAgoEnd = sameCalendarPeriodLastYear(end);
  const yearAgo = period(yearAgoEnd, 28);

  try {
    let token = await s.decryptAccessToken(tokenRow.accessToken);
    const refreshToken = tokenRow.refreshToken ? await s.decryptRefreshToken(tokenRow.refreshToken) : '';
    if (new Date(tokenRow.expiresAt).getTime() < Date.now() + 60000 && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken, c.env.GOOGLE_BUSINESS_CLIENT_ID, c.env.GOOGLE_BUSINESS_CLIENT_SECRET);
      token = refreshed.access_token;
      await s.save({ userId: uid, provider, accessToken: token, refreshToken, expiresAt: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(), scopes: [GSC_SCOPE] });
    }
    const [currentAggregate, previousAggregate, yearAggregate, currentPages, previousPages, yearPages, currentQueries, previousQueries, yearQueries] = await Promise.all([
      query(token, siteUrl, current.startDate, current.endDate),
      query(token, siteUrl, previous.startDate, previous.endDate),
      query(token, siteUrl, yearAgo.startDate, yearAgo.endDate),
      fetchAllRows(token, siteUrl, current.startDate, current.endDate, ['page']),
      fetchAllRows(token, siteUrl, previous.startDate, previous.endDate, ['page']),
      fetchAllRows(token, siteUrl, yearAgo.startDate, yearAgo.endDate, ['page']),
      fetchAllRows(token, siteUrl, current.startDate, current.endDate, ['query']),
      fetchAllRows(token, siteUrl, previous.startDate, previous.endDate, ['query']),
      fetchAllRows(token, siteUrl, yearAgo.startDate, yearAgo.endDate, ['query']),
    ]);
    return c.json(buildOrganicDeclineReport({
      siteUrl,
      periods: { current, previous, yearAgo },
      currentAggregateRows: currentAggregate.rows ?? [],
      previousAggregateRows: previousAggregate.rows ?? [],
      yearAggregateRows: yearAggregate.rows ?? [],
      currentPageRows: currentPages.rows,
      previousPageRows: previousPages.rows,
      yearPageRows: yearPages.rows,
      currentQueryRows: currentQueries.rows,
      previousQueryRows: previousQueries.rows,
      yearQueryRows: yearQueries.rows,
    }));
  } catch (error) {
    return c.json({ error: 'GSC_UPSTREAM_ERROR', details: error instanceof Error ? error.message : 'Organic decline report failed' }, 502);
  }
});

router.get('/api/search-console/report', async c => {
  const uid = await user(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  if (!searchConsoleConfig(c)) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);
  const { s } = store(c);
  const tokenRow = await s.getByUser(uid, provider);
  if (!tokenRow) return c.json({ error: 'GSC_NOT_CONNECTED' }, 503);
  const siteUrl = c.req.query('siteUrl') || c.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) return c.json({ error: 'GSC_NOT_CONFIGURED' }, 503);

  const rawEnd = c.req.query('endDate');
  const end = rawEnd ? new Date(`${rawEnd}T00:00:00Z`) : subtractDays(new Date(), 3);
  if (isNaN(end.getTime())) return c.json({ error: 'Invalid endDate' }, 400);

  try {
    let token = await s.decryptAccessToken(tokenRow.accessToken);
    const refreshToken = tokenRow.refreshToken ? await s.decryptRefreshToken(tokenRow.refreshToken) : '';
    if (new Date(tokenRow.expiresAt).getTime() < Date.now() + 60000 && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken, c.env.GOOGLE_BUSINESS_CLIENT_ID, c.env.GOOGLE_BUSINESS_CLIENT_SECRET);
      token = refreshed.access_token;
      await s.save({ userId: uid, provider, accessToken: token, refreshToken, expiresAt: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(), scopes: [GSC_SCOPE] });
    }

    const current90 = period(end, 90);
    const previous90 = period(addDays(end, -90), 90);
    const current30 = period(end, 30);
    const previous30 = period(addDays(end, -30), 30);
    const [currentAggregate, previousAggregate, currentPageRows, previousPageRows, currentQueryRows, current30Rows, previous30Rows] = await Promise.all([
      query(token, siteUrl, current90.startDate, current90.endDate),
      query(token, siteUrl, previous90.startDate, previous90.endDate),
      fetchAllRows(token, siteUrl, current90.startDate, current90.endDate, ['page']),
      fetchAllRows(token, siteUrl, previous90.startDate, previous90.endDate, ['page']),
      fetchAllRows(token, siteUrl, current90.startDate, current90.endDate, ['query']),
      fetchAllRows(token, siteUrl, current30.startDate, current30.endDate, ['query']),
      fetchAllRows(token, siteUrl, previous30.startDate, previous30.endDate, ['query']),
    ]);

    type Metric = ReturnType<typeof metricFromRows>;
    type PageMetric = Metric & { url: string; deltaClicks: number; deltaClicksPercent: number | null };
    const current = metricFromRows(currentAggregate.rows ?? []);
    const previous = metricFromRows(previousAggregate.rows ?? []);
    const percentChange = (value: number, baseline: number) => baseline === 0 ? null : (value - baseline) / baseline;
    const currentPages = mergePageRows(currentPageRows.rows);
    const previousPages = mergePageRows(previousPageRows.rows);
    const pageUrls = new Set([...currentPages.keys(), ...previousPages.keys()]);
    const pages: PageMetric[] = [...pageUrls].map(url => {
      const now = currentPages.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const before = previousPages.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      return { url, ...now, deltaClicks: now.clicks - before.clicks, deltaClicksPercent: percentChange(now.clicks, before.clicks) };
    });
    const tops = pages.filter(page => page.deltaClicks > 0).sort((a, b) => b.deltaClicks - a.deltaClicks).slice(0, 10);
    const flops = pages.filter(page => page.deltaClicks < 0).sort((a, b) => a.deltaClicks - b.deltaClicks).slice(0, 10);

    const quickWins = (currentQueryRows.rows ?? []).map(row => ({
      query: row.keys?.[0] || '',
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      ctr: Number(row.ctr) || 0,
      position: Number(row.position) || 0,
    })).filter(row => row.query && row.position >= 11 && row.position <= 20 && row.impressions > 200).sort((a, b) => b.impressions - a.impressions).slice(0, 20);

    const expectedCtr = (position: number) => position <= 3 ? 0.15 : position <= 5 ? 0.09 : position <= 10 ? 0.045 : position <= 20 ? 0.02 : 0.01;
    const titleMeta = pages.filter(page => {
      const expected = expectedCtr(page.position);
      return page.impressions >= 200 && page.ctr < expected * 0.65;
    }).map(page => ({ ...page, expectedCtr: expectedCtr(page.position), ctrGap: page.ctr - expectedCtr(page.position) })).sort((a, b) => b.impressions - a.impressions).slice(0, 20);

    const recentQueries = new Map((current30Rows.rows ?? []).map(row => [row.keys?.[0] || '', row]));
    const previousQueries = new Set((previous30Rows.rows ?? []).map(row => row.keys?.[0] || '').filter(Boolean));
    const newQueries = [...recentQueries.entries()].filter(([queryText]) => queryText && !previousQueries.has(queryText)).map(([queryText, row]) => ({ query: queryText, impressions: Number(row.impressions) || 0, clicks: Number(row.clicks) || 0, ctr: Number(row.ctr) || 0, position: Number(row.position) || 0 })).filter(row => row.impressions > 0).sort((a, b) => b.impressions - a.impressions).slice(0, 20);

    const metricDelta = (key: keyof Metric) => ({ value: current[key], previous: previous[key], delta: current[key] - previous[key], percent: percentChange(current[key], previous[key]) });
    return c.json({
      siteUrl,
      periods: { current90, previous90, current30, previous30 },
      methodology: {
        source: 'Google Search Console Search Analytics API',
        reportLagDays: 3,
        quickWinRule: 'Position moyenne 11 à 20 et plus de 200 impressions sur la période actuelle',
        titleMetaRule: 'Plus de 200 impressions et CTR inférieur à 65 % du CTR de référence de la tranche de position',
        newQueryRule: 'Présente dans les 30 derniers jours mais absente des 30 jours précédents ; cela ne prouve pas la date exacte de première apparition',
      },
      keyMetrics: { clicks: metricDelta('clicks'), impressions: metricDelta('impressions'), position: metricDelta('position') },
      pages: { tops, flops },
      quickWins,
      titleMeta,
      newQueries,
      summary: { pagesChecked: pages.length, tops: tops.length, flops: flops.length, quickWins: quickWins.length, titleMeta: titleMeta.length, newQueries: newQueries.length, truncated: currentPageRows.truncated || previousPageRows.truncated || currentQueryRows.truncated || current30Rows.truncated || previous30Rows.truncated },
    });
  } catch (error) {
    return c.json({ error: 'GSC_UPSTREAM_ERROR', details: error instanceof Error ? error.message : 'Search Console report failed' }, 502);
  }
});