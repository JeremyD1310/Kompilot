import { useState } from 'react';
import { motion } from 'framer-motion';
import { Page, PageBody, Button, Dialog, DialogContent } from '@blinkdotnew/ui';
import {
  PlusCircle, Zap, Star, Inbox, Calendar,
  Clock, ArrowRight, BedDouble, Users, BarChart3, MessageSquare, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate, Navigate } from '@tanstack/react-router';

import { useAuth } from '../hooks/useAuth';
import { useEstablishment } from '../context/EstablishmentContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useDemoView } from '../context/DemoViewContext';
import { useScheduledPosts } from '../lib/scheduledPostsStore';
import { useInboxMessages } from '../hooks/useInboxMessages';
import { useCheckoutReturn } from '../hooks/useCheckoutReturn';
import { useGrowthChecklist } from '../hooks/useGrowthChecklist';

import { DashboardWelcome } from '../components/dashboard/DashboardWelcome';
import { DashboardPageSkeleton } from '../components/dashboard/DashboardSkeletons';
import { CreatePostModal } from '../components/calendar/CreatePostModal';
import { VacationModeModal, type VacationConfig } from '../components/dashboard/VacationModeModal';
import { InteractiveOnboardingWizard } from '../components/onboarding/InteractiveOnboardingWizard';
import { LaMinuteCopilot } from '../components/dashboard/LaMinuteCopilot';
import { MilestoneCelebrationModal } from '../components/dashboard/MilestoneCelebrationModal';
import { GrowthFlightPlan } from '../components/dashboard/GrowthFlightPlan';
import { StatCard } from '../components/dashboard/DashboardStatCard';
import { ActionCard } from '../components/dashboard/DashboardActionCard';

