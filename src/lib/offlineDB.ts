/**
 * offlineDB — Couche IndexedDB légère pour Kompilot
 *
 * Deux object stores :
 *   "cache"  → données dashboard sauvegardées localement (lecture hors-ligne)
 *   "outbox" → actions effectuées hors-ligne, en attente de sync
 *
 * Usage :
 *   import { offlineDB } from '@/lib/offlineDB';
 *   await offlineDB.saveCache('dashboard_posts', posts);
 *   const posts = await offlineDB.getCache('dashboard_posts');
 *   await offlineDB.enqueue({ type: 'UPDATE_POST', payload: {...} });
 *   const pending = await offlineDB.getOutbox();
 *   await offlineDB.dequeue(id);
 */

const DB_NAME    = 'kompilot_offline';
const DB_VERSION = 1;

type CacheKey =
  | 'dashboard_posts'
  | 'dashboard_schedule'
  | 'dashboard_contacts'
  | 'dashboard_chantiers'
  | 'inbox_messages'
  | string;

export interface OutboxEntry {
  id: string;         // crypto.randomUUID()
  type: string;       // e.g. 'UPDATE_POST', 'VALIDATE_PRESENCE', 'SOS_TRIGGER'
  payload: unknown;
  createdAt: number;  // Date.now()
  retries: number;
}

/* ── DB init (lazy singleton) ────────────────────────────────── */
let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache'); // keyPath = explicit key
      }
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    req.onsuccess  = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db!); };
    req.onerror    = ()  => reject(req.error);
    req.onblocked  = ()  => console.warn('[offlineDB] blocked');
  });
}

/* ── Helpers ─────────────────────────────────────────────────── */
function tx(
  db: IDBDatabase,
  store: 'cache' | 'outbox',
  mode: IDBTransactionMode = 'readonly',
) {
  return db.transaction(store, mode).objectStore(store);
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/* ── Cache API ───────────────────────────────────────────────── */
const CACHE_TTL = 24 * 3600 * 1000; // 24h

interface CacheEntry { data: unknown; savedAt: number }

async function saveCache(key: CacheKey, data: unknown): Promise<void> {
  try {
    const db    = await openDB();
    const entry: CacheEntry = { data, savedAt: Date.now() };
    await wrap(tx(db, 'cache', 'readwrite').put(entry, key));
  } catch (err) {
    console.warn('[offlineDB] saveCache error:', err);
  }
}

async function getCache<T = unknown>(key: CacheKey): Promise<T | null> {
  try {
    const db  = await openDB();
    const entry = await wrap<CacheEntry | undefined>(tx(db, 'cache').get(key));
    if (!entry) return null;
    if (Date.now() - entry.savedAt > CACHE_TTL) return null; // expired
    return entry.data as T;
  } catch (err) {
    console.warn('[offlineDB] getCache error:', err);
    return null;
  }
}

async function clearCache(key: CacheKey): Promise<void> {
  try {
    const db = await openDB();
    await wrap(tx(db, 'cache', 'readwrite').delete(key));
  } catch { /* ignore */ }
}

/* ── Outbox API ──────────────────────────────────────────────── */
async function enqueue(action: { type: string; payload: unknown }): Promise<string> {
  const db  = await openDB();
  const entry: OutboxEntry = {
    id:        crypto.randomUUID(),
    type:      action.type,
    payload:   action.payload,
    createdAt: Date.now(),
    retries:   0,
  };
  await wrap(tx(db, 'outbox', 'readwrite').add(entry));
  window.dispatchEvent(new CustomEvent('kompilot:outbox:enqueued', { detail: entry }));
  return entry.id;
}

async function getOutbox(): Promise<OutboxEntry[]> {
  try {
    const db = await openDB();
    return await wrap<OutboxEntry[]>(tx(db, 'outbox').getAll());
  } catch {
    return [];
  }
}

async function dequeue(id: string): Promise<void> {
  try {
    const db = await openDB();
    await wrap(tx(db, 'outbox', 'readwrite').delete(id));
  } catch { /* ignore */ }
}

async function incrementRetry(id: string): Promise<void> {
  try {
    const db    = await openDB();
    const store = tx(db, 'outbox', 'readwrite');
    const entry = await wrap<OutboxEntry>(store.get(id));
    if (entry) {
      entry.retries += 1;
      await wrap(store.put(entry));
    }
  } catch { /* ignore */ }
}

async function clearOutbox(): Promise<void> {
  try {
    const db = await openDB();
    await wrap(tx(db, 'outbox', 'readwrite').clear());
  } catch { /* ignore */ }
}

/* ── Exported singleton ──────────────────────────────────────── */
export const offlineDB = {
  saveCache,
  getCache,
  clearCache,
  enqueue,
  getOutbox,
  dequeue,
  incrementRetry,
  clearOutbox,
} as const;
