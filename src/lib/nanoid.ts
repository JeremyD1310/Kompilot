/** Lightweight nanoid replacement — crypto-based, no dependency needed */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function nanoid(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).map(b => ALPHABET[b % ALPHABET.length]).join('');
}
