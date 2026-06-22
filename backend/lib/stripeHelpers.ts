/**
 * Shared Stripe utility functions used by billing and webhook routes.
 */
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from './types';

export const getBlink = (env: Env) =>
  createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey:  env.BLINK_SECRET_KEY,
  });

/** Verify Stripe webhook signature using CF Workers native crypto */
export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = header.split(',');
    const t  = parts.find(p => p.startsWith('t='))?.slice(2);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
    if (!t || !v1) return false;

    const signedPayload = `${t}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expected === v1;
  } catch {
    return false;
  }
}

/** Get + parse user metadata JSON from Blink DB */
export async function getUserMeta(
  blink: ReturnType<typeof getBlink>,
  userId: string,
): Promise<Record<string, unknown>> {
  try {
    const rows = await blink.db.users.list({ where: { id: userId }, limit: 1 });
    const raw = (rows[0] as any)?.metadata;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Write merged metadata back to users table */
export async function patchUserMeta(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const existing = await getUserMeta(blink, userId);
  const merged = { ...existing, ...patch };
  await blink.db.users.update(userId, { metadata: JSON.stringify(merged) } as any);
}

/** Lookup user_id by Stripe customer_id scanning users.metadata */
export async function findUserByCustomer(
  blink: ReturnType<typeof getBlink>,
  customerId: string,
): Promise<string | null> {
  try {
    const rows = await blink.db.users.list({ limit: 1000 });
    for (const row of rows as any[]) {
      if (!row.metadata) continue;
      try {
        const m = JSON.parse(row.metadata);
        if (m.stripe_customer_id === customerId) return row.id;
      } catch { /* noop */ }
    }
    return null;
  } catch {
    return null;
  }
}
