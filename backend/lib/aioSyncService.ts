/**
 * aioSyncService.ts — Suivi de visibilité IA via SerpApi
 *
 * Interroge SerpApi pour mesurer la présence d'une marque dans :
 *   1. Google Web Search (source principale, proxifie ChatGPT Search + Perplexity)
 *   2. Google AI Overview (le "SGE" / réponse IA inline de Google)
 *   3. Bing Search (second moteur majeur, source de Copilot / ChatGPT Browser)
 *
 * Pourquoi SerpApi plutôt qu'un appel direct Perplexity/ChatGPT ?
 * → ChatGPT Search et Perplexity n'offrent pas d'API publique SERP.
 *   SerpApi proxifie Google (qui alimente Gemini), Bing (qui alimente Copilot),
 *   et Google Scholar (citations académiques). On détecte la marque dans les
 *   snippets et titres retournés — les mêmes données que les LLM ingèrent.
 *
 * Structure de la réponse SerpApi (Google) :
 * {
 *   "organic_results": [                  ← résultats organiques classiques
 *     { "position": 1, "title": "…", "snippet": "…", "link": "…" }
 *   ],
 *   "ai_overview": {                      ← SGE / AI Overview (si présent)
 *     "text_blocks": [{ "snippet": "…" }]
 *   },
 *   "related_questions": [               ← People Also Ask
 *     { "question": "…", "snippet": "…" }
 *   ],
 *   "search_information": { "total_results": "1 230 000" }
 * }
 *
 * Usage :
 *   const result = await trackAiVisibility('logiciel gestion PME', 'Kompilot', apiKey);
 */

// ── Constantes ─────────────────────────────────────────────────────────────────

const SERP_API_BASE   = 'https://serpapi.com/search.json';
const FETCH_TIMEOUT   = 18_000; // 18 s — SerpApi peut être lent sur le plan gratuit

// Moteurs interrogés avec leur label UI et leur paramètre SerpApi
const ENGINES = [
  {
    id:       'google' as const,
    label:    'Google (ChatGPT Search / Gemini)',
    engine:   'google',
    /**
     * SerpApi param `num` : nombre de résultats à récupérer.
     * On prend 10 (page 1) pour maximiser la couverture sans dépasser le quota.
     */
    params:   { num: '10', hl: 'fr', gl: 'fr' },
  },
  {
    id:       'bing' as const,
    label:    'Bing (Copilot / ChatGPT Browser)',
    engine:   'bing',
    params:   { count: '10', mkt: 'fr-FR' },
  },
] as const;

// ── Types exportés ─────────────────────────────────────────────────────────────

/** Résultat organique SERP (commun Google + Bing) */
export interface SerpOrganicResult {
  position:    number;
  title:       string;
  link:        string;
  /** Extrait court affiché sous le titre */
  snippet:     string;
  /** true si le nom de marque apparaît dans le title ou le snippet */
  brandCited:  boolean;
}

/** Résultat de l'analyse pour un moteur donné */
export interface EngineResult {
  engine:             'google' | 'bing';
  label:              string;
  /** La marque a été trouvée au moins une fois dans les résultats */
  detected:           boolean;
  /**
   * Position de la première mention (1-based).
   * null si la marque n'est pas détectée.
   */
  firstPosition:      number | null;
  /** Snippet de la première mention — permet d'afficher un extrait en UI */
  firstSnippet:       string | null;
  /** Nombre total de résultats où la marque est mentionnée */
  mentionCount:       number;
  /** La marque est dans l'AI Overview / SGE de Google (si disponible) */
  inAiOverview:       boolean;
  /**
   * Les 3 premiers résultats organiques (avec brandCited flag).
   * Utilisé par l'UI pour le mini-tableau de positions.
   */
  topResults:         SerpOrganicResult[];
  /** Durée de la requête en ms */
  durationMs:         number;
}

/** Résultat complet de trackAiVisibility() */
export interface AiVisibilityResult {
  keyword:            string;
  brandName:          string;
  /** true dès qu'un moteur détecte la marque */
  globalDetected:     boolean;
  /**
   * Statut synthétique :
   *   VISIBLE       — détecté dans ≥1 moteur en position ≤3
   *   CITED         — détecté mais position > 3
   *   NOT_FOUND     — aucune mention trouvée
   */
  status:             'VISIBLE' | 'CITED' | 'NOT_FOUND';
  /** Score de visibilité 0–100 basé sur position et nombre de moteurs */
  visibilityScore:    number;
  /** Résultats par moteur */
  engines:            EngineResult[];
  /** Timestamp ISO de l'analyse */
  analyzedAt:         string;
  /** Durée totale du pipeline en ms */
  totalDurationMs:    number;
}

// ── Helpers internes ──────────────────────────────────────────────────────────

/**
 * serpFetch — appel SerpApi avec timeout AbortController.
 * Renvoie le JSON brut ou lève une erreur typée.
 */
