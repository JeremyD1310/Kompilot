/**
 * IdeesMarketingPanel — "Votre plan d'attaque de la semaine" (Style Swydea)
 *
 * UX :
 *  - Initial : accroche forte + grand bouton violet "⚡ Découvrir mes 15 idées"
 *  - Au clic  : génération IA → 15 idées personnalisées (fallback immédiat)
 *  - Par idée : bouton émeraude "Lancer cette idée" → pré-remplit le Cockpit
 */
import { useState } from 'react';
import { Users, Zap, MapPin, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { generateMarketingCopy } from '../../lib/aiRouterClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketingIdea {
  id: string;
  emoji: string;
  title: string;
  description: string;
  prefillText: string;
  category: 'post' | 'avis' | 'operation';
}

interface Props {
  establishmentName: string;
  city: string;
  sector: string;
  onLaunchIdea: (text: string) => void;
}

// ── Static fallback ideas ─────────────────────────────────────────────────────

function buildFallback(name: string, city: string, sector: string): MarketingIdea[] {
  const slug = (s: string) => s.replace(/\s+/g, '');
  return [
    { id: 'f1',  emoji: '🎬', category: 'post',      title: 'Post Coulisses équipe',         description: 'Présentez votre équipe en vidéo pour doubler vos commentaires.',                                    prefillText: `Aujourd'hui on vous fait entrer dans les coulisses de ${name} ! Découvrez l'équipe passionnée qui vous accueille à ${city}. 🙌 Quel est votre visage préféré ? Commentez 👇` },
    { id: 'f2',  emoji: '⭐', category: 'avis',      title: 'Déclencheur d\'avis WhatsApp',   description: 'Mini-campagne : un cadeau contre un avis contenant votre mot-clé secteur.',                       prefillText: `🌟 Aimé votre expérience chez ${name} ? Laissez un avis Google avec "${sector}" et recevez un petit cadeau à votre prochain passage ! 🎁` },
    { id: 'f3',  emoji: '🏷️', category: 'operation', title: 'Flash du week-end',              description: 'Une offre 48h le vendredi génère 3× plus d\'engagement.',                                          prefillText: `⚡ OFFRE FLASH chez ${name} à ${city} ! -15% ce samedi et dimanche. Places limitées — commentez FLASH pour réserver 👇` },
    { id: 'f4',  emoji: '📸', category: 'post',      title: 'Nouveauté en avant-première',    description: 'Teaser progressif — crée de l\'anticipation et booste les partages.',                               prefillText: `🔮 Quelque chose arrive chez ${name}... Devinez dans les commentaires 👇 Révélation samedi ! #${slug(sector)} #${slug(city)}` },
    { id: 'f5',  emoji: '💬', category: 'avis',      title: 'Témoignage client amplifié',     description: 'Avis client republié + photo équipe. Preuve sociale = +40% de clics.',                             prefillText: `💛 Merci pour ce retour qui nous touche ! Des clients comme vous donnent tout leur sens à notre métier chez ${name}. ⭐⭐⭐⭐⭐` },
    { id: 'f6',  emoji: '🗓️', category: 'post',      title: 'Agenda de la semaine',           description: 'Post récapitulatif hebdomadaire — crée une routine pour vos abonnés.',                             prefillText: `📅 Programme de la semaine chez ${name} !\n📌 Lun-Ven : horaires habituels\n🌟 Sam : journée spéciale\n☎️ Réservations : en bio — On vous attend ! 🙌` },
    { id: 'f7',  emoji: '🔍', category: 'post',      title: 'Post SEO local ciblé',           description: 'Mots-clés géographiques intégrés pour booster votre positionnement Maps.',                         prefillText: `📍 Vous cherchez le meilleur ${sector} à ${city} ? Chez ${name}, expertise locale + service personnalisé. Venez découvrir la différence ! #${sector} #${city}` },
    { id: 'f8',  emoji: '🎯', category: 'operation', title: 'Campagne SMS fidélité',          description: 'SMS personnalisé → 34% de taux de conversion chez les clients fidèles.',                           prefillText: `Bonjour ! En tant que client fidèle de ${name}, profitez de -20% ce mois 🎁 Code : FIDELITE. À très vite à ${city} !` },
    { id: 'f9',  emoji: '🤝', category: 'operation', title: 'Partenariat commerce local',     description: 'Post co-brandé avec un commerce complémentaire de votre quartier.',                                prefillText: `🤝 ${name} s'associe à un partenaire de qualité à ${city} ! Annonce surprise vendredi 🎉 Restez connectés !` },
    { id: 'f10', emoji: '💡', category: 'post',      title: 'Conseil expert du secteur',      description: 'Partager votre expertise crédibilise l\'établissement et attire des clients qualifiés.',           prefillText: `💡 Conseil du jour par l'équipe ${name} : [votre conseil ${sector}]. Enregistrez ce post — vous en aurez besoin ! 📌 Questions ? Commentez 👇` },
    { id: 'f11', emoji: '🌟', category: 'avis',      title: 'Avis contre avantage',           description: '+8% de visibilité locale par avis Google reçu et répondu.',                                        prefillText: `🌟 Votre avis compte énormément pour ${name} ! Évaluez-nous sur Google et présentez-le à votre prochaine visite pour une surprise 🎁` },
    { id: 'f12', emoji: '🎁', category: 'operation', title: 'Opération anniversaire client',  description: 'Offre mensuelle pour les clients nés ce mois — taux d\'engagement ×5.',                           prefillText: `🎂 ${name} célèbre ses clients nés ce mois ! Commentez "ANNIVERSAIRE" pour votre surprise personnalisée 🎁 Joyeux anniversaire à tous !` },
    { id: 'f13', emoji: '📊', category: 'post',      title: 'Sondage engagement',             description: 'Posts sondage = 2× plus de commentaires et algorithme boosté.',                                    prefillText: `🤔 Question du jour chez ${name} — Votre priorité pour choisir un ${sector} à ${city} ?\n🔵 Qualité\n🟡 Prix\n🟢 Accueil\n🔴 Localisation\n\nVotez 👇` },
    { id: 'f14', emoji: '🚀', category: 'operation', title: 'Relance clients inactifs',       description: 'Message ciblé aux clients absents depuis 3 mois → 28% de conversion.',                            prefillText: `💛 Vous nous manquez ! Pour fêter votre retour chez ${name}, -10% sur votre prochaine visite. Code : RETOUR. On vous attend à ${city} !` },
    { id: 'f15', emoji: '🌍', category: 'post',      title: 'Post Google Business ciblé',    description: 'Posts Google Business optimisés = +15 points de score GEO.',                                       prefillText: `📍 ${name} — votre référence ${sector} à ${city}.\n✅ Expertise locale\n✅ Équipe passionnée\n✅ Avis 5★\nPrenez rendez-vous via Google Maps 📞` },
  ];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CATEGORY_STYLES = {
  post:      { label: 'Post social', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  avis:      { label: 'Avis Google', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  operation: { label: 'Opération',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
};

const BADGES = [
  { icon: Users,  label: 'Équipe IA',  sub: '5 agents : Copywriter, Expert SEO, Pro des avis…' },
  { icon: Zap,    label: 'Vitesse',     sub: 'Idées prêtes en 2 min' },
  { icon: MapPin, label: 'Sur-mesure', sub: 'Adapté à votre ville et secteur' },
];

// ── Idea Card ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, index, onLaunch }: { idea: MarketingIdea; index: number; onLaunch: (t: string) => void }) {
  const cat = CATEGORY_STYLES[idea.category];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 hover:border-emerald-200 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-start gap-2.5">
        <span className="text-2xl shrink-0 leading-none">{idea.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] font-extrabold text-muted-foreground/60 tabular-nums">#{index + 1}</span>
            <p className="text-sm font-bold text-foreground leading-snug">{idea.title}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.text} shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
              {cat.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>
        </div>
      </div>

      <button
        onClick={() => onLaunch(idea.prefillText)}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 group-hover:shadow-emerald-300"
      >
        <Zap size={12} />
        Lancer cette idée
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 rounded-2xl border border-border bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function IdeesMarketingPanel({ establishmentName, city, sector, onLaunchIdea }: Props) {
  // 'idle' = teaser, 'loading' = IA en cours, 'done' = idées affichées
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [ideas, setIdeas] = useState<MarketingIdea[]>([]);
  const [showAll, setShowAll] = useState(false);

  const cacheKey = `kompilot_idees_${establishmentName}_${city}_${sector}`;

  const handleDiscover = async () => {
    // Check session cache
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as MarketingIdea[];
        if (parsed.length >= 10) { setIdeas(parsed); setPhase('done'); return; }
      }
    } catch { /* ignore */ }

    // Show fallback immediately, AI enriches in background
    const fallback = buildFallback(establishmentName, city, sector);
    setIdeas(fallback);
    setPhase('loading');

    const prompt = `Tu es un expert en marketing local pour les commerces de proximité.
Génère exactement 15 idées marketing concrètes et actionnables pour "${establishmentName}", un ${sector} situé à "${city}".

Chaque idée : emoji, titre (≤ 6 mots), description (1 phrase, max 120 car.), prefillText (max 300 car., prêt pour Instagram/WhatsApp), catégorie ("post"|"avis"|"operation").

Réponds UNIQUEMENT en JSON valide :
[{"emoji":"...","title":"...","description":"...","prefillText":"...","category":"post"}]

Mix requis : posts réseaux sociaux, campagnes d'avis Google, opérations locales. Spécifique à "${sector}" et "${city}".`;

    try {
      const res = await generateMarketingCopy(prompt, { sector, city, name: establishmentName });
      const raw = res.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      const parsed: Omit<MarketingIdea, 'id'>[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 10) {
        const withIds = parsed.map((item, i) => ({ ...item, id: `ai-${i}` }));
        setIdeas(withIds);
        sessionStorage.setItem(cacheKey, JSON.stringify(withIds));
      }
    } catch { /* keep fallback */ } finally {
      setPhase('done');
    }
  };

  const handleLaunch = (text: string) => {
    onLaunchIdea(text);
    setTimeout(() => {
      document.querySelector('[data-tour="cockpit-creation"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const visibleIdeas = showAll ? ideas : ideas.slice(0, 6);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-violet-950/90 via-violet-900/95 to-primary/80"
      data-tour="idees-marketing-panel"
    >
      {/* ── Header always visible ── */}
      <div className="px-6 pt-6 pb-5">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 bg-violet-900/60 border border-violet-700/50 rounded-full px-2.5 py-1">
            <Sparkles size={11} className="text-violet-300" />
            Votre plan d'attaque de la semaine
          </span>
          {phase === 'loading' && (
            <span className="flex items-center gap-1 text-[11px] text-violet-300">
              <RefreshCw size={11} className="animate-spin" /> Génération IA…
            </span>
          )}
        </div>

        {/* Accroche */}
        <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight mb-2 max-w-xl">
          Le commerce d'en face n'est pas meilleur que le vôtre.
          <br className="hidden sm:block" />
          <span className="text-violet-300"> Il teste et applique simplement plus d'idées.</span>
        </h2>
        <p className="text-sm text-violet-200/80 mb-5 leading-relaxed max-w-lg">
          Laissez votre équipe d'experts IA prendre les devants. 5 agents dédiés — Copywriter, Expert SEO Local, Community Manager et plus — génèrent 15 scénarios de croissance sur-mesure pour <strong className="text-white">{establishmentName}</strong> à <strong className="text-white">{city}</strong>.
        </p>

        {/* Benefit badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {BADGES.map(badge => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                <div className="w-6 h-6 rounded-lg bg-violet-500/30 flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-violet-200" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">{badge.label}</p>
                  <p className="text-[10px] text-violet-300 leading-tight">{badge.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA button — only visible in idle phase */}
        {phase === 'idle' && (
          <button
            onClick={handleDiscover}
            className="group flex items-center justify-center gap-3 w-full sm:w-auto rounded-2xl bg-violet-500 hover:bg-violet-400 active:scale-[0.98] text-white font-extrabold text-sm px-8 py-4 transition-all shadow-lg shadow-violet-900/50 hover:shadow-violet-700/60"
          >
            <Zap size={18} className="group-hover:animate-pulse" />
            ⚡ Découvrir mes 15 idées marketing locales
          </button>
        )}
      </div>

      {/* ── Ideas results ── */}
      {phase !== 'idle' && (
        <div className="bg-background/95 backdrop-blur-sm border-t border-white/10 px-5 pt-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-foreground">
              {phase === 'loading' ? 'Préparation de vos idées…' : `${ideas.length} idées prêtes à lancer`}
            </p>
            {phase === 'done' && (
              <button
                onClick={() => { setPhase('idle'); setIdeas([]); setShowAll(false); try { sessionStorage.removeItem(cacheKey); } catch {} }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Régénérer
              </button>
            )}
          </div>

          {phase === 'loading' ? (
            <SkeletonGrid />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleIdeas.map((idea, i) => (
                  <IdeaCard key={idea.id} idea={idea} index={i} onLaunch={handleLaunch} />
                ))}
              </div>

              {ideas.length > 6 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 text-muted-foreground text-xs font-semibold py-2.5 hover:border-primary/40 hover:text-foreground transition-all"
                >
                  {showAll
                    ? <><ChevronUp size={13} /> Voir moins</>
                    : <><ChevronDown size={13} /> Voir les {ideas.length - 6} autres idées</>}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
