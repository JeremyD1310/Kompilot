/**
 * PresenceDetailPage — Fiche détail d'une présence.
 *
 * Affiche : type (check-in/out), date, heure, durée, notes,
 * et un lien de retour vers l'historique.
 */
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Skeleton,
} from '@blinkdotnew/ui';
import {
  LogIn, LogOut, Clock, Calendar, FileText, ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/shared/DashboardErrorBoundary';
import { usePresenceDetail } from '@/hooks/usePresences';
import { Link } from '@tanstack/react-router';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function PresenceDetailContent() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? null;

  const { data: presence, isLoading, isError, error } = usePresenceDetail(id);

  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex items-center gap-3">
          <Link to="/presences">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Clock size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>Détail de la présence</PageTitle>
            <PageDescription>
              {presence
                ? `${presence.type === 'check_in' ? 'Arrivée' : 'Départ'} du ${formatDate(presence.timestamp)}`
                : 'Chargement…'}
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-16 w-2/3 rounded-xl" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col items-center gap-3">
            <AlertCircle size={32} className="text-destructive" />
            <p className="text-sm font-bold text-destructive">Erreur de chargement</p>
            <p className="text-xs text-destructive/80">
              {error instanceof Error ? error.message : 'Impossible de charger cette présence.'}
            </p>
            <Link to="/presences">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft size={14} />
                Retour aux présences
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !isError && presence && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Type badge */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    presence.type === 'check_in'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {presence.type === 'check_in' ? <LogIn size={24} /> : <LogOut size={24} />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    {presence.type === 'check_in' ? 'Arrivée' : 'Départ'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(presence.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            {/* Infos grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailCard
                icon={<Clock size={16} className="text-primary" />}
                iconBg="bg-primary/10"
                label="Heure exacte"
                value={formatTime(presence.timestamp)}
              />
              <DetailCard
                icon={<Calendar size={16} className="text-primary" />}
                iconBg="bg-primary/10"
                label="Date"
                value={formatDate(presence.timestamp)}
              />
              {presence.type === 'check_out' && presence.durationMinutes > 0 && (
                <DetailCard
                  icon={<LogIn size={16} className="text-emerald-600" />}
                  iconBg="bg-emerald-100"
                  label="Durée"
                  value={formatDuration(presence.durationMinutes)}
                />
              )}
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-primary" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
              </div>
              {presence.notes ? (
                <p className="text-sm text-foreground italic leading-relaxed">
                  « {presence.notes} »
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Aucune note enregistrée pour cette présence.
                </p>
              )}
            </div>

            {/* Back link */}
            <div className="flex justify-start">
              <Link to="/presences">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft size={14} />
                  Retour à l'historique
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </PageBody>
    </Page>
  );
}

// ── Detail Card ───────────────────────────────────────────────────────────────

function DetailCard({
  icon, iconBg, label, value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-base font-extrabold text-foreground">{value}</p>
    </div>
  );
}

// ── Exported with Error Boundary ──────────────────────────────────────────────

export default function PresenceDetailPage() {
  return (
    <DashboardErrorBoundary pageName="Détail Présence">
      <PresenceDetailContent />
    </DashboardErrorBoundary>
  );
}
