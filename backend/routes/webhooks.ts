/** Webhook + RGPD routes — Stripe, Meta, RGPD erasure */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import {
  getBlink,
  verifyStripeSignature,
  patchUserMeta,
  findUserByCustomer,
  getUserMeta,
  resolvePriceToPlan,
  type PlanId,
  type BillingInterval,
} from '../lib/stripeHelpers';
import { getDunningEmailHtml, getDunningFollowUpHtml } from '../lib/emailTemplates';
import { handleCreditPackGrant } from '../lib/creditPackHandler';
import { getPlanEntitlements } from '../../shared/pricingCatalog';

export const router = new Hono();

/** Helper: plan tier for comparison (higher = more premium). */
function getPlanTier(planId: string | null | undefined): number {
  return ({ pro: 1, multi: 2, agency: 3, enterprise: 4 } as Record<string, number>)[planId ?? ''] ?? 0;
}

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

  let event: { id?: string; type: string; data: { object: Record<string, any> } };
  try { event = JSON.parse(rawBody); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  if (!event.id || !event.type || !event.data?.object) return c.json({ error: 'Malformed Stripe event' }, 400);
  const blink = getBlink(env);
  try {
    await blink.db.stripe_webhook_events.create({ id: event.id, eventType: event.type, status: 'processing', receivedAt: new Date().toISOString() } as any);
  } catch {
    const prior = await blink.db.stripe_webhook_events.list({ where: { id: event.id }, limit: 1 }) as any[];
    if (prior.length) return c.json({ received: true, replay: true, type: event.type });
    throw new Error('Unable to record Stripe event');
  }

  // invoice.payment_failed → progressive dunning (J+0, J+1, J+3) + critical alert
  if (event.type === 'invoice.payment_failed') {
    const invoice    = event.data.object;
    const customerId = invoice.customer as string;
    const userId     = (invoice.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      // Track dunning attempt number (1, 2, or 3)
      const currentMeta   = await getUserMeta(blink, userId);
      const dunningAttempt = ((currentMeta.dunning_attempt as number) || 0) + 1;
      const amount = invoice.amount_due ? `${Math.round(invoice.amount_due / 100)}€` : '';

      const updateFields: Record<string, any> = {
        stripe_customer_id:  customerId,
        subscription_status: 'payment_failed',
        dunning_attempt:     dunningAttempt,
        last_dunning_at:     new Date().toISOString(),
      };

      // Attempt 1: 3-day grace; Attempt 2: extend to 5 days; Attempt 3: final notice (suspend at 7 days)
      if (dunningAttempt < 3) {
        updateFields.grace_period_end = new Date(Date.now() + (dunningAttempt === 1 ? 3 : 5) * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // Final attempt — set hard suspension deadline
        updateFields.grace_period_end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        updateFields.subscription_status = 'payment_suspended_soon';
      }

      await patchUserMeta(blink, userId, updateFields);
      console.warn(`[webhook] payment_failed → user ${userId}, attempt ${dunningAttempt}/3, grace: ${updateFields.grace_period_end}`);

      // Send progressive dunning email
      try {
        const userRows  = await blink.db.users.list({ where: { id: userId }, limit: 1 });
        const user      = userRows[0] as any;
        const userEmail = user?.email as string | undefined;
        const firstName = (user?.display_name as string)?.split(' ')[0] ?? 'là';
        const resumeUrl = 'https://kompilot.blinkpowered.com/account?tab=billing';

        if (userEmail) {
          const dunningSubjects = [
            '⚠️ Votre paiement Kompilot a échoué',
            '⚠️ Rappel : votre paiement Kompilot est toujours en attente',
            '🚨 Dernière relance : votre espace Kompilot sera suspendu',
          ];
          const subject = dunningSubjects[Math.min(dunningAttempt - 1, 2)];
          const html    = dunningAttempt === 1
            ? getDunningEmailHtml(firstName, amount, resumeUrl)
            : getDunningFollowUpHtml(firstName, amount, resumeUrl, dunningAttempt);
          const textBody = dunningAttempt >= 3
            ? `Bonjour ${firstName},\n\nURGENT : Votre paiement Kompilot${amount ? ` de ${amount}` : ''} n'a toujours pas pu être prélevé. Votre espace sera suspendu dans les 24 prochaines heures.\n\nMettez à jour votre paiement : ${resumeUrl}\n\nL'équipe Kompilot`
            : `Bonjour ${firstName},\n\nVotre paiement Kompilot${amount ? ` de ${amount}` : ''} n'a pas pu être prélevé (relance ${dunningAttempt}/3). Mettez à jour votre moyen de paiement pour éviter toute interruption.\n\n${resumeUrl}\n\nL'équipe Kompilot`;

          await blink.notifications.email({
            to:      userEmail,
            replyTo: 'support@kompilot.com',
            subject,
            html,
            text:    textBody,
          });
          console.warn(`[dunning] attempt ${dunningAttempt}/3 email sent → ${userEmail}`);
        }
      } catch (e) {
        console.error('[dunning] email error (non-fatal):', e);
      }

      // 🚨 Critical alert (fire-and-forget)
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
            alertType: 'stripe.payment_failed',
            metadata:  { amount, attemptCount: dunningAttempt },
          }),
        });
      } catch (ae) {
        console.error('[webhook] critical alert dispatch error (non-fatal):', ae);
      }
    }
  }

  // customer.subscription.created → set active immediately + sync billing interval
  if (event.type === 'customer.subscription.created') {
    const sub        = event.data.object;
    const customerId = sub.customer as string;
    const userId     = (sub.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      const planId   = ((sub.metadata?.plan_id ?? sub.metadata?.planId) as string | undefined) || null;
      const billing  = ((sub.metadata?.billing_interval ?? sub.metadata?.billing) as BillingInterval | undefined) || 'monthly';
      const subId    = sub.id as string;

      // Try to resolve plan + billing from actual subscription price (more reliable than metadata)
      const firstItem = sub.items?.data?.[0];
      const priceId   = firstItem?.price?.id as string | undefined;
      const resolved  = firstItem?.price?.lookup_key ? resolvePriceToPlan(firstItem.price.lookup_key, rawEnv) : null;
      const finalPlanId  = resolved?.planId ?? planId;
      const finalBilling = resolved?.billing ?? billing;

      // Extract current period end from subscription
      const currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;

      await patchUserMeta(blink, userId, {
        stripe_customer_id:     customerId,
        stripe_subscription_id: subId,
        subscription_status:    'active',
        grace_period_end:       null,
        billing_interval:       finalBilling,
        current_period_end:     currentPeriodEnd,
        stripe_sub_status:      sub.status,
        ...(finalPlanId ? { plan_id: finalPlanId } : {}),
      });
      console.warn(`[webhook] subscription.created → user ${userId}, sub ${subId}, plan: ${finalPlanId ?? 'unknown'}, billing: ${finalBilling}`);
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

  // customer.subscription.updated → sync status + planId + billing + detect plan changes
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
      const planId  = ((sub.metadata?.plan_id ?? sub.metadata?.planId) as string | undefined) || null;
      const billing = ((sub.metadata?.billing_interval ?? sub.metadata?.billing) as BillingInterval | undefined) || null;

      // Resolve plan + billing from actual subscription price (most reliable)
      const firstItem = sub.items?.data?.[0];
      const priceId   = firstItem?.price?.id as string | undefined;
      const resolved  = firstItem?.price?.lookup_key ? resolvePriceToPlan(firstItem.price.lookup_key, rawEnv) : null;
      const finalPlanId  = resolved?.planId ?? planId;
      const finalBilling = resolved?.billing ?? billing;

      // Detect plan change (upgrade/downgrade) from previous_attributes
      const prevPlanId = (sub.previous_attributes as any)?.metadata?.planId as string | undefined;
      const planChanged = prevPlanId && finalPlanId && prevPlanId !== finalPlanId;

      // Extract current period end
      const currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;

      await patchUserMeta(blink, userId, {
        stripe_customer_id:       customerId,
        stripe_subscription_id:   sub.id,
        subscription_status:      newStatus,
        current_period_end:       currentPeriodEnd,
        stripe_sub_status:        sub.status,
        ...(finalPlanId ? { plan_id: finalPlanId } : {}),
        ...(finalBilling ? { billing_interval: finalBilling } : {}),
        ...(newStatus === 'active' ? { grace_period_end: null } : {}),
      });
      console.warn(`[webhook] subscription.updated → user ${userId} → ${newStatus}${finalPlanId ? ` (plan: ${finalPlanId})` : ''}${finalBilling ? ` [${finalBilling}]` : ''}`);

      // ── Sync add-ons from subscription items ──────────────────────────────
      try {
        const { syncAddonsFromStripe } = await import('../lib/addonHelpers');
        const items = (sub.items?.data ?? []).map((item: any) => ({
          id: item.id,
          price: { id: item.price?.id, unit_amount: item.price?.unit_amount, recurring: item.price?.recurring },
        }));
        await syncAddonsFromStripe(rawEnv, userId, items, newStatus, currentPeriodEnd);
      } catch (addonErr) {
        console.error('[webhook] addon sync error (non-fatal):', addonErr);
      }

      // Dispatch plan change alert if upgrade/downgrade detected
      if (planChanged) {
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
              alertType: 'plan.changed',
              metadata:  { from: prevPlanId, to: finalPlanId, direction: getPlanTier(finalPlanId) > getPlanTier(prevPlanId) ? 'upgrade' : 'downgrade' },
            }),
          });
          console.warn(`[webhook] plan.changed alert → user ${userId}: ${prevPlanId} → ${finalPlanId}`);
        } catch (ae) {
          console.error('[webhook] plan.changed alert dispatch error (non-fatal):', ae);
        }
      }

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
      const planId  = ((session.metadata?.plan_id ?? session.metadata?.planId) as string | undefined)
                  || (session.subscription as any)?.metadata?.planId
                  || null;
      const billing = ((session.metadata?.billing_interval ?? session.metadata?.billing) as BillingInterval | undefined)
                  || (session.subscription as any)?.metadata?.billing
                  || 'monthly';

      // Resolve from line items if available
      const lineItems = session.line_items?.data ?? [];
      const firstLookupKey = lineItems[0]?.price?.lookup_key as string | undefined;
      const resolved  = firstLookupKey ? resolvePriceToPlan(firstLookupKey, rawEnv) : null;
      const finalPlanId  = resolved?.planId ?? planId;
      const finalBilling = resolved?.billing ?? billing;

      await patchUserMeta(blink, userId, {
        stripe_customer_id:     customerId,
        stripe_subscription_id: session.subscription as string,
        subscription_status:    'active',
        grace_period_end:       null,
        billing_interval:       finalBilling,
        ...(finalPlanId ? { plan_id: finalPlanId } : {}),
      });
      console.warn(`[webhook] checkout.completed → user ${userId} subscribed${finalPlanId ? ` to plan: ${finalPlanId}` : ''} [${finalBilling}]`);
    }

    // Canonical one-time products only. Legacy creditPack metadata is ignored so
    // old checkout flows cannot mint generic AI balance outside the ledger.
    if (userId && session.mode === 'payment' && session.metadata?.credit_eligible === 'true' && session.metadata?.product_id) {
      const creditType = session.metadata.credit_type === 'sms' ? 'sms' : 'ai';
      const creditAmount = Number(session.metadata.credit_amount) || 0;
      const reference = `stripe:${event.data.object.id}`;

      if (session.metadata.product_type === 'guided_pilot') {
        const pilotDays = Number(session.metadata.pilot_days) || 30;
        await patchUserMeta(blink, userId, {
          plan_id: 'pilot',
          pilot_active: true,
          pilot_started_at: new Date().toISOString(),
          pilot_ends_at: new Date(Date.now() + pilotDays * 24 * 60 * 60 * 1000).toISOString(),
          pilot_source_session_id: String(session.id),
        });
      } else if (creditAmount > 0) {
        await handleCreditPackGrant(blink, userId, creditAmount, reference, creditType);
      }
    }
  }

  // invoice.payment_succeeded → clear failure + send invoice confirmation to Pro users
  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded_async') {
    const invoice    = event.data.object;
    const customerId = invoice.customer as string;
    const userId     = (invoice.metadata?.user_id as string | undefined)
                    || (await findUserByCustomer(blink, customerId));
    if (userId) {
      const currentMeta = await getUserMeta(blink, userId);
      const planIdForGrant = typeof currentMeta.plan_id === 'string' ? currentMeta.plan_id : null;
      const planEntitlements = getPlanEntitlements(planIdForGrant);
      const entitlements = planEntitlements
        ? { ai: planEntitlements.aiCredits ?? 0, sms: planEntitlements.smsCredits ?? 0 }
        : null;
      const periodKey = String(invoice.id || invoice.period_start || new Date().toISOString().slice(0, 10));

      await patchUserMeta(blink, userId, {
        stripe_customer_id: customerId,
        subscription_status: 'active',
        grace_period_end: null,
        dunning_attempt: 0,
        last_dunning_at: null,
      });

      if (entitlements) {
        const grantExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
        const grant = async (creditType: 'ai' | 'sms', amount: number) => {
          const grantId = `grant:${creditType}:${periodKey}`.slice(0, 255);
          try {
            await blink.db.creditTransactions.create({
              id: grantId,
              userId,
              type: 'grant',
              actionType: 'subscription_renewal',
              creditsDelta: amount,
              balanceAfter: 0,
              description: `Crédits inclus ${creditType} — période ${periodKey}`,
              referenceId: periodKey,
              metadata: JSON.stringify({ source: 'stripe_invoice', invoiceId: invoice.id, planId: planIdForGrant }),
              creditType,
              sourceType: 'subscription',
              expiresAt: grantExpiresAt,
              periodKey,
            } as any);
          } catch (grantError: any) {
            if (grantError?.status !== 409) throw grantError;
          }
        };
        await grant('ai', entitlements.ai);
        await grant('sms', entitlements.sms);
      }

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

  await blink.db.stripe_webhook_events.update(event.id, { status: 'processed', processedAt: new Date().toISOString() } as any).catch((err: unknown) => console.error('[webhook] event audit update failed', err));
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

// RGPD and Platform Webhooks extracted to:
//   - backend/routes/rgpd.ts           (Article 17 erasure)
//   - backend/routes/platformWebhooks.ts (Unified Inbox review ingestion)
