/**
 * DemoDomainGate — Wraps public pages that should NOT be shown on demo.kompilot.fr.
 * On the demo domain, immediately redirects to /demo, the public conversion
 * entry point that activates the sandbox only after an explicit CTA click.
 *
 * On production (kompilot.fr), renders the children normally.
 */
import { useEffect, useState } from 'react';
import { IS_DEMO_DOMAIN } from '../../lib/demoDomain';
import { readDemoSession } from '../../lib/demoAccount';

const REDIRECT_TIMEOUT_MS = 5_000; // 5-second safety timeout
const POLL_INTERVAL_MS   = 300;     // Re-check session every 300ms

interface DemoDomainGateProps {
  children: React.ReactNode;
}

export function DemoDomainGate({ children }: DemoDomainGateProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_DEMO_DOMAIN) return;
    try {
      window.sessionStorage.setItem('kompilot_demo_active_session', 'true');
    } catch { /* continue with the existing demo session */ }

    let redirected = false;
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    /** Attempt to read the demo session and redirect */
    const attemptRedirect = (): boolean => {
      try {
        const hasSession = !!readDemoSession();
        const hasActiveFlag = window.sessionStorage.getItem('kompilot_demo_active_session') === 'true';
        const hasDomainFlag = !!(window as any).__kompilotDemoDomain;

        if (hasSession || hasActiveFlag || hasDomainFlag) {
          window.location.href = '/demo';
          return true;
        }
      } catch (err: any) {
        // localStorage or sessionStorage may throw in private browsing / iframes
        setError(err?.message || 'Stockage inaccessible');
      }
      return false;
    };

    // ── 1st attempt (instant — session is normally already written) ──────
    if (attemptRedirect()) return;

    // ── Poll session every POLL_INTERVAL_MS ──────────────────────────────
    interval = setInterval(() => {
      if (redirected) return;
      if (attemptRedirect()) {
        redirected = true;
        clearInterval(interval);
        clearTimeout(timeout);
      }
    }, POLL_INTERVAL_MS);

    // ── Safety timeout: show fallback after REDIRECT_TIMEOUT_MS ──────────
    timeout = setTimeout(() => {
      clearInterval(interval);
      if (redirected) return;

      // Last attempt — try again one more time
      try {
        const hasSession = !!readDemoSession();
        const hasActiveFlag = window.sessionStorage.getItem('kompilot_demo_active_session') === 'true';
        if (hasSession || hasActiveFlag) {
          window.location.href = '/demo';
          redirected = true;
          return;
        }
      } catch { /* swallow */ }

      // All attempts exhausted → show fallback message + retry buttons
      setHasTimedOut(true);
    }, REDIRECT_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // ── Production domain: render children normally ────────────────────────
  if (!IS_DEMO_DOMAIN) return <>{children}</>;

  // ── Demo domain: spinner (with fallback after timeout) ─────────────────
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
        {!hasTimedOut ? (
          <>
            <div className="w-10 h-10 border-[3px] border-primary/15 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Chargement du cockpit démo…</p>
            <p className="text-xs text-muted-foreground/50">
              Redirection vers le tableau de bord en cours
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">
                Redirection bloquée
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {error
                  ? `Erreur : ${error}`
                  : "La session démo n'a pas pu être chargée. Vérifiez que les cookies et le stockage local sont activés."
                }
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { window.location.href = '/demo'; }}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Ouvrir la page démo
              </button>
              <button
                onClick={() => {
                  try {
                    (window as any).location.reload();
                  } catch { window.location.href = '/demo'; }
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Réessayer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
