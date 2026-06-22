/**
 * Admin analytics route — /api/admin/analytics-data
 * Restricted to admin@kompilot.com only.
 * Pulls live data from Stripe + Blink DB.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

const ADMIN_EMAIL = 'admin@kompilot.com';

// ── Helper: fetch Stripe paginated list ───────────────────────────────────────
async function stripeFetch(path: string, stripeKey: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ limit: '100', ...params }).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}?${qs}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!res.ok) throw new Error(`Stripe error ${res.status}: ${path}`);
  return res.json() as Promise<any>;
}

// ── GET /api/admin/analytics-data ─────────────────────────────────────────────
router.get('/api/admin/analytics-data', async (c) => {
  const env      = c.env as unknown as Env;
  const rawEnv   = c.env as any;
  const blink    = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth — must be a valid token
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Admin-only gate — check email
  const usersResult = await blink.db.users.list({ where: { id: auth.userId }, limit: 1 } as any);
  const adminUser = (usersResult as any[])?.[0];
  if (!adminUser || adminUser.email !== ADMIN_EMAIL) {
    return c.json({ error: 'Forbidden — admin only' }, 403);
  }

  // 3. Fetch all users from DB
  const allUsers = (await blink.db.users.list({ limit: 500 } as any)) as any[];

  // Build user metadata map
  const userMetaMap: Record<string, any> = {};
  for (const u of allUsers) {
    let meta: any = {};
    try { meta = u.metadata ? JSON.parse(u.metadata) : {}; } catch { /* noop */ }
    userMetaMap[u.id] = { ...u, meta };
  }

  // 4. Fetch establishments for sector info
  const establishments = (await blink.db.establishments.list({ limit: 500 } as any)) as any[];
  const estByUserId: Record<string, any> = {};
  for (const est of establishments) {
    if (!estByUserId[est.userId || est.user_id]) {
      estByUserId[est.userId || est.user_id] = est;
    }
  }

  // 5. Stripe data (graceful fallback if not configured)
  let stripeSubscriptions: any[] = [];
  let mrr = 0;
  let mrrTrend: number[] = [0, 0, 0]; // last 3 months MRR
  let newSubsThisWeek = 0;
  let trialSkipsThisWeek = 0;
  let noShowVolume = 0;

  if (stripeKey) {
    try {
      // Active subscriptions
      const subsData = await stripeFetch('/subscriptions', stripeKey, { status: 'active', expand: 'data.customer' });
      stripeSubscriptions = subsData.data || [];

      // Also fetch trialing
      const trialData = await stripeFetch('/subscriptions', stripeKey, { status: 'trialing', expand: 'data.customer' });
      stripeSubscriptions = [...stripeSubscriptions, ...(trialData.data || [])];

      // Canceled subs too (for table)
      const canceledData = await stripeFetch('/subscriptions', stripeKey, { status: 'canceled', limit: '50' });
      stripeSubscriptions = [...stripeSubscriptions, ...(canceledData.data || [])];

      // MRR from active subscriptions
      const activeSubs = stripeSubscriptions.filter(s => s.status === 'active');
      mrr = activeSubs.reduce((sum: number, s: any) => {
        const item = s.items?.data?.[0];
        const amount = item?.price?.unit_amount || 0;
        const interval = item?.price?.recurring?.interval;
        // Normalize to monthly
        const monthly = interval === 'year' ? amount / 12 : amount;
        return sum + monthly / 100; // cents → euros
      }, 0);

      // MRR trend: simulate 3-month trend from Stripe balance transactions
      try {
        const now = Math.floor(Date.now() / 1000);
        const months = [2, 1, 0].map(offset => {
          const d = new Date();
          d.setMonth(d.getMonth() - offset);
          return d;
        });

        for (let i = 0; i < 3; i++) {
          const start = Math.floor(new Date(months[i].getFullYear(), months[i].getMonth(), 1).getTime() / 1000);
          const end   = Math.floor(new Date(months[i].getFullYear(), months[i].getMonth() + 1, 0).getTime() / 1000);
          try {
            const charges = await stripeFetch('/charges', stripeKey, {
              created: `${start}`, // Stripe doesn't support gte/lte in simple qs like this
              limit: '100',
            });
            // Filter by date range manually
            const monthCharges = (charges.data || []).filter((ch: any) =>
              ch.created >= start && ch.created <= end && ch.paid && !ch.refunded
            );
            mrrTrend[i] = monthCharges.reduce((s: number, ch: any) => s + (ch.amount || 0) / 100, 0);
          } catch { mrrTrend[i] = 0; }
        }
      } catch { /* noop */ }

      // New subscriptions this week
      const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
      const allSubsForWeek = stripeSubscriptions.filter(s =>
        (s.status === 'active' || s.status === 'trialing') && s.created >= oneWeekAgo
      );
      newSubsThisWeek = allSubsForWeek.length;
      trialSkipsThisWeek = allSubsForWeek.filter((s: any) =>
        s.metadata?.trial_renounced === 'true'
      ).length;

      // No-show volume: sum of anti-noshow related charges (metadata tag)
      try {
        const noShowCharges = await stripeFetch('/charges', stripeKey, { limit: '100' });
        noShowVolume = (noShowCharges.data || [])
          .filter((ch: any) => ch.metadata?.type === 'anti_noshow' && ch.paid)
          .reduce((s: number, ch: any) => s + (ch.amount || 0) / 100, 0);
      } catch { /* noop */ }

    } catch (e) {
      console.error('[admin/analytics] Stripe fetch failed:', e);
    }
  }

  // 6. Build user rows for the table
  // Map Stripe customer_id → subscription info
  const subByCustomer: Record<string, any> = {};
  for (const sub of stripeSubscriptions) {
    const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
    if (custId) subByCustomer[custId] = sub;
  }

  const userRows = allUsers
    .filter(u => u.email !== ADMIN_EMAIL)
    .map(u => {
      const meta = userMetaMap[u.id]?.meta || {};
      const est  = estByUserId[u.id];
      const customerId = meta.stripe_customer_id as string | undefined;
      const sub  = customerId ? subByCustomer[customerId] : undefined;

      // Determine plan
      let planId = meta.plan_id || 'free';
      let status: 'trial' | 'paying' | 'canceled' | 'free' = 'free';
      let nextBillingDate: string | null = null;
      let trialEnd: string | null = null;

      if (sub) {
        planId = sub.metadata?.planId || planId;
        if (sub.status === 'trialing') {
          status = 'trial';
          trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
          nextBillingDate = trialEnd;
        } else if (sub.status === 'active') {
          status = 'paying';
          nextBillingDate = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
        } else if (sub.status === 'canceled') {
          status = 'canceled';
        }
      }

      // Days left in trial
      let trialDaysLeft: number | null = null;
      if (status === 'trial' && sub?.trial_end) {
        const diff = sub.trial_end * 1000 - Date.now();
        trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      return {
        id: u.id,
        email: u.email,
        displayName: u.display_name || u.email?.split('@')[0] || '—',
        sector: est?.activity || '—',
        city: est?.city || '—',
        planId,
        status,
        nextBillingDate,
        trialEnd,
        trialDaysLeft,
        createdAt: u.created_at,
        trialRenounced: !!meta.renounced_trial,
      };
    });

  // 7. Trial-ending-soon filter (≤ 3 days left)
  const trialEndingSoon = userRows.filter(
    r => r.status === 'trial' && r.trialDaysLeft !== null && r.trialDaysLeft <= 3
  );

  return c.json({
    kpi: {
      mrr: Math.round(mrr * 100) / 100,
      mrrTrend,
      newSubsThisWeek,
      trialSkipsThisWeek,
      noShowVolume: Math.round(noShowVolume * 100) / 100,
      totalUsers: allUsers.filter(u => u.email !== ADMIN_EMAIL).length,
      payingUsers: userRows.filter(r => r.status === 'paying').length,
      trialUsers: userRows.filter(r => r.status === 'trial').length,
      canceledUsers: userRows.filter(r => r.status === 'canceled').length,
    },
    users: userRows,
    trialEndingSoon,
    stripeConfigured: !!stripeKey,
  });
});
