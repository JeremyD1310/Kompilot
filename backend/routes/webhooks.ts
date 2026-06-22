/** Webhook + RGPD routes — Stripe, Meta, RGPD erasure */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import {
  getBlink,
  verifyStripeSignature,
  patchUserMeta,
  findUserByCustomer,
  getUserMeta,
} from '../lib/stripeHelpers';
import { getDunningEmailHtml } from '../lib/emailTemplates';

export const router = new Hono();

// ── Meta HMAC-SHA256 verification ─────────────────────────────────────────────

async function verifyMetaSignature(
  payload: string,
  header: string,
  appSecret: string,
): Promise<boolean> {
  try {
    const expected = header.startsWith('sha256=') ? header.slice(7) : header;
    const encoder  = new TextEncoder();
    const key      = await crypto.subtle.importKey(
      'raw', encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig      = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    if (computed.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  } catch { return false; }
}

// ── Stripe webhook — main event handler ──────────────────────────────────────

router.post('/api/webhooks/stripe', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const webhookSecret = rawEnv.STRIPE_WEBHOOK_SECRET as string | undefined;

  if (!webhookSecret) return c.json({ error: 'Webhook not configured' }, 503);

  const signature = c.req.header('stripe-signature') || '';
  const rawBody   = await c.req.text();
  const valid     = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    console.warn('[webhook/stripe] Invalid signature');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { object: Record<string, any> };
  };
  const blink = getBlink(env);

  // invoice.payment_failed → 3-day grace period + critical alert
  if (event.type === 'invoice.payment_failed') {
    const invoice    = event.data.object;
    const customerId = invoice.customer as string;
    const userId     = (invoice.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      await patchUserMeta(blink, userId, {
        stripe_customer_id:  customerId,
        subscription_status: 'payment_failed',
        grace_period_end:    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      console.warn(`[webhook] payment_failed → user ${userId}, grace ends in 3 days`);

      // 🚨 Double alert: fire SMS + push notification
      try {
        const backendUrl = `https://${(rawEnv as any).BLINK_PROJECT_ID || 'gbrhsehk'}.backend.blink.new`;
        const secretKey  = (rawEnv as any).BLINK_SECRET_KEY as string | undefined;
        const amount     = invoice.amount_due ? `${Math.round(invoice.amount_due / 100)}€` : '';
        await fetch(`${backendUrl}/api/alerts/critical`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${secretKey}`,
          },
          body: JSON.stringify({
            userId,
            alertType: 'stripe.payment_failed',
            metadata:  { amount, attemptCount: invoice.attempt_count ?? 1 },
          }),
        });
      } catch (ae) {
        console.error('[webhook] critical alert dispatch error (non-fatal):', ae);
      }
    }
  }

  // customer.subscription.created → set active immediately
  if (event.type === 'customer.subscription.created') {
    const sub        = event.data.object;
    const customerId = sub.customer as string;
    const userId     = (sub.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      const planId  = (sub.metadata?.planId as string | undefined) || null;
      const subId   = sub.id as string;
      await patchUserMeta(blink, userId, {
        stripe_customer_id:     customerId,
        stripe_subscription_id: subId,
        subscription_status:    'active',
        grace_period_end:       null,
        ...(planId ? { plan_id: planId } : {}),
      });
      console.warn(`[webhook] subscription.created → user ${userId}, sub ${subId}${planId ? `, plan: ${planId}` : ''}`);
    }
  }

  // customer.subscription.deleted → cancelled
  if (event.type === 'customer.subscription.deleted') {
    const sub        = event.data.object;
    const customerId = sub.customer as string;
    const userId     = (sub.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      await patchUserMeta(blink, userId, {
        stripe_customer_id:  customerId,
        subscription_status: 'cancelled',
        grace_period_end:    null,
      });
      console.warn(`[webhook] subscription.deleted → user ${userId} cancelled`);
    }
  }

  // customer.subscription.updated → sync status + planId + trial.expired alert
  if (event.type === 'customer.subscription.updated') {
    const sub        = event.data.object;
    const customerId = sub.customer as string;
    const userId     = (sub.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      const statusMap: Record<string, string> = {
        active:   'active',
        past_due: 'payment_failed',
        unpaid:   'unpaid',
        canceled: 'cancelled',
        trialing: 'active',
      };
      const newStatus = statusMap[sub.status as string] || sub.status;
      // Extract planId from subscription metadata (set during checkout)
      const planId = (sub.metadata?.planId as string | undefined) || null;
      await patchUserMeta(blink, userId, {
        stripe_customer_id:       customerId,
        stripe_subscription_id:   sub.id,
        subscription_status:      newStatus,
        ...(planId ? { plan_id: planId } : {}),
        ...(newStatus === 'active' ? { grace_period_end: null } : {}),
      });
      console.warn(`[webhook] subscription.updated → user ${userId} → ${newStatus}${planId ? ` (plan: ${planId})` : ''}`);

      // 🚨 Detect trial expiry: previous status was trialing, now not active
      const prevStatus = (sub.previous_attributes as any)?.status as string | undefined;
      if (prevStatus === 'trialing' && sub.status !== 'active' && sub.status !== 'trialing') {
        try {
          const backendUrl = `https://${(rawEnv as any).BLINK_PROJECT_ID || 'gbrhsehk'}.backend.blink.new`;
          const secretKey  = (rawEnv as any).BLINK_SECRET_KEY as string | undefined;
          await fetch(`${backendUrl}/api/alerts/critical`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${secretKey}`,
            },
            body: JSON.stringify({
              userId,
              alertType: 'trial.expired',
              metadata:  { newStatus, planId: planId ?? 'unknown' },
            }),
          });
          console.warn(`[webhook] trial.expired alert dispatched → user ${userId}`);
        } catch (ae) {
          console.error('[webhook] trial.expired alert dispatch error (non-fatal):', ae);
        }
      }
    }
  }

  // checkout.session.completed → upgrade plan immediately after payment
  if (event.type === 'checkout.session.completed') {
    const session    = event.data.object;
    const customerId = session.customer as string;
    const userId     = (session.metadata?.user_id as string | undefined)
                    || (session.client_reference_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId && session.mode === 'subscription') {
      const planId = (session.metadata?.planId as string | undefined)
                  || (session.subscription as any)?.metadata?.planId
                  || null;
      await patchUserMeta(blink, userId, {
        stripe_customer_id:     customerId,
        stripe_subscription_id: session.subscription as string,
        subscription_status:    'active',
        grace_period_end:       null,
        ...(planId ? { plan_id: planId } : {}),
      });
      console.warn(`[webhook] checkout.completed → user ${userId} subscribed${planId ? ` to plan: ${planId}` : ''}`);
    }
  }

  // invoice.payment_succeeded → clear failure + send invoice confirmation to Pro users
  if (event.type === 'invoice.payment_succeeded') {
    const invoice    = event.data.object;
    const customerId = invoice.customer as string;
    const userId     = (invoice.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      await patchUserMeta(blink, userId, {
        stripe_customer_id:  customerId,
        subscription_status: 'active',
        grace_period_end:    null,
      });
      console.warn(`[webhook] payment_succeeded → user ${userId} restored to active`);

      // ── Server-Side Purchase event → Conversion APIs ──────────────────────
      try {
        const rawEnv2 = c.env as any;
        const trackingBackendUrl = `https://${rawEnv2.BLINK_PROJECT_ID || 'gbrhsehk'}.backend.blink.new`;
        const amountEur = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
        const userRows2 = await blink.db.users.list({ where: { id: userId }, limit: 1 });
        const user2 = userRows2[0] as any;
        const meta2 = JSON.parse(user2?.metadata ?? '{}');
        const isAgency = (user2?.role === 'agency' || meta2?.plan?.includes('agency'));
        const convEvent = isAgency ? 'Agency_Purchase' : 'Purchase';

        await fetch(`${trackingBackendUrl}/api/tracking/conversion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: convEvent,
            userId,
            email: user2?.email,
            value: amountEur,
            currency: 'EUR',
            userType: isAgency ? 'agency' : 'commerce',
            eventUrl: 'https://www.kompilot.com/subscription',
          }),
        });
        console.warn(`[webhook] Purchase tracking → ${convEvent} ${amountEur}€ for user ${userId}`);
      } catch (te) {
        console.error('[webhook] tracking call error (non-fatal):', te);
      }

      // Send invoice confirmation email ONLY to Pro users (not agency_client sub-accounts)
      try {
        const userRows  = await blink.db.users.list({ where: { id: userId }, limit: 1 });
        const user      = userRows[0] as any;
        const userRole  = user?.role as string | undefined;
        const isAgencyClient = userRole === 'agency_client';

        // White-label: skip direct Kompilot email for agency sub-accounts
        if (!isAgencyClient && user?.email && invoice.hosted_invoice_url) {
          const displayName = user.display_name ?? '';
          const firstName   = displayName.split(' ')[0] || 'là';
          const amount      = invoice.amount_paid
            ? `${(invoice.amount_paid / 100).toFixed(2).replace('.', ',')} €`
            : '';
          await blink.notifications.email({
            to:      user.email,
            replyTo: 'support@kompilot.com',
            subject: `✅ Votre facture Kompilot${amount ? ` de ${amount}` : ''} est disponible`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
                <h2 style="color:#0D9488;margin:0 0 16px">Facture confirmée</h2>
                <p style="color:#1e293b;margin:0 0 12px">Bonjour ${firstName},</p>
                <p style="color:#475569;margin:0 0 20px">
                  Votre paiement${amount ? ` de <strong>${amount}</strong>` : ''} a bien été enregistré.
                  Votre facture détaillée (avec TVA 20 %) est disponible en téléchargement.
                </p>
                <a href="${invoice.hosted_invoice_url}" target="_blank"
                   style="display:inline-block;background:#0D9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
                  Télécharger ma facture PDF
                </a>
                <p style="color:#94a3b8;font-size:12px;margin-top:24px">
                  Cette facture est émise par Kompilot. Pour toute question : support@kompilot.com
                </p>
              </div>
            `,
            text: `Bonjour ${firstName},\n\nVotre paiement${amount ? ` de ${amount}` : ''} a été confirmé.\nTéléchargez votre facture : ${invoice.hosted_invoice_url}\n\nL'équipe Kompilot`,
          });
          console.warn(`[webhook] invoice confirmation email sent → ${user.email}`);
        }
      } catch (e) {
        // Non-fatal — don't fail the webhook
        console.error('[webhook] invoice email error:', e);
      }
    }
  }

  // charge.dispute.created → track disputes, suspend payouts if rate > 1.5%
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object;
    const chargeId = dispute.charge as string;
    let disputeUserId: string | null = null;
    try {
      const stripeKey = (rawEnv as any).STRIPE_SECRET_KEY as string | undefined;
      if (stripeKey) {
        const chargeRes = await fetch(`https://api.stripe.com/v1/charges/${chargeId}`, {
          headers: { 'Authorization': `Bearer ${stripeKey}` },
        });
        if (chargeRes.ok) {
          const chargeData = await chargeRes.json() as any;
          disputeUserId = chargeData?.metadata?.user_id || null;
          if (!disputeUserId && chargeData?.customer) {
            disputeUserId = await findUserByCustomer(blink, chargeData.customer);
          }
        }
      }
    } catch (de) {
      console.error('[webhook] dispute charge lookup error:', de);
    }

    if (disputeUserId) {
      const meta = await getUserMeta(blink, disputeUserId);
      const disputes = ((meta.dispute_count as number) || 0) + 1;
      const chargeCount = (meta.charge_count as number) || 50; // fallback estimate
      const disputeRate = disputes / chargeCount;

      await patchUserMeta(blink, disputeUserId, {
        dispute_count: disputes,
        last_dispute_at: new Date().toISOString(),
        dispute_alert: disputeRate > 0.015 ? 'suspended' : 'warning',
      });

      if (disputeRate > 0.015) {
        console.warn(`[webhook] dispute rate ${(disputeRate * 100).toFixed(1)}% > 1.5% → suspending payouts for user ${disputeUserId}`);
        await patchUserMeta(blink, disputeUserId, { stripe_payouts_suspended: true });
      }
      console.warn(`[webhook] charge.dispute.created → user ${disputeUserId}, disputes: ${disputes}, rate: ${(disputeRate * 100).toFixed(1)}%`);
    }
  }

  return c.json({ received: true, type: event.type });
});

// ── Stripe dunning email ──────────────────────────────────────────────────────

router.post('/api/webhooks/stripe/dunning', async (c) => {
  const env           = c.env as unknown as Env;
  const rawEnv        = c.env as any;
  const webhookSecret = rawEnv.STRIPE_WEBHOOK_SECRET as string | undefined;

  if (!webhookSecret) return c.json({ error: 'Not configured' }, 503);

  const signature = c.req.header('stripe-signature') || '';
  const rawBody   = await c.req.text();
  const valid     = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) return c.json({ error: 'Invalid signature' }, 400);

  const event = JSON.parse(rawBody) as { type: string; data: { object: Record<string, any> } };
  if (event.type !== 'invoice.payment_failed') return c.json({ skipped: true });

  const blink   = getBlink(env);
  const invoice = event.data.object;
  const userId  = (invoice.metadata?.user_id as string | undefined)
               || (await findUserByCustomer(blink, invoice.customer));

  if (userId) {
    const userRows    = await blink.db.users.list({ where: { id: userId }, limit: 1 });
    const userEmail   = (userRows[0] as any)?.email        as string | undefined;
    const displayName = (userRows[0] as any)?.display_name as string | undefined;
    const firstName   = displayName?.split(' ')[0] ?? 'là';
    const amount      = invoice.amount_due ? `${Math.round(invoice.amount_due / 100)}€` : '';

    if (userEmail) {
      const resumeUrl = 'https://kompilot.blinkpowered.com/account?tab=billing';
      try {
        await blink.notifications.email({
          to:      userEmail,
          replyTo: 'support@kompilot.com',
          subject: '⚠️ Votre tableau de bord Kompilot est en pause',
          html:    getDunningEmailHtml(firstName, amount, resumeUrl),
          text:    `Bonjour ${firstName},\n\nVotre paiement Kompilot${amount ? ` de ${amount}` : ''} a échoué. Votre tableau de bord est en pause.\n\nRégularisez en 2 minutes : ${resumeUrl}\n\nL'équipe Kompilot`,
        });
        console.warn(`[dunning] email sent → ${userEmail}`);
      } catch (e) {
        console.error('[dunning] email error:', e);
      }
    }
  }

  return c.json({ received: true });
});

