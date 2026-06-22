/**
 * FirebaseProvider — initializes Firebase services on mount.
 * Place inside DashboardLayout to enable Analytics page-tracking,
 * FCM service worker registration, and Firestore connection.
 */
import { useEffect } from 'react';
import { initFirebaseServiceWorker } from '../../firebase/swInit';
import { getFirebaseAnalytics, getFirebaseFirestore, isFirebaseConfigured } from '../../firebase/client';

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    // Initialize Analytics
    getFirebaseAnalytics().catch(() => {});

    // Initialize Firestore connection
    getFirebaseFirestore();

    // Register service worker for FCM
    initFirebaseServiceWorker().catch(() => {});
  }, []);

  return <>{children}</>;
}
