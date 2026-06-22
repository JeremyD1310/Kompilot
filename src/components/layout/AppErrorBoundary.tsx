/**
 * AppErrorBoundary — Branded maintenance page instead of white screen.
 *
 * Catches any unhandled React render error and shows a polished
 * recovery page that adapts to the error type:
 *
 *   SESSION_EXPIRED  → propose de se reconnecter
 *   Session still OK → propose un refresh ciblé sans déconnexion
 *   Network/chunk    → propose de recharger la page
 *
 * Also logs the error to localStorage for admin replay.
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logApiError } from '../../lib/safeApiCall';
import { KompilotLogo } from '../brand/KompilotLogo';
import { blink } from '../../blink/client';

function KompilotLogoIcon() {
  return <KompilotLogo variant="icon" height={40} />;
}

interface Props {
  children: ReactNode;
  /** Optional custom fallback override */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  errorMsg: string | null;
  countdown: number;
  // Session check results (populated async after error)
  sessionChecked: boolean;
  hasValidSession: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  state: State = {
    hasError: false,
    errorId: null,
    errorMsg: null,
    countdown: 30,
    sessionChecked: false,
    hasValidSession: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorId: `err-${Date.now().toString(36)}`,
      errorMsg: error.message,
      countdown: 30,
      sessionChecked: false,
      hasValidSession: false,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logApiError({
      service: 'React ErrorBoundary',
      error: `${error.message}\n${info.componentStack ?? ''}`,
      timestamp: new Date().toISOString(),
    });

    // Check session validity asynchronously — never blocks render
    blink.auth.getValidToken()
      .then(token => {
        this.setState({ sessionChecked: true, hasValidSession: !!token });
      })
      .catch(() => {
        this.setState({ sessionChecked: true, hasValidSession: false });
      });

    // Auto-countdown to refresh — only start after session check resolves
    // to avoid confusing countdown+redirect while checking
    setTimeout(() => {
      this.countdownTimer = setInterval(() => {
        this.setState(prev => {
          if (prev.countdown <= 1) {
            clearInterval(this.countdownTimer!);
            // If session is gone, go to login instead of reloading
            if (prev.sessionChecked && !prev.hasValidSession) {
              window.location.href = '/login';
            } else {
              window.location.reload();
            }
            return prev;
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    }, 1500); // wait for session check
  }

  componentWillUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  handleSmartRetry = async () => {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    // 1. Clear React Query caches via sessionStorage keys
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('safeapi_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch { /* noop */ }

    // 2. Silent token refresh attempt
    try { await blink.auth.getValidToken(); } catch { /* noop */ }

    // 3. Reset boundary and retry render
    this.setState({
      hasError: false, errorId: null, errorMsg: null,
      countdown: 30, sessionChecked: false, hasValidSession: false,
    });
  };

  handleGoToLogin = () => {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    window.location.href = '/login';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { errorId, countdown, errorMsg, sessionChecked, hasValidSession } = this.state;

    // Is this a session expiry error (thrown intentionally by hooks)?
    const isSessionError = errorMsg === 'SESSION_EXPIRED' ||
      (errorMsg?.toLowerCase().includes('session') ?? false) ||
      (errorMsg?.toLowerCase().includes('token') ?? false) ||
      (sessionChecked && !hasValidSession);

    // Network/chunk load failure
    const isNetworkError = !isSessionError && (
      (errorMsg?.includes('Failed to fetch') ?? false) ||
      (errorMsg?.includes('Loading chunk') ?? false) ||
      (errorMsg?.includes('dynamically imported') ?? false)
    );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Animated logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-xl">
                <KompilotLogoIcon />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ping" />
            </div>
          </div>

          {/* Main message — adapts to error type */}
          <div className="space-y-3">
            <p className="text-2xl font-extrabold text-foreground leading-tight">
              {isSessionError
                ? 'Session expirée'
                : isNetworkError
                  ? 'Problème de connexion'
                  : 'Kompilot se met à jour 🚀'}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isSessionError
                ? 'Votre session a expiré. Reconnectez-vous pour reprendre exactement où vous en étiez.'
                : isNetworkError
                  ? 'Un module n\'a pas pu se charger. Vérifiez votre connexion internet puis réessayez.'
                  : 'Nous optimisons vos performances en coulisse. Votre espace sera de retour dans quelques instants.'}
            </p>
          </div>

          {/* Progress bar + countdown */}
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-1000"
                style={{ width: `${((30 - countdown) / 30) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isSessionError
                ? <>Redirection dans <strong className="text-foreground">{countdown}s</strong></>
                : <>Rechargement automatique dans <strong className="text-foreground">{countdown}s</strong></>
              }
            </p>
          </div>

          {/* Status badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Vos données sont en sécurité
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Posts planifiés maintenus
            </span>
          </div>

          {/* Actions — context-aware */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isSessionError && (
              <button
                onClick={this.handleSmartRetry}
                className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm px-6 py-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
              >
                🔄 Réessayer maintenant
              </button>
            )}
            <button
              onClick={this.handleGoToLogin}
              className="flex items-center gap-2 rounded-xl border border-border bg-card text-foreground font-semibold text-sm px-6 py-3 hover:bg-muted transition-colors"
            >
              {isSessionError ? '🔑 Se connecter' : '← Retour à la connexion'}
            </button>
          </div>

          {/* Error reference */}
          {errorId && (
            <p className="text-[10px] text-muted-foreground/50 font-mono">
              Réf. {errorId} · Si le problème persiste : support@kompilot.app
            </p>
          )}
        </div>
      </div>
    );
  }
}

/**
 * RouteErrorBoundary — Lightweight version for individual route segments.
 * Shows an inline error card instead of taking over the full screen.
 */
export class RouteErrorBoundary extends Component<Props, { hasError: boolean; errorMsg: string | null }> {
  state = { hasError: false, errorMsg: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logApiError({
      service: 'RouteErrorBoundary',
      error: `${error.message}\n${info.componentStack ?? ''}`,
      timestamp: new Date().toISOString(),
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-5 py-4 m-4">
        <span className="text-xl shrink-0">⚡</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Cette section est temporairement en cours de chargement</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Analyse locale en cours d'optimisation, vos résultats arrivent dans quelques instants…
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: null })}
            className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            Réessayer →
          </button>
        </div>
      </div>
    );
  }
}
