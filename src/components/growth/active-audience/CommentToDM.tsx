/**
 * CommentToDM — Configuration des règles Comment-to-DM
 * Lie un mot-clé à une ressource envoyée automatiquement par DM
 * quand un commentaire Instagram/Facebook correspond.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, Zap, MessageSquare, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';

export interface DMRule {
  id: string;
  keyword: string;
  resourceType: 'catalogue' | 'coupon' | 'link' | 'menu' | 'devis' | 'guide';
  resourceValue: string;
  platform: 'instagram' | 'facebook' | 'both';
  triggerCount: number;
  isActive: boolean;
}

const RESOURCE_LABELS: Record<DMRule['resourceType'], { label: string; placeholder: string; emoji: string }> = {
  catalogue: { label: 'Catalogue / PDF',   placeholder: 'https://lien-vers-votre-catalogue.fr',  emoji: '📋' },
  coupon:    { label: 'Code promo / Coupon', placeholder: 'Ex: PROMO20 — 20% de réduction',        emoji: '🎟️' },
  link:      { label: 'Lien externe',        placeholder: 'https://votre-page-de-reservation.fr',  emoji: '🔗' },
  menu:      { label: 'Menu / Carte',        placeholder: 'https://votre-menu-en-ligne.fr',         emoji: '🍽️' },
  devis:     { label: 'Formulaire devis',    placeholder: 'https://votre-formulaire-devis.fr',      emoji: '📝' },
  guide:     { label: 'Guide / Whitepaper', placeholder: 'https://lien-vers-votre-guide.fr',       emoji: '📖' },
};

const DEMO_RULES: DMRule[] = [
  { id: 'r1', keyword: 'DOSSIER', resourceType: 'catalogue', resourceValue: 'https://kompilot.fr/catalogue', platform: 'both', triggerCount: 47, isActive: true },
  { id: 'r2', keyword: 'COUPON',  resourceType: 'coupon',    resourceValue: 'BIENVENUE20',                    platform: 'instagram', triggerCount: 23, isActive: true },
  { id: 'r3', keyword: 'DEVIS',   resourceType: 'devis',     resourceValue: 'https://kompilot.fr/devis',   platform: 'facebook', triggerCount: 8, isActive: false },
];

export function CommentToDMTab() {
  const [rules, setRules]         = useState<DMRule[]>(DEMO_RULES);
  const [showForm, setShowForm]   = useState(false);
  const [newRule, setNewRule]     = useState<Partial<DMRule>>({
    keyword: '', resourceType: 'catalogue', resourceValue: '', platform: 'both', isActive: true,
  });

  const addRule = () => {
    if (!newRule.keyword?.trim() || !newRule.resourceValue?.trim()) {
      toast.error('Remplissez le mot-clé et la ressource');
      return;
    }
    setRules(prev => [...prev, {
      id:            crypto.randomUUID(),
      keyword:       newRule.keyword!.toUpperCase().trim(),
      resourceType:  newRule.resourceType ?? 'catalogue',
      resourceValue: newRule.resourceValue!.trim(),
      platform:      newRule.platform ?? 'both',
      triggerCount:  0,
      isActive:      true,
    }]);
    setNewRule({ keyword: '', resourceType: 'catalogue', resourceValue: '', platform: 'both', isActive: true });
    setShowForm(false);
    toast.success('Règle Comment-to-DM créée !');
  };

  const toggleRule = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Règle supprimée');
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    toast.success(`Mot-clé "${kw}" copié !`);
  };

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-violet-800 dark:text-violet-300 mb-1">Comment fonctionne le Comment-to-DM ?</p>
            <p className="text-[11px] text-violet-600 dark:text-violet-400 leading-relaxed">
              Quand un abonné commente le mot-clé défini sur votre post, Kompilot déclenche un webhook
              qui lui envoie automatiquement la ressource par DM en moins de 30 secondes.
            </p>
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {rules.map(rule => (
          <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} onCopy={copyKeyword} />
        ))}

        {rules.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aucune règle configurée — créez votre première règle ci-dessous.
          </div>
        )}
      </div>

      {/* Add rule form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 p-4 space-y-3 bg-violet-50/50 dark:bg-violet-900/10">
              <p className="text-xs font-bold text-violet-700 dark:text-violet-400">Nouvelle règle Comment-to-DM</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mot-clé déclencheur</label>
                  <input
                    type="text"
                    placeholder="Ex: DOSSIER, COUPON, AVANT..."
                    value={newRule.keyword ?? ''}
                    onChange={e => setNewRule(p => ({ ...p, keyword: e.target.value.toUpperCase() }))}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono font-bold text-violet-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Type de ressource</label>
                  <select
                    value={newRule.resourceType}
                    onChange={e => setNewRule(p => ({ ...p, resourceType: e.target.value as DMRule['resourceType'] }))}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Contenu envoyé par DM ({RESOURCE_LABELS[newRule.resourceType ?? 'catalogue'].label})
                </label>
                <input
                  type="text"
                  placeholder={RESOURCE_LABELS[newRule.resourceType ?? 'catalogue'].placeholder}
                  value={newRule.resourceValue ?? ''}
                  onChange={e => setNewRule(p => ({ ...p, resourceValue: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex gap-2">
                  {(['both', 'instagram', 'facebook'] as DMRule['platform'][]).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewRule(prev => ({ ...prev, platform: p }))}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all capitalize ${
                        newRule.platform === p
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p === 'both' ? 'IG + FB' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={addRule} size="sm" className="bg-violet-500 hover:bg-violet-600 text-white gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Créer la règle
                </Button>
                <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-slate-500">
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full border-dashed border-2 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter une règle Comment-to-DM
        </Button>
      )}

      {/* Meta compliance note */}
      <div className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
        <span>Conforme aux règles Meta : 1 DM automatique par utilisateur / post · Pas de DM non sollicités</span>
      </div>
    </div>
  );
}

function RuleCard({
  rule, onToggle, onDelete, onCopy,
}: {
  rule: DMRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (kw: string) => void;
}) {
  const res = RESOURCE_LABELS[rule.resourceType];
  const platformLabel = rule.platform === 'both' ? 'IG + FB' : rule.platform === 'instagram' ? 'Instagram' : 'Facebook';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      rule.isActive
        ? 'border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10'
        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60'
    }`}>
      {/* Toggle */}
      <button
        onClick={() => onToggle(rule.id)}
        className={`w-8 h-5 rounded-full transition-all relative shrink-0 ${rule.isActive ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.isActive ? 'left-3.5' : 'left-0.5'}`} />
      </button>

      {/* Emoji */}
      <span className="text-lg shrink-0">{res.emoji}</span>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-black text-violet-600 dark:text-violet-400">{rule.keyword}</code>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">{res.label}</span>
          <Badge className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
            {platformLabel}
          </Badge>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{rule.resourceValue}</p>
      </div>

      {/* Stats */}
      <div className="text-center shrink-0 hidden sm:block">
        <p className="text-sm font-black text-violet-600 dark:text-violet-400">{rule.triggerCount}</p>
        <p className="text-[9px] text-slate-400">DMs envoyés</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onCopy(rule.keyword)} className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
          <Copy className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button onClick={() => onDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
