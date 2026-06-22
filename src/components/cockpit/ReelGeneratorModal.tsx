/**
 * ReelGeneratorModal — AI video generation for Reels / short-form content.
 * Triggered from the Radar Local "Conseil Stratégique" CTA or Cockpit IA.
 *
 * Phase 0 : Prompt builder (context pre-filled from strategic advice)
 * Phase 1 : Generating (animated progress with estimated steps)
 * Phase 2 : Result player + download + publish CTA
 */
import { useState, useRef } from 'react';
import { X, Video, Sparkles, Download, Upload, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'form' | 'generating' | 'done' | 'error';

type AspectRatio = '9:16' | '1:1' | '16:9';
type Duration    = '4s' | '6s' | '8s';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-filled from the strategic tip (e.g. competitor name + context) */
  prefillContext?: string;
  /** Business sector / establishment name for richer prompts */
  establishmentName?: string;
}

// ── Prompt ideas ──────────────────────────────────────────────────────────────

const PROMPT_IDEAS = [
  'Arrière-cuisine en action : mains qui pétrissent la pâte, buée, farine en suspension, lumière dorée',
  'Transformation produit en time-lapse : ingrédients bruts → plat final sublime, 4K, vertical',
  'Accueil client souriant, devanture lumineuse, logo flottant en incrustation, musique entraînante',
  'Produit signature sous tous les angles, macro lent, reflets, packaging premium',
  'Avant/Après : espace vide → décoration complète, transition rapide, effet wow',
  'Équipe au travail, ambiance conviviale, gros plans sur le savoir-faire, texte animé "Fait maison"',
];

const ASPECT_LABELS: Record<AspectRatio, string> = {
  '9:16': '📱 Reel / Story (9:16)',
  '1:1':  '⬜ Carré Instagram (1:1)',
  '16:9': '🖥️ Paysage YouTube (16:9)',
};

const DURATION_LABELS: Record<Duration, string> = {
  '4s': '4 sec — Accroche rapide',
  '6s': '6 sec — Format Reel standard',
  '8s': '8 sec — Storytelling court',
};

// ── Generation progress steps ─────────────────────────────────────────────────

const GEN_STEPS = [
  'Analyse du contexte stratégique…',
  'Création du storyboard IA…',
  'Génération des images clés…',
  'Assemblage des séquences vidéo…',
  'Application de la bande-son…',
  'Rendu final et optimisation…',
];

// ── Character counter badge ───────────────────────────────────────────────────

