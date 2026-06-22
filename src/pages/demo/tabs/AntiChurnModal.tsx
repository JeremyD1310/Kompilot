import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  resignStep: number;
  setResignStep: (v: number) => void;
  onClose: () => void;
}

const REASONS = [
  "Outil trop difficile d'utilisation",
  "Prix de l'abonnement trop élevé",
  "Je n'ai pas assez de clients",
  'Autre motif',
];

export default function AntiChurnModal({ resignStep, setResignStep, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        {resignStep === 1 && (
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-white">Attendez ! Ne perdez pas votre avantage G.E.O. 🗺️</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Si vous suspendez votre compte, votre établissement perdra son positionnement sémantique automatique sur ChatGPT, Siri et Perplexity sous 7 jours.
            </p>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-3 text-left">
              <p className="text-xs font-extrabold text-teal-400 uppercase tracking-widest text-center">Formule Churn Saver Active</p>
              <p className="text-xs text-slate-300 leading-relaxed text-center">Profitez d'une <strong>réduction immédiate de 50% pendant 3 mois</strong> ou mettez votre abonnement en pause gratuitement.</p>
              <button
                onClick={() => { alert('Félicitations ! Votre réduction de 50% pendant 3 mois a été appliquée.'); onClose(); }}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition animate-pulse"
              >
                ⚡ Appliquer ma réduction de 50%
              </button>
            </div>
            <button onClick={() => setResignStep(2)} className="text-slate-500 hover:text-slate-300 text-xs font-semibold underline">
              Non merci, je souhaite continuer ma résiliation
            </button>
          </div>
        )}

        {resignStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-white">Pourquoi nous quittez-vous aujourd'hui ?</h3>
            <p className="text-slate-400 text-xs">Aidez-nous à améliorer l'application pour vos futurs besoins.</p>
            <div className="space-y-2">
              {REASONS.map((reason, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition">
                  <input type="radio" name="resign_reason" className="text-teal-500 focus:ring-teal-500" />
                  <span className="text-xs text-slate-300">{reason}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setResignStep(3)} className="w-full bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition">
              Confirmer la résiliation B2B définitive
            </button>
          </div>
        )}

        {resignStep === 3 && (
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Votre résiliation est enregistrée</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Votre abonnement Stripe sera coupé à la fin de la période en cours. Conformément au RGPD et à nos CGV, vos données seront définitivement purgées sous 30 jours.
            </p>
            <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition">
              Fermer la fenêtre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
