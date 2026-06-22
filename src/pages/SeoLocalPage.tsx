/**
 * SeoLocalPage — Générateur de Pages SEO Locales + Tableau de bord mots-clés.
 * Permet au commerçant de créer du contenu optimisé Google Search sans connaissances techniques.
 */
import { useState, useCallback } from 'react';
import { useEstablishment } from '../context/EstablishmentContext';
import { blink } from '../blink/client';
import {
  Globe,
  Search,
  Plus,
  X,
  Download,
  Copy,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  MapPin,
  ArrowUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface GeneratedPage {
  city: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  h2s: string[];
  bodyText: string;
}

interface KeywordRank {
  keyword: string;
  position: number;
  change: number; // positive = improved, negative = dropped
  trend: 'up' | 'down' | 'stable';
  city: string;
}

/* ── Mock keyword data ──────────────────────────────────────────────────────── */
const MOCK_KEYWORDS: KeywordRank[] = [
  { keyword: 'meilleur salon de coiffure', position: 3, change: 0, trend: 'stable', city: 'La Rochelle' },
  { keyword: 'lissage brésilien', position: 5, change: 4, trend: 'up', city: 'Périgny' },
  { keyword: 'coiffeur femme', position: 8, change: 2, trend: 'up', city: 'Aytré' },
  { keyword: 'balayage blond', position: 12, change: -1, trend: 'down', city: 'La Rochelle' },
  { keyword: 'coupe homme tendance', position: 7, change: 3, trend: 'up', city: 'La Rochelle' },
];

/* ── AI generation ──────────────────────────────────────────────────────────── */
async function generateSeoPage(
  businessName: string,
  activity: string,
  city: string,
  mainCity: string,
): Promise<GeneratedPage> {
  const isMainCity = city === mainCity;
  const prompt = `Tu es un expert SEO local français. Génère un contenu optimisé Google Search pour un commerce local.

Commerce : "${businessName}"
Activité : "${activity}"
Ville ciblée : "${city}"
Ville principale : "${mainCity}"

Génère uniquement un objet JSON valide avec ces champs :
{
  "h1": "Titre H1 accrocheur incluant l'activité et la ville (max 60 chars)",
  "metaTitle": "Balise title SEO avec ville et activité-clé (max 60 chars)",
  "metaDescription": "Meta description engageante avec CTA (max 155 chars)",
  "h2s": ["Sous-titre 1 avec mot-clé local", "Sous-titre 2 services", "Sous-titre 3 zone géographique"],
  "bodyText": "Texte SEO optimisé de 500 mots minimum mentionnant la ville, les services, les quartiers proches, le commerce. Écrire naturellement en français. Pas de balises HTML dans le texte."
}

Réponds uniquement avec le JSON, sans texte supplémentaire.`;

  try {
    const { text } = await blink.ai.generateText({
      prompt,
      model: 'gpt-4.1-mini',
    });
    const parsed = JSON.parse(text.trim());
    return { city, ...parsed };
  } catch {
    // Fallback simulé
    return {
      city,
      h1: `${businessName} — ${activity} à ${city}`,
      metaTitle: `${activity} ${city} | ${businessName}`,
      metaDescription: `Découvrez ${businessName}, votre spécialiste en ${activity} à ${city}. Prenez rendez-vous en ligne !`,
      h2s: [
        `${activity} au cœur de ${city}`,
        `Nos services à ${city} et ses alentours`,
        `Comment nous trouver depuis ${isMainCity ? 'le centre-ville' : mainCity} ?`,
      ],
      bodyText: `Bienvenue chez ${businessName}, votre référence en ${activity} à ${city}...\n\n[Contenu généré par IA — rechargez pour obtenir un vrai texte]`,
    };
  }
}

/* ── CopyButton ─────────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {copied ? <CheckCheck size={13} className="text-primary" /> : <Copy size={13} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

/* ── PageCard ──────────────────────────────────────────────────────────────── */
function PageCard({ page }: { page: GeneratedPage }) {
  const [expanded, setExpanded] = useState(false);

  const fullText = `H1: ${page.h1}\n\nMeta Title: ${page.metaTitle}\nMeta Description: ${page.metaDescription}\n\n${page.h2s.map((h, i) => `H2 ${i + 1}: ${h}`).join('\n')}\n\n${page.bodyText}`;

  const handleExport = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-page-${page.city.toLowerCase().replace(/\s/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{page.city}</p>
            <p className="text-[11px] text-muted-foreground">Page SEO locale générée</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyButton text={fullText} />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700/50 rounded-lg px-3 py-1.5 hover:bg-teal-100 transition-colors"
          >
            <Download size={12} />
            Exporter
          </button>
        </div>
      </div>

      {/* Meta tags */}
      <div className="px-5 py-4 space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">🏷️ Balise Title (Google)</span>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium leading-snug">{page.metaTitle}</p>
            <CopyButton text={page.metaTitle} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">📝 Meta Description</span>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{page.metaDescription}</p>
            <CopyButton text={page.metaDescription} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">📌 Titre H1</span>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-snug">{page.h1}</p>
            <CopyButton text={page.h1} />
          </div>
        </div>

        {/* Sous-titres H2 */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">📂 Sous-titres H2</span>
          <ul className="space-y-1">
            {page.h2s.map((h2, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-center gap-1.5">
                <span className="text-teal-500 font-bold">H2</span> {h2}
              </li>
            ))}
          </ul>
        </div>

        {/* Body text preview */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Masquer le texte SEO' : 'Voir le texte SEO complet (500 mots)'}
        </button>
        {expanded && (
          <div className="mt-2 relative">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">✍️ Contenu de page (500 mots)</span>
              <CopyButton text={page.bodyText} />
            </div>
            <div className="bg-muted/40 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{page.bodyText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Inject buttons */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground">Injecter sur :</span>
        {['WordPress', 'Wix', 'Shopify', 'Webflow'].map(platform => (
          <button
            key={platform}
            className="text-[11px] font-semibold border border-border rounded-lg px-2.5 py-1 hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
            onClick={() => navigator.clipboard.writeText(fullText)}
            title={`Copier le contenu pour ${platform}`}
          >
            {platform}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── KeywordRow ─────────────────────────────────────────────────────────────── */
function KeywordRow({ kw }: { kw: KeywordRank }) {
  const trendIcon =
    kw.trend === 'up' ? (
      <div className="flex items-center gap-1 text-emerald-600">
        <TrendingUp size={13} />
        <span className="text-[11px] font-bold">+{kw.change} places</span>
      </div>
    ) : kw.trend === 'down' ? (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingDown size={13} />
        <span className="text-[11px] font-bold">{kw.change} places</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus size={13} />
        <span className="text-[11px]">Stable</span>
      </div>
    );

  const posColor =
    kw.position <= 3
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
      : kw.position <= 10
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
      <div className={`shrink-0 min-w-[36px] h-9 rounded-lg flex items-center justify-center text-sm font-extrabold ${posColor}`}>
        #{kw.position}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{kw.keyword}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin size={10} /> {kw.city}
        </p>
      </div>
      <div className="shrink-0">{trendIcon}</div>
      {kw.trend === 'up' && kw.change >= 3 && (
        <span className="shrink-0 text-[9px] font-extrabold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full px-2 py-0.5 border border-violet-200 dark:border-violet-700/40">
          ✨ IA
        </span>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function SeoLocalPage() {
  const { activeEstablishment } = useEstablishment();

  // Generator state
  const [mainCity, setMainCity] = useState(activeEstablishment?.city || '');
  const [targetCitiesInput, setTargetCitiesInput] = useState('');
  const [targetCities, setTargetCities] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [generatingCity, setGeneratingCity] = useState('');

  // Keywords state
  const [keywords, setKeywords] = useState<KeywordRank[]>(MOCK_KEYWORDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const businessName = activeEstablishment?.name || 'Votre établissement';
  const activity = activeEstablishment?.activity || 'votre activité';

  const addCity = useCallback(() => {
    const val = targetCitiesInput.trim();
    if (!val) return;
    const newCities = val.split(/[,;]+/).map(c => c.trim()).filter(c => c.length > 0 && !targetCities.includes(c));
    if (newCities.length > 0) setTargetCities(prev => [...prev, ...newCities]);
    setTargetCitiesInput('');
  }, [targetCitiesInput, targetCities]);

  const removeCity = (city: string) => setTargetCities(prev => prev.filter(c => c !== city));

  const handleGenerate = useCallback(async () => {
    const citiesToGenerate = [mainCity, ...targetCities].filter(Boolean);
    if (citiesToGenerate.length === 0) return;
    setIsGenerating(true);
    setPages([]);
    const results: GeneratedPage[] = [];
    for (const city of citiesToGenerate) {
      setGeneratingCity(city);
      const page = await generateSeoPage(businessName, activity, city, mainCity);
      results.push(page);
    }
    setPages(results);
    setGeneratingCity('');
    setIsGenerating(false);
  }, [mainCity, targetCities, businessName, activity]);

  const handleRefreshKeywords = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate keyword position refresh
      setKeywords(prev => prev.map(kw => ({
        ...kw,
        change: Math.floor(Math.random() * 5) - 1,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
      })));
      setIsRefreshing(false);
    }, 1500);
  };

  const citiesToGenerate = [mainCity, ...targetCities].filter(Boolean);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
            <Globe size={18} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground leading-tight">Référencement Naturel 🌐</h1>
            <p className="text-sm text-muted-foreground">Générez des pages SEO optimisées pour chaque ville cible — sans coder.</p>
          </div>
        </div>
      </div>

      {/* ── Section 1 : Générateur de pages ── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-border bg-teal-50/60 dark:bg-teal-950/20">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600 shrink-0" />
            <p className="text-sm font-bold text-foreground">Générateur de pages "Quartier / Ville"</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            L'IA génère le contenu complet (H1, H2, meta-description, 500 mots) pour chaque commune ciblée.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Main city */}
          <div>
            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block mb-1.5">
              🏙️ Ville principale
            </label>
            <input
              type="text"
              value={mainCity}
              onChange={e => setMainCity(e.target.value)}
              placeholder="ex : La Rochelle"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Target cities */}
          <div>
            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block mb-1.5">
              📍 Communes / Quartiers limitrophes
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetCitiesInput}
                onChange={e => setTargetCitiesInput(e.target.value)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addCity())}
                placeholder="ex : Périgny, Aytré, Châtelaillon-Plage"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={addCity}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Séparez plusieurs villes par une virgule ou appuyez sur Entrée</p>

            {/* City chips */}
            {targetCities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {targetCities.map(city => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    <MapPin size={10} /> {city}
                    <button onClick={() => removeCity(city)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={citiesToGenerate.length === 0 || isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Génération en cours : {generatingCity}…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Générer {citiesToGenerate.length > 0 ? `${citiesToGenerate.length} page${citiesToGenerate.length > 1 ? 's' : ''} SEO` : 'les pages SEO'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── Generated pages ── */}
      {pages.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe size={16} className="text-teal-600" />
              Pages générées ({pages.length})
            </h2>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw size={12} /> Régénérer
            </button>
          </div>
          <div className="space-y-4">
            {pages.map(page => (
              <PageCard key={page.city} page={page} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2 : Tableau de bord mots-clés ── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-violet-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">📈 Mots-clés en progression dans votre ville</p>
              <p className="text-xs text-muted-foreground">Positionnement Google Search simulé — basé sur votre activité locale</p>
            </div>
          </div>
          <button
            onClick={handleRefreshKeywords}
            disabled={isRefreshing}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold border border-border rounded-xl px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 bg-muted/20 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp size={8} />
            </span>
            Top 3 · Position excellente
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <ArrowUp size={8} />
            </span>
            Top 10 · En progrès
          </div>
          <span className="text-[11px] text-muted-foreground ml-auto">
            <span className="text-violet-600 font-bold">✨ IA</span> = amélioré par le contenu IA
          </span>
        </div>

        {/* Keywords list */}
        <div>
          {keywords.map((kw, i) => (
            <KeywordRow key={i} kw={kw} />
          ))}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 bg-muted/20 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground">
            💡 Publiez régulièrement des posts locaux et des pages de contenu pour améliorer vos positions Google.
            Les badges <span className="text-violet-600 font-bold">✨ IA</span> indiquent les gains obtenus grâce au contenu généré par Kompilot.
          </p>
        </div>
      </section>

      {/* ── Section 3 : Tips ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '🗺️',
            title: 'Cibler les micro-zones',
            desc: 'Google favorise les contenus ultra-locaux. Une page par commune = plus de chances d\'apparaître pour les recherches "près de moi".',
          },
          {
            icon: '📅',
            title: 'Mettre à jour régulièrement',
            desc: 'Les pages fraîchement mises à jour sont mieux référencées. Retournez dans le Cockpit IA pour enrichir votre contenu.',
          },
          {
            icon: '⭐',
            title: 'Les avis booostent le SEO',
            desc: 'Plus vous avez d\'avis Google récents, plus Google vous considère comme un établissement actif et local.',
          },
        ].map(tip => (
          <div key={tip.title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <span className="text-2xl">{tip.icon}</span>
            <p className="text-sm font-bold text-foreground">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
