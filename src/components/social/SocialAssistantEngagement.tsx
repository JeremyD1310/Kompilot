/**
 * SocialAssistantEngagement — Modération & engagement post-publication.
 *
 * Features:
 * - AI generates plausible comments + suggested replies to prepare the user
 * - Platform-by-platform response-time urgency (algo boost window)
 * - Conversation starters / call-to-action suggestions
 * - "Ghost reply" simulator — prévisualisez la conversation
 */

import { useState, useCallback } from 'react';
import {
  MessageCircle, Clock, Zap, AlertTriangle, Brain, ThumbsUp,
  Sparkles, RefreshCw, Reply, Send, Timer, Shield, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Textarea, Badge } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';
import { toast } from '@blinkdotnew/ui';

// ── Platform response urgency config ────────────────────────────────────

interface PlatformUrgency {
  id: string;
  label: string;
  icon: string;
  color: string;
  goldenWindow: string;    // best reply window
  decayAfter: string;       // when engagement decays
  algoImpact: string;       // what the algorithm rewards
  tip: string;
}

const RESPONSE_URGENCY: PlatformUrgency[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    goldenWindow: '30 minutes',
    decayAfter: '2 heures',
    algoImpact: '+40% de portée si réponse < 30 min',
    tip: 'Instagram priorise les posts avec des conversations actives dans l\'heure suivant la publication. Chaque réponse ajoutée dans les 30 premières minutes peut augmenter la portée organique de 15 à 40%.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    goldenWindow: '1 heure',
    decayAfter: '4 heures',
    algoImpact: '+25% reach avec engagement rapide',
    tip: 'L\'algorithme Facebook valorise les échanges authentiques. Répondre dans la première heure signale un contenu de qualité et déclenche une diffusion élargie dans le fil d\'actualité.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    goldenWindow: '2 heures',
    decayAfter: '8 heures',
    algoImpact: 'Top-of-feed si +10 commentaires en 2h',
    tip: 'LinkedIn récompense la densité de conversation. Un post avec plus de 10 commentaires dans les 2 premières heures est quasi garanti d\'apparaître en top de feed. Posez une question ouverte pour déclencher les réponses.',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    color: '#69C9D0',
    goldenWindow: '15 minutes',
    decayAfter: '1 heure',
    algoImpact: 'Boost viral si engagement immédiat',
    tip: 'TikTok mesure le taux de complétion + engagement dans les 15 premières minutes. Répondre aux commentaires rapidement crée un "signal de viralité" qui pousse la vidéo sur la For You Page.',
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    goldenWindow: '10 minutes',
    decayAfter: '1 heure',
    algoImpact: 'Visibilité x3 si conversation active',
    tip: 'X valorise la vélocité. Un fil de conversation actif dans les 10 premières minutes multiplie la visibilité par 3. Likez et répondez à chaque commentaire immédiatement.',
  },
];

// ── AI reply generation ────────────────────────────────────────────────

interface SimulatedComment {
  author: string;
  avatar: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'question' | 'negative';
}

interface ReplySuggestion {
  commentId: number;
  reply: string;
  tone: string;
}

const REPLY_SYSTEM_PROMPT = `Tu es un community manager expert en stratégie d'engagement et gestion de crise. Ton rôle est d'anticiper les commentaires qu'un post pourrait recevoir (positifs, neutres, questions ET négatifs) et de préparer des réponses parfaites — y compris pour désamorcer les tensions.

À partir du texte du post fourni, génère UNIQUEMENT un JSON valide avec ce format exact :
{
  "comments": [
    { "author": "Prénom", "avatar": "initiale", "text": "Commentaire plausible...", "sentiment": "positive|neutral|question|negative" }
  ],
  "replies": [
    { "commentId": 0, "reply": "Réponse suggérée...", "tone": "Chaleureux / Professionnel / Humoristique / Apaisant" }
  ],
  "conversationStarters": [
    "Question ouverte 1 pour relancer la conversation",
    "Question ouverte 2"
  ],
  "pinnedReply": "Réponse épinglée suggérée (optionnelle)"
}

RÈGLES :
- 4-5 commentaires simulés, dont AU MOINS 1 commentaire négatif ou critique
- Les réponses aux commentaires négatifs doivent être empathiques, constructives et orientées solution
- Le ton pour les commentaires négatifs doit être "Apaisant" — ne jamais être défensif
- Les réponses doivent être authentiques, pas robotiques
- Les "conversation starters" doivent être des questions ouvertes qui invitent à l'échange
- Adapte le ton au contexte du post (pro, décontracté, inspirant...)
- En français`;

function generateSystemPrompt(postText: string): string {
  return REPLY_SYSTEM_PROMPT;
}

// ── Urgency card ────────────────────────────────────────────────────────

