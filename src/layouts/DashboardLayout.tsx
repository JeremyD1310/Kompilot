import React, { useEffect, useState } from 'react';
import { AppShell, AppShellMain, Button, cn } from '@blinkdotnew/ui';
import { Eye, X, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { CreatePostModal } from '../components/calendar/CreatePostModal';
import { useSubscription } from '../context/SubscriptionContext';
import { AIChatWidget } from '../components/layout/AIChatWidget';
import { SupportChatWidget } from '../components/layout/SupportChatWidget';
import { GuidedTour } from '../components/layout/GuidedTour';
import { useAdmin } from '../context/AdminContext';
import { ClosureAlertModal } from '../components/dashboard/ClosureAlertModal';
import { NotificationToast } from '../components/layout/NotificationToast';
import { useNotifications } from '../context/NotificationsContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useEstablishment } from '../context/EstablishmentContext';
import {
  getPaymentFailed,
  setPaymentFailed,
  getSubscriptionStatus,
} from '../lib/billingStorage';
import { fireMentorTrigger } from '../hooks/useMentorTriggers';
import { ChangePaymentMethodModal } from '../components/subscription/ChangePaymentMethodModal';
import { OnboardingGuideModal, useOnboardingGuideModal } from '../components/onboarding/OnboardingGuideModal';
import { ExhaustiveOnboardingModal, useExhaustiveOnboarding } from '../components/onboarding/ExhaustiveOnboardingModal';
import { QuickOnboardingWizard } from '../components/onboarding/QuickOnboardingWizard';
import { SectorWalkthroughEngine } from '../components/onboarding/SectorWalkthroughEngine';
import { useUserProfile } from '../context/UserProfileContext';
import { AuditFlashModal } from '../components/dashboard/AuditFlashModal';
import { ProactiveNotificationBanner } from '../components/layout/ProactiveNotificationBanner';
import { ExternalApiOutageBanner } from '../components/layout/ExternalApiOutageBanner';
import { SOSResumeBanner } from '../components/cockpit/SOSResumeBanner';
import { SubscriptionStatusBanner } from '../components/subscription/SubscriptionStatusBanner';
import { DemoBanner } from '../components/layout/DemoBanner';
import { DemoExhaustedModal } from '../components/subscription/DemoExhaustedModal';
import { TrialEndModal } from '../components/subscription/TrialEndModal';
import { DisplayMode } from '../components/layout/DisplayMode';

// ── Extracted layout components ──────────────────────────────────────────────
import { AppFooter } from '../components/layout/AppFooter';
import { DailyRefundToast } from '../components/layout/DailyRefundToast';
import { PWABanner } from '../components/layout/PWABanner';
import { OfflineBanner } from '../components/layout/OfflineBanner';
import { WhatsAppSupportButton } from '../components/shared/WhatsAppSupportButton';
import { AcademyContextualToast } from '../components/academy/AcademyContextualToast';
import { useCredits } from '../context/CreditsContext';
import { useBYOK } from '../context/BYOKContext';
import { CreditsTopUpModal } from '../components/subscription/CreditsTopUpModal';
import { HelpSidebarPanel, HelpButton } from '../components/layout/HelpSidebarPanel';
import { DashboardSidebar } from './DashboardSidebar';
import { useAuthExpiredToast } from '../hooks/useAuthExpiredToast';
import { DashboardTopbar } from './DashboardTopbar';
import { MentorCopilote } from '../components/layout/MentorCopilote';
import { GuardrailQueueProvider } from '../context/GuardrailQueueContext';
import { GuardrailQueuePanel, GuardrailQueueTrigger } from '../components/guardrail/GuardrailQueuePanel';
import { MentorOneTapBar, MentorOneTapTrigger } from '../components/layout/MentorOneTapBar';
import PremiumWinProvider from '../components/shared/PremiumWinEngine';
import { ROIPushEngine } from '../components/layout/ROIPushEngine';
import { CommandMenu } from '../components/layout/CommandMenu';
import { DemoNotificationEngine } from '../components/layout/DemoNotificationEngine';
import { DemoViewRedirector } from '../components/layout/DemoViewRedirector';
import { AlertSettingsProvider } from '../context/AlertSettingsContext';
import { FirebaseProvider } from '../components/firebase/FirebaseProvider';
import { useFirebaseAnalytics } from '../hooks/useFirebaseAnalytics';
import { LaunchChecklistWidget } from '../components/dashboard/LaunchChecklistWidget';

function CreditsExhaustedBanner() {
  const { isEmpty } = useCredits();
  const { hasValidOpenAIKey } = useBYOK();
  const [topUpOpen, setTopUpOpen] = useState(false);
  if (!isEmpty || hasValidOpenAIKey) return null;
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800/50">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-red-500 animate-pulse shrink-0" />
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
            Crédits épuisés — Les fonctionnalités IA sont temporairement bloquées.
          </p>
        </div>
        <button
          onClick={() => setTopUpOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          <Zap size={11} className="fill-white" /> Recharger mes crédits
        </button>
      </div>
      <CreditsTopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
}

export function DashboardLayout() {
  const { user } = useAuth();
  const { subscriptionStatus, isAgentEnabled } = useSubscription();
  const location = useLocation();

  // Intercepte les 401 globaux et affiche un toast discret au lieu de crasher
  useAuthExpiredToast();
  const currentPath = location.pathname;

  // Firebase Analytics — auto page view tracking
  useFirebaseAnalytics();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [closureAlertOpen, setClosureAlertOpen] = useState(false);
  const [paymentFailed, setPaymentFailedState] = useState(() => getPaymentFailed());
  const [changePaymentOpen, setChangePaymentOpen] = useState(false);
  const { impersonatedClient, stopImpersonating } = useAdmin();
  const { isDemoCreditsExhausted } = useDemoMode();
  const [demoExhaustedOpen, setDemoExhaustedOpen] = useState(false);
  const [trialEndOpen, setTrialEndOpen] = useState(false);

  useEffect(() => {
    if (isDemoCreditsExhausted) {
      const shown = sessionStorage.getItem('demo_exhausted_shown');
      if (!shown) {
        setDemoExhaustedOpen(true);
        sessionStorage.setItem('demo_exhausted_shown', '1');
      }
    }
  }, [isDemoCreditsExhausted]);

  const { isSwitching } = useEstablishment();
  const { onboardingCompleted, markOnboardingCompleted, masterProfile } = useUserProfile();
  const [smartWizardOpen, setSmartWizardOpen] = useState(() => !onboardingCompleted);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const { show: showGuide, close: closeGuide } = useOnboardingGuideModal(user?.id);
  const { show: showOnboarding, close: closeOnboarding } = useExhaustiveOnboarding(user?.id);
  const [auditFlashOpen, setAuditFlashOpen] = useState(false);
  const [displayModeOpen, setDisplayModeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [oneTapOpen, setOneTapOpen] = useState(false);
  const { latestToast, clearToast } = useNotifications();

  useEffect(() => {
    if (!onboardingCompleted && masterProfile && localStorage.getItem('walkthrough_shown') !== '1') {
      setWalkthroughOpen(true);
      localStorage.setItem('walkthrough_shown', '1');
    }
  }, [onboardingCompleted, masterProfile]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('kompilot_sidebar_collapsed') === '1'; } catch { return false; }
  });

  const toggleSidebar = () => setSidebarCollapsed(v => {
    const next = !v;
    try { localStorage.setItem('kompilot_sidebar_collapsed', next ? '1' : '0'); } catch {}
    return next;
  });

  // ── Global Ctrl+Shift+K / Cmd+Shift+K → open AI Copilot ───────────────────
  // Note: plain Cmd+K is now owned by <CommandMenu />
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('kompilot:open-chat'));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Billing mentor triggers ─────────────────────────────────────────────────
  useEffect(() => {
    if (paymentFailed && !sessionStorage.getItem('mentor_payment_failed_shown')) {
      sessionStorage.setItem('mentor_payment_failed_shown', '1');
      const t = setTimeout(() => fireMentorTrigger('payment_failed'), 3000);
      return () => clearTimeout(t);
    }
  }, [paymentFailed]);

  useEffect(() => {
    if (
      (subscriptionStatus === 'cancelled' || subscriptionStatus === 'unpaid') &&
      !sessionStorage.getItem('mentor_cancelled_shown')
    ) {
      sessionStorage.setItem('mentor_cancelled_shown', '1');
      const t = setTimeout(() => fireMentorTrigger('subscription_cancelled'), 2000);
      return () => clearTimeout(t);
    }
  }, [subscriptionStatus]);

  return (
    <FirebaseProvider>
    <AlertSettingsProvider>
    <PremiumWinProvider>
    <GuardrailQueueProvider>
    <>
      <PWABanner />
      <OfflineBanner />
      <AppShell>
        {impersonatedClient && (
          <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 px-6 py-2.5 bg-orange-600 text-white text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Eye size={15} className="shrink-0" />
              <span>Mode Aperçu : vous voyez le Dashboard de <strong>{impersonatedClient.name}</strong></span>
            </div>
            <button
              onClick={() => { stopImpersonating(); window.location.href = '/admin'; }}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs transition-colors shrink-0"
            >
              <X size={12} /> Quitter la prise en main
            </button>
          </div>
        )}

        <DashboardSidebar
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          currentPath={currentPath}
          onCreatePost={() => setCreatePostOpen(true)}
          onClosureAlert={() => setClosureAlertOpen(true)}
          impersonatedClient={impersonatedClient}
        />

        <AppShellMain style={impersonatedClient ? { paddingTop: '40px' } : undefined}>
          <SOSResumeBanner />
          <DemoBanner onUpgradeClick={() => setTrialEndOpen(true)} />

          {/* ── Agent suspension banner (cancelled/unpaid past grace) ── */}
          {!isAgentEnabled && (
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-2.5 bg-slate-800 text-white text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">🛑</span>
                <span className="font-semibold">Services IA suspendus</span>
                <span className="font-normal opacity-80">— Les scans automatiques et agents IA sont désactivés. Réactivez votre abonnement pour les relancer.</span>
              </div>
              <a
                href="/account"
                className="shrink-0 text-xs font-bold bg-white text-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
              >
                Réactiver
              </a>
            </div>
          )}

          {paymentFailed && (
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-amber-500 text-white text-sm">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertCircle size={17} className="shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold">Régularisation nécessaire ⚠️</span>
                  <span className="ml-2 font-normal opacity-90">Notre tentative de prélèvement a échoué. Vos services restent actifs pendant 7 jours.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-7 sm:ml-0">
                <button
                  onClick={() => setChangePaymentOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-white text-amber-700 font-bold text-xs px-3 py-1.5 hover:bg-amber-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  <RefreshCw size={12} />
                  Mettre à jour mon moyen de paiement
                </button>
                <button
                  onClick={() => {
                    setPaymentFailed(false);
                    setPaymentFailedState(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors shrink-0"
                  aria-label="Fermer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          <DashboardTopbar
            onTrialEnd={() => setTrialEndOpen(true)}
            onAuditFlash={() => setAuditFlashOpen(true)}
            onDisplayMode={() => setDisplayModeOpen(true)}
            impersonatedClient={impersonatedClient}
          />

          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Subscription status banner — past_due, canceling, trial, none */}
            <SubscriptionStatusBanner />
            {/* External API outage banner — shown when Google/Meta/OpenAI are down */}
            <ExternalApiOutageBanner />
            <ProactiveNotificationBanner />
            <CreditsExhaustedBanner />
            <div className="flex-1">
              <React.Suspense fallback={<div className="flex items-center justify-center h-full min-h-[200px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                <Outlet />
              </React.Suspense>
            </div>
            <AppFooter />
          </div>

          <DemoExhaustedModal open={demoExhaustedOpen} onClose={() => setDemoExhaustedOpen(false)} />
        </AppShellMain>

        <CreatePostModal open={createPostOpen} onClose={() => setCreatePostOpen(false)} />
        <ClosureAlertModal open={closureAlertOpen} onClose={() => setClosureAlertOpen(false)} />
        <AIChatWidget />
        <SupportChatWidget />
        <MentorCopilote />
        <GuidedTour />
        {/* Launch checklist widget — shown to new users who completed the competitor wizard */}
        {user && <LaunchChecklistWidget userId={user.id} />}
        {showGuide && user && <OnboardingGuideModal userId={user.id} onClose={closeGuide} />}
        <AuditFlashModal open={auditFlashOpen} onClose={() => setAuditFlashOpen(false)} />
        <TrialEndModal open={trialEndOpen} onClose={() => setTrialEndOpen(false)} />
        <DisplayMode open={displayModeOpen} onClose={() => setDisplayModeOpen(false)} />
        <ChangePaymentMethodModal
          open={changePaymentOpen}
          onClose={() => setChangePaymentOpen(false)}
          onSaved={() => {
            setPaymentFailed(false);
            setPaymentFailedState(false);
          }}
        />

        {isSwitching && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 bg-card border border-border rounded-2xl px-8 py-6 shadow-xl">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-foreground">Chargement de l'établissement...</p>
            </div>
          </div>
        )}

        <NotificationToast notification={latestToast} onDismiss={clearToast} />
        <DailyRefundToast />
        {showOnboarding && user && !smartWizardOpen && <ExhaustiveOnboardingModal open={showOnboarding} onClose={closeOnboarding} />}
        <SectorWalkthroughEngine open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />
        <QuickOnboardingWizard
          open={smartWizardOpen && !onboardingCompleted}
          onComplete={() => {
            markOnboardingCompleted();
            setSmartWizardOpen(false);
          }}
        />
        <WhatsAppSupportButton variant="floating" userId={user?.id} />
        <AcademyContextualToast />
        <HelpButton onClick={() => setHelpOpen(v => !v)} active={helpOpen} />
        <HelpSidebarPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
        <GuardrailQueueTrigger />
        <GuardrailQueuePanel />
        <MentorOneTapTrigger onClick={() => setOneTapOpen(true)} />
        <MentorOneTapBar open={oneTapOpen} onClose={() => setOneTapOpen(false)} />
        <ROIPushEngine />
        <CommandMenu />
        <DemoNotificationEngine />
        <DemoViewRedirector />
      </AppShell>
    </>
    </GuardrailQueueProvider>
    </PremiumWinProvider>
    </AlertSettingsProvider>
    </FirebaseProvider>
  );
}