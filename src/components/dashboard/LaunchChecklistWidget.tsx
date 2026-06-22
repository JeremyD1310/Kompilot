import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LaunchChecklistWidgetProps { userId: string }

interface Task { key: string; emoji: string; label: string; done: boolean }

const lsGet = (k: string) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const lsSet = (k: string) => { try { localStorage.setItem(k, '1'); } catch { /* noop */ } };

// ── Circular ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 10, circ = 2 * Math.PI * r;
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" className="shrink-0 -rotate-90">
      <circle cx={14} cy={14} r={r} fill="none" stroke="rgba(249,115,22,.2)" strokeWidth={3} />
      <circle cx={14} cy={14} r={r} fill="none" stroke="#F97316" strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease-out' }} />
    </svg>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, index }: { task: Task; index: number }) {
  return (
    <motion.div className="flex items-center gap-3 py-2.5 px-1"
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}>
      <motion.div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-400 ${
          task.done ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}
        animate={task.done ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}>
        {task.done && <Check size={10} className="text-white" strokeWidth={3.5} />}
      </motion.div>
      <p className={`text-[13px] font-medium leading-snug flex-1 ${
        task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        <span className="mr-1">{task.emoji}</span>{task.label}
      </p>
    </motion.div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function LaunchChecklistWidget({ userId }: LaunchChecklistWidgetProps) {
  const showKey    = `checklist_show_${userId}`;
  const doneKey    = `checklist_all_done_${userId}`;

  const buildTasks = useCallback((): Task[] => [
    { key: `checklist_viewed_tunnels_${userId}`,   emoji: '✅', label: "View your first competitor's tunnel map",   done: lsGet(`checklist_viewed_tunnels_${userId}`) },
    { key: `checklist_watched_funnel_${userId}`,   emoji: '📡', label: 'Activate Watch Funnel on a competitor',    done: lsGet(`checklist_watched_funnel_${userId}`) },
    { key: `checklist_generated_swipe_${userId}`,  emoji: '✨', label: 'Generate your first AI copy swipe',        done: lsGet(`checklist_generated_swipe_${userId}`) },
  ], [userId]);

  const [tasks, setTasks]         = useState<Task[]>(buildTasks);
  const [expanded, setExpanded]   = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const [gone, setGone]           = useState(false);

  const resync = useCallback(() => setTasks(buildTasks()), [buildTasks]);

  useEffect(() => {
    resync();
    const id = setInterval(resync, 3000);
    window.addEventListener('storage', resync);
    return () => { clearInterval(id); window.removeEventListener('storage', resync); };
  }, [resync]);

  const count  = tasks.filter(t => t.done).length;
  const allDone = count === 3;
  const pct    = Math.round((count / 3) * 100);

  // All-done → celebrate 3 s → hide permanently
  useEffect(() => {
    if (!allDone || celebrating || gone) return;
    setCelebrating(true);
    const t = setTimeout(() => { lsSet(doneKey); setGone(true); }, 3000);
    return () => clearTimeout(t);
  }, [allDone, celebrating, gone, doneKey]);

  // Guard conditions
  if (!lsGet(showKey) || lsGet(doneKey) || gone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

      {/* ── Expanded / celebration card ── */}
      <AnimatePresence>
        {!celebrating && expanded && (
          <motion.div key="card"
            initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="w-72 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-orange-50">
              <ProgressRing pct={pct} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-800 leading-tight">Launch Checklist</p>
                <p className="text-[11px] text-orange-500 font-semibold mt-0.5">{count}/3 complete</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setExpanded(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={13} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 bg-orange-50/50">
              <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
                <motion.div className="h-full rounded-full bg-orange-500"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }} />
              </div>
            </div>

            {/* Tasks */}
            <div className="px-3 pb-3 divide-y divide-gray-100">
              {tasks.map((t, i) => <TaskRow key={t.key} task={t} index={i} />)}
            </div>
          </motion.div>
        )}

        {/* Celebration */}
        {celebrating && (
          <motion.div key="celebrate"
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-72 bg-white rounded-2xl shadow-2xl border border-orange-200 p-6 text-center">
            <motion.div className="text-4xl mb-3"
              animate={{ scale: [1, 1.35, 1, 1.15, 1], rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.8 }}>🎉</motion.div>
            <p className="text-sm font-bold text-gray-800">All done!</p>
            <p className="text-[12px] text-gray-500 mt-1 leading-snug">You've completed every launch milestone. You're ready to go! 🚀</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pill toggle ── */}
      {!celebrating && (
        <motion.button type="button" onClick={() => setExpanded(v => !v)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-[13px] font-semibold select-none"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#EA580C 100%)' }}>
          <span>🚀 Checklist ({count}/3)</span>
          {expanded ? <ChevronDown size={14} className="opacity-80" /> : <ChevronUp size={14} className="opacity-80" />}
        </motion.button>
      )}
    </div>
  );
}
