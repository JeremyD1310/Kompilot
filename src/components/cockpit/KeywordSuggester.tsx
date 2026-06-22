import { useState, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronUp, MapPin, Target, Search, Loader2 } from 'lucide-react';
import { blink } from '../../blink/client';
import { AIErrorFallback } from '../shared/AIErrorFallback';

// ── Static keyword banks per category ────────────────────────────────────────

const KEYWORD_BANKS: Record<string, { primary: string[]; intent: string[]; local: string[] }> = {
  Restaurant: {
    primary: ['restaurant', 'brasserie', 'bistrot', 'menu du jour', 'cuisine maison', 'gastronomie locale', 'table d\'hôte', 'brunch'],
    intent: ['restaurant ouvert dimanche', 'restaurant en famille', 'restaurant livraison', 'meilleur restaurant', 'restaurant vue mer', 'restaurant romantique', 'restaurant bio'],
    local: ['restaurant centre-ville', 'restaurant quartier', 'restaurant proche gare', 'restaurant terrasse'],
  },
  Coiffeur: {
    primary: ['coiffeur', 'salon de coiffure', 'coupe femme', 'coupe homme', 'lissage brésilien', 'balayage', 'coloriste', 'mèches'],
    intent: ['coiffeur ouvert samedi', 'coiffeur pas cher', 'coiffeur coloration', 'coiffeur mariage', 'coiffeur afro'],
    local: ['coiffeur centre-ville', 'coiffeur quartier', 'coiffeur proche moi'],
  },
  Boulangerie: {
    primary: ['boulangerie', 'pâtisserie', 'pain artisanal', 'viennoiserie', 'baguette tradition', 'croissant', 'gâteau sur commande'],
    intent: ['boulangerie ouverte dimanche', 'meilleure boulangerie', 'boulangerie bio', 'pain sans gluten'],
    local: ['boulangerie artisanale', 'boulangerie quartier', 'boulangerie du coin'],
  },
  Spa: {
    primary: ['spa', 'massage', 'bien-être', 'soin du corps', 'relaxation', 'soins visage', 'hammam', 'jacuzzi'],
    intent: ['spa ouvert week-end', 'spa cadeau', 'massage détente', 'spa duo', 'spa prénatal'],
    local: ['spa centre-ville', 'institut de beauté', 'spa proche hôtel'],
  },
  Pharmacie: {
    primary: ['pharmacie', 'parapharmacie', 'médicament', 'ordonnance', 'vaccin', 'test covid', 'conseil santé'],
    intent: ['pharmacie ouverte nuit', 'pharmacie garde', 'pharmacie dimanche', 'pharmacie en ligne'],
    local: ['pharmacie quartier', 'pharmacie proche clinique'],
  },
  Médecin: {
    primary: ['médecin généraliste', 'consultation médicale', 'cabinet médical', 'médecin de famille', 'urgences médicales'],
    intent: ['médecin disponible', 'médecin conventionné', 'prise en charge mutuelle', 'téléconsultation'],
    local: ['médecin quartier', 'médecin proche', 'cabinet médical centre'],
  },
  Opticien: {
    primary: ['opticien', 'lunettes', 'verres progressifs', 'lentilles de contact', 'bilan visuel', 'montures tendance'],
    intent: ['opticien mutuelle', 'opticien enfant', 'opticien solaire', 'opticien remboursement'],
    local: ['opticien centre-ville', 'opticien quartier'],
  },
  Dentiste: {
    primary: ['dentiste', 'cabinet dentaire', 'blanchiment dentaire', 'implant dentaire', 'orthodontie', 'soins dentaires'],
    intent: ['dentiste urgence', 'dentiste conventionné', 'dentiste enfant', 'dentiste implant'],
    local: ['dentiste quartier', 'cabinet dentaire centre'],
  },
  Sport: {
    primary: ['salle de sport', 'fitness', 'musculation', 'cours collectifs', 'coach sportif', 'yoga', 'pilates', 'crossfit'],
    intent: ['salle sport ouverte 24h', 'salle sport femme', 'abonnement salle sport', 'sport débutant'],
    local: ['salle sport quartier', 'fitness centre-ville', 'sport près de chez moi'],
  },
  Plombier: {
    primary: ['plombier', 'plomberie', 'débouchage', 'fuite d\'eau', 'chauffe-eau', 'installation sanitaire', 'rénovation salle de bain'],
    intent: ['plombier urgence', 'plombier disponible', 'devis plombier', 'plombier week-end'],
    local: ['plombier quartier', 'plombier intervention rapide'],
  },
  Electricien: {
    primary: ['électricien', 'installation électrique', 'tableau électrique', 'dépannage électrique', 'mise aux normes'],
    intent: ['électricien urgence', 'électricien certifié', 'devis électricien', 'électricien RGE'],
    local: ['électricien quartier', 'électricien proche', 'dépannage rapide'],
  },
  default: {
    primary: ['commerce local', 'artisan', 'professionnel', 'service de qualité', 'expertise locale'],
    intent: ['ouvert week-end', 'devis gratuit', 'intervention rapide', 'sur rendez-vous'],
    local: ['centre-ville', 'quartier', 'proche de vous', 'livraison à domicile'],
  },
};

