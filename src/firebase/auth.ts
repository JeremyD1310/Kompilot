/**
 * src/firebase/auth.ts
 * Firebase Authentication helpers for Kompilot.
 *
 * Provides email/password sign-in via Firebase Auth.
 * Works alongside the existing Blink SDK auth — Firebase handles the
 * identity layer while Blink manages session + API tokens.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './client';

// ── Sign in with email + password ────────────────────────────────────────────

export async function firebaseSignIn(
  email: string,
  password: string,
): Promise<{ user: FirebaseUser | null; error: string | null }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase Auth non configuré.' };
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user, error: null };
  } catch (err: any) {
    const code: string = err?.code ?? '';
    let message = 'Erreur de connexion Firebase.';
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      message = 'Email ou mot de passe incorrect.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Trop de tentatives. Patientez quelques instants.';
    } else if (code === 'auth/user-disabled') {
      message = 'Ce compte a été désactivé.';
    } else if (code === 'auth/invalid-email') {
      message = 'Adresse e-mail invalide.';
    } else if (code === 'auth/network-request-failed') {
      message = 'Erreur réseau. Vérifiez votre connexion.';
    }
    return { user: null, error: message };
  }
}

// ── Sign up with email + password ────────────────────────────────────────────

export async function firebaseSignUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: FirebaseUser | null; error: string | null }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase Auth non configuré.' };
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
    }
    return { user: cred.user, error: null };
  } catch (err: any) {
    const code: string = err?.code ?? '';
    let message = "Erreur lors de l'inscription.";
    if (code === 'auth/email-already-in-use') {
      message = 'Un compte existe déjà avec cet email.';
    } else if (code === 'auth/weak-password') {
      message = 'Le mot de passe doit contenir au moins 6 caractères.';
    } else if (code === 'auth/invalid-email') {
      message = 'Adresse e-mail invalide.';
    }
    return { user: null, error: message };
  }
}

// ── Sign out ─────────────────────────────────────────────────────────────────

export async function firebaseSignOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

// ── Password reset ───────────────────────────────────────────────────────────

export async function firebaseResetPassword(email: string): Promise<{ error: string | null }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { error: 'Firebase Auth non configuré.' };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || "Erreur lors de l'envoi de l'email de réinitialisation." };
  }
}

// ── Auth state observer ──────────────────────────────────────────────────────

export function onFirebaseAuthChanged(
  callback: (user: FirebaseUser | null) => void,
): Unsubscribe | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

// ── Get current user ─────────────────────────────────────────────────────────

export function getFirebaseUser(): FirebaseUser | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
}

// ── Is Firebase Auth available? ──────────────────────────────────────────────

export function isFirebaseAuthConfigured(): boolean {
  return isFirebaseConfigured() && !!getFirebaseAuth();
}
