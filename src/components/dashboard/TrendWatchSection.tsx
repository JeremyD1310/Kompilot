import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, cn } from '@blinkdotnew/ui';
import { TrendingUp } from 'lucide-react';
import { LinkedinIcon, InstagramIcon } from '../icons/SocialIcons';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';

interface Trend {
  hashtag: string;
  topic: string;
  growth: number;
  platform: 'linkedin' | 'instagram' | 'both';
  category: 'Croissance' | 'Viral' | 'Tendance';
}

const TRENDS: Trend[] = [
  { hashtag: "#DigitalMarketing", topic: "Stratégies 2024", growth: 34, platform: 'linkedin', category: 'Croissance' },
  { hashtag: "#TPEFrance", topic: "Aides entrepreneuriales", growth: 28, platform: 'both', category: 'Tendance' },
  { hashtag: "#EntrepreneurVie", topic: "Vlog quotidien", growth: 41, platform: 'instagram', category: 'Viral' },
  { hashtag: "#ConseilsBusiness", topic: "Vente B2B", growth: 19, platform: 'linkedin', category: 'Croissance' },
  { hashtag: "Contenu vidéo court", topic: "Reels & Shorts", growth: 67, platform: 'instagram', category: 'Viral' },
  { hashtag: "Témoignages clients", topic: "Preuve sociale", growth: 52, platform: 'both', category: 'Tendance' },
  { hashtag: "#AITools", topic: "Productivité", growth: 89, platform: 'both', category: 'Viral' },
  { hashtag: "#ReseauxSociaux", topic: "Algorithmes", growth: 22, platform: 'linkedin', category: 'Tendance' },
  { hashtag: "#WorkLifeBalance", topic: "Bien-être", growth: 31, platform: 'instagram', category: 'Croissance' },
  { hashtag: "#StartUpLife", topic: "Levée de fonds", growth: 15, platform: 'linkedin', category: 'Tendance' },
  { hashtag: "#Ecommerce", topic: "Vente en ligne", growth: 45, platform: 'both', category: 'Croissance' },
  { hashtag: "#Branding", topic: "Identité visuelle", growth: 38, platform: 'instagram', category: 'Viral' },
  { hashtag: "#Innovation", topic: "Nouvelles tech", growth: 26, platform: 'linkedin', category: 'Tendance' },
  { hashtag: "#SaaS", topic: "Software as a Service", growth: 54, platform: 'both', category: 'Croissance' },
  { hashtag: "#PersonalBranding", topic: "Influence", growth: 47, platform: 'linkedin', category: 'Viral' },
  { hashtag: "#GrowthHacking", topic: "Acquisition", growth: 33, platform: 'both', category: 'Croissance' },
];

const SECTOR_TRENDS: Record<string, Trend[]> = {
  Restauration: [
    { hashtag: "#GastronomieLocale", topic: "Cuisine régionale", growth: 48, platform: 'instagram', category: 'Viral' },
    { hashtag: "#FoodTok", topic: "Recettes viral TikTok", growth: 72, platform: 'instagram', category: 'Viral' },
    { hashtag: "#RestaurantLocal", topic: "Circuits courts", growth: 35, platform: 'both', category: 'Tendance' },
    { hashtag: "#BrunchWeekend", topic: "Expériences brunch", growth: 55, platform: 'instagram', category: 'Croissance' },
    { hashtag: "#FoodPhotography", topic: "Esthétique culinaire", growth: 41, platform: 'instagram', category: 'Viral' },
    { hashtag: "#ZeroDechet", topic: "Cuisine durable", growth: 29, platform: 'both', category: 'Tendance' },
  ],
  Commerce: [
    { hashtag: "#ShopLocal", topic: "Commerce de proximité", growth: 44, platform: 'both', category: 'Tendance' },
    { hashtag: "#Soldes2024", topic: "Promotions été", growth: 61, platform: 'instagram', category: 'Viral' },
    { hashtag: "#NouvelleCollection", topic: "Lancement produits", growth: 38, platform: 'both', category: 'Croissance' },
    { hashtag: "#UnboxingFrance", topic: "Expérience déballage", growth: 53, platform: 'instagram', category: 'Viral' },
    { hashtag: "#BoutiqueFrancaise", topic: "Made in France", growth: 27, platform: 'linkedin', category: 'Tendance' },
    { hashtag: "#ClientSatisfait", topic: "Témoignages clients", growth: 45, platform: 'both', category: 'Croissance' },
  ],
};

