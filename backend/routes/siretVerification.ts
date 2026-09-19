/**
 * SIRET Verification & Company Registration Routes
 *
 * Routes:
 *   GET  /api/siret/verify/:siret            — verify SIRET + fetch company data
 *   GET  /api/siret/search?name=&city=        — search companies by name/city
 *   POST /api/siret/register-company          — register a new company (auth)
 *   POST /api/siret/join-request              — request to join a company (auth)
 *   GET  /api/siret/join-requests/:siret      — list join requests (auth, admin)
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

export const router = new Hono();

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

/**
 * Luhn check for a SIRET (14 digits).
 * SIREN = first 9 digits, NIC = next 4 digits, key = 14th digit.
 * Algorithm: double every even-position digit (1-indexed from right) of the
 * full 13-digit prefix, sum digit-wise, then check digit = (10 - sum%10) % 10.
 */
function isValidSiretLuhn(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(siret[i], 10);
    // Even index from the right (i.e. positions 0, 2, 4 … when counting from left
    // correspond to even positions when counting from right on a 14-digit number)
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(siret[13], 10);
}

/* ── GET /api/siret/verify/:siret ─────────────────────────────────────────── */

router.get('/api/siret/verify/:siret', async (c) => {
  try {
    const siret = c.req.param('siret')?.trim();
    if (!siret) return c.json({ error: 'SIRET parameter required' }, 400);

    const env = c.env as Record<string, string>;
    const pappersKey = env.PAPPERS_API_KEY || (env as any).PAPPERS_API_KEY;
    const blink = getBlink(env);

    // Check if already registered
    let alreadyRegistered = false;
    try {
      const existing = await blink.db.table<{ id: string }>('companies').list({
        where: { siret },
        limit: 1,
      });
      alreadyRegistered = existing.length > 0;
    } catch (dbErr: any) {
      console.error('[SIRET:verify] DB check error:', dbErr.message);
    }

    // If Pappers API key is available, use it for rich data
    if (pappersKey) {
      try {
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 8000);
        const res = await fetch(
          `https://api.pappers.fr/v2/entreprise?siret=${encodeURIComponent(siret)}&api_token=${encodeURIComponent(pappersKey)}`,
          { signal: ac.signal }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          return c.json({
            valid: true,
            verificationSource: 'pappers',
            verifiedAt: new Date().toISOString(),
            companyName: data.nom_entreprise || data.denomination || '',
            legalAddress: data.siege?.adresse_ligne_1 || data.siege?.adresse || '',
            city: data.siege?.ville || '',
            postalCode: data.siege?.code_postal || '',
            activityCode: data.code_naf || '',
            activityLabel: data.libelle_code_naf || '',
            legalForm: data.forme_juridique || '',
            alreadyRegistered,
          });
        }

        // Pappers returned non-200 — treat as invalid SIRET from their perspective
        if (res.status === 404 || res.status === 422) {
          return c.json({
            valid: false,
            verificationSource: 'pappers',
            verifiedAt: new Date().toISOString(),
            companyName: '',
            legalAddress: '',
            city: '',
            postalCode: '',
            activityCode: '',
            activityLabel: '',
            legalForm: '',
            alreadyRegistered,
          });
        }

        // For other errors (rate-limit, server error), fall through to Luhn
        console.warn('[SIRET:verify] Pappers returned', res.status, '— falling back to Luhn');
      } catch (fetchErr: any) {
        if (fetchErr.name !== 'AbortError') {
          console.warn('[SIRET:verify] Pappers fetch error:', fetchErr.message, '— falling back to Luhn');
        }
      }
    }

    // Fallback: Luhn validation only
    const valid = isValidSiretLuhn(siret);
    return c.json({
      valid,
      verificationSource: 'luhn',
      verifiedAt: new Date().toISOString(),
      companyName: '',
      legalAddress: '',
      city: '',
      postalCode: '',
      activityCode: '',
      activityLabel: '',
      legalForm: '',
      alreadyRegistered,
    });
  } catch (err: any) {
    console.error('[SIRET:verify] Unexpected error:', err.message);
    return c.json({ error: 'Internal error during SIRET verification' }, 500);
  }
});

/* ── GET /api/siret/search ────────────────────────────────────────────────── */

