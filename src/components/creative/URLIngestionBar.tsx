/**
 * URLIngestionBar — Premium URL input bar for the URL-to-Video pipeline.
 * Main entry point: paste a link → scrape data → fill Creative Studio fields.
 */
import { useState, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Loader2, AlertTriangle, CheckCircle2, Globe, Sparkles, FileText, Megaphone } from 'lucide-react';
import { useScrapeURL, type ScrapedData } from '../../hooks/useURLToVideo';

interface URLIngestionBarProps {
  onScraped: (data: ScrapedData) => void;
  onError: (error: string) => void;
}

// ── Scanning overlay (matches SeoGapPage pattern) ─────────────────────────────

const SCAN_STEPS = [
  { label: 'Analyse du contenu…', icon: Globe },
  { label: 'Extraction des données marketing…', icon: FileText },
  { label: 'Génération de l\'angle publicitaire…', icon: Megaphone },
];

function ScanningOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 space-y-6"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Globe size={28} className="text-primary animate-pulse" />
        </div>
        <div className="absolute -inset-3 rounded-2xl border-2 border-primary/20 animate-ping" />
      </div>

      <div className="text-center space-y-1.5">
        <h3 className="text-base font-bold text-foreground">Analyse de la page en cours…</h3>
        <p className="text-xs text-muted-foreground">Extraction des données et du contexte marketing</p>
      </div>

      <div className="space-y-2 w-72">
        {SCAN_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.9 }}
              className="flex items-center gap-2.5 text-xs text-muted-foreground"
            >
              <Loader2
                size={13}
                className="text-primary animate-spin"
                style={{ animationDelay: `${i * 250}ms` }}
              />
              <Icon size={12} className="text-muted-foreground/50" />
              {step.label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function URLIngestionBar({ onScraped, onError }: URLIngestionBarProps) {
  const [url, setUrl] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const scrapeMutation = useScrapeURL();

  const isValidUrl = useCallback((value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setInlineError(null);

      const trimmed = url.trim();
      if (!trimmed) return;

      if (!isValidUrl(trimmed)) {
        setInlineError('Veuillez entrer une URL valide (https://...)');
        return;
      }

      scrapeMutation.mutate(trimmed, {
        onSuccess: (data) => {
          setUrl('');
          onScraped(data);
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? err.message
              : 'Impossible de lire l\'URL.';
          setInlineError(message);
          onError(message);
        },
      });
    },
    [url, isValidUrl, scrapeMutation, onScraped, onError],
  );

  const handlePaste = useCallback(
    (text: string) => {
      if (isValidUrl(text.trim())) {
        setUrl(text.trim());
      }
    },
    [isValidUrl],
  );

  const isScanning = scrapeMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Input bar */}
      <AnimatePresence mode="wait">
        {!isScanning ? (
          <motion.form
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            {/* Gradient border wrapper */}
            <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 focus-within:from-primary/60 focus-within:via-primary/40 focus-within:to-primary/60 transition-all duration-300">
              <div className="relative flex items-center rounded-[11px] bg-card">
                <div className="absolute left-4 text-muted-foreground/50">
                  <Link2 size={18} />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setInlineError(null);
                  }}
                  onPaste={(e) => handlePaste(e.clipboardData.getData('text'))}
                  placeholder="Coller un lien — page produit, article, landing page…"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 pl-11 pr-28 py-4 focus:outline-none"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !url.trim()}
                  className="absolute right-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold text-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles size={13} />
                  Analyser
                </button>
              </div>
            </div>

            {/* Helper text */}
            <p className="text-[10px] text-muted-foreground/40 mt-2 pl-1">
              Collez l'URL d'un produit, article ou landing page — notre IA extrait automatiquement le contexte marketing
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ScanningOverlay />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      <AnimatePresence>
        {inlineError && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-destructive">
                Impossible de lire l'URL
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {inlineError}
              </p>
              <p className="text-[11px] text-muted-foreground/60 italic">
                Décris ton produit ou dépose une image pour continuer.
              </p>
            </div>
            <button
              onClick={() => setInlineError(null)}
              className="text-muted-foreground/40 hover:text-muted-foreground text-xs shrink-0"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success flash (before onScraped fills the form) */}
      <AnimatePresence>
        {scrapeMutation.isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              Contenu extrait avec succès !
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
