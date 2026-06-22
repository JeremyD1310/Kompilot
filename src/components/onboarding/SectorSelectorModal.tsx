/**
 * SectorSelectorModal — MODULE 1
 * Interactive sector selector shown at first login / onboarding start.
 * Covers all professional sectors: beauty, wellness, restaurant, hotel,
 * insurance, retail, BTP, B2B services, and more.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Sector =
  | 'restauration' | 'hotellerie' | 'beaute' | 'bienetre' | 'medical' | 'sport'
  | 'retail' | 'commerce' | 'alimentation' | 'ecommerce'
  | 'assurance' | 'immobilier' | 'conseil' | 'tech' | 'juridique'
  | 'batiment' | 'artisan' | 'conciergerie' | 'automobile'
  | 'education' | 'evenementiel' | 'autre';

interface SectorDef {
  id: Sector;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  partners: { name: string; color: string }[];
  tagline: string;
}

const SECTORS: SectorDef[] = [
  // ── Flux / Rendez-vous ────────────────────────────────────────────────────
  {
    id: 'restauration',
    label: 'Restauration',
    emoji: '🍽️',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    partners: [{ name: 'TheFork', color: 'bg-amber-100 text-amber-700' }, { name: 'ZenChef', color: 'bg-orange-100 text-orange-700' }],
    tagline: 'Restaurant, brasserie, food truck, café',
  },
  {
    id: 'hotellerie',
    label: 'Hôtellerie',
    emoji: '🏨',
    color: 'text-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    partners: [{ name: 'Booking.com', color: 'bg-sky-100 text-sky-700' }, { name: 'Airbnb', color: 'bg-rose-100 text-rose-700' }],
    tagline: 'Hôtel, gîte, chambre d\'hôtes, résidence',
  },
  {
    id: 'beaute',
    label: 'Beauté',
    emoji: '💇',
    color: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    partners: [{ name: 'Planity', color: 'bg-pink-100 text-pink-700' }, { name: 'Treatwell', color: 'bg-rose-100 text-rose-700' }],
    tagline: 'Salon de coiffure, barbier, onglerie',
  },
  {
    id: 'bienetre',
    label: 'Bien-être & Spa',
    emoji: '🧘',
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    partners: [{ name: 'Treatwell', color: 'bg-teal-100 text-teal-700' }, { name: 'Google Maps', color: 'bg-emerald-100 text-emerald-700' }],
    tagline: 'Spa, massage, yoga, institut de beauté',
  },
  {
    id: 'medical',
    label: 'Médical / Santé',
    emoji: '🩺',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    partners: [{ name: 'Doctolib', color: 'bg-blue-100 text-blue-700' }, { name: 'Maiia', color: 'bg-cyan-100 text-cyan-700' }],
    tagline: 'Médecin, kiné, ostéo, pharmacie',
  },
  {
    id: 'sport',
    label: 'Sport & Fitness',
    emoji: '🏋️',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    partners: [{ name: 'MyCoach', color: 'bg-violet-100 text-violet-700' }, { name: 'Google Maps', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Salle de sport, coach, studio fitness',
  },
  // ── Commerce / Retail ─────────────────────────────────────────────────────
  {
    id: 'retail',
    label: 'Retail / Boutique',
    emoji: '🛍️',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    partners: [{ name: 'Google Shopping', color: 'bg-purple-100 text-purple-700' }, { name: 'Instagram', color: 'bg-pink-100 text-pink-700' }],
    tagline: 'Mode, chaussures, accessoires, maison',
  },
  {
    id: 'commerce',
    label: 'Commerce de proximité',
    emoji: '🏪',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    partners: [{ name: 'Google Maps', color: 'bg-emerald-100 text-emerald-700' }, { name: 'Facebook', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'Épicerie, tabac-presse, librairie, fleuriste',
  },
  {
    id: 'alimentation',
    label: 'Alimentation',
    emoji: '🛒',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/20',
    partners: [{ name: 'Google Maps', color: 'bg-green-100 text-green-700' }, { name: 'Instagram', color: 'bg-pink-100 text-pink-700' }],
    tagline: 'Boucherie, boulangerie, fromagerie, épicerie fine',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce local',
    emoji: '📦',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    partners: [{ name: 'Shopify', color: 'bg-indigo-100 text-indigo-700' }, { name: 'Google Ads', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Vente en ligne avec retrait en boutique',
  },
  // ── B2B / Services ────────────────────────────────────────────────────────
  {
    id: 'assurance',
    label: 'Assurance / Finance',
    emoji: '🛡️',
    color: 'text-slate-700',
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    partners: [{ name: 'LinkedIn', color: 'bg-slate-100 text-slate-700' }, { name: 'Google Ads', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Courtier assurance, conseiller financier, banque',
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    emoji: '🏠',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    partners: [{ name: 'SeLoger', color: 'bg-orange-100 text-orange-700' }, { name: 'Google Maps', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Agence immobilière, mandataire, promoteur',
  },
  {
    id: 'conseil',
    label: 'Conseil & Coaching',
    emoji: '💼',
    color: 'text-neutral-700',
    bg: 'bg-neutral-50 dark:bg-neutral-900/30',
    partners: [{ name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' }, { name: 'Calendly', color: 'bg-neutral-100 text-neutral-700' }],
    tagline: 'Consultant, coach, formateur, RH',
  },
  {
    id: 'tech',
    label: 'Tech & SaaS',
    emoji: '💻',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    partners: [{ name: 'Product Hunt', color: 'bg-orange-100 text-orange-700' }, { name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'Startup, éditeur logiciel, freelance IT',
  },
  {
    id: 'juridique',
    label: 'Juridique / Notariat',
    emoji: '⚖️',
    color: 'text-stone-700',
    bg: 'bg-stone-50 dark:bg-stone-900/30',
    partners: [{ name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' }, { name: 'Google Maps', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Avocat, notaire, expert-comptable',
  },
  // ── Artisanat / Chantier ──────────────────────────────────────────────────
  {
    id: 'batiment',
    label: 'Bâtiment / BTP',
    emoji: '🏗️',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    partners: [{ name: 'Google Maps', color: 'bg-yellow-100 text-yellow-700' }, { name: 'Houzz', color: 'bg-lime-100 text-lime-700' }],
    tagline: 'Maçon, électricien, plombier, couvreur',
  },
  {
    id: 'artisan',
    label: 'Artisan',
    emoji: '🔨',
    color: 'text-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    partners: [{ name: 'Google Maps', color: 'bg-amber-100 text-amber-700' }, { name: 'Facebook', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'Menuisier, ébéniste, peintre, carreleur',
  },
  {
    id: 'conciergerie',
    label: 'Conciergerie / Airbnb',
    emoji: '🏡',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    partners: [{ name: 'Airbnb', color: 'bg-rose-100 text-rose-700' }, { name: 'Booking.com', color: 'bg-sky-100 text-sky-700' }],
    tagline: 'Gestion locative, conciergerie courte durée',
  },
  {
    id: 'automobile',
    label: 'Automobile / Garage',
    emoji: '🚗',
    color: 'text-zinc-600',
    bg: 'bg-zinc-50 dark:bg-zinc-900/30',
    partners: [{ name: 'Google Maps', color: 'bg-sky-100 text-sky-700' }, { name: 'Facebook', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'Garage, carrosserie, concessionnaire, auto-école',
  },
  // ── Autres ───────────────────────────────────────────────────────────────
  {
    id: 'education',
    label: 'Éducation / Formation',
    emoji: '📚',
    color: 'text-lime-700',
    bg: 'bg-lime-50 dark:bg-lime-950/20',
    partners: [{ name: 'Google Maps', color: 'bg-lime-100 text-lime-700' }, { name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'École, centre de formation, cours particuliers',
  },
  {
    id: 'evenementiel',
    label: 'Événementiel',
    emoji: '🎉',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
    partners: [{ name: 'Instagram', color: 'bg-pink-100 text-pink-700' }, { name: 'Facebook', color: 'bg-blue-100 text-blue-700' }],
    tagline: 'Traiteur, organisateur, DJ, photographe',
  },
  {
    id: 'autre',
    label: 'Autre secteur',
    emoji: '⚙️',
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    partners: [{ name: 'Google Maps', color: 'bg-gray-100 text-gray-700' }, { name: 'Instagram', color: 'bg-pink-100 text-pink-700' }],
    tagline: 'Mon secteur n\'est pas dans la liste',
  },
];

// ── SectorSelectorModal ────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onSelect: (sector: Sector) => void;
  onDismiss?: () => void;
}

const CATEGORY_GROUPS: { label: string; ids: Sector[] }[] = [
  { label: '🍽️ Flux & Rendez-vous', ids: ['restauration', 'hotellerie', 'beaute', 'bienetre', 'medical', 'sport'] },
  { label: '🛍️ Commerce & Retail',  ids: ['retail', 'commerce', 'alimentation', 'ecommerce'] },
  { label: '💼 Services B2B',        ids: ['assurance', 'immobilier', 'conseil', 'tech', 'juridique'] },
  { label: '🔨 Artisanat & Chantier',ids: ['batiment', 'artisan', 'conciergerie', 'automobile'] },
  { label: '📚 Autres',              ids: ['education', 'evenementiel', 'autre'] },
];

export function SectorSelectorModal({ open, onSelect, onDismiss }: Props) {
  const [selected, setSelected] = useState<Sector | null>(null);
  const [search, setSearch]     = useState('');

  if (!open) return null;

  const q = search.toLowerCase().trim();
  const filtered = q
    ? SECTORS.filter(s =>
        s.label.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q)
      )
    : null; // null = show grouped view

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-gradient-to-br from-primary/8 to-transparent shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Votre secteur d'activité</h2>
              <p className="text-sm text-muted-foreground">
                {SECTORS.length} secteurs disponibles — Kompilot s'adapte à votre métier
              </p>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un secteur (ex: coiffure, hôtel, assurance…)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Sector list */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {filtered ? (
            /* Search results — flat grid */
            filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filtered.map(sector => (
                  <SectorTile key={sector.id} sector={sector} selected={selected === sector.id} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun secteur trouvé pour « {search} » — sélectionnez <strong>Autre secteur</strong> ci-dessous.
              </p>
            )
          ) : (
            /* Grouped view */
            CATEGORY_GROUPS.map(group => {
              const groupSectors = group.ids.map(id => SECTORS.find(s => s.id === id)!).filter(Boolean);
              return (
                <div key={group.label}>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-0.5">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {groupSectors.map(sector => (
                      <SectorTile key={sector.id} sector={sector} selected={selected === sector.id} onSelect={setSelected} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 shrink-0 bg-card">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer cette étape
            </button>
          )}
          {selected && (
            <p className="text-xs text-muted-foreground flex-1 truncate">
              Sélectionné : <strong className="text-foreground">{SECTORS.find(s => s.id === selected)?.label}</strong>
            </p>
          )}
          <Button
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="ml-auto gap-2 px-6 shrink-0"
          >
            Confirmer mon secteur <ArrowRight size={16} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sector tile ───────────────────────────────────────────────────────────────

function SectorTile({
  sector, selected, onSelect,
}: {
  sector: SectorDef; selected: boolean; onSelect: (id: Sector) => void;
}) {
  return (
    <motion.button
      onClick={() => onSelect(sector.id)}
      whileTap={{ scale: 0.97 }}
      className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition-all duration-150 ${
        selected
          ? `border-primary ${sector.bg} ring-2 ring-primary/20 shadow-sm`
          : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/20'
      }`}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5">
          <CheckCircle2 size={15} className="text-primary" />
        </div>
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${sector.bg}`}>
        {sector.emoji}
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-xs leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
          {sector.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {sector.tagline}
        </p>
      </div>
      {/* Partner badges */}
      <div className="flex flex-wrap gap-1 mt-0.5">
        {sector.partners.slice(0, 2).map(p => (
          <span key={p.name} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${p.color}`}>
            {p.name}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

// ── Hook: persist sector in localStorage ──────────────────────────────────────

const LS_KEY = 'kompilot_sector';

export function useSector() {
  const [sector, setSector] = useState<Sector | null>(() => {
    try {
      return (localStorage.getItem(LS_KEY) as Sector) || null;
    } catch { return null; }
  });

  const saveSector = (s: Sector) => {
    setSector(s);
    try { localStorage.setItem(LS_KEY, s); } catch { /* ignore */ }
  };

  const getSectorDef = () => SECTORS.find(s => s.id === sector) ?? null;

  return { sector, saveSector, getSectorDef };
}

export { SECTORS };
