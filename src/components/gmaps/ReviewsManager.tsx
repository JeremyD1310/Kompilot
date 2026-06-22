/**
 * ReviewsManager — Enhanced Google Reviews panel with filtering, sorting,
 * AI reply templates, sentiment analysis, and response rate tracking.
 */
import { useState, useMemo, useRef } from 'react';
import { toast } from '@blinkdotnew/ui';
import {
  Star, RefreshCw, Sparkles, CheckCircle2, MessageSquare,
  ThumbsUp, ThumbsDown, Filter, SortAsc, Clock,
  TrendingUp, BarChart2, AlertTriangle, ChevronDown, ChevronUp,
  Copy, Send,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import {
  checkReviewMilestones,
  incrementAIReplyCount,
} from '../../lib/reviewMilestones';
import { useMilestoneEmail } from '../../hooks/useMilestoneEmail';

// ── Types ────────────────────────────────────────────────────────────────────

type Sentiment = 'positive' | 'neutral' | 'negative';

interface Review {
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  daysAgo: number;
  text: string;
  sentiment: Sentiment;
  topics: string[];
  replied: boolean;
  reply?: string;
  repliedAt?: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', author: 'Marie Lefebvre', initials: 'ML', rating: 5, date: 'Il y a 2 jours', daysAgo: 2,  text: 'Excellent service ! L\'équipe est très professionnelle et à l\'écoute. Je recommande vivement à tous mes proches.', sentiment: 'positive', topics: ['service', 'équipe', 'professionnel'], replied: false },
  { id: 'r2', author: 'Thomas Dupont',  initials: 'TD', rating: 4, date: 'Il y a 1 semaine', daysAgo: 7, text: 'Très bonne expérience, rapport qualité/prix excellent. Je reviendrai sans hésiter.', sentiment: 'positive', topics: ['prix', 'qualité'], replied: true, reply: 'Merci Thomas pour votre fidélité ! À très bientôt 😊', repliedAt: 'Il y a 5 jours' },
  { id: 'r3', author: 'Sophie Martin',  initials: 'SM', rating: 5, date: 'Il y a 2 semaines', daysAgo: 14, text: 'Je suis ravie de mon passage. Ambiance agréable, prestations de qualité. Je recommande !', sentiment: 'positive', topics: ['ambiance', 'prestations'], replied: false },
  { id: 'r4', author: 'Jean-Pierre Bouchard', initials: 'JB', rating: 3, date: 'Il y a 1 mois', daysAgo: 30, text: 'Correct mais le temps d\'attente était un peu long. Résultat satisfaisant néanmoins.', sentiment: 'neutral', topics: ['attente', 'résultat'], replied: false },
  { id: 'r5', author: 'Camille Moreau', initials: 'CM', rating: 2, date: 'Il y a 1 mois', daysAgo: 32, text: 'Déçue par ma visite. L\'accueil était froid et le résultat pas à la hauteur de mes attentes. Je ne reviendrai pas.', sentiment: 'negative', topics: ['accueil', 'résultat', 'déception'], replied: false },
  { id: 'r6', author: 'Nicolas Lambert', initials: 'NL', rating: 5, date: 'Il y a 2 mois', daysAgo: 60, text: 'Super endroit, je viens régulièrement et c\'est toujours aussi bien. L\'équipe est adorable.', sentiment: 'positive', topics: ['fidélité', 'équipe'], replied: true, reply: 'Merci Nicolas ! Nous sommes ravis de vous compter parmi nos fidèles clients 🙏', repliedAt: 'Il y a 2 mois' },
  { id: 'r7', author: 'Amélie Petit',   initials: 'AP', rating: 4, date: 'Il y a 2 mois', daysAgo: 65, text: 'Très satisfaite ! Personnel sympa et compétent. Petite attente à l\'arrivée mais ça vaut le coup.', sentiment: 'positive', topics: ['personnel', 'attente'], replied: false },
];

