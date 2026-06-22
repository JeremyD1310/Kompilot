import { useState } from 'react';
import { MessageCircle, Send, Sparkles, RefreshCw, Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Simulated AI DM responses ─────────────────────────────────────────────────
const DM_SCENARIOS = [
  {
    id: 'availability',
    clientMsg: 'Bonjour ! Avez-vous des disponibilités pour vendredi prochain ? 😊',
    aiDraft: `Bonjour ! 😊 Oui, nous avons encore quelques créneaux disponibles vendredi !

Pour garantir votre place et éviter toute déception, je vous invite à réserver directement en ligne en quelques secondes :

👉 **Réserver maintenant** → [planity.com/votre-commerce](https://planity.com)

C'est rapide, sécurisé et vous recevrez une confirmation immédiate par SMS. On se réjouit de vous accueillir ! ✨`,
  },
  {
    id: 'price',
    clientMsg: 'Bonjour, quels sont vos tarifs pour une prestation complète ? 💇',
    aiDraft: `Bonjour ! 💇 Nos prestations complètes démarrent à partir de 45€ selon vos besoins.

Pour un devis personnalisé et un créneau qui vous convient, le plus simple est de passer par notre agenda en ligne :

👉 **Voir les disponibilités & tarifs** → [planity.com/votre-commerce](https://planity.com)

Vous pouvez choisir votre prestation, voir les prix exacts et réserver en moins de 2 minutes. On a hâte de vous chouchouter ! 🌟`,
  },
  {
    id: 'hours',
    clientMsg: 'Vous êtes ouverts ce dimanche ? Je cherche un créneau en urgence 🙏',
    aiDraft: `Bonjour ! 🙏 Nous ouvrons exceptionnellement ce dimanche de 10h à 17h.

Les créneaux partent vite — pour être sûr(e) d'avoir votre place, réservez dès maintenant :

👉 **Réserver un créneau dimanche** → [planity.com/votre-commerce](https://planity.com)

Confirmation instantanée, annulation possible jusqu'à 24h avant. On vous attend ! ✨`,
  },
];

// ── Instagram phone mock ──────────────────────────────────────────────────────
function IGMessageBubble({ text, isClient }: { text: string; isClient: boolean }) {
  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      {!isClient && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">
          V
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
          isClient
            ? 'bg-[#0095f6] text-white rounded-br-sm'
            : 'bg-[#262626] text-white rounded-bl-sm'
        }`}
        style={{ whiteSpace: 'pre-line' }}
      >
        {text}
      </div>
      {isClient && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ml-2 mt-1">
          C
        </div>
      )}
    </div>
  );
}

// ── Booking link badge ────────────────────────────────────────────────────────
function BookingLinkBadge() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#0095f6]/20 border border-[#0095f6]/40 px-3 py-2 mt-1 mx-2">
      <ExternalLink size={12} className="text-[#0095f6] shrink-0" />
      <span className="text-[11px] font-bold text-[#0095f6]">Bouton de réservation automatique inséré ✅</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DMSimulatorSection() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  const scenario = DM_SCENARIOS[scenarioIdx];

  const handleGenerate = () => {
    setIsGenerating(true);
    setShowResponse(false);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResponse(true);
    }, 1600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scenario.aiDraft.replace(/\*\*/g, '').replace(/\[.*?\]\(.*?\)/g, '')).catch(() => {});
    setCopied(true);
    toast.success('Message copié !', { description: 'Collez-le directement dans votre DM Instagram.' });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNextScenario = () => {
    setScenarioIdx(i => (i + 1) % DM_SCENARIOS.length);
    setShowResponse(false);
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Messagerie & DM Automatiques 💬</h3>
          <p className="text-xs text-muted-foreground mt-0.5">L'IA pré-rédige des réponses ultra-vendeuses avec bouton de réservation automatique</p>
        </div>
      </div>

      {/* Instagram DM phone mock */}
      <div className="rounded-2xl overflow-hidden border border-[#363636] bg-[#000000] shadow-2xl">

        {/* Instagram DM top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#363636] bg-[#121212]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold shrink-0">V</div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#121212]" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">votre_commerce</p>
              <p className="text-[#8e8e8e] text-[10px]">En ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#8e8e8e]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e]" />
          </div>
        </div>

        {/* Messages thread */}
        <div className="px-3 py-4 space-y-3 min-h-[200px]">

          {/* Timestamp */}
          <p className="text-center text-[10px] text-[#8e8e8e]">Aujourd'hui, 14:32</p>

          {/* Client message */}
          <IGMessageBubble text={scenario.clientMsg} isClient />

          {/* AI response — shown after generation */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">
                V
              </div>
              <div className="bg-[#262626] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e]"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {showResponse && (
            <>
              <IGMessageBubble text={scenario.aiDraft} isClient={false} />
              <BookingLinkBadge />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-[#363636] bg-[#121212]">
          <div className="flex-1 rounded-full border border-[#363636] bg-[#262626] px-4 py-2 text-[11px] text-[#8e8e8e]">
            Rédigé par l'IA Kompilot…
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0095f6] flex items-center justify-center shrink-0">
            <Send size={14} className="text-white" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 transition-all cursor-pointer shadow-md"
        >
          {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {isGenerating ? 'Rédaction en cours…' : '✨ Générer la réponse IA'}
        </button>

        {showResponse && (
          <>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
            >
              {copied ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copié !' : 'Copier le message'}
            </button>
            <button
              onClick={handleNextScenario}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
            >
              <RefreshCw size={13} /> Autre scénario
            </button>
          </>
        )}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2">
        {[
          '🔗 Bouton réservation auto (Planity, ZenChef)',
          '⚡ Réponse en moins de 2 min',
          '💬 Adapté au ton de votre commerce',
          '📲 Prêt à coller dans Instagram',
        ].map(feat => (
          <span key={feat} className="inline-flex items-center text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border rounded-full px-2.5 py-1">
            {feat}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
