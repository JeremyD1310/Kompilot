/**
 * BrandSafetyShield — Bouclier Anti-Hallucination IA
 * Simulates continuous monitoring of ChatGPT, Gemini and Perplexity
 * for false information about the establishment.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, Zap, X } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';

interface HallucinationAlert {
  id: string;
  llm: string;
  emoji: string;
  type: 'horaires' | 'services' | 'adresse' | 'telephone';
  description: string;
  severity: 'critical' | 'warning';
  detectedAt: string;
  fixed: boolean;
}

const LLM_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ChatGPT:   { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  Gemini:    { color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-200 dark:border-blue-800'       },
  Perplexity:{ color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30',   border: 'border-violet-200 dark:border-violet-800'   },
};

function buildAlerts(estName: string): HallucinationAlert[] {
  return [
    {
      id: 'h1',
      llm: 'ChatGPT',
      emoji: '🤖',
      type: 'horaires',
      description: `ChatGPT indique que "${estName}" est fermé le lundi alors qu'il est ouvert. Erreur détectée dans 3 réponses sur 5.`,
      severity: 'critical',
      detectedAt: 'il y a 4 min',
      fixed: false,
    },
    {
      id: 'h2',
      llm: 'Gemini',
      emoji: '✨',
      type: 'services',
      description: `Gemini mentionne un service "livraison à domicile" que vous ne proposez pas. Risque de déception client.`,
      severity: 'warning',
      detectedAt: 'il y a 12 min',
      fixed: false,
    },
    {
      id: 'h3',
      llm: 'Perplexity',
      emoji: '🔍',
      type: 'telephone',
      description: `Perplexity diffuse un ancien numéro de téléphone. Les clients ne vous joignent pas.`,
      severity: 'critical',
      detectedAt: 'il y a 28 min',
      fixed: false,
    },
  ];
}

type ShieldStatus = 'idle' | 'scanning' | 'clean' | 'alerts';

export function BrandSafetyShield({ estName = 'Votre Établissement' }: { estName?: string }) {
  const [status, setStatus]   = useState<ShieldStatus>('idle');
  const [alerts, setAlerts]   = useState<HallucinationAlert[]>([]);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Auto-scan on mount after short delay
  useEffect(() => {
    const t = setTimeout(() => startScan(), 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startScan = useCallback(() => {
    setStatus('scanning');
    setScanProgress(0);

    const steps = [15, 35, 55, 72, 88, 100];
    steps.forEach((val, i) => {
      setTimeout(() => {
        setScanProgress(val);
        if (val === 100) {
          const generated = buildAlerts(estName);
          setAlerts(generated);
          setStatus(generated.length > 0 ? 'alerts' : 'clean');
        }
      }, (i + 1) * 480);
    });
  }, [estName]);

  const handleFix = useCallback((id: string) => {
    setFixingId(id);
    setTimeout(() => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, fixed: true } : a));
      setFixingId(null);
    }, 1600);
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const activeAlerts  = alerts.filter(a => !a.fixed);
  const fixedAlerts   = alerts.filter(a => a.fixed);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-gradient-to-br from-red-50/60 to-orange-50/40 dark:from-red-950/20 dark:to-orange-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-red-100 dark:border-red-900/30">
        <div className="relative w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
          <Shield size={17} className="text-white" />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[9px] font-black text-black flex items-center justify-center">
              {activeAlerts.length}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-none">🛡️ Bouclier Anti-Hallucination IA</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Surveillance continue · ChatGPT · Gemini · Perplexity
          </p>
        </div>
        {status !== 'scanning' && (
          <button
            onClick={startScan}
            className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={12} /> Rescanner
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Scanning animation */}
        <AnimatePresence>
          {status === 'scanning' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw size={12} className="animate-spin text-red-500" />
                <span>Analyse des réponses IA en cours…</span>
                <span className="ml-auto font-bold text-foreground">{scanProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['🤖 ChatGPT', '✨ Gemini', '🔍 Perplexity'].map((llm, i) => (
                  <motion.span
                    key={llm}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}
                    className="text-[10px] font-semibold bg-muted rounded-full px-2 py-0.5 flex items-center gap-1"
                  >
                    <RefreshCw size={8} className="animate-spin" /> {llm}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean state */}
        <AnimatePresence>
          {status === 'clean' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3"
            >
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Aucune hallucination détectée</p>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
                  ChatGPT, Gemini et Perplexity relaient correctement vos informations.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert cards */}
        <AnimatePresence>
          {status === 'alerts' && activeAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {/* Summary banner */}
              <div className="flex items-center gap-2 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2">
                <AlertTriangle size={14} className="text-red-600 shrink-0" />
                <p className="text-xs font-bold text-red-700 dark:text-red-400">
                  {criticalCount} hallucination{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} détectée{criticalCount > 1 ? 's' : ''}
                  {' '}— impact client immédiat
                </p>
              </div>

              {activeAlerts.map((alert) => {
                const cfg = LLM_CONFIG[alert.llm] ?? LLM_CONFIG['ChatGPT'];
                const isFixing = fixingId === alert.id;
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0 }}
                    className={`rounded-xl border p-3 space-y-2 ${alert.severity === 'critical' ? 'border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30' : `${cfg.border} ${cfg.bg}`}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">{alert.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{alert.llm}</span>
                          <Badge
                            className={`text-[9px] h-4 px-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}
                          >
                            {alert.severity === 'critical' ? '🚨 Critique' : '⚠️ Avertissement'}
                          </Badge>
                          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{alert.detectedAt}</span>
                        </div>
                        <p className="text-[11px] text-foreground/80 mt-1 leading-snug">
                          ⚠️ {alert.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      disabled={isFixing}
                      onClick={() => handleFix(alert.id)}
                      className="w-full h-7 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isFixing ? (
                        <><RefreshCw size={11} className="animate-spin mr-1.5" /> Injection du correctif…</>
                      ) : (
                        <><Zap size={11} className="mr-1.5 fill-white" /> Cliquez ici pour injecter le correctif sémantique</>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed alerts summary */}
        <AnimatePresence>
          {fixedAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-1.5"
            >
              {fixedAlerts.map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2"
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {alert.llm} — correctif sémantique injecté ✓
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle state */}
        {status === 'idle' && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw size={14} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground ml-2">Initialisation de la surveillance…</span>
          </div>
        )}
      </div>
    </div>
  );
}