router.get('/api/siret/search', async (c) => {
  try {
    const name = c.req.query('name')?.trim();
    if (!name) return c.json({ error: 'name query parameter required' }, 400);

    const city = c.req.query('city')?.trim() || '';
    const env = c.env as Record<string, string>;
    const pappersKey = env.PAPPERS_API_KEY || (env as any).PAPPERS_API_KEY;

    if (!pappersKey) {
      return c.json({ results: [] });
    }

    const query = city ? `${name} ${city}` : name;

    try {
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 8000);
      const res = await fetch(
        `https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(query)}&api_token=${encodeURIComponent(pappersKey)}`,
        { signal: ac.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn('[SIRET:search] Pappers returned', res.status);
        return c.json({ results: [] });
      }

      const data: any = await res.json();
      const results = (data.resultats || []).map((r: any) => ({
        name: r.nom_entreprise || r.denomination || '',
        siret: r.siege?.siret || r.siret || '',
        city: r.siege?.ville || '',
        activity: r.libelle_code_naf || '',
      }));

      return c.json({ results });
    } catch (fetchErr: any) {
      if (fetchErr.name !== 'AbortError') {
        console.error('[SIRET:search] Fetch error:', fetchErr.message);
      }
      return c.json({ results: [] });
    }
  } catch (err: any) {
    console.error('[SIRET:search] Unexpected error:', err.message);
    return c.json({ error: 'Internal error during search' }, 500);
  }
});

/* ── POST /api/siret/ai-suggest ─────────────────────────────────────────────── */

