/**
 * MentorOneTapBar — Barre d'actions One-Tap universelle (mobile, tous secteurs).
 *
 * Affiche 3–4 gros boutons d'action adaptés au profil secteur de l'utilisateur.
 * Chaque action déclenche un feedback Optimistic UI instantané (animation dorée)
 * avant même la confirmation du serveur.
 *
 * Accès : bouton flottant ⚡ en bas à gauche sur mobile (< 768px).
 * Masqué sur desktop (md:hidden).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, X, ArrowRight, CheckCircle2, Loader2,
  Camera, Star, MessageCircle, Tag, Gift, FileText,
  Hammer, Briefcase, ShoppingBag, TrendingUp
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useUserProfile } from '../../context/UserProfileContext';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Action definition ─────────────────────────────────────────────────────────
interface OneTapAction {
  id:       string;
  emoji:    string;
  label:    string;
  sublabel: string;
  route:    string;
  color:    string;    // Tailwind class
  iconCmp?: React.ElementType;
}

// ── Sector action maps ────────────────────────────────────────────────────────
const SECTOR_ACTIONS: Record<string, OneTapAction[]> = {
  flux: [
    { id: 'coupon',   emoji: '🎫', label: 'Coupon Flash',      sublabel: '→ Publier en 10s',         route: '/cockpit',  color: 'bg-teal-500',  iconCmp: Tag },
    { id: 'post',     emoji: '📸', label: 'Post IA',           sublabel: '→ Générer & planifier',     route: '/cockpit',  color: 'bg-violet-500', iconCmp: Camera },
    { id: 'review',   emoji: '⭐', label: 'Répondre avis',     sublabel: '→ Réponse IA en 30s',       route: '/inbox',    color: 'bg-amber-500',  iconCmp: Star },
    { id: 'dm',       emoji: '💬', label: 'DM commercial',     sublabel: '→ Envoyer offre WhatsApp',   route: '/inbox',    color: 'bg-emerald-500', iconCmp: MessageCircle },
  ],
  chantier: [
    { id: 'photo',    emoji: '📷', label: 'Photo chantier',    sublabel: '→ Post généré par l\'IA',  route: '/cockpit',  color: 'bg-orange-500',  iconCmp: Camera },
    { id: 'devis',    emoji: '📋', label: 'Devis accepté',     sublabel: '→ Valider l\'empreinte',    route: '/caisse',   color: 'bg-teal-500',   iconCmp: FileText },
    { id: 'avis',     emoji: '⭐', label: 'Répondre avis',     sublabel: '→ Réponse IA en 30s',      route: '/inbox',    color: 'bg-amber-500',   iconCmp: Star },
    { id: 'relance',  emoji: '🔔', label: 'Relance devis',     sublabel: '→ SMS automatique',         route: '/inbox',    color: 'bg-slate-600',  iconCmp: MessageCircle },
  ],
  services_b2b: [
    { id: 'lead',     emoji: '🎯', label: 'Qualifier un lead', sublabel: '→ Séquence CRM',           route: '/inbox',    color: 'bg-violet-500',  iconCmp: TrendingUp },
    { id: 'relance',  emoji: '🔔', label: 'Relance client',    sublabel: '→ Email IA personnalisé',  route: '/inbox',    color: 'bg-teal-500',   iconCmp: MessageCircle },
    { id: 'post',     emoji: '📝', label: 'Post LinkedIn',     sublabel: '→ Générer un post B2B',    route: '/cockpit',  color: 'bg-blue-600',   iconCmp: Briefcase },
    { id: 'review',   emoji: '⭐', label: 'Demander un avis',  sublabel: '→ Email relance avis',     route: '/dashboard', color: 'bg-amber-500', iconCmp: Star },
  ],
  produits: [
    { id: 'flash',    emoji: '⚡', label: 'Vente Flash',       sublabel: '→ Coupon anti-surstock',   route: '/cockpit',  color: 'bg-rose-500',   iconCmp: Tag },
    { id: 'post',     emoji: '📸', label: 'Photo produit',     sublabel: '→ Post IA avec prix',      route: '/cockpit',  color: 'bg-violet-500', iconCmp: Camera },
    { id: 'review',   emoji: '⭐', label: 'Collecte avis',     sublabel: '→ Email post-achat',       route: '/dashboard', color: 'bg-amber-500', iconCmp: Star },
    { id: 'dm',       emoji: '🎁', label: 'Offre VIP',         sublabel: '→ Bon panier meilleurs clients', route: '/inbox', color: 'bg-teal-500', iconCmp: Gift },
  ],
  agence: [
    { id: 'demo',     emoji: '🚀', label: 'Démo prospect',     sublabel: '→ Live Cloning Engine',   route: '/agency',   color: 'bg-violet-500', iconCmp: TrendingUp },
    { id: 'rapport',  emoji: '📊', label: 'Rapport sectoriel', sublabel: '→ Export closing client', route: '/growth',   color: 'bg-teal-500',   iconCmp: ShoppingBag },
    { id: 'post',     emoji: '📝', label: 'Post Agence',       sublabel: '→ Script prospection B2B', route: '/cockpit',  color: 'bg-blue-600',  iconCmp: Briefcase },
    { id: 'review',   emoji: '⭐', label: 'Avis client',       sublabel: '→ Demande IA automatique', route: '/dashboard', color: 'bg-amber-500', iconCmp: Star },
  ],
};

const FALLBACK_ACTIONS = SECTOR_ACTIONS.flux;

// ── Trigger button ────────────────────────────────────────────────────────────
export function MentorOneTapTrigger({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="md:hidden fixed bottom-24 left-4 z-[400] flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-bold text-xs"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Zap className="h-4 w-4" />
      Actions rapides
    </motion.button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
interface Props {
  open:    boolean;
  onClose: () => void;
}

export function MentorOneTapBar({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { masterProfile } = useUserProfile();
  const { activeEstablishment } = useEstablishment();

  const [loading,  setLoading]  = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  const actions = SECTOR_ACTIONS[masterProfile || 'flux'] ?? FALLBACK_ACTIONS;
  const businessName = activeEstablishment.name;

  const handleAction = async (action: OneTapAction) => {
    if (loading) return;
    // ─── Optimistic UI : show success IMMEDIATELY ───────────────────────────
    setSuccess(action.id);
    setLoading(action.id);

    // Micro-delay for the golden flash, then navigate
    await new Promise(r => setTimeout(r, 380));
    navigate({ to: action.route as any });
    setLoading(null);
    setSuccess(null);
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
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[950] md:hidden"
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 420 }}
            className="fixed bottom-0 left-0 right-0 z-[960] md:hidden bg-[#0C111D] rounded-t-3xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Actions Mentor IA</p>
                  <p className="text-[10px] text-slate-500">{businessName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Actions grid */}
            <div className="px-4 pb-10 space-y-2.5">
              {actions.map(action => {
                const isSuccess = success === action.id;
                const isLoading = loading === action.id;
                const IconCmp = action.iconCmp ?? Zap;

                return (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAction(action)}
                    disabled={!!loading}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white
                      ${isSuccess ? 'bg-amber-500 shadow-lg shadow-amber-500/25' : `${action.color}`}
                      transition-all active:scale-[0.97] disabled:opacity-60
                    `}
                  >
                    {/* Icon / status */}
                    {isSuccess ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                      >
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <span className="text-3xl shrink-0">{action.emoji}</span>
                    )}

                    <div className="flex-1 text-left">
                      <p className="text-base font-black leading-tight">
                        {isSuccess ? 'Action lancée ✓' : action.label}
                      </p>
                      <p className="text-xs text-white/70 mt-0.5">
                        {isSuccess ? 'Redirection en cours…' : action.sublabel}
                      </p>
                    </div>

                    {isLoading
                      ? <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                      : <ArrowRight className="w-5 h-5 shrink-0" />}
                  </motion.button>
                );
              })}

              <p className="text-center text-[10px] text-slate-600 pt-1">
                Chaque action déclenche une réponse IA instantanée
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
