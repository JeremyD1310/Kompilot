import React, { useState, useEffect } from 'react';
import { Card, Button, cn, toast, Skeleton } from '@blinkdotnew/ui';
import { RefreshCw, Zap, FileText } from 'lucide-react';
import { LinkedinIcon, InstagramIcon, FacebookIcon } from '../icons/SocialIcons';
import { useContentPillars } from '../../context/ContentPillarsContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { blink } from '../../blink/client';

interface SparkAngle {
  title: string;
  text: string;
  platform: 'LinkedIn' | 'Instagram' | 'Facebook';
}

const SPARK_SCHEMA = {
  type: 'object' as const,
  properties: {
    pillar1: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          text: { type: 'string' as const },
          platform: { type: 'string' as const },
        },
        required: ['title', 'text', 'platform'],
      },
    },
    pillar2: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          text: { type: 'string' as const },
          platform: { type: 'string' as const },
        },
        required: ['title', 'text', 'platform'],
      },
    },
    pillar3: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          text: { type: 'string' as const },
          platform: { type: 'string' as const },
        },
        required: ['title', 'text', 'platform'],
      },
    },
  },
  required: ['pillar1', 'pillar2', 'pillar3'],
};

const FALLBACK_IDEAS: Record<string, SparkAngle[]> = {
  'pillar-1': [
    { title: "Le saviez-vous ?", text: "Partagez une statistique surprenante de votre secteur pour assoir votre expertise.", platform: 'LinkedIn' },
    { title: "Tuto Rapide", text: "Expliquez comment résoudre un problème fréquent en 3 étapes simples.", platform: 'Instagram' },
    { title: "Étude de cas", text: "Racontez comment vous avez aidé un client spécifique récemment.", platform: 'Facebook' },
  ],
  'pillar-2': [
    { title: "Coulisses", text: "Montrez votre espace de travail ou l'équipe en pleine action aujourd'hui.", platform: 'Instagram' },
    { title: "Ma Routine", text: "Détaillez votre rituel du matin pour rester productif tout au long de la journée.", platform: 'LinkedIn' },
    { title: "Outils", text: "Présentez un logiciel ou un objet indispensable à votre quotidien.", platform: 'Facebook' },
  ],
  'pillar-3': [
    { title: "Offre Flash", text: "Créez une urgence avec une remise exceptionnelle valable 24h seulement.", platform: 'Facebook' },
    { title: "Témoignage", text: "Partagez l'avis positif d'un client enthousiaste sur vos services.", platform: 'Instagram' },
    { title: "Nouveauté", text: "Annoncez le lancement prochain d'un produit ou d'une nouvelle prestation.", platform: 'LinkedIn' },
  ],
};

// Approximate word count from a string
function estimateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Platform-specific badge styling
const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LinkedIn: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-800/60',
  },
  Instagram: {
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200/60 dark:border-pink-800/60',
  },
  Facebook: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/60 dark:border-blue-800/60',
  },
};

const PlatformIcon = ({ type, className }: { type: string; className?: string }) => {
  const cls = cn('w-3 h-3', className);
  if (type === 'LinkedIn') return <LinkedinIcon className={cls} />;
  if (type === 'Instagram') return <InstagramIcon className={cls} />;
  return <FacebookIcon className={cls} />;
};

// Single skeleton that mimics final card height
function AngleCardSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-muted/30 p-4 space-y-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
      <Skeleton className="h-3 w-16 rounded-md opacity-50" />
      <Skeleton className="h-7 w-full rounded-lg mt-1" />
    </div>
  );
}

