import { useState } from 'react';
import {
  Users, BarChart3, Cpu, LogOut, Shield, TrendingUp,
  Euro, Send, LayoutDashboard, ChevronRight, RefreshCw,
  Eye, Zap, Crown, Gift, UserCheck, AlertTriangle,
  MessageSquare, Star, Trash2, FlaskConical,
  Flame, ClipboardList, CheckCircle2, Clock, Bot, GraduationCap,
} from 'lucide-react';
import { useAdmin, type FakeClient, type TesterFeedback } from '../context/AdminContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@blinkdotnew/ui';
import { TesterFeedbacksTab } from '../components/admin/TesterFeedbacksTab';
import { FaultSimulatorPanel } from '../components/admin/FaultSimulatorPanel';
import { CreditSparkline } from '../components/admin/CreditSparkline';
import { AcademyAdminTab } from '../components/admin/AcademyAdminTab';
import { getBugReports } from '../components/layout/BugReportButton';
import { clearApiErrorLogs } from '../lib/safeApiCall';
import { PaidMediaDashboard } from '../components/admin/PaidMediaDashboard';

// ── Nav item ──────────────────────────────────────────────────────────────────

function AdminNavItem({
  icon: Icon, label, active, badge, onClick,
}: {
  icon: typeof Users; label: string; active: boolean; badge?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
        active
          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-semibold flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-orange-500 text-white rounded-full px-2 py-0.5">{badge}</span>
      )}
    </button>
  );
}

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: FakeClient['plan'] }) {
  const styles: Record<string, string> = {
    Free:   'bg-slate-700 text-slate-300 border-slate-600',
    Pro:    'bg-blue-900/60 text-blue-300 border-blue-700',
    Expert: 'bg-violet-900/60 text-violet-300 border-violet-700',
  };
  const icons: Record<string, React.ReactNode> = {
    Free:   <span>🆓</span>,
    Pro:    <Crown size={10} />,
    Expert: <Zap size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2 py-0.5 ${styles[plan]}`}>
      {icons[plan]} {plan}
    </span>
  );
}

// ── Credits indicator ─────────────────────────────────────────────────────────

function CreditsIndicator({ credits }: { credits: FakeClient['credits'] }) {
  if (credits === 'illimité') return <span className="text-violet-300 text-xs font-bold">∞</span>;
  const pct = Math.min(100, (credits / 30) * 100);
  const color = credits === 0 ? 'bg-red-500' : credits <= 5 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-200 tabular-nums w-6 text-right">{credits}</span>
      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ clients }: { clients: FakeClient[] }) {
  const totalPub = clients.reduce((s, c) => s + c.publications, 0);
  const proCount = clients.filter(c => c.plan !== 'Free').length;
  const mrr = clients.filter(c => c.plan === 'Pro').length * 19
            + clients.filter(c => c.plan === 'Expert').length * 39;

  const stats = [
    {
      icon: Users, label: 'Utilisateurs actifs', value: clients.length.toString(),
      sub: `${proCount} payants · ${clients.length - proCount} gratuits`,
      color: 'from-blue-600 to-blue-400', glow: 'shadow-blue-500/30',
    },
    {
      icon: Euro, label: 'MRR simulé', value: `${mrr.toLocaleString('fr-FR')} €`,
      sub: `+12% vs mois dernier`,
      color: 'from-emerald-600 to-teal-400', glow: 'shadow-emerald-500/30',
    },
    {
      icon: Send, label: 'Publications envoyées', value: totalPub.toLocaleString('fr-FR'),
      sub: 'Toutes plateformes confondues',
      color: 'from-violet-600 to-purple-400', glow: 'shadow-violet-500/30',
    },
    {
      icon: TrendingUp, label: 'Taux de rétention', value: '84%',
      sub: 'Sur 30 jours glissants',
      color: 'from-orange-600 to-amber-400', glow: 'shadow-orange-500/30',
    },
    {
      icon: TrendingUp, label: 'Taux de Churn', value: '3.2%',
      sub: '-0.8% vs mois dernier',
      color: 'from-red-600 to-rose-400', glow: 'shadow-red-500/30',
    },
  ];

  // Fake weekly chart data
  const chartData = [42, 58, 53, 71, 65, 89, 94, 102, 98, 115, 127, 134];
  const chartMax  = Math.max(...chartData);

  const atRiskClients = clients.filter(c => c.credits === 0);

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`relative rounded-2xl bg-gradient-to-br ${s.color} shadow-lg ${s.glow} p-5 overflow-hidden`}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-3 right-4 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-white/70 mt-0.5 leading-snug">{s.sub}</p>
                <p className="text-[11px] text-white/50 mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* B2C vs B2B breakdown */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 px-5 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">B2C vs B2B</span>
            <span className="text-[11px] text-slate-400">👤 B2C: 78 clients (74%) · 🏢 B2B: 27 clients (26%)</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500" style={{ width: '74%' }} />
            <div className="bg-violet-500" style={{ width: '26%' }} />
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />B2C Particuliers</span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />B2B Entreprises</span>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-slate-200">Publications / semaine (12 dernières)</p>
            <p className="text-xs text-slate-500 mt-0.5">Activité globale de la plateforme</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp size={12} /> +219% en 3 mois
          </span>
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-orange-600 to-orange-400 opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${(v / chartMax) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-slate-600">S-12</span>
          <span className="text-[10px] text-slate-600">Cette semaine</span>
        </div>
      </div>

      {/* Inactive clients alert */}
      <div className="rounded-2xl border border-amber-800/50 bg-amber-900/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-amber-400" />
          <p className="text-sm font-bold text-amber-300">Clients inactifs à relancer</p>
        </div>
        <div className="space-y-2">
          {clients.filter(c => c.lastActive.includes('jours') || c.lastActive.includes('8')).map(c => (
            <div key={c.id} className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">{c.avatar}</div>
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-amber-400">{c.lastActive}</span>
              <PlanBadge plan={c.plan} />
            </div>
          ))}
        </div>
      </div>

      {/* At-risk clients */}
      {atRiskClients.length > 0 && (
        <div className="rounded-2xl border border-red-800/50 bg-red-900/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-sm font-bold text-red-300">Clients à risque — Consommation anormale</p>
          </div>
          <div className="space-y-2">
            {atRiskClients.map(c => (
              <div key={c.id} className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-full bg-red-900/40 flex items-center justify-center text-[10px] font-bold text-red-300 shrink-0">{c.avatar}</div>
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-900/50 border border-red-700/60 text-red-300 text-[10px] font-bold px-2 py-0.5">
                  ⚠️ Crédits épuisés
                </span>
                <PlanBadge plan={c.plan} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client slide-over ─────────────────────────────────────────────────────────

function ClientSlideOver({
  client,
  onClose,
  onUpdate,
  onImpersonate,
}: {
  client: FakeClient;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<FakeClient>) => void;
  onImpersonate: (c: FakeClient) => void;
}) {
  const [creditsToAdd, setCreditsToAdd] = useState('10');

  const handleAddCredits = () => {
    const n = parseInt(creditsToAdd);
    if (isNaN(n) || n <= 0) return;
    if (client.credits === 'illimité') return;
    onUpdate(client.id, { credits: (client.credits as number) + n });
    toast.success(`+${n} crédits offerts à ${client.name}`, { description: 'Geste commercial appliqué.' });
  };

  const nextPlan: Record<string, FakeClient['plan']> = { Free: 'Pro', Pro: 'Expert', Expert: 'Free' };
  const planLabel: Record<string, string> = { Free: 'Passer à Pro', Pro: 'Passer à Expert', Expert: 'Repasser Free' };

  const handleChangePlan = () => {
    const newPlan = nextPlan[client.plan];
    onUpdate(client.id, {
      plan: newPlan,
      credits: newPlan === 'Expert' ? 'illimité' as const : newPlan === 'Pro' ? 30 : 5,
    });
    toast.success(`${client.name} → ${newPlan}`, { description: 'Plan mis à jour manuellement.' });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-700 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-sm font-extrabold text-white shrink-0">
            {client.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-100 truncate">{client.name}</p>
            <p className="text-xs text-slate-400 truncate">{client.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Secteur', value: client.sector },
              { label: 'Depuis', value: client.since },
              { label: 'Publications', value: client.publications.toString() },
              { label: 'Dernière activité', value: client.lastActive },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-slate-800 px-3 py-2.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Credit spend history sparkline */}
          {client.weeklyCreditsHistory && client.weeklyCreditsHistory.some(v => v > 0) && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-violet-400" />
                <p className="text-sm font-bold text-slate-200">Historique de consommation IA</p>
              </div>
              <CreditSparkline history={client.weeklyCreditsHistory} />
              {client.topCreditAction && client.topCreditAction !== '—' && (
                <p className="text-[11px] text-slate-400 leading-snug">
                  <Zap size={10} className="inline text-amber-400 mr-1" />
                  Action principale : <strong className="text-amber-300">{client.topCreditAction}</strong>
                </p>
              )}
              <p className="text-[10px] text-slate-500">
                Total semaine : <strong className="text-slate-300">{client.weeklyCreditsHistory.reduce((s, v) => s + v, 0)} crédits</strong> consommés
              </p>
            </div>
          )}

          {/* Credits */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-emerald-400" />
              <p className="text-sm font-bold text-slate-200">Offrir des crédits</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2.5 flex items-center gap-2">
                <Zap size={14} className="text-amber-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={creditsToAdd}
                  onChange={e => setCreditsToAdd(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none w-12"
                />
                <span className="text-xs text-slate-400">crédits</span>
              </div>
              <button
                onClick={handleAddCredits}
                disabled={client.credits === 'illimité'}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 transition-colors shrink-0"
              >
                <Gift size={13} /> + Offrir
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Solde actuel</span>
              <CreditsIndicator credits={client.credits} />
            </div>
          </div>

          {/* Plan change */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-violet-400" />
              <p className="text-sm font-bold text-slate-200">Gestion du plan</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Plan actuel</p>
                <PlanBadge plan={client.plan} />
              </div>
              <button
                onClick={handleChangePlan}
                className="flex items-center gap-1.5 rounded-xl border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 text-xs font-semibold px-4 py-2 transition-all"
              >
                <RefreshCw size={12} />
                {planLabel[client.plan]}
              </button>
            </div>
          </div>

          {/* Impersonate */}
          <div className="rounded-2xl border border-orange-800/50 bg-orange-900/20 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-orange-400" />
              <p className="text-sm font-bold text-orange-300">Prise en main</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Basculez temporairement sur le Dashboard de <strong className="text-slate-300">{client.name}</strong> pour voir exactement ce qu'ils voient et les aider en cas de problème.
            </p>
            <button
              onClick={() => { onImpersonate(client); onClose(); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold py-3 transition-colors"
            >
              <UserCheck size={15} />
              Se connecter en tant que {client.name}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Clients tab ───────────────────────────────────────────────────────────────

function ClientsTab({ clients, updateClient, onImpersonate }: {
  clients: FakeClient[];
  updateClient: (id: string, patch: Partial<FakeClient>) => void;
  onImpersonate: (c: FakeClient) => void;
}) {
  const [selected, setSelected] = useState<FakeClient | null>(null);
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-800/80 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Client</span>
          <span className="text-center">Plan</span>
          <span className="text-center">Crédits</span>
          <span className="text-center">Activité</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.map((c, i) => (
          <div
            key={c.id}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-800/40 transition-colors ${
              i < filtered.length - 1 ? 'border-b border-slate-800' : ''
            }`}
          >
            {/* Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[11px] font-extrabold text-slate-300 shrink-0">
                {c.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{c.sector} · {c.since}</p>
              </div>
            </div>
            {/* Plan */}
            <PlanBadge plan={c.plan} />
            {/* Credits */}
            <CreditsIndicator credits={c.credits} />
            {/* Last active */}
            <span className={`text-[11px] font-medium whitespace-nowrap ${
              c.lastActive.includes('8 jours') || c.lastActive.includes('6 jours') ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {c.lastActive}
            </span>
            {/* Manage */}
            <button
              onClick={() => setSelected(c)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/10 text-slate-400 hover:text-orange-300 text-[11px] font-semibold px-3 py-1.5 transition-all whitespace-nowrap"
            >
              Gérer <ChevronRight size={11} />
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <ClientSlideOver
          client={clients.find(c => c.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onUpdate={(id, patch) => {
            updateClient(id, patch);
            setSelected(prev => prev ? { ...prev, ...patch } : null);
          }}
          onImpersonate={onImpersonate}
        />
      )}
    </div>
  );
}

// ── AI config tab ─────────────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = {
  restauration: 'Le secret d\'une bonne semaine ? Commencer par un plat réconfortant. 🍕 Découvrez notre suggestion du jour fraîchement préparée !',
  immobilier: '🏡 NOUVEAUTÉ | Un coup de cœur assuré pour cette maison lumineuse avec jardin. Les visites commencent cette semaine !',
  artisanat: 'Chantier terminé ! 🛠️ Du sur-mesure et des finitions soignées pour ce nouveau projet client. Qu\'en pensez-vous ?',
  beaute: 'Transformation du jour ✨ Notre équipe donne vie à vos envies. Prenez soin de vous — vous le méritez !',
};

function AIConfigTab() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('kompilot_admin_ai_templates', JSON.stringify(templates));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Templates IA sauvegardés !');
  };

  const sectors = Object.keys(templates) as (keyof typeof templates)[];

  const sectorLabels: Record<string, string> = {
    restauration: '🍕 Restauration',
    immobilier: '🏡 Immobilier',
    artisanat: '🛠️ Artisanat / Bâtiment',
    beaute: '✨ Beauté / Bien-être',
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Cpu size={16} className="text-orange-400" />
          <p className="text-sm font-bold text-slate-200">Templates de suggestions quotidiennes</p>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Modifiez globalement les textes envoyés à vos clients comme "Proposition du jour" dans leur Dashboard.
        </p>

        <div className="space-y-4">
          {sectors.map(sector => (
            <div key={sector} className="space-y-2">
              <label className="text-xs font-bold text-slate-400">{sectorLabels[sector]}</label>
              <textarea
                value={templates[sector]}
                onChange={e => setTemplates(p => ({ ...p, [sector]: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-700/50 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 resize-none transition-all"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className={`mt-4 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-orange-600 hover:bg-orange-500 text-white'
          }`}
        >
          {saved ? '✓ Sauvegardé !' : '💾 Enregistrer les templates'}
        </button>
      </div>

      {/* Prompt engineering zone */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-violet-400" />
          <p className="text-sm font-bold text-slate-200">Instruction système IA (Prompt Global)</p>
        </div>
        <textarea
          defaultValue="Tu es un expert en marketing digital pour TPE/PME. Génère des suggestions de publication ultra-ciblées, percutantes et adaptées au secteur d'activité de chaque client. Utilise un ton authentique, des emojis pertinents et des appels à l'action clairs."
          rows={4}
          className="w-full rounded-xl border border-slate-700 bg-slate-700/50 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 resize-none transition-all"
        />
        <p className="text-[11px] text-slate-500">Ce prompt est injecté en tête de chaque requête de génération IA de la plateforme.</p>
      </div>
    </div>
  );
}

// ── Bug Reports tab ───────────────────────────────────────────────────────────

function AdminBugReportsTab() {
  const [reports, setReports] = useState(getBugReports());

  const handleClear = () => {
    clearApiErrorLogs();
    localStorage.removeItem('kompilot_bug_reports');
    setReports([]);
    toast.success('Rapports effacés');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-300">
          Rapports de bugs clients ({reports.length})
        </p>
        {reports.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Effacer tout
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center">
          <p className="text-sm text-slate-500">✅ Aucun rapport de bug — tout fonctionne bien !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">
                    🔴 {r.id}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(r.sentAt).toLocaleString('fr-FR')} · Page : {r.snapshot.path}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(r, null, 2));
                    toast.success('Copié dans le presse-papiers');
                  }}
                  className="text-[10px] font-semibold text-slate-500 hover:text-orange-300 transition-colors shrink-0 px-2 py-1 rounded border border-slate-700 hover:border-orange-600"
                >
                  Copier JSON
                </button>
              </div>

              {r.userNote && (
                <div className="rounded-lg bg-slate-700/50 px-3 py-2">
                  <p className="text-xs text-slate-300 italic">"{r.userNote}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div><span className="text-slate-500">Offre :</span> <span className="text-slate-300 font-medium capitalize">{r.snapshot.plan}</span></div>
                <div><span className="text-slate-500">Mode démo :</span> <span className="text-slate-300 font-medium">{r.snapshot.demoActive ? 'Oui' : 'Non'}</span></div>
                <div><span className="text-slate-500">Erreurs API :</span> <span className={`font-bold ${r.snapshot.apiErrors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{r.snapshot.apiErrors.length}</span></div>
              </div>

              {r.snapshot.apiErrors.length > 0 && (
                <div className="space-y-1">
                  {r.snapshot.apiErrors.map(err => (
                    <div key={err.id} className="rounded-lg bg-red-950/30 border border-red-800/30 px-2 py-1.5">
                      <p className="text-[10px] font-bold text-red-400">{err.service}</p>
                      <p className="text-[10px] text-red-300 font-mono">{err.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Consumption tab ────────────────────────────────────────────────────────

function AIConsumptionTab({ clients }: { clients: FakeClient[] }) {
  // Simulate per-client AI consumption
  const rows = clients.map(c => {
    const base = c.credits === 'illimité' ? 80 : typeof c.credits === 'number' ? Math.max(0, 30 - c.credits) : 0;
    const chatgpt = Math.round(base * 2.1 + Math.random() * 15);
    const gemini  = Math.round(base * 1.4 + Math.random() * 10);
    const whatsapp = Math.round(base * 0.7 + Math.random() * 8);
    const total = chatgpt + gemini + whatsapp;
    const isAnomalous = c.plan === 'Free' && total > 20;
    return { ...c, chatgpt, gemini, whatsapp, total, isAnomalous };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      {/* Header stat */}
      <div className="rounded-2xl border border-orange-800/50 bg-orange-900/20 p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <Flame size={22} className="text-orange-400" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-orange-300">847,293</p>
          <p className="text-xs text-slate-400 mt-0.5">Total tokens consommés ce mois · <span className="text-orange-400 font-semibold">ChatGPT + Gemini + WhatsApp API</span></p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-800/80 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Client</span>
          <span className="text-center">Plan</span>
          <span className="text-center">ChatGPT</span>
          <span className="text-center">Gemini</span>
          <span className="text-center">WhatsApp</span>
          <span className="text-center">Alerte</span>
        </div>
        {rows.map((c, i) => (
          <div
            key={c.id}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors ${
              c.isAnomalous ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-slate-800/40'
            } ${i < rows.length - 1 ? 'border-b border-slate-800' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[11px] font-extrabold text-slate-300 shrink-0">
                {c.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                <p className="text-[11px] text-slate-500 tabular-nums">Total: {c.total} req.</p>
              </div>
            </div>
            <PlanBadge plan={c.plan} />
            <span className="text-xs font-bold text-slate-300 tabular-nums text-center">{c.chatgpt}</span>
            <span className="text-xs font-bold text-slate-300 tabular-nums text-center">{c.gemini}</span>
            <span className="text-xs font-bold text-slate-300 tabular-nums text-center">{c.whatsapp}</span>
            <div className="flex justify-center">
              {c.isAnomalous ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-900/50 border border-red-700/60 text-red-300 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                  ⚠️ Anomalie
                </span>
              ) : (
                <span className="text-[10px] text-slate-600">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Support Tickets tab ───────────────────────────────────────────────────────

type TicketStatus = 'open' | 'resolved' | 'pending_ai';
type TicketPlan   = 'Starter' | 'Business' | 'Franchise';

interface SupportTicket {
  id: string;
  clientName: string;
  plan: TicketPlan;
  subject: string;
  status: TicketStatus;
  priority: 'high' | 'medium' | 'standard';
  createdAt: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  { id: 'T001', clientName: 'Marie B.',  plan: 'Franchise', subject: 'Connexion Meta impossible',          status: 'open',       priority: 'high',     createdAt: 'il y a 5 min' },
  { id: 'T002', clientName: 'Jean D.',   plan: 'Business',  subject: 'Posts non publiés sur Instagram',    status: 'open',       priority: 'medium',   createdAt: 'il y a 23 min' },
  { id: 'T003', clientName: 'Sophie L.', plan: 'Starter',   subject: 'Comment connecter Google Maps ?',    status: 'pending_ai', priority: 'standard', createdAt: 'il y a 1h' },
  { id: 'T004', clientName: 'Paul M.',   plan: 'Starter',   subject: 'Crédits épuisés',                    status: 'pending_ai', priority: 'standard', createdAt: 'il y a 2h' },
];

function TicketPriorityBadge({ plan }: { plan: TicketPlan }) {
  if (plan === 'Franchise') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-900/50 border border-red-700/60 text-red-300 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
      🔴 Haute Priorité
    </span>
  );
  if (plan === 'Business') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-900/50 border border-orange-700/60 text-orange-300 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
      🟠 Priorité Moyenne
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/50 border border-blue-700/60 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
      🔵 Standard
    </span>
  );
}

function TicketStatusBadge({ status, plan }: { status: TicketStatus; plan: TicketPlan }) {
  if (status === 'resolved') return (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
      <CheckCircle2 size={11} /> Résolu
    </span>
  );
  if (status === 'pending_ai' && plan === 'Starter') return (
    <span className="inline-flex items-center gap-1 text-violet-300 text-[10px] font-bold animate-pulse">
      <Bot size={11} /> 🤖 Copilote IA en cours...
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold">
      <Clock size={11} /> Ouvert
    </span>
  );
}

function TicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);

  const handleResolve = (id: string, clientName: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    toast.success(`✅ Résolu. Notification WhatsApp/Email envoyée au client.`, {
      description: `Ticket ${id} · ${clientName}`,
    });
  };

  const openCount = tickets.filter(t => t.status !== 'resolved').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-200">File de support</p>
          <p className="text-xs text-slate-500">{openCount} ticket{openCount !== 1 ? 's' : ''} en attente</p>
        </div>
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className={`rounded-2xl border p-5 transition-all ${
              ticket.status === 'resolved'
                ? 'border-slate-700/50 bg-slate-800/20 opacity-60'
                : ticket.plan === 'Franchise'
                  ? 'border-red-800/50 bg-red-900/10'
                  : ticket.plan === 'Business'
                    ? 'border-orange-800/40 bg-orange-900/10'
                    : 'border-slate-700 bg-slate-800/40'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 font-mono">{ticket.id}</span>
                  <TicketPriorityBadge plan={ticket.plan} />
                  <TicketStatusBadge status={ticket.status} plan={ticket.plan} />
                </div>
                <p className="text-sm font-semibold text-slate-200 leading-snug">{ticket.subject}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-400">{ticket.clientName}</span>
                  <span>·</span>
                  <span>{ticket.createdAt}</span>
                </div>
              </div>
              {ticket.status !== 'resolved' && (
                <button
                  onClick={() => handleResolve(ticket.id, ticket.clientName)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-700/50 hover:border-emerald-500 text-emerald-300 hover:text-white text-xs font-bold px-4 py-2 transition-all shrink-0"
                >
                  <CheckCircle2 size={13} /> Résoudre
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'clients' | 'ai' | 'feedbacks' | 'bugreports' | 'faults' | 'consumption' | 'tickets' | 'academy' | 'paid_media';

export default function AdminPage() {
  const { clients, updateClient, exitAdminMode, impersonate, feedbacks, deleteFeedback } = useAdmin();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const handleImpersonate = (client: FakeClient) => {
    impersonate(client);
    window.location.href = '/dashboard';
  };

  const handleExit = () => {
    exitAdminMode();
    logout();
    window.location.href = '/';
  };

  const bugReportCount = getBugReports().length;
  const tabs: { id: AdminTab; label: string; icon: typeof Users; badge?: string }[] = [
    { id: 'overview',     label: 'Vue d\'ensemble',       icon: LayoutDashboard },
    { id: 'clients',      label: 'Gestion clients',       icon: Users, badge: clients.length.toString() },
    { id: 'ai',           label: 'Config IA',             icon: Cpu },
    { id: 'consumption',  label: 'Conso IA 🔥',           icon: Flame },
    { id: 'tickets',      label: 'Tickets 📋',            icon: ClipboardList },
    { id: 'feedbacks',    label: 'Retours Testeurs',      icon: FlaskConical, badge: feedbacks.length > 0 ? feedbacks.length.toString() : undefined },
    { id: 'bugreports',   label: 'Bugs Clients',          icon: AlertTriangle, badge: bugReportCount > 0 ? bugReportCount.toString() : undefined },
    { id: 'faults',       label: 'Simulateur de pannes',  icon: Zap },
    { id: 'academy',      label: 'Gestion Academy 🎓',     icon: GraduationCap },
    { id: 'paid_media',   label: 'Paid Media 📊',          icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-800 bg-slate-900">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-500 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-100">Kompilot</p>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(t => (
            <AdminNavItem
              key={t.id}
              icon={t.icon}
              label={t.label}
              active={activeTab === t.id}
              badge={t.badge}
              onClick={() => setActiveTab(t.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50">
            <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">A</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Créateur Kompilot</p>
              <p className="text-[10px] text-slate-500 truncate">admin@kompilot.com</p>
            </div>
          </div>
          <button
            onClick={handleExit}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all text-sm font-medium"
          >
            <LogOut size={14} /> Quitter le mode admin
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-7 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-red-900/30 border border-red-800/60 px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Mode Administrateur</span>
            </div>
            <span className="text-sm text-slate-500">
              {tabs.find(t => t.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <BarChart3 size={12} />
            Tableau de bord v2.0 · Accès restreint
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-7 py-6">
          {activeTab === 'overview' && <OverviewTab clients={clients} />}
          {activeTab === 'clients' && (
            <ClientsTab clients={clients} updateClient={updateClient} onImpersonate={handleImpersonate} />
          )}
          {activeTab === 'ai' && <AIConfigTab />}
          {activeTab === 'consumption' && <AIConsumptionTab clients={clients} />}
          {activeTab === 'tickets' && <TicketsTab />}
          {activeTab === 'feedbacks' && <TesterFeedbacksTab feedbacks={feedbacks} onDelete={deleteFeedback} />}
          {activeTab === 'bugreports' && <AdminBugReportsTab />}
          {activeTab === 'faults' && <FaultSimulatorPanel />}
          {activeTab === 'academy' && <AcademyAdminTab />}
          {activeTab === 'paid_media' && <PaidMediaDashboard />}
        </main>
      </div>
    </div>
  );
}
