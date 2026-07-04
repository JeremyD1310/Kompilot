/**
 * TeamModeSelector — Post-login modal for Kompilot team members.
 *
 * Auto-detects @kompilot.fr / @kompilot.com emails on auth
 * and presents a mode selector: Admin, Demo, or Live (as regular user).
 *
 * Shown once per session (sessionStorage flag), dismissed after choice.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Database, LogIn, ChevronRight } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../context/AdminContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useDemoView } from '../../context/DemoViewContext';
import { isKompilotTeam } from '../../context/AdminContext';

const MODE_KEY = 'kompilot_team_mode_selected';

type TeamMode = 'admin' | 'demo' | 'live';

const MODES: Array<{
  id: TeamMode;
  icon: typeof Shield;
  label: string;
  description: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}> = [
  {
    id: 'admin',
    icon: Shield,
    label: 'Mode Admin',
    description: 'Accès complet : clients, feedbacks, impersonation, panneau de contrôle interne.',
    gradient: 'from-teal-500/15 to-teal-600/5',
    borderColor: 'rgba(13,148,136,0.35)',
    iconColor: '#2DD4BF',
  },
  {
    id: 'demo',
    icon: Sparkles,
    label: 'Mode Démo',
    description: 'Données simulées. Parfait pour tester les parcours client ou présenter Kompilot.',
    gradient: 'from-purple-500/15 to-purple-600/5',
    borderColor: 'rgba(139,92,246,0.35)',
    iconColor: '#a78bfa',
  },
  {
    id: 'live',
    icon: Database,
    label: 'Mode Live',
    description: 'Vue utilisateur standard avec vos vraies données et APIs connectées.',
    gradient: 'from-emerald-500/15 to-emerald-600/5',
    borderColor: 'rgba(16,185,129,0.35)',
    iconColor: '#34d399',
  },
];

export function TeamModeSelector() {
  const { user } = useAuth();
  const { enterAdminMode, exitAdminMode } = useAdmin();
  const { activateDemo, deactivateDemo, isDemoActive } = useDemoMode();
  const { activateSwitcher, deactivateSwitcher } = useDemoView();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<TeamMode | null>(null);

  // Show only for team members who haven't chosen yet this session
  useEffect(() => {
    if (!user) return;
    const email = (user as any).email as string | undefined;
    if (!isKompilotTeam(email)) return;
    if (sessionStorage.getItem(MODE_KEY)) return;
    // Small delay so the dashboard renders behind the modal
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [user]);

  const handleSelect = (mode: TeamMode) => {
    // Reset all modes first
    exitAdminMode();
    deactivateDemo();

    switch (mode) {
      case 'admin':
        enterAdminMode();
        activateSwitcher();
        toast.success('Mode Admin activé', { description: 'Panneau admin et switcher Pro/Agence déverrouillés.' });
        break;
      case 'demo':
        activateDemo();
        activateSwitcher();
        toast.success('Mode Démo activé', { description: 'Données simulées chargées. Explorez librement.' });
        break;
      case 'live':
        deactivateSwitcher();
        toast('Mode Live', { description: 'Vue utilisateur standard activée.' });
        break;
    }

    sessionStorage.setItem(MODE_KEY, mode);
    setVisible(false);
  };

  // Reset mode selector (called from SandboxToggle)
  const resetMode = () => {
    sessionStorage.removeItem(MODE_KEY);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-wider mb-3">
                <LogIn size={11} />
                Connexion détectée
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                Bonjour {(user as any)?.displayName?.split(' ')[0] || 'Équipe'} !
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Choisissez le mode d'affichage pour cette session.
              </p>
            </div>

            {/* Mode cards */}
            <div className="space-y-2.5">
              {MODES.map((mode, i) => {
                const Icon = mode.icon;
                const isHovered = hovered === mode.id;
                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                    onClick={() => handleSelect(mode.id)}
                    onMouseEnter={() => setHovered(mode.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200 bg-gradient-to-r ${mode.gradient} cursor-pointer group`}
                    style={{
                      borderColor: isHovered ? mode.borderColor : 'rgba(255,255,255,0.06)',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200"
                      style={{
                        background: `${mode.borderColor.replace('0.35', '0.15')}`,
                        border: `1px solid ${mode.borderColor}`,
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      <Icon size={18} style={{ color: mode.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white block">{mode.label}</span>
                      <span className="text-xs text-white/40 block mt-0.5 leading-snug">{mode.description}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-white/20 transition-all duration-200 shrink-0"
                      style={{ color: isHovered ? mode.iconColor : undefined, opacity: isHovered ? 1 : 0.3 }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <p className="text-center text-[10px] text-white/20 mt-5">
              Vous pourrez changer de mode à tout moment via le bouton dans la barre supérieure.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MODE_KEY };
