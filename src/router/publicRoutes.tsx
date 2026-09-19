/**
 * publicRoutes.ts
 * All public (no-auth) route definitions.
 */
import React from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './rootRoute';

// ── Pages (lazy-loaded) ───────────────────────────────────────────────────────
const LandingPage          = React.lazy(() => import('../pages/LandingPage'));
const LoginPage            = React.lazy(() => import('../pages/LoginPage'));
const SignupPage           = React.lazy(() => import('../pages/SignupPage'));
const PrivacyPage          = React.lazy(() => import('../pages/PrivacyPage'));
const LegalPage            = React.lazy(() => import('../pages/LegalPage'));
const CGVPage              = React.lazy(() => import('../pages/CGVPage'));
const ForgotPasswordPage   = React.lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage    = React.lazy(() => import('../pages/ResetPasswordPage'));
const EmailUnverifiedPage  = React.lazy(() => import('../pages/EmailUnverifiedPage'));
const VerifyEmailPage      = React.lazy(() => import('../pages/VerifyEmailPage'));
const ScanFastPage         = React.lazy(() => import('../pages/ScanFastPage'));
const DiagnosticPage       = React.lazy(() => import('../pages/DiagnosticPage'));
const ReferralLandingPage  = React.lazy(() => import('../pages/ReferralLandingPage'));
const ClientApprovalPage   = React.lazy(() => import('../pages/ClientApprovalPage'));
const DemoPage             = React.lazy(() => import('../pages/DemoPage'));
const DemoWorkspacePage     = React.lazy(() => import('../pages/DemoWorkspacePage'));
const TestimonialsPage      = React.lazy(() => import('../pages/TestimonialsPage'));
const FAQPage              = React.lazy(() => import('../pages/FAQPage'));
const TunnelReportPage        = React.lazy(() => import('../pages/TunnelReportPage'));
const KompilotOnboardingPage = React.lazy(() => import('../pages/KompilotOnboardingPage'));
const KompilotROIDashboardPage = React.lazy(() => import('../pages/KompilotROIDashboardPage'));
const PricingPage              = React.lazy(() => import('../pages/PricingPage'));
const PricingProPage           = React.lazy(() => import('../pages/PricingProPage'));
const PricingAgencyPage        = React.lazy(() => import('../pages/PricingAgencyPage'));
const PlaybookImmobilierPage   = React.lazy(() => import('../pages/PlaybookImmobilierPage'));
const PlaybookEcommercePage    = React.lazy(() => import('../pages/PlaybookEcommercePage'));
const AIOCheckerPage           = React.lazy(() => import('../pages/AIOCheckerPage'));
const ExtendTrialPage          = React.lazy(() => import('../pages/ExtendTrialPage'));
const SectorPage               = React.lazy(() => import('../pages/SectorPage'));
const MarketingInfoPage        = React.lazy(() => import('../pages/MarketingInfoPage'));
const InformationsKompilotPage = React.lazy(() => import('../pages/InformationsKompilotPage'));
const AboutPage                = React.lazy(() => import('../pages/AboutPage'));
const EditorialPolicyPage      = React.lazy(() => import('../pages/EditorialPolicyPage'));
const PublicResourceCenterPage = React.lazy(() => import('../pages/PublicResourceCenterPage'));
const PublicResourceGuidePage  = React.lazy(() => import('../pages/PublicResourceGuidePage'));
const PublicComparativePage    = React.lazy(() => import('../pages/PublicComparativePage'));
const CaseStudiesPage          = React.lazy(() => import('../pages/CaseStudiesPage'));
const CaseStudyDraftPage       = React.lazy(() => import('../pages/CaseStudyDraftPage'));

