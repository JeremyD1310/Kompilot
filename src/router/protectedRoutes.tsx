/**
 * protectedRoutes.tsx
 * All dashboard child routes (auth required).
 */
import React from 'react';
import { createRoute, Navigate } from '@tanstack/react-router';
import { dashboardLayoutRoute } from './dashboardLayoutRoute';
import { rootRoute } from './rootRoute';
import { OnboardingGuard } from './guards';

// ── Pages (lazy-loaded) ───────────────────────────────────────────────────────
const DashboardPage        = React.lazy(() => import('../pages/DashboardPage'));
const CalendarPage         = React.lazy(() => import('../pages/CalendarPage'));
const InboxPage            = React.lazy(() => import('../pages/InboxPage'));
const SettingsPage         = React.lazy(() => import('../pages/SettingsPage'));
const ProfilePage          = React.lazy(() => import('../pages/ProfilePage'));
const GuidePage            = React.lazy(() => import('../pages/GuidePage'));
const SubscriptionPage     = React.lazy(() => import('../pages/SubscriptionPage'));
const AdminPage            = React.lazy(() => import('../pages/AdminPage'));
const AdminAnalyticsPage   = React.lazy(() => import('../pages/AdminAnalyticsPage'));
const ReferralPage         = React.lazy(() => import('../pages/ReferralPage'));
const WebsiteWidgetPage    = React.lazy(() => import('../pages/WebsiteWidgetPage'));
const WebsiteScanPage      = React.lazy(() => import('../pages/WebsiteScanPage'));
const EmailSequencesPage   = React.lazy(() => import('../pages/EmailSequencesPage'));
const ContentLibraryPage   = React.lazy(() => import('../pages/ContentLibraryPage'));
const AnalyticsPage        = React.lazy(() => import('../pages/AnalyticsPage'));
const AccountSettingsPage  = React.lazy(() => import('../pages/AccountSettingsPage'));
const EmailingPage         = React.lazy(() => import('../pages/EmailingPage'));
const SocialMediaPage      = React.lazy(() => import('../pages/SocialMediaPage'));
const EstablishmentsPage   = React.lazy(() => import('../pages/EstablishmentsPage'));
const PostsDataPage        = React.lazy(() => import('../pages/PostsDataPage'));
const CockpitPage          = React.lazy(() => import('../pages/CockpitPage'));
const GrowthPage           = React.lazy(() => import('../pages/GrowthPage'));
const PerformancePage      = React.lazy(() => import('../pages/PerformancePage'));
const ReviewGeneratorPage  = React.lazy(() => import('../pages/ReviewGeneratorPage'));
const SeoLocalPage         = React.lazy(() => import('../pages/SeoLocalPage'));
const GoogleMapsListingPage = React.lazy(() => import('../pages/GoogleMapsListingPage'));
const LocalAdsCenterPage   = React.lazy(() => import('../pages/LocalAdsCenterPage'));
const AcademyPage          = React.lazy(() => import('../pages/AcademyPage'));
const LiveChatPage         = React.lazy(() => import('../pages/LiveChatPage'));
const NotificationsPage    = React.lazy(() => import('../pages/NotificationsPage'));
const GeoAuthorityPage     = React.lazy(() => import('../pages/GeoAuthorityPage'));
const AgencyDashboardPage  = React.lazy(() => import('../pages/AgencyDashboardPage'));
const AgencyLeadSearchPage = React.lazy(() => import('../pages/AgencyLeadSearchPage'));
const LeadGenPage          = React.lazy(() => import('../pages/LeadGenPage'));
const SentimentAnalysisPage = React.lazy(() => import('../pages/SentimentAnalysisPage'));
const SmartQRCodePage      = React.lazy(() => import('../pages/SmartQRCodePage'));
const CaissePage           = React.lazy(() => import('../pages/CaissePage'));
const ProfileSetupPage     = React.lazy(() => import('../pages/ProfileSetupPage'));
const BrandManagementPage  = React.lazy(() => import('../pages/BrandManagementPage'));
const CreativeFactoryPage  = React.lazy(() => import('../pages/CreativeFactoryPage'));
const AICreativeStudioPage = React.lazy(() => import('../pages/AICreativeStudioPage'));
const FeaturesShowcasePage = React.lazy(() => import('../pages/FeaturesShowcasePage'));
const ClaudeCoworkPage     = React.lazy(() => import('../pages/ClaudeCoworkPage'));
const TunnelsPage          = React.lazy(() => import('../pages/TunnelsPage'));
const AIOPage              = React.lazy(() => import('../pages/AIOPage'));
const ROASPage             = React.lazy(() => import('../pages/ROASPage'));
const EmailMarketingPage      = React.lazy(() => import('../pages/EmailMarketingPage'));
const CreativeStudioHubPage   = React.lazy(() => import('../pages/CreativeStudioHubPage'));
const TeamPage             = React.lazy(() => import('../pages/TeamPage'));

// ── Onboarding (outside layout) ───────────────────────────────────────────────

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingGuard,
});

// ── Helper ────────────────────────────────────────────────────────────────────

