import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useConnectedAccounts } from '../../context/ConnectedAccountsContext';

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
  hasEstablishment: boolean;
  billingActive: boolean;
  firstContentApproved: boolean;
  hasMeasuredResult: boolean;
}

export function OnboardingChecklist({ onConnectAccount, onCreatePost, hasEstablishment, billingActive, firstContentApproved, hasMeasuredResult }: OnboardingChecklistProps) {
  const { isConnected } = useConnectedAccounts();

  // Derive task states
  const googleConnected  = isConnected('google');
  const socialConnected  = isConnected('instagram') || isConnected('facebook');

  const tasks = [
    {
      done: hasEstablishment,
      label: 'Créer votre établissement',
      description: 'Ajoutez la fiche qui servira de périmètre à vos données et actions.',
      weight: 15,
      href: hasEstablishment ? undefined : '/establishments',
    },
    {
      done: googleConnected,
      label: 'Connecter votre fiche Google',
      description: 'Synchronisez les informations et avis de votre établissement.',
      weight: 20,
      onClick: googleConnected ? undefined : onConnectAccount,
    },
    {
      done: socialConnected,
      label: 'Connecter un réseau social',
      description: 'Reliez Instagram ou Facebook pour préparer vos contenus.',
      weight: 15,
      onClick: socialConnected ? undefined : onConnectAccount,
    },
    {
      done: billingActive,
      label: 'Valider la facturation',
      description: 'Confirmez votre abonnement et l’accès au portail de facturation.',
      weight: 15,
      href: billingActive ? undefined : '/settings',
    },
    {
      done: firstContentApproved,
      label: 'Valider votre premier contenu',
      description: 'Préparez puis approuvez un contenu avant toute publication.',
      weight: 20,
      onClick: firstContentApproved ? undefined : onCreatePost,
    },
    {
      done: hasMeasuredResult,
      label: 'Obtenir un premier résultat mesuré',
      description: 'Un résultat n’est validé qu’après synchronisation d’une source réelle.',
      weight: 15,
      href: hasMeasuredResult ? undefined : '/performance',
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
              : `Activation commerciale (${done}/${total} étapes)`
            }
          </p>
          {!allDone && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Chaque étape est calculée depuis une donnée réelle ou une connexion vérifiée.
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
                Établissement, canaux, facturation, premier contenu et première mesure sont maintenant vérifiés.
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
