/**
 * UGCVideoAdGenerator — Chat-to-Video conversational UX for UGC video ad creation.
 *
 * P1: Credits exhausted detection (402 → modal "recharger")
 * P1: Luma progress tracking per variant (elapsed time, progress bar)
 * P2: Multi-platform export buttons (TikTok, Instagram, Shorts) post-generation
 * P2: Script cache per product to avoid re-analysis of same image
 * P3: A/B team voting on video variants (star rating, stored in localStorage)
 *
 * Flow: Upload product → Analyze → Select script → Generate video → Completed.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import {
  Upload, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  Calendar, RefreshCw, Camera, Zap, Star as StarIcon,
  Send, ExternalLink, Clock, TrendingUp, Timer,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';
import { useDemoMode } from '../../context/DemoModeContext';
import { useTelemetry } from '../../hooks/useTelemetry';
import { optimizeImageToWebP } from '../../lib/imageOptimizer';
import { CreditsTopUpModal } from '../subscription/CreditsTopUpModal';
import { StepIndicator, TypingAnalyzeSkeleton, ScriptCard, VideoVariantCard } from './UGCVideoAdGeneratorParts';
import { ResponsiveImage } from '../shared/ResponsiveImage';
import {
  ASPECT_RATIOS, MOCK_SCRIPTS, MOCK_VIDEOS,
  type Step, type UGCVideoScript, type VideoVariant,
  type AnalyzeResponse, type StatusResponse,
} from './UGCVideoAdGeneratorTypes';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';
const STEPS = ['Produit', 'Analyse', 'Scripts', 'Génération'];

// ── Script cache (P2: avoid re-generation for same product image) ──────────────

const CACHE_PREFIX = 'kompilot_ugc_script_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  imageUrl: string;
  description: string;
  projectId: string;
  scripts: UGCVideoScript[];
  cachedAt: number;
}

function getCacheKey(imageUrl: string): string {
  return `${CACHE_PREFIX}${btoa(imageUrl).slice(0, 40)}`;
}

function getCachedScripts(imageUrl: string, description: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(imageUrl));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(imageUrl));
      return null;
    }
    if (entry.description !== description) return null; // description changed
    return entry;
  } catch { return null; }
}

function setCachedScripts(imageUrl: string, description: string, projectId: string, scripts: UGCVideoScript[]) {
  try {
    const entry: CacheEntry = { imageUrl, description, projectId, scripts, cachedAt: Date.now() };
    localStorage.setItem(getCacheKey(imageUrl), JSON.stringify(entry));
  } catch { /* storage full — non-critical */ }
}

// ── Variant rating (P3: A/B voting) ────────────────────────────────────────────

const VOTES_PREFIX = 'kompilot_ugc_votes_';

function getVotes(projectId: string): Record<number, { total: number; count: number }> {
  try {
    return JSON.parse(localStorage.getItem(`${VOTES_PREFIX}${projectId}`) ?? '{}');
  } catch { return {}; }
}

function castVote(projectId: string, variantIndex: number, rating: number) {
  const votes = getVotes(projectId);
  const prev = votes[variantIndex] ?? { total: 0, count: 0 };
  votes[variantIndex] = { total: prev.total + rating, count: prev.count + 1 };
  try { localStorage.setItem(`${VOTES_PREFIX}${projectId}`, JSON.stringify(votes)); } catch { /* noop */ }
}

