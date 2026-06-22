/**
 * cowork.ts — Pipeline IA séquentiel OpenAI × Claude pour Kompilot
 *
 * Flux de traitement :
 *
 *   [Brief utilisateur : objectif + cible + produit + ton de marque]
 *       │
 *       ▼
 *   ┌─ ÉTAPE 1 ─────────────────────────────────────────────────────┐
 *   │  GPT-4o (OpenAIService)                                        │
 *   │  Rôle : Stratège marketing digital senior                      │
 *   │  Produit → JSON { angles[], hooks[], calendar, strategicNotes }│
 *   └───────────────────────────────────────────────────────────────┘
 *       │  rawText (réponse brute complète) ──────────────────────────┐
 *       ▼                                                             │ transmission
 *   ┌─ ÉTAPE 2 ─────────────────────────────────────────────────────┐ │ documentée
 *   │  Claude 3.5 Sonnet (ClaudeService)                             │◄┘
 *   │  Rôle : Expert copywriting + psychologie de conversion         │
 *   │  Reçoit : brief original + rawText GPT-4o                      │
 *   │  Produit → JSON { critique, refinedHooks[], adCopies[], tip }  │
 *   └───────────────────────────────────────────────────────────────┘
 *       │
 *       ▼
 *   [Résultat final : openaiDraft{} + claudeRefinement{} + metadata]
 *
 * Résilience :
 *   - Si GPT-4o échoue → erreur 502 immédiate (pas de donnée à transmettre)
 *   - Si Claude échoue → résultat partiel renvoyé (openai OK, claude = null)
 *     avec claude_error dans la réponse pour que le frontend l'affiche
 *
 * Routes :
 *   POST /api/cowork/generate-campaign   — pipeline complet (PROD)
 *   POST /api/cowork/openai-draft        — étape 1 seule (debug)
 *   POST /api/cowork/claude-refine       — étape 2 seule (debug)
 *   GET  /api/cowork/health              — santé des deux clés API
 */

import { Hono }              from 'hono';
import { createClient }      from '@blinkdotnew/sdk';
import { chatCompletion }    from '../lib/openaiService';
import { messageCompletion } from '../lib/claudeService';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Brief complet soumis par l'utilisateur */
export interface CampaignBrief {
  /** Objectif principal de la campagne */
  objective: string;
  /** Description de l'audience cible */
  target: string;
  /** Produit ou service à promouvoir */
  product: string;
  /**
   * Ton de la marque (nouveau champ).
   * Exemples : "chaleureux et humain", "expert et premium", "dynamique et jeune"
   * Utilisé dans les deux system prompts pour cohérence tonale.
   */
  brandTone?: string;
  /** Budget mensuel estimé en euros (optionnel) */
  budget?: number;
  /** Canaux de diffusion (optionnel) */
  channels?: string[];
  /** Durée de la campagne en jours (optionnel, défaut 30) */
  durationDays?: number;
}

/** Brouillon structuré produit par GPT-4o (Étape 1) */
export interface OpenAIDraft {
  /** 3 angles stratégiques différenciants */
  angles: string[];
  /** 3 accroches courtes (<15 mots) */
  hooks: string[];
  /** Planning de diffusion en texte structuré */
  calendar: string;
  /** Notes stratégiques complémentaires */
  strategicNotes?: string;
  /**
   * Réponse brute complète de GPT-4o.
   * Transmise intégralement à Claude à l'étape 2 pour permettre
   * une critique honnête sans troncature.
   */
  rawText: string;
  /** Tokens consommés */
  tokensUsed: number;
  /** Durée de l'appel en ms */
  durationMs: number;
}

/** Un texte publicitaire finalisé (hook + corps + CTA + canal) */
export interface AdCopy {
  hook:    string;
  body:    string;
  cta:     string;
  channel: string;
}

/** Raffinement produit par Claude 3.5 Sonnet (Étape 2) */
export interface ClaudeRefinement {
  /** Critique constructive honnête du travail de GPT-4o */
  critique: string;
  /** Accroches réécrites, percutantes, avec déclencheur émotionnel */
  refinedHooks: string[];
  /** Textes publicitaires complets par canal */
  adCopies: AdCopy[];
  /** Conseil stratégique bonus non mentionné par GPT-4o */
  finalTip: string;
  /** Tokens consommés */
  tokensUsed: number;
  /** Durée de l'appel en ms */
  durationMs: number;
}

