import { useState } from 'react';
import { RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { Button, Badge, Card, cn } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoMode, type DemoSector } from '@/context/DemoModeContext';
import { TermTooltip } from '../shared/TermTooltip';

// ── Sector-specific platform source matrices ──────────────────────────────────

type SourceRow = { badge: string; badgeColor: string; status: string; statusColor: string; desc: string; action?: string; actionColor?: string };

const SECTOR_SOURCES: Record<DemoSector, SourceRow[]> = {
  beauty: [
    { badge: 'planity.com', badgeColor: 'border-violet-300/60 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucun avis Planity indexé par les IA ce mois-ci', action: 'Optimiser →', actionColor: 'text-violet-500 border-violet-300/60 bg-violet-50 dark:bg-violet-950/20' },
    { badge: 'treatwell.fr', badgeColor: 'border-pink-300/60 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune évaluation Treatwell visible dans ChatGPT', action: 'Publier →', actionColor: 'text-pink-500 border-pink-300/60 bg-pink-50 dark:bg-pink-950/20' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '2 questions', statusColor: 'text-amber-500', desc: '2 questions sans réponse sur votre fiche Google', action: 'Répondre →', actionColor: 'text-teal-600 border-teal-300/60 bg-teal-50 dark:bg-teal-950/20' },
    { badge: 'instagram', badgeColor: 'border-orange-300/60 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30', status: '1 mention', statusColor: 'text-emerald-500', desc: 'Cité dans 1 Reel beauté en avril 2025' },
  ],
  medical: [
    { badge: 'doctolib.fr', badgeColor: 'border-sky-300/60 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30', status: 'Non indexé', statusColor: 'text-red-500', desc: 'Profil Doctolib non détecté par Perplexity', action: 'Optimiser →', actionColor: 'text-sky-500 border-sky-300/60 bg-sky-50 dark:bg-sky-950/20' },
    { badge: 'ameli.fr', badgeColor: 'border-blue-300/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune fiche Ameli dans les sources IA', action: 'Vérifier →', actionColor: 'text-blue-500 border-blue-300/60 bg-blue-50 dark:bg-blue-950/20' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '3 avis', statusColor: 'text-emerald-500', desc: '3 avis patients indexés par Google AI Overview' },
    { badge: 'linkedin.com', badgeColor: 'border-blue-300/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune publication médicale vous citant', action: 'Publier →', actionColor: 'text-blue-500 border-blue-300/60 bg-blue-50 dark:bg-blue-950/20' },
  ],
  restaurant: [
    { badge: 'thefork.fr', badgeColor: 'border-green-300/60 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Fiche TheFork absente des résultats IA', action: 'Optimiser →', actionColor: 'text-green-500 border-green-300/60 bg-green-50 dark:bg-green-950/20' },
    { badge: 'tripadvisor.fr', badgeColor: 'border-emerald-300/60 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30', status: '4 avis', statusColor: 'text-emerald-500', desc: '4 avis TripAdvisor indexés dans Perplexity' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '2 questions', statusColor: 'text-amber-500', desc: '2 questions sans réponse sur votre fiche Google', action: 'Répondre →', actionColor: 'text-teal-600 border-teal-300/60 bg-teal-50 dark:bg-teal-950/20' },
    { badge: 'reddit.com', badgeColor: 'border-orange-300/60 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: '0 mention sur r/Lyon · r/Restaurants', action: 'Optimiser →', actionColor: 'text-orange-500 border-orange-300/60 bg-orange-50 dark:bg-orange-950/20' },
  ],
  hotel: [
    { badge: 'booking.com', badgeColor: 'border-blue-300/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Profil Booking.com non trouvé dans ChatGPT', action: 'Optimiser →', actionColor: 'text-blue-500 border-blue-300/60 bg-blue-50 dark:bg-blue-950/20' },
    { badge: 'airbnb.fr', badgeColor: 'border-rose-300/60 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30', status: '2 avis', statusColor: 'text-emerald-500', desc: '2 évaluations Airbnb référencées dans Perplexity' },
    { badge: 'tripadvisor.fr', badgeColor: 'border-emerald-300/60 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune note voyageur détectée', action: 'Publier →', actionColor: 'text-emerald-500 border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/20' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '1 question', statusColor: 'text-amber-500', desc: '1 question sans réponse sur votre fiche Google', action: 'Répondre →', actionColor: 'text-teal-600 border-teal-300/60 bg-teal-50 dark:bg-teal-950/20' },
  ],
  auto: [
    { badge: 'vroomly.com', badgeColor: 'border-orange-300/60 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Fiche Vroomly absente des réponses IA', action: 'Optimiser →', actionColor: 'text-orange-500 border-orange-300/60 bg-orange-50 dark:bg-orange-950/20' },
    { badge: 'idgarages.com', badgeColor: 'border-red-300/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Profil iDGarages non indexé dans Gemini', action: 'Optimiser →', actionColor: 'text-red-500 border-red-300/60 bg-red-50 dark:bg-red-950/20' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '2 questions', statusColor: 'text-amber-500', desc: '2 questions sans réponse sur votre fiche Google', action: 'Répondre →', actionColor: 'text-teal-600 border-teal-300/60 bg-teal-50 dark:bg-teal-950/20' },
    { badge: 'linkedin.com', badgeColor: 'border-blue-300/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune publication technique vous citant', action: 'Publier →', actionColor: 'text-blue-500 border-blue-300/60 bg-blue-50 dark:bg-blue-950/20' },
  ],
  general: [
    { badge: 'reddit.com', badgeColor: 'border-orange-300/60 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: '0 mention dans r/Lyon · r/Restaurants · r/Beauté ce mois-ci', action: 'Optimiser →', actionColor: 'text-orange-500 border-orange-300/60 bg-orange-50 dark:bg-orange-950/20' },
    { badge: 'linkedin.com', badgeColor: 'border-blue-300/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', status: 'Non détecté', statusColor: 'text-red-500', desc: 'Aucune publication de votre secteur ne vous cite', action: 'Publier →', actionColor: 'text-blue-500 border-blue-300/60 bg-blue-50 dark:bg-blue-950/20' },
    { badge: 'actu.fr', badgeColor: 'border-violet-300/60 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30', status: '1 mention', statusColor: 'text-emerald-500', desc: 'Cité dans 1 article local en avril 2025' },
    { badge: 'google maps', badgeColor: 'border-teal-300/60 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', status: '2 questions', statusColor: 'text-amber-500', desc: '2 questions sans réponse sur votre fiche Google Maps', action: 'Répondre →', actionColor: 'text-teal-600 border-teal-300/60 bg-teal-50 dark:bg-teal-950/20' },
  ],
};

const SECTOR_LABELS: Record<DemoSector, string> = {
  beauty: '💇 Beauté / Coiffure',
  medical: '🏥 Médical / Bien-être',
  restaurant: '🍽️ Restauration',
  hotel: '🏨 Hôtellerie',
  auto: '🔧 Artisanat / Auto',
  general: '🌐 Général',
};

const ALL_SECTORS: DemoSector[] = ['general', 'beauty', 'medical', 'restaurant', 'hotel', 'auto'];

// ── Component ─────────────────────────────────────────────────────────────────

export function GeoCitationScoreWidget() {
  const navigate = useNavigate();
  const { isDemoActive, demoSector, setDemoSector } = useDemoMode();

  const base = 67;
  const [chatgpt, setChatgpt] = useState(40);
  const [google, setGoogle] = useState(40);
  const [voice, setVoice] = useState(20);
  const [displayScore, setDisplayScore] = useState(base);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(() => {
    const saved = localStorage.getItem('geo_last_refresh');
    return saved ? parseInt(saved, 10) : 0;
  });

  const COOLDOWN_MS = 30 * 60 * 1000;
  const now = Date.now();
  const canRefresh = now - lastRefresh > COOLDOWN_MS;

  const handleRefresh = () => {
    if (!canRefresh || isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      const timestamp = Date.now();
      localStorage.setItem('geo_last_refresh', timestamp.toString());
      setLastRefresh(timestamp);
      setIsRefreshing(false);
    }, 2000);
  };

  // In non-demo mode, still try to show sector-relevant platforms from onboarding profile
  const profileSector: DemoSector = (() => {
    if (isDemoActive) return demoSector;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('onboarding_profile_'));
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const p = JSON.parse(raw) as { sector?: string };
        const s = (p?.sector ?? '').toLowerCase();
        if (['beaute', 'beauty', 'coiffure'].includes(s)) return 'beauty';
        if (['medical', 'medecin', 'kine', 'sante'].includes(s)) return 'medical';
        if (['restauration', 'restaurant', 'food'].includes(s)) return 'restaurant';
        if (['hotellerie', 'hotel', 'airbnb', 'conciergerie', 'tourisme'].includes(s)) return 'hotel';
        if (['automobile', 'auto', 'artisan', 'batiment', 'artisanat'].includes(s)) return 'auto';
      }
    } catch { /* noop */ }
    return 'general';
  })();

  const activeSector: DemoSector = profileSector;
  const sources = SECTOR_SOURCES[activeSector] ?? SECTOR_SOURCES.general;

  return (
    <Card className="p-6 relative overflow-hidden bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Score de Recommandation IA (G.E.O.)</h3>
            <TermTooltip term="GEO" size="md" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Présence sur ChatGPT · Perplexity · Gemini</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={!canRefresh || isRefreshing}
          className={cn(
            "p-2 rounded-full transition-all duration-500",
            canRefresh ? "text-primary hover:bg-primary/10" : "text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* ── Demo sector selector ── */}
      {isDemoActive && (
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
          <div className="px-3 pt-3 pb-2 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                🎮 Mode Démo — Simuler un secteur
              </p>
              <AnimatePresence mode="wait">
                <motion.span
                  key={demoSector}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[9px] font-bold text-primary border border-primary/30 rounded-md px-1.5 py-0.5 bg-primary/10"
                >
                  {SECTOR_LABELS[demoSector]}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 leading-snug">
              Changez de secteur pour voir les logos de plateformes s'adapter en temps réel ↓
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3">
            {ALL_SECTORS.map((s) => (
              <motion.button
                key={s}
                onClick={() => setDemoSector(s)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-200",
                  demoSector === s
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {SECTOR_LABELS[s]}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative py-4">
        <svg className="w-32 h-32 transform -rotate-90">
          <defs>
            <linearGradient id="geoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-accent/30" />
          <motion.circle
            cx="64" cy="64" r={radius}
            stroke="url(#geoGradient)" strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            strokeLinecap="round" fill="transparent"
            style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-foreground">{displayScore}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">/ 100</span>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-full" style={{ boxShadow: '0 0 24px rgba(16,185,129,.20)' }} />
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">🔍 SERPs Classiques</span>
              <TermTooltip term="SEO" size="sm" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-foreground leading-tight">Présence SERPs Classiques</p>
          <p className="text-[10px] text-muted-foreground -mt-1">Moteurs traditionnels</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground">74</span>
            <span className="text-[10px] text-muted-foreground font-medium">/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-accent/40 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: '74%' }} />
          </div>
          <Badge variant="outline" className="self-start text-[9px] font-bold px-1.5 py-0.5 border-emerald-300/60 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
            Google · Bing · Maps
          </Badge>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">🤖 Voix IA</span>
              <TermTooltip term="AIO" size="sm" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-foreground leading-tight">Part de Voix IA Answers</p>
          <p className="text-[10px] text-muted-foreground -mt-1">ChatGPT · Perplexity · Gemini</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground">28</span>
            <span className="text-[10px] text-muted-foreground font-medium">/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-accent/40 overflow-hidden">
            <div className="h-full rounded-full bg-orange-500" style={{ width: '28%' }} />
          </div>
          <Badge variant="outline" className="self-start text-[9px] font-bold px-1.5 py-0.5 border-amber-300/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
            Citations IA
          </Badge>
        </div>

        <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300 leading-tight">
            ⚠ Faible — L'IA vous ignore sur 2/3 moteurs
          </p>
        </div>
      </div>

      {/* ── Sources d'influence détectées (sector-aware) ── */}
      <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold text-foreground">📦 Sources d'influence détectées</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                Mentions de votre secteur sur les plateformes UGC analysées par les IA
              </p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSector}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-primary border border-primary/30 rounded-md px-1.5 py-0.5 bg-primary/5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {SECTOR_LABELS[activeSector]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSector}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="divide-y divide-border"
          >
            {sources.map((src, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${src.badgeColor}`}>
                      {src.badge}
                    </Badge>
                    <span className={`text-[10px] font-bold ${src.statusColor}`}>{src.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{src.desc}</p>
                </div>
                {src.action && (
                  <button className={`shrink-0 text-[10px] font-bold border rounded-md px-2 py-1 transition-colors ${src.actionColor}`}>
                    {src.action}
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="px-4 py-2.5 bg-accent/20 border-t border-border">
          <p className="text-[9px] text-muted-foreground leading-snug">
            Ces sources sont utilisées par ChatGPT, Gemini et Perplexity pour générer leurs réponses.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <Button
          onClick={() => navigate({ to: '/geo-authority' })}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold py-5"
        >
          <Search size={16} />
          Améliorer mes trust signals
        </Button>

        <div className="flex flex-col items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground border-border bg-transparent">
            🔄 Mis à jour il y a 3h · Cache 12h
          </Badge>

          {displayScore < 70 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg w-full">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-tight">
                ⚠️ 58% de vos clients potentiels finissent chez vos concurrents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ajuster la pondération */}
      <details className="mt-4 border-t border-border pt-4">
        <summary className="text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-2">
          <span className="text-[10px]">⚙️</span> Ajuster la pondération des moteurs
        </summary>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>ChatGPT / Perplexity</span>
              <span className="text-primary">{chatgpt}%</span>
            </div>
            <input type="range" min="0" max="100" value={chatgpt} onChange={(e) => setChatgpt(parseInt(e.target.value))} className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Google AI Overviews / Maps</span>
              <span className="text-primary">{google}%</span>
            </div>
            <input type="range" min="0" max="100" value={google} onChange={(e) => setGoogle(parseInt(e.target.value))} className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Siri / Assistants vocaux</span>
              <span className="text-primary">{voice}%</span>
            </div>
            <input type="range" min="0" max="100" value={voice} onChange={(e) => setVoice(parseInt(e.target.value))} className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-[10px] font-bold gap-2 border-emerald-200/50 hover:bg-emerald-50 text-emerald-700"
            onClick={() => {
              const newScore = Math.round((chatgpt * 0.01 * base + google * 0.01 * base + voice * 0.01 * base) / 3 * 1.1);
              setDisplayScore(newScore);
            }}
          >
            Appliquer et Recalculer ⚡
          </Button>
        </div>
      </details>
    </Card>
  );
}