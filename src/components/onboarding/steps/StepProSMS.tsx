/**
 * StepProSMS — Onboarding step Pro : Campagne SMS de réactivation clients
 * Montre la puissance du canal SMS avec un simulateur de campagne interactif.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Users, CheckCircle2, TrendingUp } from 'lucide-react';

interface Props { onComplete: () => void; sector?: string }

const SECTORS_SMS: Record<string, { emoji: string; message: string; offer: string }> = {
  restaurant: {
    emoji: '🍽️',
    message: 'Bonjour {prenom} ! Ce soir on a une table pour vous 🍽️ Réservez avant 18h et recevez un dessert offert. → Réserver : kompilot.fr/r',
    offer: 'Dessert offert',
  },
  coiffeur: {
    emoji: '✂️',
    message: 'Bonjour {prenom} ! Votre prochain rendez-vous chez nous mérite une attention particulière ✂️ -20% sur votre prochaine coupe cette semaine. → Prendre RDV : kompilot.fr/r',
    offer: '-20% sur coupe',
  },
  beaute: {
    emoji: '💆',
    message: 'Bonjour {prenom} ! On pense à vous 💆 Un soin visage + massage offert pour votre prochain passage. Valable jusqu\'au dimanche. → Réserver : kompilot.fr/r',
    offer: 'Soin offert',
  },
};

const DEFAULT_SMS = {
  emoji: '🏪',
  message: 'Bonjour {prenom} ! On a une offre exclusive pour vous ce week-end 🎁 Profitez de -15% sur votre prochaine visite. Valable 48h uniquement. → En savoir plus : kompilot.fr/r',
  offer: '-15% exclusif',
};

const STATS = [
  { value: '95%', label: 'Taux de lecture', icon: '👁️' },
  { value: '23%', label: 'Taux de clic', icon: '🖱️' },
  { value: '3×', label: 'vs Email', icon: '📧' },
];

export function StepProSMS({ onComplete, sector = 'general' }: Props) {
  const [audience, setAudience] = useState<'inactive' | 'all' | 'vip'>('inactive');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const smsData = SECTORS_SMS[sector] ?? DEFAULT_SMS;

  const AUDIENCES = [
    { id: 'inactive', label: 'Clients inactifs +30j', count: 47, icon: '😴', desc: 'Réactivation ciblée' },
    { id: 'all', label: 'Toute la base', count: 312, icon: '👥', desc: 'Diffusion large' },
    { id: 'vip', label: 'Clients VIP', count: 28, icon: '⭐', desc: 'Fidélisation premium' },
  ];

  const selectedAudience = AUDIENCES.find(a => a.id === audience)!;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSent(true);
      setTimeout(onComplete, 800);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 px-3.5 py-3 flex items-start gap-2.5">
        <MessageSquare size={16} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-green-800 dark:text-green-300 leading-relaxed">
          <strong>CAMPAGNE SMS IA :</strong> 95% de taux de lecture — 3× plus efficace que l'email.
          L'IA personnalise chaque message avec le prénom et l'historique du client.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-muted/40 border border-border p-2.5 text-center"
          >
            <p className="text-base mb-0.5">{s.icon}</p>
            <p className="text-sm font-black text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Audience selector */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Cible de la campagne
        </p>
        {AUDIENCES.map((a) => (
          <button
            key={a.id}
            onClick={() => setAudience(a.id as typeof audience)}
            className={`w-full flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
              audience === a.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <span className="text-base shrink-0">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{a.label}</p>
              <p className="text-[10px] text-muted-foreground">{a.desc}</p>
            </div>
            <span className="text-xs font-black text-primary tabular-nums shrink-0">{a.count} contacts</span>
          </button>
        ))}
      </div>

      {/* SMS preview */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={10} />
          Message IA généré pour votre secteur
        </p>
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">{smsData.emoji}</span>
            <p className="text-[11px] text-green-900 dark:text-green-200 leading-relaxed flex-1">
              {smsData.message}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-green-700 dark:text-green-400">
            <span>💡 Offre : <strong>{smsData.offer}</strong></span>
            <span className="tabular-nums">{smsData.message.length} car.</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.button
            key="cta"
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {sending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Envoi en cours à {selectedAudience.count} contacts…
              </>
            ) : (
              <>
                <Send size={14} />
                Envoyer à {selectedAudience.count} clients
                <Users size={13} />
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Campagne envoyée ! {selectedAudience.count} SMS en route 🚀
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Résultats en temps réel dans Tableau de bord → SMS
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
