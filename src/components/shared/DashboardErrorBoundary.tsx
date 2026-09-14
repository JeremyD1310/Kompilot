/**
 * DashboardErrorBoundary — Catches render errors on dashboard pages and
 * presents a clean recovery UI with retry capability.
 */
import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

export class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string | null }) {
    console.error('[DashboardErrorBoundary] Section render failed', {
      pageName: this.props.pageName ?? 'unknown',
      route: window.location.pathname,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, retryKey: prev.retryKey + 1 }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return <div key={this.state.retryKey} className="contents">{this.props.children}</div>;
    }

    return (
      <div className="flex min-h-[min(60vh,32rem)] items-center justify-center p-4 sm:p-8" role="alert">
        <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="mb-2 text-base font-bold text-foreground">
            {this.props.pageName || 'Cette section'} n’a pas pu se charger
          </h2>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Le reste du dashboard reste disponible. Réessayez cette section ou rechargez la page si le problème persiste.
          </p>
          <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 shadow-sm hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground px-5 py-2.5 hover:bg-muted/50 transition-colors"
            >
              Recharger la page
            </button>
          </div>
          {this.state.error && import.meta.env.DEV && (
            <details className="mt-4 overflow-hidden text-left">
              <summary className="cursor-pointer text-[10px] text-muted-foreground/50">
                Détails techniques
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-[10px] text-muted-foreground/70">
                {this.state.error.stack || this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}