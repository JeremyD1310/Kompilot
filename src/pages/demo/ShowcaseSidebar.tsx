import React from 'react';
import { Video, Calendar, Layers, Search, Users, Settings, Sparkles } from 'lucide-react';
import type { ActiveTab } from './showcaseData';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'creative', label: 'Creative Factory IA', icon: <Video className="h-5 w-5" />, badge: 'Stories 🎬' },
  { id: 'calendar', label: 'Calendrier IA', icon: <Calendar className="h-5 w-5" /> },
  { id: 'dashboard', label: 'Tableau de bord', icon: <Layers className="h-5 w-5" /> },
  { id: 'leads', label: 'Prospection Leads', icon: <Search className="h-5 w-5" /> },
  { id: 'cowork', label: 'Claude Cowork', icon: <Users className="h-5 w-5" /> },
  { id: 'settings', label: 'Paramètres & CGV', icon: <Settings className="h-5 w-5" /> },
];

export default function ShowcaseSidebar({ activeTab, setActiveTab, onLogout }: Props) {
  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </div>
          <span className="font-bold text-white tracking-tight text-lg">Kompilot</span>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </span>
              {item.badge && (
                <span className="bg-teal-500/20 text-teal-400 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase font-mono border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold text-sm">
            JD
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">test@kompilot.com</p>
            <p className="text-[10px] text-slate-500 uppercase truncate">Administrateur Démo</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/20 text-slate-400 py-2 px-3 rounded-xl text-xs font-medium transition"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
