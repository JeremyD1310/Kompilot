import { Card, CardHeader, CardTitle, CardContent, Button } from '@blinkdotnew/ui';
import { Lock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { useSubscription } from '../../context/SubscriptionContext';
import { useDemoMode } from '../../context/DemoModeContext';

type TrendType = 'audio' | 'format' | 'hashtag';

interface Trend {
  type: TrendType;
  text: string;
  badge: string;
  cta?: string;
}

const TRENDS_BY_SECTOR: Record<string, Trend[]> = {
  default: [
    { type: 'audio',   text: 'Audio Viral Instagram/TikTok : "Espresso" de Sabrina Carpenter (+240% d\'écoutes cette semaine)', badge: 'Instagram', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les vidéos courtes de type "Coulisses / Avant-Après" sont favorisées par l\'algorithme Facebook à +45% en ce moment.', badge: 'Facebook' },
    { type: 'hashtag', text: '#ArtisanatLocal #LaRochelleFood #FaitMain', badge: 'Local' },
  ],
  artisan: [
    { type: 'audio',   text: 'Audio Viral Instagram/TikTok : "Espresso" de Sabrina Carpenter (+240% d\'écoutes cette semaine)', badge: 'Instagram', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les vidéos courtes de type "Coulisses / Avant-Après" sont favorisées par l\'algorithme Facebook à +45% en ce moment.', badge: 'Facebook' },
    { type: 'hashtag', text: '#ArtisanatLocal #LaRochelleFood #FaitMain', badge: 'Local' },
  ],
  restauration: [
    { type: 'audio',   text: 'Audio Viral TikTok : "HARLEQUIN" de Lady Gaga (+310% d\'écoutes)', badge: 'TikTok', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les Reels "préparation en cuisine" génèrent 3x plus d\'engagement qu\'un post photo.', badge: 'Instagram' },
    { type: 'hashtag', text: '#RestaurantLocal #FoodLovers #LaRochelleFood', badge: 'Local' },
  ],
  food: [
    { type: 'audio',   text: 'Audio Viral TikTok : "HARLEQUIN" de Lady Gaga (+310% d\'écoutes)', badge: 'TikTok', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les Reels "préparation en cuisine" génèrent 3x plus d\'engagement qu\'un post photo.', badge: 'Instagram' },
    { type: 'hashtag', text: '#RestaurantLocal #FoodLovers #LaRochelleFood', badge: 'Local' },
  ],
  commerce: [
    { type: 'audio',   text: 'Audio Viral Instagram : "Espresso" de Sabrina Carpenter (+240% d\'écoutes)', badge: 'Instagram', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les posts "Nouveauté produit + prix" en carousel obtiennent +60% d\'engagement Instagram.', badge: 'Instagram' },
    { type: 'hashtag', text: '#ShoppingLocal #BoutiqueLocale #LaRochelle', badge: 'Local' },
  ],
  beaute: [
    { type: 'audio',   text: 'Audio Viral TikTok : "Good Luck Babe!" de Chappell Roan (+280% d\'écoutes)', badge: 'TikTok', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les vidéos "Transformation Avant/Après" cartonnent sur Instagram Reels (+75% portée organique).', badge: 'Instagram' },
    { type: 'hashtag', text: '#BeautéLocale #CoiffureRochelle #InstituBeauté', badge: 'Local' },
  ],
  sante: [
    { type: 'audio',   text: 'Audio Viral Instagram : "Birds of a Feather" de Billie Eilish (+195% d\'écoutes)', badge: 'Instagram', cta: 'Utiliser cet audio pour ma Story' },
    { type: 'format',  text: 'Les conseils santé "3 astuces en 30 secondes" génèrent 2x plus de sauvegardes Instagram.', badge: 'Instagram' },
    { type: 'hashtag', text: '#BienÊtre #SantéNaturelle #LaRochelle', badge: 'Local' },
  ],
};

const BADGE_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-100 text-pink-700 border-pink-200',
  TikTok:    'bg-foreground/10 text-foreground border-border',
  Facebook:  'bg-blue-100 text-blue-700 border-blue-200',
  LinkedIn:  'bg-blue-100 text-blue-800 border-blue-200',
  Local:     'bg-green-100 text-green-700 border-green-200',
};

const TYPE_EMOJI: Record<TrendType, string> = {
  audio:   '🎵',
  format:  '🎯',
  hashtag: '🏷️',
};

interface TrendRadarWidgetProps {
  onOpenStoryCreator?: () => void;
}

export function TrendRadarWidget({ onOpenStoryCreator }: TrendRadarWidgetProps) {
  const profile = useOnboardingProfile();
  const { currentPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();
  const plan = currentPlan.id;

  const sector = profile?.sector?.toLowerCase() ?? 'default';
  const trends: Trend[] = TRENDS_BY_SECTOR[sector] ?? TRENDS_BY_SECTOR.default;
  // Demo mode gives full access — bypass free plan gate
  const isFreePlan = plan === 'free' && !isDemoActive;

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
          🔥 Tendances Chaudes de la Semaine
          <span className="text-muted-foreground font-normal text-sm">(La Rochelle &amp; Alentours)</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-100 border border-orange-200 rounded-full px-2.5 py-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
            En direct
          </span>
          <span className="text-[11px] text-muted-foreground">Mis à jour il y a 2h</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {isFreePlan ? (
          <div className="relative rounded-xl overflow-hidden">
            <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden>
              {trends.map((trend, i) => (
                <TrendRow key={i} trend={trend} locked="preview" />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px] rounded-xl gap-3 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Lock size={18} className="text-orange-600" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug max-w-xs">
                🔒 Débloquez le Radar de Tendances IA pour savoir ce qui buzze en ce moment
              </p>
              <Link to="/subscription">
                <Button size="sm" className="gap-1.5 text-xs font-bold">
                  Passer à Pro — 19€/mois
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {trends.map((trend, i) => (
              <TrendRow
                key={i}
                trend={trend}
                locked={trend.type === 'audio' && plan === 'pro' ? 'expert' : 'none'}
                onCtaClick={trend.type === 'audio' ? onOpenStoryCreator : undefined}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/60 border border-border/40 rounded-full px-2 py-0.5">
            IA simulée
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendRow({
  trend,
  locked,
  onCtaClick,
}: {
  trend: Trend;
  locked: 'none' | 'expert' | 'preview';
  onCtaClick?: () => void;
}) {
  const badgeClass = BADGE_COLORS[trend.badge] ?? 'bg-muted text-muted-foreground border-border';
  const isBlurred  = locked === 'expert';

  return (
    <div className="relative rounded-xl border border-border/50 bg-muted/20 px-4 py-3 flex items-start gap-3">
      <span className="text-lg shrink-0 mt-0.5">{TYPE_EMOJI[trend.type]}</span>

      <div className={`flex-1 min-w-0 space-y-1.5 ${isBlurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
          {trend.badge}
        </span>
        <p className="text-sm text-foreground leading-snug">{trend.text}</p>
        {trend.cta && onCtaClick && !isBlurred && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5 mt-1"
            onClick={onCtaClick}
          >
            🎵 {trend.cta}
          </Button>
        )}
      </div>

      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-background/90 border border-border rounded-full px-3 py-1.5 shadow-sm">
            <Lock size={12} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Expert uniquement</span>
            <Link to="/subscription">
              <span className="text-[10px] font-bold text-primary hover:underline">Upgrader →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}