router.post('/api/siret/ai-suggest', async (c) => {
  try {
    const env = c.env as Record<string, string>;
    const blink = getBlink(env);

    // Auth required
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { siret, companyName, activityCode, activityLabel, city, legalAddress, postalCode, legalForm, verificationSource } = body;
    if (!siret || !companyName) {
      return c.json({ error: 'siret and companyName are required' }, 400);
    }

    const { object } = await blink.ai.generateObject({
      model: 'openai/gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are a French business classification expert for Kompilot, a growth marketing SaaS platform for French SMBs. Given company details, suggest the best sector and objectives for onboarding.

Available sectors (id — label):
- restauration — Restauration
- hotellerie — Hôtellerie
- beaute — Beauté
- bienetre — Bien-être & Spa
- medical — Santé / Médical
- sport — Sport & Fitness
- retail — Retail / Boutique
- commerce — Commerce de proximité
- alimentation — Alimentation / Épicerie
- ecommerce — E-commerce local
- assurance — Assurance / Finance
- immobilier — Immobilier
- conseil — Conseil & Coaching
- juridique — Juridique / Notariat
- tech — Tech & SaaS
- batiment — Bâtiment / BTP
- artisan — Artisan
- conciergerie — Conciergerie / Airbnb
- automobile — Automobile / Garage
- education — Éducation / Formation
- evenementiel — Événementiel
- autre — Autre secteur

Available objectives (id — label):
- time — Gagner du temps (automation)
- ideas — Créer du contenu avec l'IA
- reviews — Gérer mes avis clients
- visibility — Développer ma visibilité
- social — Gérer mes réseaux sociaux
- messages — Automatiser mes messages
- analytics — Analyser mes performances
- clients — Attirer de nouveaux clients

Return ONLY the JSON. The suggestedBusinessName should be a cleaned-up, friendly version of the legal name (remove legal suffixes like SARL, SAS, EURL, etc.). The reasoning MUST be in French, 1-2 sentences maximum.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
${activityCode ? `NAF code: ${activityCode}` : ''}
${activityLabel ? `Activity: ${activityLabel}` : ''}
${city ? `City: ${city}` : ''}
${postalCode ? `Postal code: ${postalCode}` : ''}
${legalAddress ? `Legal address: ${legalAddress}` : ''}
${legalForm ? `Legal form: ${legalForm}` : ''}
Verification source: ${verificationSource || 'unknown'}
SIRET: ${siret}`,
        },
      ],
      schema: {
        type: 'object',
        properties: {
          suggestedSector: { type: 'string', description: 'Best matching sector ID from the list above' },
          suggestedObjectives: {
            type: 'array',
            items: { type: 'string' },
            description: '2-4 recommended objective IDs from the list above',
          },
          suggestedBusinessName: { type: 'string', description: 'Cleaned-up, friendly business name without legal suffixes' },
          reasoning: { type: 'string', description: '1-2 sentence French explanation of the suggestions' },
        },
        required: ['suggestedSector', 'suggestedObjectives', 'suggestedBusinessName', 'reasoning'],
      },
    });

    return c.json({ suggestions: object });
  } catch (err: any) {
    console.error('[SIRET:ai-suggest] Error:', err.message);
    return c.json({ error: 'AI suggestion generation failed' }, 500);
  }
});

/* ── POST /api/siret/register-company ─────────────────────────────────────── */

router.post('/api/siret/register-company', async (c) => {
  try {
    const env = c.env as Record<string, string>;
    const blink = getBlink(env);

    // Auth required
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { siret, companyName, legalAddress, city, postalCode, activityCode, activityLabel, legalForm } = body;
    if (!siret) return c.json({ error: 'siret is required' }, 400);

    // Check if SIRET already registered
    try {
      const existing = await blink.db.table<{ id: string; companyName: string }>('companies').list({
        where: { siret },
        limit: 1,
      });
      if (existing.length > 0) {
        return c.json({
          error: 'SIRET_ALREADY_REGISTERED',
          companyName: (existing[0] as any).companyName || '',
        }, 409);
      }
    } catch (dbErr: any) {
      console.error('[SIRET:register] DB check error:', dbErr.message);
      return c.json({ error: 'Database error' }, 500);
    }

    // Insert new company
    const companyId = crypto.randomUUID();
    try {
      await blink.db.table('companies').create({
        id: companyId,
        siret,
        companyName: companyName || '',
        legalAddress: legalAddress || '',
        city: city || '',
        postalCode: postalCode || '',
        activityCode: activityCode || '',
        activityLabel: activityLabel || '',
        legalForm: legalForm || '',
        adminUid: auth.userId,
        subscriptionPlan: 'starter',
        members: JSON.stringify([auth.userId]),
        isActive: '1',
      });
    } catch (dbErr: any) {
      console.error('[SIRET:register] DB insert error:', dbErr.message);
      return c.json({ error: 'Failed to register company' }, 500);
    }

    return c.json({ success: true, companyId });
  } catch (err: any) {
    console.error('[SIRET:register] Unexpected error:', err.message);
    return c.json({ error: 'Internal error during registration' }, 500);
  }
});

/* ── POST /api/siret/join-request ─────────────────────────────────────────── */

router.post('/api/siret/join-request', async (c) => {
  try {
    const env = c.env as Record<string, string>;
    const blink = getBlink(env);

    // Auth required
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { targetSiret, message } = body;
    if (!targetSiret) return c.json({ error: 'targetSiret is required' }, 400);

    // Check if SIRET exists in companies
    let company: any;
    try {
      const rows = await blink.db.table<{ id: string; companyName: string }>('companies').list({
        where: { siret: targetSiret },
        limit: 1,
      });
      if (rows.length === 0) {
        return c.json({ error: 'Company with this SIRET not found' }, 404);
      }
      company = rows[0];
    } catch (dbErr: any) {
      console.error('[SIRET:join] DB lookup error:', dbErr.message);
      return c.json({ error: 'Database error' }, 500);
    }

    // Check if user already has a pending request for this SIRET
    try {
      const existingRequests = await blink.db.table<{ id: string }>('join_requests').list({
        where: {
          AND: [
            { targetSiret },
            { requesterUid: auth.userId },
            { status: 'pending' },
          ],
        },
        limit: 1,
      });
      if (existingRequests.length > 0) {
        return c.json({ error: 'You already have a pending request for this company' }, 409);
      }
    } catch (dbErr: any) {
      console.error('[SIRET:join] DB duplicate check error:', dbErr.message);
    }

    // Get requester info from auth
    const requesterEmail = auth.email || '';
    const requesterName = (auth as any).displayName || requesterEmail.split('@')[0] || '';

    // Insert join request
    const requestId = crypto.randomUUID();
    try {
      await blink.db.table('join_requests').create({
        id: requestId,
        targetSiret,
        targetCompanyName: company.companyName || '',
        requesterUid: auth.userId,
        requesterEmail,
        requesterName,
        status: 'pending',
        message: message || '',
        reviewedBy: '',
      });
    } catch (dbErr: any) {
      console.error('[SIRET:join] DB insert error:', dbErr.message);
      return c.json({ error: 'Failed to create join request' }, 500);
    }

    return c.json({ success: true, requestId });
  } catch (err: any) {
    console.error('[SIRET:join] Unexpected error:', err.message);
    return c.json({ error: 'Internal error during join request' }, 500);
  }
});

/* ── GET /api/siret/join-requests/:siret ──────────────────────────────────── */

router.get('/api/siret/join-requests/:siret', async (c) => {
  try {
    const env = c.env as Record<string, string>;
    const blink = getBlink(env);

    // Auth required
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    const siret = c.req.param('siret')?.trim();
    if (!siret) return c.json({ error: 'SIRET parameter required' }, 400);

    // Verify the caller is admin of the company
    try {
      const companies = await blink.db.table<{ id: string; adminUid: string }>('companies').list({
        where: { siret },
        limit: 1,
      });
      if (companies.length === 0) {
        return c.json({ error: 'Company not found' }, 404);
      }
      const company = companies[0] as any;
      if (company.adminUid !== auth.userId) {
        return c.json({ error: 'Forbidden — only the company admin can view join requests' }, 403);
      }
    } catch (dbErr: any) {
      console.error('[SIRET:join-requests] DB auth check error:', dbErr.message);
      return c.json({ error: 'Database error' }, 500);
    }

    // Fetch join requests
    try {
      const requests = await blink.db.table('join_requests').list({
        where: { targetSiret: siret },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      return c.json({ requests });
    } catch (dbErr: any) {
      console.error('[SIRET:join-requests] DB fetch error:', dbErr.message);
      return c.json({ error: 'Failed to fetch join requests' }, 500);
    }
  } catch (err: any) {
    console.error('[SIRET:join-requests] Unexpected error:', err.message);
    return c.json({ error: 'Internal error' }, 500);
  }
});