/** Réponse complète renvoyée au client */
export interface CoworkCampaignResult {
  status:      'success' | 'partial';
  brief:       CampaignBrief;
  openai:      OpenAIDraft;
  /**
   * null uniquement si Claude a échoué (status = 'partial').
   * Dans ce cas, claude_error contient le message d'erreur.
   */
  claude:      ClaudeRefinement | null;
  claude_error?: string;
  /** Durée totale du pipeline en ms */
  totalDurationMs: number;
  generatedAt: string;
}

// ── Env bindings ──────────────────────────────────────────────────────────────

interface Env {
  BLINK_PROJECT_ID: string;
  BLINK_SECRET_KEY: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

router.use('/api/cowork/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.' }, 401);
  }
  const blink = createClient({
    projectId: c.env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: c.env.BLINK_SECRET_KEY,
  });
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const auth  = await blink.auth.verifyToken(token);
    if (!auth?.valid) return c.json({ error: 'Token invalide ou expiré.' }, 401);
  } catch {
    return c.json({ error: 'Échec de la vérification du token Blink.' }, 401);
  }
  await next();
});

// ── Helper : parse JSON même depuis un bloc markdown ```json…``` ──────────────

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return JSON.parse(match ? match[1] : text) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 1 — GPT-4o : génération de la structure brute
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateOpenAIDraft
 *
 * Appelle GPT-4o via chatCompletion() avec un system prompt de stratège.
 * Le ton de marque (brandTone) est injecté dans les deux prompts pour
 * garantir la cohérence tonale de la campagne.
 *
 * Sortie : JSON strictement typé + rawText brut conservé pour transmission à Claude.
 *
 * @param apiKey  OPENAI_API_KEY (depuis les env CF Workers)
 * @param brief   Brief complet de l'utilisateur
 */
