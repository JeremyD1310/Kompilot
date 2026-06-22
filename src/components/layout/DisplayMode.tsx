/**
 * DisplayMode — "Commerce Screensaver" / TV Dashboard
 * Full-screen animated interface readable from 2 meters away.
 * Shows: latest positive reviews, Local Power counter, scheduled posts for the week.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap, Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { blink } from '../../blink/client';
import { KompilotLogo } from '../brand/KompilotLogo';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DisplayModeProps {
  open: boolean;
  onClose: () => void;
}

interface ReviewSlide {
  type: 'review';
  authorName: string;
  rating: number;
  text: string;
  date: string;
}

interface PowerSlide {
  type: 'power';
  score: number;
  label: string;
  delta: string;
}

interface PostsSlide {
  type: 'posts';
  posts: { title: string; scheduledAt: string; status: string }[];
}

type Slide = ReviewSlide | PowerSlide | PostsSlide;

// ── Mock data builders ─────────────────────────────────────────────────────────

const DEMO_REVIEWS: ReviewSlide[] = [
  { type: 'review', authorName: 'Marie D.', rating: 5, text: 'Service exceptionnel, équipe très professionnelle. Je recommande vivement à tous mes proches !', date: "Aujourd'hui" },
  { type: 'review', authorName: 'Thomas R.', rating: 5, text: 'Vraiment bluffant. Qualité irréprochable et personnel aux petits soins. On revient bientôt !', date: 'Hier' },
  { type: 'review', authorName: 'Sophie M.', rating: 5, text: 'Accueil chaleureux, prestation de qualité. Un vrai coup de cœur. Merci pour tout !', date: 'Il y a 2 jours' },
];

function buildSlides(
  reviews: ReviewSlide[],
  posts: { title: string; scheduledAt: string; status: string }[],
  powerScore: number
): Slide[] {
  const slides: Slide[] = [];
  // Interleave: review → power → review → posts → review...
  reviews.forEach((r, i) => {
    slides.push(r);
    if (i === 0) {
      slides.push({ type: 'power', score: powerScore, label: 'Puissance Locale', delta: '+12 pts ce mois' });
    }
    if (i === 1 && posts.length > 0) {
      slides.push({ type: 'posts', posts });
    }
  });
  if (slides.length === 0) {
    slides.push({ type: 'power', score: powerScore, label: 'Puissance Locale', delta: '+12 pts ce mois' });
  }
  return slides;
}

// ── Star rating ────────────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={28}
          className={i < count ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-700 text-zinc-700'}
        />
      ))}
    </div>
  );
}

// ── Slide renderers ────────────────────────────────────────────────────────────

function ReviewCard({ slide }: { slide: ReviewSlide }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-3xl mx-auto px-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
        <span className="text-4xl font-black text-white">{slide.authorName.charAt(0)}</span>
      </div>
      <Stars count={slide.rating} />
      <blockquote className="text-4xl md:text-5xl font-bold text-white leading-tight">
        "{slide.text}"
      </blockquote>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold text-zinc-300">{slide.authorName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        <span className="text-xl text-zinc-500">{slide.date}</span>
      </div>
    </div>
  );
}

function PowerCard({ slide }: { slide: PowerSlide }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(slide.score / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, slide.score);
      setDisplayScore(current);
      if (current >= slide.score) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [slide.score]);

  return (
    <div className="flex flex-col items-center gap-8 text-center max-w-2xl mx-auto px-8">
      <div className="flex items-center gap-3 rounded-full bg-teal-500/20 border border-teal-500/40 px-6 py-3">
        <Zap size={24} className="text-teal-400 fill-teal-400" />
        <span className="text-2xl font-bold text-teal-300">{slide.label}</span>
      </div>
      <div className="relative">
        <span className="text-[180px] md:text-[220px] font-black text-white leading-none tabular-nums drop-shadow-2xl">
          {displayScore}
        </span>
        <span className="absolute -top-4 -right-8 text-6xl font-black text-teal-400">/100</span>
      </div>
      <div className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
        <span className="text-3xl">↑</span>
        {slide.delta}
      </div>
      <p className="text-xl text-zinc-400">Score de visibilité locale calculé par l'IA</p>
    </div>
  );
}

function PostsCard({ slide }: { slide: PostsSlide }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-3xl mx-auto px-8 w-full">
      <div className="flex items-center gap-3 rounded-full bg-violet-500/20 border border-violet-500/40 px-6 py-3">
        <Calendar size={24} className="text-violet-400" />
        <span className="text-2xl font-bold text-violet-300">Posts planifiés cette semaine</span>
      </div>
      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
        {slide.posts.slice(0, 4).map((post, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl bg-zinc-800/60 border border-zinc-700 px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xl">📝</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xl font-semibold text-white truncate">{post.title}</p>
              <p className="text-base text-zinc-400 mt-1">
                {post.scheduledAt
                  ? new Date(post.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Brouillon'}
              </p>
            </div>
            <span className="text-sm font-bold uppercase tracking-wide text-violet-400 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1">
              {post.status === 'published' ? 'Publié' : post.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
            </span>
          </div>
        ))}
        {slide.posts.length === 0 && (
          <p className="text-2xl text-zinc-500">Aucun post planifié cette semaine</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const SLIDE_DURATION = 8000; // 8 seconds per slide

export function DisplayMode({ open, onClose }: DisplayModeProps) {
  const { activeEstablishment } = useEstablishment();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);

    async function loadData() {
      try {
        // Load scheduled posts for this week
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const postsResult = await blink.db.scheduledPosts.list({
          where: { status: 'scheduled' },
          orderBy: { scheduledAt: 'asc' },
          limit: 4,
        }).catch(() => ({ data: [] }));

        const posts = ((postsResult as any)?.data ?? []).map((p: any) => ({
          title: p.textContent?.substring(0, 60) + (p.textContent?.length > 60 ? '…' : '') || 'Post planifié',
          scheduledAt: p.scheduledAt,
          status: p.status,
        }));

        const powerScore = 74; // Simulated
        const builtSlides = buildSlides(DEMO_REVIEWS, posts, powerScore);
        setSlides(builtSlides);
      } catch {
        setSlides(buildSlides(DEMO_REVIEWS, [], 74));
      } finally {
        setIsLoading(false);
        setCurrentIdx(0);
      }
    }

    loadData();
  }, [open]);

  // Auto-advance
  useEffect(() => {
    if (!open || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx(i => (i + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [open, slides.length]);

  // Keyboard: Escape to close, arrows to navigate
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIdx(i => (i + 1) % slides.length);
      if (e.key === 'ArrowLeft') setCurrentIdx(i => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, slides.length, onClose]);

  const prev = useCallback(() => setCurrentIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setCurrentIdx(i => (i + 1) % slides.length), [slides.length]);

  if (!open) return null;

  const currentSlide = slides[currentIdx];

  return (
    <div className="fixed inset-0 z-[500] bg-[#050810] flex flex-col">
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-8 py-5 bg-black/40 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <KompilotLogo variant="icon" height={40} />
          </div>
          <div>
            <p className="text-xl font-black text-white">{activeEstablishment?.name || 'Kompilot'}</p>
            <div className="flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin size={12} />
              <span>{activeEstablishment?.city || 'Mode affichage Commerce'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Slide indicators */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIdx ? 'w-8 h-2.5 bg-teal-400' : 'w-2.5 h-2.5 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 text-white text-sm font-semibold transition-all"
          >
            <X size={16} />
            Quitter
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        {/* Glowing orb background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
            style={{
              background: currentSlide?.type === 'review' ? 'radial-gradient(circle, #f59e0b, transparent)'
                : currentSlide?.type === 'power' ? 'radial-gradient(circle, #0d9488, transparent)'
                : 'radial-gradient(circle, #8b5cf6, transparent)'
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-xl text-zinc-400 font-semibold">Chargement des données...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex items-center justify-center px-4"
            >
              {currentSlide?.type === 'review' && <ReviewCard slide={currentSlide} />}
              {currentSlide?.type === 'power' && <PowerCard slide={currentSlide} />}
              {currentSlide?.type === 'posts' && <PostsCard slide={currentSlide} />}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Nav arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-6 w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft size={28} />
            </button>
            <button onClick={next}
              className="absolute right-6 w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="shrink-0 h-1 bg-zinc-800">
        <motion.div
          key={currentIdx}
          className="h-full bg-teal-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
        />
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-center gap-8 px-8 py-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Mode Affichage Commerce — Kompilot
        </div>
        <div className="text-zinc-600 text-sm">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="text-zinc-600 text-sm">
          ← → pour naviguer · Échap pour quitter
        </div>
      </div>
    </div>
  );
}
