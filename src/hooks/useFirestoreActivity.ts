/**
 * useFirestoreActivity — Real-time activity feed from Firestore.
 * Falls back to local demo events when Firestore is not configured.
 *
 * PERF FIX: onSnapshot listener is cleaned up on unmount (return unsubscribe).
 * RESILIENCE FIX: Firestore errors are caught and logged — no unhandled rejection.
 */
import { useState, useEffect, useRef } from 'react';
import { firestoreSubscribeActivity, type FirestoreActivityEvent } from '../firebase/firestore';
import { isFirebaseConfigured } from '../firebase/client';
import { useAuth } from './useAuth';

const DEMO_EVENTS: FirestoreActivityEvent[] = [
  { id: '1', type: 'post_published', label: 'Post publié sur Instagram', createdAt: Date.now() - 3600000 },
  { id: '2', type: 'review_received', label: 'Avis 5★ reçu sur Google', createdAt: Date.now() - 7200000 },
  { id: '3', type: 'sms_sent', label: 'Campagne SMS envoyée (47 contacts)', createdAt: Date.now() - 14400000 },
  { id: '4', type: 'geo_scan', label: 'Score GEO mis à jour : 78/100 ▲ +4', createdAt: Date.now() - 86400000 },
];

export function useFirestoreActivity(maxItems = 20) {
  const { user } = useAuth();
  const [events, setEvents] = useState<FirestoreActivityEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  // Guard: prevent setState after unmount (memory leak protection)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user?.id || !isFirebaseConfigured()) {
      if (mountedRef.current) {
        setEvents(DEMO_EVENTS);
        setIsLive(false);
      }
      return;
    }

    if (mountedRef.current) setIsLive(true);

    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = firestoreSubscribeActivity(
        user.id,
        (newEvents) => {
          if (!mountedRef.current) return;
          // Merge Firestore events with demo events as fallback
          setEvents(newEvents.length > 0 ? newEvents : DEMO_EVENTS);
        },
        maxItems
      );
    } catch (e) {
      // Network or Firestore init failure — degrade gracefully
      console.warn('[useFirestoreActivity] Failed to subscribe:', e);
      if (mountedRef.current) {
        setEvents(DEMO_EVENTS);
        setIsLive(false);
      }
    }

    // PERF FIX: always unsubscribe on unmount to prevent listener leak
    return () => {
      unsubscribe?.();
    };
  }, [user?.id, maxItems]);

  return { events, isLive };
}
