import { decryptToken, encryptToken } from './tokenEncryption';
import type { MetaPage } from './metaPublishingService';

export interface MetaConnectionRecord {
  id: string;
  userId: string;
  provider: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: string;
  scopes: string;
  status: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaSocialAccountRecord {
  id: string;
  userId: string;
  connectionId: string;
  network: 'facebook' | 'instagram';
  externalId: string;
  name: string;
  username: string;
  profilePictureUrl: string;
  parentPageId: string;
  parentPageName: string;
  accessTokenEncrypted: string;
  isSelected: string | number;
  status: string;
  lastError: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function connectionTable(blink: any) {
  return blink.db.table<MetaConnectionRecord>('meta_connections');
}

function accountTable(blink: any) {
  return blink.db.table<MetaSocialAccountRecord>('meta_social_accounts');
}

export function connectionIdFor(userId: string) {
  return `meta_connection_${userId}`;
}

export async function getMetaConnection(blink: any, userId: string) {
  return connectionTable(blink).get(connectionIdFor(userId));
}

export async function getMetaAccounts(blink: any, userId: string) {
  return accountTable(blink).list({
    where: { userId },
    orderBy: { network: 'asc' },
    limit: 200,
  });
}

export async function decryptMetaUserToken(blink: any, userId: string, encryptionKey: string) {
  const connection = await getMetaConnection(blink, userId);
  if (!connection) return null;
  try {
    return {
      connection,
      accessToken: await decryptToken(connection.accessTokenEncrypted, encryptionKey),
    };
  } catch (error) {
    await markMetaConnection(blink, userId, {
      status: 'token_error',
      lastError: error instanceof Error ? error.message : 'Impossible de déchiffrer le token Meta.',
    });
    return null;
  }
}

export async function saveMetaConnection(
  blink: any,
  input: {
    userId: string;
    accessToken: string;
    expiresAt: string;
    scopes: string[];
    encryptionKey: string;
  },
) {
  const now = new Date().toISOString();
  const id = connectionIdFor(input.userId);
  await connectionTable(blink).upsert({
    id,
    userId: input.userId,
    provider: 'meta',
    accessTokenEncrypted: await encryptToken(input.accessToken, input.encryptionKey),
    refreshTokenEncrypted: '',
    tokenExpiresAt: input.expiresAt,
    scopes: JSON.stringify(input.scopes),
    status: 'active',
    lastError: '',
    updatedAt: now,
  });
  return id;
}

export async function syncMetaAccounts(
  blink: any,
  input: {
    userId: string;
    connectionId: string;
    pages: MetaPage[];
    encryptionKey: string;
  },
) {
  const table = accountTable(blink);
  const existing = await getMetaAccounts(blink, input.userId);
  const existingByKey = new Map(existing.map((row) => [`${row.network}:${row.externalId}`, row]));
  const now = new Date().toISOString();
  const discovered = new Set<string>();

  for (const page of input.pages) {
    const pageKey = `facebook:${page.id}`;
    discovered.add(pageKey);
    const oldPage = existingByKey.get(pageKey);
    await table.upsert({
      id: oldPage?.id ?? `meta_account_${input.userId}_facebook_${page.id}`,
      userId: input.userId,
      connectionId: input.connectionId,
      network: 'facebook',
      externalId: page.id,
      name: page.name,
      username: '',
      profilePictureUrl: page.picture?.data?.url ?? '',
      parentPageId: '',
      parentPageName: '',
      accessTokenEncrypted: await encryptToken(page.access_token, input.encryptionKey),
      isSelected: oldPage?.isSelected ?? 0,
      status: Number(oldPage?.isSelected ?? 0) > 0 ? 'connected' : 'available',
      lastError: '',
      lastSyncedAt: now,
      updatedAt: now,
    });

    const ig = page.instagram_business_account;
    if (!ig) continue;
    const igKey = `instagram:${ig.id}`;
    discovered.add(igKey);
    const oldIg = existingByKey.get(igKey);
    await table.upsert({
      id: oldIg?.id ?? `meta_account_${input.userId}_instagram_${ig.id}`,
      userId: input.userId,
      connectionId: input.connectionId,
      network: 'instagram',
      externalId: ig.id,
      name: ig.name || ig.username || 'Compte Instagram',
      username: ig.username || '',
      profilePictureUrl: ig.profile_picture_url ?? '',
      parentPageId: page.id,
      parentPageName: page.name,
      accessTokenEncrypted: await encryptToken(page.access_token, input.encryptionKey),
      isSelected: oldIg?.isSelected ?? 0,
      status: Number(oldIg?.isSelected ?? 0) > 0 ? 'connected' : 'available',
      lastError: '',
      lastSyncedAt: now,
      updatedAt: now,
    });
  }

  for (const row of existing) {
    if (!discovered.has(`${row.network}:${row.externalId}`)) {
      await table.update(row.id, {
        status: 'sync_error',
        lastError: 'Ce compte n’est plus accessible avec les permissions Meta actuelles.',
        updatedAt: now,
      });
    }
  }
}

export async function markMetaConnection(
  blink: any,
  userId: string,
  patch: { status: string; lastError?: string; tokenExpiresAt?: string },
) {
  const connection = await getMetaConnection(blink, userId);
  if (!connection) return;
  await connectionTable(blink).update(connection.id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function setSelectedMetaAccounts(blink: any, userId: string, accountIds: string[]) {
  const table = accountTable(blink);
  const accounts = await getMetaAccounts(blink, userId);
  const selected = new Set(accountIds);
  for (const account of accounts) {
    const isSelected = selected.has(account.id);
    await table.update(account.id, {
      isSelected: isSelected ? 1 : 0,
      status: isSelected ? 'connected' : 'available',
      lastError: '',
      updatedAt: new Date().toISOString(),
    });
  }
  await markMetaConnection(blink, userId, { status: 'active', lastError: '' });
}