async function generateOpenAIDraft(
  apiKey: string,
  brief: CampaignBrief,
): Promise<OpenAIDraft> {
  const t0       = Date.now();
  const channels = brief.channels?.join(', ') ?? 'Instagram, Facebook, Google Ads';
  const duration = brief.durationDays ?? 30;
  const budget   = brief.budget ? `${brief.budget}€/mois` : 'à définir';
  const tone     = brief.brandTone?.trim() || 'professionnel et bienveillant';

  // ── System prompt : GPT-4o = stratège marketing digital senior ────────────
  const systemPrompt = `Tu es un stratège marketing digital senior spécialisé en publicité locale pour PME françaises.
Ton de la marque à respecter impérativement : "${tone}".
Réponds UNIQUEMENT en JSON valide sans texte ni markdown autour. Structure exacte :
{
  "angles": ["angle1", "angle2", "angle3"],
  "hooks": ["accroche1", "accroche2", "accroche3"],
  "calendar": "planning hebdomadaire structuré sur ${duration} jours",
  "strategicNotes": "2-3 phrases de contexte stratégique"
}`;

  // ── User prompt : brief détaillé ──────────────────────────────────────────
  const userPrompt = `Génère la structure brute d'une campagne marketing :

PRODUIT / SERVICE : ${brief.product}
OBJECTIF          : ${brief.objective}
CIBLE             : ${brief.target}
TON DE MARQUE     : ${tone}
BUDGET            : ${budget}
CANAUX            : ${channels}
DURÉE             : ${duration} jours

Fournis :
1. 3 angles d'attaque stratégiques DIFFÉRENCIANTS (pas génériques)
2. 3 accroches <15 mots, ton "${tone}", déclencheur émotionnel fort
3. Calendrier de diffusion sur ${duration} jours avec fréquences par canal

IMPORTANT : Claude va recevoir ta réponse brute et la critiquer. Sois précis et original.`;

  const { text, tokensUsed } = await chatCompletion(
    apiKey,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    { model: 'gpt-4o', temperature: 0.75, maxTokens: 1400 },
  );

  // ── Parse la réponse JSON de GPT-4o ──────────────────────────────────────
  type Raw = { angles?: string[]; hooks?: string[]; calendar?: string; strategicNotes?: string };
  const parsed = safeParseJSON<Raw>(text, {});

  return {
    angles:         Array.isArray(parsed.angles) ? parsed.angles : [],
    hooks:          Array.isArray(parsed.hooks)  ? parsed.hooks  : [],
    calendar:       parsed.calendar       ?? '',
    strategicNotes: parsed.strategicNotes ?? '',
    rawText:        text,   // ← conservé tel quel pour la transmission à Claude
    tokensUsed:     tokensUsed ?? 0,
    durationMs:     Date.now() - t0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 2 — Claude 3.5 Sonnet : critique + raffinement + copywriting final
// ─────────────────────────────────────────────────────────────────────────────

/**
 * refineWithClaude
 *
 * Reçoit le brief original + le rawText intégral de GPT-4o.
 * Claude joue le rôle d'expert copywriter / psychologue de la conversion.
 *
 * ── Données transmises depuis l'étape 1 ──────────────────────────────────────
 * Le `openaiDraft.rawText` est passé mot pour mot dans le user prompt de Claude,
 * encadré de balises [GPT-4o OUTPUT START] / [GPT-4o OUTPUT END] pour que Claude
 * sache exactement ce qu'il doit critiquer sans ambiguïté.
 *
 * Le brief original est également retransmis pour que Claude garde le contexte
 * complet (objectif, cible, ton) sans dépendre uniquement du résumé de GPT-4o.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * @param apiKey      ANTHROPIC_API_KEY
 * @param brief       Brief original de l'utilisateur (re-transmis à Claude)
 * @param openaiDraft Brouillon de l'étape 1 (rawText inclus)
 */
async function refineWithClaude(
  apiKey: string,
  brief: CampaignBrief,
  openaiDraft: OpenAIDraft,
): Promise<ClaudeRefinement> {
  const t0       = Date.now();
  const channels = brief.channels?.join(', ') ?? 'Instagram, Facebook, Google Ads';
  const tone     = brief.brandTone?.trim() || 'professionnel et bienveillant';

  // ── System prompt : Claude = expert copywriting + psychologie conversion ──
  const systemPrompt = `Tu es un expert en copywriting et en psychologie de la conversion, spécialisé dans la publicité locale française.
Tu travailles EN COLLABORATION avec GPT-4o : ton rôle est de critiquer honnêtement son travail puis de l'améliorer significativement.
Ton de la marque à respecter impérativement : "${tone}".
Réponds UNIQUEMENT en JSON valide, sans texte ni markdown autour. Structure exacte :
{
  "critique": "2-3 phrases de critique constructive et honnête du travail de GPT-4o",
  "refinedHooks": ["accroche améliorée 1", "accroche améliorée 2", "accroche améliorée 3"],
  "adCopies": [
    { "hook": "accroche", "body": "corps du texte (2-3 phrases)", "cta": "appel à l'action clair", "channel": "Instagram" },
    { "hook": "accroche", "body": "corps du texte (2-3 phrases)", "cta": "appel à l'action clair", "channel": "Facebook" },
    { "hook": "accroche", "body": "corps du texte (2-3 phrases)", "cta": "appel à l'action clair", "channel": "Google Ads" }
  ],
  "finalTip": "Un conseil stratégique bonus que GPT-4o n'a PAS mentionné"
}`;

  // ── User prompt : brief original RE-TRANSMIS + sortie brute de GPT-4o ─────
  //
  // NOTE DE TRANSMISSION (visible dans les logs backend) :
  // openaiDraft.rawText est transmis intégralement depuis l'étape 1.
  // Claude reçoit exactement ce que GPT-4o a produit, sans filtrage,
  // ce qui lui permet de faire une critique factuelle et précise.
  //
  const userPrompt = `
=== BRIEF ORIGINAL DE L'UTILISATEUR (contexte complet) ===
Produit / Service : ${brief.product}
Objectif          : ${brief.objective}
Cible             : ${brief.target}
Ton de marque     : ${tone}
Canaux            : ${channels}

=== SORTIE BRUTE DE GPT-4o — ÉTAPE 1 (transmission intégrale) ===
[GPT-4o OUTPUT START]
${openaiDraft.rawText}
[GPT-4o OUTPUT END]
Tokens GPT-4o utilisés : ${openaiDraft.tokensUsed} | Durée : ${openaiDraft.durationMs}ms
=== FIN TRANSMISSION GPT-4o ===

=== TON TRAVAIL (étape 2) ===
1. CRITIQUE — Identifie ce qui manque de mordant, ce qui est trop générique,
   ce qui ne correspond pas au ton "${tone}" ou à la cible.
   Sois honnête : une critique molle n'aide personne.

2. ACCROCHES AMÉLIORÉES — Réécris les 3 accroches avec :
   - Un déclencheur émotionnel ou un chiffre concret
   - Le ton "${tone}" de la marque
   - Une spécificité locale ou sectorielle (pas du générique)
   - Urgence ou curiosité

3. TEXTES PUBLICITAIRES FINAUX — 3 ad copies complets (un par canal)
   avec hook percutant, body de 2-3 phrases et CTA actionnable.

4. CONSEIL BONUS — Quelque chose que GPT-4o n'a PAS mentionné.

JSON uniquement.`.trim();

  const { text, inputTokens, outputTokens } = await messageCompletion(
    apiKey,
    [{ role: 'user', content: userPrompt }],
    {
      system:      systemPrompt,
      model:       'claude-3-5-sonnet-20241022',
      temperature: 0.70,
      maxTokens:   2200,
    },
  );

  // ── Parse la réponse JSON de Claude ──────────────────────────────────────
  type RawClaude = {
    critique?:     string;
    refinedHooks?: string[];
    adCopies?:     AdCopy[];
    finalTip?:     string;
  };
  const parsed = safeParseJSON<RawClaude>(text, {});

  return {
    critique:     parsed.critique     ?? 'Analyse non disponible.',
    refinedHooks: Array.isArray(parsed.refinedHooks) ? parsed.refinedHooks : openaiDraft.hooks,
    adCopies:     Array.isArray(parsed.adCopies)     ? parsed.adCopies     : [],
    finalTip:     parsed.finalTip     ?? '',
    tokensUsed:   (inputTokens ?? 0) + (outputTokens ?? 0),
    durationMs:   Date.now() - t0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cowork/generate-campaign — pipeline complet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pipeline principal OpenAI → Claude.
 *
 * Gestion d'erreur à deux niveaux :
 *   • Si GPT-4o échoue → 502 immédiat (impossible de transmettre à Claude)
 *   • Si Claude échoue → 200 "partial" avec openai OK + claude_error
 *     Le frontend affiche alors les résultats GPT-4o + un message d'erreur Claude.
 *
 * Body JSON attendu :
 * {
 *   "objective"  : "attirer 30 nouveaux clients le week-end",
 *   "target"     : "familles avec enfants dans un rayon de 10 km",
 *   "product"    : "pizzeria artisanale",
 *   "brandTone"  : "chaleureux, familial et gourmand",
 *   "budget"     : 800,
 *   "channels"   : ["Instagram", "Facebook", "Google Ads"],
 *   "durationDays": 30
 * }
 */
router.post('/api/cowork/generate-campaign', async (c) => {
  const pipelineStart = Date.now();
  const openaiKey = c.env.OPENAI_API_KEY     ?? '';
  const claudeKey = c.env.ANTHROPIC_API_KEY  ?? '';

  // ── Validation des clés API ────────────────────────────────────────────────
  if (!openaiKey || !openaiKey.startsWith('sk-')) {
    return c.json({
      error: 'OPENAI_API_KEY non configuré ou invalide (doit commencer par sk-).',
      step:  'validation',
    }, 503);
  }
  if (!claudeKey || !claudeKey.startsWith('sk-ant-')) {
    return c.json({
      error: 'ANTHROPIC_API_KEY non configuré ou invalide (doit commencer par sk-ant-).',
      step:  'validation',
    }, 503);
  }

  // ── Parse + validation du brief ───────────────────────────────────────────
  let brief: CampaignBrief;
  try {
    brief = await c.req.json<CampaignBrief>();
  } catch {
    return c.json({ error: 'Corps de requête JSON invalide.', step: 'parse' }, 400);
  }

  const missing = (['objective', 'target', 'product'] as const).filter(k => !brief[k]?.trim());
  if (missing.length > 0) {
    return c.json({
      error: `Paramètres requis manquants : ${missing.join(', ')}.`,
      step:  'validation',
    }, 400);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1 — GPT-4o génère la structure brute
  // ─────────────────────────────────────────────────────────────────────────
  let openaiDraft: OpenAIDraft;
  try {
    console.log(`[cowork] ▶ Étape 1 : GPT-4o — produit="${brief.product}", ton="${brief.brandTone ?? 'défaut'}"`);
    openaiDraft = await generateOpenAIDraft(openaiKey, brief);
    console.log(`[cowork] ✔ GPT-4o terminé en ${openaiDraft.durationMs}ms — ${openaiDraft.tokensUsed} tokens`);
    console.log(`[cowork] ↓ Transmission rawText (${openaiDraft.rawText.length} chars) → Claude`);
  } catch (err) {
    // GPT-4o a échoué → on ne peut rien transmettre à Claude → erreur fatale
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cowork] ✗ GPT-4o FAILED:', msg);
    return c.json({
      error: `Étape 1 (GPT-4o) a échoué : ${msg}`,
      step:  'openai',
    }, 502);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2 — Claude 3.5 Sonnet critique et affine
  // openaiDraft.rawText est transmis ici intégralement à Claude.
  // ─────────────────────────────────────────────────────────────────────────
  let claudeRefinement: ClaudeRefinement | null = null;
  let claudeError: string | undefined;

  try {
    console.log(`[cowork] ▶ Étape 2 : Claude 3.5 Sonnet — critique + raffinement`);
    claudeRefinement = await refineWithClaude(claudeKey, brief, openaiDraft);
    console.log(`[cowork] ✔ Claude terminé en ${claudeRefinement.durationMs}ms — ${claudeRefinement.tokensUsed} tokens`);
  } catch (err) {
    // Claude a échoué → résultat partiel : on renvoie OpenAI OK + erreur Claude
    claudeError = err instanceof Error ? err.message : String(err);
    console.error('[cowork] ✗ Claude FAILED (résultat partiel):', claudeError);
  }

  // ── Résultat final ────────────────────────────────────────────────────────
  const result: CoworkCampaignResult = {
    status:         claudeRefinement ? 'success' : 'partial',
    brief,
    openai:         openaiDraft,
    claude:         claudeRefinement,
    claude_error:   claudeError,
    totalDurationMs: Date.now() - pipelineStart,
    generatedAt:    new Date().toISOString(),
  };

  console.log(`[cowork] Pipeline terminé en ${result.totalDurationMs}ms — statut: ${result.status}`);
  return c.json(result, 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cowork/health — santé des deux clés API
// ─────────────────────────────────────────────────────────────────────────────

router.get('/api/cowork/health', async (c) => {
  return c.json({
    openai:   { configured: !!(c.env.OPENAI_API_KEY?.startsWith('sk-')) },
    claude:   { configured: !!(c.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) },
    checkedAt: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cowork/openai-draft — étape 1 seule (debug)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/api/cowork/openai-draft', async (c) => {
  const openaiKey = c.env.OPENAI_API_KEY ?? '';
  if (!openaiKey?.startsWith('sk-')) {
    return c.json({ error: 'OPENAI_API_KEY non configuré.' }, 503);
  }
  try {
    const brief = await c.req.json<CampaignBrief>();
    return c.json(await generateOpenAIDraft(openaiKey, brief));
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cowork/claude-refine — étape 2 seule (debug)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/api/cowork/claude-refine', async (c) => {
  const claudeKey = c.env.ANTHROPIC_API_KEY ?? '';
  if (!claudeKey?.startsWith('sk-ant-')) {
    return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);
  }
  try {
    const { brief, openaiDraft } = await c.req.json<{
      brief: CampaignBrief;
      openaiDraft: OpenAIDraft;
    }>();
    return c.json(await refineWithClaude(claudeKey, brief, openaiDraft));
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
