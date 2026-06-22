import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  Button,
  Badge,
  toast,
} from '@blinkdotnew/ui';
import { Building2, BarChart3, Users, Shield } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useEstablishment } from '../../context/EstablishmentContext';

interface EstablishmentPaywallProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

const FEATURES = [
  { icon: Building2,  label: "Jusqu'à 10 établissements" },
  { icon: BarChart3,  label: 'Données séparées par adresse' },
  { icon: Users,      label: 'Accès équipe par site' },
  { icon: Shield,     label: 'Statistiques consolidées' },
];

const MINI_CARDS = [
  { initials: 'LM', label: 'La Maison', address: '12 rue du Commerce', gradient: 'from-orange-400 to-amber-500' },
  { initials: 'LG', label: 'Le Gourmet', address: '5 place du Marché', gradient: 'from-rose-400 to-pink-500' },
];

export const EstablishmentPaywall: React.FC<EstablishmentPaywallProps> = ({ open, onClose, onUpgrade }) => {
  const { setPlan } = useSubscription();
  const { establishments, setActiveEstablishment } = useEstablishment();

  const handleUpgrade = () => {
    setPlan('expert');
    const lockedEst = establishments.find(e => e.isLocked);
    if (lockedEst) setActiveEstablishment(lockedEst.id);
    onClose();
    toast.success('🎉 Offre Expert activée ! Vos établissements sont maintenant débloqués.');
    if (onUpgrade) onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">

        {/* ── Gradient hero header ── */}
        <div className="relative bg-gradient-to-br from-teal-500 to-emerald-600 px-6 pt-8 pb-6 text-white overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 -left-8 w-24 h-24 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm text-4xl mb-3 shadow-lg ring-1 ring-white/30">
              🏪
            </div>
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              📈 Multi-Établissements
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
              Gérez vos boutiques, franchises et enseignes depuis un seul cockpit
            </p>
          </div>

          {/* Mini establishment cards */}
          <div className="relative z-10 mt-5 flex gap-3 justify-center">
            {MINI_CARDS.map((card) => (
              <div
                key={card.initials}
                className="flex-1 max-w-[160px] bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/25 shadow-md"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-[11px] font-bold text-white shadow-sm`}>
                    {card.initials}
                  </div>
                  <span className="text-xs font-semibold text-white truncate">{card.label}</span>
                </div>
                <p className="text-[10px] text-white/60 truncate">{card.address}</p>
                <div className="mt-1.5 flex gap-1">
                  <div className="h-1 flex-1 rounded-full bg-white/40" />
                  <div className="h-1 w-1/2 rounded-full bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-1 space-y-5">

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </span>
                <span className="text-xs font-medium leading-snug">{label}</span>
              </div>
            ))}
          </div>

          {/* Price box */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/60 dark:border-teal-800/40 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-0.5">
                Offre Expert
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">39€</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sans engagement · Annulable à tout moment
              </p>
            </div>
            <Badge className="text-[10px] font-bold px-2.5 py-1 bg-teal-500 hover:bg-teal-500 text-white border-none uppercase tracking-widest">
              RECOMMANDÉ
            </Badge>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="flex-col gap-2 px-6 pt-2 pb-5">
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-teal-500/20"
            onClick={handleUpgrade}
          >
            🚀 Passer à l'offre Expert en 1 clic
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground text-sm"
            onClick={onClose}
          >
            Rester sur mon offre actuelle
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
