/**
 * URLSnapshotWidget — Champ unique d'import rapide par URL
 *
 * Affiche un champ "Entrez l'URL de votre site ou fiche Google"
 * et déclenche l'agent IA qui analyse la page pour pré-remplir
 * secteur, couleur principale et catalogue de services.
 *
 * Props :
 *   onSnapshot(data) — appelé quand l'analyse réussit
 *   onSkip()         — appelé quand l'utilisateur passe l'étape
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Loader2, CheckCircle2, ChevronRight, X, Sparkles, Building2, MapPin, Palette } from 'lucide-react';
import { useURLSnapshot, type SnapshotData } from '../../hooks/useURLSnapshot';

const SECTOR_LABELS: Record<string, string> = {
  restauration: 'Restauration', beaute: 'Beauté & Bien-être',
  medical: 'Médical & Santé', batiment: 'Bâtiment',
  artisan: 'Artisan', conciergerie: 'Conciergerie',
  retail: 'Commerce / Retail', ecommerce: 'E-commerce',
  assurance: 'Assurance', conseil: 'Conseil & Services B2B',
  immobilier: 'Immobilier', agence: 'Agence Marketing',
  autre: 'Autre',
};

const PLACEHOLDERS = [
  'https://restaurant-le-bistrot.fr',
  'https://google.com/maps/place/votre-commerce',
  'https://salon-beaute-marie.fr',
  'https://plombier-dupont-lyon.fr',
];

interface Props {
  onSnapshot: (data: SnapshotData) => void;
  onSkip:     () => void;
}

export function URLSnapshotWidget({ onSnapshot, onSkip }: Props) {
  const [url,         setUrl]         = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { analyze, result, loading, error, reset } = useURLSnapshot();

  const handleFocus = () => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  };

  const handleAnalyze = async () => {
    if (!url.trim() || loading) return;
    const data = await analyze(url);
    if (data) {
      // Petite pause pour que l'utilisateur voie le résultat avant la transition
      setTimeout(() => onSnapshot(data), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div className="space-y-3">
      {/* Titre */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            Importez votre business en 1 clic
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            L'IA analyse votre site ou fiche Google et pré-configure votre espace
          </p>
        </div>
      </div>

      {/* Champ URL */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); if (result) reset(); }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-500 disabled:opacity-60 transition-all"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!url.trim() || loading}
          className="h-11 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center gap-2 shrink-0"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Sparkles className="w-3.5 h-3.5" /> Analyser</>}
        </button>
      </div>

      {/* Résultat */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyse de votre site en cours…</span>
            </div>
            <div className="space-y-1.5">
              {['Nom de l\'établissement', 'Secteur d\'activité', 'Couleur principale', 'Services'].map((label, i) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  <div className="h-2 rounded-full bg-slate-700 animate-pulse flex-1" style={{ width: `${55 + i * 12}%`, animationDelay: `${i * 150}ms` }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="rounded-xl bg-teal-900/30 border border-teal-500/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs font-bold text-teal-300">Site analysé avec succès</span>
              </div>
              <span className="text-[10px] text-slate-500 bg-teal-900/50 px-1.5 py-0.5 rounded-full">
                {Math.round(result.confidence * 100)}% fiabilité
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SnapshotField
                icon={<Building2 className="w-3 h-3" />}
                label="Commerce"
                value={result.businessName || '—'}
              />
              <SnapshotField
                icon={<Sparkles className="w-3 h-3" />}
                label="Secteur"
                value={result.sector ? (SECTOR_LABELS[result.sector] ?? result.sector) : '—'}
              />
              {result.city && (
                <SnapshotField
                  icon={<MapPin className="w-3 h-3" />}
                  label="Ville"
                  value={result.city}
                />
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Palette className="w-3 h-3" />
                  <span>Couleur</span>
                </div>
                <div
                  className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                  style={{ backgroundColor: result.primaryColor }}
                />
                <span className="text-[10px] font-mono text-slate-300">{result.primaryColor}</span>
              </div>
            </div>

            {result.services.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {result.services.map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-900/50 border border-teal-700/50 text-teal-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
              Données en cours d'importation dans votre espace…
            </p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5"
          >
            <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-400">Impossible d'analyser cette URL</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Vérifiez l'adresse ou passez cette étape pour saisir vos infos manuellement.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      {!result && !loading && (
        <button
          onClick={onSkip}
          className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          Passer cette étape
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ── Atom ──────────────────────────────────────────────────────── */
function SnapshotField({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{icon}</span>
      <div>
        <p className="text-[9px] text-slate-500 uppercase tracking-wider leading-none">{label}</p>
        <p className="text-[11px] font-semibold text-slate-200 leading-tight mt-0.5 truncate max-w-[120px]">{value}</p>
      </div>
    </div>
  );
}
