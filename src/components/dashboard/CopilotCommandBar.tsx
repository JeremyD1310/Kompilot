/**
 * CopilotCommandBar — Barre de commande IA (style nimt.ai premium).
 *
 * V2 — Réponse IA inline :
 *   - Le prompt est envoyé à blink.ai.streamText directement dans la barre
 *   - La réponse apparaît inline sous l'input (streaming token-by-token)
 *   - Un lien "Continuer la conversation →" ouvre l'AIChatWidget complet
 *   - Quick Suggestions naviguent vers les pages métiers
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles, Loader2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useUserProfile } from '../../context/UserProfileContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useTrial } from '../../context/TrialContext';
import { blink } from '../../blink/client';

// ── Quick Suggestions per profile ─────────────────────────────────────────────

type QuickSuggestion = {
  label: string;
  emoji: string;
  route: string;
  prompt?: string;
};

const COMMERCE_SUGGESTIONS: QuickSuggestion[] = [
  {
    emoji: '⚡',
    label: 'Répondre aux avis',
    route: '/inbox',
    prompt: 'Génère une réponse élégante et professionnelle à mon dernier avis Google. Valorise notre expertise.',
  },
  {
    emoji: '🛡️',
    label: 'Activer Anti-No Show',
    route: '/inbox',
    prompt: "Combien de chiffre d'affaires ai-je perdu ce mois à cause de chaises vides ? Montre-moi comment activer le bouclier de trésorerie.",
  },
  {
    emoji: '📢',
    label: 'Créer un post local',
    route: '/cockpit',
    prompt: 'Déclenche une conversation lucrative avec mes abonnés — crée un post engageant ancré dans mon actualité locale.',
  },
];

const AGENCY_SUGGESTIONS: QuickSuggestion[] = [
  {
    emoji: '📊',
    label: 'Exporter rapport PDF',
    route: '/growth',
    prompt: 'Génère le rapport de tendance sectorielle avec la perte de CA estimée pour mon prochain prospect.',
  },
  {
    emoji: '🔍',
    label: 'Analyser Score G.E.O.',
    route: '/geo-authority',
    prompt: "Quelle part de voix mes clients perdent-ils face à leurs concurrents locaux dans les moteurs d'IA ?",
  },
  {
    emoji: '📝',
    label: 'Planifier 15 contenus',
    route: '/calendar',
    prompt: 'Génère un plan éditorial de 15 posts premium pour le mois prochain — valorise le savoir-faire de mes clients.',
  },
];

// Short system prompt for inline responses (max 80 words)
const INLINE_SYSTEM_PROMPT = `Tu es le Copilote Stratégique de Kompilot. Réponses ultra-concises (max 80 mots). Zéro blabla. Style direct, élégant, orienté gain financier. Vouvoiement. Termine toujours par UNE action concrète courte.`;

// ── Component ─────────────────────────────────────────────────────────────────

interface CopilotCommandBarProps {
  /** Called when user wants to open the full chat widget */
  onPromptSubmit?: (text: string) => void;
}

