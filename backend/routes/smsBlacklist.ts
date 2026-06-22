/** SMS STOP compliance — Twilio inbound webhook + blacklist management */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

// POST /api/sms/inbound — Twilio inbound webhook
// Twilio sends form-encoded body with: From, Body, To, etc.
router.post('/api/sms/inbound', async (c) => {
  const blink = getBlink(c.env as Env);

  let body: Record<string, string> = {};
  try {
    const text = await c.req.text();
    for (const pair of text.split('&')) {
      const [k, v] = pair.split('=');
      if (k && v !== undefined) body[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  } catch {
    return c.text('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200, { 'Content-Type': 'text/xml' });
  }

  const from = body['From'] || body['from'] || '';
  const messageBody = (body['Body'] || body['body'] || '').trim().toUpperCase();

  const isStopCommand = ['STOP', 'UNSUBSCRIBE', 'ARRET', 'ARRÊT', 'DESABONNER', 'DÉSABONNER'].includes(messageBody);

  if (from && isStopCommand) {
    try {
      // Check if already blacklisted
      const existing = await (blink.db as any).smsBlacklist.list({ where: { phoneNumber: from }, limit: 1 });
      if (!existing || existing.length === 0) {
        await (blink.db as any).smsBlacklist.create({
          id: crypto.randomUUID(),
          phoneNumber: from,
          unsubscribedAt: new Date().toISOString(),
        });
        console.log(`[sms/inbound] STOP received from ${from} → added to blacklist`);
      }
    } catch (e) {
      console.error('[sms/inbound] blacklist insert error:', e);
    }
  }

  // Respond with empty TwiML (required by Twilio)
  return c.text('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200, { 'Content-Type': 'text/xml' });
});

// GET /api/sms/blacklist/check?phone=+33612345678 — check before sending
router.get('/api/sms/blacklist/check', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const phone = c.req.query('phone');
  if (!phone) return c.json({ error: 'Missing phone parameter' }, 400);

  try {
    const rows = await (blink.db as any).smsBlacklist.list({ where: { phoneNumber: phone }, limit: 1 });
    return c.json({ phone, blacklisted: Array.isArray(rows) && rows.length > 0 });
  } catch {
    return c.json({ phone, blacklisted: false });
  }
});

// DELETE /api/sms/blacklist/:phone — manual removal by admin
router.delete('/api/sms/blacklist/:phone', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const phone = decodeURIComponent(c.req.param('phone'));
  try {
    const rows = await (blink.db as any).smsBlacklist.list({ where: { phoneNumber: phone }, limit: 10 });
    let deleted = 0;
    for (const row of (rows as any[])) {
      try { await (blink.db as any).smsBlacklist.delete(row.id); deleted++; } catch {}
    }
    return c.json({ success: true, phone, deleted });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
