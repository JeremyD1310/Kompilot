import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, XCircle, CheckCircle2, Download, Sparkles, Lock } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';
import { useUserProfile } from '../../context/UserProfileContext';
import { usePlan } from '../../hooks/usePlan';

export function BeforeAfterComparator() {
  const { masterProfile } = useUserProfile();
  const { tier } = usePlan();
  const [estabName, setEstabName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const canExportWhiteLabel = tier === 'franchise' || masterProfile === 'agence';

  // Track timeout so it can be cancelled on unmount (avoid state update on dead component)
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estabName.trim()) return;
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    setIsAnalyzing(true);
    analyzeTimerRef.current = setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const handleExport = () => {
    if (!canExportWhiteLabel) return;
    const blob = new Blob(['Rapport Avant/Après - Kompilot'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename: keep only alphanum, spaces, dashes — prevent path traversal
    const safeName = (estabName || 'etablissement').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'etablissement';
    a.download = `rapport_${safeName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-[#0F172A] p-6 space-y-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🆚 Comparatif Avant / Après — Outil de Vente IA
          </h2>
          <p className="text-xs text-slate-400">Générez un rapport persuasif pour vos prospects en 30 secondes</p>
        </div>
        
        <form onSubmit={handleAnalyze} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={estabName}
              onChange={(e) => setEstabName(e.target.value)}
              placeholder="Nom de l'établissement..."
              className="h-10 pl-10 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full md:w-64"
            />
          </div>
          <Button 
            type="submit"
            disabled={isAnalyzing || !estabName}
            className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-xl gap-2"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : 'Analyser →'}
          </Button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-12 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Audit IA en cours...</p>
              <p className="text-xs text-slate-500">Scan des avis, du G.E.O. et de la visibilité locale</p>
            </div>
          </motion.div>
        ) : showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Panel - Avant */}
              <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wider">⚠️ AVANT Kompilot</h3>
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold">
                    Score : 23/100
                  </Badge>
                </div>
                <ul className="space-y-3">
                  {[
                    "Avis Google non répondus (3 en attente)",
                    "Absent des recherches IA (ChatGPT, Perplexity)",
                    "Aucune protection anti no-show",
                    "Zéro visibilité locale → clients perdus aux concurrents"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Panel - Après */}
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">✅ APRÈS Kompilot</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
                    Score : 87/100
                  </Badge>
                </div>
                <ul className="space-y-3">
                  {[
                    "Avis répondus automatiquement en < 2h",
                    "Présence optimisée pour les IA (G.E.O. Score)",
                    "Anti-No Show activé → 340€ protégés/mois",
                    "Posts automatiques → +47% de visibilité locale"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex-1 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-teal-400">💡 {estabName || 'Établissement'} :</span> j'ai détecté un concurrent direct qui n'est pas optimisé pour le G.E.O. Exportez ce comparatif pour aller le présenter à vos prospects.
                </p>
              </div>

              <Button
                onClick={handleExport}
                disabled={!canExportWhiteLabel}
                className={`h-12 px-8 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  canExportWhiteLabel 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {canExportWhiteLabel ? (
                  <>
                    <Download size={18} />
                    Exporter en PDF (Marque Blanche)
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Plan Agence requis
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
