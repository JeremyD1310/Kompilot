/**
 * AuditFlashModal — "Audit de Visibilité Global" IA conversion tool.
 * Phase 1 : Form with network checkboxes.
 * Phase 2 : Sophisticated animated API-style scan.
 * Phase 3 : Rich results dashboard — radial gauge + per-platform table + GEO Radar + CTA.
 */
import { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, Sparkles, Rocket, CheckCircle2, AlertTriangle, XCircle,
  Search, TrendingUp, Globe, Camera, Users, Star, Clock, Zap, Bot,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { GeoRadarSection, buildGeoResult } from './GeoRadarSection';
import { safeApiCall } from '../../lib/safeApiCall';
import { SafeModeBanner } from '../shared/SafeModeBanner';
import { CreditCostBadge, useCreditGuard } from '../shared/CreditCostBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditFlashModalProps {
  open: boolean;
  onClose: () => void;
  bookingUrl?: string;
  bookingPlatformName?: string;
}

type Phase = 'form' | 'scanning' | 'results';
type ScoreLevel = 'good' | 'warn' | 'bad';
type Sector = 'beauty' | 'restaurant' | 'generic';

interface NetworkToggle {
  id: string;
  label: string;
  emoji: string;
}

interface ApiStep {
  platform: string;
  emoji: string;
  message: string;
  detail: string;
  duration: number; // ms simulated
}

interface PlatformResult {
  name: string;
  emoji: string;
  score: number;
  level: ScoreLevel;
  findings: string[];
}

