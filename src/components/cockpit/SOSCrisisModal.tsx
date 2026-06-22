import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  Button,
  Badge,
  toast,
  cn
} from '@blinkdotnew/ui';
import { AlertTriangle, Clock, Calendar, HelpCircle, Zap, Users, HeartPulse, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SOSCrisisModalProps {
  open: boolean;
  onClose: () => void;
}

const SOS_KEY = 'kompilot_sos_crisis';

export const SOSCrisisStorage = {
  activate(reason: string, duration: string, coupon: boolean) {
    const data = { active: true, reason, duration, coupon, activatedAt: new Date().toISOString() };
    localStorage.setItem(SOS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('kompilot:sos-changed', { detail: data }));
  },
  deactivate() {
    localStorage.removeItem(SOS_KEY);
    window.dispatchEvent(new CustomEvent('kompilot:sos-changed', { detail: { active: false } }));
  },
  getState(): { active: boolean; reason?: string; duration?: string; coupon?: boolean; activatedAt?: string } {
    try {
      return JSON.parse(localStorage.getItem(SOS_KEY) || '{"active":false}');
    } catch {
      return { active: false };
    }
  }
};

const REASONS = [
  { id: 'technique', label: 'Coupure de courant / problème technique', icon: <Zap className="w-4 h-4" /> },
  { id: 'personnel', label: 'Absence du personnel', icon: <Users className="w-4 h-4" /> },
  { id: 'personnelle', label: 'Urgence personnelle', icon: <HeartPulse className="w-4 h-4" /> },
  { id: 'travaux', label: 'Travaux / réparation urgente', icon: <Hammer className="w-4 h-4" /> },
];

const DURATIONS = [
  { id: 'hours', label: 'Quelques heures', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'day', label: 'La journée entière', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'weekend', label: 'Tout le week-end', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'unknown', label: 'Durée inconnue', icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

export function SOSCrisisModal({ open, onClose }: SOSCrisisModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [offerCoupon, setOfferCoupon] = useState(true);

  const handleActivate = () => {
    if (!reason || !duration) return;

    const reasonLabel = REASONS.find(r => r.id === reason)?.label || reason;
    const durationLabel = DURATIONS.find(d => d.id === duration)?.label || duration;

    SOSCrisisStorage.activate(reasonLabel, durationLabel, offerCoupon);
    toast.success('Mode SOS activé — Vos clients seront notifiés avec empathie ✅');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md w-full bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-2 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold text-red-600">
              Mode SOS — Fermeture Exceptionnelle
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Le Copilote va gérer la communication de crise à votre place.
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              Raison de fermeture <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                    reason === r.id 
                      ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200" 
                      : "bg-muted/30 border-border hover:border-red-200 hover:bg-red-50/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    reason === r.id ? "bg-red-200 text-red-600" : "bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-500"
                  )}>
                    {r.icon}
                  </div>
                  <span className="text-sm font-medium">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              Durée estimée <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDuration(d.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                    duration === d.id 
                      ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200" 
                      : "bg-background border-border hover:border-red-300 hover:bg-red-50"
                  )}
                >
                  {d.icon}
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/50">
            <div 
              className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer",
                offerCoupon ? "bg-red-500 border-red-500" : "bg-background border-border"
              )}
              onClick={() => setOfferCoupon(!offerCoupon)}
            >
              {offerCoupon && <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-0.5" />}
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => setOfferCoupon(!offerCoupon)}>
              <p className="text-sm font-medium">Offrir un coupon -20%</p>
              <p className="text-[10px] text-muted-foreground">Sur la prochaine visite pour s'excuser</p>
            </div>
          </div>

          <Button
            onClick={handleActivate}
            disabled={!reason || !duration}
            className={cn(
              "w-full h-12 rounded-xl font-bold text-base transition-all",
              !reason || !duration 
                ? "bg-muted text-muted-foreground" 
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
            )}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Activer le Mode SOS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
