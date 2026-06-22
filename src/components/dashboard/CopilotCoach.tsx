import { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useConnectedAccounts } from '../../context/ConnectedAccountsContext';
import { useCredits } from '../../context/CreditsContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';

// ── Types ──────────────────────────────────────────────────────────────────────

type ScenarioId = 'timing' | 'diversity' | 'seo' | 'abtesting';

interface Scenario {
  id: ScenarioId;
  emoji: string;
  tag: string;
  tagColor: string;
  title: string;
  body: (firstName: string, sector: string) => string;
  cta: string;
  ctaEmoji: string;
  gradient: string;
  glowColor: string;
}

// ── Scenario definitions ───────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 'timing',
    emoji: '🌙',
    tag: 'Timing de publication',
    tagColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    title: 'Vous publiez quand vos clients dorment !',
    body: (firstName, _sector) =>
      `💡 ${firstName || 'Chef'}, j'ai remarqué que vous publiez souvent tard le soir. Vos clients dorment à cette heure-là ! Laissez-moi programmer votre prochain post à 11h30 demain, juste avant le rush du midi, pour multiplier vos vues par 3.`,
    cta: 'Planifier à l\'heure idéale',
    ctaEmoji: '🎯',
    gradient: 'from-indigo-600 via-violet-600 to-purple-600',
    glowColor: 'shadow-indigo-200',
  },
  {
    id: 'diversity',
    emoji: '🎭',
    tag: 'Diversité du contenu',
    tagColor: 'bg-rose-100 text-rose-700 border-rose-200',
    title: 'Trop de promo, pas assez d\'humain !',
    body: (_firstName, sector) =>
      `🔥 Vos clients aiment l'humain ! Vos 4 derniers posts parlent uniquement de vos produits. Et si on montrait les coulisses de votre ${sector || 'établissement'} pour créer du lien et booster l'engagement de 40% ?`,
    cta: "Générer une idée 'Coulisses'",
    ctaEmoji: '📸',
    gradient: 'from-rose-500 via-pink-500 to-orange-500',
    glowColor: 'shadow-rose-200',
  },
  {
    id: 'seo',
    emoji: '📈',
    tag: 'Opportunité SEO Local',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    title: 'Une opportunité en or sur Google Maps !',
    body: (_firstName, sector) =>
      `📈 Opportunité en or ! Les recherches pour "${sector || 'votre métier'} autour de moi" ont bondi de 15% dans votre zone cette semaine. Optimisons votre fiche Google Business pour capter ces clients avant vos concurrents.`,
    cta: 'Booster mon SEO Local',
    ctaEmoji: '🚀',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-200',
  },
  {
    id: 'abtesting',
    emoji: '🧪',
    tag: 'Test A/B de contenu',
    tagColor: 'bg-amber-100 text-amber-700 border-amber-200',
    title: 'Vos posts performent 2× mieux avec ces ajustements !',
    body: (firstName, _sector) =>
      `🧪 ${firstName || 'Chef'}, j'ai analysé vos 10 derniers posts. Les publications avec une question en accroche obtiennent +68% de commentaires, et les visuels avec texte superposé génèrent 2× plus de partages que les photos simples. Testez deux versions de votre prochain post pour confirmer la formule gagnante pour votre audience !`,
    cta: 'Lancer mon test A/B',
    ctaEmoji: '⚗️',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    glowColor: 'shadow-amber-200',
  },
];

// ── Behavior detection (simulated) ────────────────────────────────────────────

function detectScenario(hasAny: boolean, weeklyPosts: number): ScenarioId {
  // Try to read last post hour from localStorage for scenario A
  try {
    const raw = localStorage.getItem('kompilot_last_post_hour');
    const hour = raw ? parseInt(raw, 10) : null;
    if (hour !== null && hour >= 21) return 'timing';
  } catch { /* noop */ }

  // Scenario B: few posts this week (simulates lack of diversity)
  if (weeklyPosts >= 1 && weeklyPosts <= 4 && !hasAny) return 'diversity';
  if (weeklyPosts >= 1 && weeklyPosts <= 4) return 'diversity';

  // Scenario C: high post count — suggest A/B testing for better engagement
  if (weeklyPosts > 4) return 'abtesting';

  // Scenario D: default — SEO opportunity
  return 'seo';
}