export function SparkDuJourBlock({ onUseSpark }: { onUseSpark: (text: string) => void }) {
  const { pillars, sparkAngles, setSparkAngles } = useContentPillars();
  const { activeEstablishment } = useEstablishment();
  const profile = useOnboardingProfile();
  const sector = profile?.sector || activeEstablishment.category || 'commerce local';
  const businessName = profile?.companyName || activeEstablishment.name;
  const [isLoading, setIsLoading] = useState(false);

  const generateSparks = async () => {
    setIsLoading(true);
    try {
      const { object } = await blink.ai.generateObject({
        schema: SPARK_SCHEMA,
        prompt: `Tu es un expert en création de contenu pour les petites entreprises. 
Génère des idées de publications percutantes et authentiques pour chaque pilier de contenu.

Contexte : ${businessName} — secteur ${sector}
Établissement actif : ${activeEstablishment.name} (${activeEstablishment.category})

Pilier 1: ${pillars[0].label} (${pillars[0].emoji})${pillars[0].description ? ` — Thématiques : ${pillars[0].description}` : ''}
Pilier 2: ${pillars[1].label} (${pillars[1].emoji})${pillars[1].description ? ` — Thématiques : ${pillars[1].description}` : ''}
Pilier 3: ${pillars[2].label} (${pillars[2].emoji})${pillars[2].description ? ` — Thématiques : ${pillars[2].description}` : ''}

Pour chaque pilier, génère 3 angles différents (format court ~2 phrases, direct, actionnable, adapté au secteur).
Varie les formats : question, statistique, anecdote, conseil pratique, coulisses, etc.`,
      });

      setSparkAngles('pillar-1', object.pillar1);
      setSparkAngles('pillar-2', object.pillar2);
      setSparkAngles('pillar-3', object.pillar3);
    } catch (error: any) {
      if (error?.status === 401) {
        blink.auth.login();
      } else {
        pillars.forEach(p => setSparkAngles(p.id, FALLBACK_IDEAS[p.id] || FALLBACK_IDEAS['pillar-1']));
        toast.error("Échec de la génération IA, utilisation d'idées par défaut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(sparkAngles).length === 0) generateSparks();
  }, []);

  return (
    <div className="space-y-6 rounded-2xl bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/10 p-5 -mx-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0" />
            Le Spark du Jour
            {/* Pulsing LIVE IA badge */}
            <span className="relative flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              LIVE IA
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Pour <strong className="text-foreground">{activeEstablishment.shortName}</strong> — 3 angles par pilier
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSparks}
          disabled={isLoading}
          className="shrink-0 border-amber-200/60 hover:bg-amber-50 dark:hover:bg-amber-950/20"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Rafraîchir
        </Button>
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.id} className="space-y-3">

            {/* Pillar gradient header */}
            <div
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 bg-gradient-to-r shadow-md",
                pillar.color
              )}
            >
              <span className="text-xl">{pillar.emoji}</span>
              <span className="truncate text-sm leading-tight">{pillar.label}</span>
            </div>

            {/* Angle cards */}
            <div className="space-y-3">
              {isLoading
                ? Array(3).fill(0).map((_, i) => (
                    <AngleCardSkeleton key={i} delay={i * 80} />
                  ))
                : sparkAngles[pillar.id]?.map((angle, i) => {
                    const platform = angle.platform as keyof typeof PLATFORM_STYLES;
                    const ps = PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.LinkedIn;
                    const wordCount = estimateWordCount(angle.text);
                    const avgReadWords = Math.round(wordCount * 5.5); // rough expansion to "post mots"

                    return (
                      <Card
                        key={i}
                        className={cn(
                          "group relative p-4 flex flex-col gap-2.5",
                          "bg-gradient-to-br from-card to-muted/30",
                          "border-border/50 rounded-xl",
                          "transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                          "animate-in fade-in slide-in-from-bottom-4 duration-500"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {/* Number badge */}
                        <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-background">
                          {i + 1}
                        </span>

                        {/* Title + platform */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold leading-snug line-clamp-2 flex-1">
                            {angle.title}
                          </span>
                          {/* Platform badge */}
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                              ps.bg, ps.text, ps.border
                            )}
                          >
                            <PlatformIcon type={angle.platform} />
                            {angle.platform}
                          </span>
                        </div>

                        {/* Body text */}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {angle.text}
                        </p>

                        {/* Word count hint */}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                          <FileText className="w-3 h-3" />
                          ~{avgReadWords} mots
                        </div>

                        {/* CTA — hidden until hover */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full h-7 text-xs font-semibold mt-0.5 rounded-lg",
                            "opacity-0 group-hover:opacity-100",
                            "transition-all duration-200",
                            "hover:bg-primary hover:text-primary-foreground"
                          )}
                          onClick={() => onUseSpark(angle.text)}
                        >
                          → Créer
                        </Button>
                      </Card>
                    );
                  })
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
