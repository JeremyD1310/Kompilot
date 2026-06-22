import React from 'react';
import { Sparkles, X, Sliders, CheckCircle } from 'lucide-react';
import type { Sector, CalendarEvent } from '../showcaseData';
import { SECTOR_DATA } from '../showcaseData';

interface Props {
  sector: Sector;
  calendarEvents: CalendarEvent[];
  selectedEvent: CalendarEvent & { budget: number };
  assistantDrawerOpen: boolean;
  setAssistantDrawerOpen: (v: boolean) => void;
  onEventClick: (ev: CalendarEvent) => void;
  onValidate: () => void;
  onBudgetChange: (budget: number) => void;
}

const COLOR_MAP = {
  blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

export default function CalendarIATab({ sector, calendarEvents, selectedEvent, assistantDrawerOpen, setAssistantDrawerOpen, onEventClick, onValidate, onBudgetChange }: Props) {
  const sd = SECTOR_DATA[sector];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">📅 Calendrier des Campagnes</h2>
          <p className="text-slate-400 text-xs mt-1">Votre IA planifie, génère des posts et active vos campagnes publicitaires de manière autonome.</p>
        </div>
        <button
          onClick={() => { const ev = calendarEvents.find(e => e.id === 'maman'); if (ev) onEventClick(ev); }}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start md:self-center"
        >
          <Sparkles className="h-4 w-4" />Brief de l'Assistant IA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly calendar */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="font-bold text-sm tracking-widest text-slate-400 uppercase">Juin 2026</span>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold"><span className="h-2 w-2 rounded-full bg-blue-500" /> Post Local</span>
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold"><span className="h-2 w-2 rounded-full bg-purple-500" /> AIO Sync</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Boost Pub</span>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 py-1 uppercase tracking-wider">
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-2.5">
            {/* 3 empty offset cells for June 2026 starting on Monday */}
            {[0,1,2].map(i => <div key={`e${i}`} className="h-24 bg-slate-950/20 rounded-xl border border-dashed border-slate-800/40" />)}
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const events = calendarEvents.filter(ev => ev.day === day);
              return (
                <div
                  key={day}
                  onClick={() => events.length > 0 && onEventClick(events[0])}
                  className={`h-24 bg-slate-950/50 hover:bg-slate-900 border rounded-2xl p-2 flex flex-col justify-between transition cursor-pointer select-none ${events.length > 0 ? 'border-slate-800 shadow-lg' : 'border-slate-900'}`}
                >
                  <span className="text-xs font-bold text-slate-600 font-mono">{day}</span>
                  <div className="space-y-1">
                    {events.map(ev => (
                      <div key={ev.id} className={`text-[8px] p-1 rounded-lg truncate font-extrabold tracking-tight ${ev.status === 'confirmed' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 line-through' : COLOR_MAP[ev.type]}`}>
                        {ev.status === 'confirmed' ? '✓ ' : ''}{ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Brief panel */}
        {assistantDrawerOpen && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 flex flex-col">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Brief de l'Assistant IA</span>
                <button onClick={() => setAssistantDrawerOpen(false)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
              </div>
              <h3 className="font-extrabold text-white">{selectedEvent.title}</h3>
              <p className="text-[10px] text-slate-500">Planifié le {selectedEvent.day} Juin 2026</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-700 space-y-3 max-h-[160px] overflow-y-auto">
              {(selectedEvent.chat || []).map((msg, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <p className={`font-bold uppercase text-[9px] ${msg.sender === 'claude' ? 'text-teal-400' : 'text-slate-400'}`}>
                    {msg.sender === 'claude' ? 'Claude Assistant' : 'Vous'}
                  </p>
                  <p className="text-slate-300 leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Aperçu Créatif :</p>
              <div style={{ background: sd.imageTheme }} className="h-40 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 border border-slate-800 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                <div className="z-10 flex justify-between items-center">
                  <span className="text-[8px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">Post de marque</span>
                  <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
                </div>
                <div className="z-10 space-y-1">
                  <h4 className="font-extrabold text-white text-sm tracking-tight leading-none">{sd.cardTitle}</h4>
                  <p className="text-[10px] text-teal-300 font-semibold">{sd.cardSub}</p>
                </div>
                <div className="z-10 border-t border-white/10 pt-2 flex items-center justify-between text-[8px] text-slate-400">
                  <span>Co-écrit par Kompilot</span><span>Fête des Mères 2026</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-teal-400" />Budget Pub (ROAS) :</span>
                <span className="text-teal-400 font-mono">{selectedEvent.budget} €</span>
              </div>
              <input type="range" min={50} max={500} step={25} value={selectedEvent.budget} onChange={(e) => onBudgetChange(Number(e.target.value))} className="w-full accent-teal-500 cursor-pointer" />
            </div>

            <div>
              {selectedEvent.status === 'confirmed' ? (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2 rounded-xl text-center text-xs font-extrabold flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />Campagne Validée !
                </div>
              ) : (
                <button onClick={onValidate} className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition">
                  Valider & Planifier
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
