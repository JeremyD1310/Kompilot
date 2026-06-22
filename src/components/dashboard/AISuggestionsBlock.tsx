import { useState, useMemo } from 'react';
import { Sparkles, RefreshCw, Zap, Video, Camera, FileText, ChevronRight, Clock } from 'lucide-react';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AISuggestion {
  id: string;
  kind: 'text' | 'photo' | 'video';
  tag: string;
  tagColor: string;
  emoji: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  channels: string[];
  videoIdea?: string; // for video cards
  gradient: string;
  accent: string;
}

// ── Sector catalogue ──────────────────────────────────────────────────────────

const SUGGESTIONS: Record<string, AISuggestion[]> = {
  restauration: [
    {
      id: 'r1', kind: 'photo', tag: 'Post photo', tagColor: 'bg-orange-100 text-orange-700',
      emoji: '🍕', gradient: 'from-orange-500 to-amber-400', accent: 'border-orange-300',
      text: 'Le secret d\'une bonne semaine ? Commencer par un plat réconfortant. 🍕 Découvrez notre suggestion du jour fraîchement préparée !',
      mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
    {
      id: 'r2', kind: 'video', tag: 'Idée Reel', tagColor: 'bg-rose-100 text-rose-700',
      emoji: '🎬', gradient: 'from-rose-600 to-pink-400', accent: 'border-rose-300',
      text: 'Les coulisses de notre cuisine pendant le coup de feu du midi 🔥 — parce que la magie se passe dans les coulisses !',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Montrez les coulisses de la cuisine pendant le coup de feu du midi. Filmez en vertical pendant 30s, ajoutez une musique rythmée.',
    },
    {
      id: 'r3', kind: 'photo', tag: 'Post engagement', tagColor: 'bg-amber-100 text-amber-700',
      emoji: '☕', gradient: 'from-amber-600 to-yellow-400', accent: 'border-amber-300',
      text: 'Chaque matin, notre équipe arrive tôt pour vous préparer le meilleur ☕ Vos envies méritent des produits frais sélectionnés avec soin.',
      mediaUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'google_business'],
    },
    {
      id: 'r4', kind: 'text', tag: 'Post Google', tagColor: 'bg-green-100 text-green-700',
      emoji: '⭐', gradient: 'from-emerald-600 to-teal-400', accent: 'border-emerald-300',
      text: 'Nous avons reçu votre retour et ça nous touche ! ⭐ Merci à toute notre équipe qui travaille chaque jour pour vous offrir le meilleur.',
      channels: ['google_business', 'facebook'],
    },
  ],

  immobilier: [
    {
      id: 'i1', kind: 'photo', tag: 'Annonce', tagColor: 'bg-blue-100 text-blue-700',
      emoji: '🏡', gradient: 'from-blue-600 to-sky-400', accent: 'border-blue-300',
      text: '🏡 NOUVEAUTÉ | Un coup de cœur assuré pour cette maison lumineuse avec jardin. Les visites commencent cette semaine — contactez-nous !',
      mediaUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      mediaType: 'image', channels: ['linkedin', 'facebook', 'instagram'],
    },
    {
      id: 'i2', kind: 'video', tag: 'Visite vidéo', tagColor: 'bg-sky-100 text-sky-700',
      emoji: '🎬', gradient: 'from-sky-600 to-cyan-400', accent: 'border-sky-300',
      text: 'Visite guidée rapide de cette pièce de vie coup de cœur 🏠 — 15 secondes pour tomber amoureux. Lien de visite complète en bio !',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Visite guidée rapide en 15 secondes d\'une pièce coup de cœur. Filmez en walking tour vertical, ajoutez des zooms sur les détails architecturaux.',
    },
    {
      id: 'i3', kind: 'photo', tag: 'Conseil marché', tagColor: 'bg-indigo-100 text-indigo-700',
      emoji: '📊', gradient: 'from-indigo-600 to-violet-400', accent: 'border-indigo-300',
      text: 'Investir dans la pierre, c\'est construire son avenir. 📊 Le marché immobilier local reste dynamique — découvrez nos opportunités du mois.',
      mediaUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      mediaType: 'image', channels: ['linkedin', 'facebook'],
    },
    {
      id: 'i4', kind: 'text', tag: 'Astuce acheteur', tagColor: 'bg-violet-100 text-violet-700',
      emoji: '💡', gradient: 'from-violet-600 to-purple-400', accent: 'border-violet-300',
      text: '💡 LE SAVIEZ-VOUS ? Acheter en hiver peut vous faire économiser jusqu\'à 5% sur le prix de vente. Nos conseillers sont disponibles pour vous guider.',
      channels: ['linkedin', 'facebook'],
    },
  ],

  artisanat: [
    {
      id: 'a1', kind: 'photo', tag: 'Réalisation', tagColor: 'bg-amber-100 text-amber-700',
      emoji: '🛠️', gradient: 'from-amber-700 to-yellow-500', accent: 'border-amber-300',
      text: 'Chantier terminé ! 🛠️ Du sur-mesure et des finitions soignées pour ce nouveau projet client. Qu\'en pensez-vous ?',
      mediaUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
      mediaType: 'image', channels: ['facebook', 'instagram'],
    },
    {
      id: 'a2', kind: 'video', tag: 'Timelapse', tagColor: 'bg-stone-100 text-stone-700',
      emoji: '⏩', gradient: 'from-stone-600 to-gray-400', accent: 'border-stone-300',
      text: 'Avant / Après en accéléré ⏩ — ce projet en 30 secondes. Le meilleur résumé d\'une semaine de travail !',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Un avant/après ultra-satisfaisant en accéléré (timelapse). Filmez le chantier depuis le même angle au départ et à la fin. Montage rapide avec une musique énergique.',
    },
    {
      id: 'a3', kind: 'photo', tag: 'Savoir-faire', tagColor: 'bg-orange-100 text-orange-700',
      emoji: '✂️', gradient: 'from-orange-700 to-red-400', accent: 'border-orange-300',
      text: 'La précision, c\'est notre signature. ✂️ Chaque détail compte, chaque finition est pensée pour durer. Voici notre dernière création.',
      mediaUrl: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
    {
      id: 'a4', kind: 'text', tag: 'Témoignage', tagColor: 'bg-emerald-100 text-emerald-700',
      emoji: '⭐', gradient: 'from-emerald-700 to-green-400', accent: 'border-emerald-300',
      text: '"Travail impeccable, délais respectés et équipe au top !" ⭐⭐⭐⭐⭐ Merci à nos clients de nous faire confiance chaque jour.',
      channels: ['google_business', 'facebook'],
    },
  ],

  commerce: [
    {
      id: 'c1', kind: 'photo', tag: 'Promo', tagColor: 'bg-pink-100 text-pink-700',
      emoji: '🛍️', gradient: 'from-pink-600 to-rose-400', accent: 'border-pink-300',
      text: 'Nouvelle collection disponible ! 🛍️ Des pièces soigneusement sélectionnées pour vous — venez découvrir en boutique ou en ligne.',
      mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
    {
      id: 'c2', kind: 'video', tag: 'Unboxing', tagColor: 'bg-fuchsia-100 text-fuchsia-700',
      emoji: '📦', gradient: 'from-fuchsia-600 to-purple-400', accent: 'border-fuchsia-300',
      text: 'Notre meilleure vente de la semaine, unboxing en direct 📦 — regardez ce que nos clients adorent en ce moment !',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Vidéo unboxing produit phare de la semaine. Filmez vos mains qui déballent, montrez le produit sous tous les angles. 20-30 secondes, format vertical.',
    },
    {
      id: 'c3', kind: 'text', tag: 'Fidélisation', tagColor: 'bg-violet-100 text-violet-700',
      emoji: '💌', gradient: 'from-violet-600 to-indigo-400', accent: 'border-violet-300',
      text: 'Merci à tous nos clients fidèles 💌 Votre confiance nous motive chaque jour à vous proposer le meilleur. Vous méritez le top !',
      channels: ['facebook', 'instagram'],
    },
  ],

  beaute: [
    {
      id: 'b1', kind: 'photo', tag: 'Avant/Après', tagColor: 'bg-pink-100 text-pink-700',
      emoji: '✨', gradient: 'from-pink-500 to-rose-400', accent: 'border-pink-300',
      text: 'Transformation du jour ✨ Notre équipe donne vie à vos envies. Prenez soin de vous — vous le méritez !',
      mediaUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
    {
      id: 'b2', kind: 'video', tag: 'Tuto beauté', tagColor: 'bg-rose-100 text-rose-700',
      emoji: '💄', gradient: 'from-rose-600 to-pink-400', accent: 'border-rose-300',
      text: 'Le geste beauté de la semaine en 30 secondes 💄 — notre équipe vous montre comment sublimer votre look en un tour de main.',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Tuto beauté rapide en 30 secondes. Filmez les mains de l\'esthéticienne, montrez un geste clé (massage, coiffure, nail art). Musique tendance, format vertical.',
    },
    {
      id: 'b3', kind: 'text', tag: 'Réservation', tagColor: 'bg-fuchsia-100 text-fuchsia-700',
      emoji: '📅', gradient: 'from-fuchsia-500 to-purple-400', accent: 'border-fuchsia-300',
      text: 'Le week-end approche et votre agenda est déjà bien rempli 😊 Pensez à réserver votre prochain rendez-vous avant qu\'il ne soit trop tard !',
      channels: ['instagram', 'google_business'],
    },
  ],

  sport: [
    {
      id: 's1', kind: 'photo', tag: 'Motivation', tagColor: 'bg-emerald-100 text-emerald-700',
      emoji: '💪', gradient: 'from-emerald-600 to-teal-400', accent: 'border-emerald-300',
      text: 'La meilleure version de toi-même commence ce matin 💪 Rejoins-nous pour ta session du jour — chaque effort compte !',
      mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
    {
      id: 's2', kind: 'video', tag: 'WOD du jour', tagColor: 'bg-lime-100 text-lime-700',
      emoji: '🏋️', gradient: 'from-lime-600 to-green-400', accent: 'border-lime-300',
      text: 'WOD du jour 🏋️ — 3 exercices, 15 minutes, 100% efficace. Essayez chez vous ou venez le faire avec nous !',
      channels: ['tiktok', 'instagram'],
      videoIdea: 'Démonstration du workout du jour en 30 secondes. 3 exercices enchaînés sans coupure, vue de côté. Compteur de reps à l\'écran, musique énergique.',
    },
  ],

  sante: [
    {
      id: 'sa1', kind: 'photo', tag: 'Conseil santé', tagColor: 'bg-blue-100 text-blue-700',
      emoji: '🩺', gradient: 'from-blue-600 to-cyan-400', accent: 'border-blue-300',
      text: 'Le geste santé du jour 🩺 : pensez à vous hydrater régulièrement, surtout par temps chaud. Votre corps vous remerciera !',
      mediaUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      mediaType: 'image', channels: ['facebook', 'instagram'],
    },
  ],

  tech: [
    {
      id: 't1', kind: 'photo', tag: 'Innovation', tagColor: 'bg-violet-100 text-violet-700',
      emoji: '💻', gradient: 'from-violet-600 to-indigo-400', accent: 'border-violet-300',
      text: 'L\'innovation ne s\'arrête jamais 💻 Notre équipe travaille sur quelque chose d\'excitant — restez connectés pour la grande annonce !',
      mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      mediaType: 'image', channels: ['linkedin', 'facebook'],
    },
  ],

  conseil: [
    {
      id: 'co1', kind: 'text', tag: 'Astuce pro', tagColor: 'bg-blue-100 text-blue-700',
      emoji: '💼', gradient: 'from-blue-700 to-sky-400', accent: 'border-blue-300',
      text: 'La clé d\'une entreprise performante ? Une communication régulière et authentique 💼 Voici notre conseil du jour pour vos équipes.',
      channels: ['linkedin', 'facebook'],
    },
  ],

  tourisme: [
    {
      id: 'to1', kind: 'photo', tag: 'Destination', tagColor: 'bg-sky-100 text-sky-700',
      emoji: '✈️', gradient: 'from-sky-600 to-blue-400', accent: 'border-sky-300',
      text: 'Le voyage de vos rêves commence ici ✈️ Laissez-vous tenter par notre sélection de la semaine — des adresses que vous n\'oublierez pas.',
      mediaUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
      mediaType: 'image', channels: ['instagram', 'facebook'],
    },
  ],

  education: [
    {
      id: 'ed1', kind: 'text', tag: 'Astuce pédago', tagColor: 'bg-amber-100 text-amber-700',
      emoji: '📚', gradient: 'from-amber-600 to-orange-400', accent: 'border-amber-300',
      text: 'Saviez-vous qu\'apprendre en 20 minutes par jour est plus efficace qu\'une session de 2h ? 📚 Découvrez notre méthode.',
      channels: ['facebook', 'linkedin'],
    },
  ],
};

// Default fallback suggestions for unknown sectors
const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  {
    id: 'def1', kind: 'photo', tag: 'Post du jour', tagColor: 'bg-primary/10 text-primary',
    emoji: '✨', gradient: 'from-primary to-teal-400', accent: 'border-primary/30',
    text: 'Chaque jour est une nouvelle opportunité de partager votre expertise ✨ Qu\'avez-vous à offrir à votre communauté aujourd\'hui ?',
    mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    mediaType: 'image', channels: ['linkedin', 'instagram'],
  },
  {
    id: 'def2', kind: 'video', tag: 'Idée vidéo', tagColor: 'bg-violet-100 text-violet-700',
    emoji: '🎬', gradient: 'from-violet-600 to-purple-400', accent: 'border-violet-300',
    text: 'Une courte vidéo de présentation de vos services — 30 secondes suffisent pour marquer les esprits !',
    channels: ['tiktok', 'instagram'],
    videoIdea: 'Présentez votre activité en 30 secondes avec un témoignage client ou une démonstration rapide. Format vertical, sourire et authenticité !',
  },
];

// ── Suggestion card ───────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onSkip,
  onUse,
  isRefreshing,
}: {
  suggestion: AISuggestion;
  onSkip: () => void;
  onUse: (s: AISuggestion) => void;
  isRefreshing: boolean;
}) {
  const KindIcon = suggestion.kind === 'video' ? Video : suggestion.kind === 'photo' ? Camera : FileText;

  return (
    <div className={`relative rounded-2xl border overflow-hidden flex flex-col transition-all duration-500 ${
      isRefreshing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    } hover:-translate-y-0.5 hover:shadow-md`}>

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${suggestion.gradient} p-5 relative overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-3 right-8 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />

        {/* Tag + emoji */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full px-2.5 py-0.5">
            <KindIcon size={9} strokeWidth={2.5} />
            {suggestion.tag}
          </span>
          <span className="text-2xl">{suggestion.emoji}</span>
        </div>

        {/* Preview image or video idea */}
        {suggestion.mediaUrl ? (
          <div className="relative z-10 rounded-xl overflow-hidden h-24 mt-2">
            <img
              src={suggestion.mediaUrl}
              alt="suggestion"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : suggestion.videoIdea ? (
          <div className="relative z-10 rounded-xl bg-white/10 border border-white/20 p-3 mt-2">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Video size={13} className="text-white" />
              </div>
              <p className="text-white/90 text-[11px] leading-relaxed">{suggestion.videoIdea}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col p-4 gap-3 bg-card border-t border-border/50">
        {/* Text preview */}
        <p className="text-sm text-foreground leading-relaxed line-clamp-3 flex-1">
          {suggestion.text}
        </p>

        {/* Channel badges */}
        <div className="flex flex-wrap gap-1.5">
          {suggestion.channels.slice(0, 3).map(ch => (
            <span
              key={ch}
              className="text-[10px] font-semibold rounded-full bg-muted border border-border px-2 py-0.5 text-muted-foreground capitalize"
            >
              {ch.replace('_', ' ')}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onSkip}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 hover:border-border/80 transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Passer
          </button>
          <button
            onClick={() => onUse(suggestion)}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-foreground text-background rounded-xl px-3 py-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <Zap size={12} />
            Utiliser
            <ChevronRight size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main block ────────────────────────────────────────────────────────────────

interface AISuggestionsBlockProps {
  onUseSuggestion: (suggestion: AISuggestion) => void;
}

export function AISuggestionsBlock({ onUseSuggestion }: AISuggestionsBlockProps) {
  const profile = useOnboardingProfile();
  const [indices, setIndices] = useState([0, 1, 2]);
  const [refreshing, setRefreshing] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Simulate 08:00 generation timestamp
  const today = new Date();
  const updateTime = `Mis à jour aujourd'hui à ${String(today.getHours() >= 8 ? 8 : 8).padStart(2, '0')}:00`;

  const pool: AISuggestion[] = useMemo(() => {
    const sector = profile?.sector ?? '';
    const sectorSuggestions = SUGGESTIONS[sector] ?? DEFAULT_SUGGESTIONS;
    // Always have at least 3 unique entries by cycling
    const padded: AISuggestion[] = [];
    while (padded.length < 6) {
      sectorSuggestions.forEach(s => { if (padded.length < 6) padded.push(s); });
    }
    return padded;
  }, [profile?.sector]);

  const cards = indices.map(i => pool[i % pool.length]);

  const handleSkip = async (cardIdx: number) => {
    setRefreshing(cardIdx);
    await new Promise(r => setTimeout(r, 300));
    setIndices(prev => {
      const next = [...prev];
      // Advance this card's index, skip cards currently shown
      let candidate = (next[cardIdx] + 1) % pool.length;
      while (next.some((v, j) => j !== cardIdx && v % pool.length === candidate % pool.length)) {
        candidate = (candidate + 1) % pool.length;
      }
      next[cardIdx] = candidate;
      return next;
    });
    setRefreshing(null);
  };

  if (dismissed) return null;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground leading-tight">
                ✨ Vos suggestions IA prêtes à publier
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-update badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
            <Clock size={10} className="text-green-600 shrink-0" />
            <span className="text-[10px] font-semibold text-green-700">{updateTime}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Masquer
          </button>
        </div>
      </div>

      {/* Sector tag */}
      {profile?.sector && SUGGESTIONS[profile.sector] && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Contenu généré pour le secteur <strong className="text-foreground capitalize">{profile.sector}</strong>
          {profile.companyName && <> · <strong className="text-foreground">{profile.companyName}</strong></>}
        </p>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((suggestion, i) => (
          <SuggestionCard
            key={`${suggestion.id}-${indices[i]}`}
            suggestion={suggestion}
            onSkip={() => handleSkip(i)}
            onUse={onUseSuggestion}
            isRefreshing={refreshing === i}
          />
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-muted-foreground text-center">
        🤖 Suggestions générées automatiquement chaque matin par l'IA Kompilot selon votre secteur et vos objectifs.
      </p>
    </section>
  );
}
