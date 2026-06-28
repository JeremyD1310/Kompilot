import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Textarea, Label, Checkbox, Input, Badge, toast,
} from '@blinkdotnew/ui';
import {
  Calendar, Clock, Globe, Sparkles, Copy, Check, ChevronDown, ChevronUp,
  RefreshCw, ImagePlus, Upload, X, Search, BookMarked, ListOrdered, RotateCcw, Zap, Bell,
} from 'lucide-react';
import { FloatingTypographyToolbar } from '../cockpit/FloatingTypographyToolbar';
import {
  DEFAULT_TEXT_STYLE,
  textStyleToPromptHint,
  type TextStyle,
} from '../../lib/typographyStyles';
import { cn } from '../../lib/utils';
import { optimizeImageToWebP } from '../../lib/imageOptimizer';
import { ImagePickerModal } from './ImagePickerModal';
import { PhonePreview } from './PhonePreview';
import { AIBrainstormPanel, type BrainstormTab } from './AIBrainstormPanel';
import { blink } from '../../blink/client';
import { showToast } from '../../lib/toast';
import { usePublicationSlots } from '../../context/PublicationSlotsContext';
import { usePostDraft } from '../../hooks/usePostDraft';
import { useContentLibrary } from '../../context/ContentLibraryContext';
import { useCredits } from '../../context/CreditsContext';
import { useTeamMode } from '../../context/TeamModeContext';
import { useBrandSettings } from '../../context/BrandSettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../context/SubscriptionContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { UpgradeModal } from '../subscription/UpgradeModal';
import { Link } from '@tanstack/react-router';
import { FirstPostCelebration } from '../gamification/FirstPostCelebration';
import { isFirstPost, markFirstPostDone, incrementWeeklyPosts } from '../../lib/weeklyActivity';
import { fireMentorTrigger } from '../../hooks/useMentorTriggers';
import { useScheduledPostNotification } from '../../hooks/useScheduledPostNotification';
import { useNotificationPreferences } from '../../context/NotificationPreferencesContext';
import { LocalAdsModal } from '../ads/LocalAdsModal';
import { EngagementPhraseAdder } from './EngagementPhraseAdder';
import { UTMTagInput } from './UTMTagInput';
import { PostComments } from '../team/PostComments';

// ── Brand icons ────────────────────────────────────────────────────────────
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.79 1.54V6.93a4.85 4.85 0 01-1.02-.24z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
    </svg>
  );
}

const CHANNELS = [
  { id: 'website',         label: 'Mon site web (Blog)',       icon: Globe,          color: 'text-primary'    },
  { id: 'linkedin',        label: 'LinkedIn',                  icon: LinkedinIcon,   color: 'text-blue-600'   },
  { id: 'instagram',       label: 'Instagram',                 icon: InstagramIcon,  color: 'text-pink-500'   },
  { id: 'tiktok',          label: 'TikTok',                    icon: TikTokIcon,     color: 'text-foreground' },
  { id: 'facebook',        label: 'Facebook',                  icon: FacebookIcon,   color: 'text-blue-500'   },
  { id: 'google_business', label: 'Google Business Profile',   icon: GoogleIcon,     color: 'text-orange-500' },
];

export type PostStatus = 'draft' | 'pending' | 'approved';

export interface ScheduledPost {
  id: string;
  text: string;
  channels: string[];
  date: string;
  time: string;
  status: PostStatus;
  requiresValidation?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface AiVariants { linkedin: string; instagram: string; }

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultText?: string;
  defaultMediaUrl?: string;
  defaultMediaType?: 'image' | 'video';
  defaultChannels?: string[];
  existingPostDates?: string[]; // 'yyyy-MM-dd@HH:mm' keys
  onCreated?: (post: ScheduledPost) => void;
  /** Pre-populate all fields from an existing post for full editing */
  editingPost?: ScheduledPost | null;
}