// ── Category badge styles ──────────────────────────────────────────────────
const CATEGORY_STYLES: Record<Trend['category'], { badge: string; dot: string }> = {
  Viral: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    dot: 'bg-orange-500',
  },
  Tendance: {
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    dot: 'bg-indigo-500',
  },
  Croissance: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
};

// ── Platform icon pair ─────────────────────────────────────────────────────
function PlatformIcons({ platform }: { platform: Trend['platform'] }) {
  if (platform === 'linkedin') {
    return (
      <span className="inline-flex items-center gap-0.5 text-blue-600">
        <LinkedinIcon className="w-3 h-3" />
        <span className="text-[10px] font-medium">LinkedIn</span>
      </span>
    );
  }
  if (platform === 'instagram') {
    return (
      <span className="inline-flex items-center gap-0.5 text-pink-600">
        <InstagramIcon className="w-3 h-3" />
        <span className="text-[10px] font-medium">Instagram</span>
      </span>
    );
  }
  // both
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5 text-blue-600">
        <LinkedinIcon className="w-3 h-3" />
      </span>
      <span className="inline-flex items-center gap-0.5 text-pink-600">
        <InstagramIcon className="w-3 h-3" />
      </span>
      <span className="text-[10px] font-medium text-muted-foreground">Multi</span>
    </span>
  );
}

// ── Animated growth counter ────────────────────────────────────────────────
function GrowthCounter({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 900; // ms

  useEffect(() => {
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return (
    <span className="tabular-nums font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
      <TrendingUp className="w-3 h-3" />
      +{displayed}%
    </span>
  );
}

// ── Filter types ───────────────────────────────────────────────────────────
type PlatformFilter = 'tous' | 'linkedin' | 'instagram';

const FILTER_LABELS: Record<PlatformFilter, string> = {
  tous: 'Tous',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

// ── Main component ─────────────────────────────────────────────────────────
export function TrendWatchSection({ onUseTrend }: { onUseTrend: (hashtag: string) => void }) {
  const { activeEstablishment, isSwitching } = useEstablishment();
  useOnboardingProfile();

  const sectorTrends = SECTOR_TRENDS[activeEstablishment.category] || TRENDS;
  const allTrends = [...sectorTrends, ...TRENDS.slice(0, 4)];

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('tous');

  const displayTrends = allTrends.filter((t) => {
    if (platformFilter === 'tous') return true;
    if (platformFilter === 'linkedin') return t.platform === 'linkedin' || t.platform === 'both';
    if (platformFilter === 'instagram') return t.platform === 'instagram' || t.platform === 'both';
    return true;
  });

  return (
    <div
      className={cn(
        "space-y-4 py-4 transition-opacity duration-300",
        isSwitching ? "opacity-50" : "opacity-100"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">🔥 Tendances — {activeEstablishment.category}</h2>
          {/* LIVE badge with gradient shimmer */}
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            LIVE
          </span>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium shrink-0">↓ Filtrer par plateforme</span>
        {(Object.keys(FILTER_LABELS) as PlatformFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setPlatformFilter(f)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150",
              platformFilter === f
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* ── Horizontal scroll ── */}
      <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {displayTrends.map((trend, i) => {
          const catStyle = CATEGORY_STYLES[trend.category];
          return (
            <Card
              key={`${trend.hashtag}-${i}`}
              className={cn(
                "snap-start min-w-[260px] p-4 flex flex-col gap-3",
                "bg-gradient-to-br from-card to-muted/30",
                "border-border/50 rounded-xl",
                "group hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default"
              )}
            >
              {/* Platform + growth row */}
              <div className="flex items-center justify-between">
                <PlatformIcons platform={trend.platform} />
                <GrowthCounter target={trend.growth} />
              </div>

              {/* Hashtag + topic */}
              <div className="flex-1">
                <div className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {trend.hashtag}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{trend.topic}</div>
              </div>

              {/* Category badge + CTA */}
              <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/30">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                    catStyle.badge
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", catStyle.dot)} />
                  {trend.category}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  onClick={() => onUseTrend(trend.hashtag)}
                >
                  Rebondir →
                </Button>
              </div>
            </Card>
          );
        })}

        {/* Empty state when filter yields nothing */}
        {displayTrends.length === 0 && (
          <div className="flex items-center justify-center min-w-[260px] h-32 text-muted-foreground text-sm rounded-xl border border-dashed border-border">
            Aucune tendance pour ce filtre
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground italic text-right">
        Mis à jour il y a 12 min • Basé sur : <strong>{activeEstablishment.category}</strong> · {activeEstablishment.shortName}
      </p>
    </div>
  );
}