export const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: LandingPage });
export const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
export const signupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signup', component: SignupPage });
export const privacyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/privacy', component: PrivacyPage });
export const legalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/legal', component: LegalPage });
export const cgvRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cgv', component: CGVPage });
export const informationsKompilotRoute = createRoute({ getParentRoute: () => rootRoute, path: '/informations-kompilot', component: InformationsKompilotPage });
export const aProposRoute = createRoute({ getParentRoute: () => rootRoute, path: '/a-propos', component: AboutPage });
export const editorialPolicyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/politique-editoriale', component: EditorialPolicyPage });
export const resourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ressources', component: PublicResourceCenterPage });
export const resourceGuideRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ressources/$slug', component: PublicResourceGuidePage });
export const comparativeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/comparatifs/$slug', component: PublicComparativePage });
export const caseStudiesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cas-clients', component: CaseStudiesPage });
export const caseStudyDraftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cas-clients/$slug', component: CaseStudyDraftPage });
// Alias routes for Stripe/payment compliance
export const confidentialiteRoute = createRoute({ getParentRoute: () => rootRoute, path: '/confidentialite', component: PrivacyPage });
export const politiqueConfidentialiteRoute = createRoute({ getParentRoute: () => rootRoute, path: '/politique-de-confidentialite', component: PrivacyPage });
export const mentionsLegalesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/mentions-legales', component: LegalPage });
export const cguAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cgu', component: CGVPage });
export const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forgot-password', component: ForgotPasswordPage });
export const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reset-password', component: ResetPasswordPage });
export const emailUnverifiedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/email-unverified', component: EmailUnverifiedPage });
export const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/verify-email', component: VerifyEmailPage });
export const scanFastRoute = createRoute({ getParentRoute: () => rootRoute, path: '/scan/fast', component: ScanFastPage });
export const diagnosticRoute = createRoute({ getParentRoute: () => rootRoute, path: '/diagnostic', component: DiagnosticPage });
export const referralLandingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ref/$code', component: ReferralLandingPage });
export const clientApprovalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/approve/$token', component: ClientApprovalPage });
export const demoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo', component: DemoPage });
export const demoOnboardingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/onboarding', beforeLoad: () => { throw redirect({ to: '/demo/workspace' }); }, component: DemoWorkspacePage });
export const demoDashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/dashboard', beforeLoad: () => { throw redirect({ to: '/demo/workspace' }); }, component: DemoWorkspacePage });
export const demoWorkspaceRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace', component: DemoWorkspacePage });
export const demoWorkspaceApprovalsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/approvals', component: DemoWorkspacePage });
export const demoWorkspaceCalendarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/calendar', component: DemoWorkspacePage });
export const demoWorkspacePresenceRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/presence', component: DemoWorkspacePage });
export const demoWorkspaceReviewsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/reviews', component: DemoWorkspacePage });
export const demoWorkspaceContentRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/content', component: DemoWorkspacePage });
export const demoWorkspaceMessagesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/messages', component: DemoWorkspacePage });
export const demoWorkspaceCampaignsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/campaigns', component: DemoWorkspacePage });
export const demoWorkspaceToolsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/tools', component: DemoWorkspacePage });
export const demoWorkspaceResultsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/results', component: DemoWorkspacePage });
export const demoWorkspaceOrganizationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/organization', component: DemoWorkspacePage });
export const demoWorkspaceTeamRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/team', component: DemoWorkspacePage });
export const demoWorkspaceSettingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/workspace/settings', component: DemoWorkspacePage });
export const tunnelReportRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tunnel-report/$token', component: TunnelReportPage });
export const showcaseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/showcase', beforeLoad: () => { throw redirect({ to: '/demo' }); }, component: DemoPage });
export const kompilotOnboardingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/onboarding-copilot', component: KompilotOnboardingPage });
export const kompilotROIRoute = createRoute({ getParentRoute: () => rootRoute, path: '/roi-dashboard', component: KompilotROIDashboardPage });
export const pricingRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/pricing',       component: PricingPage });
export const pricingProRoute   = createRoute({ getParentRoute: () => rootRoute, path: '/pricing-pro',   component: PricingProPage });
export const pricingAgencyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pricing-agency', component: PricingAgencyPage });
export const playbookImmobilierRoute = createRoute({ getParentRoute: () => rootRoute, path: '/playbook/immobilier', component: PlaybookImmobilierPage });
export const playbookEcommerceRoute  = createRoute({ getParentRoute: () => rootRoute, path: '/playbook/e-commerce', component: PlaybookEcommercePage });
export const aioCheckerRoute         = createRoute({ getParentRoute: () => rootRoute, path: '/aio-checker', component: AIOCheckerPage });
export const extendTrialRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/extend-trial', component: ExtendTrialPage });
export const sectorRoute             = createRoute({ getParentRoute: () => rootRoute, path: '/secteurs/$sector', component: SectorPage });
export const localRoute              = createRoute({ getParentRoute: () => rootRoute, path: '/local', component: MarketingInfoPage });
export const featuresRoute           = createRoute({ getParentRoute: () => rootRoute, path: '/features', component: MarketingInfoPage });
export const testimonialsRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/temoignages', component: TestimonialsPage });
export const faqRoute                = createRoute({ getParentRoute: () => rootRoute, path: '/faq', component: FAQPage });

export const publicRoutes = [
  indexRoute,
  loginRoute,
  signupRoute,
  privacyRoute,
  legalRoute,
  cgvRoute,
  informationsKompilotRoute,
  aProposRoute,
  editorialPolicyRoute,
  resourcesRoute,
  resourceGuideRoute,
  comparativeRoute,
  caseStudiesRoute,
  caseStudyDraftRoute,
  cguAliasRoute,
  confidentialiteRoute,
  politiqueConfidentialiteRoute,
  mentionsLegalesRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  emailUnverifiedRoute,
  verifyEmailRoute,
  scanFastRoute,
  diagnosticRoute,
  referralLandingRoute,
  clientApprovalRoute,
  demoRoute,
  demoOnboardingRoute,
  demoDashboardRoute,
  demoWorkspaceRoute,
  demoWorkspaceApprovalsRoute,
  demoWorkspaceCalendarRoute,
  demoWorkspacePresenceRoute,
  demoWorkspaceReviewsRoute,
  demoWorkspaceContentRoute,
  demoWorkspaceMessagesRoute,
  demoWorkspaceCampaignsRoute,
  demoWorkspaceToolsRoute,
  demoWorkspaceResultsRoute,
  demoWorkspaceOrganizationRoute,
  demoWorkspaceTeamRoute,
  demoWorkspaceSettingsRoute,
  tunnelReportRoute,
  showcaseRoute,
  kompilotOnboardingRoute,
  kompilotROIRoute,
  pricingRoute,
  pricingProRoute,
  pricingAgencyRoute,
  playbookImmobilierRoute,
  playbookEcommerceRoute,
  aioCheckerRoute,
  extendTrialRoute,
  sectorRoute,
  localRoute,
  featuresRoute,
  testimonialsRoute,
  faqRoute,
];
