/**
 * TerrainModeOverlay — Interface One-Tap mobile pour profil "chantier".
 *
 * 3 gros boutons uniquement (adaptés aux mains en conditions terrain) :
 *   📷 Photo chantier → génère un post IA
 *   📋 Devis reçu → valide l'empreinte Stripe
 *   ⭐ Avis → réponse IA en 1 tap
 *
 * Affiché uniquement sur mobile (< 768px) pour masterProfile === 'chantier'.
 * Peut être activé/désactivé via un toggle dans la sidebar.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Star, X, Hammer, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

/* ── Storage ─────────────────────────────────────────────────── */
const TERRAIN_KEY = 'nc_terrain_mode';
export function isTerrainModeEnabled(): boolean {
  try { return localStorage.getItem(TERRAIN_KEY) === '1'; } catch { return false; }
}
export function setTerrainMode(v: boolean) {
  try { localStorage.setItem(TERRAIN_KEY, v ? '1' : '0'); } catch { /* noop */ }
}

/* ── Actions ─────────────────────────────────────────────────── */
interface TerrainAction {
  id:       string;
  emoji:    string;
  label:    string;
  sublabel: string;
  color:    string;
  hoverColor: string;
  route:    string;
}

const ACTIONS: TerrainAction[] = [
  {
    id:         'photo',
    emoji:      '📷',
    label:      'Photo chantier',
    sublabel:   '→ Post généré par l\'IA',
    color:      'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    route:      '/cockpit',
  },
  {
    id:         'devis',
    emoji:      '📋',
    label:      'Devis accepté',
    sublabel:   '→ Valider l\'empreinte',
    color:      'bg-teal-500',
    hoverColor: 'hover:bg-teal-600',
    route:      '/caisse',
  },
  {
    id:         'avis',
    emoji:      '⭐',
    label:      'Répondre avis',
    sublabel:   '→ Réponse IA en 30s',
    color:      'bg-amber-500',
    hoverColor: 'hover:bg-amber-600',
    route:      '/inbox',
  },
];

/* ── Component ─────────────────────────────────────────────────── */
interface Props {
  open:    boolean;
  onClose: () => void;
}

export function TerrainModeOverlay({ open, onClose }: Props) {
  const navigate    = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: TerrainAction) => {
    setLoading(action.id);
    await new Promise(r => setTimeout(r, 300));
    navigate({ to: action.route as any });
    setLoading(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[950] md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[960] md:hidden bg-[#0F1629] rounded-t-3xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Hammer className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Mode Terrain</p>
                  <p className="text-[10px] text-slate-500">Accès rapide chantier</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Actions */}
            <div className="px-4 pb-8 space-y-3">
              {ACTIONS.map(action => (
                <motion.button
                  key={action.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction(action)}
                  disabled={!!loading}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white ${action.color} ${action.hoverColor} transition-all active:scale-[0.98] disabled:opacity-70`}
                >
                  {/* Big emoji */}
                  <span className="text-3xl shrink-0">{action.emoji}</span>

                  <div className="flex-1 text-left">
                    <p className="text-base font-black leading-tight">{action.label}</p>
                    <p className="text-xs text-white/70 mt-0.5">{action.sublabel}</p>
                  </div>

                  {loading === action.id
                    ? <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    : <ArrowRight className="w-5 h-5 shrink-0" />}
                </motion.button>
              ))}

              <p className="text-center text-[10px] text-slate-600 mt-2">
                Appuyez n'importe où en dehors pour fermer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Trigger button (sidebar / topbar) ─────────────────────────── */
export function TerrainModeTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold transition-all hover:bg-orange-500/20 active:scale-[0.97]"
    >
      <Hammer className="w-4 h-4" />
      Mode Terrain
    </button>
  );
}
