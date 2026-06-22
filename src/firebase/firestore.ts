/**
 * src/firebase/firestore.ts
 * Firestore real-time sync helpers for Kompilot.
 *
 * Collections used:
 *   - kompilot_activity/{userId}/events    — live activity feed
 *   - kompilot_post_status/{postId}        — post publish status
 *   - kompilot_geo_scores/{establishmentId} — geo score history
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FirestoreActivityEvent {
  id?: string;
  type: 'post_published' | 'review_received' | 'sms_sent' | 'geo_scan' | 'client_added' | 'cowork_message';
  label: string;
  details?: string;
  timestamp?: unknown; // serverTimestamp
  createdAt?: number;  // local fallback
}

export interface FirestorePostStatus {
  postId: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  platform?: string;
  publishedAt?: unknown;
  error?: string;
}

export interface FirestoreGeoScore {
  establishmentId: string;
  score: number;
  delta: number;
  updatedAt?: unknown;
}

// ── Activity Feed ────────────────────────────────────────────────────────────

export async function firestoreAddActivity(
  userId: string,
  event: Omit<FirestoreActivityEvent, 'id' | 'timestamp'>
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    await addDoc(
      collection(db, 'kompilot_activity', userId, 'events'),
      { ...event, timestamp: serverTimestamp(), createdAt: Date.now() }
    );
  } catch (e) {
    console.warn('[Firestore] Failed to add activity:', e);
  }
}

export function firestoreSubscribeActivity(
  userId: string,
  onUpdate: (events: FirestoreActivityEvent[]) => void,
  maxItems = 20
): Unsubscribe | null {
  const db = getFirebaseFirestore();
  if (!db) return null;

  const q = query(
    collection(db, 'kompilot_activity', userId, 'events'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(q, (snapshot) => {
    const events: FirestoreActivityEvent[] = snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreActivityEvent, 'id'>),
    }));
    onUpdate(events);
  }, (err) => {
    console.warn('[Firestore] Activity snapshot error:', err);
  });
}

// ── Post Status ──────────────────────────────────────────────────────────────

export async function firestoreSetPostStatus(
  postId: string,
  status: FirestorePostStatus
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    await setDoc(
      doc(db, 'kompilot_post_status', postId),
      { ...status, publishedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Firestore] Failed to set post status:', e);
  }
}

export function firestoreSubscribePostStatus(
  postId: string,
  onUpdate: (status: FirestorePostStatus | null) => void
): Unsubscribe | null {
  const db = getFirebaseFirestore();
  if (!db) return null;

  return onSnapshot(
    doc(db, 'kompilot_post_status', postId),
    (snap) => {
      onUpdate(snap.exists() ? (snap.data() as FirestorePostStatus) : null);
    },
    (err) => console.warn('[Firestore] Post status error:', err)
  );
}

// ── Geo Score ────────────────────────────────────────────────────────────────

export async function firestoreUpdateGeoScore(
  establishmentId: string,
  score: number,
  delta: number
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    await setDoc(
      doc(db, 'kompilot_geo_scores', establishmentId),
      { establishmentId, score, delta, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Firestore] Failed to update geo score:', e);
  }
}

export function firestoreSubscribeGeoScore(
  establishmentId: string,
  onUpdate: (data: FirestoreGeoScore | null) => void
): Unsubscribe | null {
  const db = getFirebaseFirestore();
  if (!db) return null;

  return onSnapshot(
    doc(db, 'kompilot_geo_scores', establishmentId),
    (snap) => {
      onUpdate(snap.exists() ? (snap.data() as FirestoreGeoScore) : null);
    },
    (err) => console.warn('[Firestore] Geo score error:', err)
  );
}
