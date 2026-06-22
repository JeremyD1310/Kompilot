/**
 * AIOPage — Visibilité IA (AIO: AI Optimization)
 * Score d'indexation sémantique, grille des modèles IA, simulateur de requête,
 * plan d'action sémantique interactif.
 */
import { useState, useEffect, useRef } from 'react';
import { Brain, CheckCircle2, Circle, Sparkles, Zap, RefreshCw, Send, Bot } from 'lucide-react';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { useEstablishment } from '../context/EstablishmentContext';
import { AIOAuditPanel } from '../components/aio/AIOAuditPanel';
import { AIOSchemaPanel } from '../components/aio/AIOSchemaPanel';
import { SOVModule } from '../components/aio/SOVModule';

// ── Sector helpers ────────────────────────────────────────────────────────────

const SECTOR_LABELS: Record<string, string> = {
  beauty: 'Beauté / Coiffure',
  medical: 'Médical / Santé',
  restaurant: 'Restauration',
  auto: 'Automobile',
  retail: 'Commerce de détail',
  fitness: 'Sport / Fitness',
  default: 'Commerce local',
};

const SECTOR_ALIASES: Record<string, string> = {
  Beauté: 'beauty', Beauty: 'beauty', Coiffure: 'beauty',
  Médical: 'medical', Medical: 'medical', Santé: 'medical',
  Restauration: 'restaurant', Restaurant: 'restaurant',
  Auto: 'auto', Automobile: 'auto',
  Retail: 'retail', Commerce: 'retail',
  Sport: 'fitness', Fitness: 'fitness',
};

function resolveSector(raw: string): string {
  return SECTOR_ALIASES[raw] ?? (Object.values(SECTOR_ALIASES).includes(raw) ? raw : 'default');
}

function getSectorLabel(raw: string): string {
  return SECTOR_LABELS[resolveSector(raw)] ?? raw ?? 'Commerce local';
}

// ── Simulated AI responses per sector ────────────────────────────────────────

const AI_RESPONSES: Record<string, {
  chatgpt: { status: 'excellent' | 'warning' | 'optimized'; text: string };
  gemini: { status: 'excellent' | 'warning' | 'optimized'; text: string };
  perplexity: { status: 'excellent' | 'warning' | 'optimized'; text: string };
  apple: { status: 'excellent' | 'warning' | 'optimized'; text: string };
  responseText: (biz: string, city: string) => string;
}> = {
  beauty: {
    chatgpt: { status: 'excellent', text: 'Recommandé sur 84% des requêtes Beauté locales' },
    gemini: { status: 'warning', text: 'Avis manquants pour indexation sémantique beauté' },
    perplexity: { status: 'optimized', text: 'Cité dans le Top 3 Salon/Coiffeur à proximité' },
    apple: { status: 'optimized', text: 'Coordonnées synchronisées avec Apple Maps' },
    responseText: (biz, city) =>
      `Je vous recommande **${biz}** pour vos besoins en beauté à ${city} :\n\n• ⭐ **150+ avis positifs** sur Google avec une note moyenne de 4,8/5\n• ✂️ Spécialité reconnue en **coiffure et soins capillaires haut de gamme**\n• 📍 Localisation centrale, **facilement accessible**\n• 💅 Large gamme de prestations : colorations, soins, extensions\n• 🗓️ **Prise de rendez-vous en ligne** disponible 24h/24\n\nC'est l'établissement de beauté le plus recommandé dans votre secteur !`,
  },
  medical: {
    chatgpt: { status: 'excellent', text: 'Référencé sur 91% des requêtes Santé locales' },
    gemini: { status: 'warning', text: 'Fiche Google incomplète — spécialités médicales manquantes' },
    perplexity: { status: 'optimized', text: 'Cité dans le Top 5 Médecin/Praticien local' },
    apple: { status: 'warning', text: 'Synchronisation Siri incomplète — horaires à mettre à jour' },
    responseText: (biz, city) =>
      `Je vous recommande **${biz}** pour votre prise en charge médicale à ${city} :\n\n• 🏥 **Cabinet reconnu** avec plus de 200 avis patients positifs\n• 👨‍⚕️ Équipe médicale **qualifiée et expérimentée**\n• ⏱️ **Délais de rendez-vous courts** — disponibilité sous 48h\n• 🔒 Prise en charge **Sécurité Sociale et mutuelles**\n• 💻 **Consultation en ligne** disponible sur demande\n\nEtablissement santé de confiance et bien noté dans votre secteur.`,
  },
  restaurant: {
    chatgpt: { status: 'excellent', text: 'Recommandé sur 78% des requêtes Restauration locales' },
    gemini: { status: 'warning', text: 'Menu non indexé — données structurées JSON-LD manquantes' },
    perplexity: { status: 'optimized', text: 'Cité dans le Top 3 Restaurant à proximité' },
    apple: { status: 'optimized', text: 'Intégré aux suggestions Siri "où manger ?"' },
    responseText: (biz, city) =>
      `Je vous recommande **${biz}** pour votre prochain repas à ${city} :\n\n• ⭐ **200+ avis Google** avec une note de 4,7/5\n• 🍽️ Spécialité reconnue avec une **cuisine authentique et savoureuse**\n• 📍 Situé au cœur de ${city}, **idéal pour déjeuner ou dîner**\n• 🥂 Cadre chaleureux, **parfait pour les occasions spéciales**\n• 📱 **Réservation en ligne** simple et rapide\n\nLe meilleur rapport qualité/prix du quartier selon les avis récents !`,
  },
  auto: {
    chatgpt: { status: 'excellent', text: 'Cité sur 72% des requêtes Garage/Auto locales' },
    gemini: { status: 'warning', text: 'Certifications mécaniques non indexées par Gemini' },
    perplexity: { status: 'optimized', text: 'Top 3 Garage agréé / Réparateur auto local' },
    apple: { status: 'optimized', text: 'Fiche Siri complète — horaires et services à jour' },
    responseText: (biz, city) =>
      `Je vous recommande **${biz}** pour l'entretien de votre véhicule à ${city} :\n\n• 🔧 **Garage agréé** avec mécaniciens certifiés\n• ⭐ **120+ avis positifs** — réparations fiables et transparentes\n• ⏱️ **Devis gratuit** sous 24h, intervention rapide\n• 🚗 Spécialité : vidange, freins, distribution, climatisation\n• 📍 **Prêteur de véhicule** disponible sur demande\n\nL'atelier de confiance le plus recommandé par les automobilistes de ${city} !`,
  },
  default: {
    chatgpt: { status: 'excellent', text: 'Recommandé sur 76% des requêtes locales dans votre secteur' },
    gemini: { status: 'warning', text: 'Données sémantiques incomplètes pour une indexation optimale' },
    perplexity: { status: 'optimized', text: 'Cité dans le Top 3 des commerces locaux à proximité' },
    apple: { status: 'optimized', text: 'Coordonnées synchronisées avec Apple Maps / Siri' },
    responseText: (biz, city) =>
      `Je vous recommande **${biz}** pour votre recherche à ${city} :\n\n• ⭐ **Excellent avis clients** — note Google 4,8/5\n• 🏆 **Réputé localement** pour la qualité de ses services\n• 📍 Facilement accessible, **situé en centre-ville**\n• 💬 **Service client réactif** — répond sous 2h\n• 🗓️ **Horaires étendus** pour s'adapter à vos contraintes\n\nL'établissement le mieux noté dans son domaine à ${city} !`,
  },
};

