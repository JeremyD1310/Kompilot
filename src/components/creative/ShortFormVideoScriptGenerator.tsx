/**
 * ShortFormVideoScriptGenerator — Premium form panel for generating
 * short-form video scripts (Reels, TikTok, YouTube Shorts).
 *
 * Combines profile selector, format toggle, and smart inputs
 * with the Blink AI hook to produce production-ready scripts.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, UserCircle, Building2, Palette, Wand2, Loader2,
  Camera, Film, Zap, Target, ArrowRight,
} from 'lucide-react';
import { Button, Input, Textarea, toast } from '@blinkdotnew/ui';
import {
  useShortFormVideoScript,
  type UserProfile,
  type VideoFormat,
  type ShortFormScript,
  type ShortFormScriptInput,
} from '../../hooks/useShortFormVideoScript';
import { ShortFormVideoScriptResult } from './ShortFormVideoScriptResult';
import { useTelemetry } from '../../hooks/useTelemetry';

// ── Profile options ───────────────────────────────────────────────────────────

const PROFILES: Array<{ id: UserProfile; icon: typeof UserCircle; label: string; desc: string }> = [
  { id: 'professionnel', icon: UserCircle, label: 'Pro / Solo', desc: 'Acquisition locale, simplicité' },
  { id: 'agence', icon: Building2, label: 'Agence', desc: 'Scalabilité, ROI clients' },
  { id: 'createur', icon: Palette, label: 'Créateur', desc: 'Branding, viralité' },
];

const FORMATS: Array<{ id: VideoFormat; icon: typeof Camera; label: string; desc: string }> = [
  { id: 'broll', icon: Film, label: 'B-Roll / Stock', desc: 'Split-screen, text overlays, montage cinématique' },
  { id: 'facecam', icon: Camera, label: 'Face Caméra / UGC', desc: 'Incarné, jump cuts, sous-titres dynamiques' },
];

// ── Typing skeleton ───────────────────────────────────────────────────────────

function GenerationSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4 py-8"
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/8 animate-pulse" />
            <div className="w-24 h-3 rounded bg-white/8 animate-pulse" />
          </div>
          <div className="w-full h-4 rounded bg-white/5 animate-pulse" />
          <div className="w-3/4 h-3 rounded bg-white/5 animate-pulse" />
          <div className="w-5/6 h-3 rounded bg-white/5 animate-pulse" />
        </motion.div>
      ))}
      <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-2">
        <Loader2 size={13} className="animate-spin text-teal-400" />
        Génération du script short-form…
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ShortFormVideoScriptGenerator() {
  const track = useTelemetry();
  const mutation = useShortFormVideoScript();

  // Form state
  const [userProfile, setUserProfile] = useState<UserProfile>('professionnel');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('broll');
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [angleOrPainPoint, setAngleOrPainPoint] = useState('');

  // Result state
  const [result, setResult] = useState<ShortFormScript | null>(null);

  const handleGenerate = useCallback(() => {
    if (!productName.trim() || !targetAudience.trim() || !angleOrPainPoint.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    track('shortform_script_generate_click', {
      profile: userProfile,
      format: videoFormat,
      product: productName,
    });

    const input: ShortFormScriptInput = {
      userProfile,
      videoFormat,
      productName: productName.trim(),
      targetAudience: targetAudience.trim(),
      angleOrPainPoint: angleOrPainPoint.trim(),
    };

    mutation.mutate(input, {
      onSuccess: (data) => {
        setResult(data);
        track('shortform_script_generate_success', { profile: userProfile, format: videoFormat });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération');
        track('shortform_script_generate_error', { error: String(err) });
      },
    });
  }, [userProfile, videoFormat, productName, targetAudience, angleOrPainPoint, mutation, track]);

  const handleRegenerate = useCallback(() => {
    setResult(null);
    handleGenerate();
  }, [handleGenerate]);

  // ── Result view ─────────────────────────────────────────────────────────────

  if (result && !mutation.isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-white/60">Script généré avec succès</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResult(null)}
            className="text-xs text-white/40 hover:text-white/70"
          >
            ← Nouveau script
          </Button>
        </div>
        <ShortFormVideoScriptResult script={result} onRegenerate={handleRegenerate} />
      </div>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {mutation.isPending ? (
          <GenerationSkeleton key="skeleton" />
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} className="space-y-6">
            {/* Step 1: Profile */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                1. Ton profil
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PROFILES.map(p => {
                  const Icon = p.icon;
                  const active = userProfile === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setUserProfile(p.id)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all duration-150 ${
                        active
                          ? 'bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-500/10'
                          : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-teal-400' : 'text-white/40'} />
                      <span className={`text-xs font-bold ${active ? 'text-teal-300' : 'text-white/60'}`}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-white/30 leading-tight">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                2. Format vidéo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(f => {
                  const Icon = f.icon;
                  const active = videoFormat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setVideoFormat(f.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                          : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-cyan-400' : 'text-white/40'} />
                      <div>
                        <span className={`text-sm font-bold block ${active ? 'text-cyan-300' : 'text-white/70'}`}>
                          {f.label}
                        </span>
                        <span className="text-[10px] text-white/35 block mt-0.5">{f.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Inputs */}
            <div className="space-y-3.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50">
                3. Détails de la vidéo
              </label>
              <Input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Nom de la solution / marque"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10 text-sm"
              />
              <Input
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="Audience cible (ex: restaurateurs à Paris)"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10 text-sm"
              />
              <Textarea
                value={angleOrPainPoint}
                onChange={e => setAngleOrPainPoint(e.target.value)}
                placeholder="Point de douleur ou angle d'approche (ex: Tu perds des clients parce que tes avis Google ne sont pas répondus)"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 min-h-[80px] text-sm resize-none"
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!productName.trim() || !targetAudience.trim() || !angleOrPainPoint.trim()}
              className="w-full gap-2 h-11 text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                border: 'none',
                color: '#fff',
              }}
            >
              <Wand2 size={15} />
              Générer le script vidéo
              <ArrowRight size={14} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
