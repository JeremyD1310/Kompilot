/**
 * AIAgentsModule — Claude Cowork: orchestrateur principal.
 * Délègue l'UI aux sous-composants focalisés :
 *   AgentCardPanel, LiveTerminal, AgentsPaywall, DemoConfigurator
 */
import { useState } from 'react';
import { Bot, Terminal, Lock } from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAgentQuota } from '../../hooks/useAgentQuota';
import { AgentQuotaBanner } from './AgentQuotaBanner';
import { AgentContentFactory } from './AgentContentFactory';
import { AgentAdSpy } from './AgentAdSpy';
import { AgentReporter } from './AgentReporter';
import { useAgentSprint } from '../../hooks/useAgentSprint';
import { AgentsBillingPanel } from './AgentsBillingPanel';

// ── Split sub-components ──────────────────────────────────────────────────────
import { DemoConfigurator } from './DemoConfigurator';
import { AgentCardPanel, AGENTS } from './AgentCardPanel';
import { LiveTerminal } from './LiveTerminal';
import { AgentsPaywall } from './AgentsPaywall';

// ── Main export ───────────────────────────────────────────────────────────────

export function AIAgentsModule() {
  const { currentPlan, subscriptionStatus } = useSubscription();
  const quota = useAgentQuota();
  const { logs: backendLogs, isRunning: agentRunning } = useAgentSprint();

  const isTrialBySubscription =
    currentPlan.id === 'free' ||
    subscriptionStatus === 'trialing' ||
    subscriptionStatus === 'none';
  const isAgency = currentPlan.id === 'expert';
  const addonPrice = isAgency ? '+50€/HT/mois' : '+30€/HT/mois';

  const [aiOptionActivated, setAiOptionActivated] = useState(false);
  const [qaIsTrialOverride, setQaIsTrialOverride] = useState<boolean | null>(null);
  const isTrial = qaIsTrialOverride !== null ? qaIsTrialOverride : isTrialBySubscription;

  const handleQaToggleTrial = (v: boolean) => {
    setQaIsTrialOverride(v);
    if (v) setAiOptionActivated(false);
  };
  const handleQaReset = () => {
    setQaIsTrialOverride(null);
    setAiOptionActivated(false);
  };

  return (
    <div className="space-y-6">
      {/* QA Demo Banner */}
      <DemoConfigurator
        isTrial={isTrial}
        setIsTrial={handleQaToggleTrial}
        aiOptionActivated={aiOptionActivated}
        setAiOptionActivated={setAiOptionActivated}
        onReset={handleQaReset}
      />

      {/* Section header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Bot size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-base">Équipe d'Agents IA Autonomes</h2>
            <p className="text-slate-400 text-xs mt-0.5">Génération IA réelle — brief → résultat en direct</p>
          </div>
        </div>
        {!isTrial && aiOptionActivated && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300">Option activée · {addonPrice}</span>
          </div>
        )}
      </div>

      {/* Two-column: Billing sidebar + Agent workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
        {/* Billing panel */}
        <AgentsBillingPanel
          isTrial={isTrial}
          isAgency={isAgency}
          aiOptionActivated={aiOptionActivated}
          setAiOptionActivated={setAiOptionActivated}
          onActivate={() => {
            toast.success('Option Agents IA activée !', {
              description: 'Votre abonnement sera mis à jour lors du prochain cycle de facturation.',
            });
          }}
        />

        {/* Agent workspace */}
        <div className="space-y-4">
          {isTrial ? (
            <AgentsPaywall planName={currentPlan.name} />
          ) : (
            <>
              {!aiOptionActivated && (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Lock size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Module de Co-Working Verrouillé</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                      Cochez <strong className="text-indigo-400">Activer l'écosystème Agents IA</strong> dans le panneau pour déverrouiller.
                    </p>
                  </div>
                </div>
              )}

              <div className={cn('space-y-4 transition-all duration-300', !aiOptionActivated && 'hidden')}>
                {/* Quota banner */}
                <AgentQuotaBanner
                  quota={quota}
                  onPackPurchased={(sprints) => quota.addPack(sprints)}
                />

                {/* Real AI agent panels */}
                <div className={cn(
                  'space-y-4 transition-opacity duration-300',
                  quota.isExhausted && 'opacity-40 pointer-events-none select-none',
                )}>
                  <AgentContentFactory quota={quota} />
                  <AgentAdSpy quota={quota} />
                  <AgentReporter quota={quota} />
                </div>

                {/* Demo card grid (UI-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {AGENTS.map(agent => (
                    <AgentCardPanel
                      key={agent.id}
                      agent={agent}
                      onAction={() => {}}
                    />
                  ))}
                </div>

                {/* Live terminal */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervision Live — Terminal Agents</span>
                    {agentRunning && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIF
                      </span>
                    )}
                  </div>
                  <LiveTerminal externalLogs={backendLogs.length > 0 ? backendLogs : undefined} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
