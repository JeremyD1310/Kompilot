/**
 * AgentsBillingPanel — Billing + Legal sidebar for the AI Agents module
 *
 * Props:
 *  isTrial              — true when user is on free plan or trialing
 *  isAgency             — true for 'expert' plan (+50€ pricing)
 *  aiOptionActivated    — CONTROLLED from parent (AIAgentsModule)
 *  setAiOptionActivated — setter from parent
 *  onActivate           — called when both legal checkboxes ticked and CTA clicked
 */
import { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@blinkdotnew/ui';

interface Props {
  isTrial: boolean;
  isAgency: boolean;
  aiOptionActivated: boolean;
  setAiOptionActivated: (v: boolean) => void;
  onActivate?: () => void;
}

export function AgentsBillingPanel({ isTrial, isAgency, aiOptionActivated, setAiOptionActivated, onActivate }: Props) {
  // legalChecked and confirmed stay local — only aiOptionActivated is lifted to parent
  const [legalChecked1, setLegalChecked1] = useState(false);
  const [legalChecked2, setLegalChecked2] = useState(false);
  const [confirmed, setConfirmed]         = useState(false);

  const addonPrice = isAgency ? '+50 € HT / mois' : '+30 € HT / mois';
  const canSubmit  = legalChecked1 && legalChecked2;

  function handleValidate() {
    if (!canSubmit) return;
    setConfirmed(true);
    onActivate?.();
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5 shadow-xl space-y-4">
      {/* Header */}
      <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
        <Shield size={15} className="text-indigo-400 shrink-0" />
        Facturation & Contrats
      </h2>

      {/* ── Trial state ─────────────────────────────────────────── */}
      {isTrial ? (
        <div className="space-y-3">
          <div className="bg-amber-950/40 border border-amber-900/50 p-3 rounded-xl flex gap-2.5">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/90 leading-normal">
              <strong>Période d'essai active (14 jours).</strong> L'intégration d'options complémentaires
              n'est accessible qu'à la validation définitive du plan de production.
            </p>
          </div>

          <div className="bg-slate-950 border border-dashed border-slate-800/80 p-4 rounded-xl text-center">
            <Lock size={18} className="text-slate-600 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-400 block">Option Agents IA Masquée</span>
            <p className="text-[10px] text-slate-500 mt-1">
              Disponible à la souscription ({isAgency ? '+50€' : '+30€'}/mois).
            </p>
          </div>
        </div>

      ) : confirmed ? (
        /* ── Already confirmed ── */
        <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-4 flex items-start gap-2.5">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-300">Option activée</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              L'écosystème Agents IA est actif · {addonPrice}
            </p>
          </div>
        </div>

      ) : (
        /* ── Active subscription state ── */
        <div className="space-y-3">

          {/* Upsell checkbox — controlled by parent via aiOptionActivated prop */}
          <div className={cn(
            'p-3.5 rounded-xl border transition-all duration-200',
            aiOptionActivated
              ? 'bg-indigo-950/30 border-indigo-500/40'
              : 'bg-slate-950 border-slate-800',
          )}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aiOptionActivated}
                onChange={e => setAiOptionActivated(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900 mt-0.5 accent-indigo-500 shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-400" />
                  Activer l'écosystème Agents IA
                </span>
                <span className="text-[11px] text-indigo-400 font-bold block mt-0.5">{addonPrice}</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Déploie vos agents autonomes en tâche de fond pour la création,
                  l'audit publicitaire et la génération automatique de vos rapports.
                </p>
              </div>
            </label>
          </div>

          {/* Legal double-lock */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Validation Contractuelle B2B
            </span>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={legalChecked1}
                onChange={e => setLegalChecked1(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 bg-slate-900 mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-slate-400 leading-tight">
                J'accepte sans réserve les{' '}
                <a
                  href="/legal/cgv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                >
                  Conditions Générales de Vente (CGV)
                </a>{' '}
                de Kompilot.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={legalChecked2}
                onChange={e => setLegalChecked2(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 bg-slate-900 mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-amber-200/80 leading-tight">
                En tant que professionnel (B2B), je demande l'exécution immédiate du service et
                renonce à mon droit de rétractation de 14 jours (Art. L221-28 Code de la consommation).
              </span>
            </label>
          </div>

          {/* CTA */}
          <button
            onClick={handleValidate}
            disabled={!canSubmit}
            className={cn(
              'w-full py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200',
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed',
            )}
          >
            Valider la Facturation Stripe
          </button>

          {!canSubmit && (
            <p className="text-[10px] text-slate-600 text-center">
              Cochez les deux cases pour activer le bouton.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