// ── Reply Templates ──────────────────────────────────────────────────────────

const REPLY_TEMPLATES: Record<Sentiment, { tone: string; template: string }[]> = {
  positive: [
    { tone: '😊 Chaleureux',    template: 'Merci infiniment pour ce retour si positif ! 😊 Nous sommes ravis d\'avoir pu vous satisfaire. Toute l\'équipe se joint à moi pour vous remercier. À très bientôt !' },
    { tone: '🏆 Professionnel', template: 'Nous vous remercions chaleureusement pour ce témoignage. Votre satisfaction est notre priorité et nous mettons tout en œuvre pour maintenir ce niveau de qualité. Au plaisir de vous accueillir de nouveau.' },
    { tone: '🌟 Enthousiaste',  template: 'Quel plaisir de lire votre avis ! 🌟 C\'est grâce à des clients comme vous que nous nous surpassons chaque jour. Merci mille fois et à très vite !' },
  ],
  neutral: [
    { tone: '🤝 Constructif',   template: 'Merci pour votre retour équilibré. Nous prenons note de vos observations pour continuer à nous améliorer. N\'hésitez pas à nous contacter si vous souhaitez partager plus de détails.' },
    { tone: '💪 Amélioratif',   template: 'Merci pour votre visite et votre honnêteté. Nous travaillons continuellement à l\'amélioration de votre expérience. Nous espérons vous revoir bientôt et vous offrir une prestation encore meilleure.' },
  ],
  negative: [
    { tone: '🙏 Empathique',    template: 'Nous sommes sincèrement désolés que votre expérience n\'ait pas été à la hauteur de vos attentes. Votre retour est précieux et nous allons immédiatement travailler sur ces points. Pourriez-vous nous contacter en direct pour que nous puissions rectifier la situation ?' },
    { tone: '📞 Action',        template: 'Nous prenons très au sérieux votre commentaire et nous en sommes désolés. Nous vous invitons à nous contacter directement afin de comprendre ce qui s\'est passé et vous proposer une solution. Votre satisfaction nous tient à cœur.' },
  ],
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const config = {
    positive: { label: 'Positif',  className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50', icon: <ThumbsUp size={9} /> },
    neutral:  { label: 'Neutre',   className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',       icon: <BarChart2 size={9} /> },
    negative: { label: 'Négatif',  className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',                 icon: <ThumbsDown size={9} /> },
  }[sentiment];

  return (
    <span className={`flex items-center gap-1 text-[9px] font-bold rounded-full border px-2 py-0.5 ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function TopicChip({ topic }: { topic: string }) {
  return (
    <span className="text-[9px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5 capitalize">
      #{topic}
    </span>
  );
}

// ── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, onReply }: {
  review: Review;
  onReply: (id: string, text: string, wasAI: boolean) => void;
}) {
  const [expanded, setExpanded]       = useState(false);
  const [draft, setDraft]             = useState('');
  const [generating, setGenerating]   = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  // Track whether the current draft was AI-generated
  const draftWasAIRef = useRef(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1100));
    const templates = REPLY_TEMPLATES[review.sentiment];
    const chosen = templates[Math.floor(Math.random() * templates.length)];
    setDraft(chosen.template);
    draftWasAIRef.current = true;
    setGenerating(false);
    toast.success('Réponse générée ✨');
  };

  const handleCopyTemplate = (template: string) => {
    setDraft(template);
    draftWasAIRef.current = false; // manual template copy
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onReply(review.id, draft, draftWasAIRef.current);
    draftWasAIRef.current = false;
    setDraft('');
    setExpanded(false);
  };

  const needsAttention = !review.replied && review.daysAgo <= 7;

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${needsAttention ? 'border-amber-300 dark:border-amber-700/50' : 'border-border'}`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
            review.sentiment === 'positive' ? 'bg-gradient-to-br from-emerald-500 to-teal-400'
            : review.sentiment === 'negative' ? 'bg-gradient-to-br from-red-500 to-rose-400'
            : 'bg-gradient-to-br from-amber-500 to-orange-400'
          }`}>
            {review.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">{review.author}</p>
              <StarRating value={review.rating} />
              <SentimentBadge sentiment={review.sentiment} />
              {needsAttention && (
                <span className="flex items-center gap-1 text-[9px] font-extrabold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 rounded-full px-2 py-0.5">
                  <AlertTriangle size={9} /> Urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{review.date}</span>
              {review.replied && review.repliedAt && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Répondu {review.repliedAt}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground/80 mt-2.5 leading-relaxed">{review.text}</p>

        {/* Topics */}
        {review.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {review.topics.map(t => <TopicChip key={t} topic={t} />)}
          </div>
        )}
      </div>

      {/* Existing reply */}
      {review.replied && review.reply && (
        <div className="mx-4 mb-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
          <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1.5">
            <MessageSquare size={10} /> Votre réponse :
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">{review.reply}</p>
        </div>
      )}

      {/* Reply area */}
      {!review.replied && (
        <div className="border-t border-border">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <MessageSquare size={12} /> Répondre à cet avis
            </button>
          ) : (
            <div className="p-4 space-y-3">
              {/* Template picker */}
              <div>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
                >
                  {showTemplates ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Modèles de réponse rapide
                </button>
                {showTemplates && (
                  <div className="space-y-1.5 mb-3 p-3 bg-muted/40 rounded-xl">
                    {REPLY_TEMPLATES[review.sentiment].map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => handleCopyTemplate(tpl.template)}
                        className="w-full text-left p-2.5 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-foreground">{tpl.tone}</span>
                          <Copy size={9} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{tpl.template}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Rédigez votre réponse…"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
                >
                  {generating ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {generating ? 'Génération…' : 'Répondre avec IA ✨'}
                </button>
                {draft && (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Send size={11} /> Publier sur Google
                  </button>
                )}
                <button
                  onClick={() => { setExpanded(false); setDraft(''); setShowTemplates(false); }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type FilterRating = 'all' | '5' | '4' | '3' | '2' | '1';
type FilterStatus = 'all' | 'pending' | 'replied';
type SortOption  = 'recent' | 'rating_asc' | 'rating_desc' | 'urgent';

export function ReviewsManager() {
  const [reviews, setReviews]     = useState<Review[]>(MOCK_REVIEWS);
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy]       = useState<SortOption>('recent');
  const { push } = useNotifications();
  const { sendMilestoneEmail } = useMilestoneEmail();

  const handleReply = (id: string, text: string, wasAI: boolean) => {
    setReviews(prev => {
      const updated = prev.map(r =>
        r.id === id ? { ...r, replied: true, reply: text, repliedAt: "À l'instant" } : r,
      );
      const repliedCount = updated.filter(r => r.replied).length;
      const avgRating    = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
      if (wasAI) incrementAIReplyCount();

      const milestones = checkReviewMilestones({
        totalReviews: updated.length,
        repliedCount,
        avgRating,
        wasAIGenerated: wasAI,
      });

      if (milestones.length > 0) {
        // Slight delay so in-app toasts don't all collide simultaneously
        setTimeout(() => {
          milestones.forEach(m => {
            // 1. In-app notification toast
            push({
              id: `milestone_${m.id}`,
              category: m.category,
              emoji: m.emoji,
              title: m.title,
              body: m.body,
              actionLabel: m.actionLabel,
              actionHref: m.actionHref,
            });

            // 2. Email notification — fire-and-forget, never blocks the UI
            sendMilestoneEmail({ milestone: m }).catch(() => {
              // Already handled inside the hook — swallow here
            });
          });
        }, 600);
      }

      return updated;
    });
    toast.success(wasAI ? 'Réponse IA publiée sur Google Maps ! ✨' : 'Réponse publiée sur Google Maps !');
  };

  // Stats
  const avgRating     = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const replyRate     = Math.round((reviews.filter(r => r.replied).length / reviews.length) * 100);
  const pendingCount  = reviews.filter(r => !r.replied).length;
  const urgentCount   = reviews.filter(r => !r.replied && r.daysAgo <= 7).length;
  const sentimentPos  = reviews.filter(r => r.sentiment === 'positive').length;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...reviews];
    if (filterRating !== 'all') list = list.filter(r => r.rating === parseInt(filterRating));
    if (filterStatus === 'pending') list = list.filter(r => !r.replied);
    if (filterStatus === 'replied') list = list.filter(r => r.replied);
    if (sortBy === 'recent')       list.sort((a, b) => a.daysAgo - b.daysAgo);
    if (sortBy === 'rating_asc')   list.sort((a, b) => a.rating - b.rating);
    if (sortBy === 'rating_desc')  list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'urgent')       list.sort((a, b) => (a.replied ? 1 : 0) - (b.replied ? 1 : 0) || a.daysAgo - b.daysAgo);
    return list;
  }, [reviews, filterRating, filterStatus, sortBy]);

  return (
    <div className="space-y-5">
      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Note moyenne',    value: avgRating.toFixed(1), sub: `${reviews.length} avis`,           color: 'text-amber-500', icon: <Star size={14} className="fill-amber-400 text-amber-400" /> },
          { label: 'Taux de réponse', value: `${replyRate}%`,      sub: `${reviews.filter(r=>r.replied).length}/${reviews.length} répondus`, color: 'text-emerald-600', icon: <MessageSquare size={14} /> },
          { label: 'En attente',      value: pendingCount.toString(), sub: `${urgentCount} urgents (< 7j)`, color: pendingCount > 0 ? 'text-amber-600' : 'text-muted-foreground', icon: <Clock size={14} /> },
          { label: 'Avis positifs',   value: `${Math.round((sentimentPos/reviews.length)*100)}%`,  sub: `${sentimentPos}/${reviews.length}`, color: 'text-teal-600', icon: <TrendingUp size={14} /> },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">{k.icon}<span className="text-[10px] font-bold uppercase tracking-wide">{k.label}</span></div>
            <p className={`text-2xl font-extrabold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><BarChart2 size={13} /> Répartition des notes</p>
        <div className="space-y-1.5">
          {[5,4,3,2,1].map(n => {
            const count = reviews.filter(r => r.rating === n).length;
            const pct   = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <button
                key={n}
                onClick={() => setFilterRating(prev => prev === String(n) as FilterRating ? 'all' : String(n) as FilterRating)}
                className={`flex items-center gap-2 w-full rounded-lg px-2 py-1 transition-colors ${filterRating === String(n) ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <span className="text-[11px] text-muted-foreground w-3 text-right">{n}</span>
                <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters + sort bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Filter size={12} /> Filtrer :
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'pending', 'replied'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[10px] font-bold rounded-lg px-2.5 py-1.5 border transition-all ${filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
            >
              {{ all: 'Tous', pending: `Sans réponse (${pendingCount})`, replied: 'Répondus' }[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-auto">
          <SortAsc size={12} /> Trier :
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="text-[10px] font-semibold border border-border bg-card text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="recent">Plus récents</option>
          <option value="urgent">Urgents d'abord</option>
          <option value="rating_desc">Meilleures notes</option>
          <option value="rating_asc">Notes croissantes</option>
        </select>
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun avis correspondant aux filtres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <ReviewCard key={review.id} review={review} onReply={handleReply} />
          ))}
        </div>
      )}

      {/* Best practices tip */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-4 py-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          💡 <strong>Conseil :</strong> Répondre aux avis dans les <strong>7 jours</strong> améliore votre positionnement Google et la confiance des clients potentiels. Les établissements qui répondent à +80% de leurs avis reçoivent <strong>+35% de clics</strong>.
        </p>
      </div>
    </div>
  );
}
