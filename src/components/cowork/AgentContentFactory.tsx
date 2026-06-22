/**
 * AgentContentFactory — Advanced Content Factory Agent panel.
 *
 * Features:
 * - Brief input form (topic, sector, tone, platforms, number of posts)
 * - Real AI generation via blink.ai.streamText
 * - Streaming output rendered as structured post plan
 * - Copy-to-clipboard per post, inject-to-calendar shortcut
 * - Quota consumption on each run
 */
import { useState, useCallback } from 'react';
import {
  Megaphone, Sparkles, Loader2, CheckCircle2, Copy, RefreshCw,
  ChevronDown, ChevronUp, Zap, Calendar, Hash,
} from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { useSubscription } from '../../context/SubscriptionContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { type AgentQuota } from '../../hooks/useAgentQuota';
import { useAgentSprint } from '../../hooks/useAgentSprint';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string;
  bestTime: string;
}

interface SprintResult {
  week: string;
  posts: GeneratedPost[];
  summary: string;
}

// ── Platform picker ───────────────────────────────────────────────────────────

const PLATFORMS = ['Instagram', 'Facebook', 'Google Business', 'LinkedIn', 'TikTok'];
const TONES = ['Engageant', 'Professionnel', 'Humour', 'Inspirant', 'Promotionnel'];
const POST_COUNTS = [4, 6, 8, 12];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseGeneratedPosts(raw: string): GeneratedPost[] {
  // Parse markdown-style blocks: ### POST 1 — Platform\n**Contenu:**...
  const posts: GeneratedPost[] = [];
  const blocks = raw.split(/###\s+POST\s+\d+/i).filter(Boolean);
  for (const block of blocks) {
    const platformMatch = block.match(/—\s*(.+?)[\n\r]/);
    const contentMatch = block.match(/\*\*Contenu[^:]*:\*\*\s*([\s\S]*?)(?:\*\*Hashtags|\*\*Heure|$)/i);
    const hashMatch = block.match(/\*\*Hashtags[^:]*:\*\*\s*(.+?)(?:\n|$)/i);
    const timeMatch = block.match(/\*\*Heure[^:]*:\*\*\s*(.+?)(?:\n|$)/i);
    posts.push({
      platform: platformMatch?.[1]?.trim() ?? 'Réseaux sociaux',
      content: contentMatch?.[1]?.trim() ?? block.slice(0, 200).trim(),
      hashtags: hashMatch?.[1]?.trim() ?? '',
      bestTime: timeMatch?.[1]?.trim() ?? '',
    });
  }
  return posts.length > 0 ? posts : [{
    platform: 'Multi-plateforme',
    content: raw.slice(0, 600),
    hashtags: '',
    bestTime: '',
  }];
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: GeneratedPost; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${post.content}\n\n${post.hashtags}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const platformColors: Record<string, string> = {
    Instagram: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    Facebook: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    'Google Business': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    LinkedIn: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    TikTok: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  };
  const badgeClass = platformColors[post.platform] ?? 'bg-slate-500/10 text-slate-300 border-slate-500/20';

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500">#{index + 1}</span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', badgeClass)}>{post.platform}</span>
          {post.bestTime && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Zap size={9} /> {post.bestTime}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.hashtags && (
          <p className="text-[11px] text-indigo-400 mt-2 leading-relaxed flex items-start gap-1.5">
            <Hash size={10} className="shrink-0 mt-0.5" />{post.hashtags}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AgentContentFactoryProps {
  quota: AgentQuota;
}

export function AgentContentFactory({ quota }: AgentContentFactoryProps) {
  const { currentPlan } = useSubscription();
  const profile = useOnboardingProfile();
  const sectorFromProfile = profile?.sector ?? 'Commerce';
  const { runSprint } = useAgentSprint();

  const [brief, setBrief] = useState('');
  const [sector, setSector] = useState(sectorFromProfile);
  const [tone, setTone] = useState(TONES[0]);
  const [platforms, setPlatforms] = useState<string[]>(['Instagram', 'Google Business']);
  const [postCount, setPostCount] = useState(4);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [parsedPosts, setParsedPosts] = useState<GeneratedPost[]>([]);
  const [showConfig, setShowConfig] = useState(true);
  const [injectedCount, setInjectedCount] = useState<number | null>(null);

  const togglePlatform = (p: string) => {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!brief.trim() || isStreaming) return;

    // Fair use gate
    const allowed = quota.consume();
    if (!allowed) {
      toast.error('Quota mensuel atteint', {
        description: `Vos ${quota.planLimit} sprints sont épuisés. Rechargez des crédits pour continuer.`,
      });
      return;
    }

    setIsStreaming(true);
    setRawOutput('');
    setParsedPosts([]);
    setInjectedCount(null);
    setShowConfig(false);

    try {
      // Call backend agent endpoint (real function calling + calendar injection)
      const result = await runSprint({
        brief,
        sector,
        tone,
        platforms,
        postCount,
        injectToCalendar: true,
      });

      setRawOutput(result.content);
      const posts = result.posts?.length > 0 ? result.posts : parseGeneratedPosts(result.content);
      setParsedPosts(posts);

      // Show calendar injection count
      const injected = (result.functionCall?.result as { injectedCount?: number })?.injectedCount ?? 0;
      setInjectedCount(injected);

      if (injected > 0) {
        toast.success(`✅ Sprint généré — ${posts.length} posts + ${injected} injectés dans le calendrier !`);
      } else {
        toast.success(`✅ Sprint généré — ${posts.length} posts prêts !`);
      }

      // Mark checklist
      try { localStorage.setItem(`agent_sprint_launched_${currentPlan.id}`, '1'); } catch {}
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!isAbort) {
        toast.error('Erreur de génération', { description: 'Vérifiez votre connexion et réessayez.' });
        setShowConfig(true);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [brief, isStreaming, platforms, postCount, sector, tone, quota, currentPlan.id, runSprint]);

  const handleReset = () => {
    setRawOutput('');
    setParsedPosts([]);
    setInjectedCount(null);
    setShowConfig(true);
    setIsStreaming(false);
  };

  const canGenerate = brief.trim().length >= 10 && platforms.length > 0 && !quota.isExhausted;

  return (
    <div className={cn(
      'rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 bg-slate-900/80 overflow-hidden'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
            <Megaphone size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Content Factory</p>
            <p className="text-[11px] text-slate-400">Expert Média Planner · Génération IA réelle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-400">Disponible</span>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="px-5 pb-5 space-y-4">
          {/* Brief */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Brief / Thème du sprint
            </label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Ex: Promotions printemps pour un salon de coiffure — coupes + colorations à -20%, ciblage femmes 25-45 ans…"
              rows={3}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-1">{brief.length} / 500 caractères</p>
          </div>

          {/* Sector + Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Secteur</label>
              <input
                type="text"
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Ton</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    'text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all',
                    platforms.includes(p)
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Post count */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Nombre de posts</label>
            <div className="flex gap-2">
              {POST_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setPostCount(n)}
                  className={cn(
                    'flex-1 text-sm font-bold py-2 rounded-xl border transition-all',
                    postCount === n
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all',
              canGenerate
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10'
                : 'opacity-40 cursor-not-allowed border border-slate-700/40 bg-slate-800/20 text-slate-500'
            )}
          >
            <Sparkles size={15} />
            {quota.isExhausted ? 'Quota atteint — rechargez vos crédits' : 'Lancer le Sprint de Contenu IA'}
          </button>
        </div>
      )}

      {/* Streaming / results */}
      {(isStreaming || rawOutput) && !showConfig && (
        <div className="px-5 pb-5 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowConfig(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronUp size={12} /> Modifier le brief
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw size={11} /> Nouveau sprint
            </button>
          </div>

          {isStreaming && parsedPosts.length === 0 && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 size={13} className="animate-spin text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">Génération du planning éditorial…</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap line-clamp-8">
                {rawOutput || '…'}
              </p>
            </div>
          )}

          {parsedPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">{parsedPosts.length} posts générés — sprint prêt !</span>
              </div>
              {injectedCount !== null && injectedCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2">
                  <Calendar size={12} className="text-teal-400 shrink-0" />
                  <p className="text-[11px] text-teal-300 font-semibold">
                    {injectedCount} posts injectés dans le Calendrier Éditorial
                  </p>
                </div>
              )}
              {parsedPosts.map((post, i) => (
                <PostCard key={i} post={post} index={i} />
              ))}
              {/* Summary */}
              {rawOutput.includes('Résumé du Sprint') && (
                <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
                  <p className="text-[11px] text-emerald-300 leading-relaxed">
                    {rawOutput.match(/\*\*Résumé du Sprint[^:]*:\*\*\s*([\s\S]+?)$/i)?.[1]?.trim()}
                  </p>
                </div>
              )}
              <button
                onClick={() => window.location.href = '/calendar'}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 transition-all"
              >
                <Calendar size={13} /> Voir le Calendrier Éditorial →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
