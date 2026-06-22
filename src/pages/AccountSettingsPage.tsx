import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Tabs, TabsList, TabsTrigger, TabsContent, Badge,
} from '@blinkdotnew/ui';
import { User, Bell, Receipt, Shield, FileText, Lightbulb, XCircle, Zap, Building2, Palette, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../context/SubscriptionContext';
import { useGuidedTour } from '../context/GuidedTourContext';
import { ProfileTab } from '../components/account/ProfileTab';
import { NotificationsTab } from '../components/account/NotificationsTab';
import { BillingTab } from '../components/account/BillingTab';
import { SecurityTab } from '../components/account/SecurityTab';
import { InvoicesTab } from '../components/account/InvoicesTab';
import { CancellationTab } from '../components/account/CancellationTab';
import { ConsumptionTab } from '../components/account/ConsumptionTab';
import { AgencySettingsTab } from '../components/settings/AgencySettingsTab';
import { AppearanceTab } from '../components/account/AppearanceTab';
import { AntiNoShowShield } from '../components/settings/AntiNoShowShield';
import { FirebaseSetupPanel } from '../components/firebase/FirebaseSetupPanel';

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  free:   { label: 'Gratuit',  color: 'text-muted-foreground bg-muted/60 border-border' },
  pro:    { label: 'Pro',      color: 'text-primary bg-primary/10 border-primary/30' },
  expert: { label: 'Expert',   color: 'text-violet-700 bg-violet-50 border-violet-200' },
};

const VALID_TABS = new Set([
  'profil', 'apparence', 'securite', 'notifications',
  'facturation', 'conformite', 'consommation', 'agence', 'anti-no-show', 'firebase', 'resiliation',
]);

function getInitialTab(): string {
  // 1. sessionStorage deep-link (from topbar dropdown)
  try {
    const stored = sessionStorage.getItem('account_deep_tab');
    if (stored && VALID_TABS.has(stored)) {
      sessionStorage.removeItem('account_deep_tab');
      return stored;
    }
  } catch { /* ignore */ }
  // 2. URL search param ?tab=securite
  try {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && VALID_TABS.has(tab)) return tab;
  } catch { /* ignore */ }
  return 'profil';
}

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const { startTour } = useGuidedTour();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Compte';
  const initials = displayName.slice(0, 2).toUpperCase();
  const planBadge = PLAN_BADGE[currentPlan.id] ?? PLAN_BADGE.free;

  // React to sessionStorage changes (navigating to the same page from dropdown)
  useEffect(() => {
    const stored = sessionStorage.getItem('account_deep_tab');
    if (stored && VALID_TABS.has(stored)) {
      sessionStorage.removeItem('account_deep_tab');
      setActiveTab(stored);
    }
  }, []);

  return (
    <Page>
      <PageHeader className="pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary text-lg font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <PageTitle className="text-xl">{displayName}</PageTitle>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${planBadge.color}`}>
                {planBadge.label}
              </span>
            </div>
            <PageDescription className="mt-0.5">
              {user?.email}
              {user?.emailVerified
                ? <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Email vérifié</span>
                : <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Email non vérifié</span>
              }
            </PageDescription>
          </div>
          {/* Revoir le guide button */}
          <button
            onClick={startTour}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-sm"
          >
            <Lightbulb size={14} />
            Revoir le guide 💡
          </button>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="gap-1">
            <TabsTrigger value="profil" className="gap-2 text-xs sm:text-sm">
              <User size={14} /> <span className="hidden sm:inline">Profil</span><span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="apparence" className="gap-2 text-xs sm:text-sm">
              <Palette size={14} /> <span className="hidden sm:inline">Apparence</span><span className="sm:hidden">Thème</span>
            </TabsTrigger>
            <TabsTrigger value="securite" className="gap-2 text-xs sm:text-sm">
              <Shield size={14} /> <span className="hidden sm:inline">Sécurité</span><span className="sm:hidden">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
              <Bell size={14} /> <span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Notifs</span>
            </TabsTrigger>
            <TabsTrigger value="facturation" className="gap-2 text-xs sm:text-sm">
              <Receipt size={14} /> <span className="hidden sm:inline">Facturation</span><span className="sm:hidden">Factures</span>
            </TabsTrigger>
            <TabsTrigger value="conformite" className="gap-2 text-xs sm:text-sm">
              <FileText size={14} /> <span className="hidden sm:inline">Factures & Conformité</span><span className="sm:hidden">Factures</span>
            </TabsTrigger>
            <TabsTrigger value="consommation" className="gap-2 text-xs sm:text-sm">
              <Zap size={14} /> <span className="hidden sm:inline">Ma Consommation</span><span className="sm:hidden">Conso.</span>
            </TabsTrigger>
            <TabsTrigger value="agence" className="gap-2 text-xs sm:text-sm text-violet-600 data-[state=active]:text-violet-700">
              <Building2 size={14} /> <span className="hidden sm:inline">Mon Agence</span><span className="sm:hidden">Agence</span>
            </TabsTrigger>
            <TabsTrigger value="anti-no-show" className="gap-2 text-xs sm:text-sm text-teal-600 data-[state=active]:text-teal-700">
              <ShieldCheck size={14} /> <span className="hidden sm:inline">Anti-No-Show</span><span className="sm:hidden">No-Show</span>
            </TabsTrigger>
            <TabsTrigger value="firebase" className="gap-2 text-xs sm:text-sm text-orange-600 data-[state=active]:text-orange-700">
              <Flame size={14} /> <span className="hidden sm:inline">Firebase</span><span className="sm:hidden">Firebase</span>
            </TabsTrigger>
            <TabsTrigger value="resiliation" className="gap-2 text-xs sm:text-sm text-red-600 data-[state=active]:text-red-700">
              <XCircle size={14} /> <span className="hidden sm:inline">Résiliation</span><span className="sm:hidden">Résiliation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <motion.div key="profil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <ProfileTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="apparence">
            <motion.div key="apparence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <AppearanceTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="securite">
            <motion.div key="securite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <SecurityTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <NotificationsTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="facturation">
            <motion.div key="facturation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <BillingTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="conformite">
            <motion.div key="conformite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <InvoicesTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="consommation">
            <motion.div key="consommation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <ConsumptionTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="agence">
            <motion.div key="agence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <AgencySettingsTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="anti-no-show">
            <motion.div key="anti-no-show" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <AntiNoShowShield />
            </motion.div>
          </TabsContent>

          <TabsContent value="firebase">
            <motion.div key="firebase" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <div className="max-w-2xl">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <FirebaseSetupPanel />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="resiliation">
            <motion.div key="resiliation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <CancellationTab />
            </motion.div>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}