// ── Animation preset ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  useCheckoutReturn();
  const navigate = useNavigate();
  const { isDemoActive, demoData } = useDemoMode();
  const { isAgencyView } = useDemoView();
  const { activeEstablishment } = useEstablishment();
  const { user, isLoading: authLoading } = useAuth();

  // Axe 1 FIX — évite la page blanche en mode agence
  // Un return null ici laisse un écran vide ; Navigate redirige proprement.
  if (isAgencyView) return <Navigate to="/agence/dashboard" />;

  // Show skeleton while auth state resolves — avoids blank white screen
  if (authLoading) return <DashboardPageSkeleton />;
  const growthChecklist = useGrowthChecklist(user?.id);
  const { posts } = useScheduledPosts();
  const { messages } = useInboxMessages();

  // Modal state
  const [vacationOpen, setVacationOpen] = useState(false);
  const [vacationConfig, setVacationConfig] = useState<VacationConfig | null>(null);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillChannels, setPrefillChannels] = useState<string[] | undefined>();
  const [forceOnboardingOpen, setForceOnboardingOpen] = useState(false);
  const [minuteCopilotOpen, setMinuteCopilotOpen] = useState(false);

  const openCreatePost = (text?: string, channels?: string[]) => {
    setPrefillText(text);
    setPrefillChannels(channels);
    setCreatePostOpen(true);
  };

  const handleCreatePostClose = () => {
    setCreatePostOpen(false);
    setTimeout(() => {
      setPrefillText(undefined);
      setPrefillChannels(undefined);
    }, 300);
  };

  // Derived counts
  const today = new Date().toISOString().slice(0, 10);
  const allPosts = isDemoActive ? demoData.posts : (posts ?? []);
  const allMessages = isDemoActive ? demoData.messages : (messages ?? []);

  const scheduledCount = allPosts.filter(
    (p: any) => p.status === 'Planifié' || p.status === 'scheduled',
  ).length;
  const unreadCount = allMessages.filter((m: any) => !m.isRead).length;
  const publishedCount = allPosts.filter(
    (p: any) => p.status === 'Publié' || p.status === 'approved',
  ).length;
  const visibilityScore = (activeEstablishment as any)?.visibilityScore ?? 78;
  const pendingReviews = isDemoActive
    ? demoData.reviews.filter((r: any) => !r.replied).length
    : 2;

  const upcomingPosts = allPosts
    .filter((p: any) => (p.date ?? p.scheduledAt ?? '') >= today || p.status === 'Planifié')
    .slice(0, 3);

  return (
    <Page style={{ background: '#0B1120' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-3.5 border-b border-white/[0.06] bg-[#0B1120]/95 backdrop-blur-sm shrink-0 sticky top-0 z-10">
        <DashboardWelcome />
        <div className="flex items-center gap-2">
          {isDemoActive && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Mode Démo
            </span>
          )}
          <button
            onClick={() => setVacationOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-white/[0.08] rounded-lg px-3 py-1.5 hover:border-white/[0.15] hover:text-foreground transition-all"
          >
            <BedDouble size={13} />
            {vacationConfig ? `Vacances · ${vacationConfig.endDate}` : 'Vacances'}
          </button>
          <Button
            size="sm"
            className="gap-1.5 bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-[0_0_16px_rgba(13,148,136,0.35)] hover:shadow-[0_0_24px_rgba(13,148,136,0.5)] transition-all"
            onClick={() => openCreatePost()}
          >
            <PlusCircle size={14} />
            Nouveau post
          </Button>
        </div>
      </div>

      <PageBody className="px-5 md:px-7 pt-6 pb-12 space-y-8">

        {/* ── Hero KPI grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard index={0} icon={<Calendar size={15} />} value={scheduledCount}
            label="Publications planifiées" href="/calendar" accent="teal" />
          <StatCard index={1} icon={<MessageSquare size={15} />} value={unreadCount}
            label="Messages non lus" href="/inbox" accent={unreadCount > 0 ? 'amber' : 'teal'} />
          <StatCard index={2} icon={<CheckCircle2 size={15} />} value={publishedCount}
            label="Posts publiés (30j)" href="/calendar" accent="emerald" />
          <StatCard index={3} icon={<TrendingUp size={15} />} value={String(visibilityScore)}
            label="Score de visibilité" href="/performance" accent="teal" />
        </div>

        {/* ── Main two-column layout ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Quick actions + Growth plan */}
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <motion.h2
                custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3"
              >
                Actions rapides
              </motion.h2>
              <div className="space-y-2">
                <ActionCard index={5} icon={<Zap size={16} className="text-teal-400" />}
                  label="Créer un post IA" desc="Générez un post optimisé en 10 secondes"
                  onClick={() => navigate({ to: '/cockpit' })} iconBg="bg-teal-500/10" />
                <ActionCard index={6} icon={<Star size={16} className="text-amber-400" />}
                  label="Gérer mes avis" desc={`${pendingReviews} avis en attente de réponse`}
                  onClick={() => navigate({ to: '/reviews' })} badge={pendingReviews} iconBg="bg-amber-500/10" />
                <ActionCard index={7} icon={<Inbox size={16} className="text-teal-400" />}
                  label="Boîte de réception"
                  desc={unreadCount > 0 ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Tous les messages lus'}
                  onClick={() => navigate({ to: '/inbox' })} badge={unreadCount} iconBg="bg-teal-500/10" />
                <ActionCard index={8} icon={<Calendar size={16} className="text-muted-foreground/70" />}
                  label="Calendrier éditorial" desc="Visualisez et planifiez vos publications"
                  onClick={() => navigate({ to: '/calendar' })} iconBg="bg-white/[0.05]" />
              </div>
            </div>

            {!isDemoActive && user && (
              <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
                <GrowthFlightPlan
                  steps={growthChecklist.steps}
                  completedCount={growthChecklist.completedCount}
                  totalCount={growthChecklist.totalCount}
                  allDone={growthChecklist.allDone}
                  isLoading={growthChecklist.isLoading}
                />
              </motion.div>
            )}
          </div>

          {/* RIGHT: Upcoming posts + CTAs */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">

            {/* Prochains posts */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center">
                    <Calendar size={12} className="text-teal-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Prochains posts</span>
                </div>
                <Link to="/calendar">
                  <span className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors">
                    Voir tout <ArrowRight size={11} />
                  </span>
                </Link>
              </div>

              {upcomingPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-7 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Calendar size={18} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
                    Aucun post planifié.<br />Créez votre premier contenu IA.
                  </p>
                  <button
                    onClick={() => navigate({ to: '/cockpit' })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-500/10 hover:bg-teal-500/15 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Zap size={11} /> Générer avec l'IA
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingPosts.map((post: any, i: number) => (
                    <div key={post.id ?? i}
                      className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-1">
                          {post.title ?? post.text ?? 'Post planifié'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                          <Clock size={9} />
                          {post.date ?? post.scheduledAt ?? 'À planifier'}
                          {(post.platform ?? post.channels?.[0]) && <> · {post.platform ?? post.channels?.[0]}</>}
                        </p>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold rounded-full px-2 py-0.5 bg-teal-500/10 text-teal-400">
                        {post.status ?? 'Planifié'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Invite team */}
            <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={16} className="text-muted-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Invitez votre équipe</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
                    Collaborez sur vos publications et répondez aux avis ensemble.
                  </p>
                  <button onClick={() => navigate({ to: '/settings' })}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    Gérer l'équipe <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Performance shortcut */}
            <motion.button custom={11} variants={fadeUp} initial="hidden" animate="visible"
              onClick={() => navigate({ to: '/performance' })}
              className="w-full flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0F172A] p-4 hover:border-white/[0.13] hover:bg-white/[0.03] transition-all group">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <BarChart3 size={16} className="text-teal-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-foreground">Performances détaillées</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Statistiques, portée, engagement</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
            </motion.button>
          </div>
        </div>

      </PageBody>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <CreatePostModal open={createPostOpen} onClose={handleCreatePostClose}
        defaultText={prefillText} defaultChannels={prefillChannels} />

      <VacationModeModal open={vacationOpen} onClose={() => setVacationOpen(false)}
        onActivate={(cfg) => { setVacationConfig(cfg); setVacationOpen(false); }} />

      <Dialog open={minuteCopilotOpen} onOpenChange={setMinuteCopilotOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <LaMinuteCopilot inline
            onSendToCalendar={(text, channels) => { setMinuteCopilotOpen(false); openCreatePost(text, channels); }}
            onDismiss={() => setMinuteCopilotOpen(false)} />
        </DialogContent>
      </Dialog>

      <MilestoneCelebrationModal data={{
        startRank: 14, currentRank: 8,
        joinedMonth: (activeEstablishment as any)?.createdAt?.slice(0, 7) ?? '2025-01',
        avgRating: 4.5, startReviews: 5, currentReviews: 18, copilotReplied: 14,
        primaryKeyword: `${(activeEstablishment as any)?.activity ?? 'commerce'} ${(activeEstablishment as any)?.city ?? 'votre ville'}`,
      }} />

      {!isDemoActive && user && (
        <InteractiveOnboardingWizard
          userId={user?.id ?? ''}
          userSector={(activeEstablishment as any)?.activity ?? (activeEstablishment as any)?.category}
          forceOpen={forceOnboardingOpen}
          onComplete={() => {
            localStorage.setItem(`interactive_wizard_done_${user?.id}`, '1');
            setForceOnboardingOpen(false);
          }}
        />
      )}
    </Page>
  );
}
