import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Page, PageBody, Button, Dialog, DialogContent, toast } from '@blinkdotnew/ui';
import {
  ArrowRight, BarChart3, Building2, CheckCircle2, Clock3, FileText,
  MapPin, MoreHorizontal, PenLine, ShieldCheck, Star, Target, Zap,
} from 'lucide-react';
import { Link, useNavigate, Navigate } from '@tanstack/react-router';

import { useAuth } from '../hooks/useAuth';
import { useEstablishment } from '../context/EstablishmentContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useDemoData } from '../context/DemoDataProvider';
import { useDemoView } from '../context/DemoViewContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useScheduledPosts } from '../lib/scheduledPostsStore';
import { useInboxMessages } from '../hooks/useInboxMessages';
import { useCheckoutReturn } from '../hooks/useCheckoutReturn';
import { DashboardWelcome } from '../components/dashboard/DashboardWelcome';
import { DashboardPageSkeleton } from '../components/dashboard/DashboardSkeletons';
import { CreatePostModal } from '../components/calendar/CreatePostModal';
import { VacationModeModal, type VacationConfig } from '../components/dashboard/VacationModeModal';
import { InteractiveOnboardingWizard } from '../components/onboarding/InteractiveOnboardingWizard';
import { LaMinuteCopilot } from '../components/dashboard/LaMinuteCopilot';
import { MilestoneCelebrationModal } from '../components/dashboard/MilestoneCelebrationModal';
import { OnboardingChecklist } from '../components/dashboard/OnboardingChecklist';
import { ConnectAccountModal } from '../components/dashboard/ConnectAccountModal';
import { B2BExecutiveDashboard } from '../components/dashboard/B2BExecutiveDashboard';
import { acknowledgeDashboardMilestone, fetchDashboardState, saveDashboardActionPreference, type DashboardActionResolution, type RecordedMilestone } from '../lib/dashboardClient';

// One shared cockpit model. Profile changes copy and priorities, not the page architecture.
type CockpitProfile = 'merchant' | 'artisan' | 'agency' | 'network';
type ActionKind = 'review' | 'post' | 'local' | 'message' | 'report';
interface CockpitAction { id: string; title: string; detail: string; benefit: string; time: string; priority: 'Urgent' | 'Important' | 'À suivre'; channel: string; kind: ActionKind; }
interface OperationalKpi { label: string; value: number | null; source: string; syncedAt: string | null; icon: typeof Target; }

const PROFILE_COPY: Record<CockpitProfile, { label: string; summary: string; primary: string }> = {
  merchant: { label: 'Commerçant indépendant', summary: 'Votre présence est suivie. Commencez par les validations qui peuvent aider vos prochains clients à vous choisir.', primary: 'Répondre à un avis Google' },
  artisan: { label: 'Artisan / PME', summary: 'Kompilot vous aide à montrer votre savoir-faire local sans publier à votre place.', primary: 'Préparer une publication' },
  agency: { label: 'Freelance / agence', summary: 'Votre portefeuille est prêt pour une revue rapide des validations et des alertes clients.', primary: 'Valider un contenu client' },
  network: { label: 'Réseau multi-établissements', summary: 'Une vue consolidée vous aide à traiter les anomalies établissement par établissement.', primary: 'Vérifier une fiche locale' },
};

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: (index: number) => ({ opacity: 1, y: 0, transition: { duration: 0.32, delay: index * 0.05 } }) };
const cardClass = 'rounded-2xl border border-border bg-card shadow-sm';
const touchClass = 'min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function getCockpitProfile(isAgency: boolean, clientCount: number | null, sector: string | null, demoProfile?: string): CockpitProfile {
  if (demoProfile === 'network' || clientCount && clientCount > 1) return 'network';
  if (demoProfile === 'agency' || isAgency) return 'agency';
  if (demoProfile === 'artisan' || sector === 'autre') return 'artisan';
  return 'merchant';
}

