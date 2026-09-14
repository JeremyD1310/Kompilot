/**
 * PresencesPage — Dashboard de présence d'équipe
 *
 * Permet de :
 * - Marquer son arrivée / départ (check-in / check-out)
 * - Visualiser l'historique des présences
 * - Filtrer par date
 * - Exporter au format CSV
 *
 * Optimisé avec React Query (stale-while-revalidate, cache, retry).
 * Enveloppé dans DashboardErrorBoundary pour la résilience.
 */
import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  PageActions, Button, toast,
} from '@blinkdotnew/ui';
import {
  LogIn, LogOut, Download, Trash2, Clock, UserCheck,
  Calendar, RefreshCw, Loader2, AlertCircle,
  ArrowUpDown, Eye,
} from 'lucide-react';
import { blink } from '@/blink/client';
import { DashboardErrorBoundary } from '@/components/shared/DashboardErrorBoundary';
import {
  usePresences, useMarkPresence, useDeletePresence,
  type PresenceRecord,
} from '@/hooks/usePresences';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Skeleton Loader ─────────────────────────────────────────────────────────

function PresenceSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="w-1/3 h-3 rounded bg-muted animate-pulse" />
            <div className="w-1/4 h-2.5 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function PresencesPageContent() {
  const [filterDate, setFilterDate] = useState(getToday());
  const [notes, setNotes] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  // ── React Query hooks ──────────────────────────────────────────────────
  const {
    data: presences = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePresences(filterDate);

  const markPresenceMutation = useMarkPresence();
  const deletePresenceMutation = useDeletePresence();

  // ── Mark presence ───────────────────────────────────────────────────────
  const markPresence = useCallback(
    async (type: 'check_in' | 'check_out') => {
      try {
        await markPresenceMutation.mutateAsync({
          type,
          notes: notes.trim() || undefined,
        });
        const label = type === 'check_in' ? 'Arrivée enregistrée' : 'Départ enregistré';
        toast.success(label, {
          description: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        });
        setNotes('');
      } catch (err) {
        toast.error('Erreur', {
          description: err instanceof Error ? err.message : "Échec de l'enregistrement",
        });
      }
    },
    [notes, markPresenceMutation],
  );

  // ── Delete presence ─────────────────────────────────────────────────────
  const deletePresence = useCallback(
    async (id: string) => {
      try {
        await deletePresenceMutation.mutateAsync(id);
        toast.success('Présence supprimée');
      } catch (err) {
        toast.error('Erreur', {
          description: err instanceof Error ? err.message : 'Impossible de supprimer',
        });
      }
    },
    [deletePresenceMutation],
  );

  // ── CSV Export ──────────────────────────────────────────────────────────
  const exportCSV = useCallback(async () => {
    try {
      const token = await blink.auth.getValidToken();
      const url = `${BACKEND_URL}/api/presences/export${filterDate ? `?date=${filterDate}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `presences-${filterDate || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Export CSV téléchargé');
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : "Échec de l'export",
      });
    }
  }, [filterDate]);

  // ── Computed (memoized) ─────────────────────────────────────────────────
  const sorted = useMemo(
    () =>
      [...presences].sort((a, b) => {
        const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return sortAsc ? diff : -diff;
      }),
    [presences, sortAsc],
  );

  const kpi = useMemo(() => {
    const todayRows = presences.filter((p) => p.date === filterDate);
    const checkIns = todayRows.filter((p) => p.type === 'check_in').length;
    const checkOuts = todayRows.filter((p) => p.type === 'check_out').length;
    const totalMin = todayRows.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);
    return { checkIns, checkOuts, totalMin };
  }, [presences, filterDate]);

  const isCheckedIn =
    presences.length > 0 &&
    presences[0].date === getToday() &&
    presences[0].type === 'check_in';

  const isRecording = markPresenceMutation.isPending;
  const isDeleting = deletePresenceMutation.isPending;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <UserCheck size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>Présences</PageTitle>
            <PageDescription>
              Enregistrez et suivez les présences de votre équipe
            </PageDescription>
          </div>
        </div>
        <PageActions>
          <Button variant="outline" onClick={exportCSV} className="h-9 gap-2 text-xs font-semibold">
            <Download size={14} />
            Exporter CSV
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* ── KPI cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            icon={<LogIn size={14} className="text-emerald-600" />}
            iconBg="bg-emerald-100"
            label="Arrivées aujourd'hui"
            value={kpi.checkIns}
            delay={0}
          />
          <KpiCard
            icon={<LogOut size={14} className="text-rose-600" />}
            iconBg="bg-rose-100"
            label="Départs aujourd'hui"
            value={kpi.checkOuts}
            delay={0.05}
          />
          <KpiCard
            icon={<Clock size={14} className="text-primary" />}
            iconBg="bg-primary/10"
            label="Temps total aujourd'hui"
            value={formatDuration(kpi.totalMin)}
            delay={0.1}
          />
        </div>

        {/* ── Mark presence ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-primary" />
            Marquer ma présence
          </h3>

          {isCheckedIn ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <LogIn size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Vous êtes arrivé(e) aujourd'hui
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {formatTime(presences[0]?.timestamp || '')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:w-48">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note (optionnelle)"
                  className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <Button
                  onClick={() => markPresence('check_out')}
                  disabled={isRecording}
                  className="w-full h-9 gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {isRecording ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                  Marquer mon départ
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note (optionnelle)"
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <Button
                onClick={() => markPresence('check_in')}
                disabled={isRecording}
                className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 px-6"
              >
                {isRecording ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                Marquer mon arrivée
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── Filter + refresh bar ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <button
            onClick={() => setFilterDate('')}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Voir toutes les dates
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpDown size={12} />
            {sortAsc ? 'Plus ancien' : 'Plus récent'}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </div>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-2">
            <AlertCircle size={15} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">
                Erreur de chargement
              </p>
              <p className="text-[11px] text-destructive/80">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────────────── */}
        {isLoading && <PresenceSkeleton />}

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {!isLoading && !isError && sorted.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <UserCheck size={22} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Aucune présence enregistrée
            </p>
            <p className="text-xs text-muted-foreground">
              {filterDate
                ? `Aucune activité le ${formatDate(filterDate)}`
                : "Marquez votre arrivée pour commencer"}
            </p>
          </div>
        )}

        {/* ── Presence list ───────────────────────────────────────────── */}
        {!isLoading && !isError && sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map((presence, i) => (
              <motion.div
                key={presence.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-all duration-200"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    presence.type === 'check_in'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {presence.type === 'check_in' ? <LogIn size={16} /> : <LogOut size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {presence.type === 'check_in' ? 'Arrivée' : 'Départ'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        presence.type === 'check_in'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {formatTime(presence.timestamp)}
                    </span>
                    {presence.durationMinutes > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        {formatDuration(presence.durationMinutes)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(presence.timestamp)}
                    </span>
                    {presence.notes && (
                      <span className="text-[11px] text-muted-foreground/70 italic truncate max-w-[200px]">
                        « {presence.notes} »
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to="/presences/$id"
                  params={{ id: presence.id }}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Voir les détails"
                >
                  <Eye size={14} />
                </Link>
                <button
                  onClick={() => deletePresence(presence.id)}
                  disabled={isDeleting}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-0"
                  title="Supprimer"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  );
}

// ── KPI Card sub-component (memoized) ────────────────────────────────────────

function KpiCard({
  icon, iconBg, label, value, delay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
    </motion.div>
  );
}

// ── Exported with Error Boundary ─────────────────────────────────────────────

export default function PresencesPage() {
  return (
    <DashboardErrorBoundary pageName="Présences">
      <PresencesPageContent />
    </DashboardErrorBoundary>
  );
}
