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
  const { hasAny } = useConnectedAccounts();

  // Derive task states
  const socialConnected = hasAny;
  const postPlanned     = !isFirstPost(); // isFirstPost() returns true BEFORE first post
  const referralSent    = getReferralDone();

  // Recheck referral each render (could be set in another tab)
  const [referralDoneState, setReferralDoneState] = useState(referralSent);
  useEffect(() => {
    setReferralDoneState(getReferralDone());
  }, []);

  const tasks = [
    {
      done: socialConnected,
      label: 'Connecter mon premier réseau social',
      description: 'Synchronisez vos statistiques et publiez directement sur vos réseaux.',
      onClick: socialConnected ? undefined : onConnectAccount,
    },
    {
      done: postPlanned,
      label: 'Planifier ma première publication ou Story',
      description: 'Créez votre premier post ou Story et planifiez-le en quelques clics.',
      onClick: postPlanned ? undefined : onCreatePost,
    },
    {
      done: referralDoneState,
      label: 'Inviter un confrère (Parrainage)',
      description: 'Partagez Kompilot avec un collègue et gagnez des avantages exclusifs.',
      href: referralDoneState ? undefined : '/referral',
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

  // Mark referral as visited when link is clicked
  const handleReferralClick = () => {
    markReferralVisited();
    setReferralDoneState(true);
  };

  // Update tasks[2] click handler with above
  tasks[2].onClick = referralDoneState
    ? undefined
    : () => { handleReferralClick(); };

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

        {/* Progress pill */}
        {!allDone && (
          <span className={`shrink-0 text-[11px] font-bold rounded-full px-2.5 py-1 ${
            percent === 100
              ? 'bg-green-100 text-green-700 border border-green-200'
              : percent > 0
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {percent}%
          </span>
        )}

        {/* Chevron */}
        {collapsed
          ? <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          : <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        }
      </button>

      {/* Progress bar (always visible) */}
      <div className="px-5 pb-0">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              allDone ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Task list — collapses */}
      {!collapsed && (
        <div className="px-2 pt-2 pb-3">
          {allDone ? (
            /* 🎉 Completion message */
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="text-3xl animate-bounce">🎉</div>
              <p className="text-sm font-bold text-green-800">Félicitations ! Votre compte est configuré à 100%.</p>
              <p className="text-xs text-green-700 leading-snug max-w-xs">
                Vous avez connecté vos réseaux, planifié votre premier contenu et invité un confrère. Vous êtes prêt à cartonner !
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
