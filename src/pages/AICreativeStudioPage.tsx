/**
 * AICreativeStudioPage — AI Creative Studio
 * ─────────────────────────────────────────
 * 1. AI Image Generation (DALL-E style via Blink AI)
 * 2. Video Script / UGC Storyboard Generator
 * 3. Smart Watermark (logo upload + auto-apply)
 *
 * Completing any generation marks the Creative Factory step ✅ in the Growth Checklist.
 */
import { useState, useRef } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, toast } from '@blinkdotnew/ui';
import { Sparkles, Wand2, Video, Image as ImageIcon, Upload, Download, RotateCcw, Copy, Check, ChevronDown, ChevronUp, Layers, Type, TrendingUp } from 'lucide-react';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
// MODULE 2: Typography Studio
import { TypographyStudioPanel } from '../components/cockpit/TypographyStudioPanel';
// MODULE NEW: Data-Driven AI Ads
import { DataDrivenAIAds } from '../components/cockpit/DataDrivenAIAds';
// MODULE: UGC Script Generator
import { UGCScriptSection } from '../components/cockpit/UGCScriptSection';
// MODULE: Enhanced UGC Script Panel (Hook → Body → CTA)
import { UGCScriptPanel } from '../components/creative/UGCScriptPanel';
// MODULE: URL-to-Video Ingestion
import { URLToVideoSection } from '../components/creative/URLToVideoSection';
// MODULE: Générateur d'annonces sectorielles (identique landing page)
import { KompilotAdGenerator } from '../components/landing/KompilotAdGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────

type Format = '1:1' | '9:16' | '4:3';
type Tab = 'image' | 'video' | 'watermark' | 'urltovideo' | 'ugc_hook';

interface GeneratedImage {
  url: string;
  prompt: string;
  format: Format;
}

interface UGCHook {
  type: 'pattern_interrupt' | 'problem' | 'result';
  label: string;
  emoji: string;
  text: string;
  direction: string; // stage direction
}

interface UGCScript {
  hooks: UGCHook[];
  demo: {
    scene: string;
    lines: string[];
    transition: string;
  };
  cta: {
    text: string;
    direction: string;
  };
  format: string;
  duration: string;
  broll: Array<{
    seq: number;
    shot: string;
    duration: string;
    instruction: string;
  }>;
  avatar_tips: string;
}

