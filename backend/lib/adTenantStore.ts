import { decryptToken, encryptToken } from './tokenEncryption';

function safeMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

async function revokeProviderToken(provider: AdProvider, token: string): Promise<{ attempted: boolean; ok: boolean; status?: number; error?: string }> {
  if (!token) return { attempted: false, ok: false, error: 'missing_access_token' };
  const response = provider === 'meta'
    ? await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
    : await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token }), signal: AbortSignal.timeout(10_000) });
  if (response.ok || (provider === 'google_ads' && response.status === 400)) return { attempted: true, ok: true, status: response.status };
  return { attempted: true, ok: false, status: response.status, error: `${provider}_revoke_http_${response.status}` };
}

export type AdProvider = 'meta' | 'google_ads';

export interface AdTenantContext {
  userId: string;
  organizationId: string;
}

export interface AdConnection {
  id: string;
  userId: string;
  organizationId: string;
  provider: AdProvider;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  tokenExpiresAt: string;
  scopes: string;
  status: string;
  accountCount: number | string;
  lastSyncAt: string | null;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string | null;
  disconnectedAt?: string | null;
  lastErrorCode?: string;
  disconnectReason?: string;
}

function tenantKey(ctx: AdTenantContext) { return `${ctx.organizationId}:${ctx.userId}`; }
function now() { return new Date().toISOString(); }

export function createAdTenantStore(blink: any, encryptionKey: string) {
  const connections = () => blink.db.table<AdConnection>('ad_connections');
  const accounts = () => blink.db.table<any>('ad_accounts');
  const metrics = () => blink.db.table<any>('ad_metrics');
  const events = () => blink.db.table<any>('ad_connection_events');

  return {
    async getConnection(ctx: AdTenantContext, provider: AdProvider) {
      const rows = await connections().list({ where: { organizationId: ctx.organizationId, userId: ctx.userId, provider }, limit: 1 });
      return rows[0] ?? null;
    },
    async saveConnection(ctx: AdTenantContext, provider: AdProvider, accessToken: string, refreshToken: string, expiresAt: string, scopes: string[]) {
      const id = `ad_conn_${provider}_${tenantKey(ctx)}`;
      await connections().upsert({ id, userId: ctx.userId, organizationId: ctx.organizationId, provider, encryptedAccessToken: await encryptToken(accessToken, encryptionKey), encryptedRefreshToken: await encryptToken(refreshToken, encryptionKey), tokenExpiresAt: expiresAt, scopes: JSON.stringify(scopes), status: 'active', accountCount: 0, lastError: '', revokedAt: null, disconnectedAt: null, lastErrorCode: '', disconnectReason: '', updatedAt: now() });
      return id;
    },
    async getAccessToken(connection: AdConnection) {
      return decryptToken(connection.encryptedAccessToken, encryptionKey);
    },
    async getRefreshToken(connection: AdConnection) {
      return decryptToken(connection.encryptedRefreshToken, encryptionKey);
    },
    async updateAccessToken(ctx: AdTenantContext, accessToken: string, expiresAt: string) {
      const existing = await this.getConnection(ctx, 'google_ads');
      if (existing) await connections().update(existing.id, { encryptedAccessToken: await encryptToken(accessToken, encryptionKey), tokenExpiresAt: expiresAt, status: 'active', lastError: '', lastErrorCode: '', updatedAt: now() });
    },
    async listAccounts(ctx: AdTenantContext, provider?: AdProvider) {
      return accounts().list({ where: provider ? { organizationId: ctx.organizationId, userId: ctx.userId, provider } : { organizationId: ctx.organizationId, userId: ctx.userId }, orderBy: { name: 'asc' }, limit: 200 });
    },
    async upsertAccount(ctx: AdTenantContext, connectionId: string, input: { provider: AdProvider; externalId: string; name: string; currency?: string; externalStatus?: string }) {
      const id = `ad_account_${ctx.organizationId}_${input.provider}_${input.externalId}`;
      await accounts().upsert({ id, userId: ctx.userId, organizationId: ctx.organizationId, connectionId, provider: input.provider, externalId: input.externalId, name: input.name, currency: input.currency ?? 'EUR', status: 'active', externalStatus: input.externalStatus ?? '', isSelected: 1, lastSyncedAt: now(), updatedAt: now() });
      return id;
    },
    async writeMetric(ctx: AdTenantContext, input: { accountId: string; provider: AdProvider; campaignId: string; campaignName: string; date: string; spendCents: number; impressions: number; clicks: number; conversions: number; revenueCents?: number; currency?: string; raw?: unknown }) {
      const id = `ad_metric_${input.accountId}_${input.campaignId || 'account'}_${input.date}`;
      await metrics().upsert({ id, userId: ctx.userId, organizationId: ctx.organizationId, adAccountId: input.accountId, provider: input.provider, campaignId: input.campaignId, campaignName: input.campaignName, metricDate: input.date, spendCents: input.spendCents, impressions: input.impressions, clicks: input.clicks, conversions: input.conversions, revenueCents: input.revenueCents ?? 0, currency: input.currency ?? 'EUR', rawJson: JSON.stringify(input.raw ?? {}), createdAt: now() });
    },
    async event(ctx: AdTenantContext, provider: AdProvider, eventType: string, message: string, extra: { correlationId?: string; errorCode?: string; metadataJson?: string } = {}) {
      await events().create({ id: `ad_event_${crypto.randomUUID()}`, userId: ctx.userId, organizationId: ctx.organizationId, provider, eventType, message, correlationId: extra.correlationId ?? '', errorCode: extra.errorCode ?? '', metadataJson: extra.metadataJson ?? '{}' });
    },
    async markConnection(ctx: AdTenantContext, provider: AdProvider, patch: Record<string, unknown>) {
      const existing = await this.getConnection(ctx, provider);
      if (existing) await connections().update(existing.id, { ...patch, updatedAt: now() });
    },
    async disconnect(ctx: AdTenantContext, provider: AdProvider, reason = 'user_requested', correlationId = '') {
      const connection = await this.getConnection(ctx, provider);
      let externalRevocation: { attempted: boolean; ok: boolean; status?: number; error?: string } = { attempted: false, ok: false };
      if (connection) {
        try {
          const token = await this.getAccessToken(connection);
          externalRevocation = await revokeProviderToken(provider, token);
        } catch (error) {
          externalRevocation = { attempted: true, ok: false, error: safeMessage(error) };
        }
        await connections().update(connection.id, { status: 'revoked', encryptedAccessToken: '', encryptedRefreshToken: '', lastError: externalRevocation.ok ? '' : externalRevocation.error || '', lastErrorCode: externalRevocation.ok ? '' : 'external_revoke_failed', revokedAt: now(), disconnectedAt: now(), disconnectReason: reason, updatedAt: now() });
      }
      const ownedAccounts = await this.listAccounts(ctx, provider);
      for (const account of ownedAccounts) await accounts().update(account.id, { status: 'disconnected', isSelected: 0, updatedAt: now() });
      await this.event(ctx, provider, 'disconnected', 'Compte publicitaire déconnecté.', { correlationId, errorCode: externalRevocation.ok ? '' : 'external_revoke_failed', metadataJson: JSON.stringify({ reason, externalRevocation: { attempted: externalRevocation.attempted, ok: externalRevocation.ok, status: externalRevocation.status } }) });
      return { externalRevocation };
    },
  };
}