async function serpFetch(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(SERP_API_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SerpApi HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return await res.json() as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * detectBrand — vérifie si brandName apparaît (insensible à la casse)
 * dans un ou plusieurs champs texte.
 */
function detectBrand(brandName: string, ...fields: (string | undefined)[]): boolean {
  const brand = brandName.toLowerCase().trim();
  return fields.some(f => f?.toLowerCase().includes(brand));
}

/**
 * scoreVisibility — calcule un score 0–100 à partir des résultats d'engine.
 * Formule :
 *   +40 pts si détecté par Google
 *   +30 pts si détecté par Bing
 *   +20 pts si position ≤ 3 dans au moins un moteur
 *   +10 pts si dans AI Overview Google
 */
function scoreVisibility(engines: EngineResult[]): number {
  let score = 0;
  for (const e of engines) {
    if (!e.detected) continue;
    if (e.engine === 'google') score += 40;
    if (e.engine === 'bing')   score += 30;
    if (e.firstPosition !== null && e.firstPosition <= 3) score += 20;
    if (e.inAiOverview) score += 10;
  }
  return Math.min(100, score);
}

// ── Fonctions par moteur ──────────────────────────────────────────────────────

/**
 * analyzeGoogle — interroge Google via SerpApi et cherche la marque dans :
 *   • organic_results[].title + snippet
 *   • ai_overview.text_blocks[].snippet (SGE)
 *   • related_questions[].snippet
 */
async function analyzeGoogle(
  keyword: string,
  brandName: string,
  apiKey: string,
): Promise<EngineResult> {
  const t0 = Date.now();

  const raw = await serpFetch({
    api_key: apiKey,
    engine:  'google',
    q:       keyword,
    num:     '10',
    hl:      'fr',
    gl:      'fr',
  });

  // ── Organic results ────────────────────────────────────────────────────────
  type RawResult = { position?: number; title?: string; link?: string; snippet?: string };
  const rawOrganic: RawResult[] = Array.isArray(raw.organic_results)
    ? (raw.organic_results as RawResult[])
    : [];

  const topResults: SerpOrganicResult[] = rawOrganic.slice(0, 10).map(r => ({
    position:   r.position ?? 0,
    title:      r.title    ?? '',
    link:       r.link     ?? '',
    snippet:    r.snippet  ?? '',
    brandCited: detectBrand(brandName, r.title, r.snippet),
  }));

  // ── AI Overview (SGE) ──────────────────────────────────────────────────────
  //
  // SerpApi structure pour ai_overview :
  // { "text_blocks": [{ "snippet": "…" }, …] }
  // Disponible uniquement quand Google affiche un résumé IA en haut de page.
  //
  const aiOverviewRaw = raw.ai_overview as Record<string, unknown> | undefined;
  type Block = { snippet?: string };
  const aiBlocks: Block[] = Array.isArray(aiOverviewRaw?.text_blocks)
    ? (aiOverviewRaw!.text_blocks as Block[])
    : [];
  const inAiOverview = aiBlocks.some(b => detectBrand(brandName, b.snippet));

  // ── Related questions (PAA) ────────────────────────────────────────────────
  type RawQ = { question?: string; snippet?: string };
  const paa: RawQ[] = Array.isArray(raw.related_questions)
    ? (raw.related_questions as RawQ[])
    : [];
  const inPAA = paa.some(q => detectBrand(brandName, q.snippet));

  // ── Calcul détection ──────────────────────────────────────────────────────
  const cited        = topResults.filter(r => r.brandCited);
  const detected     = cited.length > 0 || inAiOverview || inPAA;
  const firstCited   = cited[0] ?? null;

  return {
    engine:        'google',
    label:         'Google (ChatGPT Search / Gemini)',
    detected,
    firstPosition: firstCited?.position ?? null,
    firstSnippet:  firstCited?.snippet  ?? null,
    mentionCount:  cited.length,
    inAiOverview,
    topResults:    topResults.slice(0, 3),
    durationMs:    Date.now() - t0,
  };
}

/**
 * analyzeBing — interroge Bing via SerpApi et cherche la marque dans :
 *   • organic_results[].title + snippet
 *
 * Bing alimente Copilot (Microsoft) et une partie des réponses de ChatGPT Browser.
 */
async function analyzeBing(
  keyword: string,
  brandName: string,
  apiKey: string,
): Promise<EngineResult> {
  const t0 = Date.now();

  const raw = await serpFetch({
    api_key: apiKey,
    engine:  'bing',
    q:       keyword,
    count:   '10',
    mkt:     'fr-FR',
  });

  type RawResult = { position?: number; title?: string; url?: string; snippet?: string };
  const rawOrganic: RawResult[] = Array.isArray(raw.organic_results)
    ? (raw.organic_results as RawResult[])
    : [];

  const topResults: SerpOrganicResult[] = rawOrganic.slice(0, 10).map(r => ({
    position:   r.position ?? 0,
    title:      r.title    ?? '',
    link:       r.url      ?? '',
    snippet:    r.snippet  ?? '',
    brandCited: detectBrand(brandName, r.title, r.snippet),
  }));

  const cited      = topResults.filter(r => r.brandCited);
  const detected   = cited.length > 0;
  const firstCited = cited[0] ?? null;

  return {
    engine:        'bing',
    label:         'Bing (Copilot / ChatGPT Browser)',
    detected,
    firstPosition: firstCited?.position ?? null,
    firstSnippet:  firstCited?.snippet  ?? null,
    mentionCount:  cited.length,
    inAiOverview:  false,   // Bing n'expose pas de "AI Overview" via SerpApi
    topResults:    topResults.slice(0, 3),
    durationMs:    Date.now() - t0,
  };
}

// ── Fonction principale exportée ──────────────────────────────────────────────

/**
 * trackAiVisibility — pipeline complet de suivi de visibilité IA.
 *
 * Interroge Google + Bing en parallèle (Promise.allSettled), calcule
 * un score de visibilité 0–100 et retourne un résultat structuré.
 *
 * Résilience :
 *   - Si un moteur échoue, son résultat est marqué detected=false
 *     et le pipeline continue avec les autres moteurs.
 *   - Si TOUS les moteurs échouent, une erreur est levée.
 *
 * @param keyword    Mot-clé à surveiller (ex: "logiciel gestion PME")
 * @param brandName  Nom de la marque (ex: "Kompilot")
 * @param apiKey     SERP_API_KEY depuis les env CF Workers
 */
export async function trackAiVisibility(
  keyword: string,
  brandName: string,
  apiKey: string,
): Promise<AiVisibilityResult> {
  const t0 = Date.now();

  console.log(`[aioSync] trackAiVisibility — keyword="${keyword}" brand="${brandName}"`);

  // Lancement en parallèle sur Google + Bing
  const [googleResult, bingResult] = await Promise.allSettled([
    analyzeGoogle(keyword, brandName, apiKey),
    analyzeBing(keyword, brandName, apiKey),
  ]);

  // ── Collecte des résultats (fulfilled uniquement) ──────────────────────────
  const engines: EngineResult[] = [];

  if (googleResult.status === 'fulfilled') {
    engines.push(googleResult.value);
    console.log(`[aioSync] Google OK — detected=${googleResult.value.detected} pos=${googleResult.value.firstPosition}`);
  } else {
    console.error('[aioSync] Google FAILED:', googleResult.reason);
    // Résultat vide pour ne pas bloquer l'UI
    engines.push({
      engine: 'google', label: 'Google (ChatGPT Search / Gemini)',
      detected: false, firstPosition: null, firstSnippet: null,
      mentionCount: 0, inAiOverview: false, topResults: [],
      durationMs: 0,
    });
  }

  if (bingResult.status === 'fulfilled') {
    engines.push(bingResult.value);
    console.log(`[aioSync] Bing OK — detected=${bingResult.value.detected} pos=${bingResult.value.firstPosition}`);
  } else {
    console.error('[aioSync] Bing FAILED:', bingResult.reason);
    engines.push({
      engine: 'bing', label: 'Bing (Copilot / ChatGPT Browser)',
      detected: false, firstPosition: null, firstSnippet: null,
      mentionCount: 0, inAiOverview: false, topResults: [],
      durationMs: 0,
    });
  }

  // Si tous les moteurs ont échoué → erreur remontée à la route
  const allFailed = engines.every(e => e.durationMs === 0 && !e.detected);
  if (allFailed && googleResult.status === 'rejected' && bingResult.status === 'rejected') {
    throw new Error(
      `Tous les moteurs SERP ont échoué. Google: ${(googleResult as PromiseRejectedResult).reason} / Bing: ${(bingResult as PromiseRejectedResult).reason}`,
    );
  }

  // ── Score + statut global ─────────────────────────────────────────────────
  const globalDetected  = engines.some(e => e.detected);
  const bestPosition    = engines
    .map(e => e.firstPosition)
    .filter((p): p is number => p !== null)
    .reduce((min, p) => Math.min(min, p), Infinity);

  const status: AiVisibilityResult['status'] =
    !globalDetected               ? 'NOT_FOUND' :
    bestPosition <= 3             ? 'VISIBLE'   :
    'CITED';

  const visibilityScore = scoreVisibility(engines);

  console.log(`[aioSync] Résultat — status=${status} score=${visibilityScore} totalMs=${Date.now() - t0}`);

  return {
    keyword,
    brandName,
    globalDetected,
    status,
    visibilityScore,
    engines,
    analyzedAt:      new Date().toISOString(),
    totalDurationMs: Date.now() - t0,
  };
}
