import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Users, Briefcase, Globe } from 'lucide-react';

export interface SocialPost {
  id: number;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'google';
  text: string;
  likes: number; comments: number; shares: number;
}

export const POSTS: SocialPost[] = [
  { id: 1, platform: 'instagram', text: '☀️ Nouvelle saison, nouvelles saveurs ! Découvrez notre menu Printemps avec des produits frais du marché local. Réservez votre table dès maintenant 🌿 #CaféDuMarché #Paris11 #Local', likes: 214, comments: 31, shares: 18 },
  { id: 2, platform: 'facebook',  text: '🎉 Ce soir, soirée match PSG ! Menu supporters spécial à partir de 18h — boissons offertes à la mi-temps. On vous attend nombreux ! 🏆⚽', likes: 87, comments: 42, shares: 56 },
  { id: 3, platform: 'linkedin',  text: 'Le Café du Marché vient d\'intégrer la certification "Commerce Responsable Paris" 🏅 — une étape importante pour notre engagement local et durable.', likes: 143, comments: 19, shares: 34 },
  { id: 4, platform: 'google',    text: '🌧️ Il pleut ? Parfait pour un chocolat chaud maison ! Venez vous réchauffer chez nous. Coupon -10% sur toute boisson chaude aujourd\'hui sur présentation de ce post.', likes: 62, comments: 8, shares: 11 },
  { id: 5, platform: 'instagram', text: '📸 Behind the scenes : notre chef prépare la tarte du jour à base d\'abricots bio de Provence. Chaque jour une nouvelle surprise ! 🍑', likes: 309, comments: 47, shares: 22 },
];

type Platform = SocialPost['platform'];
const CFG: Record<Platform, { label: string; Icon: React.ElementType; bg: string; text: string; border: string; bg2: string }> = {
  instagram: { label: 'Instagram',      Icon: Camera,   bg: 'bg-gradient-to-br from-pink-500 to-orange-400', text: 'text-pink-600 dark:text-pink-400',   border: 'border-pink-100 dark:border-pink-900/40',  bg2: 'bg-pink-50 dark:bg-pink-950/20'  },
  facebook:  { label: 'Facebook',       Icon: Users,    bg: 'bg-blue-600',                                    text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-100 dark:border-blue-900/40',  bg2: 'bg-blue-50 dark:bg-blue-950/20'  },
  linkedin:  { label: 'LinkedIn',       Icon: Briefcase,bg: 'bg-sky-700',                                     text: 'text-sky-700 dark:text-sky-400',     border: 'border-sky-100 dark:border-sky-900/40',    bg2: 'bg-sky-50 dark:bg-sky-950/20'    },
  google:    { label: 'Google Business',Icon: Globe,    bg: 'bg-red-500',                                     text: 'text-red-600 dark:text-red-400',     border: 'border-red-100 dark:border-red-900/40',    bg2: 'bg-red-50 dark:bg-red-950/20'    },
};

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const inc = target / 20; let cur = 0;
    const t = setInterval(() => { cur += inc; if (cur >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(cur)); }, 40);
    return () => clearInterval(t);
  }, [target]);
  return <span>{count}</span>;
}

function PostCard({ post, isNew }: { post: SocialPost; isNew: boolean }) {
  const cfg = CFG[post.platform];
  const { Icon } = cfg;
  return (
    <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className={`rounded-2xl border ${cfg.border} ${cfg.bg2} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}><Icon size={15} className="text-white" /></div>
          <div>
            <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
            <p className="text-[10px] text-slate-400">Le Café du Marché</p>
          </div>
        </div>
        {isNew && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">PUBLIÉ</motion.span>}
      </div>
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">{post.text}</p>
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span>👍 {isNew ? <AnimatedCounter target={post.likes} /> : post.likes}</span>
        <span>💬 {isNew ? <AnimatedCounter target={post.comments} /> : post.comments}</span>
        <span>↗️ {isNew ? <AnimatedCounter target={post.shares} /> : post.shares}</span>
      </div>
      <div className="pt-1 border-t border-slate-100 dark:border-slate-700/50">
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[#0D9488] inline-block" /> Publié via Kompilot
        </p>
      </div>
    </motion.div>
  );
}

export function LiveSocialFeed() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [newestIdx, setNewestIdx] = useState(0);

  useEffect(() => {
    if (visibleCount >= POSTS.length) return;
    const t = setTimeout(() => { setNewestIdx(visibleCount); setVisibleCount(v => v + 1); }, 2500);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            Live Social Feed
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Publications auto-générées par l'IA</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-[#0D9488]">{visibleCount}/{POSTS.length}</p>
          <p className="text-[10px] text-slate-400">posts publiés</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {POSTS.slice(0, visibleCount).map((post, idx) => (
            <PostCard key={post.id} post={post} isNew={idx === newestIdx && visibleCount <= POSTS.length} />
          ))}
        </AnimatePresence>

        {visibleCount >= POSTS.length && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
            <p className="text-xs text-slate-400">✅ Toutes les publications de la semaine ont été postées automatiquement.</p>
            <button onClick={() => { setVisibleCount(1); setNewestIdx(0); }} className="mt-2 text-[11px] text-[#0D9488] font-semibold hover:underline">
              Rejouer la démo
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}