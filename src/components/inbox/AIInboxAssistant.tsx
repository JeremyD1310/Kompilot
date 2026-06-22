import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Badge } from '@blinkdotnew/ui';
import { Bot, Sparkles, X, Copy, CheckCheck } from 'lucide-react';
import { AIResponseModal } from './AIResponseModal';

const TIPS = [
  {
    emoji: '⚡',
    title: 'Temps de réponse',
    text: 'Répondre en moins de 2h augmente la satisfaction client de 60%. Activez les notifications.',
  },
  {
    emoji: '💰',
    title: 'Convertir les DMs',
    text: 'Terminez chaque réponse DM par une invitation concrète : "Souhaitez-vous réserver un créneau ?"',
  },
  {
    emoji: '⭐',
    title: 'Modèles d\'avis',
    text: 'Personnalisez chaque réponse avec le prénom et un détail de l\'expérience pour +35% de rétention.',
  },
];

export function AIInboxAssistant() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-[#0D9488]/25 bg-gradient-to-br from-[#0D9488]/8 to-[#0B1120] p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#0D9488]/15 flex items-center justify-center shrink-0">
            <Bot size={14} className="text-[#0D9488]" />
          </div>
          <Badge className="text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/25 rounded-full px-2.5">
            🤖 Conseils IA pour votre inbox
          </Badge>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          {TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex gap-2.5 rounded-xl border border-[#0D9488]/12 bg-[#0D9488]/5 px-3 py-2.5"
            >
              <span className="text-sm shrink-0 mt-0.5">{tip.emoji}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#F8FAFC] leading-none mb-0.5">{tip.title}</p>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">{tip.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <Button
          className="w-full h-9 text-xs font-bold gap-2 bg-[#0D9488]/15 hover:bg-[#0D9488]/25 text-[#0D9488] border border-[#0D9488]/25 rounded-xl transition-all"
          variant="outline"
          onClick={() => setModalOpen(true)}
        >
          <Sparkles size={13} />
          Générer une réponse IA
        </Button>
      </motion.div>

      <AIResponseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
