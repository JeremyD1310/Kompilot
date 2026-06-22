/**
 * Anti-Vide Engine — Contenus des 3 onglets
 * HookGeneratorTab · LocalSyncTab · AdaptTab
 */

import { Check, Cloud, Star, ArrowRight } from 'lucide-react';
import { MOCK_REVIEWS }  from '@/components/inbox/reviewsData';
import type { GoogleReview } from '@/components/inbox/reviewsData';
import {
  STRUCTURE_LABELS, NETWORK_CONFIG, LOCAL_EVENTS,
  type Structure, type Network, type LocalEvent,
} from './types';

/* ── Atoms shared ────────────────────────────────────────────── */
export function NetworkBadges({ networks }: { networks: Network[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap pt-1">
      <span className="text-[10px] text-slate-400 font-medium">Format :</span>
      {networks.map(n => (
        <span
          key={n}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-white dark:bg-slate-900 ${NETWORK_CONFIG[n].color}`}
        >
          <span>{NETWORK_CONFIG[n].label}</span>
          <ArrowRight className="w-2.5 h-2.5 opacity-50" />
          <span className="text-slate-500 dark:text-slate-400">{NETWORK_CONFIG[n].format}</span>
        </span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 1 — Hook Generator
══════════════════════════════════════════════════════════════ */
export function HookGeneratorTab({
  structure, setStructure, topic, setTopic, networks,
}: {
  structure: Structure;
  setStructure: (s: Structure) => void;
  topic: string;
  setTopic: (t: string) => void;
  networks: Network[];
}) {
  return (
    <div className="space-y-4">
      {/* Structure selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          Structure psychologique
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(STRUCTURE_LABELS) as [Structure, typeof STRUCTURE_LABELS[Structure]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStructure(key)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                structure === key
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
              }`}
            >
              <span className="text-lg">{cfg.emoji}</span>
              <span className="font-bold text-xs text-slate-900 dark:text-white">{cfg.label}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{cfg.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {structure === 'HOOK_REPULSIF' && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
            🔥 <strong>Hook Répulsif :</strong> génère 3 variantes d'accroches qui stoppent
            le scroll en moins d'1 seconde — "Arrêtez de faire X", "La vérité sur Y"...
          </p>
        </div>
      )}

      {/* Topic input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          Sujet ou offre à mettre en avant
        </label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          rows={2}
          placeholder="Ex: nouvelle offre de réservation en ligne, promo -20%, service de livraison..."
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
        />
      </div>

      <NetworkBadges networks={networks} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — Local Sync
══════════════════════════════════════════════════════════════ */
export function LocalSyncTab({
  selectedReview, setSelectedReview,
  selectedEvent, setSelectedEvent,
  topic, setTopic,
  networks,
}: {
  selectedReview:    GoogleReview | null;
  setSelectedReview: (r: GoogleReview | null) => void;
  selectedEvent:     LocalEvent | null;
  setSelectedEvent:  (e: LocalEvent | null) => void;
  topic:             string;
  setTopic:          (t: string) => void;
  networks:          Network[];
}) {
  const fiveStars = MOCK_REVIEWS.filter(r => r.rating >= 5);

  return (
    <div className="space-y-4">
      {/* Avis 5 étoiles */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          Recycler un avis 5★ en post scénarisé
        </div>
        <div className="space-y-2">
          {fiveStars.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedReview(selectedReview?.id === r.id ? null : r);
                setSelectedEvent(null);
              }}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedReview?.id === r.id
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                {r.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{r.authorName}</span>
                  <span className="text-amber-500 text-xs">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{r.text}</p>
              </div>
              {selectedReview?.id === r.id && <Check className="w-4 h-4 text-amber-500 shrink-0 mt-1" />}
            </button>
          ))}
        </div>
      </div>

      <Divider label="OU" />

      {/* Événements locaux */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Cloud className="w-3.5 h-3.5 text-blue-500" />
          Surfer sur l'actualité locale / météo
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LOCAL_EVENTS.map(evt => (
            <button
              key={evt.id}
              onClick={() => {
                setSelectedEvent(selectedEvent?.id === evt.id ? null : evt);
                setSelectedReview(null);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                selectedEvent?.id === evt.id
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <span className="text-lg shrink-0">{evt.emoji}</span>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">{evt.label}</span>
            </button>
          ))}
        </div>

        {selectedEvent && (
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Votre offre liée à cet événement (optionnel)"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        )}
      </div>

      <NetworkBadges networks={networks} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 3 — Adaptation multi-réseaux
══════════════════════════════════════════════════════════════ */
export function AdaptTab({
  currentOutput, networks, toggleNetwork,
}: {
  currentOutput: string;
  networks:      Network[];
  toggleNetwork: (n: Network) => void;
}) {
  return (
    <div className="space-y-4">
      {currentOutput ? (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-[11px] text-slate-500 mb-2 font-medium">Contenu actuel à adapter :</p>
          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">{currentOutput}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Générez d'abord un contenu en mode <strong>Hook Generator</strong> ou <strong>Local Sync</strong>,
            puis revenez ici pour l'adapter.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Réseaux cibles</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(NETWORK_CONFIG) as [Network, typeof NETWORK_CONFIG[Network]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => toggleNetwork(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                networks.includes(key)
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
              }`}
            >
              <div className="text-left flex-1">
                <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                <p className="text-[10px] text-slate-500">{cfg.format}</p>
              </div>
              {networks.includes(key) && <Check className="w-3.5 h-3.5 text-violet-500" />}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">
          Instagram/TikTok → script vidéo · LinkedIn/Facebook → texte aéré + CTA commentaire
        </p>
      </div>
    </div>
  );
}

/* ── Atom ──────────────────────────────────────────────────────── */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
    </div>
  );
}
