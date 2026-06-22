/**
 * AIErrorFallback — Elegant fallback UI for AI/API errors and timeouts.
 * Replaces screen crashes with a friendly message + retry button.
 *
 * Usage:
 *   {hasError && <AIErrorFallback onRetry={() => { setHasError(false); handleGenerate(); }} />}
 */
import { RefreshCw, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIErrorFallbackProps {
  /** Called when the user clicks "Réessayer". */
  onRetry?: () => void;
  /** Override the default message. */
  message?: string;
  /** Compact inline variant (no card background). */
  inline?: boolean;
  className?: string;
}

export function AIErrorFallback({
  onRetry,
  message = 'Le Copilot est très sollicité en ce moment. Réessayez dans quelques instants !',
  inline = false,
  className = '',
}: AIErrorFallbackProps) {
  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/6 px-3.5 py-3 ${className}`}
      >
        <span className="text-base shrink-0 mt-0.5" aria-hidden>🤖</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-amber-200/90 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors ml-1 mt-0.5"
            aria-label="Réessayer"
          >
            <RefreshCw size={12} />
            Réessayer
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/6 to-amber-900/8 p-5 flex flex-col items-center gap-3 text-center ${className}`}
    >
      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <Bot size={20} className="text-amber-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-200">🤖 {message}</p>
        <p className="text-[11px] text-slate-400">Nos serveurs IA sont disponibles 24h/24 — cela prend généralement moins d'une minute.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/18 hover:text-amber-200 transition-all"
        >
          <RefreshCw size={13} />
          Réessayer
        </button>
      )}
    </motion.div>
  );
}
