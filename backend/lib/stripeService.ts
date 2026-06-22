/**
 * stripeService.ts — Service Stripe dédié pour Kompilot
 *
 * Centralise toutes les interactions avec l'API Stripe REST v1.
 * Exécuté côté Cloudflare Workers (pas de Node.js natif) → fetch() uniquement,
 * pas de SDK stripe-node (celui-ci nécessite Node Buffers non disponibles en CF Workers).
 *
 * Fonctions exposées :
 *   createCheckoutSession(params)    — génère un lien Stripe Checkout (hosted)
 *   createBillingPortalSession()     — lien vers le portail client Stripe
 *   handleWebhook(signature, body)   — vérifie + route les événements Stripe entrants
 *   getSubscription(subId)           — récupère une subscription Stripe
 *   cancelSubscription(subId)        — résilie une subscription Stripe
 *   getOrCreateCustomer(email, meta) — trouve ou crée un Stripe Customer
 *
 * Variables d'environnement requises (secrets Cloudflare Workers) :
 *   STRIPE_SECRET_KEY     — sk_test_xxx ou sk_live_xxx
 *   STRIPE_WEBHOOK_SECRET — whsec_xxx  (depuis le dashboard Stripe → Webhooks)
 *
 * Variables d'environnement optionnelles :
 *   STRIPE_PRICE_PRO    — price_xxx pour le forfait Pro (19€/mois)
 *   STRIPE_PRICE_EXPERT — price_xxx pour le forfait Expert (39€/mois)
 *
 * Référence API Stripe : https://stripe.com/docs/api
 */

// ── Constantes ─────────────────────────────────────────────────────────────────

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const FETCH_TIMEOUT   = 15_000; // 15 s — CF Workers limit

// ── Types internes ─────────────────────────────────────────────────────────────

/** Structure minimale d'un Stripe Customer */
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata: Record<string, string>;
}

/** Paramètres pour créer une session Checkout */
export interface CheckoutSessionParams {
  /** ID de prix Stripe (ex: price_xxx) */
  priceId: string;
  /** ID du Stripe Customer (ex: cus_xxx) */
  customerId: string;
  /** planId Kompilot (pro | expert) — stocké dans metadata */
  planId: string;
  /** userId Kompilot — stocké dans metadata + customer */
  userId: string;
  /** URL de redirection après paiement réussi */
  successUrl: string;
  /** URL de redirection si l'utilisateur annule */
  cancelUrl: string;
  /**
   * Nombre de jours d'essai gratuit (0 = pas d'essai).
   * Lorsque l'utilisateur renonce à son essai, passer 0 ici.
   */
  trialDays?: number;
  /** Autoriser la saisie d'un code promo dans Checkout */
  allowPromoCodes?: boolean;
}

/** Résultat de createCheckoutSession() */
export interface CheckoutSessionResult {
  success: boolean;
  /** URL Stripe Checkout à ouvrir dans un nouvel onglet */
  url?: string;
  /** ID de session Stripe (cs_xxx) */
  sessionId?: string;
  error?: string;
  statusCode?: number;
}

/** Résultat de createBillingPortalSession() */
export interface PortalSessionResult {
  success: boolean;
  url?: string;
  error?: string;
}

/** Événements Stripe traités par handleWebhook() */
export type StripeEventType =
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'checkout.session.completed'
  | 'customer.subscription.trial_will_end';

/** Résultat du traitement d'un webhook */
export interface WebhookHandleResult {
  handled: boolean;
  eventType: string;
  userId?: string;
  error?: string;
}

/** Erreur Stripe structurée */
export class StripeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly stripeCode?: string,
    public readonly declineCode?: string,
  ) {
    super(message);
    this.name = 'StripeError';
  }

  /** true si la clé API est invalide */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.stripeCode === 'api_key_expired';
  }

  /** true si le compte Stripe n'est pas configuré */
  get isConfigError(): boolean {
    return this.statusCode === 403 || this.stripeCode === 'account_invalid';
  }

  /** true si la carte est refusée */
  get isCardDeclined(): boolean {
    return this.stripeCode === 'card_declined';
  }
}

// ── Helper : fetch Stripe avec auth Basic ──────────────────────────────────────

