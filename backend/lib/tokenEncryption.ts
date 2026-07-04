/**
 * OAuth token encryption/decryption for Blink Backend (Cloudflare Workers).
 *
 * Uses AES-256-GCM via the Web Crypto API (available natively in CF Workers).
 * Each token gets a unique IV, prepended to the ciphertext as:
 *   base64( iv(12 bytes) ‖ ciphertext ‖ authTag(16 bytes) )
 *
 * ENV requirement: pass a 256-bit key encoded as base64 when calling.
 * Generate with: `crypto.getRandomValues(new Uint8Array(32))` → base64.
 * If no key is provided, falls back to plaintext storage (dev mode).
 *
 * Usage:
 *   const encrypted = await encryptToken(plainText, encryptionKey);
 *   const decrypted = await decryptToken(encrypted, encryptionKey);
 */

// ── Key import ───────────────────────────────────────────────────────────────

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// ── Encrypt ──────────────────────────────────────────────────────────────────

export async function encryptToken(plaintext: string, base64Key: string): Promise<string> {
  if (!plaintext) return '';
  if (!base64Key) {
    console.warn('[TokenEncryption] No encryption key set — storing plaintext');
    return plaintext;
  }

  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  // Pack: iv (12 bytes) + ciphertext + tag (16 bytes)
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  // Encode as base64 for DB storage
  return btoa(String.fromCharCode(...combined));
}

// ── Decrypt ──────────────────────────────────────────────────────────────────

export async function decryptToken(encryptedBase64: string, base64Key: string): Promise<string> {
  if (!encryptedBase64) return '';
  if (!base64Key) {
    // No key — assume plaintext (legacy/unencrypted)
    return encryptedBase64;
  }

  // Check if this looks like base64-encoded encrypted data
  // Encrypted tokens are longer and contain only base64 chars
  // Short tokens or non-base64 are treated as plaintext
  if (encryptedBase64.length < 30 || !/^[A-Za-z0-9+/]+=*$/.test(encryptedBase64)) {
    return encryptedBase64; // Likely plaintext legacy token
  }

  try {
    const key = await importKey(base64Key);
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    if (combined.length < 29) { // 12 (iv) + 1 (min cipher) + 16 (tag)
      return encryptedBase64; // Too short to be encrypted, treat as plaintext
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed — likely plaintext legacy token
    return encryptedBase64;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a new random encryption key (base64 encoded). Call once during setup. */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}

/** Check if a token appears to be encrypted (base64, sufficient length) */
export function isEncrypted(token: string): boolean {
  if (!token || token.length < 30) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(token);
}