function UrgencyCard({ p }: { p: PlatformUrgency }) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: p.color }} />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{p.icon}</span>
          <span className="text-sm font-bold">{p.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/40 rounded-lg p-2.5 text-center">
            <Clock size={12} className="text-amber-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Fenêtre dorée</p>
            <p className="text-xs font-bold">{p.goldenWindow}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 text-center">
            <AlertTriangle size={12} className="text-rose-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Décrochage après</p>
            <p className="text-xs font-bold">{p.decayAfter}</p>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Impact algorithme</span>
          </div>
          <p className="text-[11px] font-semibold text-emerald-700">{p.algoImpact}</p>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">{p.tip}</p>
      </CardContent>
    </Card>
  );
}

// ── Mock comment bubble ─────────────────────────────────────────────────

function CommentBubble({
  comment, reply, isSelected, onSelect,
}: {
  comment: SimulatedComment;
  reply?: ReplySuggestion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sentimentColors: Record<string, string> = {
    positive: 'bg-emerald-500/10 border-emerald-500/20',
    neutral: 'bg-muted/40 border-border',
    question: 'bg-amber-500/10 border-amber-500/20',
    negative: 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="space-y-2">
      {/* Original comment */}
      <div
        onClick={onSelect}
        className={`rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm ${
          sentimentColors[comment.sentiment]
        } ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {comment.avatar}
          </div>
          <span className="text-[11px] font-semibold">{comment.author}</span>
          <Badge variant="outline" className="text-[8px] ml-auto">
            {comment.sentiment === 'positive' ? '😊 Positif' : comment.sentiment === 'question' ? '❓ Question' : comment.sentiment === 'negative' ? '🚨 Critique' : '💬 Neutre'}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{comment.text}</p>
      </div>

      {/* AI suggested reply */}
      {isSelected && reply && (
        <div className="ml-4 rounded-xl border border-primary/20 bg-primary/3 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain size={11} className="text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
              Réponse suggérée · {reply.tone}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">{reply.reply}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(reply.reply);
                toast.success('Réponse copiée.');
              }}
              className="text-[9px] text-primary font-semibold hover:underline"
            >
              📋 Copier
            </button>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[9px] text-muted-foreground">Envoyez dans la fenêtre dorée ⏱️</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export function SocialAssistantEngagement() {
  const [postText, setPostText] = useState('');
  const [simulatedComments, setSimulatedComments] = useState<SimulatedComment[]>([]);
  const [suggestedReplies, setSuggestedReplies] = useState<ReplySuggestion[]>([]);
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [pinnedReply, setPinnedReply] = useState<string>('');
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSimulation = useCallback(async () => {
    if (!postText.trim()) {
      toast.error('Collez le texte de votre publication pour simuler les commentaires.');
      return;
    }
    setIsGenerating(true);
    try {
      const { text } = await blink.ai.generateText({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: generateSystemPrompt(postText) },
          { role: 'user', content: postText },
        ],
        maxTokens: 800,
      });
      const parsed = JSON.parse(text);
      setSimulatedComments(parsed.comments || []);
      setSuggestedReplies(parsed.replies || []);
      setConversationStarters(parsed.conversationStarters || []);
      setPinnedReply(parsed.pinnedReply || '');
      setSelectedCommentId(null);
      setHasGenerated(true);
      toast.success('Simulation générée. Sélectionnez un commentaire pour voir la réponse suggérée.');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la simulation.');
    } finally {
      setIsGenerating(false);
    }
  }, [postText]);

  return (
    <div className="space-y-6">
      {/* ── Header: why engagement matters ──────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold mb-1">L'engagement post-publication fait la différence</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les algorithmes de <strong>toutes</strong> les plateformes mesurent la vélocité des interactions
              dans les minutes qui suivent la publication. Une réponse rapide = un signal fort = une portée
              multipliée. Préparez vos réponses <strong>avant</strong> de publier pour ne pas perdre
              la fenêtre dorée.
            </p>
          </div>
        </div>
      </div>

      {/* ── Platform urgency grid ──────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Clock size={14} className="text-amber-500" />
          Fenêtre de réponse par plateforme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {RESPONSE_URGENCY.map(p => (
            <UrgencyCard key={p.id} p={p} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          💡 <strong>Astuce :</strong> Préparez vos réponses à l'avance dans le simulateur ci-dessous.
          Copiez-les dans un bloc-notes avant de publier pour les avoir sous la main.
        </p>
      </div>

      {/* ── Comment simulator ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain size={16} className="text-primary" />
            Simulateur de commentaires IA
          </CardTitle>
          <CardDescription>
            Collez votre publication, l'IA anticipe les commentaires et prépare vos réponses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post input */}
          <div>
            <Textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="Collez ici le texte exact de votre publication..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <Button
            onClick={generateSimulation}
            disabled={isGenerating || !postText.trim()}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Brain size={15} />
            )}
            {isGenerating ? 'Simulation en cours...' : 'Simuler les commentaires'}
          </Button>

          {/* Results */}
          {hasGenerated && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Simulated comments + replies */}
              {simulatedComments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    💬 Commentaires anticipés — cliquez pour voir la réponse IA
                  </h4>
                  <div className="space-y-3">
                    {simulatedComments.map((comment, i) => {
                      const reply = suggestedReplies.find(r => r.commentId === i);
                      return (
                        <CommentBubble
                          key={i}
                          comment={comment}
                          reply={reply}
                          isSelected={selectedCommentId === i}
                          onSelect={() => setSelectedCommentId(selectedCommentId === i ? null : i)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pinned reply */}
              {pinnedReply && (
                <div className="rounded-xl border border-primary/15 bg-primary/3 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp size={12} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      📌 Réponse épinglée suggérée
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{pinnedReply}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pinnedReply);
                      toast.success('Réponse épinglée copiée.');
                    }}
                    className="text-[9px] text-primary font-semibold hover:underline mt-2 inline-block"
                  >
                    📋 Copier
                  </button>
                </div>
              )}

              {/* Conversation starters */}
              {conversationStarters.length > 0 && (
                <div className="rounded-xl bg-muted/30 border border-border p-3.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageCircle size={11} />
                    Questions pour relancer la conversation
                  </h4>
                  <ul className="space-y-1.5">
                    {conversationStarters.map((starter, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight size={11} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-[11px] leading-relaxed">{starter}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Speed reminder */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Timer size={14} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  <strong>Ne tardez pas !</strong> Les 30 premières minutes après publication sont critiques.
                  Gardez ces réponses à portée de main et réagissez <strong>immédiatement</strong> quand
                  les commentaires arrivent. Chaque minute compte pour l'algorithme.
                </p>
              </div>

              {/* Crisis Shield — negative comment de-escalation */}
              {simulatedComments.some(c => c.sentiment === 'negative') && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                      <Shield size={14} className="text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">🛡️ Bouclier Anti-Crise</h4>
                      <p className="text-[9px] text-muted-foreground">Protocole de désamorçage pour commentaires négatifs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {[
                      { step: '1', label: 'Accuser réception', desc: '« Merci pour votre retour, nous prenons cela très au sérieux. »' },
                      { step: '2', label: 'Empathie sincère', desc: 'Reconnaissez l\'émotion sans être défensif. « Nous comprenons votre frustration. »' },
                      { step: '3', label: 'Solution concrète', desc: 'Proposez une action immédiate. « Notre équipe vous contacte en privé pour résoudre cela. »' },
                      { step: '4', label: 'Sortir du fil public', desc: 'Déplacez la conversation en DM/email. « Je vous ai envoyé un message privé. »' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <span className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center text-[10px] font-bold text-red-400 shrink-0">{s.step}</span>
                        <div>
                          <p className="text-[10px] font-bold text-foreground">{s.label}</p>
                          <p className="text-[9px] text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-red-400 mb-0.5">⚠️ Règles d'or en situation sensible</p>
                      <ul className="space-y-0.5">
                        <li className="text-[9px] text-muted-foreground">• Ne <strong>jamais</strong> supprimer un commentaire négatif (effet Streisand)</li>
                        <li className="text-[9px] text-muted-foreground">• Ne <strong>jamais</strong> répondre à chaud — prendre 5 minutes de recul</li>
                        <li className="text-[9px] text-muted-foreground">• Une réponse visible montre que vous êtes à l'écoute → transforme un détracteur en ambassadeur potentiel</li>
                        <li className="text-[9px] text-muted-foreground">• Si le volume est élevé : publiez un post global de transparence plutôt que 50 réponses individuelles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pro tips ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Timer,
            title: 'Règle des 30 minutes',
            desc: 'Sur Instagram et TikTok, les 30 premières minutes déterminent 70% de la portée totale. Soyez prêt à répondre.',
            color: 'text-rose-500',
          },
          {
            icon: Shield,
            title: 'Préparez 3 réponses types',
            desc: 'Ayez toujours sous la main : un remerciement chaleureux, une réponse à une question fréquente, et une relance conversationnelle.',
            color: 'text-primary',
          },
          {
            icon: Zap,
            title: 'Likez avant de répondre',
            desc: 'Sur chaque plateforme, liker un commentaire avant d\'y répondre double le taux de réponse du commentateur suivant.',
            color: 'text-amber-500',
          },
          {
            icon: AlertTriangle,
            title: 'Gérez les critiques avec calme',
            desc: 'Ne supprimez jamais un avis négatif. Répondez avec empathie, proposez une solution, et passez en message privé si nécessaire.',
            color: 'text-red-400',
          },
        ].map((tip, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <tip.icon size={18} className={`${tip.color} mb-2`} />
              <h4 className="text-xs font-bold mb-1">{tip.title}</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{tip.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