/**
 * stripeFetch — wrapper HTTP vers l'API Stripe REST v1.
 *
 * Utilise l'authentification Basic (clé secrète en username, password vide).
 * CF Workers n'a pas accès au SDK stripe-node (Node Buffers requis) donc
 * toutes les requêtes passent par fetch() natif.
 *
 * @param secretKey STRIPE_SECRET_KEY (sk_test_... ou sk_live_...)
 * @param method    HTTP verb : GET | POST | DELETE
 * @param path      Chemin relatif (ex: "/customers")
 * @param body      Payload form-encoded (optionnel pour GET)
 */
async function stripeFetch<T>(
  secretKey: string,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  // Stripe API utilise application/x-www-form-urlencoded (pas JSON)
  const encodedBody = body
    ? Object.entries(body)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : undefined;

  let response: Response;
  try {
    response = await fetch(`${STRIPE_API_BASE}${path}`, {
      method,
      headers: {
        Authorization:  `Basic ${btoa(secretKey + ':')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-04-10', // version stable
      },
      ...(encodedBody ? { body: encodedBody } : {}),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new StripeError(
      msg.includes('abort') ? 'Timeout Stripe API (15s)' : `Erreur réseau Stripe : ${msg}`,
      0,
    );
  }
  clearTimeout(timer);

  const json = await response.json() as T & {
    error?: { message: string; code?: string; decline_code?: string; type?: string };
  };

  // Toute réponse HTTP 4xx/5xx de Stripe → StripeError
  if (!response.ok) {
    const err = (json as any).error;
    throw new StripeError(
      err?.message ?? `HTTP ${response.status}`,
      response.status,
      err?.code,
      err?.decline_code,
    );
  }

  return json;
}

// ── 1. getOrCreateCustomer — trouve ou crée un Stripe Customer ────────────────

/**
 * getOrCreateCustomer — retrouve un client Stripe existant via son email ou en
 * crée un nouveau. Stocke le userId Kompilot dans les métadonnées Stripe.
 *
 * @param secretKey STRIPE_SECRET_KEY
 * @param email     Email de l'utilisateur Kompilot
 * @param userId    ID interne Kompilot (stocké dans metadata pour retrouver plus tard)
 * @param name      Nom d'affichage (optionnel)
 */
export async function getOrCreateCustomer(
  secretKey: string,
  email: string,
  userId: string,
  name?: string,
): Promise<StripeCustomer> {
  // Rechercher d'abord un customer existant avec cet email
  const searchRes = await stripeFetch<{ data: StripeCustomer[] }>(
    secretKey, 'GET',
    `/customers?email=${encodeURIComponent(email)}&limit=1`,
  );

  if (searchRes.data.length > 0) {
    // Mettre à jour le userId dans metadata si absent
    const existing = searchRes.data[0];
    if (!existing.metadata?.kompilot_user_id) {
      await stripeFetch(secretKey, 'POST', `/customers/${existing.id}`, {
        'metadata[kompilot_user_id]': userId,
      });
      existing.metadata.kompilot_user_id = userId;
    }
    return existing;
  }

  // Créer un nouveau Stripe Customer
  const customer = await stripeFetch<StripeCustomer>(secretKey, 'POST', '/customers', {
    email,
    ...(name ? { name } : {}),
    'metadata[kompilot_user_id]': userId,
    description: `Kompilot user — ${userId}`,
  });

  return customer;
}

// ── 2. createCheckoutSession — génère un lien Stripe Checkout ─────────────────

/**
 * createCheckoutSession — crée une session Stripe Checkout hébergée (hosted).
 *
 * La session est créée en mode SUBSCRIPTION avec :
 *   - Préfill de l'email du customer (réduit la friction)
 *   - Métadonnées userId + planId (renvoyées dans les webhooks)
 *   - Support des codes promo (optionnel)
 *   - Période d'essai configurable (trialDays = 0 si l'utilisateur a renoncé)
 *
 * Le lien retourné doit être ouvert dans un NOUVEL ONGLET (window.open) car
 * Stripe bloque l'affichage dans les iframes pour des raisons de sécurité.
 *
 * @param secretKey STRIPE_SECRET_KEY
 * @param params    CheckoutSessionParams
 */
export async function createCheckoutSession(
  secretKey: string,
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  try {
    // Payload Stripe Checkout Session
    // Les champs imbriqués utilisent la notation bracket : line_items[0][price]
    const payload: Record<string, string | number | boolean | undefined> = {
      'payment_method_types[0]':           'card',
      'mode':                              'subscription',
      'customer':                          params.customerId,
      'line_items[0][price]':              params.priceId,
      'line_items[0][quantity]':           1,
      'success_url':                       params.successUrl,
      'cancel_url':                        params.cancelUrl,
      // Métadonnées transmises dans tous les webhooks associés à cette session
      'metadata[userId]':                  params.userId,
      'metadata[planId]':                  params.planId,
      'metadata[kompilot_source]':         'checkout_session',
      // Transmission aux subscription.metadata via subscription_data
      'subscription_data[metadata][userId]':  params.userId,
      'subscription_data[metadata][planId]':  params.planId,
      // Codes promo
      'allow_promotion_codes':             params.allowPromoCodes ?? true,
      // Politique de facturation : collecter la TVA automatiquement
      'automatic_tax[enabled]':            false,
    };

    // Période d'essai : uniquement si trialDays > 0
    if (params.trialDays && params.trialDays > 0) {
      payload['subscription_data[trial_period_days]'] = params.trialDays;
    }

    const session = await stripeFetch<{ id: string; url: string }>(
      secretKey, 'POST', '/checkout/sessions', payload,
    );

    return {
      success:   true,
      url:       session.url,
      sessionId: session.id,
    };

  } catch (err) {
    if (err instanceof StripeError) {
      // Erreurs spécifiques avec messages utilisateur français
      let errorMsg = err.message;
      if (err.isAuthError) {
        errorMsg = 'Clé Stripe invalide. Vérifiez STRIPE_SECRET_KEY dans les secrets Cloudflare.';
      } else if (err.isConfigError) {
        errorMsg = 'Compte Stripe non configuré ou suspendu.';
      } else if (err.statusCode === 400 && err.stripeCode === 'resource_missing') {
        errorMsg = `Price ID introuvable : "${params.priceId}". Vérifiez STRIPE_PRICE_PRO / STRIPE_PRICE_EXPERT.`;
      }
      return { success: false, error: errorMsg, statusCode: err.statusCode };
    }
    return { success: false, error: String(err), statusCode: 500 };
  }
}

// ── 3. createBillingPortalSession — lien portail client ───────────────────────

/**
 * createBillingPortalSession — crée un lien vers le Portail de Facturation Stripe.
 *
 * Le portail permet au client de :
 *   - Gérer ses moyens de paiement
 *   - Voir ses factures
 *   - Résilier ou changer de plan
 *
 * @param secretKey   STRIPE_SECRET_KEY
 * @param customerId  Stripe Customer ID (cus_xxx)
 * @param returnUrl   URL de retour après le portail (ex: https://app.kompilot.fr/compte)
 */
export async function createBillingPortalSession(
  secretKey: string,
  customerId: string,
  returnUrl: string,
): Promise<PortalSessionResult> {
  try {
    const session = await stripeFetch<{ url: string }>(
      secretKey, 'POST', '/billing_portal/sessions',
      { customer: customerId, return_url: returnUrl },
    );
    return { success: true, url: session.url };
  } catch (err) {
    if (err instanceof StripeError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: String(err) };
  }
}

// ── 4. handleWebhook — intercepte et route les événements Stripe ──────────────

/**
 * handleWebhook — vérifie la signature Stripe et route les événements entrants.
 *
 * SÉCURITÉ : La vérification de signature HMAC-SHA256 est obligatoire pour
 * s'assurer que l'événement vient bien de Stripe et n'a pas été falsifié.
 * En cas d'échec de vérification, retourner HTTP 400 immédiatement.
 *
 * Événements traités :
 *   checkout.session.completed        → abonnement activé (après paiement réussi)
 *   invoice.paid                      → renouvellement mensuel confirmé
 *   invoice.payment_failed            → paiement échoué (déclencher alerte + période de grâce)
 *   customer.subscription.deleted     → résiliation → downgrade vers plan gratuit
 *   customer.subscription.updated     → changement de plan (upgrade/downgrade)
 *   customer.subscription.trial_will_end → rappel J-3 avant fin d'essai
 *
 * @param signature   Valeur de l'en-tête HTTP `Stripe-Signature`
 * @param rawBody     Corps brut de la requête (string, non-parsé)
 * @param webhookSecret STRIPE_WEBHOOK_SECRET (whsec_xxx)
 */
export async function handleWebhook(
  signature: string,
  rawBody: string,
  webhookSecret: string,
): Promise<{
  valid: boolean;
  event?: { type: string; data: { object: Record<string, unknown> } };
  error?: string;
}> {
  // ── Vérification de la signature HMAC-SHA256 ───────────────────────────────
  // Stripe utilise le format : t=timestamp,v1=hex_signature
  try {
    const parts = signature.split(',');
    const t  = parts.find(p => p.startsWith('t='))?.slice(2);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);

    if (!t || !v1) {
      return { valid: false, error: 'Signature Stripe malformée : t ou v1 manquant.' };
    }

    // Le payload signé est la concaténation : timestamp + "." + corps brut
    const signedPayload = `${t}.${rawBody}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Comparaison en temps constant pour éviter les timing attacks
    if (expected.length !== v1.length) {
      return { valid: false, error: 'Signature Stripe invalide (longueur différente).' };
    }
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
    }
    if (mismatch !== 0) {
      return { valid: false, error: 'Signature Stripe invalide (HMAC ne correspond pas).' };
    }

    // ── Signature valide → parser l'événement ─────────────────────────────
    const event = JSON.parse(rawBody) as {
      type: string;
      data: { object: Record<string, unknown> };
    };

    console.log(`[stripeService/webhook] Événement reçu : ${event.type}`);

    return { valid: true, event };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Erreur de vérification : ${msg}` };
  }
}

// ── 5. getSubscription — récupère une subscription Stripe ─────────────────────

/**
 * getSubscription — récupère les détails d'une subscription Stripe.
 *
 * @param secretKey STRIPE_SECRET_KEY
 * @param subId     Stripe Subscription ID (sub_xxx)
 */
export async function getSubscription(
  secretKey: string,
  subId: string,
): Promise<{
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  customerId: string;
  planId?: string;
}> {
  const sub = await stripeFetch<{
    id: string;
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    customer: string;
    metadata: Record<string, string>;
  }>(secretKey, 'GET', `/subscriptions/${subId}`);

  return {
    id:                sub.id,
    status:            sub.status,
    currentPeriodEnd:  sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    customerId:        sub.customer,
    planId:            sub.metadata?.planId,
  };
}

// ── 6. cancelSubscription — résilie une subscription ─────────────────────────

/**
 * cancelSubscription — résilie une subscription Stripe à la fin de la période.
 *
 * Par défaut cancel_at_period_end = true (résiliation au prochain renouvellement)
 * pour laisser l'accès jusqu'à la fin de la période payée.
 *
 * @param secretKey STRIPE_SECRET_KEY
 * @param subId     Stripe Subscription ID (sub_xxx)
 * @param immediately Si true, résiliation immédiate (pro-rata remboursé par Stripe)
 */
export async function cancelSubscription(
  secretKey: string,
  subId: string,
  immediately = false,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    if (immediately) {
      // Résiliation immédiate : DELETE /subscriptions/:id
      const result = await stripeFetch<{ id: string; status: string }>(
        secretKey, 'DELETE', `/subscriptions/${subId}`,
      );
      return { success: true, status: result.status };
    } else {
      // Résiliation différée : PATCH cancel_at_period_end=true
      const result = await stripeFetch<{ id: string; status: string }>(
        secretKey, 'POST', `/subscriptions/${subId}`,
        { cancel_at_period_end: true },
      );
      return { success: true, status: result.status };
    }
  } catch (err) {
    if (err instanceof StripeError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: String(err) };
  }
}

// ── 7. extractUserIdFromEvent — helper webhook ────────────────────────────────

/**
 * extractUserIdFromEvent — extrait le userId Kompilot depuis un événement Stripe.
 *
 * Cherche dans :
 *   1. event.data.object.metadata.userId (subscription, checkout.session)
 *   2. event.data.object.subscription_details.metadata.userId (invoice)
 *   3. event.data.object.metadata.user_id (compatibilité legacy)
 *
 * @param obj L'objet Stripe de l'événement (event.data.object)
 */
export function extractUserIdFromEvent(obj: Record<string, unknown>): string | null {
  const meta = (obj.metadata as Record<string, string>) ?? {};
  return (
    meta.userId         ||
    meta.user_id        ||
    (obj.subscription_details as any)?.metadata?.userId  ||
    null
  );
}

// ── 8. extractCustomerIdFromEvent — helper webhook ────────────────────────────

/**
 * extractCustomerIdFromEvent — extrait le Stripe Customer ID depuis un événement.
 *
 * @param obj L'objet Stripe de l'événement
 */
export function extractCustomerIdFromEvent(obj: Record<string, unknown>): string | null {
  return (obj.customer as string) || null;
}
