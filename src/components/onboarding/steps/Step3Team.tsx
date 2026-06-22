import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Step3Team() {
  const [submitted, setSubmitted] = useState(false);
  const [validated, setValidated] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Marine - Collaboratrice */}
        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">M</div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Marine</p>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">Collaboratrice</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground bg-background rounded-lg p-2 border border-border/60 leading-snug mb-2">
            «&nbsp;Notre spéciale du soir, coq au vin maison... 🍷&nbsp;»
          </div>
          <button
            onClick={() => setSubmitted(true)}
            disabled={submitted}
            className={`w-full rounded-lg py-1.5 text-[11px] font-bold transition-all ${
              submitted
                ? 'bg-blue-100 text-blue-700 cursor-default'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.97]'
            }`}
          >
            {submitted ? '✓ Soumis pour validation' : 'Soumettre pour validation'}
          </button>
        </div>

        {/* Joan - Patron */}
        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">J</div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Joan</p>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">Patron</span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="notif"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2 leading-snug"
              >
                🔔 Nouveau post en attente de validation
              </motion.div>
            ) : (
              <div key="empty" className="text-[11px] text-muted-foreground bg-background rounded-lg p-2 border border-border/60 leading-snug mb-2 opacity-40">
                En attente d'une soumission...
              </div>
            )}
          </AnimatePresence>
          <button
            onClick={() => submitted && setValidated(true)}
            disabled={!submitted || validated}
            className={`w-full rounded-lg py-1.5 text-[11px] font-bold transition-all ${
              validated
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : submitted
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.97]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {validated ? '🎉 Publié !' : '✅ Valider & Publier'}
          </button>
        </div>
      </div>

      {/* Trace log */}
      <div className="rounded-xl bg-slate-900 p-3 font-mono text-[10px] leading-relaxed space-y-0.5">
        <p className="text-slate-400"># Historique de traçabilité</p>
        {[
          { time: '14:22', user: 'Marine', action: 'Post rédigé via Cockpit IA', color: 'text-blue-300', show: true },
          { time: '14:23', user: 'Marine', action: 'Soumis pour validation', color: 'text-amber-300', show: submitted },
          { time: '14:25', user: 'Joan', action: 'Validé & publié ✓', color: 'text-emerald-300', show: validated },
        ].filter(l => l.show).map((log, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={log.color}>
            <span className="text-slate-500">[{log.time}]</span> <span className="text-white">{log.user}</span> → {log.action}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
