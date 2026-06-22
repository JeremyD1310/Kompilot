/**
 * BulkCalendarResultView
 * Calendar grid showing all AI-generated draft posts for the month.
 * Supports: individual edit, validate all (Solo), push to network (Franchise).
 */
import { useState, useCallback } from 'react';
import { format, addDays, startOfMonth, getDaysInMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2, Edit3, Trash2, Sparkles, RefreshCw, Users,
  Check, X, ChevronLeft, ChevronRight, Zap,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import type { BulkCalendarConfig } from './BulkCalendarModal';
import type { ScheduledPost } from './CreatePostModal';

// ── Types ──────────────────────────────────────────────────────────────────────

type PostFormat = 'image' | 'carousel' | 'video_tiktok' | 'video_reel' | 'text';

interface BulkPost {
  id: string;
  date: string;         // yyyy-MM-dd
  text: string;
  channels: string[];
  theme: string;        // content pillar label
  themeColor: string;
  status: 'draft' | 'approved';
  format: PostFormat;
  photoTip?: string;
  hashtags?: string[];
}

interface Props {
  config: BulkCalendarConfig;
  onValidateAll: (posts: ScheduledPost[]) => void;
  onPushToNetwork: (posts: ScheduledPost[]) => void;
  onClose: () => void;
  isNetwork: boolean;   // franchise/reseau mode
}

// ── Format labels ──────────────────────────────────────────────────────────────

const FORMAT_LABEL: Record<PostFormat, { label: string; icon: string; color: string }> = {
  image:        { label: 'Image',                 icon: '🖼️',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  carousel:     { label: 'Carrousel Avant/Après', icon: '🔄',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  video_tiktok: { label: 'Script Vidéo TikTok',   icon: '🎬',  color: 'bg-black/10 text-black dark:bg-white/10 dark:text-white' },
  video_reel:   { label: 'Reel Instagram',         icon: '📹',  color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  text:         { label: 'Texte',                  icon: '✏️',  color: 'bg-muted text-muted-foreground' },
};

// ── AI content templates ───────────────────────────────────────────────────────

const T = (texts: string[], theme: string, color: string, channels: string[]) => ({ texts, theme, color, channels });

const CONTENT_TEMPLATES: Record<string, ReturnType<typeof T>[]> = {
  promo: [
    T(['🎁 Offre exceptionnelle ce mois-ci : {service} à -20%. Profitez-en avant la fin du mois !', '✨ Nos clients adorent {service} — et cette semaine, on vous offre une remise exclusive. Prenez RDV dès maintenant !'], 'Offre Promo', 'bg-orange-500', ['instagram', 'facebook']),
    T(['📸 Zoom sur notre prestation phare du mois — voici pourquoi nos clients en sont fans.', '💬 Témoignage client : "Ce service a transformé mon quotidien" — Découvrez leur expérience.'], 'Témoignage', 'bg-amber-500', ['linkedin', 'instagram']),
    T(['🗺️ Vous êtes à {ville} ? Venez découvrir {etablissement} — notre équipe vous accueille 7j/7.', '📍 Votre {activite} de confiance à {ville}. Réservez maintenant en ligne !'], 'Visibilité Locale', 'bg-teal-500', ['google', 'facebook']),
  ],
  notoriete: [
    T(['🌟 Nous sommes fiers d\'annoncer notre {anniversaire} ! Merci à tous nos clients fidèles.', '📖 L\'histoire de {etablissement} commence avec une passion simple : vous aider à briller localement.'], 'Storytelling', 'bg-violet-500', ['linkedin', 'instagram', 'facebook']),
    T(['👀 Derrière les coulisses : voici une journée type dans notre équipe. 🎥', '🤝 Notre engagement : une qualité irréprochable à chaque prestation. Voici comment on y parvient.'], 'Coulisses', 'bg-blue-500', ['instagram', 'tiktok']),
  ],
  engage: [
    T(['❓ Sondage : Quel est le critère n°1 qui vous fait choisir un prestataire local ?', '💡 Quiz du lundi : quel format de contenu performe le mieux sur Instagram cette semaine ?'], 'Interaction', 'bg-pink-500', ['instagram', 'facebook']),
    T(['🙋 On vous pose la question : qu\'attendez-vous d\'un partenaire comme nous ?', '📣 Partagez votre expérience ! Votre avis compte et aide d\'autres clients à nous découvrir.'], 'Communauté', 'bg-emerald-500', ['facebook', 'linkedin']),
  ],
};

// Emoji visual per channel
const CHANNEL_DOTS: Record<string, string> = {
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-500',
  linkedin: 'bg-blue-700',
  google: 'bg-orange-500',
  tiktok: 'bg-foreground',
  website: 'bg-primary',
};

// ── AI Helpers ──────────────────────────────────────────────────────────────────

const PHOTO_TIPS: Record<string, string> = {
  'Offre Promo':       '📸 Idée photo : Placez votre offre en texte blanc sur fond de votre couleur signature — contraste maximal.',
  'Témoignage':        '📸 Idée photo : Portrait souriant du client avec l\'établissement en arrière-plan flou (bokeh).',
  'Visibilité Locale': '📸 Idée photo : Vitrine de l\'établissement en heure dorée (lever/coucher de soleil).',
  'Storytelling':      '📸 Idée photo : Photo "avant/après" ou coulisses — authentique, pas trop retouchée.',
  'Coulisses':         '📸 Idée photo : L\'équipe en action, geste précis en gros plan, ambiance naturelle.',
  'Interaction':       '📸 Idée photo : Infographie simple ou sondage visuel sur fond coloré.',
  'Communauté':        '📸 Idée photo : Groupe de clients heureux ou screenshot d\'un avis 5 étoiles encadré.',
};

const DEFAULT_TIP = '📸 Idée photo : Cadrez votre prestation phare en gros plan avec une lumière naturelle latérale.';

function generatePhotoTip(theme: string): string {
  return PHOTO_TIPS[theme] ?? DEFAULT_TIP;
}

const HASHTAG_BASE: Record<string, string[]> = {
  'Offre Promo':       ['#promo', '#bonplan', '#offrespéciale', '#commerce', '#local'],
  'Témoignage':        ['#avisgoogle', '#clientsatisfait', '#avis5etoiles', '#qualité'],
  'Visibilité Locale': ['#commercelocal', '#madeinfrance', '#boutique', '#artisan', '#boostonlocal'],
  'Storytelling':      ['#histoirevraie', '#derrierelescoulisses', '#artisan', '#passion'],
  'Coulisses':         ['#backstage', '#coulisses', '#team', '#journéetype'],
  'Interaction':       ['#sondage', '#question', '#communauté', '#engagement'],
  'Communauté':        ['#merci', '#communauté', '#clientsfidèles', '#ensemble'],
};

const CHANNEL_HASHTAGS: Record<string, string[]> = {
  instagram:  ['#instafrance', '#instagood'],
  linkedin:   ['#b2b', '#business'],
  google:     ['#googlemaps', '#géolocalisation'],
  facebook:   ['#facebook', '#facebooklocal'],
};

function generateHashtags(theme: string, channels: string[]): string[] {
  const base = HASHTAG_BASE[theme] ?? ['#local', '#business', '#service'];
  const channelTags = channels.flatMap(ch => CHANNEL_HASHTAGS[ch] ?? []).slice(0, 2);
  return [...new Set([...base, ...channelTags])].slice(0, 8);
}

// ── Post generation logic ──────────────────────────────────────────────────────

function resolveFormat(channels: string[], idx: number): PostFormat {
  if (channels.includes('tiktok')) return 'video_tiktok';
  if (channels.includes('instagram') && idx % 3 === 2) return 'carousel';
  if ((channels.includes('instagram') || channels.includes('facebook')) && idx % 3 === 0) return 'image';
  return 'text';
}

function generateBulkPosts(config: BulkCalendarConfig): BulkPost[] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const daysInMonth = getDaysInMonth(now);

  const freqMap: Record<string, number> = { '2_week': 2, '3_week': 3, '5_week': 5, 'daily': 7 };
  const postsPerWeek = freqMap[config.frequency] ?? 3;

  const postDays: number[] = [];
  const stepDays = Math.round(7 / postsPerWeek);
  for (let day = 1; day <= daysInMonth; day += stepDays) {
    if (postDays.length < 30) postDays.push(day);
  }

  const objKey = ['promo', 'notoriete'].includes(config.objective) ? config.objective : 'engage';
  const templates = CONTENT_TEMPLATES[objKey] ?? CONTENT_TEMPLATES.engage;

  const TONE_TAGS: Record<string, string> = {
    warm: '😊', pro: '💼', casual: '🤙', inspiring: '✨', urgent: '⚡', storytelling: '📖',
  };
  const toneEmoji = TONE_TAGS[config.tone] ?? '✨';

  return postDays.map((day, idx) => {
    const tpl = templates[idx % templates.length];
    const textSrc = tpl.texts[idx % tpl.texts.length];
    const dateStr = format(addDays(monthStart, day - 1), 'yyyy-MM-dd');
    const channels = tpl.channels;

    const photoTip = generatePhotoTip(tpl.theme);
    const hashtags = generateHashtags(tpl.theme, channels);

    return {
      id: `bulk-${dateStr}-${idx}`,
      date: dateStr,
      text: `${toneEmoji} ${textSrc.replace('{etablissement}', 'votre établissement').replace('{ville}', 'votre ville').replace('{service}', 'notre prestation phare').replace('{activite}', 'prestataire').replace('{anniversaire}', '3ème anniversaire')}`,
      channels,
      theme: tpl.theme,
      themeColor: tpl.color,
      status: 'draft',
      format: resolveFormat(channels, idx),
      photoTip,
      hashtags,
    };
  });
}

// ── VideoScriptBlock ───────────────────────────────────────────────────────────

function VideoScriptBlock({ text, theme }: { text: string; theme: string }) {
  const [open, setOpen] = useState(false);
  const first = text.split(/[.!?]/)[0]?.trim();
  const steps = [
    { time: '0–3s',  label: 'Accroche visuelle',  desc: first ? `Montrez en gros plan : « ${first.slice(0, 55)}… »` : `Montrez votre ${theme} en gros plan` },
    { time: '3–7s',  label: 'Action / Highlight',  desc: 'Présentez votre prestation phare avec un geste confiant' },
    { time: '7–10s', label: 'CTA dicté ou écrit',   desc: /réserv|rdv/i.test(text) ? 'Réservez en ligne dès maintenant !' : 'Appelez-nous maintenant / Réservez en ligne !' },
  ];
  return (
    <div className="mt-2 rounded-xl border border-pink-200 dark:border-pink-800/40 bg-pink-50/50 dark:bg-pink-950/10 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 text-[10px] font-bold text-pink-700 dark:text-pink-300 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors">
        <span>🎬 Script Vidéo Flash en 3 étapes</span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0 text-[9px] font-extrabold bg-pink-200 dark:bg-pink-800/50 text-pink-800 dark:text-pink-200 rounded-full px-1.5 py-0.5 leading-tight mt-0.5">{s.time}</span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-foreground/70 uppercase tracking-wide leading-none mb-0.5">Étape {i + 1} — {s.label}</p>
                <p className="text-[10px] text-foreground leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
          <button onClick={() => toast.success('📱 Script envoyé sur votre WhatsApp !', { description: 'Vous allez recevoir vos instructions de tournage en 10 secondes.' })} className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-white font-bold text-[10px] px-3 py-1.5 hover:bg-[#1ebe5b] transition-colors">
            💬 Envoyer le script sur mon WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────

function PostCard({ post, onApprove, onReject, onEdit }: { post: BulkPost; onApprove: (id: string) => void; onReject: (id: string) => void; onEdit: (id: string) => void; }) {
  const [showPhotoTip, setShowPhotoTip] = useState(false);
  const dateLabel = format(new Date(post.date + 'T00:00'), 'd MMM', { locale: fr });
  const fmt = FORMAT_LABEL[post.format];
  const isVideo = post.format === 'video_tiktok' || post.format === 'video_reel';
  
  return (
    <div className={`relative rounded-xl border-2 p-3 space-y-2 transition-all ${post.status === 'approved' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border bg-card hover:border-primary/30'}`}>
      {/* Date + badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-extrabold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">{dateLabel}</span>
        <span className={`text-[9px] font-bold text-white rounded-full px-2 py-0.5 ${post.themeColor}`}>{post.theme}</span>
        <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${fmt.color}`}>{fmt.icon} {fmt.label}</span>
        {post.status === 'approved' && <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />}
      </div>
      
      <p className="text-xs text-foreground leading-relaxed line-clamp-3">{post.text}</p>
      
      {/* Photo Tip Collapsible */}
      {post.photoTip && (
        <div className="space-y-1">
          <button 
            onClick={() => setShowPhotoTip(!showPhotoTip)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <span>📸 Idée photo</span>
            {showPhotoTip ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showPhotoTip && (
            <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded-lg leading-snug animate-in fade-in slide-in-from-top-1 duration-200">
              {post.photoTip}
            </p>
          )}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-[9px] text-muted-foreground bg-muted/40 rounded-full px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {isVideo && <VideoScriptBlock text={post.text} theme={post.theme} />}
      
      <div className="flex items-center gap-1.5 flex-wrap">
        {post.channels.map(ch => <span key={ch} className={`w-2.5 h-2.5 rounded-full ${CHANNEL_DOTS[ch] ?? 'bg-muted'}`} title={ch} />)}
      </div>

      {post.status !== 'approved' && (
        <div className="flex items-center gap-1 pt-1 border-t border-border/50">
          <button onClick={() => onApprove(post.id)} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors"><Check size={10} /> Valider</button>
          <button onClick={() => onEdit(post.id)} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/40 border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors"><Edit3 size={10} /> Modifier</button>
          <button onClick={() => onReject(post.id)} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors p-1" title="Supprimer ce post"><Trash2 size={11} /></button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function BulkCalendarResultView({ config, onValidateAll, onPushToNetwork, onClose, isNetwork }: Props) {
  const [posts, setPosts] = useState<BulkPost[]>(() => generateBulkPosts(config));
  const [validating, setValidating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [page, setPage] = useState(0);
  const [googleCrosspost, setGoogleCrosspost] = useState(false);
  const PAGE_SIZE = 12;

  const approved = posts.filter(p => p.status === 'approved');
  const drafts = posts.filter(p => p.status === 'draft');
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const visiblePosts = posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleApprove = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
  }, []);

  const handleReject = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast('Post retiré du calendrier.');
  }, []);

  const handleEdit = useCallback((id: string) => {
    toast('Modification disponible dans le Cockpit IA ✏️');
  }, []);

  const toScheduledPost = (p: BulkPost): ScheduledPost => ({
    id: p.id, text: p.text, channels: p.channels, date: p.date, time: '10:00', status: 'approved',
  });

  const handleValidateAll = async () => {
    setValidating(true);
    await new Promise(r => setTimeout(r, 1400));
    setValidating(false);
    onValidateAll(posts.map(toScheduledPost));
    if (googleCrosspost) {
      toast.success('🗺️ Posts Google Business générés !', {
        description: 'Vos publications nourrissent en direct votre référencement Google Maps et ChatGPT/Gemini.',
      });
    }
    toast.success(`🚀 ${posts.length} posts planifiés sur le calendrier !`, {
      description: 'Votre calendrier de 30 jours est prêt.',
    });
    onClose();
  };

  const handlePushNetwork = async () => {
    setPushing(true);
    await new Promise(r => setTimeout(r, 1800));
    setPushing(false);
    onPushToNetwork(posts.map(toScheduledPost));
    toast.success(`🏢 ${posts.length} brouillons envoyés aux ${3} établissements du réseau !`, {
      description: 'Chaque responsable peut maintenant valider sa version.',
    });
    onClose();
  };

  const objLabel = {
    promo: '🎁 Promo', recruit: '🧑‍💼 Recrutement', notoriete: '🌟 Notoriété',
    engagement: '💬 Engagement', evenement: '📅 Événement', saisonnier: '🌸 Saisonnier',
  }[config.objective] ?? config.objective;

  const toneLabel = {
    warm: '😊 Chaleureux', pro: '💼 Professionnel', casual: '🤙 Décontracté',
    inspiring: '✨ Inspirant', urgent: '⚡ Urgent', storytelling: '📖 Storytelling',
  }[config.tone] ?? config.tone;

  const freqLabel = {
    '2_week': '2/sem.', '3_week': '3/sem.', '5_week': '5/sem.', 'daily': 'Quotidien',
  }[config.frequency] ?? config.frequency;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border bg-card shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-foreground text-sm leading-tight">Calendrier Mensuel Généré ✨</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-[10px] font-bold bg-muted/60 rounded-full px-2 py-0.5">{objLabel}</span>
            <span className="text-[10px] font-bold bg-muted/60 rounded-full px-2 py-0.5">{toneLabel}</span>
            <span className="text-[10px] font-bold bg-muted/60 rounded-full px-2 py-0.5">{freqLabel}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="font-bold text-foreground">{posts.length} posts</span>
          <span className="text-emerald-600 font-bold">{approved.length} validés</span>
          <span className="text-muted-foreground">{drafts.length} brouillons</span>
        </div>

        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60">
          <X size={18} />
        </button>
      </div>

      {/* Action bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/20 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setPosts(prev => prev.map(p => ({ ...p, status: 'approved' })))} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-2 hover:bg-emerald-100 transition-colors">
            <Check size={12} /> Tout approuver
          </button>
          {/* Google Business cross-post toggle */}
          <div className="flex items-center gap-2 border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20 rounded-xl px-3 py-2">
            <button onClick={() => setGoogleCrosspost(v => !v)} className="flex items-center shrink-0" aria-label="Activer la multi-diffusion Google Business">
              {googleCrosspost ? <ToggleRight size={20} className="text-orange-500" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
            </button>
            <div>
              <p className="text-[11px] font-bold text-foreground">Multi-diffusion Google Business 🗺️</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Chaque post Instagram/Facebook génère un Post Google Update automatique</p>
            </div>
          </div>
          <button onClick={() => setPosts(generateBulkPosts(config))} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors">
            <RefreshCw size={12} /> Régénérer
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isNetwork && (
            <button onClick={handlePushNetwork} disabled={pushing} className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold text-xs px-4 py-2.5 hover:bg-blue-100 transition-colors active:scale-[0.98] disabled:opacity-60">
              {pushing ? <RefreshCw size={13} className="animate-spin" /> : <Users size={13} />} Pousser vers le réseau
            </button>
          )}
          <button onClick={handleValidateAll} disabled={validating} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-extrabold text-xs px-5 py-2.5 hover:opacity-90 transition-opacity active:scale-[0.98] shadow-lg disabled:opacity-60">
            {validating ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            {validating ? 'Planification…' : 'Tout valider et planifier 🚀'}
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {visiblePosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom legend */}
      <div className="shrink-0 flex items-center gap-4 px-4 sm:px-6 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold">Canaux :</span>
        {Object.entries(CHANNEL_DOTS).map(([ch, cls]) => (
          <span key={ch} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />{ch}
          </span>
        ))}
        <span className="ml-auto text-[11px]">
          Cliquez sur un post pour le valider ou le modifier avant planification
        </span>
      </div>
    </div>
  );
}