// Legacy type kept for internal parsing
interface VideoScript {
  hook:   string;
  body:   string;
  cta:    string;
  format: string;
  broll?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<Format, string> = {
  '1:1':  '📷 Carré 1:1 (Post)',
  '9:16': '📱 Vertical 9:16 (Story/Reel)',
  '4:3':  '🖥️ Paysage 4:3 (Google)',
};

const FORMAT_SIZES: Record<Format, string> = {
  '1:1':  '1024x1024',
  '9:16': '1024x1536',
  '4:3':  '1536x1024',
};

function markCreativeGenerated(userId: string) {
  try { localStorage.setItem(`ai_creative_generated_${userId}`, '1'); } catch { /* noop — incognito strict mode */ }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AICreativeStudioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab | 'typography' | 'datadrivenads' | 'secteurs'>('image');

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>🎨 AI Creative Studio</PageTitle>
            <PageDescription>
              Générez des visuels, scripts vidéos et appliquez votre branding automatiquement
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full sm:w-fit mb-6 border border-border overflow-x-auto">
          {([
            { id: 'datadrivenads', label: '⚡ Data-Driven Ads', icon: TrendingUp, highlight: true },
            { id: 'secteurs',   label: '🎯 Secteurs IA',     icon: TrendingUp },
            { id: 'image',      label: '🖼️ Images IA',       icon: ImageIcon },
            { id: 'video',      label: '🎬 Scripts Vidéos',  icon: Video },
            { id: 'ugc_hook',   label: '🎯 Script UGC',      icon: Sparkles },
            { id: 'urltovideo', label: '🔗 URL → Vidéo',     icon: Wand2 },
            { id: 'watermark',  label: '🔖 Smart Watermark', icon: Layers },
            { id: 'typography', label: '✏️ Studio Typo',      icon: Type },
          ] as { id: Tab | 'typography' | 'datadrivenads' | 'secteurs'; label: string; icon: any; highlight?: boolean }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'datadrivenads' && <DataDrivenAIAds />}
        {activeTab === 'secteurs'   && <KompilotAdGenerator variant="dashboard" />}
        {activeTab === 'image'      && <ImageGeneratorSection userId={user?.id} />}
        {activeTab === 'video'      && <UGCScriptSection       userId={user?.id} />}
        {activeTab === 'watermark'  && <WatermarkSection      userId={user?.id} />}
        {/* MODULE: URL-to-Video Ingestion */}
        {activeTab === 'urltovideo' && (
          <URLToVideoSection userId={user?.id} />
        )}
        {/* MODULE: Enhanced UGC Script (Hook → Body → CTA) */}
        {activeTab === 'ugc_hook' && (
          <UGCScriptPanel />
        )}
        {/* MODULE 2: Typography Studio with Social Mirror */}
        {activeTab === 'typography' && (
          <TypographyStudioPanel
            onApply={(text, fmt) => {
              // Notify user of the applied formatting
              import('@blinkdotnew/ui').then(({ toast }) => {
                toast.success('Formatage appliqué !', {
                  description: `Police : ${fmt.font} · ${[fmt.bold && 'Gras', fmt.italic && 'Italique', fmt.underline && 'Souligné'].filter(Boolean).join(', ') || 'Normal'}`,
                });
              });
            }}
          />
        )}
      </PageBody>
    </Page>
  );
}

// ── Section 1: AI Image Generator ─────────────────────────────────────────────

function ImageGeneratorSection({ userId }: { userId?: string }) {
  const [prompt, setPrompt]       = useState('');
  const [format, setFormat]       = useState<Format>('1:1');
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState<GeneratedImage | null>(null);
  const [copied, setCopied]       = useState(false);

  const PROMPT_SUGGESTIONS = [
    'Un café parisien chaleureux avec des croissants fumants sur le comptoir, lumière dorée du matin',
    'Un restaurant gastronomique avec une assiette de cuisine raffinée, fond sombre élégant',
    'Une boutique moderne avec des vêtements colorés, ambiance tendance et lumineuse',
    'Une salle de sport high-tech avec équipements modernes, atmosphère motivante',
    'Un salon de coiffure luxueux, miroirs dorés, ambiance sophistiquée',
  ];

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Décrivez le visuel à générer');
      return;
    }
    setLoading(true);
    try {
      const size = FORMAT_SIZES[format] as '1024x1024' | '1024x1536' | '1536x1024';
      const result = await blink.ai.generateImage({
        prompt: `${prompt}. Style photoréaliste professionnel, haute qualité, éclairage studio.`,
        model:  'fal-ai/nano-banana-pro',
        size,
      });
      const url = (result as any)?.data?.[0]?.url ?? (result as any)?.[0]?.url ?? result;
      setGenerated({ url: url as string, prompt, format });
      if (userId) markCreativeGenerated(userId);
      toast.success('🎨 Visuel généré avec succès !');
    } catch (err: any) {
      // If session expired, redirect to login instead of showing a cryptic error
      if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
        toast.error('Session expirée — reconnexion requise');
        blink.auth.login();
        return;
      }
      toast.error('Erreur de génération : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — controls */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Wand2 size={16} className="text-primary" /> Générer une image par IA
          </h2>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Décrivez votre visuel
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ex: Un café chaleureux avec des croissants, lumière dorée du matin, style photoréaliste…"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
              Inspirations rapides
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground px-2.5 py-1 rounded-lg border border-border hover:border-primary/20 transition-all"
                >
                  {s.split(',')[0].slice(0, 32)}…
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Format de l'image
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(FORMAT_LABELS) as [Format, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                    format === f
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <span className="text-lg">{label.split(' ')[0]}</span>
                  <span className="leading-tight text-center">{label.slice(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full gap-2 h-12 text-base"
          >
            {loading ? (
              <><span className="animate-spin">⟳</span> Génération en cours…</>
            ) : (
              <><Sparkles size={16} /> Générer le visuel</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
            ✍️ En validant ce contenu IA, vous en acceptez l'entière responsabilité éditoriale.
          </p>
        </div>
      </div>

      {/* Right — preview */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center min-h-[400px]">
        {!generated ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ImageIcon size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              Votre visuel IA apparaîtra ici
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className={`overflow-hidden rounded-xl border border-border mx-auto ${
              generated.format === '9:16' ? 'max-w-[220px]' :
              generated.format === '4:3'  ? 'max-w-full' :
                                            'max-w-[320px]'
            }`}>
              <img
                src={generated.url}
                alt={generated.prompt}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <a
                href={generated.url}
                download="kompilot-image.png"
                className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Download size={13} /> Télécharger
              </a>
              <button
                onClick={() => { setGenerated(null); setPrompt(''); }}
                className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                <RotateCcw size={13} /> Réinitialiser
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generated.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copié !' : 'Copier URL'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-4">
              Format : {FORMAT_LABELS[generated.format]} · {FORMAT_SIZES[generated.format]}px
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 2: Video Script / UGC Generator ───────────────────────────────────

function VideoScriptSection({ userId }: { userId?: string }) {
  const [topic,    setTopic]    = useState('');
  const [sector,   setSector]   = useState('restaurant');
  const [tone,     setTone]     = useState('dynamique');
  const [loading,  setLoading]  = useState(false);
  const [script,   setScript]   = useState<VideoScript | null>(null);
  const [expanded, setExpanded] = useState<string | null>('hook');

  const SECTORS = ['Restaurant', 'Coiffeur', 'Médical', 'Boutique', 'Salle de sport', 'Autre'];
  const TONES   = ['Dynamique', 'Professionnel', 'Fun & Décalé', 'Inspirant', 'Urgence / Promo'];

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error('Décrivez le sujet de votre vidéo');
      return;
    }
    setLoading(true);
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Tu es un expert en contenu viral TikTok/Instagram Reels pour des PME françaises.
Génère un script storyboard complet pour une vidéo courte (30-60s) sur ce sujet : "${topic}"
Secteur : ${sector}, Ton : ${tone}

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{
  "hook": "Le hook visuel accrocheur (3-5 secondes, description de l'action/visage/situation choc)",
  "body": "Le corps du message (ce qu'on montre/dit, 20-40 secondes, 3-4 points)",
  "cta": "L'appel à l'action final (5-10 secondes, texte exact à dire/afficher)",
  "format": "Format recommandé (ex: Reel vertical 9:16 • 45 secondes)",
  "broll": [
    "Action physique précise #1 : ce que le commerçant doit filmer avec son téléphone (ex: Filmez vos mains en train de préparer...)",
    "Action physique précise #2 : plan produit ou service en gros plan (ex: Zoomez lentement sur...)",
    "Action physique précise #3 : plan d'ambiance ou client satisfait (ex: Filmez l'entrée de votre établissement...)"
  ]
}`,
        model: 'gpt-4.1-mini',
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse inattendu');
      const parsed: VideoScript = JSON.parse(jsonMatch[0]);
      setScript(parsed);
      if (userId) markCreativeGenerated(userId);
      toast.success('🎬 Script généré !');
    } catch (err: any) {
      toast.error('Erreur : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Video size={16} className="text-primary" /> Concepteur de Scripts UGC
        </h2>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Sujet de la vidéo</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={3}
            placeholder="Ex: Nouvelle offre découverte petit-déjeuner à 9€ ce weekend seulement…"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Secteur</label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {SECTORS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ton</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TONES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Génération…</> : <><Sparkles size={16} /> Générer le script</>}
        </Button>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
          ✍️ En validant ce contenu IA, vous en acceptez l'entière responsabilité éditoriale.
        </p>
      </div>

      {/* Script output */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {!script ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Video size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Votre script storyboard apparaîtra ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">📋 Script Storyboard</h3>
              <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/15 font-medium">
                {script.format}
              </span>
            </div>

            {[
              { key: 'hook', label: '🎣 Hook visuel',     emoji: '⚡', color: 'amber',   content: script.hook },
              { key: 'body', label: '📢 Corps du message', emoji: '💬', color: 'blue',    content: script.body },
              { key: 'cta',  label: '🚀 Appel à l\'action', emoji: '🎯', color: 'green', content: script.cta  },
            ].map(section => (
              <div
                key={section.key}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === section.key ? null : section.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{section.label}</span>
                  {expanded === section.key
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
                {expanded === section.key && (
                  <div className="px-4 py-3 text-sm text-foreground/80 leading-relaxed bg-background">
                    {section.content}
                    <button
                      onClick={() => navigator.clipboard.writeText(section.content)}
                      className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Copy size={11} /> Copier
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* ── B-Roll Shooting Guide ── */}
            {script.broll && script.broll.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border flex items-center gap-2">
                  <span className="text-base">📸</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Vos instructions de tournage (B-Rolls)</p>
                    <p className="text-[10px] text-muted-foreground">3 plans à filmer avec votre téléphone pour illustrer ce script</p>
                  </div>
                </div>
                <div className="divide-y divide-border/60">
                  {script.broll.slice(0, 3).map((instruction, idx) => (
                    <div key={idx} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed flex-1">{instruction}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 bg-amber-50/50 dark:bg-amber-950/10 flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    💡 Astuce : Filmez chaque plan en 3 secondes min. Mode portrait, lumière naturelle si possible.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setScript(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              <RotateCcw size={12} /> Régénérer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 3: Smart Watermark ─────────────────────────────────────────────────

function WatermarkSection({ userId }: { userId?: string }) {
  const [logoUrl,     setLogoUrl]     = useState(() => localStorage.getItem(`brand_logo_url_${userId}`) ?? '');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageUrl,    setImageUrl]    = useState('');
  const [position,   setPosition]    = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [opacity,    setOpacity]     = useState(80);
  const [uploading,  setUploading]   = useState(false);
  const [saved,      setSaved]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const POSITIONS = [
    { id: 'top-left',     label: '↖ Haut gauche' },
    { id: 'top-right',    label: '↗ Haut droite' },
    { id: 'bottom-left',  label: '↙ Bas gauche' },
    { id: 'bottom-right', label: '↘ Bas droite' },
  ] as const;

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Format non supporté — utilisez PNG, JPG ou WebP');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `logos/${userId ?? 'user'}/brand-logo.${ext}`;
      const uploadResult = await blink.storage.upload(file, path, { upsert: true });
      const url = typeof uploadResult === 'string' ? uploadResult : (uploadResult as any).publicUrl ?? (uploadResult as any).url;
      setLogoUrl(url);
      setLogoPreview(url);
      if (userId) localStorage.setItem(`brand_logo_url_${userId}`, url);
      toast.success('✅ Logo téléversé et enregistré');
    } catch (err: any) {
      toast.error('Erreur upload : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setUploading(false);
    }
  }

  function handleSaveSettings() {
    if (userId) {
      localStorage.setItem(`brand_logo_url_${userId}`, logoUrl);
      localStorage.setItem(`watermark_position_${userId}`, position);
      localStorage.setItem(`watermark_opacity_${userId}`, String(opacity));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Paramètres de branding sauvegardés');
  }

  const hasLogo = !!(logoUrl || logoPreview);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logo config */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Layers size={16} className="text-primary" /> Smart Watermark — Branding automatique
        </h2>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Téléversez votre logo PNG transparent. Il sera automatiquement incrusté sur vos visuels générés avant publication ou export.
        </p>

        {/* Logo upload */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Logo de votre marque</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all"
          >
            {hasLogo ? (
              <div className="space-y-2">
                <img
                  src={logoPreview ?? logoUrl}
                  alt="Logo"
                  className="h-16 object-contain mx-auto rounded-lg"
                />
                <p className="text-xs text-primary font-medium">Logo enregistré ✓ — Cliquer pour changer</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={24} className="text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  {uploading ? 'Téléversement…' : 'Cliquer pour téléverser votre logo'}
                </p>
                <p className="text-[11px] text-muted-foreground/50">PNG transparent recommandé · max 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Position du logo</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  position === p.id
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
            <span>Opacité du filigrane</span>
            <span className="text-primary font-bold">{opacity}%</span>
          </label>
          <input
            type="range"
            min={20}
            max={100}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
            <span>Subtil (20%)</span>
            <span>Visible (100%)</span>
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="w-full gap-2">
          {saved ? <><Check size={15} /> Sauvegardé !</> : 'Sauvegarder les paramètres de branding'}
        </Button>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Prévisualisation du watermark</h3>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">URL d'une image de test</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://exemple.com/image.jpg"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
            <img src={imageUrl} alt="Prévisualisation" className="w-full h-auto max-h-72 object-cover" />
            {hasLogo && (
              <div
                className={`absolute ${
                  position === 'top-left'     ? 'top-3 left-3'   :
                  position === 'top-right'    ? 'top-3 right-3'  :
                  position === 'bottom-left'  ? 'bottom-3 left-3':
                                               'bottom-3 right-3'
                } p-2 rounded-lg bg-background/80 backdrop-blur-sm`}
                style={{ opacity: opacity / 100 }}
              >
                <img src={logoPreview ?? logoUrl} alt="Logo" className="h-8 object-contain" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border h-48 flex items-center justify-center text-center">
            <div className="space-y-2">
              <ImageIcon size={28} className="text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Entrez une URL d'image pour prévisualiser</p>
            </div>
          </div>
        )}

        <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">ℹ️ Comment ça fonctionne</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Une fois votre logo enregistré, Kompilot l'incrustera automatiquement à chaque génération d'image IA. Vos paramètres (position + opacité) sont mémorisés pour toutes vos futures créations.
          </p>
        </div>
      </div>
    </div>
  );
}
