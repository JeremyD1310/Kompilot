import React from 'react';

interface LeadResult {
  name: string;
  phone: string;
  badge: string;
}

interface Props {
  leadCategory: string;
  setLeadCategory: (v: string) => void;
  leadCity: string;
  setLeadCity: (v: string) => void;
  isScraping: boolean;
  scrapeProgress: number;
  searchResults: LeadResult[];
  onSearch: (e: React.FormEvent) => void;
}

export default function LeadProspectingTab({ leadCategory, setLeadCategory, leadCity, setLeadCity, isScraping, scrapeProgress, searchResults, onSearch }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">📍 Moteur de Prospection Google Maps</h2>
        <p className="text-slate-400 text-xs mt-1">Entrez une thématique et une ville pour lister les commerces locaux, détecter leurs vulnérabilités G.E.O. et leur proposer un audit.</p>
      </div>

      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Secteur / Métier</label>
          <input
            type="text"
            value={leadCategory}
            onChange={(e) => setLeadCategory(e.target.value)}
            placeholder="Ex: Coiffeur, Dentiste, SPA"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Ville</label>
          <input
            type="text"
            value={leadCity}
            onChange={(e) => setLeadCity(e.target.value)}
            placeholder="Ex: Paris, Lyon, Binic"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isScraping}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {isScraping ? `Scan en cours... ${scrapeProgress}%` : 'Lancer la recherche'}
          </button>
        </div>
      </form>

      {isScraping && (
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${scrapeProgress}%` }} />
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4 border-b border-slate-800">Établissement</th>
                <th className="p-4 border-b border-slate-800">Téléphone</th>
                <th className="p-4 border-b border-slate-800">Vulnérabilité</th>
                <th className="p-4 border-b border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900">
              {searchResults.map((lead, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition">
                  <td className="p-4 font-semibold text-white">{lead.name}</td>
                  <td className="p-4 text-slate-400 text-xs font-mono">{lead.phone}</td>
                  <td className="p-4">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">{lead.badge}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                      Générer Audit PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
