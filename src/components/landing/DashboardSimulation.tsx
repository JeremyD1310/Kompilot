/**
 * DashboardSimulation — Full-width immersive animated dashboard preview.
 * Shows 3 panels simultaneously: Calendar (left), Inbox (center), GEO + Social (right).
 * All panels animate continuously: new messages, pulsing badges, live sync tickers,
 * cycling calendar items, drawing GEO graph, and social media metrics.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar, MessageSquare, BarChart3, TrendingUp,
  Eye, Send, CheckCircle2, Sparkles, Zap,
  Music2, Users, Heart, MessageCircle, Share2,
  Lightbulb, Target, Clock, Hash, Image, Video, ThumbsUp,
} from 'lucide-react';

// ── Data pools for continuous cycling ─────────────────────────────────────────

const CALENDAR_POOL = [
  { day: 'Lun', time: '09:00', text: 'Instagram — Nouveau menu', status: 'scheduled', platform: 'IG' },
  { day: 'Lun', time: '14:00', text: 'Facebook — Behind the scenes', status: 'scheduled', platform: 'FB' },
  { day: 'Mar', time: '10:30', text: 'LinkedIn — Article sectoriel IA', status: 'draft', platform: 'LI' },
  { day: 'Mar', time: '18:00', text: 'TikTok — POV: meilleur plat', status: 'ai-generated', platform: 'TT' },
  { day: 'Mer', time: '08:00', text: 'Google Business — Promo weekend', status: 'scheduled', platform: 'GB' },
  { day: 'Mer', time: '16:00', text: 'Instagram Story — Sondage', status: 'ai-generated', platform: 'IG' },
  { day: 'Jeu', time: '11:30', text: 'Facebook — Témoignage client', status: 'draft', platform: 'FB' },
];

const EXTRA_CALENDAR = [
  { day: 'Jeu', time: '15:00', text: 'TikTok — Recipe ASMR video', status: 'ai-generated', platform: 'TT' },
  { day: 'Ven', time: '09:30', text: 'LinkedIn — Newsletter hebdo', status: 'draft', platform: 'LI' },
  { day: 'Ven', time: '17:30', text: 'Instagram Reel — Weekend vibes', status: 'ai-generated', platform: 'IG' },
];

const INBOX_POOL = [
  { source: 'Google', from: 'Marie D.', text: 'Super expérience, je recommande ! ⭐⭐⭐⭐⭐', time: '2 min', replied: true, avatar: 'M' },
  { source: 'Instagram', from: '@foodie_paris', text: 'Vous ouvrez le dimanche ?', time: '15 min', replied: false, avatar: 'F' },
  { source: 'WhatsApp', from: 'Jean-Pierre', text: 'Réservation pour 4 personnes samedi soir', time: '1h', replied: false, avatar: 'J' },
  { source: 'Google', from: 'Lucas M.', text: 'Service impeccable, plats délicieux 🙏', time: '3h', replied: true, avatar: 'L' },
  { source: 'Instagram', from: '@sophie_travel', text: 'Est-il possible de réserver pour ce soir ?', time: '30 min', replied: false, avatar: 'S' },
  { source: 'WhatsApp', from: 'Marc L.', text: 'Quels sont vos horaires demain ?', time: '2h', replied: false, avatar: 'M' },
  { source: 'Google', from: 'Thomas D.', text: 'Je recommande vivement cet établissement !', time: '4h', replied: true, avatar: 'T' },
];

const EXTRA_INBOX = [
  { source: 'Instagram', from: '@parisfoodlover', text: 'Le bowl signature est incroyable ! 🍜', time: 'à l\'instant', replied: false, avatar: 'P' },
  { source: 'WhatsApp', from: 'Claire V.', text: 'Puis-je annuler ma réservation de demain ?', time: 'à l\'instant', replied: false, avatar: 'C' },
  { source: 'Google', from: 'Antoine R.', text: 'Meilleur brunch de la ville ! 🥐⭐⭐⭐⭐⭐', time: 'à l\'instant', replied: true, avatar: 'A' },
];

const AI_REPLIES = [
  'Merci beaucoup ! Ravie que l\'expérience vous ait plu 🙏',
  'Bien sûr ! Nous serons ravis de vous accueillir dimanche. Souhaitez-vous réserver ?',
  'Merci pour votre avis ! N\'hésitez pas à revenir essayer notre nouveau brunch 🥐',
];

const PLATFORM_COLORS: Record<string, string> = {
  IG: '#E4405F', FB: '#1877F2', LI: '#0A66C2', TT: '#000', GB: '#4285F4',
};

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  Google: { bg: 'bg-red-500/15', text: 'text-red-400' },
  Instagram: { bg: 'bg-pink-500/15', text: 'text-pink-400' },
  WhatsApp: { bg: 'bg-green-500/15', text: 'text-green-400' },
};

const GEO_METRICS = [
  { label: 'Score Visibilité', value: '74', prev: '18', unit: '/100', color: '#2DD4BF' },
  { label: 'Avis Google', value: '47', prev: '12', unit: '', color: '#FBBF24' },
  { label: 'Reach mensuel', value: '12.4K', prev: '3.2K', unit: '', color: '#818CF8' },
  { label: 'Citations IA', value: '8', prev: '0', unit: 'plateformes', color: '#06B6D4' },
];

// ── Social media metrics data ─────────────────────────────────────────────────

const SOCIAL_METRICS = [
  {
    platform: 'Instagram',
    icon: 'IG',
    color: '#E4405F',
    gradient: 'from-[#E4405F] to-[#833AB4]',
    followers: '+12%',
    followersLabel: '24.8K',
    engagement: '+28%',
    engagementLabel: '1.2K',
    posts: '34',
  },
  {
    platform: 'Facebook',
    icon: 'FB',
    color: '#1877F2',
    gradient: 'from-[#1877F2] to-[#0C5DC7]',
    followers: '+8%',
    followersLabel: '18.3K',
    engagement: '+15%',
    engagementLabel: '856',
    posts: '28',
  },
  {
    platform: 'TikTok',
    icon: 'TT',
    color: '#000',
    gradient: 'from-[#00F2EA] to-[#FF0050]',
    followers: '+45%',
    followersLabel: '9.1K',
    engagement: '+62%',
    engagementLabel: '3.4K',
    posts: '19',
  },
];

const GRAPH_DATA = [12, 18, 15, 22, 28, 34, 41, 38, 52, 58, 65, 74];
const GRAPH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ── Typing animation hook ─────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 25, delay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

// ── Live sync ticker ──────────────────────────────────────────────────────────

function useSyncTicker() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  if (seconds < 60) return `il y a ${seconds}s`;
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  return `il y a ${Math.floor(seconds / 3600)}h`;
}

// ── Calendar Panel ────────────────────────────────────────────────────────────

function CalendarPanel() {
  const [items, setItems] = useState<typeof CALENDAR_POOL>([]);
  const [extraIndex, setExtraIndex] = useState(0);

  // Initial staggered load
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    CALENDAR_POOL.forEach((item, i) => {
      timers.push(setTimeout(() => setItems(prev => [...prev, item]), i * 180));
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Continuous: add new items every 6s
  useEffect(() => {
    const iv = setInterval(() => {
      const newItem = EXTRA_CALENDAR[extraIndex % EXTRA_CALENDAR.length];
      setItems(prev => {
        const next = [...prev, { ...newItem, time: `${9 + (prev.length % 8)}:${prev.length % 2 === 0 ? '00' : '30'}` }];
        if (next.length > 8) next.shift();
        return next;
      });
      setExtraIndex(i => i + 1);
    }, 6000);
    return () => clearInterval(iv);
  }, [extraIndex]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Calendar size={13} className="text-teal-400" />
        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider whitespace-nowrap">
          Calendrier éditorial IA
        </span>
        <span className="ml-auto text-[9px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
          {items.length} posts
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1 px-3 py-2 border-b border-white/[0.04]">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-semibold uppercase tracking-wider">{d}</div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1">
        {items.map((item, i) => {
          const platformColor = PLATFORM_COLORS[item.platform] || '#6366f1';
          const isNew = i === items.length - 1;
          return (
            <div
              key={`${item.text}-${i}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-all duration-500"
              style={{
                animation: isNew ? 'fadeSlideIn 0.4s ease both' : undefined,
                borderLeft: `2px solid ${platformColor}`,
                opacity: isNew ? undefined : 1,
              }}
            >
              <span className="text-[8px] text-slate-500 w-7 shrink-0 tabular-nums">{item.time}</span>
              <span className="text-[10px] text-slate-300 truncate flex-1 min-w-0">{item.text}</span>
              <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap ${
                item.status === 'ai-generated' ? 'bg-violet-500/20 text-violet-400' :
                item.status === 'scheduled' ? 'bg-teal-500/20 text-teal-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {item.status === 'ai-generated' ? '✦ IA' : item.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Sparkles size={10} className="text-violet-400 shrink-0 animate-pulse" />
          <span className="text-[9px] text-violet-300">IA suggère : post Story « Behind the scenes » jeudi 15h</span>
        </div>
      </div>
    </div>
  );
}

// ── Inbox Panel ───────────────────────────────────────────────────────────────

function InboxPanel() {
  const [messages, setMessages] = useState<typeof INBOX_POOL>([]);
  const [typingReply, setTypingReply] = useState<string | null>(null);
  const [replyIndex, setReplyIndex] = useState(0);
  const { displayed: replyText, done: replyDone } = useTypewriter(typingReply || '', 22, typingReply ? 300 : 99999);
  const [unreadCount, setUnreadCount] = useState(5);

  // Initial staggered load
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    INBOX_POOL.forEach((item, i) => {
      timers.push(setTimeout(() => setMessages(prev => [...prev, item]), i * 250));
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Continuous: add new messages every 7s
  useEffect(() => {
    const iv = setInterval(() => {
      const newItem = EXTRA_INBOX[replyIndex % EXTRA_INBOX.length];
      setMessages(prev => {
        const next = [...prev, { ...newItem, time: 'à l\'instant' }];
        if (next.length > 6) next.shift();
        return next;
      });
      setUnreadCount(c => c + 1);
      setReplyIndex(i => i + 1);
    }, 7000);
    return () => clearInterval(iv);
  }, [replyIndex]);

  // Cycle through AI replies
  useEffect(() => {
    const iv = setInterval(() => {
      const reply = AI_REPLIES[replyIndex % AI_REPLIES.length];
      setTypingReply(reply);
    }, 10000);
    return () => clearInterval(iv);
  }, [replyIndex]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <MessageSquare size={13} className="text-blue-400" />
        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Inbox unifiée</span>
        <span className="ml-auto relative">
          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
            {unreadCount} messages
          </span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        </span>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
        {messages.map((item, i) => {
          const sourceColor = SOURCE_COLORS[item.source] || { bg: 'bg-slate-500/15', text: 'text-slate-400' };
          const isNew = i === messages.length - 1;
          // Only show "Auto" badge on Google messages that were auto-replied
          const showAutoBadge = item.source === 'Google' && item.replied;
          return (
            <div
              key={`${item.from}-${i}`}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-all duration-500"
              style={{ animation: isNew ? 'fadeSlideIn 0.4s ease both' : undefined }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                style={{
                  background: `linear-gradient(135deg, ${item.source === 'Google' ? '#EA4335' : item.source === 'Instagram' ? '#E4405F' : '#25D366'}, ${item.source === 'Google' ? '#FBBC04' : item.source === 'Instagram' ? '#833AB4' : '#128C7E'})`,
                  color: '#fff',
                }}
              >
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-300 truncate">{item.from}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded font-bold shrink-0 ${sourceColor.bg} ${sourceColor.text}`}>{item.source}</span>
                  <span className="text-[8px] text-slate-600 ml-auto shrink-0">{item.time}</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">{item.text}</p>
              </div>
              {showAutoBadge && (
                <span className="text-[8px] text-teal-400 shrink-0 flex items-center gap-0.5 mt-1">
                  <CheckCircle2 size={8} /> Auto
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* AI reply suggestion — cycles continuously */}
      {typingReply && (
        <div className="px-3 py-2 border-t border-white/[0.06]">
          <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Sparkles size={9} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider">Réponse IA suggérée</span>
                <span className="text-[7px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-bold">Auto</span>
              </div>
              <p className="text-[10px] text-blue-200 leading-relaxed">
                {replyText}
                {!replyDone && <span className="inline-block w-1 h-3 bg-blue-400 rounded ml-0.5 animate-pulse" />}
              </p>
              {replyDone && (
                <div className="flex items-center gap-1.5 mt-2">
                  <button className="flex items-center gap-1 text-[8px] bg-teal-500/20 text-teal-400 px-2 py-1 rounded-md font-bold hover:bg-teal-500/30 transition-colors">
                    <Send size={8} /> Envoyer
                  </button>
                  <button className="text-[8px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-1">
                    Modifier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Social Media Metrics Section ──────────────────────────────────────────────

function SocialMetricsRow() {
  const [visible, setVisible] = useState(0);
  const [pulseIdx, setPulseIdx] = useState(0);

  // Staggered reveal
  useEffect(() => {
    if (visible >= SOCIAL_METRICS.length) return;
    const timer = setTimeout(() => setVisible(v => v + 1), 500);
    return () => clearTimeout(timer);
  }, [visible]);

  // Cycle pulse animation across platforms
  useEffect(() => {
    const iv = setInterval(() => {
      setPulseIdx(i => (i + 1) % SOCIAL_METRICS.length);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="px-3 pt-2 pb-1 space-y-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Réseaux sociaux</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      {SOCIAL_METRICS.slice(0, visible).map((m, i) => {
        const isPulsing = pulseIdx === i;
        return (
          <div
            key={m.platform}
            className="rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden"
            style={{
              animation: 'fadeSlideIn 0.4s ease both',
              animationDelay: `${i * 120}ms`,
              boxShadow: isPulsing ? `0 0 12px ${m.color}18, inset 0 0 20px ${m.color}06` : undefined,
              transition: 'box-shadow 0.6s ease',
            }}
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              {/* Platform icon */}
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[7px] font-black text-white shrink-0"
                style={{ background: m.color === '#000' ? 'linear-gradient(135deg, #00F2EA, #FF0050)' : m.color }}
              >
                {m.icon}
              </div>
              <span className="text-[9px] font-bold text-slate-300 shrink-0">{m.platform}</span>
              {/* Inline metrics */}
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1">
                  <Users size={8} className="text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-200">{m.followersLabel}</span>
                  <span className="text-[7px] text-emerald-400 font-bold">{m.followers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={8} className="text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-200">{m.engagementLabel}</span>
                  <span className="text-[7px] text-emerald-400 font-bold">{m.engagement}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={8} className="text-slate-500" />
                  <span className="text-[9px] text-slate-400">{m.posts} posts</span>
                </div>
              </div>
            </div>
            {/* Mini engagement bar */}
            <div className="h-[2px] bg-white/[0.03]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${50 + i * 18}%`,
                  background: `linear-gradient(90deg, ${m.color}88, ${m.color}44)`,
                  animation: `growBar 1.2s ease both ${i * 300}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AI Coach Tips Section ─────────────────────────────────────────────────────

const COACH_TIPS = [
  {
    category: 'Followers',
    icon: Users,
    color: '#E4405F',
    tips: [
      'Postez entre 18h-21h pour +40% de portée organique',
      'Collaborez avec 2 micro-influenceurs locaux par mois',
      'Utilisez les Reels : +67% d\'engagement vs posts statiques',
    ],
  },
  {
    category: 'Engagement',
    icon: Heart,
    color: '#818CF8',
    tips: [
      'Répondez à chaque commentaire en moins de 30 minutes',
      'Posez une question en fin de légende pour +55% de commentaires',
      'Partagez du contenu généré par vos clients (UGC)',
    ],
  },
  {
    category: 'Visibilité',
    icon: Eye,
    color: '#2DD4BF',
    tips: [
      'Utilisez 5-8 hashtags ciblés, pas plus de 15',
      'Géolocalisez chaque post pour +30% de reach local',
      'Publiez des Stories quotidiennes pour rester en tête de feed',
    ],
  },
  {
    category: 'Contenu',
    icon: Sparkles,
    color: '#FBBF24',
    tips: [
      'Alternez : 40% éducatif, 30% divertissant, 30% promotionnel',
      'Les carrousels génèrent 3x plus de sauvegardes qu\'une image',
      'Le texte sur image arrête le scroll : +80% de temps de lecture',
    ],
  },
];

function AICoachTips() {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Cycle tips continuously
  useEffect(() => {
    const iv = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTip(prev => {
          const cat = COACH_TIPS[currentCategory];
          const next = prev + 1;
          if (next >= cat.tips.length) {
            setCurrentCategory(c => (c + 1) % COACH_TIPS.length);
            return 0;
          }
          return next;
        });
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(iv);
  }, [currentCategory]);

  if (!visible) return null;

  const cat = COACH_TIPS[currentCategory];
  const IconComp = cat.icon;

  return (
    <div className="px-3 pt-1.5 pb-2 space-y-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Lightbulb size={8} className="text-amber-400" />
        <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">Coach IA</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <div className="flex gap-1">
          {COACH_TIPS.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i === currentCategory ? cat.color : 'rgba(255,255,255,0.1)',
                boxShadow: i === currentCategory ? `0 0 4px ${cat.color}80` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Category badges row */}
      <div className="flex gap-1">
        {COACH_TIPS.map((c, i) => {
          const isActive = i === currentCategory;
          return (
            <button
              key={c.category}
              onClick={() => { setCurrentCategory(i); setCurrentTip(0); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold transition-all duration-300 cursor-pointer border"
              style={{
                background: isActive ? `${c.color}18` : 'transparent',
                borderColor: isActive ? `${c.color}40` : 'rgba(255,255,255,0.06)',
                color: isActive ? c.color : '#475569',
              }}
            >
              <c.icon size={7} />
              {c.category}
            </button>
          );
        })}
      </div>

      {/* Current tip with transition */}
      <div
        className="rounded-lg border px-2.5 py-2 transition-all duration-300"
        style={{
          background: `${cat.color}08`,
          borderColor: `${cat.color}20`,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
        }}
      >
        <div className="flex items-start gap-2">
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${cat.color}20` }}
          >
            <IconComp size={8} style={{ color: cat.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-slate-300 leading-relaxed">{cat.tips[currentTip]}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: `${cat.color}99` }}>
                {cat.category} — Astuce {currentTip + 1}/{cat.tips.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GEO Analytics Panel ───────────────────────────────────────────────────────

function GEOPanel() {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [glowPulse, setGlowPulse] = useState(false);

  const graph = GRAPH_DATA;
  const max = Math.max(...graph);
  const h = 80;
  const w = 280;

  // Animate graph drawing
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedHeight(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Animate metrics reveal
  useEffect(() => {
    if (visibleMetrics >= GEO_METRICS.length) return;
    const timer = setTimeout(() => setVisibleMetrics(v => v + 1), 400);
    return () => clearTimeout(timer);
  }, [visibleMetrics]);

  // Animate score counter
  useEffect(() => {
    let current = 0;
    const target = 74;
    const interval = setInterval(() => {
      current += 2;
      setAnimatedScore(Math.min(current, target));
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Continuous glow pulse on the score
  useEffect(() => {
    const iv = setInterval(() => {
      setGlowPulse(true);
      setTimeout(() => setGlowPulse(false), 1200);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const visibleGraph = graph.map((v, i) => {
    const effective = v * (animatedHeight / 100);
    const x = (i / (graph.length - 1)) * w;
    const y = h - (effective / max) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <BarChart3 size={13} className="text-violet-400" />
        <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Score G.E.O.</span>
        <div className="ml-auto flex items-center gap-1.5">
          <TrendingUp size={9} className="text-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
          <span className="text-[9px] text-emerald-400 font-bold">+311%</span>
        </div>
      </div>

      {/* Big score with pulsing glow — FIXED font size to prevent overlap */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="url(#scoreGrad)" strokeWidth="3"
              strokeDasharray={`${animatedScore}, 100`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-shadow duration-1000"
            style={glowPulse ? { filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' } : undefined}
          >
            <span className="text-lg font-black text-slate-100 leading-none">{animatedScore}</span>
            <span className="text-[7px] text-slate-500 font-medium leading-none mt-0.5">/100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-200 leading-tight">Autorité locale</p>
          <p className="text-[8px] text-slate-500 leading-snug mt-0.5">
            Score calculé par rapport aux 100 meilleurs commerces de votre secteur.
          </p>
        </div>
      </div>

      {/* Growth graph with continuous hover glow on endpoint */}
      <div className="px-3 pt-1 min-h-0" style={{ maxHeight: 90 }}>
        <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full" style={{ height: 'auto', maxHeight: 85 }}>
          <defs>
            <linearGradient id="geoGradLanding" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${h} ${visibleGraph} ${w},${h}`} fill="url(#geoGradLanding)" />
          <polyline points={visibleGraph} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {GRAPH_LABELS.map((label, i) => (
            <text key={label} x={(i / (GRAPH_LABELS.length - 1)) * w} y={h + 7} textAnchor="middle" fontSize="6" fill="#475569">{label}</text>
          ))}
          {animatedHeight >= 95 && (
            <>
              <circle cx={w} cy={h - (74 / max) * h} r="5" fill="#8B5CF6" opacity="0.15">
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={w} cy={h - (74 / max) * h} r="2.5" fill="#8B5CF6" />
            </>
          )}
        </svg>
      </div>

      {/* Metrics grid — FIXED: proper spacing and no text overlay */}
      <div className="grid grid-cols-2 gap-1.5 px-3 py-1.5 border-t border-white/[0.06]">
        {GEO_METRICS.slice(0, visibleMetrics).map((m, i) => (
          <div
            key={i}
            className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
            style={{ animation: 'fadeSlideIn 0.3s ease both', animationDelay: `${i * 100}ms` }}
          >
            <p className="text-[7px] text-slate-500 uppercase tracking-wider leading-none mb-1">{m.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[12px] font-black text-slate-100 leading-none">{m.value}</span>
              {m.unit && <span className="text-[7px] text-slate-500 font-normal leading-none">{m.unit}</span>}
            </div>
            <p className="text-[7px] text-slate-600 mt-1 leading-none">
              <span className="text-emerald-400">↑</span> depuis {m.prev}
            </p>
          </div>
        ))}
      </div>

      {/* Social media performance — animated, below GEO stats */}
      <SocialMetricsRow />

      {/* AI Coach tips — cycling actionable advice */}
      <AICoachTips />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardSimulation() {
  const syncLabel = useSyncTicker();

  return (
    <section
      className="relative px-4 pb-8"
      style={{
        marginTop: '-8px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(13,148,136,.03) 50%, transparent 100%)',
      }}
    >
      <div
        className="max-w-[1200px] mx-auto rounded-2xl overflow-hidden"
        style={{
          border: '1px solid rgba(45,212,191,.15)',
          background: '#0D1117',
          boxShadow: '0 0 0 1px rgba(13,148,136,.08), 0 40px 80px -20px rgba(0,0,0,.7), 0 0 80px rgba(13,148,136,.06)',
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="flex gap-1.5">
            {['#FF5F57', '#FFBD2E', '#28CA41'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}55` }} />
            ))}
          </div>
          <div className="flex-1 rounded-md px-4 py-0.5 text-center mx-4" style={{ background: 'rgba(255,255,255,.06)' }}>
            <span className="text-[10px] text-slate-500 font-medium">app.kompilot.io/dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
          </div>
        </div>

        {/* Sub-nav with live sync — Cockpit active instead of Analytics */}
        <div className="flex items-center gap-4 px-4 py-2" style={{ background: 'rgba(17,24,39,.8)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          {[
            { label: 'Cockpit', active: true },
            { label: 'Calendrier', active: false },
            { label: 'Inbox', active: false },
            { label: 'Analytics', active: false },
            { label: 'Avis', active: false },
          ].map(tab => (
            <span key={tab.label} className={`text-[10px] font-semibold transition-colors ${tab.active ? 'text-teal-400 border-b border-teal-400 pb-0.5' : 'text-slate-600 hover:text-slate-400 cursor-pointer pb-0.5'}`}>{tab.label}</span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Eye size={10} className="text-slate-600" />
            <span className="text-[9px] text-slate-600">Dernière sync : {syncLabel}</span>
          </div>
        </div>

        {/* Reserve the visual footprint before animated panel content hydrates. */}
        <div className="grid min-h-[620px] grid-cols-1 md:min-h-[560px] md:grid-cols-3">
          <div className="border-r border-white/[0.06]"><CalendarPanel /></div>
          <div className="border-r border-white/[0.06]"><InboxPanel /></div>
          <div><GEOPanel /></div>
        </div>
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { width: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeSlideIn {
            from, to { opacity: 1; transform: none; }
          }
          @keyframes growBar {
            from, to { width: 100%; }
          }
          .animate-pulse, .animate-spin, .animate-ping { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
