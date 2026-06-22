/**
 * claudeService.ts — Service Anthropic Claude pour Kompilot
 *
 * Fournit un accès sécurisé à l'API Anthropic via le secret ANTHROPIC_API_KEY
 * injecté dans les bindings Cloudflare Workers.
 *
 * Fonctions disponibles :
 *   checkClaudeConnection()         — test de connectivité (message ultra-court)
 *   coworkingAssist()               — assistant de co-working longue-contexte
 *   analyzeCompetitorStrategy()     — analyse stratégique d'un concurrent
 *   generateDetailedCampaignPlan()  — plan de campagne complet multi-étapes
 *   reviewContentQuality()          — audit qualité d'un texte ou post
 *   generateAuditFlash()            — audit flash visibilité locale
 *
 * Variables d'environnement requises :
 *   ANTHROPIC_API_KEY — clé API Anthropic (format sk-ant-api03-...)
 *
 * Référence API :
 *   https://docs.anthropic.com/en/api/messages
 */

// ── Constantes ─────────────────────────────────────────────────────────────────

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION  = '2023-06-01';
const DEFAULT_MODEL      = 'claude-3-5-sonnet-20241022'; // Claude 3.5 Sonnet (latest)
const FAST_MODEL         = 'claude-3-haiku-20240307';    // moins cher pour tests
const FETCH_TIMEOUT      = 30_000; // 30s — Claude peut être lent sur long contexte

// ── Types ──────────────────────────────────────────────────────────────────────

/** Message au format Anthropic Messages API */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Résultat de checkClaudeConnection() */
export interface ClaudeConnectionStatus {
  connected: boolean;
  model?: string;
  response?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  statusCode?: number;
  checkedAt: string;
}

/** Options communes pour les appels de génération */
interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

/** Réponse brute de l'API Anthropic Messages */
interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
  error?: { type: string; message: string };
}

// ── Classe d'erreur spécifique ────────────────────────────────────────────────

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorType?: string,
  ) {
    super(message);
    this.name = 'ClaudeError';
  }

  /** true si la clé API est invalide ou absente */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.errorType === 'authentication_error';
  }

  /** true si le quota ou crédit est épuisé */
  get isQuotaError(): boolean {
    return this.statusCode === 429 || this.errorType === 'rate_limit_error' || this.errorType === 'overloaded_error';
  }

  /** true si le modèle demandé n'existe pas */
  get isModelError(): boolean {
    return this.statusCode === 404 || this.errorType === 'invalid_request_error';
  }
}

// ── Helper fetch avec timeout ─────────────────────────────────────────────────

/**
 * anthropicFetch — appel HTTP vers l'API Anthropic avec timeout AbortController.
 * Lance une ClaudeError structurée sur tout échec réseau ou HTTP 4xx/5xx.
 */
async function anthropicFetch(
  apiKey: string,
  body: object,
): Promise<AnthropicResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new ClaudeError(
      msg.includes('abort') ? 'Timeout API Anthropic (30s)' : `Erreur réseau : ${msg}`,
      0,
    );
  }
  clearTimeout(timer);

  const json = await response.json() as AnthropicResponse;

  if (json.error || !response.ok) {
    const errMsg  = json.error?.message ?? `HTTP ${response.status}`;
    const errType = json.error?.type;
    throw new ClaudeError(errMsg, response.status, errType);
  }

  return json;
}

// ── messageCompletion — wrapper central ──────────────────────────────────────

/**
 * messageCompletion — envoie une conversation et retourne la réponse texte.
 * Socle utilisé par toutes les fonctions spécialisées ci-dessous.
 *
 * @param apiKey   ANTHROPIC_API_KEY depuis les env bindings CF Workers
 * @param messages Historique de conversation (user / assistant alternés)
 * @param opts     system prompt, modèle, température, max tokens
 */
export async function messageCompletion(
  apiKey: string,
  messages: AnthropicMessage[],
  opts: GenerateOptions = {},
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const payload: Record<string, unknown> = {
    model:       opts.model       ?? DEFAULT_MODEL,
    max_tokens:  opts.maxTokens   ?? 1024,
    temperature: opts.temperature ?? 0.7,
    messages,
  };

  // system est un champ racine dans l'API Anthropic (pas dans messages)
  if (opts.system) payload.system = opts.system;

  const json = await anthropicFetch(apiKey, payload);

  const text = json.content?.[0]?.text?.trim() ?? '';
  return {
    text,
    inputTokens:  json.usage?.input_tokens  ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
  };
}

// ── 1. checkClaudeConnection — test de connectivité ───────────────────────────

/**
 * checkClaudeConnection — vérifie que la clé Anthropic est valide et active.
 *
 * Effectue un appel ultra-court avec claude-3-haiku (le moins cher) pour valider :
 *   - l'authenticité de la clé
 *   - la disponibilité du crédit (20$)
 *   - la connectivité réseau depuis Cloudflare Workers
 *
 * @param apiKey ANTHROPIC_API_KEY depuis les env bindings
 */
