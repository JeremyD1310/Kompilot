/**
 * TrustCitationsBadge — Co-Marketing Trust Citations Widget
 * Inspiration: Mediads Locale
 *
 * Lets merchants display validated local authority mentions on their
 * social proof widget (e.g. "Sélectionné par l'Association des Commerçants").
 * Citations can be added/managed by the merchant and displayed as badges.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, Check, Star, Award, BadgeCheck, Building2, Users, X } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrustCitation {
  id: string;
  text: string;
  source: string;
  type: 'association' | 'media' | 'award' | 'certification' | 'partner';
  verified: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  association:   { label: 'Association',     icon: <Users size={11} />,      color: 'bg-blue-50 text-blue-700 border-blue-200',    badgeColor: 'bg-blue-600' },
  media:         { label: 'Presse / Média',  icon: <Star size={11} />,       color: 'bg-amber-50 text-amber-700 border-amber-200', badgeColor: 'bg-amber-500' },
  award:         { label: 'Récompense',      icon: <Award size={11} />,      color: 'bg-violet-50 text-violet-700 border-violet-200', badgeColor: 'bg-violet-600' },
  certification: { label: 'Certification',   icon: <BadgeCheck size={11} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeColor: 'bg-emerald-600' },
  partner:       { label: 'Partenaire',      icon: <Building2 size={11} />,  color: 'bg-teal-50 text-teal-700 border-teal-200',    badgeColor: 'bg-teal-600' },
};

const DEFAULT_CITATIONS: TrustCitation[] = [
  {
    id: 'c1',
    text: 'Sélectionné par l\'Association des Commerçants du Centre-Ville',
    source: 'Association des Commerçants',
    type: 'association',
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    text: 'Recommandé par le Guide des Artisans Locaux 2024',
    source: 'Guide des Artisans',
    type: 'media',
    verified: true,
    createdAt: new Date().toISOString(),
  },
];

// ── Citation badge (embeddable) ───────────────────────────────────────────────

export function CitationBadge({ citation }: { citation: TrustCitation }) {
  const cfg = TYPE_CONFIG[citation.type];
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      <span className="truncate max-w-[200px]">{citation.text}</span>
      {citation.verified && (
        <span title="Citation vérifiée">
          <BadgeCheck size={12} className="shrink-0 opacity-70" />
        </span>
      )}
    </div>
  );
}

// ── Embed preview ─────────────────────────────────────────────────────────────

function EmbedPreview({ citations }: { citations: TrustCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Shield size={11} className="text-primary" />
        Aperçu widget public
      </p>
      <div className="flex flex-wrap gap-2">
        {citations.filter(c => c.verified).map(c => (
          <CitationBadge key={c.id} citation={c} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Ces badges s'affichent sur votre widget de visibilité public et sur votre page de preuve sociale.
      </p>
    </div>
  );
}

// ── Add citation form ─────────────────────────────────────────────────────────

function AddCitationForm({
  onAdd,
  onCancel,
}: {
  onAdd: (c: Omit<TrustCitation, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState<TrustCitation['type']>('association');

  const handleSubmit = () => {
    if (!text.trim() || !source.trim()) {
      toast.error('Texte et source requis');
      return;
    }
    onAdd({ text: text.trim(), source: source.trim(), type, verified: false });
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-xs font-bold text-primary">+ Nouvelle citation de confiance</p>

      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Texte de la citation</label>
        <input
          type="text"
          placeholder="Ex: Sélectionné par l'Association des Commerçants de Lyon"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Source</label>
          <input
            type="text"
            placeholder="Nom de l'organisation"
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as TrustCitation['type'])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {Object.entries(TYPE_CONFIG).map(([id, cfg]) => (
              <option key={id} value={id}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
        <Button size="sm" onClick={handleSubmit} className="gap-1.5">
          <Check size={13} /> Ajouter la citation
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrustCitationsBadge() {
  const [citations, setCitations] = useState<TrustCitation[]>(DEFAULT_CITATIONS);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (data: Omit<TrustCitation, 'id' | 'createdAt'>) => {
    const newCitation: TrustCitation = {
      ...data,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCitations(prev => [...prev, newCitation]);
    setShowForm(false);
    toast.success('Citation ajoutée — en attente de validation');
  };

  const handleDelete = (id: string) => {
    setCitations(prev => prev.filter(c => c.id !== id));
    toast('Citation supprimée');
  };

  const handleToggleVerified = (id: string) => {
    setCitations(prev => prev.map(c =>
      c.id === id ? { ...c, verified: !c.verified } : c
    ));
  };

  const verified = citations.filter(c => c.verified);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <Award size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Citations de Co-Marketing
              {verified.length > 0 && (
                <Badge className="rounded-full text-[10px] h-4 px-1.5 bg-emerald-600">{verified.length} active{verified.length > 1 ? 's' : ''}</Badge>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">Mentions d'autorité validées localement</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(v => !v)}
          className="gap-1.5 text-xs h-8"
        >
          <Plus size={13} /> Ajouter
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3 flex items-start gap-2.5">
        <Shield size={13} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Tiers de confiance locaux :</span>{' '}
          Ces badges s'affichent sur votre widget public et renforcent la crédibilité de votre établissement auprès des visiteurs. Seules les citations marquées comme vérifiées sont affichées.
        </p>
      </div>

      {/* Add form */}
      {showForm && <AddCitationForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}

      {/* Citations list */}
      <div className="space-y-2.5">
        {citations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
            <Award size={28} className="opacity-20" />
            <p className="text-sm">Aucune citation ajoutée</p>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus size={13} className="mr-1.5" /> Ajouter votre première citation
            </Button>
          </div>
        ) : (
          citations.map(citation => {
            const cfg = TYPE_CONFIG[citation.type];
            return (
              <motion.div
                key={citation.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  citation.verified ? cfg.color : 'bg-muted/30 border-border text-muted-foreground'
                }`}
              >
                <span className="shrink-0">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{citation.text}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{citation.source} · {cfg.label}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleVerified(citation.id)}
                    title={citation.verified ? 'Désactiver' : 'Activer'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      citation.verified
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <BadgeCheck size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(citation.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Embed preview */}
      {verified.length > 0 && <EmbedPreview citations={verified} />}
    </div>
  );
}
