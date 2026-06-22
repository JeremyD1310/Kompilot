/**
 * ClaudeCoworkPage — /agence/cowork
 * AI Strategic Consultant integrated into the Agency Space.
 * Uses blink.ai.streamText for real-time generation.
 * Credits persisted per user in localStorage.
 * Chat history persisted per user + space in localStorage.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Zap, Building2, User, CreditCard, ChevronDown, ChevronUp, Sparkles, Bot } from 'lucide-react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Badge, toast } from '@blinkdotnew/ui';
import { blink } from '../blink/client';
import { analyticsTrackCoworkMessage } from '../firebase/analytics';
import { useCoworkCredits } from '../hooks/useCoworkCredits';
import { useCoworkHistory, type CoworkSpaceType } from '../hooks/useCoworkHistory';
import { cn } from '../lib/utils';
import { AIAgentsModule } from '../components/cowork/AIAgentsModule';

// ── System prompts ──────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CoworkSpaceType, string> = {
  agence: `Tu es "Claude Cowork", le Consultant Stratégique Senior intégré à l'Espace Agence de Kompilot.
Ton rôle est d'agir comme un pilier de l'équipe, capable de :
- Structurer des stratégies de présence digitale locale pour des clients PME/commerces
- Concevoir des plans d'action marketing à grande échelle (acquisition, rétention, avis Google)
- Générer des livrables "prêts-à-envoyer-au-client" : rapports, propositions, e-mails, plans éditoriaux
- Analyser des données de performance (geo-score, avis, publications) et formuler des recommandations actionnables

Profil de communication :
- Professionnel, analytique, rigoureux et stratégique
- Tu t'adresses à des équipes d'agence et des directeurs de projets
- Utilise un formatage Markdown impeccable : titres, bullet points, tableaux, sections claires

Contraintes :
- Chaque recommandation doit avoir un objectif ROI clair (conversion, notoriété, efficacité opérationnelle)
- Structure tes réponses de manière à ce qu'elles puissent être copiées-collées dans un rapport client
- Réponds TOUJOURS en français`,

  pro: `Tu es "Claude Cowork", le coworker virtuel ultra-productif intégré à l'Espace Pro de Kompilot.
Ton objectif est d'aider les indépendants et gérants de PME à gérer leur quotidien et à gagner du temps.

Tu peux les aider à :
- Rédiger des e-mails professionnels, relances clients, devis
- Planifier des actions marketing et éditorial pour leur établissement
- Répondre à des avis Google de manière professionnelle
- Créer du contenu pour leurs réseaux sociaux

Profil de communication :
- Direct, encourageant et pragmatique
- Donne des réponses actionnables avec des checklists ou modèles prêts à l'emploi

Réponds TOUJOURS en français.`
};

// ── Suggestion prompts ──────────────────────────────────────────────────────

const SUGGESTIONS: Record<CoworkSpaceType, { label: string; text: string }[]> = {
  agence: [
    { label: '📋 Proposition client', text: 'Rédige une proposition d\'accompagnement marketing digital sur 3 mois pour un restaurant gastronomique voulant améliorer sa visibilité locale et ses avis Google.' },
    { label: '📊 Rapport mensuel', text: 'Structure un rapport mensuel de performance pour un client commerce de proximité : sections KPIs, actions réalisées, recommandations pour le mois suivant.' },
    { label: '🎯 Plan éditorial', text: 'Crée un plan éditorial pour 4 semaines (Instagram + Google Business) pour un salon de coiffure situé en centre-ville, ciblant une clientèle 25-45 ans.' },
    { label: '⚡ Réponse crise', text: 'Rédige une stratégie de gestion de crise pour un client qui a reçu 5 avis négatifs en une semaine suite à un problème de service.' },
  ],
  pro: [
    { label: '✉️ Relance facture', text: 'Rédige un e-mail de relance poli mais ferme pour une facture impayée depuis 30 jours.' },
    { label: '⭐ Réponse avis', text: 'Aide-moi à répondre professionnellement à cet avis Google négatif : "Service très décevant, personnel peu accueillant, je ne recommande pas."' },
    { label: '📱 Post Instagram', text: 'Génère 3 idées de posts Instagram avec légendes pour promouvoir mon service de réparation électronique, avec hashtags pertinents.' },
    { label: '📅 Semaine type', text: 'Planifie une semaine type d\'actions marketing pour un gérant de restaurant qui peut y consacrer 2h par semaine.' },
  ],
};

// ── Markdown renderer (minimal) ─────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.*$)/gm, '<h4 class="font-bold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-base mt-4 mb-1">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-lg mt-4 mb-2">$1</h2>')
    // Bullet lists
    .replace(/^[-*] (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Newlines
    .replace(/\n/g, '<br/>');
}

// ── Cost simulator ──────────────────────────────────────────────────────────

function SimulatorPanel({ text, spaceType, onClose }: { text: string; spaceType: CoworkSpaceType; onClose: () => void }) {
  const tokens = Math.floor(text.length / 3.8);
  const costUsd = spaceType === 'agence'
    ? tokens * 0.000015
    : tokens * 0.00000125;
  const margin = ((0.33 - (costUsd * 0.9)) / 0.33 * 100).toFixed(1);

  return (
    <div className="absolute top-16 right-4 w-76 p-4 bg-card border border-border rounded-xl shadow-2xl z-20 space-y-3 text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Simulateur Rentabilité</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tokens estimés :</span>
          <span className="font-mono text-foreground">{tokens || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coût API estimé :</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">${costUsd.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Facturé (1 crédit) :</span>
          <span className="font-mono text-amber-600 dark:text-amber-400">~ 0,33 €</span>
        </div>
      </div>
      <div className="p-2.5 bg-muted rounded-lg">
        <span className="font-bold text-foreground block mb-0.5 text-[10px]">Marge estimée :</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">+{margin}% de marge nette</span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function ClaudeCoworkPage() {
  const [activeView, setActiveView] = useState<'chat' | 'agents'>('chat');
  const [spaceType, setSpaceType] = useState<CoworkSpaceType>('agence');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [lastAssistantText, setLastAssistantText] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const { credits, isLoaded, consumeCredit, addCredits } = useCoworkCredits();
  const { messages, addMessage, updateLastAssistantMessage, clearHistory } = useCoworkHistory(spaceType);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = textOverride ?? input;
    if (!text.trim() || isStreaming) return;

    if (credits <= 0) {
      toast.error('Crédits insuffisants', {
        description: 'Rechargez votre compte pour continuer à utiliser Claude Cowork.',
      });
      return;
    }

    const consumed = consumeCredit();
    if (!consumed) return;

    setInput('');
    setIsStreaming(true);

    // Track in Firebase Analytics
    analyticsTrackCoworkMessage(spaceType);

    // Add user message
    addMessage({ role: 'user', text: text.trim(), timestamp: Date.now(), spaceType });

    // Add placeholder assistant message
    const assistantMsg = addMessage({
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      spaceType,
    });
    setStreamingId(assistantMsg.id);

    // Build chat history for context
    const history = messages
      .filter(m => m.id !== 'welcome')
      .slice(-10) // last 10 messages for context
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));

    let accumulated = '';

    try {
      abortRef.current = new AbortController();

      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS[spaceType] },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: text.trim() },
          ],
          model: spaceType === 'agence' ? 'gpt-4.1' : 'gpt-4.1-mini',
          maxTokens: 2000,
          signal: abortRef.current.signal,
        },
        (chunk: string) => {
          accumulated += chunk;
          setLastAssistantText(accumulated);
          updateLastAssistantMessage(accumulated);
        }
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erreur de génération', {
          description: 'Une erreur est survenue. Veuillez réessayer.',
        });
        updateLastAssistantMessage('⚠️ Une erreur est survenue lors de la génération. Veuillez réessayer.');
      }
    } finally {
      setIsStreaming(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  }, [input, isStreaming, credits, consumeCredit, addMessage, updateLastAssistantMessage, messages, spaceType]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    abortRef.current?.abort();
  };

  const isAgence = spaceType === 'agence';
  const accentColor = isAgence ? '#0D9488' : '#6366F1';

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `${accentColor}20` }}
          >
            <Sparkles size={18} style={{ color: accentColor }} />
          </div>
          <div>
            <PageTitle>Claude Cowork</PageTitle>
            <PageDescription>Assistant IA Stratégique — Espace {isAgence ? 'Agence' : 'Pro'}</PageDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher — Chat vs Agents */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setActiveView('chat')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
                activeView === 'chat' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sparkles size={12} />
              Assistant IA
            </button>
            <button
              onClick={() => setActiveView('agents')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
                activeView === 'agents' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Bot size={12} />
              Agents IA
            </button>
          </div>

          {/* Space switcher — only shown in chat mode */}
          {activeView === 'chat' && <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setSpaceType('agence')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
                isAgence ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Building2 size={12} />
              Agence
            </button>
            <button
              onClick={() => setSpaceType('pro')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
                !isAgence ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User size={12} />
              Pro
            </button>
          </div>}

          {/* Credits — chat mode only */}
          {activeView === 'chat' && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-semibold">
            <Zap size={12} className="text-amber-500" />
            <span>{isLoaded ? credits : '—'} crédits</span>
          </div>}

          {/* Simulator toggle — chat mode only */}
          {activeView === 'chat' && <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSimulator(v => !v)}
            className="gap-1.5 text-xs"
          >
            <CreditCard size={12} />
            Rentabilité
            {showSimulator ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>}
        </div>
      </PageHeader>

      <PageBody className="flex flex-col h-[calc(100vh-160px)] relative">
        {/* ── Agents view ── */}
        {activeView === 'agents' && (
          <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950/50 border border-slate-800/60 p-5">
            <AIAgentsModule />
          </div>
        )}

        {/* ── Chat view ── */}
        {activeView === 'chat' && <>
        {/* Simulator panel */}
        {showSimulator && (
          <SimulatorPanel
            text={lastAssistantText}
            spaceType={spaceType}
            onClose={() => setShowSimulator(false)}
          />
        )}

        <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-card">
          {/* Recharge banner */}
          {isLoaded && credits <= 3 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-xs">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                ⚠️ Plus que {credits} crédit{credits !== 1 ? 's' : ''} restant{credits !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => addCredits(15)}
                className="font-bold text-amber-700 dark:text-amber-300 hover:underline"
              >
                + 15 crédits (démo)
              </button>
            </div>
          )}

          {/* Messages feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCurrentlyStreaming = msg.id === streamingId;

              return (
                <div
                  key={msg.id}
                  className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white text-xs font-bold"
                    style={{ background: isUser ? '#64748B' : accentColor }}
                  >
                    {isUser ? <User size={14} /> : 'C'}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%]',
                      isUser
                        ? 'bg-muted text-foreground rounded-tr-none'
                        : 'bg-background border border-border rounded-tl-none'
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        {msg.text ? (
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                          />
                        ) : isCurrentlyStreaming ? (
                          <div className="flex items-center gap-1.5 h-5">
                            {[0, 150, 300].map(delay => (
                              <span
                                key={delay}
                                className="w-2 h-2 rounded-full animate-bounce"
                                style={{ background: accentColor, animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                        ) : null}

                        {isCurrentlyStreaming && msg.text && (
                          <button
                            onClick={handleStopStreaming}
                            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground underline"
                          >
                            Arrêter la génération
                          </button>
                        )}
                      </>
                    )}

                    <div className={cn('text-[10px] mt-1.5', isUser ? 'text-right text-muted-foreground/60' : 'text-muted-foreground/50')}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {!isUser && (
                        <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1.5 font-normal">
                          {spaceType === 'agence' ? 'GPT-4.1 Consultant' : 'GPT-4.1 Mini Pro'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 pt-3 pb-2 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Requêtes suggérées
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS[spaceType].map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.text)}
                  disabled={isStreaming}
                  className="px-2.5 py-1 bg-muted border border-border text-xs rounded-lg text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-background transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input zone */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  placeholder={
                    isAgence
                      ? 'Exprimez votre besoin stratégique, demandez un livrable client…'
                      : 'Demandez un e-mail, un post, une checklist…'
                  }
                  className="w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition max-h-32"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                {isStreaming ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopStreaming}
                    className="h-10 px-3"
                  >
                    ⏹
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isStreaming}
                    className="h-10 px-3 gap-1.5"
                    style={input.trim() ? { background: accentColor } : {}}
                  >
                    <Send size={14} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearHistory}
                  disabled={isStreaming}
                  className="h-8 px-2"
                  title="Effacer l'historique"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground/60">
              <span>Entrée pour envoyer · Maj+Entrée pour nouvelle ligne · 1 crédit/message</span>
              <span>Kompilot · Claude Cowork v1.0</span>
            </div>
          </div>
        </div>
        </>}
      </PageBody>
    </Page>
  );
}