export async function checkClaudeConnection(apiKey: string): Promise<ClaudeConnectionStatus> {
  const checkedAt = new Date().toISOString();

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return {
      connected: false,
      error: 'ANTHROPIC_API_KEY manquant ou format invalide (doit commencer par sk-ant-).',
      checkedAt,
    };
  }

  try {
    const json = await anthropicFetch(apiKey, {
      model: FAST_MODEL,
      max_tokens: 30,
      temperature: 0,
      system: 'Réponds uniquement par "Connexion Anthropic OK" suivi d\'un emoji positif. Rien d\'autre.',
      messages: [{ role: 'user', content: 'Test de connexion Kompilot.' }],
    });

    return {
      connected:    true,
      model:        FAST_MODEL,
      response:     json.content?.[0]?.text?.trim(),
      inputTokens:  json.usage?.input_tokens,
      outputTokens: json.usage?.output_tokens,
      checkedAt,
    };
  } catch (err) {
    if (err instanceof ClaudeError) {
      let errorMsg = err.message;
      if (err.isAuthError) {
        errorMsg = 'Clé API invalide (401). Vérifiez votre ANTHROPIC_API_KEY dans les secrets Cloudflare.';
      } else if (err.isQuotaError) {
        errorMsg = 'Quota épuisé ou service surchargé (429). Vérifiez votre crédit sur console.anthropic.com.';
      } else if (err.isModelError) {
        errorMsg = 'Modèle non accessible. Vérifiez que votre compte Anthropic a accès à claude-3-haiku.';
      }
      return { connected: false, error: errorMsg, statusCode: err.statusCode, checkedAt };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: msg, checkedAt };
  }
}

// ── 2. coworkingAssist — assistant co-working longue-contexte ─────────────────

/**
 * coworkingAssist — utilise Claude pour des tâches de co-working complexes.
 *
 * Claude excelle dans les raisonnements longs (200k tokens de contexte),
 * parfait pour analyser des briefs, plans marketing, ou contenus longs.
 *
 * @param apiKey   ANTHROPIC_API_KEY
 * @param task     Description détaillée de la tâche
 * @param context  Contexte additionnel (données, contraintes, exemples)
 * @param role     Rôle expert à adopter (ex: "consultant marketing digital")
 */
export async function coworkingAssist(
  apiKey: string,
  task: string,
  context: string = '',
  role: string = 'expert en marketing digital pour PME françaises',
): Promise<string> {
  const { text } = await messageCompletion(
    apiKey,
    [
      {
        role: 'user',
        content: `${context ? `Contexte :\n${context}\n\n` : ''}Tâche :\n${task}`,
      },
    ],
    {
      model:       DEFAULT_MODEL,
      temperature: 0.7,
      maxTokens:   2048,
      system: `Tu es un ${role} travaillant pour Kompilot, la plateforme SaaS de présence locale.
Tu aides les commerçants français à développer leur visibilité et leur chiffre d'affaires.
Tes réponses sont précises, actionnables et adaptées à des PME avec des budgets limités.
Format : structuré, clair, en français. Pas de jargon inutile.`,
    },
  );
  return text;
}

// ── 3. analyzeCompetitorStrategy — analyse stratégique concurrents ────────────

/**
 * analyzeCompetitorStrategy — analyse la stratégie marketing d'un concurrent
 * et produit des recommandations différenciatrices.
 *
 * @param apiKey           ANTHROPIC_API_KEY
 * @param competitorName   Nom du concurrent
 * @param competitorData   Données disponibles (posts, avis, description GMB…)
 * @param ourStrengths     Forces de l'établissement client
 */
export async function analyzeCompetitorStrategy(
  apiKey: string,
  competitorName: string,
  competitorData: string,
  ourStrengths: string,
): Promise<string> {
  const { text } = await messageCompletion(
    apiKey,
    [
      {
        role: 'user',
        content: `Analyse la stratégie marketing de "${competitorName}" :

Données collectées :
${competitorData}

Nos forces à valoriser :
${ourStrengths}

Produis :
1. Analyse SWOT du concurrent (4 points max par case)
2. Leurs 3 angles marketing principaux
3. 3 opportunités de différenciation pour nous
4. 2 actions à lancer cette semaine`,
      },
    ],
    {
      model:       DEFAULT_MODEL,
      temperature: 0.6,
      maxTokens:   1500,
      system: `Tu es un analyste stratégique spécialisé en marketing local pour commerces français.
Tes analyses sont factuelle, synthétiques et immédiatement actionnables. Réponds en français.`,
    },
  );
  return text;
}

// ── 4. generateDetailedCampaignPlan — plan de campagne complet ────────────────

