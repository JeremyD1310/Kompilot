import React from 'react';
import { Sparkles, Sparkle } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function ShowcaseLogin({ onLogin }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <Sparkles className="h-6 w-6 text-slate-950 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Bon retour 👋</h2>
          <p className="text-slate-400 text-sm mt-1 text-center">Connectez-vous à votre espace Kompilot</p>
        </div>

        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 px-4 rounded-xl font-medium transition duration-200 mb-6 text-sm"
        >
          Continuer avec Google
        </button>

        <div className="mt-6 border-t border-slate-800 pt-5 text-center">
          <p className="text-xs text-slate-500 mb-2">Pas de mot de passe à saisir pour tester la démo :</p>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2.5 rounded-full font-semibold transition animate-bounce"
          >
            <Sparkle className="h-3.5 w-3.5 animate-spin" />
            Accès Démo Immédiat (1-Clic)
          </button>
        </div>
      </div>
    </div>
  );
}
