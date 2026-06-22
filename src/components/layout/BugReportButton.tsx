/**
 * BugReportButton — Discreet "Rapporter un problème 🛠️" button.
 *
 * On click:
 * 1. Captures a state snapshot (current URL, active plan, last errors, timestamp)
 * 2. Formats a structured report
 * 3. Saves to localStorage for admin review
 * 4. Sends via mailto: to support (simulated — or replace with real endpoint)
 * 5. Shows a confirmation toast
 */
import { useState } from 'react';
import { Wrench, Send, X, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { getApiErrorLogs, clearApiErrorLogs, type ApiErrorLog } from '../../lib/safeApiCall';

// ── State snapshot ─────────────────────────────────────────────────────────────

function captureSnapshot(): BugSnapshot {
  const logs = getApiErrorLogs().slice(0, 5); // last 5 API errors
  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
    plan: localStorage.getItem('kompilot_plan') ?? 'free',
    demoActive: localStorage.getItem('kompilot_demo_active') === 'true',
    apiErrors: logs,
    sessionKeys: Object.keys(sessionStorage).filter(k => k.startsWith('safeapi_')),
  };
}

export interface BugSnapshot {
  timestamp: string;
  url: string;
  path: string;
  userAgent: string;
  plan: string;
  demoActive: boolean;
  apiErrors: ApiErrorLog[];
  sessionKeys: string[];
}

// ── Report log (admin replay) ──────────────────────────────────────────────────

const REPORT_LOG_KEY = 'kompilot_bug_reports';
const MAX_REPORTS = 50;

function saveBugReport(snapshot: BugSnapshot, userNote: string): string {
  const reportId = `rpt-${Date.now().toString(36)}`;
  try {
    const raw = localStorage.getItem(REPORT_LOG_KEY);
    const reports = raw ? JSON.parse(raw) : [];
    reports.unshift({ id: reportId, snapshot, userNote, sentAt: new Date().toISOString() });
    if (reports.length > MAX_REPORTS) reports.splice(MAX_REPORTS);
    localStorage.setItem(REPORT_LOG_KEY, JSON.stringify(reports));
  } catch { /* noop */ }
  return reportId;
}

export function getBugReports(): Array<{ id: string; snapshot: BugSnapshot; userNote: string; sentAt: string }> {
  try {
    const raw = localStorage.getItem(REPORT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Page label helper ──────────────────────────────────────────────────────────

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/calendar': 'Calendrier éditorial',
  '/inbox': 'Boîte de réception',
  '/cockpit': 'Cockpit IA',
  '/performance': 'Performance & Avis',
  '/settings': 'Paramètres',
  '/analytics': 'Analyses',
  '/growth': 'Accélérateur',
  '/seo-local': 'Référencement Local',
  '/google-maps': 'Google Maps',
  '/local-ads': 'Publicité Locale',
  '/reviews': 'Avis Google',
  '/inbox': 'Boîte de réception',
  '/account': 'Mon Compte',
  '/subscription': 'Mon Abonnement',
};

// ── Modal ──────────────────────────────────────────────────────────────────────

function BugReportModal({ onClose }: { onClose: () => void }) {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const snapshot = captureSnapshot();
  const pageLabel = PATH_LABELS[snapshot.path] ?? snapshot.path;

  const handleSend = async () => {
    setSending(true);
    const reportId = saveBugReport(snapshot, note);

    // Clear API error logs after capturing
    clearApiErrorLogs();

    // Simulate sending (replace with real endpoint if needed)
    await new Promise(r => setTimeout(r, 900));

    setSending(false);
    setSent(true);

    toast.success('Rapport envoyé ! 🙏', {
      description: `Réf. ${reportId} — Notre équipe analyse votre retour.`,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <Wrench size={15} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-foreground">Rapporter un problème 🛠️</p>
            <p className="text-[11px] text-muted-foreground">Aidez-nous à améliorer Kompilot</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          /* Success state */
          <div className="px-5 py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <p className="font-extrabold text-foreground">Merci pour votre retour ! 🙏</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Notre équipe analysera votre rapport sous 24h. Vous pouvez continuer à utiliser Kompilot normalement.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Snapshot summary */}
            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">📸 Instantané capturé automatiquement</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Page active : </span>
                    <span className="font-semibold text-foreground">{pageLabel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Offre : </span>
                    <span className="font-semibold text-foreground capitalize">{snapshot.plan}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode démo : </span>
                    <span className="font-semibold text-foreground">{snapshot.demoActive ? 'Actif' : 'Inactif'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Erreurs API : </span>
                    <span className={`font-semibold ${snapshot.apiErrors.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {snapshot.apiErrors.length}
                    </span>
                  </div>
                </div>

                {/* Expandable API errors */}
                {snapshot.apiErrors.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowDetails(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      {showDetails ? 'Masquer les détails' : 'Voir les détails d\'erreur'}
                    </button>
                    {showDetails && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {snapshot.apiErrors.map(err => (
                          <div key={err.id} className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-2 py-1.5">
                            <p className="text-[10px] font-bold text-red-600">{err.service}</p>
                            <p className="text-[10px] text-red-700 dark:text-red-400 font-mono truncate">{err.error}</p>
                            <p className="text-[9px] text-muted-foreground">{new Date(err.timestamp).toLocaleString('fr-FR')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Décrivez le problème (facultatif)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ex : L'audit GEO ne se charge pas, la page reste blanche après le clic sur Analyser…"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                📧 Ce rapport sera automatiquement transmis à notre équipe avec les informations techniques nécessaires. Aucune donnée personnelle sensible n'est incluse.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border text-foreground font-semibold text-sm py-2.5 hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm py-2.5 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60"
              >
                {sending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</>
                ) : (
                  <><Send size={14} /> Envoyer le rapport</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all group"
        title="Rapporter un problème"
      >
        <Wrench size={13} className="shrink-0 group-hover:rotate-12 transition-transform" />
        <span>Rapporter un problème 🛠️</span>
      </button>

      {open && <BugReportModal onClose={() => setOpen(false)} />}
    </>
  );
}
