/**
 * DataForSEO Service — Real SEO data for L'Espion gap analysis
 *
 * Provides keyword data, SERP results, and competitor gap analysis using
 * DataForSEO API (primary) or SerpApi (fallback).
 *
 * If neither key is available, returns empty arrays — the caller (seoGapAnalysis)
 * falls back to pure AI estimation.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DataForSEOConfig {
  login: string;
  password: string;
}

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number; // 0–1
  cpc: number;
  difficulty: number;  // 0–100, computed from competition
}

export interface SERPResult {
  keyword: string;
  position: number;
  domain: string;
  title: string;
  url: string;
  snippet: string;
  estimatedTraffic: number;
}

export interface CompetitorGapResult {
  keywords: KeywordData[];
  serpResults: SERPResult[];
  competitorDomains: string[];
}

// ── DataForSEO direct calls ───────────────────────────────────────────────────

async function dataforseoKeywordData(
  keywords: string[],
  config: DataForSEOConfig,
): Promise<KeywordData[]> {
  const auth = btoa(`${config.login}:${config.password}`);
  const payload = [
    {
      keywords,
      location_code: 2250, // France
      language_code: 'fr',
    },
  ];

  const res = await fetch(
    'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    console.error(`[DataForSEO] keyword data error ${res.status}`);
    return [];
  }

  const data = (await res.json()) as {
    tasks?: Array<{
      result?: Array<{
        keyword: string;
        search_volume?: number;
        competition?: number;
        cpc?: number;
      }>;
    }>;
  };

  const results = data.tasks?.[0]?.result ?? [];
  return results.map((r) => ({
    keyword: r.keyword,
    searchVolume: r.search_volume ?? 0,
    competition: r.competition ?? 0,
    cpc: r.cpc ?? 0,
    // Difficulty = competition scaled to 0–100
    difficulty: Math.round((r.competition ?? 0) * 100),
  }));
}

async function dataforseoSERPResults(
  keyword: string,
  config: DataForSEOConfig,
): Promise<SERPResult[]> {
  const auth = btoa(`${config.login}:${config.password}`);
  const payload = [
    {
      keyword,
      location_code: 2250, // France
      language_code: 'fr',
      device: 'desktop',
      os: 'windows',
    },
  ];

  const res = await fetch(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    console.error(`[DataForSEO] SERP error ${res.status}`);
    return [];
  }

  const data = (await res.json()) as {
    tasks?: Array<{
      result?: Array<{
        items?: Array<{
          type: string;
          rank_group?: number;
          domain?: string;
          title?: string;
          url?: string;
          description?: string;
          etv?: number; // estimated traffic value
        }>;
      }>;
    }>;
  };

  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .filter((item) => item.type === 'organic')
    .slice(0, 20)
    .map((item, idx) => ({
      keyword,
      position: item.rank_group ?? idx + 1,
      domain: item.domain ?? '',
      title: item.title ?? '',
      url: item.url ?? '',
      snippet: item.description ?? '',
      estimatedTraffic: item.etv ?? 0,
    }));
}

// ── SerpApi fallback ──────────────────────────────────────────────────────────

async function serpApiKeywordAndSERP(
  keyword: string,
  serpApiKey: string,
): Promise<{ keywordData: KeywordData; serpResults: SERPResult[] }> {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}&gl=fr&hl=fr&num=20`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[SerpApi] error ${res.status} for "${keyword}"`);
      return {
        keywordData: { keyword, searchVolume: 0, competition: 0, cpc: 0, difficulty: 0 },
        serpResults: [],
      };
    }

    const data = (await res.json()) as {
      organic_results?: Array<{
        position: number;
        domain?: string;
        title?: string;
        link?: string;
        snippet?: string;
      }>;
      search_information?: {
        total_results?: number;
      };
    };

    const organicResults = data.organic_results ?? [];

    // Estimate search volume from total_results (rough heuristic)
    const totalResults = data.search_information?.total_results ?? 0;
    const estimatedVolume = Math.round(Math.min(totalResults / 10_000, 10_000));

    // Estimate difficulty from domain authority of top results
    // Higher-ranking, more established domains = harder keyword
    const topDomains = organicResults.slice(0, 5);
    const domainScores = topDomains.map((r) => {
      const domain = r.domain ?? '';
      // Heuristic: .gouv.fr/.edu = very hard, short domains = harder
      if (domain.includes('.gouv.fr') || domain.includes('.edu')) return 90;
      if (domain.endsWith('.fr') && domain.split('.').length === 2) return 70; // brand.fr
      if (domain.includes('wikipedia') || domain.includes('youtube')) return 85;
      if (domain.split('.').length <= 2) return 60; // short domain
      return 40; // subdomain or long domain
    });
    const avgDifficulty = domainScores.length > 0
      ? Math.round(domainScores.reduce((a, b) => a + b, 0) / domainScores.length)
      : 50;

    const serpResults: SERPResult[] = organicResults.slice(0, 20).map((r, idx) => ({
      keyword,
      position: r.position ?? idx + 1,
      domain: r.domain ?? '',
      title: r.title ?? '',
      url: r.link ?? '',
      snippet: r.snippet ?? '',
      estimatedTraffic: 0, // SerpApi doesn't provide this directly
    }));

    return {
      keywordData: {
        keyword,
        searchVolume: estimatedVolume,
        competition: avgDifficulty / 100,
        cpc: 0, // SerpApi organic doesn't provide CPC
        difficulty: avgDifficulty,
      },
      serpResults,
    };
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[SerpApi] fetch error for "${keyword}":`, err);
    return {
      keywordData: { keyword, searchVolume: 0, competition: 0, cpc: 0, difficulty: 0 },
      serpResults: [],
    };
  }
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Fetch keyword search volume and difficulty data.
 * Priority: DataForSEO → SerpApi → empty array.
 */
