/**
 * App.tsx
 * Root — assembles the router from modular route files.
 * ≤300 LOC rule: route defs live in src/router/*.ts(x)
 */
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';

// ── Route-level error fallback ─────────────────────────────────────────────
// Shown when TanStack Router catches an error during route rendering.
//
// RESILIENCE FIX: Ne redirige plus vers /login immédiatement.
// Vérifie d'abord si l'utilisateur a encore un token valide (session active).
// Si oui → propose un rechargement de la section sans déconnexion.
// Si non → propose de se reconnecter.
//
// Le bouton "Rafraîchir" vide les caches React Query + sessionStorage
// et tente un silent token refresh avant de recharger, pour éviter
// de jeter une session encore valide.
import { blink } from './blink/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import type { ErrorComponentProps } from '@tanstack/react-router';

function RouterErrorFallback({ error, reset }: ErrorComponentProps) {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch { /* hors contexte QueryClient */ }

  useEffect(() => {
    // Vérifie silencieusement si la session est encore valide
    blink.auth.getValidToken()
      .then(token => setHasValidSession(!!token))
      .catch(() => setHasValidSession(false))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleSmartRefresh = async () => {
    // 1. Vide tous les caches React Query
    try { queryClient?.clear(); } catch { /* noop */ }
    // 2. Vide les caches sessionStorage des API
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('safeapi_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch { /* noop */ }
    // 3. Tente un silent token refresh
    try { await blink.auth.getValidToken(); } catch { /* noop */ }
    // 4. Reset le router error boundary (retente le rendu de la route)
    if (reset) reset();
    else window.location.reload();
  };

  // Pendant la vérification de session → spinner discret
  if (isCheckingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1120' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(13,148,136,.15)', borderTop: '3px solid #0D9488', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // L'erreur est une erreur de chunk/réseau (pas une 401 de session)
  const isNetworkError = error instanceof Error && (
    error.message.includes('Failed to fetch') ||
    error.message.includes('Loading chunk') ||
    error.message.includes('dynamically imported')
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1120', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', gap: 8 }}>
      <p style={{ color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
        {isNetworkError ? 'Problème de chargement' : 'Une erreur est survenue'}
      </p>
      <p style={{ color: '#64748B', fontSize: '.875rem', marginBottom: 24, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
        {hasValidSession
          ? 'Votre session est toujours active. Cliquez sur Rafraîchir pour recharger cette section.'
          : isNetworkError
            ? 'Vérifiez votre connexion internet puis réessayez.'
            : 'Votre session a peut-être expiré. Reconnectez-vous pour continuer.'}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {hasValidSession && (
          <button
            onClick={handleSmartRefresh}
            style={{ background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '.9rem' }}
          >
            🔄 Rafraîchir
          </button>
        )}
        <button
          onClick={() => { window.location.href = hasValidSession ? window.location.pathname : '/login'; }}
          style={{ background: 'rgba(255,255,255,.07)', color: '#94A3B8', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '.9rem' }}
        >
          {hasValidSession ? '↩ Retour au dashboard' : 'Se connecter'}
        </button>
      </div>
    </div>
  );
}

// Router modules
import { rootRoute } from './router/rootRoute';
import { publicRoutes } from './router/publicRoutes';
import { dashboardLayoutRoute } from './router/dashboardLayoutRoute';
import {
  onboardingRoute,
  protectedChildRoutes,
} from './router/protectedRoutes';

// ── Route tree ────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  ...publicRoutes,
  onboardingRoute,
  dashboardLayoutRoute.addChildren(protectedChildRoutes),
]);

// ── Router ────────────────────────────────────────────────────────────────────

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouterErrorFallback,
  defaultNotFoundComponent: () => null, // handled by rootRoute.notFoundComponent
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  );
}
