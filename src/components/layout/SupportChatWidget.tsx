/**
 * SupportChatWidget — AI-first customer support chat bubble
 *
 * Behaviour:
 *  1. IA répond en priorité avec connaissance contextuelle des habitudes utilisateur
 *  2. Si la question est technique (score > seuil), redirection vers WhatsApp
 *  3. Mémoire courte des habitudes : pages visitées, plan, secteur, actions récentes
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, PhoneCall, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '@tanstack/react-router';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { useSubscription } from '../../context/SubscriptionContext';
import { cn } from '../../lib/utils';

// ── Config ────────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '33757905101'; // Format international sans +
const WHATSAPP_URL = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const TECHNICAL_KEYWORDS = [
  'api', 'webhook', 'dns', 'cname', 'mx ', 'smtp', 'spf', 'dkim', 'dmarc',
  'stripe', 'paiement échoué', 'erreur 500', 'bug', 'crash', 'bogue',
  'intégration', 'token', 'oauth', 'authentification', 'connexion impossible',
  'facture', 'remboursement', 'litige', 'résiliation', 'migration',
];

function isTechnicalQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return TECHNICAL_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Habit tracker (lightweight, localStorage) ─────────────────────────────────

const HABIT_KEY = (uid: string) => `nc_habits_${uid}`;

interface UserHabits {
  pagesVisited: string[];       // last 10 paths
  topActions: string[];         // e.g. 'cockpit', 'calendar', 'inbox'
  sessionCount: number;
  lastSeen: string;
}

function loadHabits(uid: string): UserHabits {
  try {
    const raw = localStorage.getItem(HABIT_KEY(uid));
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { pagesVisited: [], topActions: [], sessionCount: 0, lastSeen: '' };
}

function saveHabit(uid: string, path: string) {
  const h = loadHabits(uid);
  h.pagesVisited = [path, ...h.pagesVisited.filter(p => p !== path)].slice(0, 10);
  h.lastSeen = new Date().toISOString();
  h.sessionCount += 1;
  localStorage.setItem(HABIT_KEY(uid), JSON.stringify(h));
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSupportPrompt(
  sector: string,
  plan: string,
  habits: UserHabits,
  bizName: string,
  currentPage: string,
): string {
  const habitSummary = habits.pagesVisited.length
    ? `Pages récemment visitées : ${habits.pagesVisited.slice(0, 5).join(', ')}.`
    : '';

  return `Tu es l'Assistant Support de Kompilot — expert SaaS dédié aux commerçants locaux.

CONTEXTE UTILISATEUR :
- Établissement : ${bizName || 'non renseigné'}
- Secteur : ${sector || 'commerce local'}
- Plan : ${plan || 'inconnu'}
- Page actuelle : ${currentPage}
- ${habitSummary}

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT sur Kompilot (fonctionnalités, paramétrage, stratégie digitale locale).
2. Réponses courtes et actionnables — maximum 120 mots.
3. Cite toujours le chemin exact dans l'app : "Allez dans Cockpit → Créer un post"
4. Si tu sens que la question dépasse tes compétences (technique avancé, facturation, bug bloquant), réponds EXACTEMENT ce format :
   REDIRECT_WHATSAPP: [résumé en 1 phrase de la question]
5. Utilise le vouvoiement professionnel.
6. Ne mentionne jamais OpenAI, GPT, IA, modèle, API.

Tu connais toutes les fonctionnalités Kompilot : Cockpit IA, Calendrier, Boîte de réception, Google Maps, Avis, Performance, ROAS, Visibilité IA (AIO), Email Marketing, Tunnels, Croissance, Agence.`;
}

// ── Message types ─────────────────────────────────────────────────────────────

interface Msg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  ts: Date;
  whatsappRedirect?: string;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function Dots() {
  return (
    <div className="flex gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
        />
      ))}
    </div>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';

  const renderText = (text: string) =>
    text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
      i % 2 === 1
        ? <strong key={i}>{p}</strong>
        : p.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))
    );

  if (msg.whatsappRedirect) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-foreground max-w-[85%] border border-border/50">
          {renderText(msg.text)}
        </div>
        <a
          href={WHATSAPP_URL(msg.whatsappRedirect)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <PhoneCall size={13} />
          Contacter le support WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Bot size={12} className="text-primary-foreground" />
        </div>
      )}
      <div className={cn(
        'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
        isUser
          ? 'bg-foreground text-background rounded-tr-sm'
          : 'bg-muted text-foreground rounded-tl-sm border border-border/50',
      )}>
        {renderText(msg.text)}
        <p className={cn('text-[10px] mt-0.5', isUser ? 'text-background/50 text-right' : 'text-muted-foreground')}>
          {msg.ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Quick suggestions ─────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'Comment créer un post IA ?',
  'Comment programmer une publication ?',
  'Comment répondre aux avis Google ?',
  'Comment améliorer mon score AIO ?',
  'Comment lancer une campagne email ?',
];

// ── Main widget ────────────────────────────────────────────────────────────────

export function SupportChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const { activeEstablishment } = useEstablishment();
  const profile = useOnboardingProfile();
  const { currentPlan } = useSubscription();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uid = user?.id ?? 'anon';
  const currentPath = location.pathname;
  const bizName = activeEstablishment?.name ?? '';
  const sector = profile?.sector ?? '';
  const plan = currentPlan?.name ?? '';

  // Track page visits for habit analysis
  useEffect(() => {
    if (user?.id) saveHabit(user.id, currentPath);
  }, [currentPath, user?.id]);

  // Welcome message on first open
  useEffect(() => {
    if (open && msgs.length === 0) {
      const name = user?.displayName?.split(' ')[0] ?? '';
      setMsgs([{
        id: 'welcome',
        role: 'assistant',
        text: `Bonjour${name ? ` ${name}` : ''} 👋\n\nJe suis votre assistant Kompilot. Je connais votre compte et vos habitudes d'utilisation pour mieux vous accompagner.\n\nQue puis-je faire pour vous ?`,
        ts: new Date(),
      }]);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || typing) return;

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: new Date() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setShowSuggestions(false);
    setTyping(true);

    // Check for obviously technical question before calling AI
    const isTech = isTechnicalQuestion(text);

    try {
      const habits = loadHabits(uid);
      const systemPrompt = buildSupportPrompt(sector, plan, habits, bizName, currentPath);

      const history = msgs
        .filter(m => m.role !== 'system' && m.id !== 'welcome')
        .slice(-8)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));

      let fullText = '';
      const aiId = (Date.now() + 1).toString();

      await blink.ai.streamText(
        {
          messages: [
            { role: 'user', content: systemPrompt },
            ...history,
            { role: 'user', content: text.trim() },
          ],
          maxTokens: 200,
          model: 'gpt-4.1-mini',
        },
        (chunk) => {
          fullText += chunk;
          setMsgs(prev => {
            const existing = prev.find(m => m.id === aiId);
            if (existing) {
              return prev.map(m => m.id === aiId ? { ...m, text: fullText } : m);
            }
            return [...prev, { id: aiId, role: 'assistant', text: fullText, ts: new Date() }];
          });
        },
      );

      // Check if AI decided to redirect
      const redirectMatch = fullText.match(/REDIRECT_WHATSAPP:\s*(.+)/i);
      const shouldRedirect = isTech || !!redirectMatch;
      const redirectSummary = redirectMatch?.[1]?.trim() ?? text;

      if (shouldRedirect) {
        const cleanText = fullText.replace(/REDIRECT_WHATSAPP:.*$/im, '').trim() ||
          'Cette question nécessite une assistance technique personnalisée de notre équipe.';

        setMsgs(prev => prev.map(m => m.id === aiId
          ? { ...m, text: cleanText, whatsappRedirect: redirectSummary }
          : m
        ));
      }

      if (!open) setUnread(u => u + 1);
    } catch (e) {
      setMsgs(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: 'Une erreur est survenue. Réessayez ou contactez-nous sur WhatsApp.',
        ts: new Date(),
        whatsappRedirect: text,
      }]);
    } finally {
      setTyping(false);
    }
  }, [msgs, typing, uid, sector, plan, bizName, currentPath, open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Don't render if not authenticated
  if (!user) return null;

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
        {!open && unread > 0 && (
          <div className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
            {unread} nouveau{unread > 1 ? 'x' : ''}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300',
            open
              ? 'bg-foreground text-background rotate-0'
              : 'bg-primary text-primary-foreground hover:scale-110',
          )}
          aria-label="Support chat"
        >
          {open ? <X size={22} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {open && (
        <div className={cn(
          'fixed bottom-24 right-5 z-[60] w-80 sm:w-96',
          'bg-card border border-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-300',
        )}
          style={{ maxHeight: '70vh', height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-primary/5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground leading-tight">Assistant Kompilot</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">IA active · Support 24h/7j</span>
              </div>
            </div>
            <a
              href={WHATSAPP_URL('Bonjour, j\'ai besoin d\'aide avec Kompilot.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold text-[#25D366] hover:underline shrink-0"
              title="Support WhatsApp"
            >
              <PhoneCall size={11} />
              WhatsApp
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
            {msgs.map(msg => <Bubble key={msg.id} msg={msg} />)}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 border border-border/50">
                  <Dots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {showSuggestions && msgs.length <= 1 && (
            <div className="px-3 pb-2 shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles size={10} /> Questions fréquentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.slice(0, 3).map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[11px] px-2.5 py-1.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-medium leading-tight"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border bg-background">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Votre question…"
                disabled={typing}
                className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {typing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Question technique ? → <a href={WHATSAPP_URL('Bonjour, besoin d\'aide technique.')} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold hover:underline">WhatsApp support</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
