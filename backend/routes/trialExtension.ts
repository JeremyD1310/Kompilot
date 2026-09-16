/**
 * Trial Extension via Magic Link
 *
 * POST /api/trial/extension/generate  — Generate a unique magic link for trial extension (called by backend cron)
 * POST /api/trial/extension/validate  — Validate token + extend trial by the canonical 14-day offer (called when user clicks link)
 * GET  /api/trial/extension/check/:token — Check if a token is valid (for frontend pre-display)
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';
import { buildTrialExtensionConfirmEmail } from '../lib/emailTemplates';
import { TRIAL_DAYS } from '../../shared/pricingCatalog';

export const router = new Hono();

const EXTENSION_DAYS = TRIAL_DAYS;
const TOKEN_EXPIRY_HOURS = 48;

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Generate extension token ───────────────────────────────────────────────────
// Called internally when building the J6 email, or via admin route

router.post('/api/trial/extension/generate', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const rawEnv = c.env as any;

  // Auth required (internal or user)
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { userId?: string; email?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const targetUserId = body.userId || auth.userId;

  // Get user email if not provided
  let email = body.email;
  if (!email) {
    const meta = await getUserMeta(blink, targetUserId);
    email = (meta.email as string) || '';
  }
  if (!email) return c.json({ error: 'User email not found' }, 400);

  // Check if user already used an extension
  const meta = await getUserMeta(blink, targetUserId);
  if (meta.trial_extended === 'true' || meta.trial_extended === true) {
    return c.json({
      error: 'Extension already used',
      code: 'ALREADY_EXTENDED',
      message: 'Cet utilisateur a déjà bénéficié d\'une prolongation d\'essai.',
    }, 409);
  }

  // Generate token
  const plainToken = uid();
  const tokenHash = await sha256(plainToken);
  const lookupHash = await sha256(email.toLowerCase().trim());
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Store in magic_link_tokens table (reuse existing schema)
  const blinkDb = blink as any;
  await blinkDb.db.magicLinkTokens.create({
    id: uid(),
    email: email.toLowerCase().trim(),
    tokenHash,
    lookupHash,
    redirectUrl: '/dashboard',
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  // Build the magic link URL
  const baseUrl = rawEnv.BASE_URL || 'https://kompilot.blinkpowered.com';
  const magicLinkUrl = `${baseUrl}/extend-trial?token=${plainToken}`;

  return c.json({
    success: true,
    magicLinkUrl,
    expiresAt,
    userId: targetUserId,
    email,
  });
});

// ── Validate extension token ───────────────────────────────────────────────────
// Called when user clicks the magic link

router.post('/api/trial/extension/validate', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const rawEnv = c.env as any;

  let body: { token: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body.token) return c.json({ error: 'Token required' }, 400);

  // Hash the token to look it up
  const tokenHash = await sha256(body.token);

  // Find the token in DB
  const tokens = await (blink as any).db.magicLinkTokens.list({
    where: { tokenHash },
    limit: 1,
  });

  const tokenRecord = tokens[0];
  if (!tokenRecord) {
    return c.json({ error: 'Invalid or expired token', code: 'invalid_token' }, 404);
  }

  // Check expiry
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    return c.json({ error: 'Token expired', code: 'token_expired' }, 410);
  }

  // Find user by email
  const email = tokenRecord.email;
  const users = await (blink as any).db.users.list({
    where: { email },
    limit: 1,
  });

  if (!users.length) {
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404);
  }

  const user = users[0];

  // Check if already extended
  const meta = await getUserMeta(blink, user.id);
  if (meta.trial_extended === 'true' || meta.trial_extended === true) {
    return c.json({ error: 'Extension already used', code: 'ALREADY_EXTENDED' }, 409);
  }

  // Calculate new trial end date
  const currentEnd = meta.trial_end
    ? new Date(meta.trial_end as string)
    : new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const newEndDate = new Date(currentEnd.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000);

  // Apply extension
  await patchUserMeta(blink, user.id, {
    trial_end: newEndDate.toISOString(),
    trial_extended: 'true',
    subscription_status: 'trialing',
  });

  // Delete the used token
  try {
    await (blink as any).db.magicLinkTokens.delete(tokenRecord.id);
  } catch { /* non-fatal */ }

  // Send confirmation email
  try {
    const firstName = (user.displayName || email.split('@')[0]).split(' ')[0];
    const { subject, html, text } = buildTrialExtensionConfirmEmail({
      firstName,
      newEndDate: newEndDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    });

    await (blink as any).notifications.email({
      to: email,
      subject,
      html,
      text,
    });
  } catch (emailErr) {
    console.error('[trial/extension] confirmation email error (non-fatal):', emailErr);
  }

  return c.json({
    success: true,
    message: `Essai prolongé de ${EXTENSION_DAYS} jours`,
    newEndDate: newEndDate.toISOString(),
    userId: user.id,
  });
});

// ── Check token validity (for frontend pre-display) ────────────────────────────

router.get('/api/trial/extension/check/:token', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const token = c.req.param('token');

  if (!token) return c.json({ valid: false, reason: 'missing_token' });

  const tokenHash = await sha256(token);
  const tokens = await (blink as any).db.magicLinkTokens.list({
    where: { tokenHash },
    limit: 1,
  });

  const record = tokens[0];
  if (!record) return c.json({ valid: false, reason: 'not_found' });

  if (new Date(record.expiresAt) < new Date()) {
    return c.json({ valid: false, reason: 'expired' });
  }

  return c.json({ valid: true, email: record.email, expiresAt: record.expiresAt });
});