function getCategoryBank(category: string) {
  const key = Object.keys(KEYWORD_BANKS).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  ) || 'default';
  return KEYWORD_BANKS[key];
}

// ── Zone suggestions ──────────────────────────────────────────────────────────

function getZoneSuggestions(city: string): string[] {
  if (!city || city === 'votre ville') return ['Centre-Ville', 'Quartier historique', 'Zone commerciale', 'Périphérie'];
  return [
    city,
    `${city} Centre-Ville`,
    `${city} quartier historique`,
    `${city} et alentours`,
    `Région de ${city}`,
  ];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface KeywordSuggesterProps {
  category: string;
  city: string;
  onSelectKeyword: (kw: string) => void;
  onSelectZone: (zone: string) => void;
}

// ── Chip component ────────────────────────────────────────────────────────────

function Chip({ label, onClick, color = 'violet' }: { label: string; onClick: () => void; color?: 'violet' | 'orange' | 'blue' }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-400',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-400',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-400',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer shrink-0 ${colors[color]}`}
    >
      + {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function KeywordSuggester({ category, city, onSelectKeyword, onSelectZone }: KeywordSuggesterProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(false);

  const bank = getCategoryBank(category);
  const zoneSuggestions = getZoneSuggestions(city);

  const handleGenerateAI = useCallback(async () => {
    setIsGenerating(true);
    setAiError(false);
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Tu es un expert SEO local pour les commerces français.
Génère exactement 8 mots-clés SEO longue traîne pour un(e) "${category}" situé(e) à "${city || 'France'}".
Critères : intention locale forte, recherches réelles sur Google, variété (prestations, localisation, bénéfices).
Format de réponse : liste de 8 mots-clés séparés par des virgules, RIEN D'AUTRE.
Exemple de format : mot-clé 1, mot-clé 2, mot-clé 3`,
        maxTokens: 120,
        temperature: 0.8,
      });
      const keywords = text
        .split(',')
        .map(k => k.trim().replace(/^[-•\d.\s]+/, '').trim())
        .filter(k => k.length > 2 && k.length < 60)
        .slice(0, 8);
      setAiKeywords(keywords);
      if (!expanded) setExpanded(true);
    } catch {
      setAiError(true);
    } finally {
      setIsGenerating(false);
    }
  }, [category, city, expanded]);

  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Search size={13} className="text-violet-600 shrink-0" />
          <p className="text-[11px] font-bold text-violet-800">Suggestions de mots-clés</p>
          <span className="text-[10px] text-violet-500 font-medium">— cliquez pour insérer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-2.5 py-1 text-[10px] font-bold transition-colors shrink-0"
          >
            {isGenerating
              ? <><Loader2 size={10} className="animate-spin" /> Génération...</>
              : <><Sparkles size={10} /> IA personnalisée</>
            }
          </button>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-violet-500 hover:text-violet-700 transition-colors"
            aria-label={expanded ? 'Réduire' : 'Développer'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {(expanded || aiKeywords.length > 0) && (
        <div className="px-3 pb-3 space-y-3 border-t border-violet-200/60 pt-3">

          {/* AI Error */}
          {aiError && !isGenerating && (
            <AIErrorFallback
              inline
              onRetry={() => { setAiError(false); handleGenerateAI(); }}
            />
          )}

          {/* AI-generated keywords */}
          {aiKeywords.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-violet-600 shrink-0" />
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Mots-clés IA personnalisés</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aiKeywords.map(kw => (
                  <Chip key={kw} label={kw} onClick={() => onSelectKeyword(kw)} color="violet" />
                ))}
              </div>
            </div>
          )}

          {/* Primary keywords */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Target size={10} className="text-violet-600 shrink-0" />
              <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                Mots-clés principaux · {category}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bank.primary.map(kw => (
                <Chip key={kw} label={kw} onClick={() => onSelectKeyword(kw)} color="violet" />
              ))}
            </div>
          </div>

          {/* Intent keywords */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Search size={10} className="text-orange-600 shrink-0" />
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Intentions de recherche</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bank.intent.map(kw => (
                <Chip key={kw} label={kw} onClick={() => onSelectKeyword(kw)} color="orange" />
              ))}
            </div>
          </div>

          {/* Zone suggestions */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin size={10} className="text-blue-600 shrink-0" />
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Zones géographiques</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {zoneSuggestions.map(zone => (
                <Chip key={zone} label={zone} onClick={() => onSelectZone(zone)} color="blue" />
              ))}
              {bank.local.map(kw => (
                <Chip
                  key={kw}
                  label={city && city !== 'votre ville' ? `${kw} ${city}` : kw}
                  onClick={() => onSelectKeyword(city && city !== 'votre ville' ? `${kw} ${city}` : kw)}
                  color="blue"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed preview (first 3 chips) */}
      {!expanded && aiKeywords.length === 0 && (
        <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
          {bank.primary.slice(0, 4).map(kw => (
            <Chip key={kw} label={kw} onClick={() => onSelectKeyword(kw)} color="violet" />
          ))}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-violet-300 text-violet-500 px-2.5 py-1 text-[11px] font-medium hover:border-violet-500 hover:text-violet-700 transition-all cursor-pointer"
          >
            +{bank.primary.length - 4 + bank.intent.length} autres
          </button>
        </div>
      )}
    </div>
  );
}
