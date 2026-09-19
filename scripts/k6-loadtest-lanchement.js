/* global __ENV, __VU, __ITER */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kompilot — K6 Load Test Script (Launch Day Simulation)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Simulates 100 concurrent users over 5 minutes with ramp-up/down phases.
 * Each VU follows a realistic user journey:
 *   1. Landing page (GET /)
 *   2. Registration / Onboarding (POST /api/auth/register)
 *   3. Firebase profile check (GET /api/user/profile)
 *   4. Stripe webhook simulation (POST /api/webhooks/stripe)
 *
 * Usage:
 *   k6 run scripts/k6-loadtest-lanchement.js
 *   k6 run --env BASE_URL=https://staging.kompilot.fr scripts/k6-loadtest-lanchement.js
 *
 * Requires: k6 >= 0.47.0
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration — modifiable avant chaque run
// ═══════════════════════════════════════════════════════════════════════════

// URL de base — override via --env BASE_URL=https://...
const BASE_URL = __ENV.BASE_URL || 'https://www.kompilot.fr';

// Clé secrète Stripe (test mode) — pour signer les webhooks fictifs
const STRIPE_WEBHOOK_SECRET = __ENV.STRIPE_WEBHOOK_SECRET || '';

// Plan cible — 'starter' ou 'agency' (pour mixer les scénarios)
const TARGET_PLAN = __ENV.TARGET_PLAN || 'starter';

// ═══════════════════════════════════════════════════════════════════════════
// Custom Metrics
// ═══════════════════════════════════════════════════════════════════════════

const errors = new Counter('kompilot_errors');
const registrationSuccess = new Rate('kompilot_registration_success');
const profileLoadSuccess = new Rate('kompilot_profile_success');
const webhookSuccess = new Rate('kompilot_webhook_success');
const fullJourneyDuration = new Trend('kompilot_full_journey_duration');

// ═══════════════════════════════════════════════════════════════════════════
// Thresholds — critères de succès / échec du test
// ═══════════════════════════════════════════════════════════════════════════