// Deterministic rotation so each session can see a different scenario
function getRotatingScenario(): ScenarioId {
  const ids: ScenarioId[] = ['timing', 'diversity', 'seo', 'abtesting'];
  const stored = localStorage.getItem('kompilot_coach_scenario_idx');
  const idx = stored ? parseInt(stored, 10) : Math.floor(Math.random() * 4);
  return ids[idx % 4];
}

function advanceRotation() {
  const stored = localStorage.getItem('kompilot_coach_scenario_idx');
  const idx = stored ? parseInt(stored, 10) : 0;
  localStorage.setItem('kompilot_coach_scenario_idx', String((idx + 1) % 4));
}

// ── Animated dots (thinking indicator) ────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 items-end h-4 ml-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </span>
  );
}

// ── Typewriter text ────────────────────────────────────────────────────────────

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

// ── Robot avatar ───────────────────────────────────────────────────────────────

function RobotAvatar({ gradient, pulse }: { gradient: string; pulse: boolean }) {
  return (
    <div className={`relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      {/* Glow ring when pulsing */}
      {pulse && (
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} animate-ping opacity-20`} />
      )}

      {/* Robot face */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="relative z-10">
        {/* Head */}
        <rect x="6" y="8" width="20" height="16" rx="4" fill="white" fillOpacity="0.9" />
        {/* Antenna */}
        <rect x="15" y="3" width="2" height="5" rx="1" fill="white" fillOpacity="0.8" />
        <circle cx="16" cy="2.5" r="1.5" fill="white" />
        {/* Eyes */}
        <rect x="9" y="13" width="5" height="4" rx="2" fill="currentColor" className="text-white/30" />
        <rect x="18" y="13" width="5" height="4" rx="2" fill="currentColor" className="text-white/30" />
        {/* Eye pupils — animate */}
        <circle cx="11.5" cy="15" r="1.5" fill="white">
          <animate attributeName="cx" values="10.5;12.5;10.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="20.5" cy="15" r="1.5" fill="white">
          <animate attributeName="cx" values="19.5;21.5;19.5" dur="3s" repeatCount="indefinite" />
        </circle>
        {/* Mouth */}
        <path d="M11 20.5 Q16 23 21 20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Ears */}
        <rect x="2" y="13" width="4" height="6" rx="2" fill="white" fillOpacity="0.7" />
        <rect x="26" y="13" width="4" height="6" rx="2" fill="white" fillOpacity="0.7" />
      </svg>

      {/* Sparkle top-right */}
      <Sparkles size={11} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CopilotCoachProps {
  onOpenCreatePost: (text: string, channels?: string[]) => void;
  onOpenSettings: () => void;
}

const DISMISSED_KEY = 'kompilot_coach_dismissed_at';
const COOLDOWN_MS   = 1000 * 60 * 60 * 4; // 4 h cooldown after dismiss

export function CopilotCoach({ onOpenCreatePost, onOpenSettings }: CopilotCoachProps) {
  const { user } = useAuth();
  const { hasAny } = useConnectedAccounts();
  const { usage } = useCredits();
  const profile = useOnboardingProfile();

  const firstName  = user?.displayName?.split(' ')[0] ?? '';
  const sector     = profile?.sector ?? '';

  // ── Visibility ──────────────────────────────────────────────────────────────
  const [visible, setVisible] = useState(() => {
    try {
      const ts = localStorage.getItem(DISMISSED_KEY);
      if (!ts) return true;
      return Date.now() - parseInt(ts, 10) > COOLDOWN_MS;
    } catch { return true; }
  });

  // ── Loading / thinking phase ─────────────────────────────────────────────────
  const [thinking, setThinking] = useState(true);
  const [scenarioId, setScenarioId] = useState<ScenarioId>(() => getRotatingScenario());

  useEffect(() => {
    const timer = setTimeout(() => {
      setScenarioId(detectScenario(hasAny, usage));
      setThinking(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [hasAny, usage]);

  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;
  const bodyText  = scenario.body(firstName, sector);

  // ── Dismiss ──────────────────────────────────────────────────────────────────
  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  // ── Next advice (rotate) ─────────────────────────────────────────────────────
  const handleNext = () => {
    advanceRotation();
    setThinking(true);
    setTimeout(() => {
      setScenarioId(getRotatingScenario());
      setThinking(false);
    }, 900);
  };

  // ── CTA action ───────────────────────────────────────────────────────────────
  const handleCTA = () => {
    if (scenarioId === 'timing') {
      // Pre-fill post modal with ideal time suggestion
      onOpenCreatePost(
        `📅 Publication programmée à 11h30 — heure idéale recommandée par votre Coach IA.\n\n[Rédigez votre actualité ici pour maximiser votre portée ☀️]`,
        ['instagram', 'facebook']
      );
    } else if (scenarioId === 'diversity') {
      // Generate a "behind the scenes" post idea
      onOpenCreatePost(
        `📸 Dans les coulisses de ${sector || 'notre établissement'}...\n\nAujourd'hui, on vous emmène voir comment on prépare [votre préparation signature / votre service phare]. Chaque détail compte pour vous offrir le meilleur ! 🔥\n\n#Coulisses #Artisan #FaitAvecAmour`,
        ['instagram', 'facebook']
      );
    } else if (scenarioId === 'abtesting') {
      // Pre-fill two A/B test variant ideas
      onOpenCreatePost(
        `⚗️ Test A/B — Variante A (accroche question)\n\nEt si vous pouviez [bénéfice clé de votre service] en seulement [délai] ? 👀\n\n[Décrivez votre offre ici et invitez à commenter]\n\n#TestAB #Engagement #[VotreSecteur]\n\n---\n💡 Astuce Coach IA : Publiez une Variante B avec un visuel texte superposé pour comparer les performances !`,
        ['instagram', 'facebook']
      );
    } else {
      // SEO → open settings (Google Business tab)
      onOpenSettings();
    }
  };

  if (!visible) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Decorative gradient strip at top */}
      <div className={`h-1 w-full bg-gradient-to-r ${scenario.gradient}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <RobotAvatar gradient={scenario.gradient} pulse={thinking} />

          {/* Title + tag */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                🧠 Le Conseil du Coach IA
              </span>
              {!thinking && (
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${scenario.tagColor}`}>
                  {scenario.tag}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground leading-tight">
              {thinking ? (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  Analyse de votre activité en cours <ThinkingDots />
                </span>
              ) : (
                scenario.title
              )}
            </h3>
          </div>

          {/* Actions top-right */}
          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
            <button
              onClick={handleNext}
              title="Voir un autre conseil"
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw size={13} className={thinking ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDismiss}
              title="Masquer"
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body text */}
        <div className="mt-4 pl-[72px]">
          {thinking ? (
            /* Skeleton while thinking */
            <div className="space-y-2">
              {[100, 80, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded-full bg-muted animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">
              <TypewriterText text={bodyText} speed={14} />
            </p>
          )}
        </div>

        {/* CTA */}
        {!thinking && (
          <div className="mt-4 pl-[72px] flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCTA}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${scenario.gradient} text-white text-sm font-bold px-5 py-2.5 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
            >
              <span>{scenario.ctaEmoji}</span>
              {scenario.cta}
              <ChevronRight size={15} />
            </button>
            <button
              onClick={handleNext}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RefreshCw size={11} /> Autre conseil
            </button>
          </div>
        )}
      </div>

      {/* Scenario dots indicator */}
      {!thinking && (
        <div className="flex items-center gap-1.5 justify-center pb-3">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setScenarioId(s.id);
                localStorage.setItem('kompilot_coach_scenario_idx', String(SCENARIOS.indexOf(s)));
              }}
              className={`rounded-full transition-all duration-200 ${
                s.id === scenarioId
                  ? `w-4 h-1.5 bg-gradient-to-r ${scenario.gradient}`
                  : 'w-1.5 h-1.5 bg-muted hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
