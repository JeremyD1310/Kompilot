/**
 * SalesTriggersPanel — Manychat-style automated comment triggers
 * Allows merchants to activate auto-DM responses when users comment a keyword
 * on Instagram/Facebook posts.
 */
import { useState } from 'react';
import { Zap, Plus, Trash2, Power, MessageSquare, ArrowRight, ChevronDown, ChevronUp, Sparkles, Check, Info } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { generateChatAutomation } from '../../lib/aiRouterClient';

interface Trigger {
  id: string;
  keyword: string;
  network: 'instagram' | 'facebook' | 'both';
  dmMessage: string;
  conversionLink: string;
  active: boolean;
  triggeredCount: number;
  conversionCount: number;
}

const DEFAULT_DM = (keyword: string, link: string) =>
  `Bonjour ! 😊 Merci pour votre commentaire sur "${keyword}". Voici votre lien direct : ${link || 'https://votre-lien.fr'}. Au plaisir de vous accueillir !`;

const PRESET_TRIGGERS: Omit<Trigger, 'id'>[] = [
  {
    keyword: 'RESERVER',
    network: 'both',
    dmMessage: "Bonjour ! 😊 Merci pour votre intérêt. Voici notre lien de réservation : https://planity.com/votre-salon — Nous avons hâte de vous accueillir !",
    conversionLink: 'https://planity.com/votre-salon',
    active: false,
    triggeredCount: 0,
    conversionCount: 0,
  },
  {
    keyword: 'MENU',
    network: 'instagram',
    dmMessage: "Bonjour ! 🍽️ Voici notre menu complet du moment : https://votre-restaurant.fr/menu — Bonne découverte !",
    conversionLink: 'https://votre-restaurant.fr/menu',
    active: false,
    triggeredCount: 0,
    conversionCount: 0,
  },
  {
    keyword: 'PROMO',
    network: 'facebook',
    dmMessage: "Bonjour ! 🎉 Voici votre coupon de réduction exclusif : https://votre-site.fr/promo — Valable ce week-end uniquement !",
    conversionLink: 'https://votre-site.fr/promo',
    active: false,
    triggeredCount: 0,
    conversionCount: 0,
  },
];