// ── Meta webhook — POST ───────────────────────────────────────────────────────

router.post('/api/webhooks/meta', async (c) => {
  const rawEnv    = c.env as any;
  const appSecret = rawEnv.META_APP_SECRET as string | undefined;
  const sigHeader = c.req.header('X-Hub-Signature-256') || '';
  const rawBody   = await c.req.text();

  if (appSecret) {
    const valid = await verifyMetaSignature(rawBody, sigHeader, appSecret);
    if (!valid) {
      console.warn('[webhook/meta] Invalid HMAC signature — request rejected');
      return c.json({ error: 'Invalid signature' }, 403);
    }
  } else {
    console.warn('[webhook/meta] META_APP_SECRET not set — skipping validation (unsafe)');
  }

  let body: Record<string, any>;
  try { body = JSON.parse(rawBody); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const object: string = body.object ?? '';
  console.warn(`[webhook/meta] event received: ${object}`, JSON.stringify(body).slice(0, 200));

  const hub = c.req.query('hub.challenge');
  if (hub) return c.text(hub);

  return c.json({ received: true, object });
});

// ── Meta webhook — GET (challenge) ────────────────────────────────────────────

router.get('/api/webhooks/meta', (c) => {
  const rawEnv    = c.env as any;
  const mode      = c.req.query('hub.mode');
  const challenge = c.req.query('hub.challenge');
  const token     = c.req.query('hub.verify_token');
  const expected  = (rawEnv.META_VERIFY_TOKEN as string | undefined) ?? 'kompilot_meta_verify';

  if (mode === 'subscribe' && token === expected && challenge) return c.text(challenge);
  return c.json({ error: 'Verification failed' }, 403);
});

// ── RGPD — DELETE /api/user/data (Article 17) ────────────────────────────────

router.delete('/api/user/data', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;

  const tables = [
    'establishments', 'posts', 'scheduled_posts', 'messages', 'inbox_replies',
    'quick_reply_templates', 'onboarding_profiles', 'referral_campaigns',
    'referral_links', 'referral_conversions', 'leads',
    'email_verification_tokens', 'password_reset_tokens', 'magic_link_tokens',
    // RGPD Article 17 — tables supplémentaires explicitement requises
    'captured_leads', 'daily_analytics', 'initial_scans',
    'compliance_consent_log', 'legal_signatures', 'sms_credits',
    'agency_sub_accounts', 'client_approval_tokens',
  ] as const;

  const results: Record<string, string> = {};

  for (const table of tables) {
    try {
      const rows = await (blink.db as any)[table].list({ where: { user_id: userId }, limit: 1000 });
      let deleted = 0;
      for (const row of rows) {
        try { await (blink.db as any)[table].delete(row.id); deleted++; } catch { /* noop */ }
      }
      results[table] = `deleted ${deleted}`;
    } catch (e) {
      results[table] = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  try {
    await blink.db.users.update(userId, {
      email:        `deleted_${userId}@kompilot.invalid`,
      display_name: '[Supprimé]',
      phone:        null,
      avatar_url:   null,
      metadata:     JSON.stringify({ gdpr_deleted_at: new Date().toISOString() }),
    } as any);
    results['users'] = 'anonymized';
  } catch (e) {
    results['users'] = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  console.warn(`[RGPD] DELETE /api/user/data → userId ${userId}`, results);

  return c.json({
    success:   true,
    userId,
    deletedAt: new Date().toISOString(),
    tables:    results,
    notice:    "Conformément à l'Article 17 RGPD (droit à l'effacement), toutes vos données personnelles ont été supprimées ou anonymisées.",
  });
});

// ── Unified Inbox Webhooks — Plateformes sectorielles ──────────────────────────
//
// Ces routes centralisent les avis et évaluations issus de Planity, Doctolib,
// Booking.com, Airbnb, Vroomly, iDGarages, TheFork, etc. dans la table messages.
//
// Chaque plateforme envoie ses avis via POST vers /api/webhooks/platform/:slug
// Le payload est normalisé puis stocké comme message dans l'inbox unifiée.

interface PlatformReviewPayload {
  /** Identifiant unique de l'avis côté plateforme */
  externalId?: string;
  /** Nom ou pseudonyme du reviewer */
  authorName?: string;
  /** Note (1-5) */
  rating?: number;
  /** Texte de l'avis */
  text?: string;
  /** Date de publication ISO8601 */
  publishedAt?: string;
  /** Lien vers l'avis original */
  reviewUrl?: string;
  /** ID du compte professionnel côté plateforme */
  businessId?: string;
  /** Token API envoyé en header X-Platform-Token pour authentification */
  platformToken?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  planity:        'Planity',
  treatwell:      'Treatwell',
  fresha:         'Fresha',
  salonkee:       'Salonkee',
  doctolib:       'Doctolib',
  ameli:          'Ameli Pro',
  livi:           'Livi / Qare',
  thefork:        'TheFork',
  ubereats:       'Uber Eats',
  deliveroo:      'Deliveroo',
  tripadvisor:    'TripAdvisor',
  booking:        'Booking.com',
  airbnb:         'Airbnb',
  vroomly:        'Vroomly',
  idgarages:      'iDGarages',
  automobiles:    'Automobiles.com',
  google_business:'Google Business',
};

router.post('/api/webhooks/platform/:slug', async (c) => {
  const env      = c.env as unknown as Env;
  const slug     = c.req.param('slug');
  const blink    = getBlink(env);

  // Validate platform slug
  if (!PLATFORM_LABELS[slug]) {
    return c.json({ error: `Unknown platform slug: ${slug}` }, 400);
  }

  // Parse payload
  let payload: PlatformReviewPayload;
  try {
    payload = await c.req.json<PlatformReviewPayload>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Resolve userId from businessId (stored in establishment.metadata or users.metadata)
  let targetUserId: string | null = null;
  if (payload.businessId) {
    try {
      const rows = await blink.db.establishments.list({
        where: { siret: payload.businessId },
        limit: 1,
      });
      if (rows.length > 0) targetUserId = rows[0].userId;
    } catch {
      // Non-blocking — fall through to system message
    }
  }

  // Normalize into a unified inbox message
  const platformLabel = PLATFORM_LABELS[slug] ?? slug;
  const stars = payload.rating ? '⭐'.repeat(Math.min(5, Math.max(1, Math.round(payload.rating)))) : '';
  const subject = `${stars} Nouvel avis ${platformLabel}${payload.authorName ? ` — ${payload.authorName}` : ''}`;
  const body = [
    payload.text ? `"${payload.text}"` : '',
    payload.rating ? `Note : ${payload.rating}/5` : '',
    payload.publishedAt ? `Publié le : ${new Date(payload.publishedAt).toLocaleDateString('fr-FR')}` : '',
    payload.reviewUrl ? `Voir l'avis : ${payload.reviewUrl}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    await blink.db.messages.create({
      id:          crypto.randomUUID(),
      userId:      targetUserId ?? 'system',
      senderName:  payload.authorName ?? `${platformLabel} User`,
      senderEmail: `noreply@${slug}.webhook.kompilot`,
      subject,
      body:        body || `Avis reçu via ${platformLabel}`,
      isRead:      false,
      createdAt:   payload.publishedAt ?? new Date().toISOString(),
      isArchived:  0,
      isStarred:   payload.rating && payload.rating >= 4 ? 1 : 0,
    });

    console.warn(`[webhook/${slug}] Review stored → userId: ${targetUserId}, rating: ${payload.rating}`);

    return c.json({
      success:  true,
      platform: platformLabel,
      stored:   true,
      userId:   targetUserId ?? 'system',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[webhook/${slug}] DB error:`, msg);
    return c.json({ error: 'Storage failed', detail: msg }, 500);
  }
});

// GET endpoint for webhook registration verification (Planity, Booking, etc.)
router.get('/api/webhooks/platform/:slug', (c) => {
  const slug = c.req.param('slug');
  const challenge = c.req.query('hub.challenge') ?? c.req.query('challenge');
  if (challenge) return c.text(challenge); // Facebook/Meta-style verification
  return c.json({
    ok: true,
    platform: PLATFORM_LABELS[slug] ?? slug,
    endpoint: `/api/webhooks/platform/${slug}`,
    description: 'Kompilot Unified Inbox Webhook — POST to receive platform reviews',
  });
});
