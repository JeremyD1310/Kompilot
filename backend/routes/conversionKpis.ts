/**
 * conversionKpis.ts — Conversion KPI Dashboard Routes
 *
 * Aggregates appointment data from Instant Forms (Calendly, HighLevel, HubSpot)
 * to display conversion funnel metrics in the dashboard.
 *
 * Routes:
 *   GET /api/conversion-kpis/summary  — Aggregate KPIs (leads, appointments, rates, by provider)
 *   GET /api/conversion-kpis/timeline — Daily appointment counts (last 30 days)
 */
import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

async function verifyAuth(c: any): Promise<{ valid: boolean; userId?: string }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return { valid: false };
  const env = c.env as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(authHeader);
  if (!auth.valid) return { valid: false };
  return { valid: true, userId: auth.userId };
}

// ── GET /api/conversion-kpis/summary ───────────────────────────────────────

router.get('/api/conversion-kpis/summary', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);
  const days = parseInt(c.req.query('days') || '30', 10);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  try {
    // Fetch all appointments for this user within the time range
    const appointments = await (blink as any).db.table('instant_form_appointments').list({
      where: { user_id: auth.userId },
      orderBy: { created_at: 'desc' },
      limit: 500,
    });

    // Fetch all configs for this user
    const configs = await (blink as any).db.table('instant_form_configs').list({
      where: { user_id: auth.userId },
      limit: 50,
    });

    const filtered = (appointments || []).filter((a: any) => a.created_at >= cutoff);

    // Status breakdown
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    const providerCounts: Record<string, number> = { calendly: 0, highlevel: 0, hubspot: 0, none: 0 };

    for (const appt of filtered) {
      const status = appt.appointment_status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      const provider = appt.provider || 'none';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }

    const totalConfigs = (configs || []).length;
    const totalLeads = filtered.length;
    const totalAppointments = filtered.filter((a: any) => 
      ['confirmed', 'completed'].includes(a.appointment_status)
    ).length;
    const conversionRate = totalLeads > 0 ? Math.round((totalAppointments / totalLeads) * 100) : 0;

    // Aggregate from configs
    const configAgg = (configs || []).reduce((acc: any, cfg: any) => ({
      totalConfigLeads: acc.totalConfigLeads + (cfg.total_leads || 0),
      totalConfigAppointments: acc.totalConfigAppointments + (cfg.total_appointments || 0),
    }), { totalConfigLeads: 0, totalConfigAppointments: 0 });

    return c.json({
      period: { days, from: cutoff, to: new Date().toISOString() },
      kpis: {
        totalLeads,
        totalAppointments,
        conversionRate,
        totalConfigs,
        avgLeadsPerDay: Math.round((totalLeads / Math.max(1, days)) * 10) / 10,
      },
      byStatus: statusCounts,
      byProvider: providerCounts,
      configSummary: configAgg,
    });
  } catch (err: any) {
    console.error('[ConversionKpis:GET/summary]', err.message);
    return c.json({ error: 'Server error' }, 500);
  }
});

// ── GET /api/conversion-kpis/timeline ──────────────────────────────────────

router.get('/api/conversion-kpis/timeline', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);
  const days = parseInt(c.req.query('days') || '30', 10);

  try {
    const appointments = await (blink as any).db.table('instant_form_appointments').list({
      where: { user_id: auth.userId },
      orderBy: { created_at: 'desc' },
      limit: 500,
    });

    const now = Date.now();
    const cutoff = now - days * 86400000;
    const filtered = (appointments || []).filter((a: any) => new Date(a.created_at).getTime() >= cutoff);

    // Build daily buckets
    const daily: Record<string, { leads: number; appointments: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(now - (days - 1 - i) * 86400000);
      const key = d.toISOString().split('T')[0];
      daily[key] = { leads: 0, appointments: 0 };
    }

    for (const appt of filtered) {
      const day = (appt.created_at || '').split('T')[0];
      if (!daily[day]) daily[day] = { leads: 0, appointments: 0 };
      daily[day].leads += 1;
      if (['confirmed', 'completed'].includes(appt.appointment_status)) {
        daily[day].appointments += 1;
      }
    }

    return c.json({
      timeline: Object.entries(daily).map(([date, data]) => ({
        date,
        leads: data.leads,
        appointments: data.appointments,
      })),
    });
  } catch (err: any) {
    console.error('[ConversionKpis:GET/timeline]', err.message);
    return c.json({ error: 'Server error' }, 500);
  }
});
