/**
 * abTesting.ts — A/B test engine for email campaigns
 *
 * POST /api/ab-tests/create        — create a new A/B test
 * POST /api/ab-tests/send          — send both variants via SendGrid + record results
 * GET  /api/ab-tests               — list user's A/B tests
 * GET  /api/ab-tests/:id           — get single test with results
 * POST /api/ab-tests/:id/winner    — mark a winner variant
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const router = new Hono();

function getBlink(env: Record<string, string>) {
  return createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
}

async function getAuth(c: any) {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return null;
  return auth;
}

function timeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// ── POST /api/ab-tests/create ─────────────────────────────────────────────────
// Persists the test config to DB (does not send yet)

router.post('/api/ab-tests/create', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const {
      name,
      testType,          // 'subject' | 'sender' | 'content'
      fromEmail,
      fromName,
      htmlContent,       // variant A content
      variantA,          // {subject, fromName?, htmlContent?} depending on testType
      variantB,          // same shape
      recipientEmails,   // string[] — full list, split 50/50 server-side
    } = await c.req.json();

    if (!name || !testType || !variantA || !variantB || !recipientEmails?.length) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const blink = getBlink(c.env as Record<string, string>);
    const id = uid();
    const half = Math.ceil(recipientEmails.length / 2);

    const test = {
      id,
      userId: auth.userId,
      name,
      testType,
      fromEmail,
      fromName: fromName ?? '',
      baseHtmlContent: htmlContent ?? '',
      variantALabel: variantA.label ?? 'Variant A',
      variantBLabel: variantB.label ?? 'Variant B',
      variantASubject: variantA.subject ?? '',
      variantBSubject: variantB.subject ?? '',
      variantAFromName: variantA.fromName ?? fromName ?? '',
      variantBFromName: variantB.fromName ?? fromName ?? '',
      variantAHtml: variantA.htmlContent ?? htmlContent ?? '',
      variantBHtml: variantB.htmlContent ?? htmlContent ?? '',
      recipientsA: JSON.stringify(recipientEmails.slice(0, half)),
      recipientsB: JSON.stringify(recipientEmails.slice(half)),
      totalRecipients: recipientEmails.length,
      status: 'draft',
      sentAt: null,
      winnerVariant: null,
      createdAt: new Date().toISOString(),
    };

    await blink.db.abEmailTests.create(test as any);
    return c.json({ success: true, test });
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Create failed' }, 500);
  }
});

// ── POST /api/ab-tests/send ───────────────────────────────────────────────────
// Actually fires both variants via SendGrid

router.post('/api/ab-tests/send', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { testId, sendgridApiKey } = await c.req.json();
    if (!testId || !sendgridApiKey) return c.json({ error: 'testId and sendgridApiKey required' }, 400);

    const blink = getBlink(c.env as Record<string, string>);
    const rows = await blink.db.abEmailTests.list({ where: { id: testId, userId: auth.userId } });
    if (!rows.length) return c.json({ error: 'Test not found' }, 404);

    const test = rows[0] as any;
    if (test.status === 'sent') return c.json({ error: 'Test already sent' }, 400);

    const recipientsA: string[] = JSON.parse(test.recipientsA ?? '[]');
    const recipientsB: string[] = JSON.parse(test.recipientsB ?? '[]');

    async function sendVariant(
      recipients: string[],
      subject: string,
      fromName: string,
      html: string,
    ) {
      if (!recipients.length) return { ok: true, sent: 0 };
      const payload = {
        personalizations: [{ to: recipients.map((e: string) => ({ email: e })) }],
        from: { email: test.fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }],
      };
      const { signal, clear } = timeout(15000);
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });
        clear();
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as any;
          return { ok: false, error: err?.errors?.[0]?.message ?? 'Send failed' };
        }
        return { ok: true, sent: recipients.length };
      } catch (e: any) {
        clear();
        return { ok: false, error: e.message };
      }
    }

    const [resA, resB] = await Promise.all([
      sendVariant(
        recipientsA,
        test.variantASubject || test.baseSubject || 'Email A',
        test.variantAFromName,
        test.variantAHtml,
      ),
      sendVariant(
        recipientsB,
        test.variantBSubject || test.baseSubject || 'Email B',
        test.variantBFromName,
        test.variantBHtml,
      ),
    ]);

    if (!resA.ok || !resB.ok) {
      return c.json({
        error: `Variant A: ${resA.error ?? 'ok'} | Variant B: ${resB.error ?? 'ok'}`,
      }, 400);
    }

    await blink.db.abEmailTests.update(
      { status: 'sent', sentAt: new Date().toISOString() },
      { where: { id: testId } },
    );

    return c.json({ success: true, sentA: resA.sent, sentB: resB.sent });
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Send failed' }, 500);
  }
});

// ── GET /api/ab-tests ─────────────────────────────────────────────────────────

router.get('/api/ab-tests', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as Record<string, string>);
    const tests = await blink.db.abEmailTests.list({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    return c.json({ tests });
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Fetch failed' }, 500);
  }
});

// ── POST /api/ab-tests/:id/winner ─────────────────────────────────────────────

router.post('/api/ab-tests/:id/winner', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { variant } = await c.req.json(); // 'A' | 'B'
    if (variant !== 'A' && variant !== 'B') return c.json({ error: 'variant must be A or B' }, 400);

    const blink = getBlink(c.env as Record<string, string>);
    await blink.db.abEmailTests.update(
      { winnerVariant: variant },
      { where: { id: c.req.param('id'), userId: auth.userId } },
    );
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Update failed' }, 500);
  }
});

export { router };
