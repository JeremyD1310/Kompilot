/**
 * Contextual Academy notification — shows a dismissible toast when the user
 * performs a specific action (e.g. first TikTok script generation in Cockpit).
 *
 * Usage:
 *   triggerAcademyHint('cockpit_tiktok_script');
 */
import { useState, useEffect } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadAcademyModules } from '../../data/academyContent';
import { AcademyCourseModal } from './AcademyCourseModal';
import type { AcademyModule } from '../../data/academyContent';

const SEEN_KEY = 'academy_hints_seen';

function getSeenHints(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markHintSeen(triggerId: string) {
  const seen = getSeenHints();
  seen.add(triggerId);
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
}

// Global event bus (simple, no Redux needed)
type Listener = (trigger: string) => void;
const listeners = new Set<Listener>();

export function triggerAcademyHint(trigger: string) {
  listeners.forEach(l => l(trigger));
}

export function AcademyContextualToast() {
  const [visible, setVisible] = useState(false);
  const [module, setModule] = useState<AcademyModule | null>(null);
  const [courseOpen, setCourseOpen] = useState(false);

  useEffect(() => {
    const handler = (trigger: string) => {
      const seen = getSeenHints();
      if (seen.has(trigger)) return; // Already shown this session
      
      const modules = loadAcademyModules();
      const match = modules.find(m => m.contextTrigger === trigger);
      if (!match) return;

      markHintSeen(trigger);
      setModule(match);
      setVisible(true);

      // Auto-dismiss after 12 seconds
      setTimeout(() => setVisible(false), 12000);
    };

    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const handleOpen = () => {
    setVisible(false);
    setCourseOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {visible && module && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] w-[min(90vw,400px)]"
          >
            <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/40 p-4 text-white relative overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              
              <button
                onClick={() => setVisible(false)}
                className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={12} />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                    💡 Astuce de l'Academy
                  </p>
                  <p className="text-sm font-semibold leading-snug line-clamp-2">
                    {module.title}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{module.subtitle}</p>
                  <button
                    onClick={handleOpen}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors"
                  >
                    Voir le micro-cours ({module.duration}) →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AcademyCourseModal
        module={courseOpen ? module : null}
        onClose={() => { setCourseOpen(false); setModule(null); }}
      />
    </>
  );
}