export async function fetchKeywordData(
  keywords: string[],
  config: DataForSEOConfig | null,
  serpApiKey?: string,
): Promise<KeywordData[]> {
  if (keywords.length === 0) return [];

  // 1. Try DataForSEO
  if (config) {
    try {
      const results = await dataforseoKeywordData(keywords, config);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[DataForSEO] keyword data failed, trying SerpApi:', err);
    }
  }

  // 2. Fallback: SerpApi — fetch one keyword at a time
  if (serpApiKey) {
    const results: KeywordData[] = [];
    for (const kw of keywords.slice(0, 5)) { // Cap at 5 to avoid rate limits
      const { keywordData } = await serpApiKeywordAndSERP(kw, serpApiKey);
      results.push(keywordData);
    }
    return results;
  }

  // 3. No keys available
  return [];
}

/**
 * Fetch Google SERP results for a keyword.
 * Priority: DataForSEO → SerpApi → empty array.
 */
export async function fetchSERPResults(
  keyword: string,
  config: DataForSEOConfig | null,
  serpApiKey?: string,
): Promise<SERPResult[]> {
  // 1. Try DataForSEO
  if (config) {
    try {
      const results = await dataforseoSERPResults(keyword, config);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[DataForSEO] SERP failed, trying SerpApi:', err);
    }
  }

  // 2. Fallback: SerpApi
  if (serpApiKey) {
    const { serpResults } = await serpApiKeywordAndSERP(keyword, serpApiKey);
    return serpResults;
  }

  // 3. No keys available
  return [];
}

/**
 * Comprehensive competitor gap analysis.
 * Fetches keyword data + SERP results for each keyword, then extracts
 * unique competitor domains.
 */
export async function fetchCompetitorGap(
  competitorDomain: string,
  keywords: string[],
  config: DataForSEOConfig | null,
  serpApiKey?: string,
): Promise<CompetitorGapResult> {
  // Fetch keyword data in batch
  const keywordData = await fetchKeywordData(keywords, config, serpApiKey);

  // Fetch SERP results for each keyword (cap at 5 to avoid timeouts)
  const allSerpResults: SERPResult[] = [];
  for (const kw of keywords.slice(0, 5)) {
    const results = await fetchSERPResults(kw, config, serpApiKey);
    allSerpResults.push(...results);
  }

  // Extract unique competitor domains (excluding the user's own domain)
  const domains = new Set<string>();
  const cleanCompetitor = competitorDomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  for (const result of allSerpResults) {
    const cleanDomain = result.domain.toLowerCase();
    if (cleanDomain && cleanDomain !== cleanCompetitor) {
      domains.add(cleanDomain);
    }
  }

  return {
    keywords: keywordData,
    serpResults: allSerpResults,
    competitorDomains: [...domains].slice(0, 10),
  };
}
