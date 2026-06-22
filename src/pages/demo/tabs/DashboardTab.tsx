import React from 'react';
import { TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import type { Role, ChecklistItem } from '../showcaseData';

interface Props {
  role: Role;
  checklist: ChecklistItem[];
  analyticsView: 'with' | 'without';
  setAnalyticsView: (v: 'with' | 'without') => void;
  onChecklistToggle: (id: number) => void;
}

export default function DashboardTab({ role, checklist, analyticsView, setAnalyticsView, onChecklistToggle }: Props) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Score G.E.O. Moyen</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-white">82%</span>
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +14%</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-2 font-mono">GEO Index = Σwᵢ · Visibilitéᵢ</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avis Automatisés</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-white">{role === 'pro' ? '142' : '1 892'}</span>
            <span className="text-emerald-400 text-xs font-bold">100% traités</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Rendement ROAS</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-teal-400">x4.8</span>
            <span className="text-emerald-400 text-xs font-bold">+28%</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-2 font-mono">ROAS = CA pub / Budget dépensé</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Co-working Claude</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-teal-400">Actif</span>
            <span className="text-purple-400 text-xs font-bold">Workspace 2.0</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">🚀 Plan de Configuration Kompilot</h2>
          <p className="text-slate-400 text-xs mb-6">Complétez ces actions pour activer la croissance de votre établissement.</p>
          <div className="space-y-4">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => onChecklistToggle(item.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer select-none ${item.completed ? 'bg-teal-500/5 border-teal-500/25 text-white' : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400'}`}
              >
                <div className="mt-0.5">
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${item.completed ? 'bg-teal-500 border-teal-500 text-slate-950' : 'border-slate-700 bg-slate-950'}`}>
                    {item.completed && <CheckCircle className="h-4 w-4 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <p className={`text-xs uppercase font-extrabold tracking-wider ${item.completed ? 'text-teal-400' : 'text-slate-500'}`}>{item.category}</p>
                  <p className="text-sm font-semibold mt-1">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GEO Comparator */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">📊 Preuve Sémantique G.E.O.</h2>
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setAnalyticsView('without')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${analyticsView === 'without' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400'}`}
              >Sans Kompilot</button>
              <button
                onClick={() => setAnalyticsView('with')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${analyticsView === 'with' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400'}`}
              >Avec Kompilot</button>
            </div>
          </div>

          {analyticsView === 'without' ? (
            <div className="space-y-4">
              <div className="text-center py-6 bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                <span className="text-xs font-extrabold text-red-400 tracking-widest uppercase">Invisible / Hors de la carte</span>
                <p className="text-slate-300 text-xs mt-2">Aucun mot-clé sémantique détecté sur les requêtes locales.</p>
              </div>
              <div className="relative h-48 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
                <MapPin className="h-8 w-8 text-red-500/30 animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">Visibilité Totale (Top 3)</span>
                <p className="text-slate-300 text-xs mt-2">Positionné sur 42 mots-clés d'intention directe par l'IA.</p>
              </div>
              <div className="relative h-48 bg-slate-950 rounded-2xl border border-teal-500/20 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#0dd5c105_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="z-10 flex flex-col items-center">
                  <MapPin className="h-8 w-8 text-teal-400 animate-pulse" />
                  <span className="bg-teal-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-2">12 Points sémantiques actifs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
