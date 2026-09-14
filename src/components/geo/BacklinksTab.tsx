/**
 * BacklinksTab — Backlinks Contextuels + Analyse Concurrents
 * Features: filtering (DA/relevance/type), proposal scheduling, submission tracking,
 * competitor backlink analysis with new guest-blogging opportunities.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Send, CheckCircle2, Clock, Target, ExternalLink,
  Copy, Check, X, TrendingUp, Globe, Sparkles, Filter,
  Calendar, ChevronDown, Eye, BarChart3, AlertCircle,
  Users, ArrowUpRight, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, toast } from '@blinkdotnew/ui';
import {
  MOCK_BACKLINK_OPPORTUNITIES,
  MOCK_SCHEDULED_OUTREACH,
  MOCK_COMPETITOR_BACKLINKS,
} from '../../lib/demoMockData';

// ── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode; color: string }> = {
  identified: { label: 'Identifié', variant: 'outline', icon: <Target className="h-3 w-3" />, color: 'text-blue-600' },
  outreach_sent: { label: 'Prospection envoyée', variant: 'secondary', icon: <Send className="h-3 w-3" />, color: 'text-amber-600' },
  accepted: { label: 'Accepté', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-emerald-600' },
  published: { label: 'Publié', variant: 'default', icon: <ExternalLink className="h-3 w-3" />, color: 'text-primary' },
  listed: { label: 'Listé', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-primary' },
};

const TYPE_LABELS: Record<string, string> = {
  guest_post: 'Article invité',
  partnership: 'Partenariat',
  directory: 'Annuaire',
  editorial: 'Éditorial',
  review_listing: 'Annonce avis',
  news_mention: 'Mention presse',
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

// ── Proposal Modal ──────────────────────────────────────────────────────────

function OutreachProposalModal({
  opportunity,
  onClose,
  onSchedule,
}: {
  opportunity: typeof MOCK_BACKLINK_OPPORTUNITIES[0];
  onClose: () => void;
  onSchedule: (date: string, email: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  const proposal = `Objet : Proposition de collaboration — ${opportunity.topic}

Bonjour,

Je me permets de vous contacter car j'ai remarqué votre article sur ${opportunity.targetSite} et je pense que notre établissement, Le Petit Bistro à La Rochelle, pourrait apporter une réelle valeur ajoutée à votre contenu.

Nous sommes un restaurant bistronomique reconnu localement, avec plus de 150 avis positifs sur Google et une note moyenne de 4.5/5. Notre expertise dans la cuisine française traditionnelle revisitée avec des produits locaux s'inscrit parfaitement dans votre thématique.

Je vous propose un partenariat éditorial autour du sujet :
"${opportunity.topic}"

Nous pouvons fournir :
• Des citations et interviews exclusives de notre chef
• Des photos haute qualité de nos plats
• Des données sur les tendances culinaires locales
• Un lien retour vers votre site depuis notre page partenaires

Seriez-vous intéressé par cette collaboration ?

Cordialement,
L'équipe Le Petit Bistro
lepetitbistro-lr.fr`;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    toast.success('Proposition copiée !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = () => {
    if (!scheduleDate || !recipientEmail) {
      toast.error('Veuillez remplir la date et l\'email du destinataire');
      return;
    }
    onSchedule(scheduleDate, recipientEmail);
    toast.success('Prospection programmée !', { description: `Envoi prévu le ${new Date(scheduleDate).toLocaleDateString('fr-FR')}` });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-card rounded-xl border border-border shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Proposition de prospection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{opportunity.targetName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans leading-relaxed">
            {proposal}
          </pre>

          {/* Schedule section */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Calendar className="h-4 w-4" />
              {showSchedule ? 'Masquer la programmation' : 'Programmer l\'envoi'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Email du destinataire</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="redaction@site.fr"
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Date d'envoi</label>
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié !' : 'Copier'}
          </Button>
          {showSchedule ? (
            <Button size="sm" onClick={handleSchedule} className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Programmer
            </Button>
          ) : (
            <Button size="sm" onClick={() => { toast.success('Prospection envoyée !'); onClose(); }} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Envoyer maintenant
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Filter Bar ──────────────────────────────────────────────────────────────

interface Filters {
  minDA: number;
  maxDA: number;
  minRelevance: number;
  maxRelevance: number;
  type: string;
  status: string;
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/30 rounded-xl border border-border">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Filtres
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">DA min</label>
        <input
          type="number"
          min={0} max={100}
          value={filters.minDA}
          onChange={(e) => onChange({ ...filters, minDA: Number(e.target.value) })}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">DA max</label>
        <input
          type="number"
          min={0} max={100}
          value={filters.maxDA}
          onChange={(e) => onChange({ ...filters, maxDA: Number(e.target.value) })}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Pertinence min</label>
        <input
          type="number"
          min={0} max={100}
          value={filters.minRelevance}
          onChange={(e) => onChange({ ...filters, minRelevance: Number(e.target.value) })}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Type</label>
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
        >
          <option value="">Tous</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Statut</label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
        >
          <option value="">Tous</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => onChange({ minDA: 0, maxDA: 100, minRelevance: 0, maxRelevance: 100, type: '', status: '' })}
      >
        Réinitialiser
      </Button>
    </div>
  );
}

// ── Pipeline Status Tracker ─────────────────────────────────────────────────

function PipelineTracker({ opportunities }: { opportunities: typeof MOCK_BACKLINK_OPPORTUNITIES }) {
  const stages = [
    { key: 'identified', label: 'Identifié', color: 'bg-blue-500' },
    { key: 'outreach_sent', label: 'Envoyé', color: 'bg-amber-500' },
    { key: 'accepted', label: 'Accepté', color: 'bg-emerald-500' },
    { key: 'published', label: 'Publié', color: 'bg-primary' },
  ];

  return (
    <div className="flex items-center gap-1 w-full">
      {stages.map((stage, i) => {
        const count = opportunities.filter((o) => o.status === stage.key || (stage.key === 'published' && o.status === 'listed')).length;
        return (
          <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                style={{ width: `${opportunities.length > 0 ? (count / opportunities.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-[10px] font-medium text-muted-foreground">{stage.label}</span>
              <span className="text-xs font-semibold">{count}</span>
            </div>
            {i < stages.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Competitor Analysis Section ─────────────────────────────────────────────

function CompetitorAnalysis() {
  const competitors = useMemo(() => {
    const grouped: Record<string, typeof MOCK_COMPETITOR_BACKLINKS> = {};
    MOCK_COMPETITOR_BACKLINKS.forEach((cb) => {
      if (!grouped[cb.competitor]) grouped[cb.competitor] = [];
      grouped[cb.competitor].push(cb);
    });
    return grouped;
  }, []);

  const uniqueCompetitors = Object.keys(competitors);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {uniqueCompetitors.map((name, i) => {
          const links = competitors[name];
          const avgDA = Math.round(links.reduce((s, l) => s + l.sourceDA, 0) / links.length);
          return (
            <motion.div key={name} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
              <Card className="card-hover">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{links.length} backlinks · DA moy. {avgDA}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Competitor backlinks table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-3 font-medium">Concurrent</th>
              <th className="pb-3 pr-3 font-medium">Source</th>
              <th className="pb-3 pr-3 font-medium">DA</th>
              <th className="pb-3 pr-3 font-medium">Type</th>
              <th className="pb-3 pr-3 font-medium">Anchor</th>
              <th className="pb-3 font-medium">Opportunité</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPETITOR_BACKLINKS.map((cb) => (
              <tr key={cb.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-3">
                  <p className="text-xs font-medium truncate max-w-[120px]">{cb.competitor}</p>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="text-xs text-primary flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {cb.sourceSite}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="text-xs font-medium">{cb.sourceDA}</span>
                </td>
                <td className="py-2.5 pr-3">
                  <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[cb.linkType] ?? cb.linkType}</Badge>
                </td>
                <td className="py-2.5 pr-3">
                  <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">{cb.anchorText}</p>
                </td>
                <td className="py-2.5">
                  <p className="text-[11px] text-foreground">{cb.opportunity}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function BacklinksTab() {
  const [selectedOpp, setSelectedOpp] = useState<typeof MOCK_BACKLINK_OPPORTUNITIES[0] | null>(null);
  const [filters, setFilters] = useState<Filters>({ minDA: 0, maxDA: 100, minRelevance: 0, maxRelevance: 100, type: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<'opportunities' | 'competitors'>('opportunities');
  const [scheduledOutreach, setScheduledOutreach] = useState(MOCK_SCHEDULED_OUTREACH);

  const filteredOpportunities = useMemo(() => {
    return MOCK_BACKLINK_OPPORTUNITIES.filter((o) => {
      if (o.domainAuthority < filters.minDA || o.domainAuthority > filters.maxDA) return false;
      if (o.relevanceScore < filters.minRelevance || o.relevanceScore > filters.maxRelevance) return false;
      if (filters.type && o.type !== filters.type) return false;
      if (filters.status && o.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  const identified = filteredOpportunities.filter((o) => o.status === 'identified').length;
  const outreachSent = filteredOpportunities.filter((o) => o.status === 'outreach_sent').length;
  const accepted = filteredOpportunities.filter((o) => o.status === 'accepted').length;
  const published = filteredOpportunities.filter((o) => o.status === 'published' || o.status === 'listed').length;

  const kpis = [
    { label: 'Opportunités', value: String(filteredOpportunities.length), icon: <Target className="h-5 w-5" />, color: 'text-primary' },
    { label: 'Prospection envoyée', value: String(outreachSent), icon: <Send className="h-5 w-5" />, color: 'text-amber-600' },
    { label: 'Acceptés', value: String(accepted), icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-emerald-600' },
    { label: 'Publiés / Listés', value: String(published), icon: <ExternalLink className="h-5 w-5" />, color: 'text-primary' },
  ];

  const handleSchedule = (opportunityId: string, date: string, email: string) => {
    setScheduledOutreach((prev) => [
      ...prev,
      {
        id: `so-${Date.now()}`,
        opportunityId,
        targetSite: MOCK_BACKLINK_OPPORTUNITIES.find((o) => o.id === opportunityId)?.targetSite ?? '',
        scheduledAt: date,
        status: 'pending',
        recipientEmail: email,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className={kpi.color}>{kpi.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`text-xl font-semibold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Tracker */}
      <motion.div custom={4} initial="hidden" animate="visible" variants={fadeIn}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Pipeline de prospection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PipelineTracker opportunities={MOCK_BACKLINK_OPPORTUNITIES} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeSection === 'opportunities' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('opportunities')}
          className="gap-1.5"
        >
          <Link2 className="h-3.5 w-3.5" />
          Opportunités ({filteredOpportunities.length})
        </Button>
        <Button
          variant={activeSection === 'competitors' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('competitors')}
          className="gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          Analyse Concurrents
        </Button>
        <div className="flex-1" />
        {activeSection === 'opportunities' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            {showFilters ? 'Masquer les filtres' : 'Filtrer'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && activeSection === 'opportunities' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <FilterBar filters={filters} onChange={setFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opportunities Section */}
      {activeSection === 'opportunities' && (
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeIn}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Opportunités de backlinks
                </CardTitle>
                {/* Scheduled outreach badge */}
                {scheduledOutreach.filter((s) => s.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {scheduledOutreach.filter((s) => s.status === 'pending').length} programmé(s)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scheduled outreach timeline */}
              {scheduledOutreach.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Envois programmés
                  </p>
                  <div className="space-y-1.5">
                    {scheduledOutreach.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{s.targetSite}</span>
                        <span className="text-muted-foreground">{s.recipientEmail}</span>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(s.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table */}
              {filteredOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune opportunité ne correspond aux filtres</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setFilters({ minDA: 0, maxDA: 100, minRelevance: 0, maxRelevance: 100, type: '', status: '' })}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Site cible</th>
                        <th className="pb-3 pr-4 font-medium">DA</th>
                        <th className="pb-3 pr-4 font-medium">Pertinence</th>
                        <th className="pb-3 pr-4 font-medium">Type</th>
                        <th className="pb-3 pr-4 font-medium">Sujet</th>
                        <th className="pb-3 pr-4 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpportunities.map((opp) => {
                        const st = STATUS_CONFIG[opp.status] ?? STATUS_CONFIG.identified;
                        return (
                          <tr key={opp.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium truncate max-w-[180px]">{opp.targetName}</p>
                                <p className="text-xs text-muted-foreground">{opp.targetSite}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{opp.domainAuthority}</span>
                                <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${opp.domainAuthority}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{opp.relevanceScore}</span>
                                <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${opp.relevanceScore >= 90 ? 'bg-emerald-500' : opp.relevanceScore >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${opp.relevanceScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant="secondary" className="text-xs">{TYPE_LABELS[opp.type] ?? opp.type}</Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground">{opp.topic}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={st.variant} className="text-xs gap-1">
                                {st.icon} {st.label}
                              </Badge>
                            </td>
                            <td className="py-3">
                              {opp.status === 'identified' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => setSelectedOpp(opp)}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Proposer
                                </Button>
                              )}
                              {opp.status === 'outreach_sent' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> En attente
                                </span>
                              )}
                              {(opp.status === 'accepted' || opp.status === 'published' || opp.status === 'listed') && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> {opp.status === 'published' || opp.status === 'listed' ? 'Terminé' : 'En cours'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Competitor Analysis Section */}
      {activeSection === 'competitors' && (
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Analyse des backlinks concurrents
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Identifiez les backlinks de vos concurrents et découvrez de nouvelles opportunités de guest-blogging.
              </p>
            </CardHeader>
            <CardContent>
              <CompetitorAnalysis />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Outreach Proposal Modal */}
      <AnimatePresence>
        {selectedOpp && (
          <OutreachProposalModal
            opportunity={selectedOpp}
            onClose={() => setSelectedOpp(null)}
            onSchedule={(date, email) => handleSchedule(selectedOpp.id, date, email)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
