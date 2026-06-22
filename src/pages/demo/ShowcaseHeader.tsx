import React from 'react';
import type { Sector, Role } from './showcaseData';

interface Props {
  sector: Sector;
  setSector: (s: Sector) => void;
  role: Role;
  setRole: (r: Role) => void;
}

export default function ShowcaseHeader({ sector, setSector, role, setRole }: Props) {
  return (
    <header className="bg-slate-900/40 border-b border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Kompilot AI Workspace</span>
          <span className="bg-teal-500/10 text-teal-400 text-[10px] px-2.5 py-0.5 rounded-full border border-teal-500/20 uppercase font-mono tracking-widest">
            AIO & ROAS Actifs
          </span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Éditez et prévisualisez vos maquettes de communication en temps réel.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Secteur Actif :</span>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as Sector)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-400 font-semibold focus:outline-none focus:border-teal-500 transition cursor-pointer"
          >
            <option value="beauty">💇 Coiffure & Beauté</option>
            <option value="restaurant">🍽️ Restauration & Bistro</option>
            <option value="wellness">🩺 Spa & Massage Bien-être</option>
          </select>
        </div>

        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setRole('pro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${role === 'pro' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Profil Pro
          </button>
          <button
            onClick={() => setRole('agency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${role === 'agency' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Vue Agence
          </button>
        </div>
      </div>
    </header>
  );
}
