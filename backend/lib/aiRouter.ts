/**
 * aiRouter.ts — Kompilot AI Model Router
 *
 * Central routing layer that distributes AI requests between OpenAI and Anthropic
 * based on task type, with automatic fallback to guarantee 100% uptime.
 *
 * Routing strategy:
 *  - SEO_AUDIT / STRATEGIC_PLANNING  → Anthropic Claude Sonnet (precise, structured JSON)
 *  - CREATIVE_CONTENT / MARKETING_COPY → OpenAI GPT (fluent French, creative)
 *  - QUICK_REPLY / CHAT_AUTOMATION   → OpenAI GPT mini (ultra-low latency, low cost)
 *
 * Fallback: if primary provider fails (rate-limit / outage), auto-retries on the other.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'SEO_AUDIT'
  | 'STRATEGIC_PLANNING'
  | 'CREATIVE_CONTENT'
  | 'MARKETING_COPY'
  | 'QUICK_REPLY'
  | 'CHAT_AUTOMATION';

export interface RouterRequest {
  taskType: TaskType;
  /** Main instruction / user message */
  prompt: string;
  /** Optional system context (establishment info, brand tone, etc.) */
  systemContext?: string;
  /** Raw additional context data (merged into system prompt) */
  contextData?: Record<string, unknown>;
  /** Optional: force JSON output (automatically enabled for SEO_AUDIT / STRATEGIC_PLANNING) */
  forceJson?: boolean;
  /** Token budget override (defaults to 2048) */
  maxTokens?: number;
  /**
   * Sector key for the establishment — injects sector-specific AI system prompt.
   * Values: 'beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | ''
   */
  sector?: string;
}

// ── Sector AI System Prompts ───────────────────────────────────────────────────
// Injected automatically into the system context when `sector` is provided.

const SECTOR_SYSTEM_PROMPTS: Record<string, string> = {
  beauty: `Tu es l'assistant marketing d'un salon de beauté/coiffure professionnel.
TON : Chaleureux, tendance, expert beauté. Valorise les praticiens par leur prénom.
FOCUS : Tendances coloration, techniques de soin, nouveautés esthétiques, offres saisonnières.
EXEMPLES : Mentionne des techniques spécifiques (balayage, kératine, ombré, etc.).
ÉVITE : Langage trop formel, termes médicaux, promesses de résultats non garantis.
APPEL À L'ACTION : Invite systématiquement à réserver en ligne ou via Planity/Treatwell.`,

  medical: `Tu es l'assistant communication d'un professionnel de santé réglementé.
TON : Neutre, bienveillant, rassurant. Respect absolu du secret médical et du RGPD.
FOCUS : Disponibilité du praticien, suivi patient, informations de santé publique validées.
IMPORTANT : N'émets jamais de diagnostic, n'utilise pas de données patients identifiables.
CONFORMITÉ : Respecte le code de déontologie médicale — pas de publicité comparative.
APPEL À L'ACTION : Orienter vers prise de rendez-vous Doctolib ou contact cabinet.`,

  restaurant: `Tu es l'assistant marketing d'un restaurant ou établissement de restauration.
TON : Convivial, appétissant, généreux. Évoque les saveurs, la chaleur, le partage.
FOCUS : Plats du moment, événements, chef, terroir, ambiance, expérience client.
EXEMPLES : Décris les plats avec des termes sensoriels (croustillant, fondant, parfumé…).
SAISONNALITÉ : Adapte systématiquement les contenus aux saisons et occasions (fêtes, été…).
APPEL À L'ACTION : Réservation en ligne TheFork, commande Deliveroo, ou appel direct.`,

  hotel: `Tu es l'assistant communication d'un hôtel ou établissement d'hébergement.
TON : Prestige, expérience, hospitalité. Donne envie de séjourner et de revenir.
FOCUS : Expériences uniques, surclassements, services exclusifs, cadre, destination locale.
EXEMPLES : Évoque les vues, les équipements (spa, piscine), les services personnalisés.
GESTION RÉPUTATION : Réponses aux avis négatives : empathie d'abord, solution concrète ensuite.
APPEL À L'ACTION : Réservation directe (meilleur tarif), ou via Booking.com/Airbnb.`,

  auto: `Tu es l'assistant communication d'un garage ou artisan automobile.
TON : Technique, fiable, transparent. Inspire confiance et expertise professionnelle.
FOCUS : Transparence des devis, expertise technique, rapidité d'intervention, garanties.
EXEMPLES : Mentionne les marques de pièces, les certifications (Vroomly Certifié, etc.).
CONFORMITÉ : Pas de promesses non tenues sur les délais ou prix sans diagnostic préalable.
APPEL À L'ACTION : Devis en ligne Vroomly, prise de RDV iDGarages, ou appel direct.`,
};