export const options = {
  scenarios: {
    // Scénario principal : simulation d'utilisateurs réels
    launch_day_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Ramp-up : 0 → 50 VUs en 1 min
        { duration: '2m', target: 100 },  // Montée : 50 → 100 VUs en 2 min
        { duration: '2m', target: 100 },  // Plateau : 100 VUs maintenus 2 min
        { duration: '1m', target: 0 },    // Ramp-down : 100 → 0 VUs en 1 min
      ],
      gracefulRampDown: '30s', // Laisse les requêtes en cours se terminer
    },
  },

  thresholds: {
    // 95% des requêtes HTTP répondent en < 500ms
    'http_req_duration': ['p(95)<500', 'p(99)<1500'],
    // Taux d'erreur global < 1%
    'kompilot_errors': ['count<50'],
    // Taux de succès des inscriptions > 95%
    'kompilot_registration_success': ['rate>0.95'],
    // Taux de succès du chargement profil > 98%
    'kompilot_profile_success': ['rate>0.98'],
    // Taux de succès webhook > 99%
    'kompilot_webhook_success': ['rate>0.99'],
    // Durée totale du parcours < 8s (p95)
    'kompilot_full_journey_duration': ['p(95)<8000'],
    // Aucune requête ne doit timeout (> 10s)
    'http_req_failed': ['rate<0.01'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Génère un email unique par VU et par itération */
function generateFakeEmail(vuId, iterId) {
  const ts = Date.now();
  return `loadtest+vu${vuId}iter${iterId}+${ts}@kompilot-test.local`;
}

/** Génère un payload d'inscription réaliste */
function generateRegistrationPayload(vuId, iterId) {
  const plans = ['starter', 'agency'];
  const sectors = ['restauration', 'beaute', 'commerce', 'sante', 'sport'];
  const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Nice'];

  return JSON.stringify({
    email: generateFakeEmail(vuId, iterId),
    password: `LoadTest!${vuId}${iterId}#`,
    displayName: `Agence Test ${vuId}-${iterId}`,
    sector: sectors[Math.floor(Math.random() * sectors.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    planId: plans[Math.floor(Math.random() * plans.length)],
    acceptedCGV: true,
    acceptedPrivacy: true,
  });
}

/** Génère un payload Stripe webhook fictif (customer.subscription.created) */
function generateStripeWebhookPayload(vuId, iterId) {
  const plan = Math.random() > 0.3 ? 'starter' : 'agency';
  const priceId = plan === 'starter'
    ? 'price_starter_69eur_monthly'   // ← Remplacer par votre vrai Price ID Stripe
    : 'price_agency_149eur_monthly';   // ← Remplacer par votre vrai Price ID Stripe

  const customerId = `cus_loadtest_${vuId}_${iterId}`;
  const subscriptionId = `sub_loadtest_${vuId}_${iterId}_${Date.now()}`;

  return JSON.stringify({
    id: `evt_loadtest_${vuId}_${iterId}_${Date.now()}`,
    object: 'event',
    type: 'customer.subscription.created',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        items: {
          data: [{
            id: `si_loadtest_${vuId}`,
            price: {
              id: priceId,
              unit_amount: plan === 'starter' ? 6900 : 14900,
              currency: 'eur',
              recurring: { interval: 'month' },
            },
            quantity: 1,
          }],
        },
        metadata: {
          user_email: generateFakeEmail(vuId, iterId),
          plan_id: plan,
        },
      },
    },
  });
}

/** En-têtes HTTP communs */
function getHeaders(contentType = 'application/json') {
  const headers = {
    'Content-Type': contentType,
    'Accept': 'application/json',
    'User-Agent': 'Kompilot-K6-LoadTest/1.0',
  };
  return headers;
}

/**
 * Requête HTTP avec retry automatique et gestion d'erreur propre.
 * Si l'API met > 10s ou renvoie une erreur, affiche un message utilisateur
 * et retente une fois de manière asynchrone.
 */
function safeRequest(method, url, body, params = {}) {
  const maxRetries = 2;
  const timeout = '10s';
  let lastResponse = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestParams = {
        ...params,
        timeout,
        headers: {
          ...getHeaders(),
          ...(params.headers || {}),
        },
      };

      let res;
      if (method === 'GET') {
        res = http.get(url, requestParams);
      } else if (method === 'POST') {
        res = http.post(url, body, requestParams);
      }

      lastResponse = res;

      // Succès : retourner la réponse
      if (res.status >= 200 && res.status < 300) {
        return { success: true, response: res, attempt };
      }

      // Erreur serveur (5xx) → retry
      if (res.status >= 500 && attempt < maxRetries) {
        console.warn(
          `[Retry ${attempt}/${maxRetries}] L'IA est un peu surchargée, ` +
          `nous réessayons automatiquement dans quelques instants... ` +
          `(HTTP ${res.status} sur ${url})`
        );
        sleep(1); // Pause 1s avant retry
        continue;
      }

      // Erreur client (4xx) ou dernier retry échoué
      return { success: false, response: res, attempt, retried: attempt > 1 };

    } catch (err) {
      // Timeout ou erreur réseau
      if (attempt < maxRetries) {
        console.warn(
          `[Retry ${attempt}/${maxRetries}] L'IA est un peu surchargée, ` +
          `nous réessayons automatiquement dans quelques instants... ` +
          `(Erreur: ${err.message || 'timeout'})`
        );
        sleep(2); // Pause 2s avant retry réseau
        continue;
      }
      return { success: false, response: lastResponse, error: err.message, retried: true };
    }
  }

  return { success: false, response: lastResponse, retried: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Scénario principal — parcours utilisateur complet
// ═══════════════════════════════════════════════════════════════════════════

export default function () {
  const vuId = __VU;       // ID du Virtual User
  const iterId = __ITER;   // Numéro d'itération pour ce VU
  const journeyStart = Date.now();

  // ─────────────────────────────────────────────────────────────────────
  // Étape 1 — Arrivée sur la Landing Page
  // ─────────────────────────────────────────────────────────────────────

  group('1. Landing Page', function () {
    const res = safeRequest('GET', `${BASE_URL}/`, null, {
      tags: { step: 'landing', page: 'home' },
    });

    const checksPassed = check(res.response, {
      'Landing page — HTTP 200': (r) => r && r.status === 200,
      'Landing page — réponse < 2s': (r) => r && r.timings.duration < 2000,
      'Landing page — contient du HTML': (r) => r && r.body && r.body.length > 1000,
    });
    if (!checksPassed) errors.add(1);

    // Simulation du temps de lecture de la landing (3–8s)
    sleep(Math.random() * 5 + 3);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Étape 2 — Inscription / Onboarding
  // ─────────────────────────────────────────────────────────────────────

  let authToken = null;

  group('2. Inscription / Onboarding', function () {
    const payload = generateRegistrationPayload(vuId, iterId);

    const res = safeRequest('POST', `${BASE_URL}/api/auth/register`, payload, {
      tags: { step: 'register', plan: TARGET_PLAN },
    });

    const success = check(res.response, {
      'Inscription — HTTP 200 ou 201': (r) => r && (r.status === 200 || r.status === 201),
      'Inscription — réponse < 3s': (r) => r && r.timings.duration < 3000,
    }) || errors.add(1);

    registrationSuccess.add(success);

    // Extraire le token d'auth si disponible
    if (res.response && res.response.body) {
      try {
        const body = JSON.parse(res.response.body);
        authToken = body.token || body.accessToken || body.sessionToken || null;
      } catch (_) {
        // Body non-JSON — normal en environnement de test
      }
    }

    // Simulation du temps de complétion de l'onboarding (5–15s)
    sleep(Math.random() * 10 + 5);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Étape 3 — Vérification profil utilisateur (Firebase/Firestore)
  // ─────────────────────────────────────────────────────────────────────

  group('3. Profil Utilisateur (Firebase)', function () {
    const headers = authToken
      ? { 'Authorization': `Bearer ${authToken}` }
      : {};

    const res = safeRequest('GET', `${BASE_URL}/api/user/profile`, null, {
      headers,
      tags: { step: 'profile', source: 'firebase' },
    });

    const success = check(res.response, {
      'Profil — HTTP 200': (r) => r && r.status === 200,
      'Profil — réponse < 1s': (r) => r && r.timings.duration < 1000,
      'Profil — JSON valide': (r) => {
        if (!r || !r.body) return false;
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
    }) || errors.add(1);

    profileLoadSuccess.add(success);

    // Simulation du temps de consultation du dashboard (2–5s)
    sleep(Math.random() * 3 + 2);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Étape 4 — Webhook Stripe (simulation paiement réussi)
  // ─────────────────────────────────────────────────────────────────────

  group('4. Webhook Stripe (Paiement)', function () {
    const webhookPayload = generateStripeWebhookPayload(vuId, iterId);

    const res = safeRequest('POST', `${BASE_URL}/api/webhooks/stripe`, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1,v1=loadtest_fake_signature', // Signature fictive
      },
      tags: { step: 'webhook', provider: 'stripe' },
    });

    const success = check(res.response, {
      'Webhook Stripe — HTTP 200': (r) => r && r.status === 200,
      'Webhook Stripe — réponse < 2s': (r) => r && r.timings.duration < 2000,
      'Webhook Stripe — pas de timeout': (r) => r && r.timings.duration < 10000,
    }) || errors.add(1);

    webhookSuccess.add(success);

    // Simulation du temps post-paiement (affichage confirmation)
    sleep(Math.random() * 2 + 1);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Métriques du parcours complet
  // ─────────────────────────────────────────────────────────────────────

  const journeyDuration = Date.now() - journeyStart;
  fullJourneyDuration.add(journeyDuration);

  if (journeyDuration > 10000) {
    console.warn(
      `[VU ${vuId}] Parcours complet trop long: ${journeyDuration}ms ` +
      `(seuil: 10000ms) — l'application peut nécessiter une optimisation.`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle hooks — setup / teardown
// ═══════════════════════════════════════════════════════════════════════════

/** Exécuté une seule fois au démarrage du test */
export function setup() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Kompilot — Load Test Launch Day');
  console.log(`  Target : ${BASE_URL}`);
  console.log('  VUs    : 0 → 50 → 100 → 0 (ramp-up/down)');
  console.log('  Durée  : ~6 minutes total');
  console.log('═══════════════════════════════════════════════════════════════');

  // Vérification que le serveur est joignable avant de lancer le test
  const healthCheck = http.get(`${BASE_URL}/`, { timeout: '10s' });
  if (healthCheck.status !== 200) {
    console.error(
      `ERREUR: Le serveur ${BASE_URL} ne répond pas (HTTP ${healthCheck.status}). ` +
      `Vérifiez l'URL et réessayez.`
    );
  }

  return { startTime: new Date().toISOString() };
}

/** Exécuté une seule fois à la fin du test */
export function teardown(data) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Load Test terminé');
  console.log(`  Démarré : ${data.startTime}`);
  console.log(`  Terminé : ${new Date().toISOString()}`);
  console.log('  Consultez les résultats ci-dessus pour les métriques.');
  console.log('═══════════════════════════════════════════════════════════════');
}
