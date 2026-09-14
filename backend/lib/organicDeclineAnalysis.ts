export type OrganicMetric = { clicks: number; impressions: number; ctr: number; position: number };
export type OrganicPageLoss = {
  url: string;
  lostClicks: number;
  current: OrganicMetric;
  previous: OrganicMetric;
  yearAgo: OrganicMetric;
  cause: {
    key: 'position' | 'impressions' | 'ctr' | 'deindexed' | 'insufficient_evidence';
    label: string;
    evidence: string;
  };
  action: string;
};

type QueryMetric = OrganicMetric & { query: string };
type QueryLoss = QueryMetric & { lostClicks: number; previous: OrganicMetric; yearAgo: OrganicMetric };
type MetricMap = Map<string, OrganicMetric>;

function relativeChange(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

function fmt(value: number, digits = 1) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
}

function pct(value: number | null, digits = 1) {
  return value === null ? 'n/d' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)} %`;
}

function metricFromRows(rows: Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }>): OrganicMetric {
  const clicks = rows.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0);
  const weightedPosition = rows.reduce((sum, row) => sum + (Number(row.position) || 0) * (Number(row.impressions) || 0), 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weightedPosition / impressions : 0 };
}

function byPage(rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>): MetricMap {
  const grouped = new Map<string, Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }>>();
  for (const row of rows) {
    const key = row.keys?.[0];
    if (key) grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return new Map([...grouped.entries()].map(([key, values]) => [key, metricFromRows(values)]));
}

function byQuery(rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>): Map<string, OrganicMetric> {
  return byPage(rows);
}

function causeFor(current: OrganicMetric, previous: OrganicMetric): OrganicPageLoss['cause'] {
  const impressionChange = relativeChange(current.impressions, previous.impressions);
  const ctrChange = relativeChange(current.ctr, previous.ctr);
  const positionDelta = current.position - previous.position;

  if (previous.impressions > 0 && current.impressions === 0) {
    return {
      key: 'deindexed',
      label: 'Sortie de l’index / aucune impression',
      evidence: `Impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)} ; position actuelle : n/d.`,
    };
  }
  if (previous.impressions > 0 && positionDelta >= 1) {
    return {
      key: 'position',
      label: 'Perte de position',
      evidence: `Position moyenne : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)} (+${fmt(positionDelta, 1)} rangs perdus) ; impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)}.`,
    };
  }
  if (Math.abs(positionDelta) < 1 && (ctrChange ?? 0) <= -0.15 && (impressionChange ?? 0) >= -0.2) {
    return {
      key: 'ctr',
      label: 'Chute de CTR',
      evidence: `CTR : ${(previous.ctr * 100).toFixed(2)} % → ${(current.ctr * 100).toFixed(2)} % (${pct(ctrChange)}) ; position : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)}.`,
    };
  }
  if (Math.abs(positionDelta) < 1 && (impressionChange ?? 0) <= -0.2 && (ctrChange ?? 0) > -0.15) {
    return {
      key: 'impressions',
      label: 'Perte d’impressions à position stable',
      evidence: `Impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)} (${pct(impressionChange)}) ; position : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)} ; CTR : ${(previous.ctr * 100).toFixed(2)} % → ${(current.ctr * 100).toFixed(2)} %.`,
    };
  }
  return {
    key: 'insufficient_evidence',
    label: 'Cause non isolable avec les agrégats GSC',
    evidence: `Clics : ${fmt(previous.clicks)} → ${fmt(current.clicks)} ; impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)} ; CTR : ${(previous.ctr * 100).toFixed(2)} % → ${(current.ctr * 100).toFixed(2)} % ; position : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)}.`,
  };
}

function correctiveAction(key: OrganicPageLoss['cause']['key']) {
  switch (key) {
    case 'position': return 'Comparer les requêtes de cette URL dans GSC, renforcer la couverture de l’intention et vérifier les liens internes avant toute réécriture.';
    case 'impressions': return 'Contrôler la demande et les requêtes associées dans GSC, puis vérifier la couverture éditoriale et la saisonnalité sans modifier le Title à l’aveugle.';
    case 'ctr': return 'Tester un Title et une Meta description plus explicites sur la promesse visible dans GSC, puis mesurer le CTR sur une nouvelle fenêtre de 28 jours.';
    case 'deindexed': return 'Vérifier dans Search Console l’inspection de l’URL, la couverture, la canonique et les directives robots avant toute action éditoriale.';
    default: return 'Conserver cette URL dans la file d’analyse : les métriques agrégées ne prouvent pas une cause unique. Segmenter par requête dans GSC.';
  }
}

function queryLosses(currentRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>, previousRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>, yearRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>): QueryLoss[] {
  const current = byQuery(currentRows);
  const previous = byQuery(previousRows);
  const year = byQuery(yearRows);
  const keys = new Set([...current.keys(), ...previous.keys()]);
  return [...keys].map(query => {
    const now = current.get(query) ?? metricFromRows([]);
    const before = previous.get(query) ?? metricFromRows([]);
    const yearBefore = year.get(query) ?? metricFromRows([]);
    return { query, ...now, lostClicks: Math.max(0, before.clicks - now.clicks), previous: before, yearAgo: yearBefore };
  }).filter(row => row.lostClicks > 0).sort((a, b) => b.lostClicks - a.lostClicks);
}

function macroAnalysis(losses: QueryLoss[]) {
  const stop = new Set(['avec', 'dans', 'pour', 'plus', 'sans', 'pourquoi', 'comment', 'quel', 'quelle', 'quels', 'quelles', 'être', 'faire', 'prix', 'avis']);
  const clusters = new Map<string, { lostClicks: number; queryCount: number }>();
  for (const row of losses) {
    const token = row.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').split(/[^\p{L}\p{N}]+/u).find(word => word.length >= 4 && !stop.has(word));
    if (token) clusters.set(token, { lostClicks: (clusters.get(token)?.lostClicks ?? 0) + row.lostClicks, queryCount: (clusters.get(token)?.queryCount ?? 0) + 1 });
  }
  const sorted = [...clusters.entries()].sort((a, b) => b[1].lostClicks - a[1].lostClicks);
  const totalLostClicks = losses.reduce((sum, row) => sum + row.lostClicks, 0);
  const dominant = sorted[0];
  const share = dominant && totalLostClicks > 0 ? dominant[1].lostClicks / totalLostClicks : 0;
  const concentrated = Boolean(dominant && dominant[1].queryCount >= 3 && share >= 0.4);
  return {
    classification: losses.length === 0 ? 'insufficient_data' : concentrated ? 'concentrated' : 'diffuse',
    evidence: dominant ? `Cluster « ${dominant[0]} » : ${fmt(dominant[1].lostClicks)} clics perdus sur ${dominant[1].queryCount} requêtes, soit ${(share * 100).toFixed(1)} % des clics perdus analysés.` : 'Aucun cluster de requêtes avec clics perdus n’est disponible.',
    method: 'Regroupement GSC par premier terme distinctif de chaque requête perdant des clics ; concentration = au moins 3 requêtes et au moins 40 % des clics perdus.',
    totalLostClicks,
    clusters: sorted.slice(0, 10).map(([name, value]) => ({ name, ...value, share: totalLostClicks ? value.lostClicks / totalLostClicks : 0 })),
  };
}

export function buildOrganicDeclineReport(input: {
  siteUrl: string;
  periods: { current: { startDate: string; endDate: string }; previous: { startDate: string; endDate: string }; yearAgo: { startDate: string; endDate: string } };
  currentAggregateRows: Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  previousAggregateRows: Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  yearAggregateRows: Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  currentPageRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  previousPageRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  yearPageRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  currentQueryRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  previousQueryRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  yearQueryRows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
}) {
  const current = metricFromRows(input.currentAggregateRows);
  const previous = metricFromRows(input.previousAggregateRows);
  const yearAgo = metricFromRows(input.yearAggregateRows);
  const metric = (now: number, before: number) => ({ value: now, previous: before, delta: now - before, percent: relativeChange(now, before) });
  const currentPages = byPage(input.currentPageRows);
  const previousPages = byPage(input.previousPageRows);
  const yearPages = byPage(input.yearPageRows);
  const urls = new Set([...currentPages.keys(), ...previousPages.keys()]);
  const pageLosses: OrganicPageLoss[] = [...urls].map(url => {
    const now = currentPages.get(url) ?? metricFromRows([]);
    const before = previousPages.get(url) ?? metricFromRows([]);
    const year = yearPages.get(url) ?? metricFromRows([]);
    const cause = causeFor(now, before);
    return { url, lostClicks: before.clicks - now.clicks, current: now, previous: before, yearAgo: year, cause, action: correctiveAction(cause.key) };
  }).filter(row => row.lostClicks > 0 && row.previous.clicks > 0).sort((a, b) => b.lostClicks - a.lostClicks).slice(0, 10);
  const losses = queryLosses(input.currentQueryRows, input.previousQueryRows, input.yearQueryRows);
  const positionDelta = current.position - previous.position;
  const impressionChange = relativeChange(current.impressions, previous.impressions);
  const ctrChange = relativeChange(current.ctr, previous.ctr);
  const rootCause = previous.impressions > 0 && current.impressions === 0
    ? { key: 'deindexed', label: 'Sortie de l’index sur le périmètre agrégé', evidence: `Impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)}.` }
    : positionDelta >= 1
      ? { key: 'position', label: 'Déclassement moyen', evidence: `Position moyenne : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)} (+${fmt(positionDelta, 1)} rangs).` }
      : (ctrChange ?? 0) <= -0.15 && (impressionChange ?? 0) >= -0.2
        ? { key: 'ctr', label: 'Problème d’attractivité (CTR)', evidence: `CTR : ${(previous.ctr * 100).toFixed(2)} % → ${(current.ctr * 100).toFixed(2)} % (${pct(ctrChange)}), impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)}.` }
        : (impressionChange ?? 0) <= -0.2 && (Math.abs(positionDelta) < 1)
          ? { key: 'impressions', label: 'Perte de visibilité', evidence: `Impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)} (${pct(impressionChange)}), position : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)}.` }
          : { key: 'insufficient_evidence', label: 'Cause racine non isolable avec les agrégats GSC', evidence: `Clics : ${fmt(previous.clicks)} → ${fmt(current.clicks)} ; impressions : ${fmt(previous.impressions)} → ${fmt(current.impressions)} ; CTR : ${(previous.ctr * 100).toFixed(2)} % → ${(current.ctr * 100).toFixed(2)} % ; position : ${fmt(previous.position, 1)} → ${fmt(current.position, 1)}.` };
  return {
    siteUrl: input.siteUrl,
    periods: input.periods,
    methodology: { source: 'Google Search Console Search Analytics API uniquement', windowDays: 28, reportLagDays: 3, causeThresholds: 'position ≥ +1 rang ; baisse CTR ≥ 15 % à impressions quasi stables ; baisse impressions ≥ 20 % à position stable ; sortie index = 0 impression actuelle après impressions antérieures.', noDataRule: 'Aucune valeur de remplacement, aucun volume estimé et aucune cause supposée.' },
    aggregate: { current, previous, yearAgo, vsPrevious: { clicks: metric(current.clicks, previous.clicks), impressions: metric(current.impressions, previous.impressions), ctr: metric(current.ctr, previous.ctr), position: metric(current.position, previous.position) }, vsYearAgo: { clicks: metric(current.clicks, yearAgo.clicks), impressions: metric(current.impressions, yearAgo.impressions), ctr: metric(current.ctr, yearAgo.ctr), position: metric(current.position, yearAgo.position) } },
    rootCause,
    dataAvailability: {
      current: input.currentAggregateRows.length > 0,
      previous: input.previousAggregateRows.length > 0,
      yearAgo: input.yearAggregateRows.length > 0,
      pagesCurrent: input.currentPageRows.length > 0,
      pagesPrevious: input.previousPageRows.length > 0,
      queriesCurrent: input.currentQueryRows.length > 0,
      queriesPrevious: input.previousQueryRows.length > 0,
    },
    pages: pageLosses,
    macro: macroAnalysis(losses),
    summary: { currentPages: currentPages.size, previousPages: previousPages.size, topLosses: pageLosses.length, totalClicksLostOnTop10: pageLosses.reduce((sum, page) => sum + page.lostClicks, 0), queryLosses: losses.length },
  };
}