export function CopilotCommandBar({ onPromptSubmit }: CopilotCommandBarProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [inlineResponse, setInlineResponse] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { masterProfile } = useUserProfile();
  const { activeEstablishment } = useEstablishment();
  const { gateAction } = useTrial();

  const isAgency = masterProfile === 'agence' || masterProfile === 'franchise';
  const suggestions: QuickSuggestion[] = isAgency ? AGENCY_SUGGESTIONS : COMMERCE_SUGGESTIONS;

  const runInlineAI = useCallback(async (text: string) => {
    setStreaming(true);
    setInlineResponse('');
    setLastPrompt(text);

    const estName = activeEstablishment?.name || activeEstablishment?.shortName || 'Mon Commerce';
    const activity = activeEstablishment?.category || activeEstablishment?.activity || 'commerce local';
    const city = activeEstablishment?.city || '';

    const contextualPrompt = `[Établissement: ${estName} — ${activity}${city ? ` — ${city}` : ''}]\n\n${text}`;

    try {
      let full = '';
      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: INLINE_SYSTEM_PROMPT },
            { role: 'user', content: contextualPrompt },
          ],
          model: 'gpt-4.1-mini',
          maxTokens: 160,
        },
        (chunk: string) => {
          full += chunk;
          setInlineResponse(full);
        },
      );
    } catch (_err) {
      setInlineResponse('Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.');
    } finally {
      setStreaming(false);
    }
  }, [activeEstablishment]);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    gateAction(async () => {
      setInput('');
      await runInlineAI(trimmed);
    });
  };

  const handleSuggestion = (s: QuickSuggestion) => {
    gateAction(async () => {
      if (s.prompt) {
        // Suggestions with a prompt → inline AI answer
        await runInlineAI(s.prompt);
      } else {
        navigate({ to: s.route as '/' });
      }
    });
  };

  const handleOpenFullChat = () => {
    if (lastPrompt) {
      onPromptSubmit?.(lastPrompt);
    }
  };

  const clearResponse = () => {
    setInlineResponse('');
    setLastPrompt('');
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Command bar ─────────────────────────────────────── */}
      <motion.div
        className="relative"
        animate={{ scale: focused ? 1.01 : 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200"
          style={{
            background: 'rgba(10, 15, 30, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: focused
              ? '1.5px solid rgba(13,148,136,0.6)'
              : '1.5px solid rgba(255,255,255,0.09)',
            boxShadow: focused
              ? '0 0 0 3px rgba(13,148,136,0.08), 0 8px 40px rgba(13,148,136,0.2), 0 2px 16px rgba(0,0,0,0.5)'
              : '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* AI icon */}
          <div
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(13,148,136,0.25) 0%, rgba(13,148,136,0.12) 100%)',
              border: '1px solid rgba(13,148,136,0.3)',
            }}
          >
            {streaming
              ? <Loader2 size={15} className="text-[#0D9488] animate-spin" />
              : <Sparkles size={16} className="text-[#0D9488]" />
            }
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && !streaming && handleSubmit(input)}
            placeholder={streaming ? 'Analyse en cours…' : "Demandez à votre copilote d'analyser votre visibilité ou de bloquer un No-Show..."}
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none min-w-0 disabled:opacity-60"
          />

          {/* Send button */}
          <motion.button
            onClick={() => !streaming && handleSubmit(input)}
            disabled={!input.trim() || streaming}
            whileHover={input.trim() && !streaming ? { scale: 1.08 } : {}}
            whileTap={input.trim() && !streaming ? { scale: 0.92 } : {}}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !streaming
                ? 'linear-gradient(135deg, #0D9488 0%, #0B7A6F 100%)'
                : 'rgba(255,255,255,0.07)',
              boxShadow: input.trim() && !streaming
                ? '0 0 0 2px rgba(13,148,136,0.2), 0 4px 16px rgba(13,148,136,0.5)'
                : 'none',
            }}
          >
            <ArrowUp size={15} className={(input.trim() && !streaming) ? 'text-white' : 'text-slate-500'} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Inline AI response ───────────────────────────────── */}
      <AnimatePresence>
        {(inlineResponse || streaming) && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,148,136,0.07)',
              border: '1px solid rgba(13,148,136,0.18)',
            }}
          >
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={10} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <p className="text-[9px] text-[#0D9488]/70 uppercase tracking-widest font-black">Copilote IA</p>
                </div>
                {!streaming && (
                  <button onClick={clearResponse} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Streaming text */}
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {inlineResponse}
                {streaming && (
                  <span className="inline-block w-1 h-3.5 bg-[#0D9488] ml-0.5 animate-pulse rounded-sm" />
                )}
              </p>

              {/* Open full chat CTA */}
              {!streaming && inlineResponse && (
                <button
                  onClick={handleOpenFullChat}
                  className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-[#0D9488]/70 hover:text-[#0D9488] transition-colors"
                >
                  Continuer la conversation
                  <ChevronRight size={10} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Suggestions chips ───────────────────────────── */}
      {!inlineResponse && !streaming && (
        <AnimatePresence>
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.2 }}
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => handleSuggestion(s)}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#94A3B8',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default CopilotCommandBar;