/** Returns the sector system prompt prefix, or empty string if no sector */
export function getSectorPromptPrefix(sector?: string): string {
  if (!sector) return '';
  return SECTOR_SYSTEM_PROMPTS[sector] ?? '';
}

export interface RouterResponse {
  /** Text content of the AI response */
  content: string;
  /** Provider actually used (may differ from primary due to fallback) */
  provider: 'openai' | 'anthropic';
  /** Model used */
  model: string;
  /** Whether this was a fallback response */
  usedFallback: boolean;
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens consumed */
  outputTokens: number;
  /** Prompt cache read tokens (Anthropic only) — indicates a cache hit */
  cacheReadTokens: number;
  /** Wall-clock latency in ms */
  latencyMs: number;
  /** Task type echo */
  taskType: TaskType;
}

// ── Model configuration ───────────────────────────────────────────────────────

const MODELS = {
  openai: {
    primary: 'gpt-4.1',        // GPT-5.4 not yet GA; gpt-4.1 is the current flagship
    fast:    'gpt-4.1-mini',   // Ultra-low latency equivalent
  },
  anthropic: {
    primary: 'claude-sonnet-4-5', // Latest Claude Sonnet (claude-3-5-sonnet maps here)
    fast:    'claude-haiku-4-5',  // Fast / low-cost Claude
  },
} as const;

// Route config: primary provider, fallback, temperature, JSON mode
interface RouteConfig {
  primary: 'openai' | 'anthropic';
  fallback: 'openai' | 'anthropic';
  modelKey: 'primary' | 'fast';
  temperature: number;
  requireJson: boolean;
}

const ROUTE_MAP: Record<TaskType, RouteConfig> = {
  SEO_AUDIT: {
    primary: 'anthropic', fallback: 'openai',
    modelKey: 'primary', temperature: 0.2, requireJson: true,
  },
  STRATEGIC_PLANNING: {
    primary: 'anthropic', fallback: 'openai',
    modelKey: 'primary', temperature: 0.2, requireJson: true,
  },
  CREATIVE_CONTENT: {
    primary: 'openai', fallback: 'anthropic',
    modelKey: 'primary', temperature: 0.7, requireJson: false,
  },
  MARKETING_COPY: {
    primary: 'openai', fallback: 'anthropic',
    modelKey: 'primary', temperature: 0.7, requireJson: false,
  },
  QUICK_REPLY: {
    primary: 'openai', fallback: 'anthropic',
    modelKey: 'fast', temperature: 0.4, requireJson: false,
  },
  CHAT_AUTOMATION: {
    primary: 'openai', fallback: 'anthropic',
    modelKey: 'fast', temperature: 0.4, requireJson: false,
  },
};

// ── OpenAI caller (with Automatic Prompt Caching) ────────────────────────────
//
// OpenAI Prompt Caching: gpt-4.1 and gpt-4.1-mini auto-cache any prompt prefix
// ≥1024 tokens in 128-token granularity. Cached tokens are billed at 50% discount.
// To maximise cache hits:
//   1. Put long, stable content (sector instructions, system context) FIRST in the
//      system message — we already do this via the sector prefix.
//   2. Keep the system message identical across calls for the same user/sector.
//   3. Use the same model — cache is per (model, system prefix) pair.
// Reference: https://platform.openai.com/docs/guides/prompt-caching
//
// We also pass "store: true" so the cached prefix is eligible for the Prompt Cache.

