import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Clock } from 'lucide-react';

interface FlashTutorialButtonProps {
  featureKey: string;  // e.g. 'geo', 'calendar-bulk', 'whatsapp', 'cockpit'
  label?: string;      // override default label
  className?: string;
}

const TUTORIALS: Record<string, {
  title: string;
  duration: string;
  steps: { icon: string; text: string; color: string }[];
  tip: string;
}> = {
  'geo': {
    title: 'Audit GEO/GEA',
    duration: '30 sec',
    steps: [
      { icon: '🔍', text: 'Analysez votre fiche Google en 1 clic', color: 'bg-blue-50 text-blue-700' },
      { icon: '⚠️', text: 'Détectez les mots-clés manquants', color: 'bg-orange-50 text-orange-700' },
      { icon: '✨', text: "L'IA génère vos textes optimisés", color: 'bg-teal-50 text-teal-700' },
      { icon: '📈', text: 'Publiez et remontez dans Google Maps', color: 'bg-green-50 text-green-700' },
    ],
    tip: "💡 Un audit complet prend moins de 2 minutes !",
  },
  'calendar-bulk': {
    title: 'Calendrier en Masse',
    duration: '30 sec',
    steps: [
      { icon: '🗓️', text: 'Choisissez votre période (semaine, mois)', color: 'bg-purple-50 text-purple-700' },
      { icon: '🤖', text: "L'IA génère 30 posts adaptés à votre secteur", color: 'bg-blue-50 text-blue-700' },
      { icon: '👀', text: 'Prévisualisez et ajustez si besoin', color: 'bg-yellow-50 text-yellow-700' },
      { icon: '🚀', text: "Publiez tout d'un coup ou programmez", color: 'bg-green-50 text-green-700' },
    ],
    tip: "⏱️ Économisez 3h par semaine de création de contenu !",
  },
  'whatsapp': {
    title: 'WhatsApp Business',
    duration: '30 sec',
    steps: [
      { icon: '📱', text: 'Connectez votre numéro WhatsApp Business', color: 'bg-green-50 text-green-700' },
      { icon: '💬', text: 'Recevez tous vos messages ici', color: 'bg-blue-50 text-blue-700' },
      { icon: '🤖', text: 'L\'IA rédige des réponses personnalisées', color: 'bg-teal-50 text-teal-700' },
      { icon: '✅', text: 'Validez et envoyez en 1 clic', color: 'bg-green-50 text-green-700' },
    ],
    tip: "💡 Répondez 5x plus vite à vos clients !",
  },
  'cockpit': {
    title: 'Cockpit IA',
    duration: '30 sec',
    steps: [
      { icon: '🎤', text: 'Dites votre idée à voix haute', color: 'bg-blue-50 text-blue-700' },
      { icon: '✍️', text: "L'IA rédige le post optimisé", color: 'bg-teal-50 text-teal-700' },
      { icon: '📸', text: 'Ajoutez une photo si besoin', color: 'bg-purple-50 text-purple-700' },
      { icon: '📲', text: 'Publiez sur tous vos réseaux', color: 'bg-green-50 text-green-700' },
    ],
    tip: "⚡ De l'idée au post publié en moins de 60 secondes !",
  },
  'reviews': {
    title: "Générateur d'Avis",
    duration: '30 sec',
    steps: [
      { icon: '⭐', text: 'Choisissez un client satisfait', color: 'bg-yellow-50 text-yellow-700' },
      { icon: '📲', text: 'Envoyez le lien SMS en 1 clic', color: 'bg-blue-50 text-blue-700' },
      { icon: '✍️', text: 'Le client dépose son avis sur Google', color: 'bg-orange-50 text-orange-700' },
      { icon: '📈', text: 'Votre note Google monte automatiquement', color: 'bg-green-50 text-green-700' },
    ],
    tip: "🌟 +1 étoile sur Google = +10% de clients en plus !",
  },
};

export function FlashTutorialButton({ featureKey, label, className = '' }: FlashTutorialButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = TUTORIALS[featureKey];
  if (!config) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group ${className}`}
      >
        <span className="w-5 h-5 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Play className="w-2.5 h-2.5 fill-primary text-primary" />
        </span>
        {label ?? `Voir comment ça marche (${config.duration}) 🎥`}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl mx-0 sm:mx-4"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary fill-primary" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{config.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {config.duration} pour maîtriser
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Steps — staggered animation */}
              <div className="space-y-2 mb-4">
                {config.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${step.color}`}
                  >
                    <span className="text-lg shrink-0">{step.icon}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-white/60 text-xs font-bold flex items-center justify-center shrink-0 text-current">
                        {i + 1}
                      </span>
                      <p className="text-xs font-medium leading-snug">{step.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-foreground font-medium text-center"
              >
                {config.tip}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
