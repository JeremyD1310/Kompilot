/**
 * customDomain.ts — White-label custom domain management (production-ready)
 *
 * POST   /api/agency/custom-domain    — register a custom domain for white-label
 * GET    /api/agency/custom-domain    — get current domain config + status
 * DELETE /api/agency/custom-domain    — remove domain config
 * POST   /api/agency/custom-domain/check — force DNS verification
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getBlink(env: Env) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });
}

const CNAME_TARGET = 'ssl.kompilot.com';

interface BrandSettings {
  id: string;
  userId: string;
  agencyName: string;
  logoUrl: string;
  primaryColor: string;
  customDomain: string;
  domainStatus: string;
  domainSslStatus: string;
  domainCheckedAt: string;
  cnameTarget: string;
}

// ── POST /api/agency/custom-domain ───────────────────────────────────────────

router.post('/api/agency/custom-domain', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const body = await c.req.json();
    const { subdomain } = body;

    if (!subdomain) return c.json({ error: 'subdomain is required' }, 400);

    // Validate subdomain format
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(subdomain)) {
      return c.json({ error: 'Invalid domain format' }, 400);
    }

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');

    // Check if user already has a domain
    const existing = await brandTable.list({ where: { userId }, limit: 1 });
    const id = existing.length > 0 ? existing[0].id : `bds_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

    if (existing.length > 0) {
      // Update existing
      await brandTable.update(id, {
        customDomain: subdomain,
        domainStatus: 'pending',
        domainSslStatus: 'provisioning',
        domainCheckedAt: new Date().toISOString(),
        cnameTarget: CNAME_TARGET,
      });
    } else {
      // Create new
      await brandTable.create({
        id,
        userId,
        agencyName: '',
        customDomain: subdomain,
        domainStatus: 'pending',
        domainSslStatus: 'provisioning',
        domainCheckedAt: new Date().toISOString(),
        cnameTarget: CNAME_TARGET,
      });
    }

    return c.json({
      id,
      subdomain,
      cnameRecord: CNAME_TARGET,
      status: 'pending',
      sslStatus: 'provisioning',
      checkedAt: new Date().toISOString(),
      userId,
    }, 201);
  } catch (e: any) {
    console.error('[CustomDomain] Error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/agency/custom-domain ────────────────────────────────────────────

router.get('/api/agency/custom-domain', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');
    const rows = await brandTable.list({ where: { userId }, limit: 1 });

    if (rows.length === 0) {
      return c.json({
        configured: false,
        message: 'No custom domain configured. Use POST to register one.',
        cnameTarget: CNAME_TARGET,
      });
    }

    const row = rows[0];
    return c.json({
      configured: true,
      id: row.id,
      subdomain: row.customDomain,
      cnameTarget: row.cnameTarget || CNAME_TARGET,
      status: row.domainStatus || 'pending',
      sslStatus: row.domainSslStatus || 'pending',
      checkedAt: row.domainCheckedAt,
      agencyName: row.agencyName,
      logoUrl: row.logoUrl,
      primaryColor: row.primaryColor,
    });
  } catch (e: any) {
    console.error('[CustomDomain] Error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/agency/custom-domain/check ─────────────────────────────────────

router.post('/api/agency/custom-domain/check', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');
    const rows = await brandTable.list({ where: { userId }, limit: 1 });

    if (rows.length === 0 || !rows[0].customDomain) {
      return c.json({ status: 'idle', message: 'No domain configured' });
    }

    const domain = rows[0].customDomain;
    // Attempt real DNS resolution (CNAME check)
    let dnsOk = false;
    try {
      const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(5000),
      });
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json() as any;
        const answers = dnsData?.Answer ?? [];
        dnsOk = answers.some((a: any) =>
          a.type === 5 && a.data?.toLowerCase().includes(CNAME_TARGET.replace('ssl.', ''))
        );
      }
    } catch {
      // DNS check failed — not necessarily an error; propagation may still be in progress
    }

    const newStatus = dnsOk ? 'active' : 'propagating';
    const newSslStatus = dnsOk ? 'active' : 'provisioning';
    const now = new Date().toISOString();

    await brandTable.update(rows[0].id, {
      domainStatus: newStatus,
      domainSslStatus: newSslStatus,
      domainCheckedAt: now,
    });

    return c.json({
      status: newStatus,
      sslStatus: newSslStatus,
      dnsVerified: dnsOk,
      checkedAt: now,
    });
  } catch (e: any) {
    console.error('[CustomDomain] Check error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── DELETE /api/agency/custom-domain ─────────────────────────────────────────

router.delete('/api/agency/custom-domain', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');
    const rows = await brandTable.list({ where: { userId }, limit: 1 });

    if (rows.length > 0) {
      await brandTable.update(rows[0].id, {
        customDomain: '',
        domainStatus: 'idle',
        domainSslStatus: 'pending',
        domainCheckedAt: '',
      });
    }

    return c.json({ success: true, message: 'Domain configuration removed' });
  } catch (e: any) {
    console.error('[CustomDomain] Error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/agency/brand-settings ──────────────────────────────────────────

router.post('/api/agency/brand-settings', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const body = await c.req.json();
    const { agencyName, logoUrl, primaryColor } = body;

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');
    const rows = await brandTable.list({ where: { userId }, limit: 1 });

    const id = rows.length > 0
      ? rows[0].id
      : `bds_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

    const updates: Record<string, any> = { userId };
    if (agencyName !== undefined) updates.agencyName = agencyName;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (primaryColor !== undefined) updates.primaryColor = primaryColor;

    if (rows.length > 0) {
      await brandTable.update(id, updates);
    } else {
      await brandTable.create({ id, ...updates });
    }

    return c.json({ success: true, id });
  } catch (e: any) {
    console.error('[BrandSettings] Error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/agency/brand-settings ───────────────────────────────────────────

router.get('/api/agency/brand-settings', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const brandTable = blink.db.table<BrandSettings>('agency_brand_settings');
    const rows = await brandTable.list({ where: { userId }, limit: 1 });

    if (rows.length === 0) {
      return c.json({ agencyName: '', logoUrl: '', primaryColor: '#0D9488' });
    }

    return c.json({
      agencyName: rows[0].agencyName,
      logoUrl: rows[0].logoUrl,
      primaryColor: rows[0].primaryColor,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});