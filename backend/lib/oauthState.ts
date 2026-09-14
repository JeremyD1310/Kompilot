const STATE_TTL_MS = 10 * 60 * 1000;

type OAuthStatePayload = {
  userId: string;
  ts: number;
  nonce: string;
};

function encode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return encode(String.fromCharCode(...new Uint8Array(bytes)));
}

export async function createOAuthState(userId: string, secret: string) {
  const payload = encode(JSON.stringify({ userId, ts: Date.now(), nonce: crypto.randomUUID() } satisfies OAuthStatePayload));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function readOAuthState(value: string, secret: string) {
  const [payload, providedSignature] = value.split('.');
  const expectedSignature = payload ? await signature(payload, secret) : '';
  if (!payload || !providedSignature || providedSignature !== expectedSignature) {
    throw new Error('Invalid OAuth state');
  }

  const parsed = JSON.parse(decode(payload)) as Partial<OAuthStatePayload>;
  if (!parsed.userId || !parsed.ts || Date.now() - parsed.ts > STATE_TTL_MS) {
    throw new Error('OAuth state expired');
  }
  return parsed.userId;
}
