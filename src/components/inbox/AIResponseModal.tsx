/**
 * AIResponseModal — Modal pour générer une réponse IA à un message inbox.
 * Utilise le backend AI Router via aiGenerate (QUICK_REPLY task type).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@blinkdotnew/ui';
import { Bot, Sparkles, X, Copy, CheckCheck, RefreshCw, Wand2 } from 'lucide-react';
import { aiGenerate } from '../../lib/aiRouterClient';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AIResponseModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional: message context to generate a contextual reply */
  messageContext?: {
    senderName?: string;
    subject?: string;
    body?: string;
    channel?: string;
  };
  /** Optional: called when user inserts the generated text */
  onInsert?: (text: string) => void;
}

// ── Tone options ───────────────────────────────────────────────────────────────

const TONES = [
  { id: 'professional', label: '💼 Professionnel', hint: 'Formel et courtois' },
  { id: 'friendly',     label: '😊 Amical',        hint: 'Chaleureux et proche' },
  { id: 'empathetic',   label: '🤝 Empathique',    hint: 'Compréhensif, pour les plaintes' },
];

// ── Scenario chips ─────────────────────────────────────────────────────────────

const SCENARIOS = [
  { label: '📅 Confirmer un RDV',          prompt: 'Confirme un rendez-vous avec le client en précisant que tu es disponible et impatient de les accueillir.' },
  { label: '💰 Répondre à une demande prix', prompt: 'Réponds à une demande de tarif/devis de façon professionnelle et invite à prendre contact.' },
  { label: '⭐ Remercier un avis positif',  prompt: 'Remercie chaleureusement un client pour son avis positif et invite-le à revenir.' },
  { label: '⚠️ Gérer une réclamation',      prompt: 'Réponds à une réclamation avec empathie, présente tes excuses et propose une solution concrète.' },
  { label: '❓ Répondre sur les horaires',  prompt: 'Réponds à une question sur tes horaires d\'ouverture de façon claire et accueillante.' },
  { label: '🤝 Répondre à un partenariat',  prompt: 'Réponds positivement à une proposition de partenariat en exprimant ton intérêt et en proposant un échange.' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function AIResponseModal({ open, onClose, messageContext, onInsert }: AIResponseModalProps) {
  const [selectedTone, setSelectedTone] = useState<string>('professional');
  const [customContext, setCustomContext] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (scenarioPrompt?: string) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedText('');

    try {
      const toneLabel = TONES.find(t => t.id === selectedTone)?.label ?? 'Professionnel';
      const channel = messageContext?.channel ?? 'messagerie';

      // Build a rich prompt with all available context
      let prompt = scenarioPrompt ?? customContext.trim();
      if (!prompt) {
        prompt = 'Génère une réponse professionnelle et courtoise au message reçu.';
      }

      const contextData: Record<string, unknown> = {
        channel,
        tone: toneLabel,
      };

      if (messageContext?.senderName) {
        contextData.senderName = messageContext.senderName;
      }
      if (messageContext?.subject) {
        contextData.messageSubject = messageContext.subject;
      }
      if (messageContext?.body) {
        // Limit body to avoid token overflow
        contextData.messageBody = messageContext.body.slice(0, 500);
      }

      const fullPrompt = `
Rédige une réponse à un message reçu via ${channel}.
Ton demandé : ${toneLabel}.
Consigne : ${prompt}
${messageContext?.body ? `\nMessage original : "${messageContext.body.slice(0, 300)}..."` : ''}

La réponse doit être :
- Courte (2-4 phrases maximum)
- En français
- Prête à envoyer telle quelle
- Sans formule d'introduction (ne commence pas par "Bien sûr" ou "Absolument")
`.trim();

      const result = await aiGenerate({
        taskType: 'QUICK_REPLY',
        prompt: fullPrompt,
        contextData,
        maxTokens: 256,
      });

      setGeneratedText(result.content.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la génération';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!generatedText) return;
    onInsert?.(generatedText);
    onClose();
  };

  const handleClose = () => {
    setGeneratedText('');
    setError(null);
    setCustomContext('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-[#0B1120] border border-[#0D9488]/30 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#0D9488]/20 bg-gradient-to-r from-[#0D9488]/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0D9488]/15 flex items-center justify-center">
                    <Bot size={16} className="text-[#0D9488]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Générer une réponse IA</h3>
                    <p className="text-[11px] text-slate-400">Réponse personnalisée en quelques secondes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/25 rounded-full">
                    <Sparkles size={9} className="mr-1" /> IA
                  </Badge>
                  <button
                    onClick={handleClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">

                {/* Message context preview */}
                {messageContext?.body && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Message reçu</p>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {messageContext.body}
                    </p>
                  </div>
                )}

                {/* Tone selector */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-300">Ton de la réponse</p>
                  <div className="flex gap-2">
                    {TONES.map(tone => (
                      <button
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
                        className={`flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border transition-all ${
                          selectedTone === tone.id
                            ? 'bg-[#0D9488]/20 border-[#0D9488]/50 text-[#0D9488]'
                            : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                        }`}
                        title={tone.hint}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario chips */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-300">Scénario rapide</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SCENARIOS.map(s => (
                      <button
                        key={s.label}
                        onClick={() => handleGenerate(s.prompt)}
                        disabled={isGenerating}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-[#0D9488]/15 hover:border-[#0D9488]/30 text-slate-400 hover:text-[#0D9488] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom context */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-300">Ou décris ta réponse</p>
                  <div className="flex gap-2">
                    <textarea
                      value={customContext}
                      onChange={e => setCustomContext(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
                      }}
                      placeholder="Ex: Propose un remboursement et demande un rappel téléphonique…"
                      rows={2}
                      className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0D9488]/50 focus:border-[#0D9488]/40 transition-all"
                    />
                    <Button
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || !customContext.trim()}
                      size="sm"
                      className="h-auto self-stretch px-3 gap-1.5 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl"
                    >
                      {isGenerating ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Wand2 size={13} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Error state */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                    <p className="text-xs text-red-400">{error}</p>
                    <button
                      onClick={() => handleGenerate()}
                      className="mt-1 text-[11px] text-red-400 hover:text-red-300 underline underline-offset-2"
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {/* Loading */}
                {isGenerating && !generatedText && (
                  <div className="rounded-xl border border-[#0D9488]/20 bg-[#0D9488]/5 px-4 py-3 flex items-center gap-3">
                    <RefreshCw size={14} className="text-[#0D9488] animate-spin shrink-0" />
                    <p className="text-xs text-slate-400">Génération en cours…</p>
                  </div>
                )}

                {/* Generated result */}
                {generatedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/8 p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles size={13} className="text-[#0D9488] shrink-0 mt-0.5" />
                      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap flex-1">
                        {generatedText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#0D9488]/15">
                      {onInsert && (
                        <Button
                          size="sm"
                          onClick={handleInsert}
                          className="h-8 text-xs gap-1.5 flex-1 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-lg"
                        >
                          <Wand2 size={11} /> Insérer dans la réponse
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        className="h-8 text-xs gap-1.5 border-[#0D9488]/30 text-[#0D9488] hover:bg-[#0D9488]/10 rounded-lg"
                      >
                        {copied ? <><CheckCheck size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
                      </Button>
                      <button
                        onClick={() => handleGenerate()}
                        disabled={isGenerating}
                        className="h-8 px-2.5 text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={11} /> Autre
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
