/**
 * StepAgencyWhiteLabel — Onboarding step Agence : White-label + domaine personnalisé
 * Permet à l'agence de configurer sa marque blanche dès l'onboarding.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Palette, Check, ArrowRight, Building2 } from 'lucide-react';

interface Props { onComplete: () => void }

const THEMES = [
  { id: 'dark', label: 'Dark Premium', colors: ['#0F172A', '#1E293B', '#0D9488'], emoji: '🌑' },
  { id: 'light', label: 'Light Pro', colors: ['#FFFFFF', '#F8FAFC', '#0D9488'], emoji: '☀️' },
  { id: 'brand', label: 'Votre marque', colors: ['#1A1A2E', '#16213E', '#E94560'], emoji: '🎨' },
];

export function StepAgencyWhiteLabel({ onComplete }: Props) {
  const [agencyName, setAgencyName] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [previewing, setPreviewing] = useState(false);
  const [done, setDone] = useState(false);

  const canPreview = agencyName.trim().length > 0;

  const handleActivate = () => {
    setPreviewing(true);
    setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 800);
    }, 1600);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 px-3.5 py-3 flex items-start gap-2.5">
        <Palette size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
          <strong>MARQUE BLANCHE :</strong> Vos clients voient votre nom, votre logo, votre domaine.
          Kompilot reste invisible. Facturation à votre prix.
        </p>
      </div>

      {/* Agency name input */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Nom de votre agence
        </label>
        <div className="relative">
          <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Ex : Agence Digital Plus, WebPro Agency…"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all ${
              agencyName ? 'border-primary shadow-sm shadow-primary/10' : 'border-border focus:border-primary/60'
            }`}
          />
        </div>
      </div>

      {/* Domain input */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Domaine personnalisé (optionnel)
        </label>
        <div className="relative">
          <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="app.mon-agence.fr"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Configurez votre CNAME après l'onboarding dans Paramètres → Marque Blanche
        </p>
      </div>

      {/* Theme selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Thème de l'interface client
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                selectedTheme === theme.id ? 'border-primary shadow-sm shadow-primary/20' : 'border-border hover:border-primary/40'
              }`}
            >
              {/* Color swatch */}
              <div className="flex gap-1">
                {theme.colors.map((color, i) => (
                  <div key={i} className="w-3.5 h-3.5 rounded-full" style={{ background: color }} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-foreground leading-tight text-center">
                {theme.emoji} {theme.label}
              </span>
              {selectedTheme === theme.id && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview snippet */}
      <AnimatePresence>
        {canPreview && !done && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Aperçu client
              </p>
              <div className="rounded-lg border border-border/60 bg-card p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-black shrink-0">
                  {agencyName.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{agencyName || 'Votre Agence'}</p>
                  <p className="text-[10px] text-muted-foreground">{domain || 'app.votre-agence.fr'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.button
            key="cta"
            onClick={handleActivate}
            disabled={!canPreview || previewing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {previewing ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Configuration en cours…
              </>
            ) : (
              <>
                <Palette size={14} />
                Activer la marque blanche
                <ArrowRight size={14} />
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
            <Check size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Marque blanche activée !</p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {agencyName} — votre interface client est prête.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
