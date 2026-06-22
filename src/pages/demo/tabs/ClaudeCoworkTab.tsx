import React from 'react';

interface CoworkMessage {
  sender: 'claude' | 'user';
  text: string;
  time: string;
}

interface Props {
  selectedAgent: string;
  setSelectedAgent: (v: string) => void;
  coworkMessages: CoworkMessage[];
  sharedCanvas: string;
  setSharedCanvas: (v: string) => void;
}

const AGENTS = [
  { id: 'copywriter', label: 'Rédacteur' },
  { id: 'seo', label: 'Expert G.E.O.' },
  { id: 'finance', label: 'Sécurité' },
];

export default function ClaudeCoworkTab({ selectedAgent, setSelectedAgent, coworkMessages, sharedCanvas, setSharedCanvas }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chat panel */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 h-[500px]">
        <div className="space-y-2">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Sélecteur de rôle Claude :</p>
          <div className="grid grid-cols-3 gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={`p-2 rounded-xl border text-[10px] font-bold text-center transition ${selectedAgent === a.id ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/80 rounded-2xl border border-slate-700 p-4 space-y-3">
          {coworkMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] ${msg.sender === 'claude' ? 'self-start bg-slate-900 border border-slate-700 p-3 rounded-2xl rounded-tl-none' : 'ml-auto bg-teal-500 text-slate-950 p-3 rounded-2xl rounded-tr-none'}`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider mb-1">
                {msg.sender === 'claude' ? 'Claude' : 'Vous'} • {msg.time}
              </span>
              <p className="text-xs leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-7">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h3 className="font-bold text-white text-sm mb-3">📋 Canvas Stratégique Partagé</h3>
          <textarea
            value={sharedCanvas}
            onChange={(e) => setSharedCanvas(e.target.value)}
            className="w-full h-80 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
}