interface AuditResult {
  globalScore: number;
  globalLabel: string;
  platforms: PlatformResult[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NETWORKS: NetworkToggle[] = [
  { id: 'google',    label: 'Google Maps',    emoji: '📍' },
  { id: 'instagram', label: 'Instagram',      emoji: '📸' },
  { id: 'facebook',  label: 'Facebook',       emoji: '👥' },
  { id: 'tiktok',    label: 'TikTok',         emoji: '🎵' },
  { id: 'linkedin',  label: 'LinkedIn',       emoji: '💼' },
  { id: 'seo',       label: 'Site Web (SEO)', emoji: '🌐' },
];

const API_STEPS: ApiStep[] = [
  {
    platform: 'Google Business Profile',
    emoji: '📍',
    message: 'Interrogation des données Google Business Profile…',
    detail: 'Score de Fiche · Avis · Photos · Mots-clés',
    duration: 900,
  },
  {
    platform: 'Instagram',
    emoji: '📸',
    message: "Vérification de l'activité Instagram…",
    detail: 'Derniers Posts & Reels · Fréquence · Bio CTA',
    duration: 800,
  },
  {
    platform: 'Facebook',
    emoji: '👥',
    message: 'Analyse du maillage interne Facebook…',
    detail: "Bouton d'action · Avis · Dernière publication",
    duration: 750,
  },
  {
    platform: 'SEO Local',
    emoji: '🌐',
    message: 'Crawl SEO du site web…',
    detail: 'Mots-clés locaux · Balises · Vitesse de chargement',
    duration: 1000,
  },
  {
    platform: 'TikTok',
    emoji: '🎵',
    message: 'Analyse du compte TikTok Business…',
    detail: 'Vidéos · Fréquence · Taux de complétion · Hashtags locaux',
    duration: 850,
  },
  {
    platform: 'LinkedIn',
    emoji: '💼',
    message: 'Vérification de la page LinkedIn…',
    detail: 'Page entreprise · Posts · Abonnés · Optimisation profil',
    duration: 780,
  },
  {
    platform: 'GEO_AI',
    emoji: '🤖',
    message: 'Interrogation ChatGPT, Gemini & Perplexity… Scan GEO en cours…',
    detail: 'Vérification de votre présence dans les réponses IA locales · Share of Voice',
    duration: 1100,
  },
  {
    platform: 'IA',
    emoji: '📊',
    message: 'Compilation du rapport IA…',
    detail: 'Calcul du score global · Priorisation des leviers',
    duration: 600,
  },
];

const EXAMPLE_CHIPS = ['Salon de coiffure La Rochelle', 'Restaurant Paris 11', 'Boulangerie Lyon', 'Boutique mode Bordeaux'];

// ── Sector detection ──────────────────────────────────────────────────────────

function detectSector(input: string): Sector {
  const s = input.toLowerCase();
  if (/coiff|beaut|salon|esth|ongle|spa|barb|institut/.test(s)) return 'beauty';
  if (/restau|brasserie|bistro|café|caf|pizza|sushi|burger|traiteur|boulang|pâtiss|patiss/.test(s)) return 'restaurant';
  return 'generic';
}

// ── Audit data builder ────────────────────────────────────────────────────────

function buildAuditResult(sector: Sector, query: string, networks: string[], bookingPlatformName?: string): AuditResult {
  const city = query.match(/\b([A-ZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜ][a-zàâæçéèêëîïôœùûü]{2,})\b/g)?.pop() || 'votre ville';

  const byBeauty: Record<string, PlatformResult> = {
    google: {
      name: 'Google Maps',
      emoji: '📍',
      score: 75,
      level: 'warn',
      findings: [
        'Note : 4,7 / 5 ⭐ (Excellente)',
        'Dernier avis reçu : il y a 23 jours — manque de régularité',
        '15 avis sans réponse du gérant détectés',
        'Score de complétude de la fiche : 68%',
      ],
    },
    instagram: {
      name: 'Instagram',
      emoji: '📸',
      score: 42,
      level: 'bad',
      findings: [
        'Dernier post : il y a 11 jours',
        '0 Reels publiés ce mois-ci',
        bookingPlatformName
          ? `⚠️ Perte de conversion : Votre lien ${bookingPlatformName} absent de la bio Instagram — vous perdez des réservations directes`
          : 'Bio sans lien de réservation (CTA manquant)',
        'Fréquence cible : 3 posts/semaine — actuel : 1 post/semaine',
      ],
    },
    facebook: {
      name: 'Facebook',
      emoji: '👥',
      score: 61,
      level: 'warn',
      findings: [
        bookingPlatformName
          ? `⚠️ Bouton d'action Facebook : votre lien ${bookingPlatformName} n'est pas configuré comme bouton de réservation principal`
          : "Bouton d'action : non configuré (manque à gagner direct)",
        'Note Facebook : 4,5/5 — 3 avis sans réponse',
        'Dernière publication : il y a 8 jours',
      ],
    },
    seo: {
      name: 'SEO Site Web',
      emoji: '🌐',
      score: 38,
      level: 'bad',
      findings: [
        `Mots-clés locaux absents : "Coiffeur ${city}", "Salon beauté ${city}"`,
        'Balise Title non optimisée pour la recherche locale',
        'Vitesse de chargement mobile : lente (score 51/100)',
      ],
    },
    tiktok: {
      name: 'TikTok',
      emoji: '🎵',
      score: 29,
      level: 'bad',
      findings: [
        'Compte TikTok Business non revendiqué ou absent',
        'TikTok génère 3× plus de portée organique que Instagram en 2025',
        'Format Vidéo courte : idéal pour montrer des avant/après (coiffure, soin)',
        'Concurrents actifs sur TikTok dans votre secteur — vous perdez de la visibilité',
      ],
    },
    linkedin: {
      name: 'LinkedIn',
      emoji: '💼',
      score: 44,
      level: 'warn',
      findings: [
        'Page LinkedIn entreprise incomplète (sans logo ni bannière)',
        'Dernier post LinkedIn : il y a plus de 3 semaines',
        'Opportunité B2B : partenariats salons, grossistes beauté non exploitée',
        '0 recommandations clients visibles sur le profil',
      ],
    },
  };

  const byRestaurant: Record<string, PlatformResult> = {
    google: {
      name: 'Google Maps',
      emoji: '📍',
      score: 72,
      level: 'warn',
      findings: [
        'Note : 4,2 / 5 ⭐ (Bonne)',
        '15% des avis 4 et 5 étoiles sans réponse optimisée SEO',
        'Menu non mis à jour depuis 2 mois',
        'Photos : 8 photos — recommandé : 20+',
      ],
    },
    instagram: {
      name: 'Instagram',
      emoji: '📸',
      score: 48,
      level: 'warn',
      findings: [
        'Dernier post : il y a 7 jours',
        '0 Reels publiés ce mois-ci (format prioritaire 2025)',
        bookingPlatformName
          ? `⚠️ Perte de conversion : Votre lien ${bookingPlatformName} absent de la bio Instagram. Vous passez à côté de 71% de réservations directes.`
          : 'Bio sans lien de réservation (ex: TheFork, Zenchef)',
        'Engagement rate : 1,2% — moyenne du secteur : 3,5%',
      ],
    },
    facebook: {
      name: 'Facebook',
      emoji: '👥',
      score: 55,
      level: 'warn',
      findings: [
        bookingPlatformName
          ? `⚠️ Bouton ${bookingPlatformName} non synchronisé : configurez-le comme bouton d'action principal sur votre Page Facebook`
          : 'Bouton réservation non synchronisé avec le site',
        'Dernière publication : il y a 12 jours',
        '4 commentaires clients sans réponse',
      ],
    },
    seo: {
      name: 'SEO Site Web',
      emoji: '🌐',
      score: 44,
      level: 'warn',
      findings: [
        `Mot-clé principal absent : "Restaurant ${city}"`,
        'Schema.org LocalBusiness non configuré',
        'Page Google My Business non liée au site',
      ],
    },
    tiktok: {
      name: 'TikTok',
      emoji: '🎵',
      score: 22,
      level: 'bad',
      findings: [
        'Aucune présence TikTok détectée pour votre restaurant',
        'TikTok Food est le hashtag le plus viral en France (2,1 Mds de vues)',
        'Format idéal : vidéos cuisine en coulisse, plats du jour, ambiance salle',
        '45% des 18–34 ans découvrent des restaurants via TikTok — audience non captée',
      ],
    },
    linkedin: {
      name: 'LinkedIn',
      emoji: '💼',
      score: 38,
      level: 'bad',
      findings: [
        'Page LinkedIn absente ou non revendiquée',
        `Opportunité B2B : privatisations, repas d'affaires, événements corporate à ${city}`,
        'LinkedIn Ads ciblant les décideurs locaux non exploité',
        'Partenariats traiteur / entreprise non mis en avant',
      ],
    },
  };

  const byGeneric: Record<string, PlatformResult> = {
    google: {
      name: 'Google Maps',
      emoji: '📍',
      score: 58,
      level: 'warn',
      findings: [
        'Fiche Google Business incomplète (58% de complétude)',
        'Horaires non vérifiés depuis 3 mois',
        'Derniers avis non traités : 8 avis sans réponse',
        'Catégorie principale non optimisée',
      ],
    },
    instagram: {
      name: 'Instagram',
      emoji: '📸',
      score: 35,
      level: 'bad',
      findings: [
        'Dernier post : il y a 18 jours',
        '0 Reels ce mois — format le plus mis en avant par Instagram',
        'Bio sans lien CTA ni lien de réservation',
        'Hashtags non optimisés pour la recherche locale',
      ],
    },
    facebook: {
      name: 'Facebook',
      emoji: '👥',
      score: 49,
      level: 'warn',
      findings: [
        "Bouton d'action non configuré sur la page",
        'Dernière publication : il y a 15 jours',
        'Services et horaires non renseignés',
      ],
    },
    seo: {
      name: 'SEO Site Web',
      emoji: '🌐',
      score: 33,
      level: 'bad',
      findings: [
        `Aucun mot-clé local détecté dans les balises`,
        'Site non référencé sur Google My Business',
        'Vitesse mobile critique — pénalise le classement Google',
      ],
    },
    tiktok: {
      name: 'TikTok',
      emoji: '🎵',
      score: 31,
      level: 'bad',
      findings: [
        'Compte TikTok Business non créé ou non revendiqué',
        'TikTok dépasse Google pour la recherche locale chez les 18–35 ans',
        'Format vidéo court : montrez votre équipe, vos coulisses, vos produits phares',
        'Concurrents locaux déjà actifs sur TikTok dans votre secteur',
      ],
    },
    linkedin: {
      name: 'LinkedIn',
      emoji: '💼',
      score: 41,
      level: 'warn',
      findings: [
        'Page LinkedIn entreprise incomplète ou absente',
        'Aucun post professionnel ces 30 derniers jours',
        'Opportunité B2B non exploitée (partenariats, prescripteurs locaux)',
        'Description entreprise sans mots-clés sectoriels ni localisation',
      ],
    },
  };

  const map = sector === 'beauty' ? byBeauty : sector === 'restaurant' ? byRestaurant : byGeneric;

  const platforms: PlatformResult[] = networks
    .filter(n => map[n])
    .map(n => map[n]);

  // Assign level correctly
  platforms.forEach(p => {
    if (p.score >= 70) p.level = 'good';
    else if (p.score >= 50) p.level = 'warn';
    else p.level = 'bad';
  });

  const globalScore = platforms.length
    ? Math.round(platforms.reduce((s, p) => s + p.score, 0) / platforms.length)
    : 60;

  const globalLabel = globalScore >= 75
    ? 'Bonne visibilité, mais 2 leviers bloquants'
    : globalScore >= 55
      ? 'Bon potentiel, mais 3 leviers bloquants'
      : 'Visibilité critique — 4 leviers à corriger d\'urgence';

  return { globalScore, globalLabel, platforms };
}

// ── SVG Radial Gauge ──────────────────────────────────────────────────────────

function RadialGauge({ score, label }: { score: number; label: string }) {
  const R = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
        {/* Track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.3s' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="800" fill="hsl(var(--foreground))">
          {score}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
          / 100
        </text>
      </svg>
      <div className="text-center space-y-0.5 max-w-[200px]">
        <p className="text-xs font-bold text-foreground leading-snug">{label}</p>
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-semibold text-muted-foreground">
            {score >= 70 ? 'Bonne performance' : score >= 50 ? 'À optimiser' : 'Action urgente requise'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, level }: { score: number; level: ScoreLevel }) {
  const color = level === 'good' ? 'bg-emerald-500' : level === 'warn' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-[11px] font-extrabold tabular-nums shrink-0 w-8 text-right',
        level === 'good' ? 'text-emerald-600' : level === 'warn' ? 'text-amber-600' : 'text-red-600'
      )}>
        {score}
      </span>
    </div>
  );
}

// ── Level helpers ─────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<ScoreLevel, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-red-50 text-red-700 border-red-200',
};

const LEVEL_ICON: Record<ScoreLevel, React.ReactNode> = {
  good: <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />,
  warn: <AlertTriangle size={13} className="text-amber-500 shrink-0" />,
  bad: <XCircle size={13} className="text-red-500 shrink-0" />,
};

const LEVEL_LABEL: Record<ScoreLevel, string> = {
  good: '✅ Bon',
  warn: '⚠️ À améliorer',
  bad: '🔴 Critique',
};

// ── Main component ────────────────────────────────────────────────────────────

export function AuditFlashModal({ open, onClose, bookingUrl, bookingPlatformName }: AuditFlashModalProps) {
  const navigate = useNavigate();
  const { guard: creditGuard, modalNode: creditModal } = useCreditGuard({ cost: 10, action: 'GEO_RADAR_SCAN' });

  // Form
  const [query, setQuery] = useState('');
  const [checkedNetworks, setCheckedNetworks] = useState<Record<string, boolean>>({
    google: true, instagram: true, facebook: true, tiktok: true, linkedin: true, seo: true,
  });

  // Scan
  const [phase, setPhase] = useState<Phase>('form');
  const [apiStepIndex, setApiStepIndex] = useState(0);  // which API step is active
  const [stepStatus, setStepStatus] = useState<('pending' | 'active' | 'done')[]>(API_STEPS.map(() => 'pending'));
  const [scanProgress, setScanProgress] = useState(0);
  const [stepDuration, setStepDuration] = useState(''); // simulated response time

  // Results
  const [result, setResult] = useState<AuditResult | null>(null);
  const [geoResult, setGeoResult] = useState<import('./GeoRadarSection').GeoResult | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [safeMode, setSafeMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset
  useEffect(() => {
    if (open) {
      setPhase('form');
      setQuery('');
      setCheckedNetworks({ google: true, instagram: true, facebook: true, tiktok: true, linkedin: true, seo: true });
      setApiStepIndex(0);
      setStepStatus(API_STEPS.map(() => 'pending'));
      setScanProgress(0);
      setResult(null);
      setGeoResult(null);
      setExpandedPlatform(null);
      setSafeMode(false); // Reset safeMode on open
      setTimeout(() => inputRef.current?.focus(), 80);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [open]);

  const toggleNetwork = (id: string) => {
    setCheckedNetworks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      // ensure at least one is checked
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  // ── Scan engine ──────────────────────────────────────────────────────────────
  const runScan = async () => {
    if (!query.trim()) return;
    setPhase('scanning');

    const activeSteps = API_STEPS.filter((_, i) => {
      const net = ['google', 'instagram', 'facebook', 'tiktok', 'linkedin', 'seo', null, null][i];
      return net === null || checkedNetworks[net as string];
    });
    const totalSteps = activeSteps.length;
    const initialStatus: ('pending' | 'active' | 'done')[] = API_STEPS.map(() => 'pending');
    setStepStatus(initialStatus);

    let progressAccum = 0;
    const progressPerStep = 100 / totalSteps;

    for (let i = 0; i < API_STEPS.length; i++) {
      const net = ['google', 'instagram', 'facebook', 'tiktok', 'linkedin', 'seo', null, null][i];
      // skip unchecked platforms (but always run AI step)
      if (net !== null && !checkedNetworks[net as string]) continue;

      setApiStepIndex(i);
      setStepStatus(prev => prev.map((s, j) => j === i ? 'active' : s));
      const ms = API_STEPS[i].duration;
      setStepDuration(`${(ms / 1000).toFixed(1)}s`);

      await new Promise<void>(resolve => {
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 60;
          setScanProgress(Math.round(progressAccum + (elapsed / ms) * progressPerStep));
          if (elapsed >= ms) {
            clearInterval(interval);
            resolve();
          }
        }, 60);
      });

      progressAccum += progressPerStep;
      setScanProgress(Math.round(progressAccum));
      setStepStatus(prev => prev.map((s, j) => j === i ? 'done' : s));
    }

    setScanProgress(100);

    // Build result with safe mode protection
    const sector = detectSector(query);
    const activeNetworks = NETWORKS.filter(n => checkedNetworks[n.id]).map(n => n.id);
    const businessName = query.split('—')[0].trim() || query.split(',')[0].trim();

    const auditResult = await safeApiCall(
      async () => buildAuditResult(sector, query, activeNetworks, bookingPlatformName),
      {
        cacheKey: `audit_${businessName}_${sector}`,
        fallback: buildAuditResult(sector, query, activeNetworks, bookingPlatformName),
        timeoutMs: 6000,
        serviceLabel: 'Audit GEO IA',
      },
    );

    const geoApiResult = await safeApiCall(
      async () => buildGeoResult(businessName, query, sector),
      {
        cacheKey: `geo_${businessName}_${sector}`,
        fallback: buildGeoResult(businessName, query, sector),
        timeoutMs: 6000,
        serviceLabel: 'ChatGPT/Gemini/Perplexity GEO',
      },
    );

    setSafeMode(auditResult.status === 'fallback' || geoApiResult.status === 'fallback');
    setResult(auditResult.data);
    setGeoResult(geoApiResult.data);
    await new Promise(r => setTimeout(r, 300));
    setPhase('results');
  };

  const handleCTA = (prefillKw?: string) => {
    if (prefillKw) sessionStorage.setItem('kompilot_geo_prefill', prefillKw);
    onClose();
    navigate({ to: '/cockpit' });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm"
        onClick={() => phase !== 'scanning' && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[93vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50 to-teal-50 dark:from-violet-950/30 dark:to-teal-950/20 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
              <Search size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground tracking-tight">
                AUDIT DE VISIBILITÉ GLOBAL ✨
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Analyse multi-plateforme de votre présence locale · Rapport IA en temps réel
              </p>
            </div>
            {phase !== 'scanning' && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 px-5 py-5">

            {/* ══════════ FORM PHASE ══════════ */}
            {phase === 'form' && (
              <div className="space-y-5">
                {/* GEO alert banner */}
                <div className="flex items-start gap-3 rounded-xl border border-violet-300 dark:border-violet-700 bg-gradient-to-r from-violet-50 to-teal-50 dark:from-violet-950/30 dark:to-teal-950/20 px-4 py-3">
                  <Bot size={18} className="text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-extrabold text-violet-800 dark:text-violet-300 leading-snug">
                      🤖 Visibilité IA (GEO) : Quand un habitant demande à ChatGPT ou Perplexity une bonne adresse dans votre quartier, est-ce que l'IA donne votre nom ou celui de vos concurrents ?
                    </p>
                    <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1">
                      Cet audit inclut un <strong>Radar des Recommandations IA</strong> — analysez votre score GEO en temps réel.
                    </p>
                  </div>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Nom ou adresse précise de votre établissement (Fiche Google) 👇
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder='Ex: "Salon Bella Vista — 12 rue de la Paix, Lyon"'
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && query.trim() && runScan()}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {EXAMPLE_CHIPS.map(ex => (
                      <button
                        key={ex}
                        onClick={() => setQuery(ex)}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                          query === ex
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Network checkboxes */}
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Réseaux à analyser
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {NETWORKS.map(net => (
                      <label
                        key={net.id}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all select-none',
                          checkedNetworks[net.id]
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-card hover:border-border/60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedNetworks[net.id]}
                          onChange={() => toggleNetwork(net.id)}
                          className="w-4 h-4 accent-primary shrink-0"
                        />
                        <span className="text-sm">{net.emoji}</span>
                        <span className={cn(
                          'text-xs font-semibold',
                          checkedNetworks[net.id] ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {net.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Launch button */}
                <button
                  onClick={() => creditGuard(runScan)}
                  disabled={!query.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white text-sm font-extrabold py-4 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Rocket size={16} />
                  Lancer l'Analyse Réelle &amp; Approfondie 🚀
                  <CreditCostBadge cost={10} variant="ghost" className="text-white/80" />
                </button>
                {creditModal}

                <p className="text-center text-[10px] text-muted-foreground">
                  🔒 Simulation réaliste · Aucune donnée externe collectée · 100% gratuit
                </p>
              </div>
            )}

            {/* ══════════ SCANNING PHASE ══════════ */}
            {phase === 'scanning' && (
              <div className="space-y-5 py-2">
                {/* Header */}
                <div className="text-center space-y-1.5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg mb-2">
                    <Zap size={24} className="text-white animate-pulse" />
                  </div>
                  <p className="text-base font-extrabold text-foreground">Analyse approfondie en cours…</p>
                  <p className="text-xs text-muted-foreground">Interrogation des APIs · Ne fermez pas cette fenêtre</p>
                </div>

                {/* Master progress */}
                <div className="space-y-1.5">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">{scanProgress}% traité</span>
                    <span>Temps restant estimé…</span>
                  </div>
                </div>

                {/* API step rows */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                    <p className="text-[11px] font-bold text-foreground">Requêtes API en cours</p>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{stepDuration}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {API_STEPS.map((step, i) => {
                      const net = ['google', 'instagram', 'facebook', 'tiktok', 'linkedin', 'seo', null, null][i];
                      if (net !== null && !checkedNetworks[net as string]) return null;
                      const status = stepStatus[i];
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex items-start gap-3 px-3 py-2.5 transition-all',
                            status === 'active' ? 'bg-violet-50/60 dark:bg-violet-950/20' : ''
                          )}
                        >
                          {/* Status indicator */}
                          <div className="mt-0.5 shrink-0">
                            {status === 'done'
                              ? <CheckCircle2 size={14} className="text-emerald-500" />
                              : status === 'active'
                                ? <span className="inline-block w-3.5 h-3.5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                : <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 bg-muted/30 inline-block" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-xs font-semibold leading-tight',
                              status === 'pending' ? 'text-muted-foreground/50' : 'text-foreground'
                            )}>
                              {step.emoji} {step.message}
                            </p>
                            {status !== 'pending' && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                            )}
                          </div>
                          {status === 'done' && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">OK</span>
                          )}
                          {status === 'active' && (
                            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-1.5 py-0.5 shrink-0 animate-pulse">…</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ RESULTS PHASE ══════════ */}
            {phase === 'results' && result && (
              <div className="space-y-5">

                {/* Safe mode banner — shown when fallback data was used */}
                {safeMode && (
                  <SafeModeBanner
                    message="Analyse locale en cours d'optimisation. Ces résultats sont basés sur les dernières données disponibles."
                    onRetry={() => { setPhase('form'); setSafeMode(false); }}
                    compact
                  />
                )}

                {/* Section title */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <TrendingUp size={13} className="text-violet-600" />
                  </div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Rapport de visibilité IA</p>
                  <span className="ml-auto text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {result.platforms.filter(p => p.level !== 'good').length} leviers bloquants
                  </span>
                </div>

                {/* Global score — radial gauge centered */}
                <div className="rounded-xl border border-border bg-gradient-to-br from-muted/20 to-background p-4 flex flex-col items-center gap-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Score global de visibilité</p>
                  <RadialGauge score={result.globalScore} label={result.globalLabel} />
                  {/* Quick legend */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />0–49 Critique</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />50–69 À améliorer</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />70+ Bon</span>
                  </div>
                </div>

                {/* Booking platform banner */}
                {bookingUrl
                  ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-4 py-2.5">
                      <span className="text-base shrink-0">✅</span>
                      <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        Lien {bookingPlatformName ?? 'de réservation'} détecté — votre page de réservation est active
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-2.5">
                      <span className="text-base shrink-0">⚠️</span>
                      <p className="text-[11px] font-semibold text-red-800 dark:text-red-300">
                        Aucun outil de réservation en ligne configuré — jusqu&apos;à 68% de conversions perdues
                      </p>
                    </div>
                  )
                }

                {/* Per-platform diagnostic */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
                    <Globe size={12} className="text-muted-foreground" />
                    <p className="text-[11px] font-bold text-foreground">Diagnostic par plateforme</p>
                    <span className="ml-auto text-[10px] text-muted-foreground">Cliquez pour voir le détail →</span>
                  </div>
                  <div className="divide-y divide-border">
                    {result.platforms.map((platform) => (
                      <div key={platform.name}>
                        {/* Row */}
                        <button
                          onClick={() => setExpandedPlatform(expandedPlatform === platform.name ? null : platform.name)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                        >
                          <span className="text-base shrink-0">{platform.emoji}</span>
                          <span className="text-xs font-bold text-foreground flex-1 min-w-0 truncate">{platform.name}</span>
                          <div className="w-[110px] shrink-0">
                            <ScoreBar score={platform.score} level={platform.level} />
                          </div>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold shrink-0 hidden sm:inline-flex', LEVEL_BADGE[platform.level])}>
                            {LEVEL_LABEL[platform.level]}
                          </span>
                        </button>
                        {/* Expanded findings */}
                        {expandedPlatform === platform.name && (
                          <div className={cn('px-4 pb-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 border-t', 'border-border bg-muted/10')}>
                            {platform.findings.map((f, j) => (
                              <div key={j} className="flex items-start gap-2">
                                {LEVEL_ICON[platform.level]}
                                <p className="text-[11px] text-foreground leading-snug">{f}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick stats strip */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <Star size={12} />, label: 'Avis sans réponse', value: '15', color: 'text-amber-600' },
                    { icon: <Clock size={12} />, label: 'Jours sans post', value: '11', color: 'text-red-600' },
                    { icon: <Camera size={12} />, label: 'Reels ce mois', value: '0', color: 'text-red-600' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2.5 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">{stat.icon}</div>
                      <p className={cn('text-xl font-extrabold tabular-nums', stat.color)}>{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── GEO Radar Section ── */}
                {geoResult && (
                  <GeoRadarSection
                    result={geoResult}
                    onNavigateCockpit={(kw) => handleCTA(kw)}
                  />
                )}

                {/* CTA block */}
                <div className="rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-teal-50 dark:from-violet-950/30 dark:to-teal-950/20 p-5 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-violet-600" />
                    <p className="text-sm font-extrabold text-violet-900 dark:text-violet-200 leading-snug">
                      💡 Kompilot peut corriger ces {result.platforms.filter(p => p.level !== 'good').length} points en 10 secondes par semaine
                    </p>
                  </div>
                  <p className="text-xs text-violet-700 dark:text-violet-300 leading-snug">
                    Avis Google automatisés · Publications IA régulières · Lien de réservation optimisé · SEO local boosté.
                    <br />Propulsez votre commerce dès aujourd'hui !
                  </p>
                  <button
                    onClick={handleCTA}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white text-sm font-extrabold py-3.5 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
                  >
                    <Rocket size={15} />
                    Essayer gratuitement (Sans carte bancaire) 🚀
                  </button>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                    <span>✅ Aucun engagement</span>
                    <span>·</span>
                    <span>✅ Accès immédiat</span>
                    <span>·</span>
                    <span>✅ Résiliation à tout moment</span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