const d = dashboardLayoutRoute;
const r = (path: string, component: React.ComponentType) =>
  createRoute({ getParentRoute: () => d, path, component });

// ── Routes ────────────────────────────────────────────────────────────────────

export const setupRoute            = r('/setup',               ProfileSetupPage);
export const dashboardRoute        = r('/dashboard',           DashboardPage);
export const calendarRoute         = r('/calendar',            CalendarPage);
export const inboxRoute            = r('/inbox',               InboxPage);
export const settingsRoute         = r('/settings',            SettingsPage);
export const profileRoute          = r('/profile',             ProfilePage);
export const guideRoute            = r('/guide',               GuidePage);
export const subscriptionRoute     = r('/subscription',        SubscriptionPage);
export const adminRoute            = r('/admin',               AdminPage);
export const adminAnalyticsRoute   = r('/admin/analytics',     AdminAnalyticsPage);
export const referralRoute         = r('/referral',            ReferralPage);
export const widgetRoute           = r('/widget',              WebsiteWidgetPage);
export const libraryRoute          = r('/library',             ContentLibraryPage);
export const analyticsRoute        = r('/analytics',           AnalyticsPage);
export const accountRoute          = r('/account',             AccountSettingsPage);
export const emailingRoute         = r('/emailing',            EmailingPage);
export const socialRoute           = r('/social',              SocialMediaPage);
export const establishmentsRoute   = r('/establishments',      EstablishmentsPage);
export const postsDataRoute        = r('/posts-data',          PostsDataPage);
export const cockpitRoute          = r('/cockpit',             CockpitPage);
export const growthRoute           = r('/growth',              GrowthPage);
export const performanceRoute      = r('/performance',         PerformancePage);
export const reviewGeneratorRoute  = r('/reviews',             ReviewGeneratorPage);
export const seoLocalRoute         = r('/seo-local',           SeoLocalPage);
export const googleMapsRoute       = r('/google-maps',         GoogleMapsListingPage);
export const localAdsRoute         = r('/local-ads',           LocalAdsCenterPage);
export const academyRoute          = r('/academy',             AcademyPage);
export const liveChatRoute         = r('/live-chat',           LiveChatPage);
export const notificationsRoute    = r('/notifications',       NotificationsPage);
export const geoAuthorityRoute     = r('/geo-authority',       GeoAuthorityPage);
export const agencyDashRoute       = r('/agence/dashboard',    AgencyDashboardPage);
export const agencyLeadRoute       = r('/agence/lead-search',  AgencyLeadSearchPage);
export const claudeCoworkRoute     = r('/agence/cowork',        ClaudeCoworkPage);
export const leadGenRoute          = r('/lead-gen',            LeadGenPage);
export const sentimentRoute        = r('/semantic',            SentimentAnalysisPage);
export const qrCodeRoute           = r('/qrcode',              SmartQRCodePage);
export const caisseRoute           = r('/caissier',            CaissePage);
export const brandRoute            = r('/brand',               BrandManagementPage);
export const creativeFactoryRoute  = r('/creative-factory',    CreativeFactoryPage);
export const aiCreativeStudioRoute = r('/ai-creative-studio',  AICreativeStudioPage);
export const featuresShowcaseRoute = r('/features-showcase',   FeaturesShowcasePage);
export const tunnelsRoute          = r('/tunnels',             TunnelsPage);
export const aioRoute              = r('/aio',                 AIOPage);
export const roasRoute             = r('/roas',                ROASPage);
export const emailMarketingRoute      = r('/email-marketing',      EmailMarketingPage);
export const creativeStudioHubRoute   = r('/creative-studio-hub',  CreativeStudioHubPage);
export const websiteScanRoute      = r('/website-scan',         WebsiteScanPage);
export const emailSequencesRoute   = r('/email-sequences',      EmailSequencesPage);
export const teamRoute             = r('/team',                 TeamPage);

export const clientMessagesRoute = createRoute({
  getParentRoute: () => d,
  path: '/messages',
  component: () => <Navigate to="/inbox" />,
});

export const protectedChildRoutes = [
  setupRoute, dashboardRoute, calendarRoute, inboxRoute,
  settingsRoute, profileRoute, guideRoute, subscriptionRoute,
  adminRoute, adminAnalyticsRoute, referralRoute, widgetRoute,
  libraryRoute, analyticsRoute, accountRoute, emailingRoute,
  establishmentsRoute, socialRoute, postsDataRoute, cockpitRoute,
  growthRoute, performanceRoute, clientMessagesRoute, reviewGeneratorRoute,
  seoLocalRoute, googleMapsRoute, localAdsRoute, academyRoute,
  liveChatRoute, notificationsRoute, geoAuthorityRoute,
  agencyDashRoute, agencyLeadRoute, claudeCoworkRoute, leadGenRoute, sentimentRoute,
  qrCodeRoute, caisseRoute, brandRoute, creativeFactoryRoute,
  aiCreativeStudioRoute, featuresShowcaseRoute, tunnelsRoute,
  aioRoute, roasRoute, emailMarketingRoute, websiteScanRoute, emailSequencesRoute,
  creativeStudioHubRoute, teamRoute,
];