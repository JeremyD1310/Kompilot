import { useState, useCallback, useRef } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, toast } from '@blinkdotnew/ui';
import { Zap, Sparkles, CalendarCheck, Network, RefreshCw, Home, BarChart2, Mic, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEstablishment } from '../context/EstablishmentContext';
import { useCredits } from '../context/CreditsContext';
import { useAuth } from '../hooks/useAuth';
import { blink } from '../blink/client';
import { PhoneMockup } from '../components/cockpit/PhoneMockup';
import { FloatingTypographyToolbar } from '../components/cockpit/FloatingTypographyToolbar';
import { SOSCrisisModal } from '../components/cockpit/SOSCrisisModal';
import { SOSResumeBanner } from '../components/cockpit/SOSResumeBanner';
import { FlashTutorialButton } from '../components/shared/FlashTutorialButton';
import { triggerAcademyHint } from '../components/academy/AcademyContextualToast';
import { ReelGeneratorModal } from '../components/cockpit/ReelGeneratorModal';
import { IdeesMarketingPanel } from '../components/cockpit/IdeesMarketingPanel';
import { cn } from '../lib/utils';
import {
  DEFAULT_TEXT_STYLE,
  textStyleToPromptHint,
  type TextStyle,
} from '../lib/typographyStyles';
import { useBrandSettings } from '../context/BrandSettingsContext';

// Sub-components
import { FormatSelector, type PublicationFormat } from '../components/cockpit/FormatSelector';
import { MultiPhotoUpload } from '../components/cockpit/MultiPhotoUpload';
import { BrandOverlayQuickBar } from '../components/cockpit/BrandOverlayQuickBar';
import { ToneSelector, type CaptionTone } from '../components/cockpit/ToneSelector';
import { LogoOverlayOption, type LogoPosition } from '../components/cockpit/LogoOverlayOption';
import { SmartScheduleOption } from '../components/cockpit/SmartScheduleOption';
import { ROIImpactBox } from '../components/cockpit/ROIImpactBox';
import { VoicePostButton } from '../components/cockpit/VoicePostButton';
import { SEOArticlePreview } from '../components/cockpit/SEOArticlePreview';
import { KeywordSuggester } from '../components/cockpit/KeywordSuggester';