/**
 * generateDetailedCampaignPlan — génère un plan de campagne marketing complet
 * sur 30 jours, avec calendrier, canaux, contenus et KPIs.
 *
 * @param apiKey     ANTHROPIC_API_KEY
 * @param sector     Secteur d'activité
 * @param objective  Objectif principal (ex: "attirer 20 nouveaux clients")
 * @param budget     Budget mensuel en euros
 * @param city       Ville de ciblage
 * @param channels   Canaux disponibles (ex: ["instagram", "google", "sms"])
 */
export async function generateDetailedCampaignPlan(
  apiKey: string,
  sector: string,
  objective: string,
  budget: number,
  city: string,
  channels: string[],
): Promise<string> {
  const { text } = await messageCompletion(
    apiKey,
    [
      {
        role: 'user',
        content: `Crée un plan de campagne marketing sur 30 jours :

Secteur : ${sector}
Ville : ${city}
Objectif : ${objective}
Budget mensuel : ${budget}€
Canaux disponibles : ${channels.join(', ')}

Le plan doit inclure :
- Semaine 1 : actions de lancement
- Semaine 2-3 : activation et amplification
- Semaine 4 : consolidation et fidélisation
- Répartition budgétaire détaillée (€ par canal)
- 3 KPIs à suivre avec valeurs cibles
- Contenu type pour chaque canal`,
      },
    ],
    {
      model:       DEFAULT_MODEL,
      temperature: 0.75,
      maxTokens:   2500,
      system: `Tu es un directeur marketing spécialisé dans les commerces locaux français.
Tu crées des plans concrets, réalistes pour des budgets PME. Réponds en français avec un format structuré.`,
    },
  );
  return text;
}

// ── 5. reviewContentQuality — audit qualité d'un texte ───────────────────────

/**
 * reviewContentQuality — évalue et améliore un texte (post, description,
 * réponse à un avis) selon les critères de qualité Kompilot.
 *
 * @param apiKey   ANTHROPIC_API_KEY
 * @param content  Texte original à évaluer
 * @param type     Type de contenu : "post" | "review_reply" | "description" | "ad"
 * @param sector   Secteur d'activité pour contextualiser
 */
export async function reviewContentQuality(
  apiKey: string,
  content: string,
  type: 'post' | 'review_reply' | 'description' | 'ad',
  sector: string,
): Promise<{ score: number; feedback: string; improved: string }> {
  const typeLabel: Record<string, string> = {
    post:          'post réseaux sociaux',
    review_reply:  'réponse à un avis client',
    description:   'description d\'établissement',
    ad:            'texte publicitaire',
  };

  const { text } = await messageCompletion(
    apiKey,
    [
      {
        role: 'user',
        content: `Évalue ce ${typeLabel[type]} pour un ${sector} :

---
${content}
---

Retourne un JSON avec :
{
  "score": (entier 1-10),
  "feedback": "(2-3 phrases de retour critique)",
  "improved": "(version améliorée du texte)"
}

Réponds UNIQUEMENT avec le JSON, sans markdown.`,
      },
    ],
    {
      model:       DEFAULT_MODEL,
      temperature: 0.3,
      maxTokens:   800,
      system: `Tu es un expert en copywriting et communication digitale pour PME françaises.
Tu évalues les textes marketing selon : clarté, engagement, appel à l'action, authenticité.
Réponds UNIQUEMENT en JSON valide.`,
    },
  );

  try {
    return JSON.parse(text) as { score: number; feedback: string; improved: string };
  } catch {
    return { score: 5, feedback: text.slice(0, 200), improved: content };
  }
}

// ── 6. generateAuditFlash — audit flash visibilité locale ────────────────────

/**
 * generateAuditFlash — génère un rapport d'audit flash de visibilité locale
 * pour convaincre un prospect ou donner une vision rapide à un client.
 *
 * @param apiKey        ANTHROPIC_API_KEY
 * @param businessName  Nom de l'établissement
 * @param sector        Secteur d'activité
 * @param city          Ville
 * @param issues        Problèmes détectés (ex: ["avis sans réponse", "fiche GMB incomplète"])
 */
export async function generateAuditFlash(
  apiKey: string,
  businessName: string,
  sector: string,
  city: string,
  issues: string[],
): Promise<string> {
  const { text } = await messageCompletion(
    apiKey,
    [
      {
        role: 'user',
        content: `Génère un audit flash de visibilité locale pour :

Établissement : ${businessName}
Secteur : ${sector}
Ville : ${city}
Problèmes détectés : ${issues.join(', ')}

Structure :
1. Score de visibilité actuel (sur 100) avec justification
2. Top 3 des problèmes critiques à corriger en urgence
3. Impact estimé si non corrigé (perte clients/mois)
4. Plan d'action sur 7 jours
5. Projection ROI si Kompilot est activé`,
      },
    ],
    {
      model:       DEFAULT_MODEL,
      temperature: 0.65,
      maxTokens:   1800,
      system: `Tu es un consultant en visibilité digitale locale, expert en référencement Google My Business,
réseaux sociaux et réputation en ligne pour commerces français.
Ton audit est percutant, chiffré et convaincant. Réponds en français.`,
    },
  );
  return text;
}
