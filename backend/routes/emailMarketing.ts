/**
 * emailMarketing.ts — Mailchimp & SendGrid integration routes
 *
 * POST /api/email-marketing/mailchimp/test-connection   — validate Mailchimp API key
 * GET  /api/email-marketing/mailchimp/lists             — fetch audience lists
 * GET  /api/email-marketing/mailchimp/contacts          — fetch contacts from a list
 * POST /api/email-marketing/mailchimp/sync              — sync contacts to Blink DB
 * POST /api/email-marketing/sendgrid/test-connection    — validate SendGrid API key
 * POST /api/email-marketing/sendgrid/send               — send a marketing campaign
 * GET  /api/email-marketing/sendgrid/stats              — get sending stats
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const router = new Hono();

// ── Helpers ────────────────────────────────────────────────────────────────────

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

async function getAuth(c: any) {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return null;
  return auth;
}

function timeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// ── Mailchimp — Test connection ────────────────────────────────────────────────

router.post('/api/email-marketing/mailchimp/test-connection', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey } = await c.req.json();
    if (!apiKey) return c.json({ error: 'apiKey is required' }, 400);

    // Mailchimp API key format: <key>-<datacenter>
    const dc = apiKey.split('-').pop();
    if (!dc || apiKey.split('-').length < 2) {
      return c.json({ error: 'Invalid Mailchimp API key format (expected: key-dc)' }, 400);
    }

    const { signal, clear } = timeout(8000);
    try {
      const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
        headers: {
          Authorization: `apikey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal,
      });
      clear();

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        return c.json({ error: err.detail ?? 'Invalid Mailchimp API key' }, 400);
      }

      const data = await res.json() as any;
      return c.json({ success: true, message: data.health_status ?? 'Everything\'s Chimpy!' });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Connection failed' }, 500);
  }
});

// ── Mailchimp — List audiences ─────────────────────────────────────────────────

router.post('/api/email-marketing/mailchimp/lists', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey } = await c.req.json();
    if (!apiKey) return c.json({ error: 'apiKey is required' }, 400);

    const dc = apiKey.split('-').pop();
    const { signal, clear } = timeout(8000);
    try {
      const res = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists?count=20&fields=lists.id,lists.name,lists.stats`,
        {
          headers: { Authorization: `apikey ${apiKey}` },
          signal,
        }
      );
      clear();

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        return c.json({ error: err.detail ?? 'Failed to fetch lists' }, res.status);
      }

      const data = await res.json() as any;
      return c.json({ lists: data.lists ?? [] });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to fetch lists' }, 500);
  }
});

// ── Mailchimp — Fetch contacts from a list ────────────────────────────────────

router.post('/api/email-marketing/mailchimp/contacts', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey, listId, count = 100 } = await c.req.json();
    if (!apiKey || !listId) return c.json({ error: 'apiKey and listId are required' }, 400);

    const dc = apiKey.split('-').pop();
    const { signal, clear } = timeout(10000);
    try {
      const res = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members?count=${count}&fields=members.id,members.email_address,members.full_name,members.status,members.timestamp_signup`,
        {
          headers: { Authorization: `apikey ${apiKey}` },
          signal,
        }
      );
      clear();

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        return c.json({ error: err.detail ?? 'Failed to fetch contacts' }, res.status);
      }

      const data = await res.json() as any;
      const contacts = (data.members ?? []).map((m: any) => ({
        id: m.id,
        email: m.email_address,
        name: m.full_name || m.email_address.split('@')[0],
        status: m.status,
        createdAt: m.timestamp_signup,
        source: 'mailchimp',
      }));

      return c.json({ contacts, total: data.total_items ?? contacts.length });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to fetch contacts' }, 500);
  }
});

// ── SendGrid — Test connection ─────────────────────────────────────────────────

router.post('/api/email-marketing/sendgrid/test-connection', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey } = await c.req.json();
    if (!apiKey) return c.json({ error: 'apiKey is required' }, 400);
    if (!apiKey.startsWith('SG.')) {
      return c.json({ error: 'Invalid SendGrid API key (must start with SG.)' }, 400);
    }

    const { signal, clear } = timeout(8000);
    try {
      const res = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal,
      });
      clear();

      if (!res.ok) {
        return c.json({ error: 'Invalid SendGrid API key' }, 400);
      }

      const profile = await res.json() as any;
      return c.json({
        success: true,
        username: profile.username,
        email: profile.email,
      });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Connection failed' }, 500);
  }
});

// ── SendGrid — Send campaign ───────────────────────────────────────────────────

router.post('/api/email-marketing/sendgrid/send', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey, fromEmail, fromName, subject, htmlContent, recipients } = await c.req.json();

    if (!apiKey || !fromEmail || !subject || !htmlContent || !recipients?.length) {
      return c.json({ error: 'Missing required fields: apiKey, fromEmail, subject, htmlContent, recipients' }, 400);
    }
    if (!apiKey.startsWith('SG.')) {
      return c.json({ error: 'Invalid SendGrid API key' }, 400);
    }

    // Build personalizations (batch up to 1000)
    const batch = recipients.slice(0, 1000);
    const payload = {
      personalizations: [
        {
          to: batch.map((r: any) => ({
            email: typeof r === 'string' ? r : r.email,
            name: typeof r === 'string' ? undefined : r.name,
          })).filter((r: any) => r.email),
        },
      ],
      from: { email: fromEmail, name: fromName ?? fromEmail },
      subject,
      content: [{ type: 'text/html', value: htmlContent }],
    };

    const { signal, clear } = timeout(15000);
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });
      clear();

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        const msg = errBody?.errors?.[0]?.message ?? 'Failed to send email';
        return c.json({ error: msg }, res.status === 403 ? 403 : 400);
      }

      return c.json({ success: true, sent: batch.length });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Send failed' }, 500);
  }
});

// ── SendGrid — Email stats (last 7 days) ──────────────────────────────────────

router.post('/api/email-marketing/sendgrid/stats', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { apiKey } = await c.req.json();
    if (!apiKey || !apiKey.startsWith('SG.')) {
      return c.json({ error: 'Invalid SendGrid API key' }, 400);
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { signal, clear } = timeout(8000);
    try {
      const res = await fetch(
        `https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        }
      );
      clear();

      if (!res.ok) {
        return c.json({ error: 'Failed to fetch stats' }, res.status);
      }

      const data = await res.json() as any[];
      // Aggregate across days
      const totals = (data ?? []).reduce((acc: any, day: any) => {
        const m = day.stats?.[0]?.metrics ?? {};
        acc.requests += m.requests ?? 0;
        acc.delivered += m.delivered ?? 0;
        acc.opens += m.opens ?? 0;
        acc.clicks += m.clicks ?? 0;
        acc.bounces += m.bounces ?? 0;
        acc.unsubscribes += m.unsubscribes ?? 0;
        return acc;
      }, { requests: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 });

      return c.json({ stats: totals, period: `${startDate} → ${endDate}` });
    } catch (e: any) {
      clear();
      if (e.name === 'AbortError') return c.json({ error: 'Request timeout' }, 408);
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to fetch stats' }, 500);
  }
});

export { router };
