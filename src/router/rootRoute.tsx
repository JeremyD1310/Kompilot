/**
 * rootRoute.tsx
 * Single root route — all other routes are children.
 *
 * CRITICAL: The Suspense fallback must never be null/empty.
 * Returning null during async chunk loading causes "Something went wrong"
 * on Safari and Firefox because their slower resource resolution can trigger
 * TanStack Router's error boundary before the lazy module resolves.
 */
import React, { Component, type ReactNode } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import NotFoundPage from '../pages/NotFoundPage';

// ── Inline error boundary for lazy-load failures ───────────────────────────
// Catches chunk-load errors (network timeout, 404 on chunk) and gives the
// user a clean way to recover without reloading the whole SPA.
/**
 * LazyLoadBoundary — Capte les erreurs de chargement de chunk (réseau, timeout).
 *
 * RESILIENCE FIX: Ne redirige plus vers /login sur une erreur de chunk.
 * Un chunk qui échoue à charger n'est PAS une erreur de session.
 * On propose d'abord un retry silencieux (reset), puis un rechargement
 * de la page uniquement en dernier recours.
 *
 * Le bouton "Rafraîchir" vide les caches sessionStorage avant de retenter.
 */
class LazyLoadBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; errorMsg: string | null; retryCount: number }
> {
  state = { failed: false, errorMsg: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, errorMsg: error?.message ?? null };
  }

  handleRetry = () => {
    // Vide les caches sessionStorage des API pour forcer un rechargement propre
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('safeapi_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch { /* noop */ }

    this.setState(prev => ({
      failed: false,
      errorMsg: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleHardReload = () => {
    // Dernier recours : rechargement complet
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    const isChunkError = this.state.errorMsg?.includes('chunk') ||
      this.state.errorMsg?.includes('dynamically imported') ||
      this.state.errorMsg?.includes('Failed to fetch');

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0B1120', fontFamily: 'Inter, system-ui, sans-serif',
        padding: '24px', gap: 16,
      }}>
        <p style={{ color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 700 }}>
          {isChunkError ? 'Chargement interrompu' : 'Erreur inattendue'}
        </p>
        <p style={{ color: '#64748B', fontSize: '.875rem', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
          {isChunkError
            ? 'Un module n\'a pas pu se charger. Vérifiez votre connexion et réessayez.'
            : 'Une erreur s\'est produite dans l\'application.'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Retry silencieux — ne redirige pas vers /login */}
          <button
            onClick={this.handleRetry}
            style={{ background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem' }}
          >
            🔄 Réessayer
          </button>
          {/* Rechargement complet uniquement si plusieurs retries échouent */}
          {this.state.retryCount >= 1 && (
            <button
              onClick={this.handleHardReload}
              style={{ background: 'rgba(255,255,255,.07)', color: '#94A3B8', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}
            >
              Recharger la page
            </button>
          )}
        </div>
      </div>
    );
  }
}

// ── Spinner used as Suspense fallback ─────────────────────────────────────
function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0B1120' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(13,148,136,.15)', borderTop: '3px solid #0D9488', borderRadius: '50%', animation: 'rts 0.9s linear infinite' }} />
      <style>{`@keyframes rts { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export const rootRoute = createRootRoute({
  component: () => (
    <LazyLoadBoundary>
      <React.Suspense fallback={<PageSpinner />}>
        <Outlet />
      </React.Suspense>
    </LazyLoadBoundary>
  ),
  notFoundComponent: NotFoundPage,
});
