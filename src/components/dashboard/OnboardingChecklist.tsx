import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useConnectedAccounts } from '../../context/ConnectedAccountsContext';
import { isFirstPost } from '../../lib/weeklyActivity';

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kompilot_onboarding_v1';
const REFERRAL_KEY = 'kompilot_referral_visited';
const DISMISSED_KEY = 'kompilot_onboarding_dismissed';

function getReferralDone(): boolean {
  try { return !!localStorage.getItem(REFERRAL_KEY); } catch { return false; }
}

export function markReferralVisited(): void {
  try { localStorage.setItem(REFERRAL_KEY, '1'); } catch { /* noop */ }
}

// ── Individual task ───────────────────────────────────────────────────────────

interface TaskItemProps {
  done: boolean;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  index: number;
}

function TaskItem({ done, label, description, href, onClick, index }: TaskItemProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-all duration-300 ${
        done ? 'opacity-70' : 'hover:bg-muted/50'
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
          done
            ? 'bg-green-500 border-green-500 scale-110'
            : 'border-muted-foreground/30 bg-background'
        }`}
      >
        {done && (
          <Check size={11} className="text-white animate-in zoom-in-50 duration-300" strokeWidth={3} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
      </div>

      {/* Action CTA */}
      {!done && (href || onClick) && (
        href ? (
          <Link
            to={href as any}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Commencer <ArrowRight size={10} />
          </Link>
        ) : (
          <button
            onClick={onClick}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Commencer <ArrowRight size={10} />
          </button>
        )
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface OnboardingChecklistProps {
  onConnectAccount: () => void;
  onCreatePost: () => void;
}

export function OnboardingChecklist({ onConnectAccount, onCreatePost }: OnboardingChecklistProps) {
  const { isConnected } = useConnectedAccounts();

  // Derive task states
  const googleConnected  = isConnected('google');
  const scanLaunched     = !!localStorage.getItem('kompilot_scan_launched');
  const socialConnected  = isConnected('instagram') || isConnected('facebook');
  const postCreated      = !isFirstPost(); // isFirstPost() returns true BEFORE first post
  const alertsConfigured = !!localStorage.getItem('kompilot_alerts_configured');

  const tasks = [
    {
      done: googleConnected,
      label: 'Connecter Google Business',
      description: 'Synchronisez votre fiche, vos avis et vos statistiques locales. (+10 crédits bonus)',
      weight: 30,
      onClick: googleConnected ? undefined : onConnectAccount,
    },
    {
      done: scanLaunched,
      label: 'Lancer le scan d\'acquisition local',
      description: 'Notre scanner IA identifie vos opportunités manquées en 35 secondes.',
      weight: 25,
      href: scanLaunched ? undefined : '/scan/fast',
    },
    {
      done: socialConnected,
      label: 'Connecter Instagram ou Facebook',
      description: 'Activez le calendrier de publication et publiez sur vos réseaux en 1 clic.',
      weight: 20,
      onClick: socialConnected ? undefined : onConnectAccount,
    },
    {
      done: postCreated,
      label: 'Générer votre premier post IA',
      description: 'L\'IA rédige un post professionnel adapté à votre secteur en quelques secondes.',
      weight: 15,
      onClick: postCreated ? undefined : onCreatePost,
    },
    {
      done: alertsConfigured,
      label: 'Configurer les alertes avis',
      description: 'Recevez une notification instantanée dès qu\'un nouvel avis Google arrive.',
      weight: 10,
      href: alertsConfigured ? undefined : '/settings',
    },
  ];

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const allDone = done === total;
  const percent = Math.round((done / total) * 100);

  // Collapsed state — default open until dismissed or complete + dismissed
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(DISMISSED_KEY); } catch { return false; }
  });

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* noop */ }
    setDismissed(true);
  };

  // Hide if dismissed after everything done for > 2 seconds
  useEffect(() => {
    if (allDone && dismissed) return;
  }, [allDone, dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        allDone
          ? 'border-green-300 bg-green-50/60'
          : 'border-border/60 bg-card'
      } shadow-sm`}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        {/* Rocket icon */}
        <span className="text-lg shrink-0">{allDone ? '🎉' : '🚀'}</span>

        {/* Title + count */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            {allDone
              ? 'Compte configuré à 100% ! Vous êtes prêt à cartonner.'
              : `Vos premiers pas sur Kompilot (${done}/${total} accomplis)`
            }
          </p>
          {!allDone && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Complétez ces étapes pour tirer le meilleur de l'application.
            </p>
          )}
        </div>

        {/* Circular progress ring */}
        {!allDone && (
          <div className="relative shrink-0 w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              {/* Background track */}
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                strokeWidth="3.5"
                className="stroke-muted"
              />
              {/* Progress arc */}
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                className={allDone ? 'stroke-green-500' : 'stroke-primary'}
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - percent / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
              />
            </svg>
            {/* Center label */}
            <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${
              percent >= 100 ? 'text-green-600' : 'text-primary'
            }`}>
              {percent}%
            </span>
          </div>
        )}

        {/* Chevron */}
        {collapsed
          ? <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          : <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        }
      </button>

      {/* Task list — collapses */}
      {!collapsed && (
        <div className="px-2 pt-2 pb-3">
          {allDone ? (
            /* 🎉 Completion message */
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="text-3xl animate-bounce">🎉</div>
              <p className="text-sm font-bold text-green-800">Félicitations ! Votre compte est configuré à 100%.</p>
              <p className="text-xs text-green-700 leading-snug max-w-xs">
                Google Business connecté, scan lancé, réseaux actifs, premier post IA créé et alertes avis configurées. Vous êtes prêt à dominer votre visibilité locale !
              </p>
              <button
                onClick={handleDismiss}
                className="text-xs text-green-700 hover:text-green-900 underline"
              >
                Masquer cette section
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/40">
                {tasks.map((t, i) => (
                  <TaskItem
                    key={t.label}
                    index={i}
                    done={t.done}
                    label={t.label}
                    description={t.description}
                    href={
                      t.label.includes('Inviter') && !t.done ? '/referral' : undefined
                    }
                    onClick={t.onClick}
                  />
                ))}
              </div>
              <div className="px-3 pt-2">
                <button
                  onClick={handleDismiss}
                  className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground underline transition-colors"
                >
                  Masquer cette checklist
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
