import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

const FORMATS = [
  { id: 'post', label: 'Post', emoji: '📝', desc: 'Idéal pour partager du contenu approfondi' },
  { id: 'reel', label: 'Reel', emoji: '🎬', desc: 'Vidéo courte pour maximiser la portée' },
  { id: 'story', label: 'Story', emoji: '✨', desc: 'Éphémère, idéal pour les offres du jour' },
] as const;

export function Step2Cockpit() {
  const [active, setActive] = useState<'post' | 'reel' | 'story'>('post');
  const [micPulse, setMicPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setMicPulse(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      {/* Animated mic */}
      <div className="flex items-center gap-4 rounded-2xl bg-violet-50 border border-violet-200/60 p-4">
        <div className="relative shrink-0">
          <motion.div
            animate={{ scale: micPulse ? 1.25 : 1, opacity: micPulse ? 0.3 : 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-violet-400"
          />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Mic size={20} className="text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-violet-900">🎙️ Dictez votre idée...</p>
          <div className="flex gap-1 mt-1.5 items-end h-5">
            {[4, 7, 5, 9, 6, 8, 4, 7, 5].map((h, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: micPulse ? [1, h / 5, 1] : 1 }}
                transition={{ duration: 0.6, delay: i * 0.07, repeat: Infinity, repeatType: 'mirror' }}
                className="w-1 rounded-full bg-violet-400 origin-bottom"
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
          <p className="text-[11px] text-violet-600 mt-1">«&nbsp;Notre brunch du dimanche, photos de saison...&nbsp;»</p>
        </div>
      </div>

      {/* Format selector */}
      <div>
        <p className="text-xs font-bold text-foreground/60 mb-2">Choisir le format :</p>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`rounded-xl border-2 p-3 text-left transition-all duration-150 ${
                active === f.id
                  ? 'border-violet-500 bg-violet-50 shadow-sm'
                  : 'border-border bg-muted/30 hover:border-violet-300'
              }`}
            >
              <span className="text-lg">{f.emoji}</span>
              <p className={`text-xs font-bold mt-1 ${active === f.id ? 'text-violet-700' : 'text-foreground'}`}>{f.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Multi-photo hint */}
      <div className="flex items-center gap-2.5 rounded-xl bg-purple-50 border border-purple-200/60 px-3 py-2.5">
        <span className="text-xl">📸</span>
        <p className="text-xs text-purple-700 font-medium">
          <strong>Multi-photos :</strong> Ajoutez plusieurs visuels pour créer un <strong>carrousel automatique</strong> — l'IA rédige une légende par image !
        </p>
      </div>
    </div>
  );
}
