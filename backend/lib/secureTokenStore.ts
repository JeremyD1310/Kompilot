/**
 * Secure OAuth token store — encrypts tokens before DB writes, decrypts on reads.
 *
 * Wraps the `oauth_tokens` Blink DB table with transparent AES-256-GCM encryption.
 * Falls back to plaintext if no encryption key provided (dev/migration mode).
 *
 * Usage:
 *   import { createSecureTokenStore } from '../lib/secureTokenStore';
 *   const store = createSecureTokenStore(blink, myEncryptionKey);
 *
 *   await store.save({ userId, provider: 'google', accessToken, refreshToken, expiresAt, scopes });
 *   const tokens = await store.getByUser(userId, 'google');
 *   const decrypted = await store.getDecryptedToken(accessTokenFromDb);
 */

import { encryptToken, decryptToken, isEncrypted } from './tokenEncryption';

interface OAuthTokenRecord {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SaveTokenInput {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes?: string[];
}

export function createSecureTokenStore(blink: any, encryptionKey?: string) {
  const table = () => blink.db.table<OAuthTokenRecord>('oauth_tokens');

  return {
    /**
     * Save or update an OAuth token (encrypted).
     * If a token already exists for this user+provider, it's updated (upsert).
     */
    async save(input: SaveTokenInput): Promise<string> {
      const encAccessToken  = await encryptToken(input.accessToken, encryptionKey ?? '');
      const encRefreshToken = await encryptToken(input.refreshToken ?? '', encryptionKey ?? '');
      const now = new Date().toISOString();
      const id = `oauth_${input.userId}_${input.provider}`;

      await table().upsert({
        id,
        userId: input.userId,
        provider: input.provider,
        accessToken: encAccessToken,
        refreshToken: encRefreshToken,
        expiresAt: input.expiresAt,
        scopes: JSON.stringify(input.scopes ?? []),
        status: 'active',
        updatedAt: now,
      });

      return id;
    },

    /**
     * Get tokens for a user + provider (encrypted — call decrypt on the result).
     */
    async getByUser(userId: string, provider: string): Promise<OAuthTokenRecord | null> {
      const rows = await table().list({
        where: { userId, provider, status: 'active' },
        limit: 1,
      });
      return rows[0] ?? null;
    },

    /**
     * Decrypt an access token (handles both encrypted and legacy plaintext).
     */
    async decryptAccessToken(encryptedToken: string): Promise<string> {
      return decryptToken(encryptedToken, encryptionKey ?? '');
    },

    /**
     * Decrypt a refresh token (handles both encrypted and legacy plaintext).
     */
    async decryptRefreshToken(encryptedToken: string): Promise<string> {
      return decryptToken(encryptedToken, encryptionKey ?? '');
    },

    /**
     * Revoke (soft-delete) a token.
     */
    async revoke(userId: string, provider: string): Promise<void> {
      const existing = await this.getByUser(userId, provider);
      if (existing) {
        await table().update(existing.id, { status: 'revoked', updatedAt: new Date().toISOString() });
      }
    },

    /**
     * Get all active tokens for a user (across all providers).
     */
    async getAllForUser(userId: string): Promise<OAuthTokenRecord[]> {
      return table().list({ where: { userId, status: 'active' } });
    },

    /**
     * Migrate existing plaintext tokens to encrypted.
     * Run once during migration — encrypts any unencrypted tokens in the DB.
     */
    async migratePlaintext(limit = 50): Promise<number> {
      if (!encryptionKey) return 0;

      const rows = await table().list({ where: { status: 'active' }, limit });
      let migrated = 0;

      for (const row of rows) {
        if (row.accessToken && !isEncrypted(row.accessToken)) {
          await table().update(row.id, {
            accessToken:  await encryptToken(row.accessToken, encryptionKey),
            refreshToken: await encryptToken(row.refreshToken ?? '', encryptionKey),
            updatedAt:    new Date().toISOString(),
          });
          migrated++;
        }
      }

      return migrated;
    },
  };
}
