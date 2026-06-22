/**
 * AuditFlashGenerator — 🔍 Générateur d'Audit Flash (Lead Magnet)
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Loader2, CheckCircle2, MapPin, Building2, FileText, Zap, Mail,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { type AuditReport, generateMockReport } from './audit/auditTypes';
import { AuditReportView } from './audit/AuditReportView';
import { AISpamChecker } from '../shared/AISpamChecker';
import { useTracking } from '@/hooks/useTracking';

const LOADING_STEPS = [
  '🔍 Analyse de la fiche Google Maps…',
  '🤖 Scan des requêtes IA (ChatGPT, Gemini)…',
  '📊 Benchmarking concurrentiel local…',
  '🎯 Calcul du manque à gagner…',
  '📝 Génération du rapport PDF…',
];

export function AuditFlashGenerator() {
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [relanceMsg, setRelanceMsg] = useState('Bonjour, j\'ai réalisé un audit de votre visibilité en ligne. Les résultats sont surprenants — voici votre rapport gratuit.');
  const [auditCount, setAuditCount] = useState(() => {
    try { return parseInt(localStorage.getItem('_agency_audit_count') ?? '0', 10) || 0; } catch { return 0; }
  });
  const { trackAudienceSignal } = useTracking();

  const handleGenerate = useCallback(async () => {
    if (!businessName.trim() || !city.trim() || !sector.trim() || loading) return;
    setLoading(true);
    setReport(null);
    setLoadingStep(0);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
      setLoadingStep(i + 1);
    }
    const mock = generateMockReport(businessName.trim(), city.trim(), sector.trim());
    setReport(mock);
    setLoading(false);
    toast.success('Rapport généré !', { description: 'Prêt à être partagé avec votre prospect.' });

    // ── Tracking Agency_Audit_Generated ──────────────────────────────────────
    const newCount = auditCount + 1;
    setAuditCount(newCount);
    try { localStorage.setItem('_agency_audit_count', String(newCount)); } catch {}
    trackAudienceSignal('Agency_Audit_Generated', { sector: sector.trim() } as any).catch(() => {});

    // AgencyScale : 5ème audit généré (seed list Lookalike)
    if (newCount === 5) {
      trackAudienceSignal('AgencyScale').catch(() => {});
    }
  }, [businessName, city, sector, loading, auditCount, trackAudienceSignal]);

  const inputClass =
    'w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-sky-950/20 to-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground">🔍 Générateur d'Audit Flash</h3>
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-700 text-[10px] font-bold">
                LEAD MAGNET
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scannez un prospect en 10 secondes · Rapport style Ahrefs prêt à partager
            </p>
          </div>
        </div>
      </div>

      {/* Search form */}
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Nom du commerce (ex: Le Petit Bistro)"
              className={inputClass}
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Ville (ex: Lyon, Bordeaux)"
              className={inputClass}
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={sector}
              onChange={e => setSector(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Secteur (ex: Restaurant, Coiffeur)"
              className={inputClass}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!businessName.trim() || !city.trim() || !sector.trim() || loading}
            className="h-11 px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold gap-2 shrink-0"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Scan…</>
              : <><Sparkles className="w-4 h-4" /> Générer l'Audit</>
            }
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-sky-400" />
          Exemple : "Le Petit Bistro" + "Lyon" + "Restaurant" → Rapport de visibilité complet en 10 secondes
        </p>
      </div>

      {/* Message de relance + AI Spam Checker */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Message de prospection / relance</label>
        </div>
        <textarea
          value={relanceMsg}
          onChange={e => setRelanceMsg(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-muted/40 text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none font-inherit"
          placeholder="Message qui accompagnera le rapport envoyé au prospect…"
          style={{ fontFamily: 'inherit' }}
        />
        <div className="mt-2">
          <AISpamChecker
            text={relanceMsg}
            onOptimize={setRelanceMsg}
          />
        </div>
      </div>

      {/* Loading steps */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-3">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 text-xs transition-all duration-300 ${i < loadingStep ? 'text-foreground' : 'text-muted-foreground/40'}`}
                >
                  {i < loadingStep
                    ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    : i === loadingStep
                      ? <Loader2 size={14} className="animate-spin text-sky-400 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                  }
                  <span className={i === loadingStep ? 'text-sky-400 font-semibold' : ''}>{step}</span>
                </div>
              ))}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-sky-500"
                  animate={{ width: `${(loadingStep / LOADING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report */}
      <AnimatePresence>
        {report && !loading && (
          <AuditReportView report={report} onClose={() => setReport(null)} />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !report && (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-sm font-semibold text-foreground">Prêt à générer un audit</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Saisissez le nom d'un prospect, sa ville et son secteur pour générer un rapport de visibilité complet à partager.
          </p>
        </div>
      )}

    </div>
  );
}