async function callOpenAI(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  requireJson: boolean;
  maxTokens: number;
}): Promise<{ content: string; inputTokens: number; outputTokens: number; cacheReadTokens?: number }> {
  const { apiKey, model, systemPrompt, userPrompt, temperature, requireJson, maxTokens } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000); // 28s timeout (CF Workers hard-kill at 30s)

  try {
    const body: Record<string, unknown> = {
      model,
      temperature,
      max_tokens: maxTokens,
      // "store: true" enables prompt caching on the OpenAI side for eligible models
      store: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    };
    if (requireJson) body.response_format = { type: 'json_object' };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        prompt_tokens_details?: { cached_tokens?: number };
      };
    };

    const cacheReadTokens = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;

    // Log cache hit for billing visibility (mirrors Anthropic pattern)
    if (cacheReadTokens > 0) {
      console.log(JSON.stringify({
        event: 'openai_cache_hit',
        model,
        cacheReadTokens,
        inputTokens:  data.usage?.prompt_tokens ?? 0,
        ts: new Date().toISOString(),
      }));
    }

    return {
      content:         data.choices[0]?.message?.content ?? '',
      inputTokens:     data.usage?.prompt_tokens ?? 0,
      outputTokens:    data.usage?.completion_tokens ?? 0,
      cacheReadTokens,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Anthropic caller (with Prompt Caching) ────────────────────────────────────
//
// Prompt Caching: system prompt is marked with cache_control { type: "ephemeral" }.
// Anthropic caches the system prompt for ~5 minutes per unique (model, system) pair.
// On subsequent calls from the same client within the window, the cached version is reused
// at ~90% discount on input tokens for the cached portion.
// Reference: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
//
// Usage count tracking: the response includes usage.cache_read_input_tokens and
// usage.cache_creation_input_tokens — these are logged for billing visibility.

async function callAnthropic(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  requireJson: boolean;
  maxTokens: number;
}): Promise<{ content: string; inputTokens: number; outputTokens: number; cacheReadTokens?: number }> {
  const { apiKey, model, systemPrompt, userPrompt, temperature, requireJson, maxTokens } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);

  // For JSON output with Claude, inject instruction at the end of the system prompt
  const baseSystem = requireJson
    ? `${systemPrompt}\n\nIMPORTANT: Return your response as valid JSON only. Do not include markdown fences or extra text.`
    : systemPrompt;

  // Build system array with cache_control on the static prefix portion.
  // Prompt Caching requires min 1024 tokens for claude-3-5-sonnet, 2048 for claude-3-haiku.
  // We always mark it — if too short, Anthropic simply ignores the hint (no error).
  const systemArray = [
    {
      type: 'text' as const,
      text: baseSystem,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':              apiKey,
        'anthropic-version':      '2023-06-01',
        'anthropic-beta':         'prompt-caching-2024-07-31',
        'Content-Type':           'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemArray,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };

    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    const cacheRead = data.usage?.cache_read_input_tokens ?? 0;
    const cacheCreation = data.usage?.cache_creation_input_tokens ?? 0;

    // Log cache hit/miss for billing visibility
    if (cacheRead > 0) {
      console.log(JSON.stringify({
        event: 'anthropic_cache_hit',
        model,
        cacheReadTokens: cacheRead,
        cacheCreationTokens: cacheCreation,
        inputTokens: data.usage?.input_tokens ?? 0,
        ts: new Date().toISOString(),
      }));
    }

    return {
      content:         text,
      inputTokens:     data.usage?.input_tokens ?? 0,
      outputTokens:    data.usage?.output_tokens ?? 0,
      cacheReadTokens: cacheRead,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Provider dispatcher ───────────────────────────────────────────────────────

async function dispatchToProvider(
  provider: 'openai' | 'anthropic',
  modelKey: 'primary' | 'fast',
  params: {
    openaiKey: string;
    anthropicKey: string;
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    requireJson: boolean;
    maxTokens: number;
  },
): Promise<{ content: string; model: string; inputTokens: number; outputTokens: number; cacheReadTokens?: number }> {
  if (provider === 'openai') {
    const model = MODELS.openai[modelKey];
    const result = await callOpenAI({ ...params, apiKey: params.openaiKey, model });
    return { ...result, model, cacheReadTokens: result.cacheReadTokens ?? 0 };
  } else {
    const model = MODELS.anthropic[modelKey];
    const result = await callAnthropic({ ...params, apiKey: params.anthropicKey, model });
    return { ...result, model };
  }
}

// ── Discrete logger ───────────────────────────────────────────────────────────

function logCallMetrics(opts: {
  taskType: TaskType;
  provider: string;
  model: string;
  usedFallback: boolean;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  latencyMs: number;
  userId?: string;
}) {
  // Silent structured log — easily forwarded to Cloudflare Logpush or an analytics endpoint
  console.log(JSON.stringify({
    ts:              new Date().toISOString(),
    event:           'ai_router_call',
    taskType:        opts.taskType,
    provider:        opts.provider,
    model:           opts.model,
    usedFallback:    opts.usedFallback,
    cacheHit:        (opts.cacheReadTokens ?? 0) > 0,
    tokens: {
      input:       opts.inputTokens,
      output:      opts.outputTokens,
      total:       opts.inputTokens + opts.outputTokens,
      cacheRead:   opts.cacheReadTokens ?? 0,
    },
    latencyMs: opts.latencyMs,
    ...(opts.userId ? { userId: opts.userId } : {}),
  }));
}

// ── Main exported function ────────────────────────────────────────────────────

/**
 * generateAIResponse — single entry point for all Kompilot AI features.
 *
 * Selects the optimal model / provider for the task, handles fallback,
 * and returns a standardised RouterResponse with token + latency telemetry.
 */
export async function generateAIResponse(
  req: RouterRequest,
  env: {
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
  },
  userId?: string,
): Promise<RouterResponse> {
  const route    = ROUTE_MAP[req.taskType];
  const maxTokens = req.maxTokens ?? 2048;
  const requireJson = route.requireJson || (req.forceJson ?? false);

  // Build system prompt — prepend sector-specific instructions when sector is provided
  const sectorPrefix = getSectorPromptPrefix(req.sector);
  const contextBlock = req.contextData
    ? `\n\nContext JSON:\n${JSON.stringify(req.contextData, null, 2)}`
    : '';
  const baseSystemContext = req.systemContext ?? 'You are Kompilot, an expert AI assistant for French local businesses. Always respond in French unless instructed otherwise.';
  const systemPrompt = [
    sectorPrefix ? `${sectorPrefix}\n\n---\n\n` : '',
    baseSystemContext,
    contextBlock,
  ].join('');

  const callParams = {
    openaiKey:    env.OPENAI_API_KEY,
    anthropicKey: env.ANTHROPIC_API_KEY,
    systemPrompt,
    userPrompt:   req.prompt,
    temperature:  route.temperature,
    requireJson,
    maxTokens,
  };

  const start = Date.now();
  let usedFallback = false;

  // 1. Try primary provider
  try {
    const result = await dispatchToProvider(route.primary, route.modelKey, callParams);
    const latencyMs = Date.now() - start;

    logCallMetrics({
      taskType:        req.taskType,
      provider:        route.primary,
      model:           result.model,
      usedFallback:    false,
      inputTokens:     result.inputTokens,
      outputTokens:    result.outputTokens,
      cacheReadTokens: result.cacheReadTokens ?? 0,
      latencyMs,
      userId,
    });

    return {
      content:         result.content,
      provider:        route.primary,
      model:           result.model,
      usedFallback:    false,
      inputTokens:     result.inputTokens,
      outputTokens:    result.outputTokens,
      cacheReadTokens: result.cacheReadTokens ?? 0,
      latencyMs,
      taskType:        req.taskType,
    };
  } catch (primaryErr) {
    console.warn(`[aiRouter] Primary provider (${route.primary}) failed for ${req.taskType}:`, primaryErr);
    usedFallback = true;
  }

  // 2. Fallback to secondary provider
  try {
    // Use fast model on fallback to minimise latency penalty
    const result = await dispatchToProvider(route.fallback, 'fast', callParams);
    const latencyMs = Date.now() - start;

    logCallMetrics({
      taskType:        req.taskType,
      provider:        route.fallback,
      model:           result.model,
      usedFallback:    true,
      inputTokens:     result.inputTokens,
      outputTokens:    result.outputTokens,
      cacheReadTokens: result.cacheReadTokens ?? 0,
      latencyMs,
      userId,
    });

    return {
      content:         result.content,
      provider:        route.fallback,
      model:           result.model,
      usedFallback:    true,
      inputTokens:     result.inputTokens,
      outputTokens:    result.outputTokens,
      cacheReadTokens: result.cacheReadTokens ?? 0,
      latencyMs,
      taskType:        req.taskType,
    };
  } catch (fallbackErr) {
    const latencyMs = Date.now() - start;
    console.error(`[aiRouter] Both providers failed for ${req.taskType}. Latency: ${latencyMs}ms`, fallbackErr);
    throw new Error(
      `AI router: all providers unavailable for task "${req.taskType}". ` +
      `Primary: ${route.primary}, Fallback: ${route.fallback}.`,
    );
  }
}
