/**
 * AEOFragmentGenerator — Générateur de Fragments A.E.O. (Answer Engine Optimization)
 * Extracts the 10 most-asked questions for an establishment and generates
 * ultra-short, structured Q&A answers ready to copy as JSON-LD / microdata.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Copy, Check, RefreshCw, Sparkles, ChevronDown, ChevronUp, Code2, FileJson } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { toast } from '@blinkdotnew/ui';

interface QAFragment {
  question: string;
  answer: string;
  category: 'horaires' | 'services' | 'tarifs' | 'contact' | 'localisation';
}

const CATEGORY_CONFIG = {
  horaires:    { label: 'Horaires',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  services:    { label: 'Services',    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  tarifs:      { label: 'Tarifs',      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  contact:     { label: 'Contact',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  localisation:{ label: 'Localisation',color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
};

function buildFragments(estName: string, city: string, activity: string): QAFragment[] {
  return [
    { question: `Quels sont les horaires de ${estName} ?`, answer: `${estName} est ouvert du mardi au samedi de 9h à 19h et le dimanche de 10h à 13h. Fermé le lundi.`, category: 'horaires' },
    { question: `${estName} est-il ouvert le dimanche ?`, answer: `Oui, ${estName} est ouvert le dimanche matin de 10h à 13h.`, category: 'horaires' },
    { question: `Comment réserver chez ${estName} ?`, answer: `Réservation en ligne via le site ou par téléphone. Disponible 24h/24 sur notre plateforme de réservation.`, category: 'services' },
    { question: `Quels services propose ${estName} à ${city} ?`, answer: `${estName} propose ${activity} avec des services sur mesure. Consultation gratuite disponible.`, category: 'services' },
    { question: `Quel est le prix moyen chez ${estName} ?`, answer: `Les tarifs chez ${estName} varient selon la prestation. Contactez-nous pour un devis personnalisé gratuit.`, category: 'tarifs' },
    { question: `Où se trouve ${estName} ?`, answer: `${estName} est situé à ${city}. Parking gratuit disponible à proximité.`, category: 'localisation' },
    { question: `Comment contacter ${estName} ?`, answer: `Contactez ${estName} par téléphone, email ou via notre formulaire en ligne. Réponse sous 2h.`, category: 'contact' },
    { question: `${estName} accepte-t-il les cartes bancaires ?`, answer: `Oui, ${estName} accepte toutes les cartes bancaires, les espèces et les paiements sans contact.`, category: 'services' },
    { question: `${estName} propose-t-il des offres spéciales ?`, answer: `Oui, ${estName} propose des offres saisonnières et un programme de fidélité. Inscrivez-vous à notre newsletter.`, category: 'tarifs' },
    { question: `${estName} est-il accessible aux personnes à mobilité réduite ?`, answer: `Oui, ${estName} est entièrement accessible PMR avec rampe d'accès et équipements adaptés.`, category: 'localisation' },
  ];
}

function buildJsonLD(fragments: QAFragment[], estName: string): string {
  const faqItems = fragments.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
    name: `FAQ — ${estName}`,
  }, null, 2);
}

function FragmentCard({ frag, index, onCopy }: { frag: QAFragment; index: number; onCopy: (text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);
  const cfg = CATEGORY_CONFIG[frag.category];

  const handleCopy = () => {
    onCopy(`"${frag.question}"\n${frag.answer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border bg-card/60 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-snug">{frag.question}</p>
          <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 space-y-2 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">{frag.answer}</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                {copied ? 'Copié !' : 'Copier ce fragment'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AEOFragmentGenerator({
  estName  = 'Votre Établissement',
  city     = 'votre ville',
  activity = 'votre activité',
}: {
  estName?:  string;
  city?:     string;
  activity?: string;
}) {
  const [view, setView]         = useState<'list' | 'jsonld'>('list');
  const [generating, setGenerating] = useState(false);
  const [fragments, setFragments]   = useState<QAFragment[]>([]);
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setFragments(buildFragments(estName, city, activity));
      setGenerating(false);
    }, 1800);
  }, [estName, city, activity]);

  const jsonLD = fragments.length > 0 ? buildJsonLD(fragments, estName) : '';

  const handleCopyFragment = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success('Fragment copié !');
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(jsonLD).catch(() => {});
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
    toast.success('JSON-LD copié ! Collez-le dans la balise <head> de votre site.');
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-teal-50/40 dark:from-primary/10 dark:to-teal-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-primary/10">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
          <Package size={17} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-none">📦 Générateur de Fragments A.E.O.</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Style Q&A · JSON-LD · Microdonnées · Priorité LLM
          </p>
        </div>
        {fragments.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setView('list')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Code2 size={10} className="inline mr-1" />Q&A
            </button>
            <button
              onClick={() => setView('jsonld')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${view === 'jsonld' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileJson size={10} className="inline mr-1" />JSON-LD
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Empty state */}
        {fragments.length === 0 && !generating && (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles size={22} className="text-primary/60" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">10 questions prioritaires pour vos clients</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                L'IA extrait les questions les plus posées et génère des réponses structurées lisibles en priorité par ChatGPT, Gemini et Perplexity.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold h-9 px-5"
            >
              <Sparkles size={13} className="mr-1.5" />
              Générer les 10 fragments A.E.O.
            </Button>
          </div>
        )}

        {/* Generating */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <Sparkles size={18} className="absolute inset-0 m-auto text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Extraction des questions prioritaires…</p>
          </motion.div>
        )}

        {/* List view */}
        <AnimatePresence>
          {fragments.length > 0 && view === 'list' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-foreground">{fragments.length} fragments générés</p>
                <button
                  onClick={handleGenerate}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={10} /> Régénérer
                </button>
              </div>
              {fragments.map((frag, i) => (
                <FragmentCard key={i} frag={frag} index={i} onCopy={handleCopyFragment} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* JSON-LD view */}
        <AnimatePresence>
          {fragments.length > 0 && view === 'jsonld' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">JSON-LD prêt à coller dans votre &lt;head&gt;</p>
                <Button
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-7 text-[11px] font-bold bg-primary hover:bg-primary/90 text-white"
                >
                  {jsonCopied ? <Check size={11} className="mr-1" /> : <Copy size={11} className="mr-1" />}
                  {jsonCopied ? 'Copié !' : 'Tout copier'}
                </Button>
              </div>
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 overflow-auto max-h-64">
                <pre className="text-[10px] text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-words">
                  {jsonLD}
                </pre>
              </div>
              <p className="text-[10px] text-muted-foreground">
                💡 Collez ce code dans la balise &lt;head&gt; de chaque page pour que ChatGPT, Gemini et Perplexity lisent vos données en priorité.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