function CharCount({ text }: { text: string }) {
  const n = text.length;
  return (
    <span className={cn('text-[10px] font-mono tabular-nums', n > 400 ? 'text-red-500' : 'text-muted-foreground')}>
      {n}/400
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReelGeneratorModal({ open, onClose, prefillContext = '', establishmentName = 'votre établissement' }: Props) {
  const [phase, setPhase]           = useState<Phase>('form');
  const [prompt, setPrompt]         = useState(prefillContext);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [duration, setDuration]     = useState<Duration>('6s');
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [useImage, setUseImage]     = useState(false);
  const [videoUrl, setVideoUrl]     = useState('');
  const [genStep, setGenStep]       = useState(0);
  const [errorMsg, setErrorMsg]     = useState('');
  const fileRef                     = useRef<HTMLInputElement>(null);
  const stepTimerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!open) return null;

  // ── Prompt builder ────────────────────────────────────────────────────────

  const fullPrompt = `${prompt.trim()}. Commerce local français (${establishmentName}). Style : cinématique, vertical, lumière naturelle chaude, professionnel. Format court-vidéo optimisé réseaux sociaux.`;

  // ── Step ticker during generation ─────────────────────────────────────────

  function startStepTicker() {
    let i = 0;
    setGenStep(0);
    stepTimerRef.current = setInterval(() => {
      i++;
      if (i < GEN_STEPS.length) setGenStep(i);
      else { clearInterval(stepTimerRef.current!); }
    }, 8000); // one new step ~every 8s over the ~50s generation
  }

  function stopStepTicker() {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Décrivez le Reel à créer.'); return; }

    setPhase('generating');
    startStepTicker();

    try {
      let result;

      if (useImage && imageFile) {
        // I2V: upload first, then animate
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const { publicUrl } = await blink.storage.upload(
          imageFile,
          `reel-images/${Date.now()}.${ext}`
        );
        const res = await blink.ai.generateVideo({
          model: 'fal-ai/veo3.1/fast/image-to-video',
          image_url: publicUrl,
          prompt: fullPrompt,
          aspect_ratio: aspectRatio,
          duration,
          generate_audio: true,
        });
        result = res.result;
      } else {
        // T2V: text-to-video
        const res = await blink.ai.generateVideo({
          model: 'fal-ai/veo3.1/fast',
          prompt: fullPrompt,
          aspect_ratio: aspectRatio,
          duration,
          generate_audio: true,
        });
        result = res.result;
      }

      stopStepTicker();
      setVideoUrl(result.video.url);
      setPhase('done');
      toast.success('Reel généré avec succès ! 🎬');

    } catch (err) {
      stopStepTicker();
      const errMsg = (err as any)?.message ?? '';
      const is401 = errMsg.includes('401');
      const msg = is401
        ? 'Authentification requise. Veuillez vous connecter.'
        : errMsg || 'Génération échouée. Réessayez dans quelques instants.';

      if (is401) blink.auth.login(window.location.href);
      setErrorMsg(msg);
      setPhase('error');
      toast.error('Erreur de génération', { description: msg });
    }
  };

  const handleReset = () => {
    setPhase('form');
    setVideoUrl('');
    setErrorMsg('');
    setGenStep(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-sm" onClick={() => phase !== 'generating' && onClose()} />

      {/* Modal */}
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0 bg-gradient-to-r from-violet-600/10 to-pink-500/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
              <Video size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-foreground">Générateur de Reel IA 🎬</p>
              <p className="text-[11px] text-muted-foreground">Veo 3.1 · Vidéo verticale optimisée réseaux sociaux</p>
            </div>
            {phase !== 'generating' && (
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* ── FORM ── */}
            {phase === 'form' && (
              <>
                {/* Prompt textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Décrivez votre Reel *</label>
                    <CharCount text={prompt} />
                  </div>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    maxLength={400}
                    rows={4}
                    placeholder="Ex: Arrière-cuisine en action, mains qui pétrissent la pâte, lumière dorée, ambiance chaleureuse…"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                  {/* Quick ideas */}
                  <div className="flex gap-1.5 flex-wrap">
                    {PROMPT_IDEAS.slice(0, 3).map((idea, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(idea)}
                        className="text-[10px] font-medium px-2 py-1 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all truncate max-w-[200px]"
                      >
                        {idea.slice(0, 40)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Format</label>
                    <div className="space-y-1.5">
                      {(Object.entries(ASPECT_LABELS) as [AspectRatio, string][]).map(([k, v]) => (
                        <label key={k} className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-all select-none',
                          aspectRatio === k ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/70'
                        )}>
                          <input type="radio" name="aspect" checked={aspectRatio === k} onChange={() => setAspectRatio(k)} className="w-3.5 h-3.5 accent-primary" />
                          <span className="text-xs font-medium text-foreground leading-tight">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Durée</label>
                    <div className="space-y-1.5">
                      {(Object.entries(DURATION_LABELS) as [Duration, string][]).map(([k, v]) => (
                        <label key={k} className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-all select-none',
                          duration === k ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/70'
                        )}>
                          <input type="radio" name="duration" checked={duration === k} onChange={() => setDuration(k)} className="w-3.5 h-3.5 accent-primary" />
                          <span className="text-xs font-medium text-foreground leading-tight">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional image upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={useImage} onChange={e => setUseImage(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                    <span className="text-xs font-semibold text-foreground">Animer une photo de mon commerce (Image → Vidéo)</span>
                  </label>
                  {useImage && (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 hover:bg-primary/5 py-4 text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Upload size={16} />
                        {imageFile ? imageFile.name : 'Choisir une photo (JPG, PNG)'}
                      </button>
                    </>
                  )}
                </div>

                {/* Quality note */}
                <div className="flex items-start gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 px-3.5 py-2.5">
                  <Sparkles size={13} className="text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-snug">
                    <span className="font-bold">Modèle Veo 3.1 Fast</span> — génération en ~30-60 secondes · 9:16 vertical optimisé Instagram Reels &amp; TikTok · Son inclus
                  </p>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white text-sm font-extrabold py-3.5 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Video size={16} />
                  Générer mon Reel avec l'IA ✨
                </button>
              </>
            )}

            {/* ── GENERATING ── */}
            {phase === 'generating' && (
              <div className="space-y-5 py-4">
                {/* Animated loader */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                      <Video size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Génération en cours…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Environ 30 à 60 secondes · Veo 3.1</p>
                  </div>
                </div>

                {/* Step progress */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {GEN_STEPS.map((step, i) => {
                    const done   = i < genStep;
                    const active = i === genStep;
                    return (
                      <div key={i} className={cn('flex items-center gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 transition-colors', active && 'bg-violet-50 dark:bg-violet-950/20')}>
                        <div className="shrink-0">
                          {done
                            ? <Check size={13} className="text-emerald-500" />
                            : active
                              ? <span className="inline-block w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-500 rounded-full animate-spin" />
                              : <span className="w-3.5 h-3.5 rounded-full border border-border bg-muted/40 inline-block" />
                          }
                        </div>
                        <p className={cn('text-xs', done ? 'text-foreground font-medium' : active ? 'text-foreground font-semibold' : 'text-muted-foreground/50')}>
                          {step}
                        </p>
                        {done && <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">OK</span>}
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  Ne fermez pas cette fenêtre · Génération via Google Veo 3.1
                </p>
              </div>
            )}

            {/* ── DONE ── */}
            {phase === 'done' && videoUrl && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
                    <Check size={12} strokeWidth={3} /> Reel généré avec succès !
                  </div>
                  <p className="text-xs text-muted-foreground">Prévisualisez, téléchargez ou publiez directement</p>
                </div>

                {/* Video player */}
                <div className="flex justify-center">
                  <div className={cn(
                    'rounded-2xl overflow-hidden border-2 border-border bg-black shadow-xl',
                    aspectRatio === '9:16' ? 'w-48' : aspectRatio === '1:1' ? 'w-64' : 'w-full'
                  )}>
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={cn('w-full', aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video')}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={videoUrl}
                    download="reel-kompilot.mp4"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 hover:bg-muted text-sm font-semibold text-foreground py-2.5 transition-colors"
                  >
                    <Download size={14} /> Télécharger
                  </a>
                  <button
                    onClick={() => { toast.success('Reel ajouté à la file de publication 🎬'); onClose(); }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold py-2.5 shadow-md transition-all hover:brightness-110"
                  >
                    <Sparkles size={14} /> Publier ce Reel
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
                >
                  <RefreshCw size={11} /> Générer un autre Reel
                </button>
              </div>
            )}

            {/* ── ERROR ── */}
            {phase === 'error' && (
              <div className="space-y-4 py-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle size={24} className="text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Génération échouée</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold text-foreground py-2.5 hover:bg-muted transition-colors">
                    <RefreshCw size={13} /> Réessayer
                  </button>
                  <button onClick={onClose} className="flex-1 rounded-xl bg-muted text-sm font-semibold text-muted-foreground py-2.5 hover:bg-muted/70 transition-colors">
                    Fermer
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
