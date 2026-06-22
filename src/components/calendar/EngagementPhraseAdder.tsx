/**
 * EngagementPhraseAdder
 * Displays a small collapsible widget inside the CreatePostModal that lets
 * the user append a keyword-based engagement call-to-action to their post,
 * connecting with the SalesTriggersPanel auto-DM system.
 */
import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const PRESETS = [
  { keyword: 'RESERVER',   label: 'Réserver',    phrase: "📩 Commentez **RESERVER** et recevez notre lien de réservation directement en message privé !" },
  { keyword: 'MENU',       label: 'Menu',         phrase: "🍽️ Commentez **MENU** pour recevoir notre carte complète en message privé !" },
  { keyword: 'PROMO',      label: 'Promotion',    phrase: "🎉 Commentez **PROMO** pour recevoir votre coupon exclusif en message privé !" },
  { keyword: 'INFOS',      label: 'Infos',        phrase: "💬 Commentez **INFOS** pour recevoir tous les détails en message privé !" },
  { keyword: 'TARIF',      label: 'Tarif',        phrase: "💰 Commentez **TARIF** pour recevoir nos tarifs en message privé !" },
];

interface Props {
  text: string;
  onAppend: (phrase: string) => void;
}

export function EngagementPhraseAdder({ text, onAppend }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Check which keywords are already in the text
  const textUpper = text.toUpperCase();
  const alreadyAdded = (kw: string) => textUpper.includes(kw);

  return (
    <div className="rounded-xl border border-dashed border-primary/25 overflow-hidden">
      {/* Collapsed toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors text-left"
      >
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Zap size={11} className="text-primary" />
        </div>
        <span className="text-[11px] font-semibold text-foreground flex-1">
          Ajouter une phrase d'engagement (Trigger DM auto)
        </span>
        <span className="text-[10px] text-muted-foreground mr-1">Connecté aux Triggers Vente</span>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/60 bg-primary/[0.02]">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Ajoutez une incitation au commentaire. Quand un abonné commente le mot-clé, Kompilot lui envoie automatiquement un DM avec votre lien de conversion.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => {
              const done = alreadyAdded(p.keyword);
              return (
                <button
                  key={p.keyword}
                  type="button"
                  disabled={done}
                  onClick={() => { onAppend(p.phrase); setExpanded(false); }}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold rounded-full border px-2.5 py-1 transition-all ${
                    done
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default'
                      : 'bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {done ? '✓' : <Plus size={10} />}
                  {p.label} ({p.keyword})
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            💡 Configurez les réponses automatiques dans <strong>Inbox → ⚡ Triggers Vente</strong>
          </p>
        </div>
      )}
    </div>
  );
}