function ActionRow({ action, onPrimary, onSnooze, onIgnore }: { action: CockpitAction; onPrimary: () => void; onSnooze: () => void; onIgnore: () => void }) {
  const tone = action.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : action.priority === 'Important' ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground';
  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3 transition hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${tone}`}>{action.priority}</span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{action.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{action.channel} · {action.detail}</p>
          <p className="mt-1 text-xs font-semibold text-primary">Bénéfice attendu : {action.benefit} · {action.time}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
        <Button size="sm" onClick={onPrimary} className="gap-1.5"><span className="hidden sm:inline">Ouvrir</span><ArrowRight size={14} /></Button>
        <button type="button" onClick={onSnooze} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Reporter ${action.title}`} title="Reporter"><Clock3 size={15} /></button>
        <button type="button" onClick={onIgnore} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Ignorer ${action.title}`} title="Ignorer"><MoreHorizontal size={15} /></button>
      </div>
    </article>
  );
}

function ActionSection({ title, description, actions, emptyLabel, onPrimary, onResolve }: { title: string; description: string; actions: CockpitAction[]; emptyLabel: string; onPrimary: (action: CockpitAction) => void; onResolve: (id: string, resolution: DashboardActionResolution) => void }) {
  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-black text-foreground">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{actions.length}</span></div>
      <div className="space-y-2">{actions.length ? actions.map(action => <ActionRow key={action.id} action={action} onPrimary={() => onPrimary(action)} onSnooze={() => onResolve(action.id, 'snoozed')} onIgnore={() => onResolve(action.id, 'ignored')} />) : <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{emptyLabel}</div>}</div>
    </section>
  );
}

function formatSyncDate(value: string | null) {
  if (!value) return 'Non synchronisé';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Non synchronisé' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function OperationalKpiCard({ metric, establishment }: { metric: OperationalKpi; establishment: string }) {
  const Icon = metric.icon;
  return (
    <article className="rounded-xl bg-secondary/60 p-3">
      <Icon size={16} className="text-primary" />
      <p className="mt-3 text-xl font-black text-foreground">{metric.value === null ? '—' : metric.value}</p>
      <p className="mt-1 text-[11px] font-bold leading-4 text-foreground">{metric.label}</p>
      <dl className="mt-2 space-y-0.5 text-[10px] leading-4 text-muted-foreground">
        <div><dt className="inline font-semibold">Source : </dt><dd className="inline">{metric.source}</dd></div>
        <div><dt className="inline font-semibold">Établissement : </dt><dd className="inline">{establishment}</dd></div>
        <div><dt className="inline font-semibold">Actualisé : </dt><dd className="inline">{formatSyncDate(metric.syncedAt)}</dd></div>
      </dl>
    </article>
  );
}

export default function DashboardPage() {
  useCheckoutReturn();
  const navigate = useNavigate();
  const { isDemoActive } = useDemoMode();
  const demo = useDemoData();
  const { isAgencyView } = useDemoView();
  const { activeEstablishment, dataOrigin, lastSyncedAt } = useEstablishment();
  const { user, isLoading: authLoading } = useAuth();
  const { isAgency, clientCount, sector } = useUserProfile();
  const { subscriptionStatus } = useSubscription();
  const { posts, isSynced: postsSynced } = useScheduledPosts(user?.id);
  const { messages, isLoading: messagesLoading } = useInboxMessages();

  const [dismissed, setDismissed] = useState<string[]>([]);
  const [vacationOpen, setVacationOpen] = useState(false);
  const [vacationConfig, setVacationConfig] = useState<VacationConfig | null>(null);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillChannels, setPrefillChannels] = useState<string[] | undefined>();
  const [minuteCopilotOpen, setMinuteCopilotOpen] = useState(false);
  const [connectAccountOpen, setConnectAccountOpen] = useState(false);
  const [forceOnboardingOpen, setForceOnboardingOpen] = useState(false);
  const [recordedMilestone, setRecordedMilestone] = useState<RecordedMilestone | null>(null);

  useEffect(() => {
    if (!user?.id || isDemoActive) return;
    let cancelled = false;
    fetchDashboardState()
      .then(state => {
        if (cancelled) return;
        const now = Date.now();
        const hidden = state.preferences
          .filter(item => item.resolution === 'ignored' || (item.snoozedUntil && Date.parse(item.snoozedUntil) > now))
          .map(item => item.actionId);
        setDismissed(hidden);
        setRecordedMilestone(state.milestone);
      })
      .catch(() => {
        // The versioned DB migration may not be applied yet. Never fabricate state.
      });
    return () => { cancelled = true; };
  }, [isDemoActive, user?.id]);

  if (isDemoActive) return <Navigate to="/demo/workspace" />;
  if (isAgencyView) return <Navigate to="/agence/dashboard" />;
  if (authLoading) return <DashboardPageSkeleton />;

  const openCreatePost = (text?: string, channels?: string[]) => { setPrefillText(text); setPrefillChannels(channels); setCreatePostOpen(true); };
  const removeAction = (id: string, resolution: DashboardActionResolution) => {
    const label = resolution === 'snoozed' ? 'reportée' : 'ignorée';
    const snoozedUntil = resolution === 'snoozed' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
    setDismissed(previous => [...new Set([...previous, id])]);
    saveDashboardActionPreference(id, resolution, snoozedUntil)
      .then(() => toast.success(`Action ${label}`, { description: resolution === 'snoozed' ? 'Elle réapparaîtra dans 24 heures.' : 'La préférence est enregistrée sur votre compte.' }))
      .catch(() => {
        setDismissed(previous => previous.filter(item => item !== id));
        toast.error('Préférence non enregistrée', { description: 'L’action reste visible. Vérifiez la migration Dashboard.' });
      });
  };
  const openAction = (action: CockpitAction) => {
    if (isDemoActive) {
      if (action.kind === 'review') demo.simulateReplyReview();
      else if (action.kind === 'post') demo.simulateCreatePost(PROFILE_COPY[profile].primary);
      else if (action.kind === 'message') demo.simulateSendMessage();
      else demo.simulateAction(`${action.title} ouverte`);
      toast.success('Simulation locale enregistrée', { description: 'Aucun service externe n’a été appelé.' });
      return;
    }
    if (action.kind === 'post') openCreatePost();
    else if (action.kind === 'review') navigate({ to: '/reviews' });
    else if (action.kind === 'message') navigate({ to: '/inbox' });
    else if (action.kind === 'local') navigate({ to: '/seo-local' });
    else navigate({ to: '/performance' });
  };

  const profile = getCockpitProfile(isAgency, clientCount, sector, isDemoActive ? demo.profile : undefined);
  const copy = PROFILE_COPY[profile];
  const unread = messagesLoading ? null : (messages ?? []).filter((item: any) => !item.isRead).length;
  const pendingReviews = dataOrigin === 'database' && activeEstablishment?.pendingReviewsAvailable ? activeEstablishment.pendingReviews : null;
  const allPosts = postsSynced ? (posts ?? []) : [];
  const actions = ([
    { id: 'review', title: 'Répondre à un nouvel avis Google', detail: pendingReviews === null ? 'Source Google Business non synchronisée' : `${pendingReviews} avis en attente`, benefit: 'entretenir la confiance locale', time: '3 min', priority: pendingReviews ? 'Urgent' : 'À suivre', channel: 'Réputation', kind: 'review' },
    { id: 'post', title: profile === 'agency' ? 'Valider le contenu d’un client' : 'Préparer une publication locale', detail: postsSynced ? `${allPosts.length} contenu${allPosts.length > 1 ? 's' : ''} dans le cockpit` : 'Planificateur non synchronisé', benefit: 'rester visible avec un contenu relu', time: '5 min', priority: 'Important', channel: 'Contenus', kind: 'post' },
    { id: 'local', title: 'Vérifier une information locale', detail: activeEstablishment?.name ?? demo.data.establishment, benefit: 'éviter une information incohérente', time: '4 min', priority: profile === 'network' ? 'Urgent' : 'À suivre', channel: 'Visibilité locale', kind: 'local' },
    { id: 'message', title: 'Consulter un message sans réponse', detail: unread === null ? 'Messagerie en cours de synchronisation' : `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}`, benefit: 'ne pas laisser passer une demande', time: '2 min', priority: unread ? 'Important' : 'À suivre', channel: 'Messages', kind: 'message' },
  ] satisfies CockpitAction[]).filter(item => !dismissed.includes(item.id));

  const todayActions = actions.slice(0, 2);
  const prepared = actions.filter(item => item.kind === 'post' || item.kind === 'local');
  const validation = actions.filter(item => item.kind === 'review' || item.kind === 'message');
  const pendingValidations = [pendingReviews, unread, postsSynced ? allPosts.filter(item => item.status === 'Brouillon').length : null]
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);
  const hasAtLeastOneOperationalSource = pendingReviews !== null || unread !== null || postsSynced;
  const operationalKpis: OperationalKpi[] = [
    { label: 'Validations en attente', value: hasAtLeastOneOperationalSource ? pendingValidations : null, source: 'Avis, messagerie et planificateur connectés', syncedAt: null, icon: CheckCircle2 },
    { label: 'Publications échouées', value: null, source: 'Diffuseur social', syncedAt: null, icon: PenLine },
    { label: 'Avis sans réponse', value: pendingReviews, source: pendingReviews === null ? 'Google Business à connecter' : 'Google Business', syncedAt: pendingReviews === null ? null : lastSyncedAt, icon: Star },
    { label: 'Prospects qualifiés', value: null, source: 'Attribution/CRM à connecter', syncedAt: null, icon: Target },
  ];

  return (
    <Page>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
        <DashboardWelcome />
        <div className="flex items-center gap-2"><span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary sm:inline-flex">{copy.label}</span><button type="button" onClick={() => setVacationOpen(true)} className={`${touchClass} hidden border border-border text-muted-foreground sm:inline-flex`}>{vacationConfig ? `Vacances · ${vacationConfig.endDate}` : 'Vacances'}</button><Button size="sm" onClick={() => openCreatePost()} className="gap-1.5"><PenLine size={14} /> Créer</Button></div>
      </div>
      <PageBody className="space-y-6 px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2 text-xs font-bold text-primary"><Building2 size={14} />{isDemoActive ? demo.data.establishment : activeEstablishment?.name ?? 'Votre établissement'}<span className="text-muted-foreground">·</span><span className="text-muted-foreground">Aujourd’hui</span></div><p className="mt-2 max-w-3xl text-sm leading-6 text-foreground">{copy.summary}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">{actions.length} action{actions.length > 1 ? 's' : ''} nécessite{actions.length > 1 ? 'nt' : ''} votre validation humaine.</p></div><Button onClick={() => document.getElementById('priority-actions')?.scrollIntoView({ behavior: 'smooth' })} className="w-full gap-2 sm:w-auto">Voir mes actions prioritaires <ArrowRight size={15} /></Button></div></section>

        <B2BExecutiveDashboard establishmentName={activeEstablishment?.name ?? 'Votre établissement'} />

        <div id="priority-actions" className="grid gap-4 xl:grid-cols-2">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"><ActionSection title="À faire aujourd’hui" description="Les prochaines actions utiles, triées par priorité." actions={todayActions} emptyLabel="Tout est à jour pour le moment." onPrimary={openAction} onResolve={removeAction} /></motion.div>
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"><ActionSection title="Préparé par Kompilot" description="L’IA prépare, vous relisez avant toute diffusion." actions={prepared} emptyLabel="Aucune suggestion préparée." onPrimary={openAction} onResolve={removeAction} /></motion.div>
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"><ActionSection title="En attente de validation" description="Rien n’est publié ou envoyé sans votre accord." actions={validation} emptyLabel="Aucune validation en attente." onPrimary={openAction} onResolve={removeAction} /></motion.div>
          <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible" className={`${cardClass} p-4 sm:p-5`}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-black text-foreground">Indicateurs opérationnels</h2><p className="mt-1 text-xs text-muted-foreground">Une valeur absente reste explicitement non synchronisée.</p></div><Link to="/performance" className="text-xs font-bold text-primary hover:underline">Voir le rapport</Link></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{operationalKpis.map(metric => <OperationalKpiCard key={metric.label} metric={metric} establishment={activeEstablishment?.name ?? 'Non sélectionné'} />)}</div><div className="mt-4 flex flex-wrap gap-2"><Link to="/performance" className={`${touchClass} inline-flex items-center gap-2 border border-border text-foreground`}><BarChart3 size={15} /> Rapport détaillé</Link><button type="button" onClick={() => toast('Rapport prêt à être partagé', { description: 'L’envoi reste soumis à votre validation.' })} className={`${touchClass} inline-flex items-center gap-2 text-primary`}><FileText size={15} /> Préparer un rapport</button></div></motion.section>
        </div>

        <section className="grid gap-3 md:grid-cols-3"><Link to="/cockpit" className={`${cardClass} group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-primary/40`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Zap size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">Contenus</strong><span className="text-xs text-muted-foreground">Créer, calendrier et bibliothèque</span></span><ArrowRight size={15} className="text-muted-foreground transition group-hover:text-primary" /></Link><Link to="/reviews" className={`${cardClass} group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-primary/40`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><ShieldCheck size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">Réputation</strong><span className="text-xs text-muted-foreground">Avis et réponses suggérées</span></span><ArrowRight size={15} className="text-muted-foreground transition group-hover:text-primary" /></Link><Link to="/establishments" className={`${cardClass} group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-primary/40`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"><MapPin size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">Établissements</strong><span className="text-xs text-muted-foreground">Changer de fiche ou de portefeuille</span></span><ArrowRight size={15} className="text-muted-foreground transition group-hover:text-primary" /></Link></section>

        {isDemoActive && (
          <section className={`${cardClass} flex flex-col gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <p className="text-sm font-black text-foreground">Mode démonstration</p>
              <p className="mt-1 text-xs text-muted-foreground">Les validations et résultats restent locaux. Aucun service externe n’est appelé.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { demo.resetDemo(); setDismissed([]); }}>Réinitialiser la démo</Button>
              <Link to="/signup" className={`${touchClass} inline-flex items-center gap-2 bg-primary text-primary-foreground`}>Créer mon espace <ArrowRight size={14} /></Link>
            </div>
          </section>
        )}

        {user && <OnboardingChecklist onConnectAccount={() => setConnectAccountOpen(true)} onCreatePost={() => openCreatePost()} hasEstablishment={dataOrigin === 'database'} billingActive={subscriptionStatus === 'active'} firstContentApproved={postsSynced && allPosts.some(item => item.status === 'Approuvé')} hasMeasuredResult={Boolean(recordedMilestone?.recordedAt)} />}
      </PageBody>

      <CreatePostModal open={createPostOpen} onClose={() => { setCreatePostOpen(false); setPrefillText(undefined); setPrefillChannels(undefined); }} defaultText={prefillText} defaultChannels={prefillChannels} />
      <VacationModeModal open={vacationOpen} onClose={() => setVacationOpen(false)} onActivate={config => { setVacationConfig(config); setVacationOpen(false); }} />
      <Dialog open={minuteCopilotOpen} onOpenChange={setMinuteCopilotOpen}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto"><LaMinuteCopilot inline onSendToCalendar={(text, channels) => { setMinuteCopilotOpen(false); openCreatePost(text, channels); }} onDismiss={() => setMinuteCopilotOpen(false)} /></DialogContent></Dialog>
      {recordedMilestone && <MilestoneCelebrationModal data={recordedMilestone.data} recordedEventId={recordedMilestone.id} recordedAt={recordedMilestone.recordedAt} onAcknowledged={async eventId => { await acknowledgeDashboardMilestone(eventId); setRecordedMilestone(null); }} />}
      <ConnectAccountModal open={connectAccountOpen} onClose={() => setConnectAccountOpen(false)} />
      {!isDemoActive && user && <InteractiveOnboardingWizard userId={user.id} userSector={activeEstablishment?.category} forceOpen={forceOnboardingOpen} onComplete={() => { localStorage.setItem(`interactive_wizard_done_${user.id}`, '1'); setForceOnboardingOpen(false); }} />}
    </Page>
  );
}
