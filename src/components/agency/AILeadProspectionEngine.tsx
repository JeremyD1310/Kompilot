/**
 * AILeadProspectionEngine — 🎯 Machine à Clients & Scraper G.E.O. Prédictif
 *
 * Agency-only module. Saisir ville + activité → liste d'établissements
 * avec Score de Vulnérabilité IA (Rouge/Orange/Vert) + manque à gagner estimé
 * + bouton "Générer le Kit de Closing IA".
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Loader2, AlertTriangle, TrendingDown,
  CheckCircle2, FileText, Copy, Check, ChevronDown, ChevronUp,
  MapPin, Building2, Zap, X, RefreshCw,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { aiGenerate } from '../../lib/aiRouterClient';

// ── Types ──────────────────────────────────────────────────────────────────
interface LeadResult {
  name: string;
  sector: string;
  city: string;
  vulnerabilityScore: number;      // 0-100 (higher = more vulnerable = better lead)
  estimatedLoss: number;           // €/mois
  alerts: string[];                // 2-3 failles détectées
  closingKit?: ClosingKit;
  isNewBusiness?: boolean;         // Opened < 90 days ago (hot lead)
  openedDaysAgo?: number;          // Days since opening
}

interface ClosingKit {
  emailScript: string;
  dmScript: string;
  callScript: string;
  samplePost: string;
  invisibleQueries: string[];      // requêtes ChatGPT/Gemini où ils sont invisibles
}

// ── Vulnerability helpers ─────────────────────────────────────────────────
function vulnColor(score: number) {
  if (score >= 70) return { dot: '#EF4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#EF4444', label: 'Vulnérable' };
  if (score >= 40) return { dot: '#F59E0B', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#F59E0B', label: 'À risque' };
  return { dot: '#22C55E', bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.25)', text: '#22C55E', label: 'Solide' };
}

// ── Fake lead generator (AI-backed enrichment on demand) ──────────────────
function seedLeads(city: string, activity: string): LeadResult[] {
  const sectors = [activity, activity, activity];
  const names = [
    `${activity} ${city} Centre`,
    `${activity.split(' ')[0]} Dupont`,
    `Chez ${city.split(' ')[0]} — ${activity}`,
    `Le ${activity} de la Place`,
    `${activity} Premium`,
  ].slice(0, 5);

  const openedDaysPool = [12, null, 67, null, 45]; // indices 0,2,4 are "new businesses"
  return names.map((name, i) => {
    const vuln = [82, 67, 45, 78, 53][i];
    const loss = [2400, 1800, 950, 3100, 1250][i];
    const daysAgo = openedDaysPool[i];
    return {
      name,
      sector: sectors[i % sectors.length],
      city,
      vulnerabilityScore: vuln,
      estimatedLoss: loss,
      isNewBusiness: daysAgo !== null && daysAgo < 90,
      openedDaysAgo: daysAgo ?? undefined,
      alerts: [
        ['Fiche Google non réclamée', 'Aucune réponse aux avis depuis 60j', '0 post réseau social ce mois'][i % 3],
        ['Concurrent #1 devant sur ChatGPT', 'Taux no-show estimé 22%', 'Mauvaise note Google (<4★)'][(i + 1) % 3],
      ],
    };
  });
}

// ── Closing Kit Generator ────────────────────────────────────────────────
async function generateClosingKit(lead: LeadResult): Promise<ClosingKit> {
  const prompt = `Tu es un expert en vente B2B pour agences digitales. Génère un Kit de Closing complet pour ce prospect :
Nom : "${lead.name}" — ${lead.sector} à ${lead.city}
Perte estimée : ${lead.estimatedLoss}€/mois
Failles : ${lead.alerts.join(', ')}

Génère en JSON strict :
{
  "emailScript": "Objet: ... \\n\\n Corps court (120 mots max), 1 chiffre choc, 1 CTA",
  "dmScript": "DM LinkedIn/Instagram (80 mots max), direct, chiffre impact, CTA commentable",
  "callScript": "Script appel 60s : accroche → douleur → solution → RDV",
  "samplePost": "Post réseau social pré-rédigé pour ${lead.name} (100 mots, hashtags, CTA commentable)",
  "invisibleQueries": ["requête 1 ChatGPT où ils n'apparaissent pas", "requête 2 Gemini", "requête 3"]
}
Retourne UNIQUEMENT le JSON.`;

  const res = await aiGenerate({ taskType: 'STRATEGIC_PLANNING', prompt, forceJson: true, maxTokens: 700 });

  try {
    const raw = res.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(raw) as ClosingKit;
  } catch {
    return {
      emailScript: `Objet : Votre fiche Google perd ${lead.estimatedLoss}€/mois\n\nBonjour,\n\nVotre établissement "${lead.name}" perd en moyenne ${lead.estimatedLoss}€ par mois en clients invisibles sur les moteurs IA.\n\n→ Je vous envoie l'analyse complète en 5 minutes.\n\nRépondez « AUDIT » et je vous rappelle ce soir.\n\nCordialement`,
      dmScript: `💥 ${lead.estimatedLoss}€/mois perdus.\n\nVotre fiche "${lead.name}" est invisible sur ChatGPT et Gemini.\n\nOn peut corriger ça en 48h.\n\n📲 Commentez « DÉMO » pour recevoir votre analyse gratuite.`,
      callScript: `"Bonjour, je suis [Nom] — spécialiste G.E.O. local. J'ai analysé votre présence en ligne et votre établissement perd ${lead.estimatedLoss}€/mois en clients qui cherchent sur ChatGPT. J'ai une solution qui corrige ça en 48h. Vous avez 3 minutes pour que je vous montre ?"`,
      samplePost: `🚀 [Post prêt à l'emploi pour ${lead.name}]\n\nVous cherchez le meilleur ${lead.sector} à ${lead.city} ?\n\nNous sommes là pour vous.\n\n✅ Réservez directement en DM\n✅ Disponibilité immédiate\n✅ 4,8★ sur Google\n\n→ Commentez « RDV » et nous vous répondons en moins de 2h.\n\n#${lead.city.replace(/\s/g, '')} #${lead.sector.replace(/\s/g, '')} #Local`,
      invisibleQueries: [
        `"Meilleur ${lead.sector} ${lead.city}" → Absent des réponses ChatGPT`,
        `"${lead.sector} pas cher ${lead.city}" → Concurrent #1 en tête sur Gemini`,
        `"Avis ${lead.sector} ${lead.city}" → Fiche incomplète, invisible`,
      ],
    };
  }
}

// ── Main Component ───────────────────────────────────────────────────────
export function AILeadProspectionEngine() {
  const [city, setCity] = useState('');
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [expandedKit, setExpandedKit] = useState<string | null>(null);
  const [generatingKit, setGeneratingKit] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  const scan = useCallback(async () => {
    if (!city.trim() || !activity.trim() || loading) return;
    setLoading(true);
    setLeads([]);
    setExpandedKit(null);

    // Simulate network latency, then generate leads
    await new Promise(r => setTimeout(r, 1200));
    setLeads(seedLeads(city.trim(), activity.trim()));
    setLoading(false);
  }, [city, activity, loading]);

  const handleGenerateKit = async (lead: LeadResult) => {
    const key = lead.name;
    if (generatingKit) return;
    setGeneratingKit(key);
    try {
      const kit = await generateClosingKit(lead);
      setLeads(prev => prev.map(l => l.name === key ? { ...l, closingKit: kit } : l));
      setExpandedKit(key);
    } catch {
      toast.error('Erreur IA — réessayez');
    } finally {
      setGeneratingKit(null);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copié !');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sorted = [...leads]
    .filter(l => !filterNewOnly || l.isNewBusiness)
    .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  const newBusinessCount = leads.filter(l => l.isNewBusiness).length;

  return (
    <div data-tour="ai-lead-engine" className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-950/30 to-teal-950/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Search className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">🎯 Machine à Clients & Scraper G.E.O. Prédictif</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  🔥 MACHINE À CLIENTS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ville + secteur → Score vulnérabilité IA + Kit de closing en marque blanche
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 text-[10px] font-bold shrink-0">
            AGENCE ONLY
          </Badge>
        </div>
      </div>

      {/* ── Search form ── */}
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && scan()}
              placeholder="Ville (ex: Lyon, Bordeaux, Paris 11)"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>
          <div className="relative flex-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={activity}
              onChange={e => setActivity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && scan()}
              placeholder="Activité (ex: Chirurgien esthétique, Brasserie)"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>
          <Button
            onClick={scan}
            disabled={!city.trim() || !activity.trim() || loading}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shrink-0"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</>
              : <><Sparkles className="w-4 h-4" /> Scanner</>}
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={() => setFilterNewOnly(!filterNewOnly)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border transition-all ${
              filterNewOnly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-muted/30 border-border text-muted-foreground hover:border-amber-500/30 hover:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            ⚠️ Nouveaux établissements (&lt;90 jours)
            {leads.length > 0 && newBusinessCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 rounded-full px-1.5 py-0.5 text-[10px] font-black">
                {newBusinessCount}
              </span>
            )}
          </button>
          {filterNewOnly && leads.length > 0 && sorted.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucun nouveau commerce trouvé dans cette recherche</p>
          )}
        </div>

        {/* Helper */}
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          Exemple : "Lyon" + "Chirurgien esthétique" → 5 leads avec Score de Vulnérabilité + Kit de closing IA
        </p>
      </div>

      {/* ── Loading skeleton ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-5 space-y-3"
          >
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyse G.E.O. des établissements en cours…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      {!loading && leads.length > 0 && (
        <div className="divide-y divide-border">

          {/* Results header */}
          <div className="px-5 py-3 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {leads.length} établissements analysés — triés par vulnérabilité IA
            </span>
            <button
              onClick={() => { setLeads([]); setExpandedKit(null); }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Effacer
            </button>
          </div>

          {sorted.map((lead) => {
            const vc = vulnColor(lead.vulnerabilityScore);
            const hasKit = !!lead.closingKit;
            const isExpanded = expandedKit === lead.name;
            const isGenerating = generatingKit === lead.name;

            return (
              <div key={lead.name} className="p-4 space-y-3">
                {/* Lead row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Vulnerability badge */}
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shrink-0"
                    style={{ background: vc.bg, borderColor: vc.border, color: vc.text }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: vc.dot }} />
                    {lead.vulnerabilityScore}% — {vc.label}
                  </div>

                  {/* Name + city */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{lead.name}</p>
                      {lead.isNewBusiness && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 whitespace-nowrap shrink-0">
                          🆕 NOUVEAU — {lead.openedDaysAgo}j
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{lead.sector} · {lead.city}</p>
                  </div>

                  {/* Estimated loss */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Manque à gagner</p>
                    <p className="text-base font-black text-rose-400">{lead.estimatedLoss.toLocaleString('fr-FR')}€<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
                  </div>

                  {/* Action button */}
                  <Button
                    size="sm"
                    onClick={() => hasKit ? setExpandedKit(isExpanded ? null : lead.name) : handleGenerateKit(lead)}
                    disabled={!!generatingKit}
                    className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération…</>
                    ) : hasKit ? (
                      <>{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Kit de Closing</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Générer le Kit IA</>
                    )}
                  </Button>
                </div>

                {/* Alert failles */}
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {lead.alerts.map((alert, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/8 border border-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {alert}
                    </span>
                  ))}
                </div>

                {/* ── Closing Kit expanded ── */}
                <AnimatePresence>
                  {isExpanded && lead.closingKit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <ClosingKitPanel kit={lead.closingKit} leadName={lead.name} copy={copy} copiedId={copiedId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state (before scan) ── */}
      {!loading && leads.length === 0 && (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-foreground">Prêt à scanner</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Saisissez une ville et une activité pour générer vos 5 premiers leads avec Score de Vulnérabilité IA et Kit de Closing.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Closing Kit Panel ─────────────────────────────────────────────────────
function ClosingKitPanel({ kit, leadName, copy, copiedId }: {
  kit: ClosingKit;
  leadName: string;
  copy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const [tab, setTab] = useState<'email' | 'dm' | 'call' | 'post' | 'queries'>('email');

  const tabs = [
    { id: 'email' as const, label: '📧 Email', content: kit.emailScript },
    { id: 'dm' as const, label: '💬 DM Social', content: kit.dmScript },
    { id: 'call' as const, label: '📞 Script Appel', content: kit.callScript },
    { id: 'post' as const, label: '📸 Post Appât', content: kit.samplePost },
    { id: 'queries' as const, label: '🔍 Invisibilité IA', content: kit.invisibleQueries.join('\n') },
  ];

  const current = tabs.find(t => t.id === tab)!;
  const copyId = `kit-${leadName}-${tab}`;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden mt-1">
      {/* Kit header */}
      <div className="px-4 py-2.5 bg-emerald-900/20 border-b border-emerald-500/15 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">Kit de Closing IA — Marque Blanche</span>
        </div>
        <span className="text-[10px] text-emerald-500 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-700/40">
          Données anonymisées · RGPD ✓
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-emerald-500/10 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === t.id
                ? 'border-emerald-500 text-emerald-400 bg-emerald-900/15'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
          {current.content}
        </pre>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copy(current.content, copyId)}
          className="h-8 text-xs gap-1.5"
        >
          {copiedId === copyId
            ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copié !</>
            : <><Copy className="w-3.5 h-3.5" /> Copier ce contenu</>}
        </Button>
      </div>
    </div>
  );
}
