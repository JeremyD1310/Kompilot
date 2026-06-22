/**
 * openaiService.ts — Service OpenAI pour Kompilot
 *
 * Fournit un accès sécurisé à l'API OpenAI via le secret OPENAI_API_KEY
 * injecté dans les bindings Cloudflare Workers.
 *
 * Fonctions disponibles :
 *   checkOpenAIConnection()    — test de connectivité (mini chat-completion)
 *   generateCampaignIdeas()    — génération d'idées de campagnes publicitaires
 *   suggestContent()           — suggestions de contenu pour un post/réseau social
 *   optimizeSEO()              — optimisation SEO d'un texte ou méta-description
 *   generateAdCopy()           — rédaction d'un texte publicitaire (Facebook / Google)
 *
 * Variables d'environnement requises :
 *   OPENAI_API_KEY — clé API OpenAI (format sk-...)
 *
 * Référence API :
 *   https://platform.openai.com/docs/api-reference/chat
 */

// ── Constantes ─────────────────────────────────────────────────────────────────

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL   = 'gpt-4o';
const FAST_MODEL      = 'gpt-4o-mini';   // moins cher pour les tâches simples
const FETCH_TIMEOUT   = 15_000;          // 15 s — CF Workers limit

// ── Types ──────────────────────────────────────────────────────────────────────

/** Message au format OpenAI Chat Completions */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Résultat de checkOpenAIConnection() */
export interface OpenAIConnectionStatus {
  /** true si la clé est valide et le quota disponible */
  connected: boolean;
  /** Modèle interrogé */
  model?: string;
  /** Réponse renvoyée par le modèle (phrase courte) */
  response?: string;
  /** Tokens utilisés pour ce test */
  tokensUsed?: number;
  /** Message d'erreur si connected = false */
  error?: string;
  /** Code HTTP si applicable (401, 429, 500…) */
  statusCode?: number;
  /** Timestamp ISO de la vérification */
  checkedAt: string;
}

/** Options communes pour les appels de génération */
interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Structure interne d'une réponse Chat Completions */
interface OpenAIChatResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: { message: string; type: string; code: string };
}

// ── Classe d'erreur spécifique ────────────────────────────────────────────────

export class OpenAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'OpenAIError';
  }

  /** true si la clé API est invalide */
  get isAuthError(): boolean { return this.statusCode === 401; }

  /** true si le quota est épuisé ou la clé sans crédit */
  get isQuotaError(): boolean { return this.statusCode === 429 || this.code === 'insufficient_quota'; }

  /** true si le modèle demandé n'est pas accessible */
  get isModelError(): boolean { return this.statusCode === 404 || this.code === 'model_not_found'; }
}

// ── Helper fetch avec timeout ─────────────────────────────────────────────────

/**
 * openAIFetch — appel HTTP vers l'API OpenAI avec timeout AbortController.
 * Lance une OpenAIError structurée sur tout échec réseau ou HTTP.
 */
