/**
 * EngagementBot — Configuration de l'agent IA de réponse automatique
 * Scanne les commentaires/DMs et répond en < 5 minutes
 * avec le dictionnaire lexical du secteur + question ouverte finale.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, Clock, Check, RefreshCw, Zap, ChevronRight } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { aiGenerate } from '@/lib/aiRouterClient';
import { useEstablishment } from '@/context/EstablishmentContext';
import { useUserProfile } from '@/context/UserProfileContext';

interface BotConfig {
  tone: 'professionnel' | 'chaleureux' | 'expert';
  replyDelay: 1 | 3 | 5;
  channels: ('comments' | 'dms')[];
  autoEnabled: boolean;
}

const TONE_CONFIG = {
  professionnel: { label: 'Professionnel',  desc: 'Formel et rassurant',       emoji: '👔' },
  chaleureux:    { label: 'Chaleureux',      desc: 'Proche et communautaire',   emoji: '😊' },
  expert:        { label: 'Expert',          desc: 'Autorité et technique',     emoji: '🎯' },
};

const DEMO_COMMENTS = [
  { id: 'c1', author: '@marie_leblanc', text: 'C\'est encore ouvert ce soir ? 😍', platform: 'instagram', time: '2 min' },
  { id: 'c2', author: '@thomas_b',      text: 'Vous faites des devis gratuits ?',  platform: 'facebook', time: '5 min' },
  { id: 'c3', author: '@julie_paris',   text: 'Super travail ! Quels délais ?',    platform: 'instagram', time: '12 min' },
];

export function EngagementBotTab() {
  const { activeEstablishment } = useEstablishment();
  const { masterProfile } = useUserProfile();

  const [config, setConfig] = useState<BotConfig>({
    tone: 'chaleureux',
    replyDelay: 3,
    channels: ['comments', 'dms'],
    autoEnabled: true,
  });

  const [previewComment, setPreviewComment] = useState(DEMO_COMMENTS[0]);
  const [previewReply,   setPreviewReply]   = useState('');
  const [generating,     setGenerating]     = useState(false);
  const [showSim,        setShowSim]        = useState(false);

  const sectorLabel: Record<string, string> = {
    flux:         'commerce / restauration',
    chantier:     'artisan / bâtiment',
    produits:     'boutique locale',
    services_b2b: 'service B2B',
    agence:       'agence marketing',
  };

  const generatePreview = async () => {
    setGenerating(true);
    setPreviewReply('');
    try {
      const res = await aiGenerate({
        taskType: 'QUICK_REPLY',
        prompt: `Tu gères les réseaux sociaux de "${activeEstablishment.name}", un(e) ${sectorLabel[masterProfile ?? 'flux'] ?? 'commerce local'}.
Un abonné vient de commenter : "${previewComment.text}"
Réponds en ${TONE_CONFIG[config.tone].label.toLowerCase()} (max 80 mots), utilise un ton ${config.tone}, termine TOUJOURS par une question ouverte courte pour relancer la conversation.
Réponse directe, pas de préambule.`,
        maxTokens: 150,
      });
      setPreviewReply(res.content);
    } catch {
      toast.error('Erreur IA — réessayez');
    } finally {
      setGenerating(false);
    }
  };

  const toggleChannel = (ch: 'comments' | 'dms') => {
    setConfig(p => ({
      ...p,
      channels: p.channels.includes(ch)
        ? p.channels.filter(c => c !== ch)
        : [...p.channels, ch],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.autoEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Bot {config.autoEnabled ? 'actif' : 'en pause'}
          </span>
        </div>
        <button
          onClick={() => setConfig(p => ({ ...p, autoEnabled: !p.autoEnabled }))}
          className={`relative w-11 h-6 rounded-full transition-all ${config.autoEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${config.autoEnabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      {/* Config */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ton de réponse</label>
          <div className="space-y-1.5">
            {(Object.entries(TONE_CONFIG) as [BotConfig['tone'], typeof TONE_CONFIG[BotConfig['tone']]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setConfig(p => ({ ...p, tone: key }))}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                  config.tone === key
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                }`}
              >
                <span>{cfg.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{cfg.label}</p>
                  <p className="text-[10px] text-slate-500">{cfg.desc}</p>
                </div>
                {config.tone === key && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Delay + channels */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Délai de réponse max
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 3, 5] as BotConfig['replyDelay'][]).map(d => (
                <button
                  key={d}
                  onClick={() => setConfig(p => ({ ...p, replyDelay: d }))}
                  className={`py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                    config.replyDelay === d
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Canaux surveillés</label>
            <div className="flex gap-2">
              {(['comments', 'dms'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    config.channels.includes(ch)
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {ch === 'comments' ? 'Commentaires' : 'DMs'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              ⚡ Quota Meta : max 200 réponses auto / jour par compte Instagram Business
            </p>
          </div>
        </div>
      </div>

      {/* Live preview simulator */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setShowSim(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Simuler une réponse IA</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showSim ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showSim && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Pick comment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Commentaire à simuler
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {DEMO_COMMENTS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setPreviewComment(c); setPreviewReply(''); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                          previewComment.id === c.id
                            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {c.author[1].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{c.author}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{c.text}</p>
                        </div>
                        <Badge className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none text-slate-500">{c.time}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate */}
                <Button
                  onClick={generatePreview}
                  disabled={generating}
                  size="sm"
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white gap-2"
                >
                  {generating
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Génération IA en cours…</>
                    : <><Zap className="w-3.5 h-3.5" /> Générer la réponse</>}
                </Button>

                {previewReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Réponse bot — envoyée en {config.replyDelay} min max</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{previewReply}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