function getWinnerIndex(projectId: string): number | null {
  const votes = getVotes(projectId);
  let best = -1;
  let bestAvg = 0;
  for (const [idx, v] of Object.entries(votes)) {
    if (v.count === 0) continue;
    const avg = v.total / v.count;
    if (avg > bestAvg) { bestAvg = avg; best = Number(idx); }
  }
  return best >= 0 ? best : null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function UGCVideoAdGenerator() {
  const navigate = useNavigate();
  const { isDemoActive } = useDemoMode();
  const track = useTelemetry();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('upload');
  const [stepIndex, setStepIndex] = useState(0);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [scripts, setScripts] = useState<UGCVideoScript[]>([]);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [variants, setVariants] = useState<VideoVariant[]>([]);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState<Record<number, number>>({});
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [cachedHit, setCachedHit] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const token = await blink.auth.getValidToken();
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  }, []);

  const advanceStep = useCallback((s: Step, i: number) => { setStep(s); setStepIndex(i); }, []);

  const resetState = useCallback(() => {
    setError(''); setStep('upload'); setStepIndex(0);
    setScripts([]); setVariants([]); setSelectedScriptIndex(null); setProjectId('');
    setElapsedSeconds({}); setCreditsLeft(null); setCachedHit(false);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ── Image handling ─────────────────────────────────────────────────────────

  const handleImagePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté', { description: 'Utilisez PNG, JPEG ou WebP.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', { description: 'Maximum 10 Mo.' });
      return;
    }
    setProductImage(file);
    setProductImagePreview(URL.createObjectURL(file));
    setError('');
    setCachedHit(false);
  }, []);

  const uploadImage = useCallback(async (): Promise<string> => {
    if (!productImage) throw new Error('Aucune image sélectionnée');
    if (isDemoActive) {
      await new Promise((r) => setTimeout(r, 800));
      return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop';
    }
    const { file: optimizedImage } = await optimizeImageToWebP(productImage, { maxWidthPx: 1600, quality: 0.82 });
    const path = `ugc-products/${Date.now()}-${optimizedImage.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploaded = await blink.storage.upload(optimizedImage, path);
    return uploaded.publicUrl;
  }, [productImage, isDemoActive]);

  // ── Analyze (with cache check) ─────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!productDescription.trim()) { toast.error('Description requise'); return; }
    if (!productImage) { toast.error('Image requise'); return; }

    track('creative_studio_generation_click', { type: 'ugc_video_ad', demo: isDemoActive });
    setError('');
    setIsUploading(true);
    advanceStep('analyzing', 1);

    try {
      const imageUrl = await uploadImage();
      setIsUploading(false);

      // P2: Check script cache before calling the API
      const cached = getCachedScripts(imageUrl, productDescription.trim());
      if (cached && cached.scripts.length > 0) {
        setProjectId(cached.projectId);
        setScripts(cached.scripts);
        setCachedHit(true);
        advanceStep('scripts_ready', 2);
        toast.success('Scripts récupérés du cache', { description: 'Analyse instantanée — aucun crédit débité.' });
        track('creative_studio_generation_complete', { type: 'ugc_video_ad', demo: false, phase: 'cache_hit' });
        return;
      }

      if (isDemoActive) {
        await new Promise((r) => setTimeout(r, 2000));
        setProjectId('demo_project_ugc');
        setScripts(MOCK_SCRIPTS);
        setSelectedScriptIndex(null);
        advanceStep('scripts_ready', 2);
        track('creative_studio_generation_complete', { type: 'ugc_video_ad', demo: true, phase: 'analyze' });
        return;
      }

      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/ugc-video-ad/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productImageUrl: imageUrl,
          productDescription: productDescription.trim(),
          productName: productName.trim() || undefined,
        }),
      });

      // P1: Detect credit exhaustion
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}));
        setCreditsLeft(body.creditsLeft ?? 0);
        setShowCreditsModal(true);
        advanceStep('upload', 0);
        track('creative_studio_generation_error', { type: 'ugc_video_ad', error: 'NO_CREDITS' });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }

      const data: AnalyzeResponse = await res.json();
      setProjectId(data.projectId);
      setScripts(data.scripts);
      setSelectedScriptIndex(null);
      setCreditsLeft((data as any).creditsLeft ?? null);

      // P2: Cache the scripts for future reuse
      setCachedScripts(imageUrl, productDescription.trim(), data.projectId, data.scripts);

      advanceStep('scripts_ready', 2);
      track('creative_studio_generation_complete', { type: 'ugc_video_ad', demo: false, phase: 'analyze' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'analyse";
      setError(msg);
      advanceStep('upload', 0);
      setIsUploading(false);
      track('creative_studio_generation_error', { type: 'ugc_video_ad', error: String(err) });
      toast.error("Erreur d'analyse", { description: msg });
    }
  }, [productDescription, productName, productImage, isDemoActive, uploadImage, getAuthHeaders, track, advanceStep]);

  // ── Generate (with Luma progress tracking) ─────────────────────────────────

  const handleGenerate = useCallback(async (variantIndex: number) => {
    setError('');
    advanceStep('generating', 3);
    setElapsedSeconds({ [variantIndex]: 0 });

    const placeholderVariants: VideoVariant[] = scripts.map((_s, i) => ({
      index: i,
      status: i === variantIndex || variantIndex === 0 ? ('processing' as const) : ('queued' as const),
      generationId: '', videoUrl: '', aspectRatio: i === 0 ? aspectRatio : '9:16',
      visualPrompt: '', errorMessage: '',
      progress: 0, elapsedSeconds: 0,
    }));
    setVariants(placeholderVariants);

    // P1: Luma progress timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[Number(key)] = (next[Number(key)] ?? 0) + 1;
        }
        return next;
      });
    }, 1000);

    if (isDemoActive) {
      let completedCount = 0;
      pollRef.current = setInterval(() => {
        completedCount++;
        const progress = Math.min(completedCount * 33, 99);
        setVariants((prev) =>
          prev.map((v, i) => {
            if (i < completedCount && MOCK_VIDEOS[i]) return { ...MOCK_VIDEOS[i], status: 'completed' as const, progress: 100 };
            if (i === completedCount && MOCK_VIDEOS[i]) return { ...MOCK_VIDEOS[i], status: 'processing' as const, progress };
            return v;
          }),
        );
        if (completedCount >= MOCK_VIDEOS.length) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          advanceStep('completed', 4);
          track('creative_studio_generation_complete', { type: 'ugc_video_ad', demo: true, phase: 'generate' });
        }
      }, 2500);
      return;
    }

    try {
      const headers = await getAuthHeaders();

      // P1: Detect credit exhaustion before even launching
      const generatePromises = scripts.map(async (_script, i) => {
        const res = await fetch(`${BACKEND_URL}/api/ugc-video-ad/generate`, {
          method: 'POST', headers,
          body: JSON.stringify({ projectId, variantIndex: i, aspectRatio: i === 0 ? aspectRatio : '9:16' }),
        });
        if (res.status === 402) {
          const body = await res.json().catch(() => ({}));
          setCreditsLeft(body.creditsLeft ?? 0);
          setShowCreditsModal(true);
          throw new Error('NO_CREDITS');
        }
        if (!res.ok) throw new Error(`Erreur variant ${i}`);
        return res.json();
      });

      const results = await Promise.allSettled(generatePromises);

      // Check if ALL failed due to credits
      if (results.every((r) => r.status === 'rejected' && (r.reason as Error)?.message === 'NO_CREDITS')) {
        advanceStep('upload', 0);
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      setVariants((prev) =>
        prev.map((v, i) => {
          const r = results[i];
          if (r.status === 'fulfilled') {
            const val = (r.value as any);
            return val?.variants?.[0] ?? { ...v, status: 'processing' as const, progress: 10 };
          }
          const reasonMsg = (r.status === 'rejected' ? (r.reason as Error)?.message : '') ?? '';
          if (reasonMsg === 'NO_CREDITS') return { ...v, status: 'failed' as const, errorMessage: 'Crédits épuisés' };
          return { ...v, status: 'failed' as const, errorMessage: 'Échec du lancement' };
        }),
      );

      // P1: Poll with progress tracking
      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        try {
          const statusRes = await fetch(`${BACKEND_URL}/api/ugc-video-ad/status/${projectId}`, { headers });
          if (!statusRes.ok) return;
          const statusData: StatusResponse = await statusRes.json();
          const fetchedVariants = statusData.videoVariants as VideoVariant[];

          if (fetchedVariants) {
            // Enrich with progress estimate based on poll count
            const enriched = fetchedVariants.map((v) => {
              let progress = v.progress ?? 0;
              if (v.status === 'processing' && progress === 0) {
                progress = Math.min(pollCount * 8, 95); // ~8% per 3s = ~37s total estimate
              }
              if (v.status === 'completed') progress = 100;
              return { ...v, progress };
            });
            setVariants(enriched);

            if (enriched.every((v) =>
              v.status === 'completed' || v.status === 'failed' || v.status === 'error' || v.status === 'pending'
            )) {
              if (pollRef.current) clearInterval(pollRef.current);
              if (timerRef.current) clearInterval(timerRef.current);
              advanceStep('completed', 4);
              track('creative_studio_generation_complete', { type: 'ugc_video_ad', demo: false, phase: 'generate' });
            }
          }
        } catch { /* silent retry */ }
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de génération';
      setError(msg);
      advanceStep('upload', 0);
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      track('creative_studio_generation_error', { type: 'ugc_video_ad', error: String(err) });
      toast.error('Erreur', { description: msg });
    }
  }, [scripts, projectId, aspectRatio, isDemoActive, getAuthHeaders, track, advanceStep]);

  // ── Platform publish (P2: multi-platform export) ───────────────────────────

  const handlePublishToPlatform = useCallback((platform: 'tiktok' | 'instagram' | 'youtube') => {
    const selected = selectedScriptIndex !== null ? scripts[selectedScriptIndex] : scripts[0] ?? null;
    const completedVariant = variants.find((v) => v.status === 'completed');
    const params = new URLSearchParams();
    params.set('source', 'ugc_video_ad');
    params.set('platform', platform);
    if (projectId) params.set('projectId', projectId);
    if (selected) params.set('prefill', selected.fullScript);
    if (completedVariant?.videoUrl) params.set('videoUrl', completedVariant.videoUrl);
    // Navigate to the cockpit/create-post with prefill
    const destination = platform === 'youtube' ? '/cockpit' : '/calendrier';
    navigate({ to: `${destination}?${params.toString()}` });
    const labels: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram Reels', youtube: 'YouTube Shorts' };
    toast.success(`Redirection vers le module ${labels[platform]}…`);
  }, [scripts, selectedScriptIndex, variants, projectId, navigate]);

  // ── Schedule ───────────────────────────────────────────────────────────────

  const handleSchedule = useCallback(() => {
    const selected = selectedScriptIndex !== null ? scripts[selectedScriptIndex] : null;
    const completedVariant = variants.find((v) => v.status === 'completed');
    const params = new URLSearchParams();
    if (selected) params.set('prefill', selected.fullScript);
    params.set('source', 'ugc_video_ad');
    if (projectId) params.set('projectId', projectId);
    if (completedVariant?.videoUrl) params.set('videoUrl', completedVariant.videoUrl);
    navigate({ to: `/calendrier?${params.toString()}` });
    toast.success('Redirection vers le calendrier…');
  }, [scripts, selectedScriptIndex, variants, projectId, navigate]);

  // ── Variant voting (P3) ───────────────────────────────────────────────────

  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  const handleVote = useCallback((variantIndex: number, rating: number) => {
    if (userVotes[variantIndex] !== undefined) {
      toast.error('Vous avez déjà voté pour cette variante');
      return;
    }
    castVote(projectId, variantIndex, rating);
    setUserVotes((prev) => ({ ...prev, [variantIndex]: rating }));
    toast.success(`Vote enregistré — ${rating} étoile(s)`);
  }, [projectId, userVotes]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const winner = step === 'completed' ? getWinnerIndex(projectId) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Camera size={17} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">UGC Video Ads</h2>
            <p className="text-[11px] text-muted-foreground">Créez des vidéos UGC à partir de votre produit</p>
          </div>
          {creditsLeft !== null && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-muted/50 border border-border px-2.5 py-1">
              <Zap size={11} className="text-amber-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">{creditsLeft} crédits</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {step !== 'upload' && <StepIndicator currentStep={stepIndex} steps={STEPS} />}

          {/* Cache hit badge */}
          {cachedHit && step === 'scripts_ready' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 mb-4 flex items-center gap-2">
              <Zap size={13} className="text-amber-600 shrink-0" />
              <p className="text-[11px] font-medium text-amber-700">
                Scripts récupérés du cache — 0 crédit débité
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Upload ─────────────────────────────────────────────────── */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Photo du produit</label>
                  <label
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
                      productImagePreview
                        ? 'border-primary/30 bg-muted/20 p-0 aspect-square max-w-[300px] mx-auto'
                        : 'border-border hover:border-primary/40 bg-muted/10 py-10 px-6'
                    }`}
                  >
                    {productImagePreview ? (
                      <ResponsiveImage
                        src={productImagePreview}
                        alt="Aperçu du produit à analyser"
                        width={1024}
                        height={1024}
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Upload size={22} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Déposez votre image ici</p>
                          <p className="text-[11px] text-muted-foreground mt-1">PNG, JPEG ou WebP — 10 Mo max</p>
                        </div>
                      </div>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={handleImagePick} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Télécharger une image du produit" />
                  </label>
                  {productImagePreview && (
                    <button type="button" onClick={() => { setProductImage(null); setProductImagePreview(''); }} className="mx-auto block text-[10px] text-muted-foreground hover:text-destructive transition-colors mt-1">
                      Supprimer l'image
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom du produit <span className="font-normal text-muted-foreground/40">(optionnel)</span></label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Crème Hydratante Premium" className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description du produit</label>
                  <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Décrivez votre produit en une phrase…" rows={3} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none" />
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <Button onClick={handleAnalyze} disabled={isUploading || !productDescription.trim() || !productImage} className="w-full h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                  {isUploading ? <><Loader2 size={15} className="animate-spin" /> Téléchargement…</> : <><Sparkles size={15} /> Analyser mon produit</>}
                </Button>
              </motion.div>
            )}

            {/* ── Analyzing ──────────────────────────────────────────────── */}
            {step === 'analyzing' && <TypingAnalyzeSkeleton key="analyzing" />}

            {/* ── Scripts Ready ──────────────────────────────────────────── */}
            {step === 'scripts_ready' && (
              <motion.div key="scripts_ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Format vidéo</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ASPECT_RATIOS.map((ar) => (
                      <button key={ar.id} type="button" onClick={() => setAspectRatio(ar.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                          aspectRatio === ar.id ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}>
                        <ar.icon size={12} />{ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Choisissez un angle marketing</label>
                  <div className="space-y-2">
                    {scripts.map((script, i) => (
                      <ScriptCard key={i} script={script} index={i} isSelected={selectedScriptIndex === i}
                        onSelect={() => setSelectedScriptIndex(i)}
                        onGenerate={() => { setSelectedScriptIndex(i); handleGenerate(i); }}
                        isGenerating={false} />
                    ))}
                  </div>
                </div>

                <Button onClick={() => handleGenerate(0)} className="w-full h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                  <Sparkles size={15} />Générer toutes les vidéos
                </Button>
              </motion.div>
            )}

            {/* ── Generating (with Luma progress) ────────────────────────── */}
            {step === 'generating' && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Génération des vidéos en cours…</span>
                  {variants.some((v) => v.status === 'processing') && (
                    <span className="text-[10px] text-muted-foreground/60 ml-2 flex items-center gap-1">
                      <Timer size={11} />
                      {Math.max(...Object.values(elapsedSeconds))}s écoulées
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {variants.map((variant, i) => (
                    <VideoVariantCard
                      key={variant.generationId || i}
                      variant={variant}
                      script={scripts[i]}
                      elapsedSeconds={elapsedSeconds[i] ?? 0}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Completed ──────────────────────────────────────────────── */}
            {step === 'completed' && (
              <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Vidéos générées avec succès !</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {variants.filter((v) => v.status === 'completed').length} vidéo(s) prête(s) à être publiée(s).
                    </p>
                  </div>
                </div>

                {/* P3: A/B Winner badge */}
                {winner !== null && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-600" />
                    <p className="text-xs font-semibold text-amber-800">
                      Variante gagnante d'après les votes : {scripts[winner]?.angle ?? `#${winner + 1}`}
                    </p>
                  </div>
                )}

                {/* P2: Multi-platform export pills + P3: ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {variants.filter((v) => v.status === 'completed').map((variant, i) => (
                    <div key={variant.generationId || i} className="space-y-2">
                      <VideoVariantCard
                        variant={variant}
                        script={scripts[variant.index]}
                        elapsedSeconds={0}
                      />
                      {/* P3: Star rating */}
                      <VariantRatingBar
                        variantIndex={variant.index}
                        votes={getVotes(projectId)}
                        userVote={userVotes[variant.index]}
                        onVote={handleVote}
                        isWinner={winner === variant.index}
                      />
                    </div>
                  ))}
                </div>

                {variants.some((v) => v.status === 'failed' || v.status === 'error') && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive mb-2">
                      {variants.filter((v) => v.status === 'failed' || v.status === 'error').length} échec(s)
                    </p>
                    {variants.filter((v) => v.status === 'failed' || v.status === 'error').map((v) => (
                      <p key={v.index} className="text-[11px] text-muted-foreground">
                        Variant {scripts[v.index]?.angle ?? v.index + 1} : {v.errorMessage || 'Erreur inconnue'}
                      </p>
                    ))}
                  </div>
                )}

                {/* P2: Platform export section */}
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Publier sur les plateformes
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformPublishButton
                      platform="tiktok"
                      label="TikTok"
                      icon={<Send size={13} />}
                      onClick={() => handlePublishToPlatform('tiktok')}
                    />
                    <PlatformPublishButton
                      platform="instagram"
                      label="Instagram Reels"
                      icon={<Send size={13} />}
                      onClick={() => handlePublishToPlatform('instagram')}
                    />
                    <PlatformPublishButton
                      platform="youtube"
                      label="YouTube Shorts"
                      icon={<Send size={13} />}
                      onClick={() => handlePublishToPlatform('youtube')}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleSchedule} className="flex-1 h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">
                    <Calendar size={14} />Planifier la publication
                  </Button>
                  <Button variant="outline" onClick={resetState} className="flex-1 h-10 gap-2 font-semibold text-sm">
                    <RefreshCw size={14} />Nouvelle génération
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* P1: Credits exhausted modal */}
      <CreditsTopUpModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </>
  );
}

// ── Platform Publish Button (P2) ──────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'border-[#ff0050]/30 bg-[#ff0050]/5 text-[#ff0050] hover:bg-[#ff0050]/10',
  instagram: 'border-[#E1306C]/30 bg-[#E1306C]/5 text-[#E1306C] hover:bg-[#E1306C]/10',
  youtube: 'border-[#FF0000]/30 bg-[#FF0000]/5 text-[#FF0000] hover:bg-[#FF0000]/10',
};

function PlatformPublishButton({
  platform, label, icon, onClick,
}: {
  platform: string; label: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${PLATFORM_COLORS[platform] ?? 'border-border bg-card text-foreground'}`}
    >
      {icon}
      {label}
      <ExternalLink size={10} />
    </button>
  );
}

// ── Variant Rating Bar (P3) ───────────────────────────────────────────────────

function VariantRatingBar({
  variantIndex, votes, userVote, onVote, isWinner,
}: {
  variantIndex: number;
  votes: Record<number, { total: number; count: number }>;
  userVote: number | undefined;
  onVote: (variantIndex: number, rating: number) => void;
  isWinner: boolean;
}) {
  const v = votes[variantIndex];
  const avg = v && v.count > 0 ? (v.total / v.count).toFixed(1) : null;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            title={`${star} étoile(s)`}
            onClick={() => onVote(variantIndex, star)}
            disabled={userVote !== undefined}
            className={`transition-all duration-150 ${userVote !== undefined ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
          >
            <StarIcon
              size={14}
              className={
                userVote !== undefined
                  ? star <= userVote
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/25'
                  : 'text-muted-foreground/40 hover:text-amber-400'
              }
            />
          </button>
        ))}
      </div>
      {avg ? (
        <span className={`text-[10px] font-mono font-bold ${isWinner ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {avg} ({v!.count} vote{v!.count > 1 ? 's' : ''})
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground/40">Pas encore de votes</span>
      )}
      {isWinner && <TrendingUp size={11} className="text-amber-500 ml-auto" />}
    </div>
  );
}