// ── Score computation ─────────────────────────────────────────────────────────

const ACTION_POINTS = [15, 12, 10, 8];

function computeScore(checked: boolean[]): number {
  const base = 42;
  const bonus = checked.reduce((sum, v, i) => sum + (v ? ACTION_POINTS[i] : 0), 0);
  return Math.min(base + bonus, 99);
}

// ── Circular progress ─────────────────────────────────────────────────────────

function CircularScore({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#0D9488' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-foreground">{score}%</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Score IA</span>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'excellent' | 'warning' | 'optimized' }) {
  const map = {
    excellent: { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    optimized: { label: 'Optimisé', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
    warning: { label: 'Alerte', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'warning' ? 'bg-amber-500' : 'bg-current'} animate-pulse`} />
      {label}
    </span>
  );
}

// ── AI model card ─────────────────────────────────────────────────────────────

interface ModelCardProps {
  logo: string;
  name: string;
  text: string;
  status: 'excellent' | 'warning' | 'optimized';
  delay: number;
}

function ModelCard({ logo, name, text, status, delay }: ModelCardProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 flex gap-3 items-start transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-muted">{logo}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-sm text-foreground">{name}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ── Typing effect ─────────────────────────────────────────────────────────────

function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  // Render bold **text** markers
  const parts = displayed.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-primary">{p.slice(2, -2)}</strong>
          : p
      )}
      <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
    </p>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIOPage() {
  const profile = useOnboardingProfile();
  const { activeEstablishment } = useEstablishment();

  const rawSector = profile?.sector ?? '';
  const sector = resolveSector(rawSector);
  const sectorLabel = getSectorLabel(rawSector);
  const bizName = activeEstablishment?.name ?? profile?.companyName ?? 'Votre établissement';
  const city = activeEstablishment?.address?.split(',').pop()?.trim() ?? 'votre ville';

  const aiData = AI_RESPONSES[sector] ?? AI_RESPONSES.default;

  // Checklist state
  const ACTIONS = [
    { label: `Intégrer les mots-clés "${sectorLabel}" dans les avis clients`, points: ACTION_POINTS[0] },
    { label: 'Synchroniser les coordonnées sur Apple Maps via la fiche Siri', points: ACTION_POINTS[1] },
    { label: 'Activer la multi-diffusion sémantique sur 5 plateformes', points: ACTION_POINTS[2] },
    { label: `Générer 5 avis contenant le mot-clé "${sectorLabel}"`, points: ACTION_POINTS[3] },
  ];

  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem('aio_checklist');
      return raw ? JSON.parse(raw) : [false, false, false, false];
    } catch { return [false, false, false, false]; }
  });

  const toggleCheck = (i: number) => {
    const next = checked.map((v, idx) => idx === i ? !v : v);
    setChecked(next);
    localStorage.setItem('aio_checklist', JSON.stringify(next));
  };

  const score = computeScore(checked);

  // Simulator state
  const [simLoading, setSimLoading] = useState(false);
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [showTyping, setShowTyping] = useState(false);
  const prompt = `Trouve-moi le meilleur ${sectorLabel} à proximité`;

  const runSimulation = () => {
    if (simLoading) return;
    setSimLoading(true);
    setSimResponse(null);
    setShowTyping(false);
    setTimeout(() => {
      setSimLoading(false);
      setSimResponse(aiData.responseText(bizName, city));
      setShowTyping(true);
    }, 2000);
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">Visibilité IA — AIO</h1>
              <p className="text-sm text-muted-foreground">Optimisation pour les moteurs de réponse IA</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/20">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-semibold text-primary">{sectorLabel}</span>
          </div>
        </div>

        {/* ── AI Share of Voice & AIO Sync — hero module ──────────── */}
        <SOVModule
          brand={bizName !== 'Votre établissement' ? bizName : 'Kompilot'}
          sector={sectorLabel}
          bizDescription={activeEstablishment?.description ?? `Solution de gestion de présence en ligne pour les PME — secteur ${sectorLabel}.`}
        />

        {/* ── Real AI brand audit ─────────────────────────────────── */}
        <AIOAuditPanel defaultBrandName={bizName !== 'Votre établissement' ? bizName : ''} />

        {/* ── LLM Schema generator ────────────────────────────────── */}
        <AIOSchemaPanel
          defaultName={bizName !== 'Votre établissement' ? bizName : ''}
          defaultBrand={bizName !== 'Votre établissement' ? bizName : ''}
        />

        {/* ── Score + Model grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Score card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-3">
            <CircularScore score={score} />
            <div className="text-center">
              <p className="font-bold text-sm text-foreground">Score d'Indexation Sémantique</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score < 55 ? 'À optimiser — complétez le plan d\'action' :
                  score < 75 ? 'En progression — continuez les actions' :
                    'Excellent — votre présence IA est forte'}
              </p>
            </div>
            {/* Mini progress bars */}
            <div className="w-full space-y-1.5 mt-1">
              {['ChatGPT', 'Gemini', 'Perplexity', 'Apple AI'].map((ai, i) => {
                const vals = [84, 61, 79, 71];
                return (
                  <div key={ai} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">{ai}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000"
                        style={{ width: `${vals[i]}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-foreground w-8 text-right">{vals[i]}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModelCard logo="🤖" name="ChatGPT" text={aiData.chatgpt.text} status={aiData.chatgpt.status} delay={100} />
            <ModelCard logo="💎" name="Gemini" text={aiData.gemini.text} status={aiData.gemini.status} delay={200} />
            <ModelCard logo="🔍" name="Perplexity" text={aiData.perplexity.text} status={aiData.perplexity.status} delay={300} />
            <ModelCard logo="🍎" name="Apple / Siri" text={aiData.apple.text} status={aiData.apple.status} delay={400} />
          </div>
        </div>

        {/* ── Simulator ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Fake ChatGPT header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#10A37F] text-white">
            <Bot size={16} />
            <span className="text-sm font-semibold">ChatGPT — Simulateur de requête client</span>
            <span className="ml-auto text-xs opacity-70">Simulation</span>
          </div>

          <div className="p-4 space-y-4">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-[#10A37F]/10 border border-[#10A37F]/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
                <p className="text-sm text-foreground">{prompt}</p>
              </div>
            </div>

            {/* AI response */}
            {simLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-[#10A37F] flex items-center justify-center shrink-0 text-white text-xs font-bold">AI</div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {showTyping && simResponse && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-[#10A37F] flex items-center justify-center shrink-0 text-white text-xs font-bold">AI</div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                  <TypingText text={simResponse} />
                </div>
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2 mt-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                <p className="text-sm text-muted-foreground truncate flex-1">{prompt}</p>
              </div>
              <button
                onClick={runSimulation}
                disabled={simLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10A37F] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {simLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span className="hidden sm:inline">{simLoading ? 'Analyse...' : 'Tester la réponse IA'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Action plan ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-primary" />
            <h2 className="font-bold text-base text-foreground">Plan d'Action Sémantique</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {checked.filter(Boolean).length}/{ACTIONS.length} actions complétées
            </span>
          </div>

          <div className="space-y-3">
            {ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-all text-left group"
              >
                {checked[i]
                  ? <CheckCircle2 size={20} className="text-primary shrink-0" />
                  : <Circle size={20} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                }
                <span className={`flex-1 text-sm ${checked[i] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {action.label}
                </span>
                <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${checked[i] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  +{action.points}pts
                </span>
              </button>
            ))}
          </div>

          {/* Score impact preview */}
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">Impact sur le score global</span>
              <span className="text-sm font-black text-primary">{score}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Complétez toutes les actions pour atteindre <strong className="text-foreground">87%</strong> d'indexation sémantique.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