async function openAIFetch(
  endpoint: string,
  apiKey: string,
  body: object,
): Promise<OpenAIChatResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(`${OPENAI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new OpenAIError(
      msg.includes('abort') ? 'Timeout OpenAI API (15s)' : `Erreur réseau : ${msg}`,
      0,
    );
  }
  clearTimeout(timer);

  const json = await response.json() as OpenAIChatResponse;

  // L'API OpenAI peut renvoyer { error: {...} } avec status 4xx/5xx
  if (json.error || !response.ok) {
    const errMsg = json.error?.message ?? `HTTP ${response.status}`;
    const errCode = json.error?.code;
    throw new OpenAIError(errMsg, response.status, errCode);
  }

  return json;
}

// ── chatCompletion — wrapper central ─────────────────────────────────────────

/**
 * chatCompletion — envoie une liste de messages et retourne la réponse texte.
 * C'est le socle utilisé par toutes les fonctions spécialisées ci-dessous.
 *
 * @param apiKey   OPENAI_API_KEY depuis les env bindings CF Workers
 * @param messages Historique de conversation (système + utilisateur)
 * @param opts     Modèle, température, max tokens
 */
export async function chatCompletion(
  apiKey: string,
  messages: ChatMessage[],
  opts: GenerateOptions = {},
): Promise<{ text: string; tokensUsed: number }> {
  const json = await openAIFetch('/chat/completions', apiKey, {
    model:       opts.model       ?? DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens:  opts.maxTokens   ?? 500,
  });

  const text = json.choices[0]?.message?.content?.trim() ?? '';
  return { text, tokensUsed: json.usage?.total_tokens ?? 0 };
}

// ── 1. checkOpenAIConnection — test de connectivité ───────────────────────────

/**
 * checkOpenAIConnection — vérifie que la clé API OpenAI est valide et opérationnelle.
 *
 * Effectue un mini chat-completion avec gpt-4o-mini (plus économique)
 * pour valider :
 *   - la clé API (format et authenticité)
 *   - la disponibilité du crédit
 *   - la connectivité réseau depuis CF Workers
 *
 * @param apiKey OPENAI_API_KEY depuis les env bindings
 */
export async function checkOpenAIConnection(apiKey: string): Promise<OpenAIConnectionStatus> {
  const checkedAt = new Date().toISOString();

  if (!apiKey || !apiKey.startsWith('sk-')) {
    return {
      connected: false,
      error: 'OPENAI_API_KEY manquant ou format invalide (doit commencer par sk-).',
      checkedAt,
    };
  }

  try {
    const json = await openAIFetch('/chat/completions', apiKey, {
      model: FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant de test. Réponds uniquement par "Connexion OK" suivi d\'un emoji positif.',
        },
        { role: 'user', content: 'Test de connexion Kompilot.' },
      ],
      temperature: 0,
      max_tokens: 20,
    });

    return {
      connected: true,
      model: FAST_MODEL,
      response: json.choices[0]?.message?.content?.trim(),
      tokensUsed: json.usage?.total_tokens,
      checkedAt,
    };
  } catch (err) {
    if (err instanceof OpenAIError) {
      let errorMsg = err.message;
      if (err.isAuthError) {
        errorMsg = 'Clé API invalide (401). Vérifiez votre OPENAI_API_KEY dans les secrets.';
      } else if (err.isQuotaError) {
        errorMsg = 'Quota épuisé ou crédit insuffisant (429). Rechargez votre compte sur platform.openai.com.';
      } else if (err.isModelError) {
        errorMsg = 'Modèle non accessible. Vérifiez que votre compte a accès à gpt-4o-mini.';
      }
      return { connected: false, error: errorMsg, statusCode: err.statusCode, checkedAt };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: msg, checkedAt };
  }
}

// ── 2. generateCampaignIdeas — idées de campagnes publicitaires ───────────────

/**
 * generateCampaignIdeas — génère des idées de campagnes publicitaires
 * adaptées au secteur et à l'objectif d'un établissement.
 *
 * @param apiKey    OPENAI_API_KEY
 * @param sector    Secteur d'activité (ex. "restaurant", "salon de coiffure")
 * @param objective Objectif marketing (ex. "attirer de nouveaux clients", "fidéliser")
 * @param city      Ville cible (ex. "Paris", "Lyon")
 * @param budget    Budget mensuel indicatif en euros
 */
export async function generateCampaignIdeas(
  apiKey: string,
  sector: string,
  objective: string,
  city: string,
  budget: number,
): Promise<string> {
  const { text } = await chatCompletion(
    apiKey,
    [
      {
        role: 'system',
        content: `Tu es un expert en publicité locale pour PME françaises.
Génère 3 idées de campagnes publicitaires concrètes, chiffrées et actionnables.
Format : numérotées, avec titre, canal recommandé, budget estimé et KPI cible.
Réponds en français.`,
      },
      {
        role: 'user',
        content: `Secteur : ${sector}
Objectif : ${objective}
Ville : ${city}
Budget mensuel : ${budget}€

Propose 3 idées de campagnes adaptées.`,
      },
    ],
    { model: DEFAULT_MODEL, temperature: 0.8, maxTokens: 800 },
  );
  return text;
}

// ── 3. suggestContent — suggestions de posts pour réseaux sociaux ─────────────

/**
 * suggestContent — génère des suggestions de contenu pour un post sur
 * un réseau social donné, adapté au secteur et au ton de l'établissement.
 *
 * @param apiKey   OPENAI_API_KEY
 * @param topic    Sujet ou contexte du post (ex. "promotion de rentrée")
 * @param platform Réseau cible : "instagram" | "facebook" | "google"
 * @param sector   Secteur d'activité
 * @param tone     Ton : "professionnel" | "décontracté" | "enthousiaste"
 */
export async function suggestContent(
  apiKey: string,
  topic: string,
  platform: 'instagram' | 'facebook' | 'google',
  sector: string,
  tone: string = 'professionnel',
): Promise<string> {
  const platformRules: Record<string, string> = {
    instagram: 'Maximum 2 200 caractères, utilise des emojis, inclus 5 hashtags pertinents.',
    facebook:  'Maximum 500 caractères, ton conversationnel, inclus un call-to-action.',
    google:    'Maximum 1 500 caractères (Google Business Post), formel et informatif.',
  };

  const { text } = await chatCompletion(
    apiKey,
    [
      {
        role: 'system',
        content: `Tu es un expert en community management pour PME françaises.
Rédige un post ${platform} pour un ${sector}.
Règles : ${platformRules[platform]}
Ton : ${tone}. Réponds en français.`,
      },
      {
        role: 'user',
        content: `Sujet du post : ${topic}`,
      },
    ],
    { model: DEFAULT_MODEL, temperature: 0.9, maxTokens: 600 },
  );
  return text;
}

// ── 4. optimizeSEO — optimisation SEO ────────────────────────────────────────

/**
 * optimizeSEO — optimise un texte pour le SEO local et l'AEO (réponses IA).
 * Retourne une version améliorée avec keywords naturellement intégrés.
 *
 * @param apiKey      OPENAI_API_KEY
 * @param text        Texte original à optimiser (description, article, fiche GMB…)
 * @param keywords    Mots-clés cibles (ex. ["restaurant lyon", "cuisine italienne"])
 * @param targetCity  Ville de ciblage géographique
 */
export async function optimizeSEO(
  apiKey: string,
  text: string,
  keywords: string[],
  targetCity: string,
): Promise<string> {
  const { text: optimized } = await chatCompletion(
    apiKey,
    [
      {
        role: 'system',
        content: `Tu es un expert SEO local et AEO (Answer Engine Optimization) pour PME françaises.
Optimise le texte fourni pour :
  1. Le référencement local Google (mots-clés géolocalisés, champs sémantiques)
  2. La visibilité dans les réponses IA (ChatGPT, Google AI Overview, Perplexity)
  3. La lisibilité et le naturel (évite le keyword stuffing)
Conserve le sens original. Réponds uniquement avec le texte optimisé, sans commentaire.`,
      },
      {
        role: 'user',
        content: `Ville cible : ${targetCity}
Mots-clés cibles : ${keywords.join(', ')}

Texte original :
${text}`,
      },
    ],
    { model: DEFAULT_MODEL, temperature: 0.4, maxTokens: 1000 },
  );
  return optimized;
}

// ── 5. generateAdCopy — rédaction de texte publicitaire ──────────────────────

/**
 * generateAdCopy — génère un texte publicitaire prêt à l'emploi
 * pour Facebook Ads, Google Ads ou Meta Ads.
 *
 * @param apiKey       OPENAI_API_KEY
 * @param product      Offre ou produit à promouvoir
 * @param targetAudience Description de l'audience cible
 * @param platform     "facebook" | "google" | "instagram"
 * @param urgency      true = ajouter une notion d'urgence / limited offer
 */
export async function generateAdCopy(
  apiKey: string,
  product: string,
  targetAudience: string,
  platform: 'facebook' | 'google' | 'instagram',
  urgency: boolean = false,
): Promise<{ headline: string; body: string; cta: string }> {
  const { text } = await chatCompletion(
    apiKey,
    [
      {
        role: 'system',
        content: `Tu es un copywriter publicitaire expert en ${platform} Ads pour PME françaises.
Génère un texte publicitaire structuré en JSON avec ces 3 champs :
  - headline (titre accrocheur, max 40 caractères)
  - body (texte principal, max 125 caractères)
  - cta (call-to-action, max 20 caractères)
${urgency ? 'Ajoute une notion d\'urgence ou de rareté.' : ''}
Réponds UNIQUEMENT avec le JSON, sans markdown ni commentaire.`,
      },
      {
        role: 'user',
        content: `Produit / offre : ${product}
Audience cible : ${targetAudience}`,
      },
    ],
    { model: DEFAULT_MODEL, temperature: 0.8, maxTokens: 200 },
  );

  try {
    return JSON.parse(text) as { headline: string; body: string; cta: string };
  } catch {
    // Fallback si le JSON est malformé
    return { headline: text.slice(0, 40), body: text.slice(40, 165), cta: 'En savoir plus' };
  }
}