// ── Variant card ───────────────────────────────────────────────────────────
function VariantCard({ platform, icon, accentClass, bgClass, text, onUse }: {
  platform: string; icon: React.ReactNode; accentClass: string;
  bgClass: string; text: string; onUse: (t: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  useEffect(() => () => {
    isMounted.current = false;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      if (!isMounted.current) return;
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => { if (isMounted.current) setCopied(false); }, 1500);
    } catch { /* clipboard denied — no-op */ }
  };
  return (
    <div className={`rounded-xl border ${bgClass} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${accentClass}`}>{icon}{platform}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleCopy}>
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            {copied ? 'Copié !' : 'Copier'}
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onUse(text)}>Utiliser</Button>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{text}</p>
      <p className="text-[11px] text-muted-foreground">{text.length} caractères</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CreatePostModal({
  open, onClose, defaultDate, defaultText,
  defaultMediaUrl, defaultMediaType, defaultChannels,
  existingPostDates = [], onCreated,
  editingPost,
}: CreatePostModalProps) {
  const [text, setText] = useState(defaultText ?? '');
  const [channels, setChannels] = useState<string[]>(defaultChannels ?? []);
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<PostStatus>('draft');
  const [requiresValidation, setRequiresValidation] = useState(false);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  type AiTone = 'Professionnel' | 'Chaleureux' | 'Humoristique' | 'Vendeur';
  const [aiTone, setAiTone] = useState<AiTone>('Professionnel');
  const [aiVariants, setAiVariants] = useState<AiVariants | null>(null);
  const [showVariants, setShowVariants] = useState(true);

  // Media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Action link
  const [actionLink, setActionLink] = useState('');
  const [actionLabel, setActionLabel] = useState('Réserver');

  // UTM parameters
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  // Library
  const [addToLib, setAddToLib] = useState(false);
  const { addToLibrary, getRecentPosts } = useContentLibrary();

  // Smart Duplicate Guard
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [reformulating, setReformulating] = useState(false);

  const checkSimilarity = (a: string, b: string): number => {
    const words = (s: string) => new Set(s.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const setA = words(a);
    const setB = words(b);
    const intersection = [...setA].filter(w => setB.has(w)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  };

  useEffect(() => {
    if (!text.trim() || text.length < 60) { setDuplicateWarning(null); return; }
    const t = setTimeout(() => {
      const recent = getRecentPosts(60);
      const match = recent.find(p => checkSimilarity(text, p.text) >= 0.8);
      setDuplicateWarning(match ? match.id : null);
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Content format (Post Classique / Story 9:16)
  const [contentFormat, setContentFormat] = useState<'post' | 'story'>('post');
  const [storyPaywallOpen, setStoryPaywallOpen] = useState(false);
  const [adsModalOpen, setAdsModalOpen] = useState(false);
  const { currentPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();

  const handleFormatChange = (format: 'post' | 'story') => {
    if (format === 'story' && !currentPlan.hasStories) {
      setStoryPaywallOpen(true);
      return;
    }
    setContentFormat(format);
  };

  // Credits
  const { deductCredit, isEmpty: creditsEmpty, credits, usage, limit } = useCredits();
  // Team mode
  const { teamModeEnabled, validatorName, submitForValidation } = useTeamMode();
  const { process: processBrand, brandTextStyle } = useBrandSettings();
  const { user } = useAuth();

  // Typography style state (initialized from brand default if agency)
  const [textStyle, setTextStyle] = useState<TextStyle>(() => brandTextStyle ?? DEFAULT_TEXT_STYLE);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const { prefs: notifPrefs } = useNotificationPreferences();
  const { notifyScheduled } = useScheduledPostNotification(user?.email, notifPrefs.scheduledPosts);
  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // AI Brainstorm panel
  const [brainstormTab, setBrainstormTab] = useState<BrainstormTab>('ideas');
  const [showBrainstorm, setShowBrainstorm] = useState(true);

  // Draft auto-save
  const { saveDraft, loadDraft, clearDraft, registerUnloadSave } = usePostDraft();
  const textRef = useRef(text);
  textRef.current = text;
  const [restoredDraft, setRestoredDraft] = useState(false);

  // Queue toggle
  const [isQueueSelected, setIsQueueSelected] = useState(false);

  // Queue (slots)
  const { getNextFreeSlot } = usePublicationSlots();

  const effectiveDate = date || defaultDate || new Date().toISOString().split('T')[0];

  // On open: populate from editingPost (full edit mode) or AI suggestion pre-fill
  useEffect(() => {
    if (!open) return;
    if (editingPost) {
      setText(editingPost.text);
      setChannels(editingPost.channels);
      setDate(editingPost.date);
      setTime(editingPost.time);
      setStatus(editingPost.status ?? 'draft');
      return;
    }
    if (defaultText)    setText(defaultText);
    if (defaultChannels?.length) setChannels(defaultChannels);
    if (defaultMediaUrl) {
      setMediaUrl(defaultMediaUrl);
      setMediaType(defaultMediaType ?? 'image');
      setMediaName(defaultMediaType === 'video' ? 'Vidéo suggestion IA' : 'Image suggestion IA');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPost, defaultText, defaultMediaUrl, defaultMediaType]);

  // On open: restore draft (only if no AI pre-fill)
  useEffect(() => {
    if (!open) return;
    if (defaultText) return;
    const draft = loadDraft();
    if (draft && !text.trim()) {
      setText(draft.text);
      setRestoredDraft(true);
    }
    return registerUnloadSave(() => textRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-save on text change (1.5s debounce)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => saveDraft(text), 1500);
    return () => clearTimeout(t);
  }, [text, open, saveDraft]);

  const toggleChannel = (id: string) =>
    setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleUtmChange = (field: 'utm_source' | 'utm_medium' | 'utm_campaign', value: string) => {
    if (field === 'utm_source') setUtmSource(value);
    else if (field === 'utm_medium') setUtmMedium(value);
    else setUtmCampaign(value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── File size guard (max 50 MB images / 200 MB videos) ──────────────────
    const MAX_IMAGE_SIZE = 50 * 1024 * 1024;  // 50 MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
    const isVideo = file.type.startsWith('video');
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      toast.error('Vidéo trop lourde', { description: 'La taille maximum est de 200 Mo pour les vidéos.' });
      e.target.value = '';
      return;
    }
    if (!isVideo && file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop lourde', { description: 'La taille maximum est de 50 Mo pour les images.' });
      e.target.value = '';
      return;
    }
    setMediaName(file.name);
    setMediaType(isVideo ? 'video' : 'image');
    if (isVideo) {
      setMediaUrl(URL.createObjectURL(file));
      toast.success('Vidéo ajoutée', { description: file.name });
      return;
    }
    // Optimize to WebP before applying brand banner
    const { file: optimized, wasOptimized, savings } = await optimizeImageToWebP(file, { maxWidthPx: 1200, quality: 0.82 });
    if (wasOptimized) {
      setMediaName(optimized.name);
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const branded = await processBrand(dataUrl);
      setMediaUrl(branded);
      toast.success('Photo ajoutée', {
        description: wasOptimized
          ? `🎨 Bandeau appliqué · WebP ${savings} plus léger`
          : '🎨 Bandeau de marque appliqué',
      });
    };
    reader.readAsDataURL(optimized);
  };

  const handleClose = () => {
    setText('');
    setChannels([]);
    setDate(defaultDate ?? new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setAiVariants(null); setShowVariants(true);
    setMediaUrl(null); setMediaName(''); setMediaType('image');
    setStatus('draft'); setAddToLib(false); setRestoredDraft(false); setActionLink(''); setActionLabel('Réserver'); setAiTone('Professionnel'); setRequiresValidation(false);
    setUtmSource(''); setUtmMedium(''); setUtmCampaign('');
    setTextStyle(brandTextStyle ?? DEFAULT_TEXT_STYLE);
    setToolbarVisible(false);
    onClose();
  };

  const handleAddToQueue = () => {
    if (!text.trim()) { toast.error("Rédigez d'abord votre texte."); return; }
    const slot = getNextFreeSlot(existingPostDates);
    if (!slot) {
      toast.error('Aucun créneau libre trouvé.', {
        description: 'Configurez vos créneaux dans Paramètres → Créneaux.',
      });
      return;
    }
    setDate(slot.date);
    setTime(slot.time);
    toast.success('Créneau assigné automatiquement !', {
      description: `Le ${slot.date} à ${slot.time}`,
    });
  };

  const handleAdaptWithAI = async () => {
    if (!text.trim()) { toast.error("Écrivez d'abord votre texte principal."); return; }
    setAiLoading(true); setAiVariants(null); setShowVariants(true);
    try {
      const ctaInstruction = actionLink.trim()
        ? `\n\nIMPORTANT : l'utilisateur a ajouté un lien d'action (${actionLink}) avec le bouton CTA "${actionLabel}". Tu DOIS terminer CHAQUE variante par une phrase d'appel à l'action percutante et urgente qui incite à cliquer sur ce lien. Exemple : "👇 Cliquez sur le lien ci-dessous pour ${actionLabel.toLowerCase()} votre créneau avant qu'il ne soit trop tard !"`
        : '';

      const toneMap: Record<AiTone, string> = {
        Professionnel: "Utilise un ton professionnel et formel, vouvoiement, vocabulaire sérieux et structuré.",
        Chaleureux: "Utilise un ton chaleureux, amical et humain. Tutoiement bienveillant, proche de la communauté.",
        Humoristique: "Utilise un ton humoristique et décalé. Ajoute des jeux de mots légers, des émojis amusants 😄🎉, et une touche de fun tout en restant professionnel.",
        Vendeur: "Utilise un ton vendeur et punchy. Phrases courtes, percutantes, urgence et bénéfice client mis en avant. Call-to-action direct.",
      };
      const toneInstruction = `\n\nTON IMPOSÉ : ${toneMap[aiTone]}`;

      const typoHint = textStyleToPromptHint(textStyle);

      const { object } = await blink.ai.generateObject({
        prompt: `Tu es un expert en marketing digital pour TPE/PME.${ctaInstruction}${toneInstruction}
${typoHint}
À partir du texte ci-dessous, génère deux variantes de publication optimisées pour l'algorithme de chaque plateforme :

1. "linkedin" : Storytelling corporate, ton authentique et inspirant. Structure : accroche forte (1 phrase choc) + développement en paragraphes courts + leçon ou appel à réflexion. 300-600 caractères, emojis sobres. Ajoute en fin de post la mention "💬 Lien en premier commentaire" si un lien est pertinent. Commence par une question ou affirmation percutante.
2. "instagram" : Texte ultra-court et percutant (80-150 caractères max hors hashtags), avec des retours à la ligne fréquents pour l'aération visuelle, des emojis expressifs. Termine OBLIGATOIREMENT par 5 hashtags pertinents séparés par des espaces (mix populaires + niche). L'accroche doit donner envie de cliquer sur "voir plus".

RÈGLES ALGORITHMES :
- Instagram : phrases courtes, line breaks, 5 meilleurs hashtags à la fin, texte optimisé pour les 2 premières lignes visibles
- Facebook : commence par une question engageante pour booster les commentaires, maximum 2 hashtags seulement
- LinkedIn : storytelling corporate, mentionne "lien en premier commentaire" si pertinent, ton professionnel mais humain

Texte original :
"""
${text}
"""

Réponds uniquement avec l'objet JSON demandé, sans commentaires.`,
        schema: {
          type: 'object',
          properties: {
            linkedin: { type: 'string', description: 'Version formelle pour LinkedIn' },
            instagram: { type: 'string', description: 'Version courte pour Instagram avec hashtags' },
          },
          required: ['linkedin', 'instagram'],
        },
      });
      setAiVariants(object as AiVariants);
      toast.success('Variantes générées avec succès !');
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
      } else {
        toast.error('Erreur lors de la génération IA.', { description: err?.message ?? 'Réessayez.' });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) { toast.error('Le texte est requis.'); return; }
    if (channels.length === 0) { toast.error('Choisissez au moins un canal.'); return; }
    if (!effectiveDate) { toast.error('Sélectionnez une date.'); return; }

    // Deduct 1 credit — blocks if balance is 0
    const ok = deductCredit();
    if (!ok) { setInsufficientOpen(true); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const newPost: ScheduledPost = {
      id: Date.now().toString(), text, channels, date: effectiveDate, time, status, requiresValidation,
      ...(utmSource && { utm_source: utmSource }),
      ...(utmMedium && { utm_medium: utmMedium }),
      ...(utmCampaign && { utm_campaign: utmCampaign }),
    };
    if (addToLib) {
      addToLibrary({ id: newPost.id, text: newPost.text, channels: newPost.channels, date: newPost.date, time: newPost.time });
    }
    onCreated?.(newPost);
    clearDraft();
    // Fire scheduled-post email notification (non-blocking, respects user prefs)
    notifyScheduled(newPost);

    // Track weekly activity
    incrementWeeklyPosts();

    // First post? → trigger confetti celebration + mentor message
    if (isFirstPost()) {
      markFirstPostDone();
      setSaving(false);
      setShowCelebration(true);
      // Fire Mentor Copilote first-post celebration (slight delay for UX)
      // Note: this timer intentionally runs after component might close — acceptable UX choice
      const celebrationTimer = setTimeout(() => fireMentorTrigger('first_post'), 2500);
      // Store ref for potential cleanup if needed in future
      void celebrationTimer;
      return; // celebration modal will call handleClose()
    }

    showToast.postScheduled(
      addToLib
        ? `${effectiveDate} à ${time} · ajouté à la bibliothèque`
        : `${effectiveDate} à ${time}`
    );
    setSaving(false);
    handleClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-[1200px] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Créer une publication</DialogTitle>
              <button
                type="button"
                onClick={() => setShowBrainstorm(v => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  showBrainstorm
                    ? 'border-primary/40 bg-primary/8 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
                title={showBrainstorm ? "Masquer l'assistant IA" : "Afficher l'assistant IA"}
              >
                <Sparkles size={13} />
                {showBrainstorm ? 'Masquer l\'IA' : 'Assistant IA'}
              </button>
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left: Form ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {/* ── Format selector (Post / Story) ── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format du contenu</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFormatChange('post')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150 ${
                    contentFormat === 'post'
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <span>📱</span> Post Classique
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('story')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150 ${
                    contentFormat === 'story'
                      ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-violet-300 hover:bg-violet-50/40'
                  }`}
                >
                  <span>📐</span> Story (9:16)
                  {!currentPlan.hasStories && (
                    <span className="text-[10px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded-full px-1.5 py-0.5 ml-0.5">Expert</span>
                  )}
                </button>
              </div>
            </div>

            {/* ── Draft restored banner ── */}
            {restoredDraft && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                <RotateCcw size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 flex-1">
                  <span className="font-semibold">Brouillon restauré</span> — votre dernière rédaction a été récupérée automatiquement.
                </p>
                <button
                  type="button"
                  onClick={() => { setText(''); setRestoredDraft(false); clearDraft(); }}
                  className="text-[11px] text-amber-700 hover:underline shrink-0"
                >
                  Effacer
                </button>
              </div>
            )}

            {/* ── Text area ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="post-text" className="font-medium flex items-center gap-1.5">
                  Texte principal
                  {text.trim() && !restoredDraft && (
                    <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      Sauvegardé
                    </span>
                  )}
                </Label>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Tone picker pills */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {([
                      { id: 'Professionnel', emoji: '🎩', label: 'Pro' },
                      { id: 'Chaleureux',    emoji: '🤝', label: 'Amical' },
                      { id: 'Humoristique', emoji: '😄', label: 'Fun' },
                      { id: 'Vendeur',      emoji: '🚀', label: 'Punchy' },
                    ] as { id: AiTone; emoji: string; label: string }[]).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAiTone(t.id)}
                        title={t.id}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-all duration-150 ${
                          aiTone === t.id
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={handleAdaptWithAI} disabled={aiLoading || !text.trim()}
                    className="gap-2 h-8 text-xs border-primary/40 text-primary hover:bg-primary/5 hover:border-primary disabled:opacity-40"
                  >
                    {aiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {aiLoading ? 'Génération...' : "Adapter avec l'IA"}
                  </Button>
                </div>
              </div>
              {/* ── Typography toolbar ── */}
              {toolbarVisible && (
                <FloatingTypographyToolbar
                  style={textStyle}
                  onChange={setTextStyle}
                  brandDefault={brandTextStyle}
                  showReset
                  visible={toolbarVisible}
                />
              )}
              <Textarea
                id="post-text"
                placeholder="Rédigez votre actualité principale ici... (ex : Nous lançons notre nouvelle offre de printemps avec 20% de réduction !)"
                value={text}
                onChange={e => setText(e.target.value)}
                onFocus={() => setToolbarVisible(true)}
                className="min-h-[110px] resize-none"
                style={textStyle.bold || textStyle.italic || textStyle.underline || textStyle.fontFamily !== 'modern-sans' ? {
                  fontFamily: (['modern-sans', 'classic-serif', 'elegant-script', 'bold-display'] as const).includes(textStyle.fontFamily)
                    ? { 'modern-sans': "'Inter', sans-serif", 'classic-serif': "'Playfair Display', serif", 'elegant-script': "'Dancing Script', cursive", 'bold-display': "'Bebas Neue', sans-serif" }[textStyle.fontFamily]
                    : undefined,
                  fontWeight: textStyle.bold ? 'bold' : undefined,
                  fontStyle: textStyle.italic ? 'italic' : undefined,
                  textDecoration: textStyle.underline ? 'underline' : undefined,
                } : undefined}
              />
              <p className="text-xs text-muted-foreground text-right">{text.length} / 2200 caractères</p>

              {/* ── Engagement phrase for auto-DM trigger ── */}
              <EngagementPhraseAdder text={text} onAppend={(phrase) => setText(t => t ? `${t}\n\n${phrase}` : phrase)} />

              {/* ⚠️ Smart Duplicate Guard */}
              {duplicateWarning && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Contenu similaire détecté</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-snug">
                      Ce contenu ressemble à plus de 80% à une publication récente (moins de 60 jours). Voulez-vous que l'IA le reformule ?
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={reformulating || aiLoading}
                    onClick={async () => {
                      setReformulating(true);
                      try {
                        const { object } = await blink.ai.generateObject({
                          prompt: `Reformule ce post avec un angle différent pour éviter la répétition. Garde le même thème mais change la formulation, l'angle et les exemples. Post original: "${text}"`,
                          schema: { type: 'object', properties: { rewritten: { type: 'string' } }, required: ['rewritten'] }
                        });
                        setText(object.rewritten);
                        setDuplicateWarning(null);
                        toast.success('Post reformulé avec succès !');
                      } catch {
                        toast.error('Échec de la reformulation IA');
                      } finally {
                        setReformulating(false);
                      }
                    }}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {reformulating ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {reformulating ? 'Reformulation...' : 'Reformuler avec IA'}
                  </button>
                </div>
              )}
            </div>

            {/* ── AI Variants ── */}
            {aiVariants && (
              <div className="space-y-3">
                <button type="button" onClick={() => setShowVariants(v => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary w-full">
                  <Sparkles size={15} />
                  Variantes générées par l'IA
                  {showVariants ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
                </button>
                {showVariants && (
                  <div className="space-y-3">
                    <VariantCard platform="LinkedIn – Version formelle" icon={<LinkedinIcon />}
                      accentClass="text-blue-600" bgClass="border-blue-200 bg-blue-50/60"
                      text={aiVariants.linkedin}
                      onUse={t => { setText(t); toast('Texte remplacé', { description: 'Version LinkedIn appliquée.' }); }} />
                    <VariantCard platform="Instagram – Version courte" icon={<InstagramIcon />}
                      accentClass="text-pink-500" bgClass="border-pink-200 bg-pink-50/60"
                      text={aiVariants.instagram}
                      onUse={t => { setText(t); toast('Texte remplacé', { description: 'Version Instagram appliquée.' }); }} />
                    <Button variant="ghost" size="sm" onClick={handleAdaptWithAI} disabled={aiLoading}
                      className="gap-2 text-xs text-muted-foreground">
                      <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                      Régénérer les variantes
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Action de la publication ── */}
            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 px-4 py-4">
              <Label className="font-semibold text-sm flex items-center gap-2 text-foreground">
                🔗 Action de la publication
                {actionLink.trim() && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                    CTA actif
                  </span>
                )}
              </Label>

              {/* URL field */}
              <div className="relative">
                <input
                  type="url"
                  value={actionLink}
                  onChange={e => setActionLink(e.target.value)}
                  placeholder="Ajoutez un lien (Ex: votre lien de réservation Planity, Calendly, site internet...)"
                  className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                    actionLink.trim() ? 'border-primary/60 focus:border-primary' : 'border-border focus:border-primary/60'
                  }`}
                />
                {actionLink.trim() && (
                  <button
                    type="button"
                    onClick={() => setActionLink('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* CTA label picker */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Texte du bouton d'action</p>
                <div className="flex flex-wrap gap-2">
                  {(['Réserver', 'En savoir plus', 'Commander', 'Prendre RDV'] as const).map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setActionLabel(lbl)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                        actionLabel === lbl
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint when link is set */}
              {actionLink.trim() && (
                <p className="text-[11px] text-primary font-medium flex items-center gap-1.5">
                  ✨ L'IA ajoutera automatiquement un call-to-action dans les variantes générées.
                </p>
              )}
            </div>

            {/* ── UTM Campaign Tracking ── */}
            <UTMTagInput
              utmSource={utmSource}
              utmMedium={utmMedium}
              utmCampaign={utmCampaign}
              onChange={handleUtmChange}
            />

            {/* ── Media ── */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5"><ImagePlus size={14} /> Ajouter un média</Label>
              {mediaUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                  {mediaType === 'video' ? (
                    <video key={mediaUrl!} src={mediaUrl!} autoPlay muted loop playsInline className="w-full h-40 object-cover" />
                  ) : (
                    <img src={mediaUrl!} alt={mediaName} className="w-full h-40 object-cover" />
                  )}
                  <button type="button" onClick={() => { setMediaUrl(null); setMediaName(''); setMediaType('image'); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors">
                    <X size={13} className="text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                    <p className="text-white text-xs truncate">{mediaName || 'Image sélectionnée'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 cursor-pointer transition-all py-5 px-4 text-center">
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Glissez un fichier ou <span className="text-primary font-medium">parcourir</span></span>
                    <span className="text-[11px] text-muted-foreground/60">PNG, JPG, GIF, MP4 — max 10 Mo</span>
                    <input type="file" accept="image/*,video/*" className="sr-only" onChange={handleFileUpload} />
                  </label>
                  <button type="button" onClick={() => setImagePickerOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 transition-all px-5 py-5 text-center cursor-pointer">
                    <Search size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Image<br/>gratuite</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── Status ── */}
            <div className="space-y-2">
              <Label className="font-medium">Statut de la publication</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'draft',    label: 'Brouillon',               activeColor: 'bg-muted text-foreground border-foreground/40 ring-1 ring-foreground/20' },
                  { id: 'pending',  label: 'En attente de validation', activeColor: 'bg-orange-50 text-orange-700 border-orange-400 ring-1 ring-orange-200'   },
                  { id: 'approved', label: 'Approuvé',                 activeColor: 'bg-green-50 text-green-700 border-green-400 ring-1 ring-green-200'         },
                ] as { id: PostStatus; label: string; activeColor: string }[]).map(s => (
                  <button key={s.id} type="button" onClick={() => setStatus(s.id)}
                    className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all text-center ${
                      status === s.id ? s.activeColor : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Channels ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Canaux de diffusion</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(({ id, label, icon: Icon, color }) => {
                  const active = channels.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleChannel(id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30 text-foreground'
                      )}
                    >
                      <Icon className={cn('shrink-0', active ? 'text-primary-foreground' : color)} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* ⚡ Algorithm optimizer badge — one per selected channel */}
              {channels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {channels.filter(c => ['instagram', 'facebook', 'linkedin', 'tiktok'].includes(c)).map(c => {
                    const labels: Record<string, string> = {
                      instagram: '⚡ Optimisé algorithme Instagram',
                      facebook: '⚡ Optimisé algorithme Facebook',
                      linkedin: '⚡ Optimisé algorithme LinkedIn',
                      tiktok: '⚡ Optimisé algorithme TikTok',
                    };
                    return (
                      <span key={c} className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
                        {labels[c]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Date & Time ── */}
            <div className={cn('space-y-3 transition-opacity', isQueueSelected ? 'opacity-50 pointer-events-none' : '')}>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Date &amp; Heure de publication</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="post-date" className="font-medium flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={13} /> Date</Label>
                  <Input id="post-date" type="date" value={effectiveDate} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post-time" className="font-medium flex items-center gap-1 text-xs text-muted-foreground"><Clock size={13} /> Heure</Label>
                  <Input id="post-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── Validation notification toggle ── */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Bell size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Demander une validation 🔔</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Recevoir une notification avant publication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequiresValidation(v => !v)}
                className={cn(
                  'relative w-10 h-[22px] rounded-full transition-all duration-200 shrink-0',
                  requiresValidation ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200',
                  requiresValidation ? 'left-[18px]' : 'left-0.5'
                )} />
              </button>
            </div>

            {/* Queue button */}
            <button type="button"
              onClick={() => {
                if (!isQueueSelected) {
                  handleAddToQueue();
                  setIsQueueSelected(true);
                } else {
                  setIsQueueSelected(false);
                }
              }}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all group select-none ${
                isQueueSelected
                  ? 'border-primary bg-primary/10 border-solid'
                  : 'border-dashed border-primary/40 hover:border-primary bg-primary/3 hover:bg-primary/8'
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isQueueSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 group-hover:bg-primary/20'
              }`}>
                {isQueueSelected ? <Check size={15} className="text-primary-foreground" /> : <ListOrdered size={15} className="text-primary" />}
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-primary text-xs">
                  {isQueueSelected ? '✓ Créneau assigné automatiquement' : "Ajouter à la file d'attente"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Assigne automatiquement le prochain créneau libre défini dans vos paramètres.
                </p>
              </div>
            </button>

            {channels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {channels.map(c => {
                  const ch = CHANNELS.find(x => x.id === c);
                  return ch ? <Badge key={c} variant="secondary" className="gap-1 text-xs">{ch.label}</Badge> : null;
                })}
              </div>
            )}

            {/* ── Library checkbox ── */}
            <button type="button" onClick={() => setAddToLib(v => !v)}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                addToLib ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-card'
              }`}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                addToLib ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background'
              }`}>
                {addToLib && <Check size={11} className="text-primary-foreground" strokeWidth={3} />}
              </div>
              <BookMarked size={15} className={addToLib ? 'text-primary shrink-0' : 'text-muted-foreground shrink-0'} />
              <div className="text-left">
                <span className={`font-medium ${addToLib ? 'text-primary' : 'text-foreground'}`}>
                  Ajouter à ma bibliothèque de contenus permanents
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ce post sera republié automatiquement quand votre calendrier est vide.
                </p>
              </div>
            </button>
          </div>{/* end space-y-5 */}
          </div>{/* end left form */}

          {/* ── Middle: AI Brainstorm Panel ── */}
          {showBrainstorm && (
            <div className="w-[260px] shrink-0 overflow-hidden flex flex-col">
              <AIBrainstormPanel
                currentText={text}
                onUseIdea={(hook) => {
                  if (!text.trim()) {
                    setText(hook);
                    toast('Idée appliquée !', { description: 'Personnalisez le texte à votre image.' });
                  } else {
                    setText(hook);
                    toast('Texte remplacé', { description: "L'idée IA est maintenant dans votre texte." });
                  }
                }}
                onReplaceText={(newText) => setText(newText)}
                activeTab={brainstormTab}
                onTabChange={setBrainstormTab}
              />
            </div>
          )}

          {/* ── Right: Phone Preview ── */}
          <div className="w-[260px] shrink-0 border-l border-border bg-muted/20 overflow-y-auto flex flex-col items-center py-5 px-4 gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Aperçu Réaliste</p>
            <PhonePreview
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              text={text}
              channels={channels}
              actionLink={actionLink}
              actionLabel={actionLabel}
              contentFormat={contentFormat}
              textStyle={textStyle}
            />

            {/* ── White-label badge ── */}
            {currentPlan.id === 'free' && !isDemoActive ? (
              <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                <span className="text-base shrink-0 leading-none mt-0.5">💡</span>
                <p className="text-[11px] text-amber-800 leading-snug">
                  <span className="font-bold">Mode Gratuit :</span> la mention{' '}
                  <span className="font-semibold italic">« Généré par Kompilot 🚀 »</span>{' '}
                  sera ajoutée discrètement à la fin de votre post.
                </p>
              </div>
            ) : (
              <div className="w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 flex items-start gap-2">
                <span className="text-base shrink-0 leading-none mt-0.5">✨</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-green-800 leading-none">Option Marque Blanche active</p>
                  <p className="text-[11px] text-green-700 mt-0.5 leading-snug">Aucun logo ni mention Kompilot sur vos publications.</p>
                </div>
              </div>
            )}
          </div>
          </div>{/* end flex row */}

          <ImagePickerModal
            open={imagePickerOpen}
            onClose={() => setImagePickerOpen(false)}
            textContext={text}
            onSelect={(url, type) => {
              setMediaUrl(url);
              setMediaType(type ?? 'image');
              setMediaName(type === 'video' ? 'Vidéo sélectionnée' : 'Image Unsplash');
            }}
          />

        {/* Insufficient credits modal */}
        {insufficientOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setInsufficientOpen(false); }}>
            <div className="w-full max-w-sm bg-background rounded-3xl border border-border shadow-2xl p-7 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                <Zap size={28} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Solde insuffisant</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Vous avez atteint votre limite mensuelle. Passez à une offre supérieure pour continuer à publier.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Link to="/subscription" onClick={() => setInsufficientOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-sm font-bold py-2.5 hover:opacity-90 transition-opacity">
                  <Zap size={14} /> Voir les offres
                </Link>
                <button onClick={() => setInsufficientOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Team comments — only shown when editing an existing saved post */}
          {editingPost?.id && (
            <div className="shrink-0 px-6 pb-3">
              <PostComments
                postId={editingPost.id}
                workspaceOwnerId={editingPost.userId}
              />
            </div>
          )}

          <div className="shrink-0 px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleClose}>Annuler</Button>
              <button
                onClick={() => setAdsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-violet-300 bg-gradient-to-r from-violet-50 to-emerald-50 hover:from-violet-100 hover:to-emerald-100 px-3 py-2 text-xs font-bold text-violet-700 transition-all shadow-sm"
              >
                🚀 Booster la visibilité locale
              </button>
              <div className="flex items-center gap-3">
                <span className={['text-xs font-semibold flex items-center gap-1', creditsEmpty ? 'text-red-500' : 'text-muted-foreground'].join(' ')}>
                  <Zap size={12} />
                  {creditsEmpty ? 'Limite mensuelle atteinte' : `${usage} / ${limit} ${currentPlan.id === 'expert' ? 'contenus' : 'posts'} ce mois`}
                </span>
                {teamModeEnabled ? (
                  <Button
                    onClick={() => {
                      if (!text.trim()) { toast.error('Le texte est requis.'); return; }
                      if (channels.length === 0) { toast.error('Choisissez au moins un canal.'); return; }
                      submitForValidation({ text, channels, date: effectiveDate || new Date().toISOString().split('T')[0], time });
                      clearDraft();
                      handleClose();
                    }}
                    disabled={saving}
                    className="gap-2 bg-orange-600 hover:bg-orange-500 text-white"
                  >
                    🚀 Envoyer à {validatorName}
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={saving || creditsEmpty} className="gap-2">
                    {saving ? 'Planification...' : '📅 Planifier'}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
              ✍️ En publiant, vous acceptez la responsabilité éditoriale du contenu généré par l'IA.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Local Ads modal */}
      <LocalAdsModal
        open={adsModalOpen}
        postTitle={text.slice(0, 60) || undefined}
        onClose={() => setAdsModalOpen(false)}
      />

      {/* Story paywall modal */}
      <UpgradeModal
        open={storyPaywallOpen}
        onClose={() => setStoryPaywallOpen(false)}
        targetPlan="expert"
        storiesPaywall
      />

      {/* First post celebration overlay */}
      {showCelebration && (
        <FirstPostCelebration
          firstName={firstName}
          onClose={() => {
            setShowCelebration(false);
            handleClose();
          }}
        />
      )}
    </>
  );
}
