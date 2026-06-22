import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, UserPlus, CheckCircle2, Mail, Shield, Pen, Eye } from 'lucide-react';

interface Props { onComplete: () => void }

// ── Simulation phases ──────────────────────────────────────────────────────────
type SimPhase = 'idle' | 'sending' | 'delivered' | 'configuring' | 'done';

const SIM_STEPS: { phase: SimPhase; label: string; icon: string; duration: number }[] = [
  { phase: 'sending',     label: 'Envoi de l\'invitation…',       icon: '📨', duration: 900  },
  { phase: 'delivered',   label: 'Email livré avec succès !',      icon: '✉️', duration: 800  },
  { phase: 'configuring', label: 'Configuration des accès…',       icon: '⚙️', duration: 900  },
  { phase: 'done',        label: 'Collaborateur activé !',         icon: '✅', duration: 0    },
];

// ── Role options ───────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'manager',  label: 'Manager',      icon: Shield, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',   desc: 'Valide et publie' },
  { id: 'editor',   label: 'Rédacteur',    icon: Pen,    color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800', desc: 'Prépare le contenu' },
  { id: 'viewer',   label: 'Observateur',  icon: Eye,    color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800', desc: 'Lecture seule' },
];

// ── Fake team members already present ─────────────────────────────────────────
const EXISTING_MEMBERS = [
  { name: 'Vous', role: 'Administrateur', color: 'from-primary to-teal-600', initial: '👑', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' },
];

export function Step4SoloTeam({ onComplete }: Props) {
  const [open, setOpen]       = useState(false);
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('manager');
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [simStep, setSimStep] = useState(0);       // index into SIM_STEPS
  const [done, setDone]       = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Auto-focus email when form opens
  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const selectedRole = ROLES.find(r => r.id === role) ?? ROLES[0];
  const displayName  = email.split('@')[0] || 'Collaborateur';
  const canSimulate  = email.trim().length > 2;

  const handleSimulate = () => {
    if (!canSimulate || simPhase !== 'idle') return;
    // Run through simulation phases sequentially
    let idx = 0;
    const advance = () => {
      const step = SIM_STEPS[idx];
      setSimPhase(step.phase);
      setSimStep(idx);
      if (step.duration > 0) {
        setTimeout(() => { idx++; advance(); }, step.duration);
      } else {
        // Final phase
        setTimeout(() => { setDone(true); onComplete(); }, 400);
      }
    };
    advance();
  };

  const isSimulating = simPhase !== 'idle' && !done;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">👥</span>
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>GESTION ÉVOLUTIVE :</strong> Vous gérez votre commerce seul pour le moment ? Kompilot sécurise vos publications grâce à un mode brouillon automatique. Si votre activité grandit, ajoutez des collaborateurs — ils préparent, vous validez d'un clic.
        </p>
      </div>

      {/* Owner profile card */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-sm shrink-0">
            <Crown size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Votre profil</p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
              Propriétaire unique / Administrateur
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['✅ Mode brouillon auto', '🔒 Validation avant publication', '📋 Historique complet'].map(t => (
            <span key={t} className="text-[10px] font-semibold bg-muted rounded-full px-2.5 py-1 text-muted-foreground">{t}</span>
          ))}
        </div>

        {/* Add collaborator button — hidden once done */}
        <AnimatePresence>
          {!done && !open && (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                boxShadow: [
                  '0 0 0 0px rgba(13,148,136,0.4)',
                  '0 0 0 7px rgba(13,148,136,0)',
                  '0 0 0 0px rgba(13,148,136,0)',
                ],
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ boxShadow: { duration: 1.8, repeat: Infinity }, opacity: { duration: 0.2 } }}
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 text-primary text-xs font-bold px-3.5 py-2 hover:bg-primary/10 transition-colors w-fit"
            >
              <UserPlus size={13} />
              + Ajouter un collaborateur / manager
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Inline invite form ── */}
      <AnimatePresence>
        {open && !done && (
          <motion.div
            key="invite-form"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            {/* Form header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary/8 to-teal-500/5 border-b border-border flex items-center gap-2">
              <Mail size={13} className="text-primary shrink-0" />
              <p className="text-xs font-extrabold text-foreground">Inviter un membre de votre équipe</p>
            </div>

            <div className="p-4 space-y-3.5">
              {/* Email input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Email ou nom
                </label>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSimulating}
                  placeholder="ex : marie@moncommerce.fr"
                  className="w-full rounded-xl border border-input bg-background text-xs px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 disabled:opacity-60 transition-all"
                />
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Rôle
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => !isSimulating && setRole(r.id)}
                        disabled={isSimulating}
                        className={`rounded-xl border-2 p-2.5 text-left transition-all duration-150 disabled:opacity-60 ${
                          isSelected ? `border-primary bg-primary/5 shadow-sm` : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <Icon size={13} className={isSelected ? 'text-primary mb-1' : `${r.color} mb-1`} />
                        <p className={`text-[10px] font-bold leading-none ${isSelected ? 'text-primary' : 'text-foreground'}`}>{r.label}</p>
                        <p className="text-[9px] text-muted-foreground leading-snug mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulation progress */}
              <AnimatePresence>
                {isSimulating && (
                  <motion.div
                    key="sim-progress"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
                      {/* Step indicators */}
                      <div className="flex items-center gap-1.5">
                        {SIM_STEPS.slice(0, -1).map((s, i) => (
                          <div key={s.phase} className="flex items-center gap-1">
                            <motion.div
                              initial={{ scale: 0.7, opacity: 0.4 }}
                              animate={{
                                scale: simStep >= i ? 1 : 0.7,
                                opacity: simStep >= i ? 1 : 0.3,
                              }}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                simStep > i ? 'bg-emerald-500' : simStep === i ? 'bg-primary animate-pulse' : 'bg-muted-foreground/20'
                              }`}
                            >
                              {simStep > i ? '✓' : String(i + 1)}
                            </motion.div>
                            {i < 2 && <div className={`h-0.5 w-4 rounded-full transition-colors duration-500 ${simStep > i ? 'bg-emerald-400' : 'bg-border'}`} />}
                          </div>
                        ))}
                      </div>
                      {/* Current step label */}
                      <motion.p
                        key={simStep}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[11px] font-semibold text-foreground flex items-center gap-1.5"
                      >
                        <span>{SIM_STEPS[simStep]?.icon}</span>
                        {SIM_STEPS[simStep]?.label}
                      </motion.p>
                      {/* Animated progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: `${((simStep + 1) / (SIM_STEPS.length - 1)) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-teal-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Simulate button */}
              <motion.button
                type="button"
                onClick={handleSimulate}
                disabled={!canSimulate || isSimulating}
                whileTap={{ scale: canSimulate && !isSimulating ? 0.97 : 1 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold py-2.5 disabled:opacity-40 transition-all"
              >
                {isSimulating ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                  </svg>
                ) : <Mail size={13} />}
                {isSimulating ? 'Envoi en cours…' : 'Simuler l\'invitation'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success: team roster ── */}
      <AnimatePresence>
        {done && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden"
          >
            {/* Success header */}
            <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  Parfait ! Vos accès sont configurés.
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  Vous gardez le contrôle absolu sur ce qui est publié, seul ou en équipe.
                </p>
              </div>
            </div>

            {/* Mini team roster */}
            <div className="border-t border-emerald-200 dark:border-emerald-800 px-4 pb-4 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Votre équipe
              </p>

              {/* Existing owner */}
              {EXISTING_MEMBERS.map(m => (
                <div key={m.name} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-xs shadow-sm shrink-0`}>
                    {m.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-none">{m.name}</p>
                    <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${m.badge}`}>{m.role}</span>
                  </div>
                </div>
              ))}

              {/* New collaborator — animated entrance */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {/* "New" ping indicator */}
                  <span className="absolute -top-0.5 -right-0.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground leading-none truncate">{displayName}</p>
                  <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${selectedRole.bg} ${selectedRole.color}`}>
                    {selectedRole.label}
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5 shrink-0">
                  ✉️ Invité
                </span>
              </motion.div>
            </div>

            {/* Control reminder */}
            <div className="border-t border-emerald-200 dark:border-emerald-800 px-4 py-2.5 bg-emerald-100/50 dark:bg-emerald-900/20">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold text-center">
                🔒 Chaque publication de {displayName} nécessitera votre validation avant mise en ligne.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