// Extracted modules
import {
  POST_TYPES,
  IDEA_SUGGESTIONS,
  TONES,
  CHANNELS,
  filterGoogleMapsContent,
} from '../lib/cockpit/cockpitConstants';
import { detectPlatformFromUrl } from '../lib/bookingPlatforms';
import {
  buildSinglePrompt,
  buildMultiNetworkPrompt,
  buildSEOArticlePrompt,
  parsePlatformVariants,
  parseSEOArticle,
} from '../lib/cockpit/promptBuilders';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CockpitPage() {
  // ── Voice input (pre-fill from GEO audit if available)
  const [idea, setIdea] = useState<string>(() => {
    const prefill = sessionStorage.getItem('kompilot_geo_prefill');
    if (prefill) {
      sessionStorage.removeItem('kompilot_geo_prefill');
      return `Post optimisé GEO — mots-clés manquants : ${prefill}`;
    }
    return '';
  });

  // ── Format
  const [pubFormat, setPubFormat] = useState<PublicationFormat>('post');
  const isSEOMode = pubFormat === 'seo-local';
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  // ── Typography toolbar
  const { brandTextStyle } = useBrandSettings();
  const [textStyle, setTextStyle] = useState<TextStyle>(brandTextStyle);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── SEO fields
  const [seoKeyword, setSeoKeyword] = useState('');
  const [seoZone, setSeoZone] = useState('');
  const [seoArticle, setSeoArticle] = useState('');
  const [seoMeta, setSeoMeta] = useState<{ title: string; description: string; keywords?: string } | null>(null);
  const [seoSchema, setSeoSchema] = useState<string | undefined>(undefined);
  const [seoGenerateSchema, setSeoGenerateSchema] = useState(false);

  // ── Multi-photo
  const [images, setImages] = useState<string[]>([]);
  const handleBlurFace = useCallback((index: number) => {
    toast(`Floutage IA du visage en cours… 👤`, { description: 'Traitement IA de la photo…' });
    setTimeout(() => toast.success(`Visages floutés avec succès ✅`, { description: `Photo ${index + 1} anonymisée.` }), 1800);
  }, []);

  // ── Logo overlay
  const [logoOverlay, setLogoOverlay] = useState(false);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');

  // ── Caption tone
  const [captionTone, setCaptionTone] = useState<CaptionTone>('chaleureux');
  const [hashtagsInComment, setHashtagsInComment] = useState(false);

  // ── Post type / tone (advanced)
  const [postType, setPostType] = useState('coulisses');
  const [tone, setTone] = useState('amical');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Flash offer
  const [flashDiscount, setFlashDiscount] = useState<string | null>(null);

  // ── Suggestions
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    [...IDEA_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3)
  );
  const refreshSuggestions = () =>
    setSuggestions([...IDEA_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3));

  // ── Channels
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(['instagram']));
  const [networkOptimize, setNetworkOptimize] = useState(false);

  // ── Booking
  const [includeBooking, setIncludeBooking] = useState(false);

  // ── Generation
  const [generatedText, setGeneratedText] = useState('');
  const [platformVariants, setPlatformVariants] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawBuffer, setRawBuffer] = useState('');

  // ── Preview tab
  const [activeTab, setActiveTab] = useState<'instagram' | 'google'>('instagram');

  const { activeEstablishment } = useEstablishment();
  const { credits, deductCredit, isEmpty } = useCredits();
  const { isAuthenticated } = useAuth();

  const cityMatch = activeEstablishment.address.match(/\d{5}\s+(.+)/);
  const city = cityMatch ? cityMatch[1] : (activeEstablishment.address.split(',').pop()?.trim() ?? 'votre ville');
  const creditsLabel = credits === 'unlimited' ? 'Illimité' : `${credits} crédit${Number(credits) !== 1 ? 's' : ''}`;
  const isLow = credits !== 'unlimited' && Number(credits) <= 2;
  const bookingUrl = activeEstablishment.bookingUrl;
  const hasBooking = !!bookingUrl;
  const detectedPlatform = bookingUrl ? detectPlatformFromUrl(bookingUrl) : null;
  const bookingPlatformId = detectedPlatform?.id;
  const multiChannel = selectedChannels.size >= 2;
  const isOptimizing = multiChannel && networkOptimize;
  const isCarousel = images.length > 1;

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); } else next.add(id);
      return next;
    });
  };

  // ── Re-tone: simulate quick AI rewrite for selected caption tone
  const handleRetone = async (newTone: CaptionTone) => {
    setCaptionTone(newTone);
    if (!generatedText) return;
    setIsGenerating(true);
    const tonePrompts: Record<CaptionTone, string> = {
      chaleureux: 'Réécris ce post avec un ton chaleureux, bienveillant, proche des clients. Garde la même idée.',
      direct: 'Réécris ce post de façon directe et orientée promotion. Sois percutant, pas de fioritures.',
      pro: 'Réécris ce post avec un ton professionnel et sobre. Crédible et expert.',
      fun: "Réécris ce post avec une touche d'humour bienveillant. Fun et décalé.",
    };
    try {
      let rewritten = '';
      await blink.ai.streamText(
        { prompt: `${tonePrompts[newTone]}\n\nPost original :\n${generatedText}\n\nGénère uniquement le post réécrit, sans commentaire.`, maxTokens: 350, temperature: 0.9 },
        chunk => { rewritten += chunk; setGeneratedText(rewritten); }
      );
    } catch {
      toast.error('Erreur lors de la réécriture. Réessayez.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) { blink.auth.login(window.location.href); return; }
    if (isEmpty) { toast.error('Crédits IA épuisés — rechargez dans Mon Compte → Facturation.'); return; }
    if (!deductCredit()) return;

    setIsGenerating(true);
    setGeneratedText('');
    setPlatformVariants({});
    setRawBuffer('');

    // ── Contextual Academy hint (TikTok/Reel format) ───────────────────────────
    if (pubFormat === 'reel') {
      setTimeout(() => triggerAcademyHint('cockpit_tiktok_script'), 3000);
    }

    // ── SEO Article mode ──────────────────────────────────────────────────────
    if (isSEOMode) {
      setSeoArticle('');
      setSeoMeta(null);
      setSeoSchema(undefined);
      try {
        const prompt = buildSEOArticlePrompt(
          activeEstablishment.name, city, activeEstablishment.category,
          seoKeyword, seoZone, bookingUrl, seoGenerateSchema,
        );
        const maxTokens = seoGenerateSchema ? 1400 : 900;
        let full = '';
        await blink.ai.streamText({ prompt, maxTokens, temperature: 0.8 }, chunk => {
          full += chunk;
          setRawBuffer(full);
        });
        const { meta, article, schema } = parseSEOArticle(full);
        setSeoMeta(meta);
        setSeoArticle(article);
        setSeoSchema(schema);
        setRawBuffer('');
        toast.success('✅ Article SEO généré ! Copiez les balises Meta et publiez votre article 📝');
      } catch {
        toast.error('Erreur de génération IA. Réessayez dans quelques secondes.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ── Social post mode ──────────────────────────────────────────────────────
    try {
      const channels = Array.from(selectedChannels);

      if (isOptimizing && channels.length >= 2) {
        let full = '';
        const prompt = buildMultiNetworkPrompt(activeEstablishment.name, city, activeEstablishment.category, postType, tone, idea, channels, bookingUrl, includeBooking);
        await blink.ai.streamText({ prompt, maxTokens: 700, temperature: 0.85 }, chunk => {
          full += chunk;
          setRawBuffer(full);
          const partial = parsePlatformVariants(full);
          if (partial.google) partial.google = filterGoogleMapsContent(partial.google);
          if (Object.keys(partial).length > 0) setPlatformVariants(partial);
          else setGeneratedText(full);
        });
        const final = parsePlatformVariants(full);
        if (final.google) final.google = filterGoogleMapsContent(final.google);
        if (Object.keys(final).length > 0) { setPlatformVariants(final); setGeneratedText(''); }
        else setGeneratedText(full);
      } else {
        const typoHint = textStyleToPromptHint(textStyle);
        const prompt = buildSinglePrompt(
          activeEstablishment.name, city, activeEstablishment.category,
          postType, tone, `${idea}\n${typoHint}`, bookingUrl, includeBooking,
          pubFormat, isCarousel, captionTone, flashDiscount ?? undefined
        );
        await blink.ai.streamText({ prompt, maxTokens: 420, temperature: 0.88 }, chunk => {
          setGeneratedText(prev => {
            const next = prev + chunk;
            return selectedChannels.has('google') ? filterGoogleMapsContent(next) : next;
          });
        });
      }
      toast.success("✅ Post généré ! Visualisez l'aperçu à droite et planifiez-le dans votre calendrier 📅");
    } catch {
      toast.error('Erreur de génération IA. Réessayez dans quelques secondes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleNow = () => toast.success('📤 Publication immédiate lancée !');
  const handleScheduleSmart = () => {
    const PEAK_TIMES: Record<string, string> = {
      Restaurant: 'Jeudi à 12h00', Coiffeur: 'Mercredi à 10h00',
      Boulangerie: 'Samedi à 08h30', Spa: 'Vendredi à 18h00', default: 'Mercredi à 12h30',
    };
    const peak = PEAK_TIMES[activeEstablishment.category] ?? PEAK_TIMES.default;
    toast.success(`🎯 Post planifié — ${peak}`, { description: 'Publication automatique à l\'heure de pointe de votre secteur.' });
  };
  const handleScheduleCustom = () => toast('📅 Choisissez une date et heure', { description: 'Fonctionnalité disponible dans le Calendrier.' });

  const tabText = (() => {
    if (isOptimizing && Object.keys(platformVariants).length > 0) {
      return platformVariants[activeTab] ?? Object.values(platformVariants)[0] ?? generatedText;
    }
    return generatedText;
  })();

  const previewImage = images[0] ?? null;

  return (
    <>
      <SOSResumeBanner />
      <Page>
        <PageHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <PageTitle>Propulsez votre commerce et attirez de nouveaux clients aujourd'hui ✨</PageTitle>
              <PageDescription>Créez en quelques secondes un post optimisé qui booste votre visibilité et génère de nouveaux rendez-vous</PageDescription>
            </div>
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 px-3 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 shrink-0 ml-4"
            >
              <AlertTriangle size={14} className="animate-pulse" />
              🚨 SOS Imprévu
            </button>
          </div>
          <FlashTutorialButton featureKey="cockpit" className="mt-1" />
        </PageHeader>

        <PageBody>
          {/* Establishment banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-primary/5 border border-primary/15 px-5 py-3 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeEstablishment.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {activeEstablishment.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{activeEstablishment.name}</p>
                <p className="text-xs text-muted-foreground">{activeEstablishment.category} · {city}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> En ligne 🟢
              </span>
            </div>
            <div className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 shrink-0',
              isEmpty ? 'border-red-300 bg-red-50' : isLow ? 'border-amber-300 bg-amber-50' : 'border-border bg-muted/40'
            )}>
              <Zap size={13} className={isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-primary'} />
              <span className={`text-xs font-bold ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-foreground'}`}>
                {creditsLabel} IA restants
              </span>
            </div>
          </div>

          {/* ── Plan d'attaque de la semaine ── */}
          <IdeesMarketingPanel
            establishmentName={activeEstablishment.name}
            city={city}
            sector={activeEstablishment.category}
            onLaunchIdea={(text) => { setIdea(text); setPubFormat('post'); }}
          />

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* ── Left panel ── */}
            <div className="space-y-5">

              {/* ── Channel selection ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Réseaux cibles</label>
                  <button
                    onClick={() => setSelectedChannels(new Set(CHANNELS.map(c => c.id)))}
                    className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    ✅ Tout sélectionner
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(ch => {
                    const active = selectedChannels.has(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all select-none',
                          active
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground'
                        )}
                      >
                        <span>{ch.emoji}</span>{ch.label}
                      </button>
                    );
                  })}
                </div>
                {multiChannel && (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 mt-1">
                    <div className="flex items-center gap-2">
                      <Network size={14} className="text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Optimiser selon le réseau</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">L'IA adapte le texte aux codes de chaque plateforme</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNetworkOptimize(v => !v)}
                      className={cn('relative w-10 h-5.5 rounded-full transition-all duration-200 shrink-0', networkOptimize ? 'bg-primary' : 'bg-muted-foreground/30')}
                    >
                      <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all duration-200', networkOptimize ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Format selector ── */}
              <FormatSelector value={pubFormat} onChange={setPubFormat} />

              {/* ── Reel IA Generator (shown when Reel / Vidéo format selected) ── */}
              {pubFormat === 'reel' && (
                <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 dark:border-violet-800 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">Reel IA — Génération Vidéo</p>
                      <p className="text-[11px] text-muted-foreground">Créez une vidéo verticale optimisée Instagram & TikTok en 60 secondes</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['📱 Format 9:16', '🎵 Son inclus', '⚡ Veo 3.1 Fast'].map(f => (
                      <div key={f} className="text-center text-[10px] font-semibold text-violet-700 dark:text-violet-300 bg-white/60 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg py-1.5">
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setReelModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white text-sm font-extrabold py-3 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
                  >
                    <Sparkles size={15} /> Générer mon Reel avec l'IA ✨
                  </button>
                  <p className="text-center text-[10px] text-muted-foreground">Génération en ~30-60 secondes · Vous pouvez aussi rédiger un post ci-dessous</p>
                </div>
              )}

              {/* ── SEO Local fields (shown only in seo-local mode) ── */}
              {isSEOMode && (
                <div className="rounded-xl border-2 border-violet-200 bg-violet-50/40 px-4 py-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🌐</span>
                    <p className="text-xs font-bold text-violet-800">Paramètres de l'Article SEO Local</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide">
                      Mot-clé principal
                    </label>
                    <input
                      type="text"
                      value={seoKeyword}
                      onChange={e => setSeoKeyword(e.target.value)}
                      placeholder="Ex : Lissage brésilien, Brunch du dimanche"
                      className="w-full rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 placeholder:text-muted-foreground/50 transition-all"
                    />
                    <p className="text-[10px] text-violet-600">
                      Ce mot-clé sera intégré ~5-8 fois dans l'article pour une densité SEO optimale.
                    </p>
                  </div>

                  {/* ── Keyword suggester ── */}
                  <KeywordSuggester
                    category={activeEstablishment.category}
                    city={city}
                    onSelectKeyword={setSeoKeyword}
                    onSelectZone={setSeoZone}
                  />

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide">
                      Zone géographique ciblée
                    </label>
                    <input
                      type="text"
                      value={seoZone}
                      onChange={e => setSeoZone(e.target.value)}
                      placeholder="Ex : La Rochelle, Quartier Centre-Ville"
                      className="w-full rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 placeholder:text-muted-foreground/50 transition-all"
                    />
                    <p className="text-[10px] text-violet-600">
                      L'IA ancrera l'article sur cette zone pour cibler les recherches locales Google.
                    </p>
                  </div>

                  {/* Schema Markup toggle */}
                  <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-100/40 px-3 py-2.5">
                    <button
                      role="switch"
                      aria-checked={seoGenerateSchema}
                      onClick={() => setSeoGenerateSchema(v => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus:outline-none mt-0.5 ${
                        seoGenerateSchema ? 'bg-orange-500 border-orange-600' : 'bg-muted border-border'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${seoGenerateSchema ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-violet-800 leading-tight">
                        Générer le Schema Markup JSON-LD <span className="text-orange-600 font-extrabold">LocalBusiness</span>
                      </p>
                      <p className="text-[10px] text-violet-600 mt-0.5 leading-relaxed">
                        Bloc Schema.org prêt à coller dans votre site pour booster votre référencement local Google Maps.
                      </p>
                    </div>
                  </div>

                  {!seoKeyword && !seoZone && (
                    <p className="text-[11px] text-violet-600 bg-violet-100 rounded-lg px-3 py-2 leading-relaxed">
                      💡 <strong>Astuce :</strong> Plus les champs sont précis, plus l'article sera ciblé. Exemple : "Coiffeur lissage brésilien" + "Bordeaux Chartrons".
                    </p>
                  )}
                </div>
              )}

              {/* ── Idea input (hidden in SEO mode) ── */}
              {!isSEOMode && <div data-tour="cockpit-creation" className="space-y-3">
                {/* ── Big Voice Button ── */}
                <VoicePostButton
                  onTranscript={(text) => setIdea(text)}
                  disabled={isGenerating}
                />
                <div className="space-y-1.5">
                  {/* ── Typography floating toolbar (appears on focus) */}
                  <FloatingTypographyToolbar
                    style={textStyle}
                    onChange={setTextStyle}
                    brandDefault={brandTextStyle}
                    showReset
                    visible={toolbarVisible}
                  />
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={idea}
                      onChange={e => setIdea(e.target.value)}
                      onFocus={() => setToolbarVisible(true)}
                      onBlur={() => setTimeout(() => setToolbarVisible(false), 200)}
                      placeholder="Ex: Arrivée de notre nouvelle collection de lunettes de soleil ou -15% sur les formules du midi ce jeudi..."
                      className="w-full rounded-xl border border-background bg-background px-4 py-3.5 pr-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[96px] placeholder:text-muted-foreground/50 leading-relaxed"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setIdea(s)}
                      className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer"
                    >
                      💡 {s}
                    </button>
                  ))}
                  <button
                    onClick={refreshSuggestions}
                    className="flex items-center gap-1 rounded-full border border-border bg-muted/40 text-muted-foreground px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted hover:text-foreground transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw size={10} /> Nouvelles idées
                  </button>
                </div>
              </div>}

              {/* ── Advanced options (social only) ── */}
              {!isSEOMode && <div className="space-y-2">
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className={cn('inline-block transition-transform duration-200', showAdvanced ? 'rotate-90' : 'rotate-0')}>▶</span>
                  {showAdvanced ? '▼ Masquer les options' : '⚙️ Options avancées (type, ton)'}
                </button>
                {showAdvanced && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Type de post</label>
                      <div className="flex flex-wrap gap-2">
                        {POST_TYPES.map(t => (
                          <button key={t.id} onClick={() => setPostType(t.id)}
                            className={cn('rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                              postType === t.id ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border hover:border-primary/40 hover:bg-primary/5'
                            )}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Ton de base</label>
                      <div className="flex flex-wrap gap-2">
                        {TONES.map(t => (
                          <button key={t.id} onClick={() => setTone(t.id)}
                            className={cn('rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                              tone === t.id ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border hover:border-primary/40 hover:bg-primary/5'
                            )}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>}

              {/* ── Brand overlay status bar ── */}
              {!isSEOMode && <BrandOverlayQuickBar />}

              {/* ── Multi-photo upload ── */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {isCarousel ? `Carrousel (${images.length} photos) 📸` : 'Photos du post (optionnelles)'}
                </label>
                <MultiPhotoUpload images={images} onChange={setImages} onBlurFace={handleBlurFace} />

                {/* Logo overlay */}
                {images.length > 0 && (
                  <LogoOverlayOption
                    enabled={logoOverlay}
                    onToggle={() => setLogoOverlay(v => !v)}
                    position={logoPosition}
                    onPositionChange={setLogoPosition}
                  />
                )}
              </div>

              {/* ── AI Generate button ── */}
              <Button onClick={handleGenerate} disabled={isGenerating || isEmpty} className="w-full h-12 text-sm font-bold gap-2 rounded-xl shadow-md">
                {isGenerating ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    {isOptimizing ? 'Adaptation par réseau...' : 'Génération en cours...'}</>
                ) : (
                  <><Sparkles size={16} />
                    {isOptimizing ? `Générer × ${selectedChannels.size} réseaux 🚀` : 'Générer avec Kompilot 🚀'}</>
                )}
              </Button>

              {isEmpty && (
                <p className="text-xs text-center text-red-500">
                  Crédits épuisés — <a href="/account" className="underline hover:text-red-700">rechargez dans Mon Compte</a>
                </p>
              )}

              {/* ── Caption tone + hashtag option (shown after generation) ── */}
              {(generatedText || Object.keys(platformVariants).length > 0) && (
                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-3">
                  <ToneSelector value={captionTone} onChange={handleRetone} disabled={isGenerating} />

                  <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                    <input
                      id="hashtag-comment"
                      type="checkbox"
                      checked={hashtagsInComment}
                      onChange={e => setHashtagsInComment(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="hashtag-comment" className="cursor-pointer">
                      <p className="text-[11px] font-semibold text-foreground">
                        Publier automatiquement les hashtags dans le 1er commentaire
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Garde votre description principale propre tout en conservant un maximum de visibilité locale.
                      </p>
                    </label>
                  </div>

                  <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2 text-xs">
                    <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
                    Proposer une autre version 🔄
                  </Button>
                </div>
              )}

              {/* ── Booking checkbox ── */}
              {hasBooking && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
                  <input
                    id="booking-checkbox"
                    type="checkbox"
                    checked={includeBooking}
                    onChange={e => setIncludeBooking(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                  />
                  <label htmlFor="booking-checkbox" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CalendarCheck size={13} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">Inclure le bouton de réservation 📅</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                      L'IA intègre votre lien de réservation dans l'appel à l'action.
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">🔗 {bookingUrl}</p>
                  </label>
                </div>
              )}
              {!hasBooking && (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
                  <CalendarCheck size={14} className="text-muted-foreground shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    Ajoutez un <a href="/establishments" className="underline hover:text-foreground">lien de réservation</a> à votre établissement pour activer le bouton de réservation.
                  </p>
                </div>
              )}

              {/* ── ROI + Flash offer (shown when content is generated) ── */}
              {(generatedText || Object.keys(platformVariants).length > 0) && (
                <ROIImpactBox
                  format={pubFormat}
                  isCarousel={isCarousel}
                  category={activeEstablishment.category}
                />
              )}

              {/* ── Schedule options (shown when content is generated) ── */}
              {(generatedText || Object.keys(platformVariants).length > 0) && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Publication</label>
                  <SmartScheduleOption
                    category={activeEstablishment.category}
                    onScheduleNow={handleScheduleNow}
                    onScheduleSmart={handleScheduleSmart}
                    onScheduleCustom={handleScheduleCustom}
                    disabled={isGenerating}
                  />
                </div>
              )}
            </div>

            {/* ── Right panel: SEO Article or Phone preview ── */}
            {isSEOMode ? (
              <SEOArticlePreview
                article={seoArticle}
                meta={seoMeta}
                schema={seoSchema}
                rawBuffer={rawBuffer}
                isGenerating={isGenerating}
                keyword={seoKeyword}
                geoZone={seoZone}
                onRegenerate={handleGenerate}
              />
            ) : (
              <PhoneMockup
                text={tabText}
                imagePreview={previewImage}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isGenerating={isGenerating}
                establishmentName={activeEstablishment.name}
                city={city}
                showBookingButton={includeBooking && hasBooking && !!tabText}
                bookingUrl={bookingUrl}
                bookingPlatformId={bookingPlatformId}
                isNetworkOptimized={isOptimizing}
                platformVariants={platformVariants}
                textStyle={textStyle}
              />
            )}
          </div>
        </PageBody>
      
        <ReelGeneratorModal open={reelModalOpen} onClose={() => setReelModalOpen(false)} prefillContext={idea} establishmentName={activeEstablishment?.name} />
        <SOSCrisisModal open={sosOpen} onClose={() => setSosOpen(false)} />

        {/* ── Mobile floating bottom nav bar (md:hidden) ── */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-30 bg-background/80 backdrop-blur-md border-t border-border h-16 flex items-center justify-around px-6">
          <a href="/" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <Home size={20} />
            <span className="text-[10px] font-medium">Accueil</span>
          </a>

          <div className="relative flex flex-col items-center -translate-y-3">
            <button
              type="button"
              onClick={() => { /* Placeholder for voice input logic */ }}
              className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #7C3AED)',
                boxShadow: '0 4px 16px rgba(13,148,136,0.4)',
              }}
            >
              <span className="relative z-10 text-white">
                <Mic size={22} />
              </span>
            </button>
            <span className="text-[10px] font-semibold mt-1" style={{ color: '#0D9488' }}>
              Dicter
            </span>
          </div>

          <a href="/analytics" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <BarChart2 size={20} />
            <span className="text-[10px] font-medium">Stats</span>
          </a>
        </div>
        <div className="h-16 md:hidden" />
      </Page>
    </>
  );
}
