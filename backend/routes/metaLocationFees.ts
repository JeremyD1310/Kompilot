/**
 * Meta Location Fees API route
 *
 * GET  /api/meta/location-fees/summary — Aggregate location fees for the user's campaigns
 * POST /api/meta/location-fees/calculate — Calculate real spend for arbitrary spend data
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta } from '../lib/stripeHelpers';
import {
  calculateRealMetaSpendBatch,
  LOCATION_FEE_RATES,
  LOCATION_FEE_COUNTRIES,
  getLocationFeeNotice,
  type SpendInput,
} from '../lib/metaLocationFees';

export const router = new Hono();

// ── GET /api/meta/location-fees/summary ─────────────────────────────────────

router.get('/api/meta/location-fees/summary', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // Get user's Meta Ads spend data from the creative_reports table
  // or from the metaMarketing integration
  const meta = await getUserMeta(blink, auth.userId);

  // Try to get recent campaign spend data
  let campaignSpend: SpendInput[] = [];

  try {
    // Read from creative_reports if available
    const reports = await blink.db.creativeReports.list({
      where: { userId: auth.userId },
      limit: 10,
      orderBy: { createdAt: 'desc' },
    }) as any[];

    if (reports.length > 0) {
      // Parse the most recent report's Meta data
      const latest = reports[0];
      if (latest.rawMetaData) {
        try {
          const rawData = JSON.parse(latest.rawMetaData);
          // Map Meta API response to our SpendInput format
          if (Array.isArray(rawData)) {
            campaignSpend = rawData.map((item: any) => ({
              country: item.country || item.delivery_region || 'FR',
              spend: Number(item.spend) || 0,
              campaign_name: item.campaign_name || item.adsetName || '',
            }));
          }
        } catch { /* non-fatal */ }
      }
    }
  } catch { /* non-fatal — table may not exist yet */ }

  // If no real data, return the rates + notice for the UI to display
  if (campaignSpend.length === 0) {
    return c.json({
      has_data: false,
      rates: Object.values(LOCATION_FEE_RATES),
      supported_countries: LOCATION_FEE_COUNTRIES,
      notice: getLocationFeeNotice(),
      aggregate: {
        total_raw_spend: 0,
        total_location_fees: 0,
        total_real_spend: 0,
        by_country: {},
      },
    });
  }

  const result = calculateRealMetaSpendBatch(campaignSpend);

  return c.json({
    has_data: true,
    rates: Object.values(LOCATION_FEE_RATES),
    supported_countries: LOCATION_FEE_COUNTRIES,
    notice: getLocationFeeNotice(),
    ...result,
  });
});

// ── POST /api/meta/location-fees/calculate ──────────────────────────────────

router.post('/api/meta/location-fees/calculate', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ entries: SpendInput[] }>();

  if (!body?.entries || !Array.isArray(body.entries)) {
    return c.json({ error: 'entries array required' }, 400);
  }

  const result = calculateRealMetaSpendBatch(body.entries);

  return c.json({
    rates: Object.values(LOCATION_FEE_RATES),
    ...result,
  });
});
