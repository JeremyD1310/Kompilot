/**
 * Referral Rewards — SaaS-level referral system
 *
 * When an existing Kompilot user refers a new business owner:
 * - Referrer gets +5 AI credits per successful signup
 * - Referred user gets +5 bonus credits at activation
 * - At 5 referrals → 1 free month of subscription
 * - At 10 referrals → 3 free months
 * - At 25 referrals → 6 free months
 *
 * Endpoints:
 *   GET  /api/referral-rewards/stats   — referral stats for current user
 *   GET  /api/referral-rewards/link    — get or create user's unique referral code
 *   POST /api/referral-rewards/convert — track a conversion (called on signup)
 *   GET  /api/referral-rewards/history — reward history
 *   POST /api/referral-rewards/redeem  — redeem earned free months
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { const p = authHeader.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── Constants ────────────────────────────────────────────────────────────────

const CREDITS_PER_REFERRAL = 5;
const BONUS_CREDITS_NEW_USER = 5;

const REWARD_TIERS = [
  { threshold: 5,  label: 'Bronze',  reward: '1 mois gratuit',  monthsFree: 1 },
  { threshold: 10, label: 'Argent',  reward: '3 mois gratuits', monthsFree: 3 },
  { threshold: 25, label: 'Or',      reward: '6 mois gratuits', monthsFree: 6 },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateReferralCode(displayName?: string): string {
  const prefix = (displayName || 'kompilot')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '').substring(0, 6);
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${suffix}`;
}

function getCurrentTier(conversions: number) {
  let current: typeof REWARD_TIERS[number] | null = null;
  let next: typeof REWARD_TIERS[number] | null = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (conversions >= tier.threshold) { current = tier; next = REWARD_TIERS[REWARD_TIERS.indexOf(tier) + 1] ?? null; }
  }
  return { current, next };
}

// ── GET /api/referral-rewards/link — get or create referral code ─────────────

router.get('/api/referral-rewards/link', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env as Env);

  // Check existing reward record
  const existing = await blink.db.table<any>('referral_rewards').list({ where: { userId }, limit: 1 });

  if (existing.length > 0 && existing[0].referralCode) {
    const r = existing[0];
    const baseUrl = 'https://kompilot.blinkpowered.com';
    return c.json({
      code: r.referralCode,
      link: `${baseUrl}/ref/${r.referralCode}`,
    });
  }

  // Generate new code
  const users = await blink.db.table<any>('users').list({ where: { id: userId }, limit: 1 });
  const displayName = users[0]?.displayName || '';
  const code = generateReferralCode(displayName);
  const baseUrl = 'https://kompilot.blinkpowered.com';

  if (existing.length > 0) {
    await blink.db.table<any>('referral_rewards').update(existing[0].id, { referralCode: code });
  } else {
    await blink.db.table<any>('referral_rewards').create({
      id: `rr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      userId,
      referralCode: code,
      totalConversions: 0,
      totalCreditsEarned: 0,
      totalFreeMonthsEarned: 0,
      totalFreeMonthsRedeemed: 0,
    });
  }

  return c.json({ code, link: `${baseUrl}/ref/${code}` });
});

// ── GET /api/referral-rewards/stats ──────────────────────────────────────────

router.get('/api/referral-rewards/stats', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env as Env);
  const existing = await blink.db.table<any>('referral_rewards').list({ where: { userId }, limit: 1 });

  if (!existing.length) {
    return c.json({
      conversions: 0, creditsEarned: 0, freeMonthsEarned: 0,
      freeMonthsRedeemed: 0, freeMonthsAvailable: 0,
      currentTier: null, nextTier: REWARD_TIERS[0],
      nextTierProgress: 0, tiers: REWARD_TIERS, bonusPerReferral: CREDITS_PER_REFERRAL,
    });
  }

  const r = existing[0];
  const conversions = Number(r.totalConversions) || 0;
  const { current, next } = getCurrentTier(conversions);

  return c.json({
    conversions,
    creditsEarned: Number(r.totalCreditsEarned) || 0,
    freeMonthsEarned: Number(r.totalFreeMonthsEarned) || 0,
    freeMonthsRedeemed: Number(r.totalFreeMonthsRedeemed) || 0,
    freeMonthsAvailable: (Number(r.totalFreeMonthsEarned) || 0) - (Number(r.totalFreeMonthsRedeemed) || 0),
    currentTier: current,
    nextTier: next,
    nextTierProgress: next ? conversions / next.threshold : 1,
    tiers: REWARD_TIERS,
    bonusPerReferral: CREDITS_PER_REFERRAL,
  });
});

// ── GET /api/referral-rewards/history ────────────────────────────────────────

router.get('/api/referral-rewards/history', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env as Env);
  const events = await blink.db.table<any>('referral_reward_events').list({
    where: { referrerUserId: userId },
    orderBy: { createdAt: 'desc' },
    limit: 50,
  });

  const history = (events || []).map((e: any) => ({
    id: e.id,
    referredEmail: e.referredEmail || 'Nouvel utilisateur',
    creditsAwarded: Number(e.creditsAwardedReferrer) || CREDITS_PER_REFERRAL,
    tierUnlocked: e.tierUnlocked || '',
    createdAt: e.createdAt,
  }));

  return c.json({ history });
});

// ── POST /api/referral-rewards/convert — track a referral conversion ────────

router.post('/api/referral-rewards/convert', async (c) => {
  let body: { referralCode: string; newUserId?: string; newUserEmail?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body.referralCode) return c.json({ error: 'referralCode required' }, 400);

  const blink = getBlink(c.env as Env);

  // Find referrer by code
  const rewards = await blink.db.table<any>('referral_rewards').list({
    where: { referralCode: body.referralCode },
    limit: 1,
  });

  if (!rewards.length) return c.json({ error: 'Invalid referral code' }, 404);

  const reward = rewards[0];
  const referrerId = reward.userId;

  // Prevent self-referral
  if (body.newUserId && body.newUserId === referrerId) {
    return c.json({ error: 'Self-referral not allowed' }, 400);
  }

  // Update referrer stats
  const prevConversions = Number(reward.totalConversions) || 0;
  const newConversions = prevConversions + 1;
  const newCredits = (Number(reward.totalCreditsEarned) || 0) + CREDITS_PER_REFERRAL;

  // Check tier upgrade
  const prevTier = getCurrentTier(prevConversions);
  const newTier = getCurrentTier(newConversions);
  let newFreeMonths = Number(reward.totalFreeMonthsEarned) || 0;
  let tierUnlocked = '';
  if (newTier.current && (!prevTier.current || newTier.current.threshold > prevTier.current.threshold)) {
    newFreeMonths += newTier.current.monthsFree;
    tierUnlocked = newTier.current.label;
  }

  await blink.db.table<any>('referral_rewards').update(reward.id, {
    totalConversions: newConversions,
    totalCreditsEarned: newCredits,
    totalFreeMonthsEarned: newFreeMonths,
    lastConversionAt: new Date().toISOString(),
  });

  // Log the event
  await blink.db.table<any>('referral_reward_events').create({
    id: `rre_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    referrerUserId: referrerId,
    referredUserId: body.newUserId || '',
    referredEmail: body.newUserEmail || '',
    referralCode: body.referralCode,
    creditsAwardedReferrer: CREDITS_PER_REFERRAL,
    creditsAwardedReferred: BONUS_CREDITS_NEW_USER,
    tierUnlocked,
    status: 'completed',
  });

  // Grant bonus credits to referrer's sms_credits
  try {
    const referrerCredits = await blink.db.table<any>('sms_credits').list({ where: { userId: referrerId }, limit: 1 });
    if (referrerCredits.length) {
      await blink.db.table<any>('sms_credits').update(referrerCredits[0].id, {
        balance: (Number(referrerCredits[0].balance) || 0) + CREDITS_PER_REFERRAL,
        totalGiven: (Number(referrerCredits[0].totalGiven) || 0) + CREDITS_PER_REFERRAL,
      });
    }
  } catch { /* table may not exist */ }

  // Grant bonus credits to referred user
  if (body.newUserId) {
    try {
      const newCredits = await blink.db.table<any>('sms_credits').list({ where: { userId: body.newUserId }, limit: 1 });
      if (newCredits.length) {
        await blink.db.table<any>('sms_credits').update(newCredits[0].id, {
          balance: (Number(newCredits[0].balance) || 0) + BONUS_CREDITS_NEW_USER,
          totalGiven: (Number(newCredits[0].totalGiven) || 0) + BONUS_CREDITS_NEW_USER,
        });
      }
    } catch { /* table may not exist */ }
  }

  return c.json({
    success: true,
    referrerReward: CREDITS_PER_REFERRAL,
    newUserReward: BONUS_CREDITS_NEW_USER,
    totalConversions: newConversions,
    tierUpgrade: tierUnlocked || null,
  });
});

// ── POST /api/referral-rewards/redeem — redeem free months ──────────────────

router.post('/api/referral-rewards/redeem', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env as Env);
  const existing = await blink.db.table<any>('referral_rewards').list({ where: { userId }, limit: 1 });

  if (!existing.length) return c.json({ error: 'No referral rewards found' }, 404);

  const r = existing[0];
  const available = (Number(r.totalFreeMonthsEarned) || 0) - (Number(r.totalFreeMonthsRedeemed) || 0);
  if (available <= 0) return c.json({ error: 'No free months available', available: 0 }, 400);

  await blink.db.table<any>('referral_rewards').update(r.id, {
    totalFreeMonthsRedeemed: (Number(r.totalFreeMonthsRedeemed) || 0) + 1,
    updatedAt: new Date().toISOString(),
  });

  return c.json({
    success: true,
    redeemed: 1,
    remaining: available - 1,
    message: '1 mois gratuit sera appliqué à votre prochaine facturation.',
  });
});