function NetworkBadge({ network }: { network: Trigger['network'] }) {
  const map = {
    instagram: { label: 'Instagram', class: 'bg-pink-50 text-pink-700 border-pink-200' },
    facebook:  { label: 'Facebook',  class: 'bg-blue-50 text-blue-700 border-blue-200' },
    both:      { label: 'IG + FB',   class: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const cfg = map[network];
  return (
    <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

function TriggerCard({
  trigger,
  onToggle,
  onDelete,
}: {
  trigger: Trigger;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${trigger.active ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Toggle */}
        <button
          onClick={() => onToggle(trigger.id)}
          className={`shrink-0 w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 ${
            trigger.active ? 'bg-primary justify-end' : 'bg-muted justify-start'
          }`}
          title={trigger.active ? 'Désactiver' : 'Activer'}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-all" />
        </button>

        {/* Keyword */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-lg">
              {trigger.keyword}
            </span>
            <NetworkBadge network={trigger.network} />
            {trigger.active && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Actif
              </span>
            )}
          </div>
          {trigger.triggeredCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {trigger.triggeredCount} déclenchements · {trigger.conversionCount} conversions
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onDelete(trigger.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Message DM automatique</p>
            <p className="text-xs text-foreground bg-muted/40 rounded-xl px-3 py-2.5 leading-relaxed border border-border">
              {trigger.dmMessage}
            </p>
          </div>
          {trigger.conversionLink && (
            <div className="flex items-center gap-2">
              <ArrowRight size={12} className="text-primary shrink-0" />
              <a
                href={trigger.conversionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate"
              >
                {trigger.conversionLink}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New trigger form ──────────────────────────────────────────────────────────

function NewTriggerForm({ onSave, onCancel }: { onSave: (t: Omit<Trigger, 'id' | 'triggeredCount' | 'conversionCount'>) => void; onCancel: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [network, setNetwork] = useState<Trigger['network']>('both');
  const [conversionLink, setConversionLink] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!keyword) return;
    setAiLoading(true);
    try {
      const prompt = `Rédige un message DM automatique pour un établissement local.
Ce message sera envoyé automatiquement quand un utilisateur commente le mot-clé "${keyword}" sur Instagram ou Facebook.
${conversionLink ? `Inclus ce lien de conversion : ${conversionLink}` : 'Invite-les à contacter l\'établissement pour plus d\'informations.'}

Critères impératifs :
- Ton amical, chaleureux et professionnel
- Maximum 3 phrases
- Commence par "Bonjour ! 😊"
- Inclure une invitation à agir (cliquer le lien, appeler, réserver)
- Termine avec une formule chaleureuse

Génère uniquement le texte du message, sans guillemets ni préambule.`;

      const res = await generateChatAutomation(prompt, {
        keyword,
        conversionLink: conversionLink || undefined,
        network,
      });
      setDmMessage(res.content.trim());
      toast.success('Message DM généré par IA ✨', {
        description: `Modèle : ${res.meta.model} · ${res.meta.latencyMs}ms`,
      });
    } catch {
      // Fallback to template if AI is unavailable
      setDmMessage(DEFAULT_DM(keyword, conversionLink));
      toast.error('IA momentanément indisponible — modèle par défaut utilisé.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!keyword.trim() || !dmMessage.trim()) {
      toast.error('Mot-clé et message DM requis');
      return;
    }
    onSave({ keyword: keyword.toUpperCase().trim(), network, dmMessage, conversionLink, active: true });
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
      <p className="text-xs font-bold text-primary">✨ Nouveau déclencheur</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Keyword */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Mot-clé à écouter</label>
          <input
            type="text"
            placeholder="Ex: RESERVER"
            value={keyword}
            onChange={e => setKeyword(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground uppercase placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Network */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Réseau social</label>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(['instagram', 'facebook', 'both'] as const).map(n => (
              <button
                key={n}
                onClick={() => setNetwork(n)}
                className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
                  network === n ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {n === 'instagram' ? '📸 IG' : n === 'facebook' ? '👥 FB' : '📲 Les deux'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion link */}
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Lien de conversion (réservation, menu, coupon…)</label>
        <input
          type="url"
          placeholder="https://planity.com/votre-salon"
          value={conversionLink}
          onChange={e => setConversionLink(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* DM message */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Message DM automatique</label>
          <button
            onClick={handleAiGenerate}
            disabled={!keyword || aiLoading}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            <Sparkles size={11} className={aiLoading ? 'animate-spin' : ''} />
            {aiLoading ? 'Génération...' : 'Générer avec IA'}
          </button>
        </div>
        <textarea
          value={dmMessage}
          onChange={e => setDmMessage(e.target.value)}
          placeholder="Message qui sera envoyé automatiquement en DM dès qu'un utilisateur commente votre mot-clé..."
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
        <Button size="sm" onClick={handleSave} className="gap-1.5">
          <Check size={13} /> Créer le déclencheur
        </Button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function SalesTriggersPanel() {
  const [triggers, setTriggers] = useState<Trigger[]>(() =>
    PRESET_TRIGGERS.map((t, i) => ({ ...t, id: `t${i + 1}` }))
  );
  const [showForm, setShowForm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleToggle = (id: string) => {
    setTriggers(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, active: !t.active };
      if (next.active) {
        toast.success(`Déclencheur "${t.keyword}" activé`, { description: 'Le bot écoute désormais ce mot-clé sur vos posts.' });
      } else {
        toast(`Déclencheur "${t.keyword}" désactivé`);
      }
      return next;
    }));
  };

  const handleDelete = (id: string) => {
    const t = triggers.find(x => x.id === id);
    setTriggers(prev => prev.filter(x => x.id !== id));
    if (t) toast(`Déclencheur "${t.keyword}" supprimé`);
  };

  const handleSave = (data: Omit<Trigger, 'id' | 'triggeredCount' | 'conversionCount'>) => {
    const newT: Trigger = { ...data, id: `t${Date.now()}`, triggeredCount: 0, conversionCount: 0 };
    setTriggers(prev => [newT, ...prev]);
    setShowForm(false);
    toast.success(`Déclencheur "${data.keyword}" créé et activé !`, {
      description: 'Kompilot surveille désormais ce mot-clé sur vos réseaux sociaux.',
    });
  };

  const activeCount = triggers.filter(t => t.active).length;
  const totalTriggered = triggers.reduce((s, t) => s + t.triggeredCount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Déclencheurs de Vente
              {activeCount > 0 && (
                <Badge className="rounded-full text-[10px] h-4 px-1.5 bg-emerald-600">{activeCount} actif{activeCount > 1 ? 's' : ''}</Badge>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">Réponses automatiques aux commentaires Instagram & Facebook</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(v => !v)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <Info size={15} />
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(v => !v)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus size={13} /> Nouveau trigger
          </Button>
        </div>
      </div>

      {/* Info banner */}
      {showInfo && (
        <div className="rounded-xl bg-gradient-to-r from-primary/5 to-teal-50 border border-primary/20 px-4 py-3 space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Zap size={13} className="text-primary" /> Comment ça marche ?
          </p>
          <ol className="text-[11px] text-muted-foreground space-y-1 list-none pl-0">
            <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">1.</span> Définissez un mot-clé (ex: <code className="bg-muted px-1 rounded text-[10px]">RESERVER</code>) à surveiller</li>
            <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">2.</span> Ajoutez votre lien de conversion (réservation, menu, coupon…)</li>
            <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">3.</span> Dès qu'un utilisateur commente ce mot sur vos posts, Kompilot lui envoie automatiquement un DM avec votre lien</li>
          </ol>
          <p className="text-[10px] text-muted-foreground/70 italic border-t border-border pt-2 mt-2">
            💡 Conseil : Ajoutez la phrase d'engagement directement dans vos publications via le Calendrier Éditorial — Kompilot peut l'insérer automatiquement.
          </p>
        </div>
      )}

      {/* Stats bar */}
      {totalTriggered > 0 && (
        <div className="flex items-center gap-4 rounded-xl bg-muted/40 border border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-primary" />
            <span className="text-xs text-foreground font-semibold">{totalTriggered} déclenchements ce mois</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-muted-foreground">
            {triggers.reduce((s, t) => s + t.conversionCount, 0)} conversions générées
          </span>
        </div>
      )}

      {/* New trigger form */}
      {showForm && <NewTriggerForm onSave={handleSave} onCancel={() => setShowForm(false)} />}

      {/* Trigger list */}
      <div className="space-y-2.5">
        {triggers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <Zap size={32} className="opacity-20" />
            <div>
              <p className="text-sm font-medium">Aucun déclencheur configuré</p>
              <p className="text-xs mt-0.5">Créez votre premier trigger pour transformer les commentaires en ventes</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus size={13} /> Créer mon premier trigger
            </Button>
          </div>
        ) : (
          triggers.map(t => (
            <TriggerCard key={t.id} trigger={t} onToggle={handleToggle} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Preset suggestions */}
      {triggers.length > 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">💡 Suggestions rapides</p>
          <div className="flex flex-wrap gap-1.5">
            {['INFOS', 'TARIF', 'DISPONIBLE', 'COUPON', 'CONTACT'].filter(
              kw => !triggers.some(t => t.keyword === kw)
            ).map(kw => (
              <button
                key={kw}
                onClick={() => {
                  setTriggers(prev => [
                    { id: `t${Date.now()}`, keyword: kw, network: 'both', dmMessage: DEFAULT_DM(kw, ''), conversionLink: '', active: false, triggeredCount: 0, conversionCount: 0 },
                    ...prev,
                  ]);
                  toast(`Trigger "${kw}" ajouté — personnalisez le message DM`);
                }}
                className="text-[11px] font-medium bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-2.5 py-1 transition-all"
              >
                + {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
