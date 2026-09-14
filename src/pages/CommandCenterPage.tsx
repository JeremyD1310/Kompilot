import { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertTriangle, Activity, Users, Zap,
  Power, PowerOff, RefreshCw, Database, Brain,
  CreditCard, Globe, ChevronRight, Clock, Server,
} from 'lucide-react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, StatGroup, Stat, toast,
} from '@blinkdotnew/ui';
import { blink } from '@/blink/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/context/DemoModeContext';
import { isKompilotTeam } from '@/context/AdminContext';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'down';
  label: string;
  latency?: number;
}

interface SystemHealth {
  status: 'green' | 'yellow' | 'red';
  message: string;
  components: {
    db: ComponentHealth;
    ai: ComponentHealth;
    stripe: ComponentHealth;
    meta: ComponentHealth;
  };
}

interface HealthAlert {
  id: string;
  level: 'critical' | 'warning';
  message: string;
  source: string;
  timestamp: string;
}

interface Metrics {
  activeUsers: number;
  campaigns: number;
  postsThisWeek: number;
  unreadMessages: number;
  systemHealth: SystemHealth;
  alerts: HealthAlert[];
  recentActions: AdminAction[];
}

interface AdminAction {
  id: string;
  action: string;
  admin: string;
  target: string;
  timestamp: string;
}

interface KillSwitchState {
  active: boolean;
  reason?: string;
  activatedAt?: string;
  activatedBy?: string;
  targetType?: 'all' | 'user';
  targetId?: string;
}

// ── Backend URL ────────────────────────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';

// ── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_METRICS: Metrics = {
  activeUsers: 1847,
  campaigns: 342,
  postsThisWeek: 1289,
  unreadMessages: 56,
  systemHealth: {
    status: 'green',
    message: 'Tous les systèmes sont opérationnels',
    components: {
      db: { status: 'healthy', label: 'Base de données', latency: 12 },
      ai: { status: 'healthy', label: 'IA / LLM', latency: 87 },
      stripe: { status: 'healthy', label: 'Stripe', latency: 45 },
      meta: { status: 'degraded', label: 'Meta API', latency: 320 },
    },
  },
  alerts: [
    {
      id: 'a1',
      level: 'warning',
      message: 'Latence Meta API élevée (320ms) — surveillance active',
      source: 'System Monitor',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'a2',
      level: 'critical',
      message: 'Campagne #1248 — budget dépassé de 15%',
      source: 'Campaign Engine',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ],
  recentActions: [
    {
      id: 'ra1',
      action: 'Activation kill-switch utilisateur',
      admin: 'Jérémy (admin)',
      target: 'user_abc123',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'ra2',
      action: 'Modification plan tarifaire',
      admin: 'Romain (admin)',
      target: 'Pro → Expert',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: 'ra3',
      action: 'Réinitialisation crédits IA',
      admin: 'Valentine (admin)',
      target: 'user_def456',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'ra4',
      action: 'Désactivation kill-switch global',
      admin: 'Jérémy (admin)',
      target: 'Tous les utilisateurs',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  } catch {
    return iso;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [killSwitch, setKillSwitch] = useState<KillSwitchState>({ active: false });
  const [loading, setLoading] = useState(true);
  const [loadingKs, setLoadingKs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kill-switch confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // ── Admin check ──────────────────────────────────────────────────────────
  const isAdmin = isKompilotTeam(user?.email);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    // Demo mode — use simulated data
    if (isDemoActive) {
      setMetrics(DEMO_METRICS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await blink.auth.getValidToken();
      const [metricsRes, ksRes] = await Promise.all([
        fetch(`${API_BASE}/api/command-center/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/command-center/kill-switch/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!metricsRes.ok) throw new Error(`Erreur metrics: ${metricsRes.status}`);
      if (!ksRes.ok) throw new Error(`Erreur kill-switch: ${ksRes.status}`);

      const metricsData = await metricsRes.json();
      const ksData = await ksRes.json();

      setMetrics(metricsData);
      setKillSwitch(ksData);
    } catch (err: any) {
      console.error('Command Center fetch error:', err);
      setError(err?.message || 'Erreur de chargement');
      toast.error('Erreur', { description: 'Impossible de charger les données du Command Center' });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isDemoActive]);

  const refreshKillSwitch = useCallback(async () => {
    if (isDemoActive) return;

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${API_BASE}/api/command-center/kill-switch/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKillSwitch(data);
      }
    } catch {
      // silent
    }
  }, [isDemoActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Kill-switch actions ──────────────────────────────────────────────────
  const handleActivate = async () => {
    if (!reason.trim()) {
      toast.error('Raison requise', { description: 'Veuillez indiquer une raison pour activer le kill-switch.' });
      return;
    }

    setActivating(true);

    // Demo mode — simulate locally
    if (isDemoActive) {
      await new Promise(r => setTimeout(r, 800));
      setKillSwitch({
        active: true,
        reason: reason.trim(),
        activatedAt: new Date().toISOString(),
        activatedBy: user?.email || 'admin',
        targetType: targetUserId.trim() ? 'user' : 'all',
        targetId: targetUserId.trim() || undefined,
      });
      setShowConfirm(false);
      setReason('');
      setTargetUserId('');
      toast.success('Kill-switch activé', {
        description: targetUserId.trim()
          ? `Utilisateur ${targetUserId.trim()} bloqué.`
          : 'Tous les utilisateurs sont maintenant bloqués.',
      });
      setActivating(false);
      return;
    }

    try {
      const token = await blink.auth.getValidToken();
      const body: Record<string, string> = { reason: reason.trim() };
      if (targetUserId.trim()) body.targetUserId = targetUserId.trim();

      const res = await fetch(`${API_BASE}/api/command-center/kill-switch/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setKillSwitch(data);
      setShowConfirm(false);
      setReason('');
      setTargetUserId('');

      toast.success('Kill-switch activé', {
        description: targetUserId.trim()
          ? `Utilisateur ${targetUserId.trim()} bloqué.`
          : 'Tous les utilisateurs sont maintenant bloqués.',
      });
    } catch (err: any) {
      toast.error('Échec', { description: err?.message || "Échec de l'activation" });
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);

    if (isDemoActive) {
      await new Promise(r => setTimeout(r, 600));
      setKillSwitch({ active: false });
      toast.success('Kill-switch désactivé', { description: 'Les utilisateurs peuvent à nouveau accéder à la plateforme.' });
      setDeactivating(false);
      return;
    }

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${API_BASE}/api/command-center/kill-switch/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setKillSwitch(data);
      toast.success('Kill-switch désactivé', { description: 'Les utilisateurs peuvent à nouveau accéder à la plateforme.' });
    } catch (err: any) {
      toast.error('Échec', { description: err?.message || 'Échec de la désactivation' });
    } finally {
      setDeactivating(false);
    }
  };

  // ── Not admin ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Command Center</PageTitle>
          <PageDescription>Centre de contrôle administrateur</PageDescription>
        </PageHeader>
        <PageBody>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Shield size={48} className="text-destructive" />
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-destructive">
                  Accès administrateur requis
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Cette page est réservée aux administrateurs Kompilot.
                  Contactez un admin si vous pensez que cela est une erreur.
                </p>
              </div>
            </CardContent>
          </Card>
        </PageBody>
      </Page>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Command Center</PageTitle>
          <PageDescription>Centre de contrôle administrateur</PageDescription>
        </PageHeader>
        <PageBody>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="skeleton h-48 rounded-xl" />
              <div className="skeleton h-40 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="skeleton h-64 rounded-xl" />
              <div className="skeleton h-40 rounded-xl" />
            </div>
          </div>
        </PageBody>
      </Page>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !metrics) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Command Center</PageTitle>
          <PageDescription>Centre de contrôle administrateur</PageDescription>
        </PageHeader>
        <PageBody>
          <Card className="border-destructive/30">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <AlertTriangle size={48} className="text-destructive" />
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Erreur de chargement</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw size={16} className="mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </PageBody>
      </Page>
    );
  }

  const m = metrics!;
  const ks = killSwitch;

  // Health dot color helper
  const healthDot = (status: ComponentHealth['status']) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-red-500';
    }
  };

  // System status badge
  const systemBadge = (status: SystemHealth['status']) => {
    switch (status) {
      case 'green': return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: 'Opérationnel', icon: Activity };
      case 'yellow': return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'Dégradé', icon: AlertTriangle };
      case 'red': return { color: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Critique', icon: AlertTriangle };
    }
  };

  const sysBadge = systemBadge(m.systemHealth.status);
  const SysIcon = sysBadge.icon;

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Command Center</PageTitle>
            <PageDescription>Supervision système et contrôle d'urgence</PageDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={cn('mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </PageHeader>

      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 page-enter">
          {/* ── LEFT COLUMN (2/3) ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── 1. État du système ──────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Server size={18} className="text-primary" />
                    État du système
                  </CardTitle>
                  <Badge className={cn('border text-xs px-3 py-0.5', sysBadge.color)}>
                    <SysIcon size={12} className="mr-1.5" />
                    {sysBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-5">{m.systemHealth.message}</p>

                {/* Component health grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(m.systemHealth.components).map(([key, comp]) => {
                    const icons: Record<string, React.ReactNode> = {
                      db: <Database size={16} />,
                      ai: <Brain size={16} />,
                      stripe: <CreditCard size={16} />,
                      meta: <Globe size={16} />,
                    };
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="relative">
                          <div className={cn('w-3 h-3 rounded-full', healthDot(comp.status))} />
                          {comp.status === 'degraded' && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-500 animate-ping opacity-30" />
                          )}
                          {comp.status === 'down' && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-30" />
                          )}
                        </div>
                        <span className="text-xs font-medium">{comp.label}</span>
                        {comp.latency !== undefined && (
                          <span className={cn(
                            'text-xs tabular-nums',
                            comp.latency > 200 ? 'text-amber-600' : 'text-muted-foreground',
                          )}>
                            {comp.latency}ms
                          </span>
                        )}
                        <span className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider',
                          comp.status === 'healthy' && 'text-emerald-600',
                          comp.status === 'degraded' && 'text-amber-600',
                          comp.status === 'down' && 'text-red-600',
                        )}>
                          {comp.status === 'healthy' ? 'OK' : comp.status === 'degraded' ? 'LENT' : 'DOWN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Métriques en temps réel ──────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  Métriques en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatGroup>
                  <Stat
                    label="Utilisateurs actifs"
                    value={m.activeUsers.toLocaleString('fr-FR')}
                    icon={<Users size={16} />}
                  />
                  <Stat
                    label="Campagnes"
                    value={m.campaigns.toLocaleString('fr-FR')}
                    icon={<Zap size={16} />}
                  />
                  <Stat
                    label="Posts cette semaine"
                    value={m.postsThisWeek.toLocaleString('fr-FR')}
                  />
                  <Stat
                    label="Messages non lus"
                    value={m.unreadMessages.toLocaleString('fr-FR')}
                  />
                </StatGroup>
              </CardContent>
            </Card>

            {/* ── 3. Health alerts ────────────────────────────────────────── */}
            {m.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-primary" />
                    Alertes système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {m.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border text-sm',
                        alert.level === 'critical'
                          ? 'border-red-500/30 bg-red-500/5 text-red-700'
                          : 'border-amber-500/30 bg-amber-500/5 text-amber-700',
                      )}
                    >
                      <AlertTriangle
                        size={16}
                        className={cn(
                          'shrink-0 mt-0.5',
                          alert.level === 'critical' ? 'text-red-500' : 'text-amber-500',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.source} · {formatRelative(alert.timestamp)}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'text-[10px] shrink-0 border',
                          alert.level === 'critical'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                        )}
                      >
                        {alert.level === 'critical' ? 'CRITIQUE' : 'ATTENTION'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── 4. Quick actions ────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/cockpit'}>
                    <ChevronRight size={14} className="mr-1.5" />
                    Cockpit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/campaigns'}>
                    <ChevronRight size={14} className="mr-1.5" />
                    Campagnes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin'}>
                    <ChevronRight size={14} className="mr-1.5" />
                    Administration
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/analytics'}>
                    <ChevronRight size={14} className="mr-1.5" />
                    Analytics Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/activity'}>
                    <ChevronRight size={14} className="mr-1.5" />
                    Activité Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN (1/3) ─────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* ── 1. KILL-SWITCH PANEL ─────────────────────────────────────── */}
            <Card className={cn(
              'border-2 transition-colors duration-500',
              ks.active
                ? 'border-red-500/60 bg-red-500/[0.03]'
                : 'border-red-300/40',
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield size={18} className={ks.active ? 'text-red-500' : 'text-primary'} />
                  <span className={ks.active ? 'text-red-600' : ''}>Kill-Switch</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Status indicator */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2',
                      ks.active ? 'bg-red-500 border-red-400' : 'bg-emerald-500 border-emerald-400',
                    )} />
                    {ks.active && (
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-40" />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      'text-sm font-bold uppercase tracking-wider',
                      ks.active ? 'text-red-600' : 'text-emerald-600',
                    )}>
                      Kill-switch : {ks.active ? 'ACTIF' : 'INACTIF'}
                    </p>
                    {ks.active && ks.activatedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Activé {formatRelative(ks.activatedAt)}
                        {ks.activatedBy && <> par {ks.activatedBy}</>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Active kill-switch details */}
                {ks.active && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                    {ks.reason && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Raison</p>
                        <p className="text-sm font-medium text-red-700">{ks.reason}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">
                        {ks.targetType === 'user' ? 'UTILISATEUR CIBLE' : 'TOUS LES UTILISATEURS'}
                      </Badge>
                      {ks.targetId && (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{ks.targetId}</code>
                      )}
                    </div>
                  </div>
                )}

                {/* Inactive: activate section */}
                {!ks.active && !showConfirm && (
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-0 h-11"
                    onClick={() => setShowConfirm(true)}
                  >
                    <PowerOff size={16} className="mr-2" />
                    ACTIVER LE KILL-SWITCH
                  </Button>
                )}

                {/* Active: deactivate button */}
                {ks.active && (
                  <Button
                    variant="outline"
                    className="w-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 h-11"
                    onClick={handleDeactivate}
                    disabled={deactivating}
                  >
                    {deactivating ? (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Power size={16} className="mr-2" />
                    )}
                    DÉSACTIVER LE KILL-SWITCH
                  </Button>
                )}

                {/* ── Inline confirmation ───────────────────────────────── */}
                {showConfirm && !ks.active && (
                  <div className="rounded-lg border-2 border-red-500/40 bg-red-500/[0.04] p-4 space-y-4 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Confirmer l'activation</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cette action va bloquer{' '}
                          {targetUserId.trim() ? (
                            <strong>l'utilisateur ciblé ({targetUserId.trim()})</strong>
                          ) : (
                            <strong>tous les utilisateurs</strong>
                          )}
                          . Toutes les campagnes, agents IA et publications seront suspendus.
                          Êtes-vous sûr ?
                        </p>
                      </div>
                    </div>

                    {/* Target user input */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Utilisateur cible (optionnel — laisser vide pour tous)
                      </label>
                      <input
                        type="text"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        placeholder="userId ou email..."
                        className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                      />
                    </div>

                    {/* Reason input */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Raison <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Expliquez la raison de cette action d'urgence..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowConfirm(false);
                          setReason('');
                          setTargetUserId('');
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                        onClick={handleActivate}
                        disabled={activating || !reason.trim()}
                      >
                        {activating ? (
                          <RefreshCw size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <AlertTriangle size={14} className="mr-1.5" />
                        )}
                        Confirmer l'activation
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 2. Dernières actions admin ──────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={18} className="text-primary" />
                  Dernières actions admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                {m.recentActions && m.recentActions.length > 0 ? (
                  <div className="space-y-3">
                    {m.recentActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{action.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.admin} · {formatRelative(action.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune action récente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
