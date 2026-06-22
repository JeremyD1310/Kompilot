/**
 * AgencyPRSalesKit — Kit de vente & prospection B2B en marque blanche.
 * Génère des Case Studies clients anonymisés et des posts de prospection
 * haute conversion à partir des données sectorielles de l'index Kompilot.
 * Inspiré des scripts agressifs B2B : chiffres concrets, urgence, preuve sociale.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, MessageSquare, Copy, Check, Zap, TrendingUp,
  ChevronRight, Sparkles, Share2, Download, RefreshCw,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

// ── Sector benchmark data (anonymized) ──────────────────────────────────────

const SECTOR_BENCHMARKS: Record<string, {
  noShowRate: string; caRecupere: string; dmConv: string;
  reviewScore: string; roi: string; sector: string;
}> = {
  restaurant: { sector: 'Restauration', noShowRate: '18%', caRecupere: '1 240 €/mois', dmConv: '34%', reviewScore: '4,6/5', roi: '8,4×' },
  beaute: { sector: 'Beauté & Bien-être', noShowRate: '22%', caRecupere: '890 €/mois', dmConv: '41%', reviewScore: '4,8/5', roi: '9,1×' },
  btp: { sector: 'BTP & Artisanat', noShowRate: '12%', caRecupere: '3 100 €/mois', dmConv: '28%', reviewScore: '4,4/5', roi: '11,3×' },
  sante: { sector: 'Santé & Médical', noShowRate: '31%', caRecupere: '2 800 €/mois', dmConv: '22%', reviewScore: '4,9/5', roi: '7,8×' },
  commerce: { sector: 'Commerce & Retail', noShowRate: '9%', caRecupere: '680 €/mois', dmConv: '38%', reviewScore: '4,5/5', roi: '6,9×' },
};

// ── Case Study Templates ─────────────────────────────────────────────────────

function buildCaseStudy(
  clientType: string,
  benchmark: typeof SECTOR_BENCHMARKS['restaurant'],
): string {
  return `📊 ÉTUDE DE CAS — ${benchmark.sector.toUpperCase()}

❌ AVANT Kompilot
→ Taux de no-show : ${benchmark.noShowRate} des réservations
→ Réponse aux avis Google : manuelle, 3-5 jours de délai
→ Aucune relance automatisée, clients perdus sans suivi

✅ APRÈS Kompilot (90 jours)
→ ${benchmark.caRecupere} récupérés grâce aux empreintes Stripe
→ Taux de conversion DM : ${benchmark.dmConv} (+180% vs avant)
→ Note Google : ${benchmark.reviewScore} (${Math.round(parseFloat(benchmark.reviewScore) * 1.1 * 10) / 10} en cible)
→ ROI abonnement : ${benchmark.roi} sur le premier trimestre

💡 Levier #1 activé : Empreinte bancaire sur réservations + bot d'engagement automatique.

[Données anonymisées — secteur ${benchmark.sector}, France métropolitaine, médiane 2024-2025]`;
}

// ── Prospecting Post Templates ────────────────────────────────────────────────

const PROSPECTION_TEMPLATES = [
  {
    id: 'urgency',
    label: 'Urgence & Chiffres',
    icon: '🔥',
    preview: 'Votre concurrent récupère 1 200€/mois de CA perdu. Et vous ?',
    fullText: (b: typeof SECTOR_BENCHMARKS['restaurant']) =>
      `🔥 CHIFFRE QUI DÉRANGE :

Un ${b.sector.toLowerCase()} sur 5 perd en moyenne ${b.caRecupere} chaque mois à cause des no-shows non sécurisés.

Celui d'en face a mis 10 minutes à l'activer.

Vous pas encore.

Ce n'est pas une question de budget (moins de 3€/jour).
C'est une question de priorité.

→ Je vous montre comment sécuriser vos premières réservations en 24h.

📲 Un message privé et je vous envoie la démo de votre secteur.`,
  },
  {
    id: 'proof',
    label: 'Preuve Sociale',
    icon: '⭐',
    preview: `ROI ${'{roi}'}× en 90 jours. Ce n'est pas de la théorie.`,
    fullText: (b: typeof SECTOR_BENCHMARKS['restaurant']) =>
      `⭐ CE QUE MES CLIENTS DISENT (90 jours après l'activation) :

"Depuis Kompilot, je réponds à mes avis Google en moins de 2 minutes. Ma note est passée de 3,9 à ${b.reviewScore}."

"J'ai récupéré ${b.caRecupere} sur mon premier mois grâce aux empreintes."

"Mon bot Instagram convertit à ${b.dmConv}. Je n'ai rien changé — il travaille pour moi."

ROI moyen dans le secteur ${b.sector} : ${b.roi}×.

Si votre outil de gestion de présence ne vous rapporte pas de l'argent, il vous coûte du temps.

📩 Je vous envoie l'analyse GEO gratuite de votre établissement — répondez avec votre adresse Google Maps.`,
  },
  {
    id: 'maieutic',
    label: 'Maïeutique (Question)',
    icon: '🤔',
    preview: 'Combien vous coûte réellement un no-show ce mois-ci ?',
    fullText: (b: typeof SECTOR_BENCHMARKS['restaurant']) =>
      `🤔 UNE QUESTION HONNÊTE :

Combien vous ont coûté vos no-shows le mois dernier ?

(Prenez 30 secondes. Comptez : créneaux vides × panier moyen.)

Dans le secteur ${b.sector}, la perte mensuelle médiane est de ${b.caRecupere}.

La majorité de mes clients pensaient que "c'est normal".

Ce n'est pas normal. C'est non sécurisé.

Il existe aujourd'hui une solution qui prélève automatiquement une empreinte bancaire à la réservation. Conforme RGPD. Zéro friction client (taux d'abandon < 3%).

→ Ça vous intéresse de savoir combien vous pouvez récupérer ?

📲 Commentez « AUDIT » et je vous envoie le calcul personnalisé pour votre établissement.`,
  },
  {
    id: 'newsletter',
    label: 'Newsletter Pro',
    icon: '📩',
    preview: "3 chiffres que vos clients n'ont pas encore vus ce mois",
    fullText: (b: typeof SECTOR_BENCHMARKS['restaurant']) =>
      `📩 LETTRE AUX DÉCIDEURS DU ${b.sector.toUpperCase()}

Objet : 3 chiffres que vous devez connaître avant fin du mois

---

Bonjour [Prénom],

Je travaille avec une vingtaine d'établissements de votre secteur et voici ce que j'observe :

1. ${b.noShowRate} de taux de no-show moyen. Sécurisé à zéro.
2. ${b.caRecupere} récupérés en moyenne par mois. Non-récupérés sans système d'empreinte.
3. ${b.dmConv} de taux de conversion sur les DMs Instagram/WhatsApp. Non activés pour 73% des établissements.

Si vous me posez la question "peut-on vérifier ces chiffres sur notre établissement", la réponse est oui.

J'ai accès à un outil de benchmark sectoriel anonymisé. 15 minutes suffisent pour savoir où vous en êtes.

→ Répondez à cet email avec l'URL de votre fiche Google et je vous envoie votre analyse gratuite.

Bien cordialement,
[Votre nom] — Kompilot Partner`,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function AgencyPRSalesKit() {
  const [activeTab, setActiveTab] = useState<'case_study' | 'prospection'>('case_study');
  const [selectedSector, setSelectedSector] = useState<keyof typeof SECTOR_BENCHMARKS>('restaurant');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiPost, setAiPost] = useState<string | null>(null);
  const [aiVariant, setAiVariant] = useState(0);

  const benchmark = SECTOR_BENCHMARKS[selectedSector];
  const caseStudyText = buildCaseStudy(selectedSector, benchmark);
  const prospectionText = PROSPECTION_TEMPLATES[selectedTemplate].fullText(benchmark);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copié !', { description: 'Contenu prêt à publier.' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Impossible de copier', { description: 'Copiez manuellement le texte.' });
    }
  };

  const generateAIVariant = async () => {
    if (generating) return;
    setGenerating(true);
    setAiPost(null);

    const template = PROSPECTION_TEMPLATES[selectedTemplate];
    const prompt = `Tu es un expert en vente B2B pour agences digitales. Génère une variante ${aiVariant + 1} d'un post LinkedIn/Instagram de prospection pour ce secteur : ${benchmark.sector}. 

Données sectorielles à intégrer :
- No-show moyen : ${benchmark.noShowRate}
- CA récupéré possible : ${benchmark.caRecupere}/mois
- Taux conversion DM : ${benchmark.dmConv}
- Note Google médiane : ${benchmark.reviewScore}
- ROI abonnement : ${benchmark.roi}

Style du template "${template.label}" : ${template.preview}

Règles IMPÉRATIVES :
- Max 180 mots
- 1 chiffre percutant en début de post
- 1 CTA clair en fin ("Commentez X", "Répondez à cet email", "Envoyez-moi votre adresse")
- Ton professionnel mais direct — PAS de formulations génériques ("Je vous aide à développer")
- Données anonymisées — jamais de nom de client réel
- Format: post prêt à copier-coller LinkedIn

Génère uniquement le post, sans introduction ni commentaire.`;

    try {
      let fullText = '';
      await blink.ai.streamText(
        { prompt, model: 'gpt-4.1-mini', maxTokens: 300 },
        chunk => {
          fullText += chunk;
          setAiPost(fullText);
        }
      );
      setAiVariant(v => v + 1);
    } catch {
      toast.error('Erreur IA', { description: 'Réessayez dans un instant.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div data-tour="agency-pr-kit" className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Kit PR & Vente Agence</h3>
              <p className="text-xs text-muted-foreground">Études de cas + scripts de prospection B2B haute conversion</p>
            </div>
          </div>
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-700 text-[10px] font-bold shrink-0">
            AGENCE ONLY
          </Badge>
        </div>

        {/* Sector picker */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(SECTOR_BENCHMARKS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedSector(key as keyof typeof SECTOR_BENCHMARKS)}
              type="button"
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                selectedSector === key
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600'
              }`}
            >
              {val.sector}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {[
          { id: 'case_study', label: 'Étude de cas', icon: FileText },
          { id: 'prospection', label: 'Scripts prospection', icon: MessageSquare },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'case_study' | 'prospection')}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-4">
        {/* ── Case Study Tab ── */}
        {activeTab === 'case_study' && (
          <div className="space-y-4">
            {/* Benchmark strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'No-show moyen', value: benchmark.noShowRate, color: 'text-red-500' },
                { label: 'CA récupéré', value: benchmark.caRecupere, color: 'text-emerald-600' },
                { label: 'ROI abonnement', value: benchmark.roi + '×', color: 'text-violet-600' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-muted/40 border border-border p-2.5 text-center">
                  <p className={`text-base font-extrabold ${stat.color} leading-tight`}>{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Case study preview */}
            <div className="rounded-xl bg-muted/30 border border-border p-4">
              <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">{caseStudyText}</pre>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(caseStudyText, 'case_study')}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
              >
                {copiedId === 'case_study' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'case_study' ? 'Copié !' : 'Copier l\'étude'}
              </Button>
              <Button
                onClick={() => copyToClipboard(caseStudyText, 'case_study_dl')}
                variant="outline"
                size="sm"
                className="h-9 text-xs px-3 gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
            </div>

            {/* Usage tip */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3.5 py-3 flex items-start gap-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Usage recommandé :</strong> Intégrez cette étude dans votre signature email, vos DMs de prospection LinkedIn et vos newsletters. Les données sont anonymisées et agrégées — conformes RGPD. Remplacez [Données anonymisées] par votre propre note de bas de page.
              </p>
            </div>
          </div>
        )}

        {/* ── Prospection Tab ── */}
        {activeTab === 'prospection' && (
          <div className="space-y-4">
            {/* Template selector */}
            <div className="grid grid-cols-2 gap-2">
              {PROSPECTION_TEMPLATES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTemplate(i); setAiPost(null); }}
                  type="button"
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedTemplate === i
                      ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-400 dark:border-violet-700'
                      : 'bg-muted/30 border-border hover:border-violet-300 hover:bg-muted/50'
                  }`}
                >
                  <p className="text-base leading-none mb-1.5">{t.icon}</p>
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{t.preview}</p>
                </button>
              ))}
            </div>

            {/* Post preview */}
            <div className="rounded-xl bg-muted/30 border border-border p-4">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={selectedTemplate + '-' + selectedSector + (aiPost ? '-ai' : '')}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {aiPost ?? prospectionText}
                </motion.pre>
              </AnimatePresence>
              {generating && (
                <div className="flex items-center gap-2 mt-3">
                  <RefreshCw className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                  <span className="text-xs text-muted-foreground">Génération en cours…</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(aiPost ?? prospectionText, 'prospect')}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
              >
                {copiedId === 'prospect' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'prospect' ? 'Copié !' : 'Copier le script'}
              </Button>
              <Button
                onClick={generateAIVariant}
                disabled={generating}
                size="sm"
                className="h-9 text-xs px-3 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Variante IA
              </Button>
            </div>

            {/* 1-click tip */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-4 py-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Flux de prospection B2B en 3 étapes</p>
              </div>
              <ol className="space-y-1.5">
                {[
                  '① Sélectionnez le secteur de votre prospect ci-dessus',
                  '② Copiez le script "Urgence & Chiffres" ou demandez une Variante IA',
                  '③ Publiez sur LinkedIn / envoyez en DM / intégrez en newsletter',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
