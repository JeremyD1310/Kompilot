import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface Props { onComplete: () => void }

const CHANNELS = [
  { id: 'instagram',       label: 'Instagram',       emoji: '📸', color: 'bg-pink-500'   },
  { id: 'facebook',        label: 'Facebook',        emoji: '👤', color: 'bg-blue-600'   },
  { id: 'tiktok',          label: 'TikTok',          emoji: '🎵', color: 'bg-slate-900'  },
  { id: 'linkedin',        label: 'LinkedIn',        emoji: '💼', color: 'bg-blue-700'   },
  { id: 'google_business', label: 'Google Business', emoji: '🌐', color: 'bg-red-500'    },
];

const DATES = ["Aujourd'hui", 'Demain', 'Vendredi 6 juin', 'Samedi 7 juin'];
const TIMES = ['09h00', '12h00', '18h00', '20h30'];

export function Step2Multiposting({ onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasRequired = selected.has('instagram') && selected.has('google_business');
  const isComplete = hasRequired && !!date && !!time;

  // Notify parent once complete
  const wasComplete = isComplete;
  if (wasComplete) { /* We call onComplete below via useEffect-like pattern */ }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">📱</span>
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>MULTI-POSTING :</strong> Écrivez une seule fois, publiez partout. Kompilot adapte automatiquement votre message aux codes de chaque réseau.
        </p>
      </div>

      {/* Channels */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">
          Sélectionnez vos canaux <span className="text-primary font-extrabold">(Instagram + Google Business requis)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map(ch => {
            const active = selected.has(ch.id);
            const required = ch.id === 'instagram' || ch.id === 'google_business';
            return (
              <button
                key={ch.id}
                onClick={() => toggle(ch.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 border-2 text-xs font-bold transition-all select-none',
                  active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                  required && !active && 'border-dashed border-primary/50'
                )}
              >
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]', ch.color)}>
                  {ch.emoji}
                </span>
                {ch.label}
                {active && <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
                </span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date/time picker — appears once required channels selected */}
      <AnimatePresence>
        {hasRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">📅 Planifier la publication</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={date}
                onChange={e => { setDate(e.target.value); if (e.target.value && time) onComplete(); }}
                className="rounded-xl border border-border bg-background text-xs font-semibold px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="">Choisir une date…</option>
                {DATES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={time}
                onChange={e => { setTime(e.target.value); if (date && e.target.value) onComplete(); }}
                className="rounded-xl border border-border bg-background text-xs font-semibold px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="">Choisir l'heure…</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success alert */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-start gap-2.5"
          >
            <span className="relative flex shrink-0 mt-0.5">
              <span className="animate-ping absolute w-2 h-2 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
              📅 Planification synchronisée ! Votre contenu sera diffusé automatiquement sur tous vos réseaux activés le {date} à {time}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
