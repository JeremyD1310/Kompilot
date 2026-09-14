/**
 * publicRoutes.ts
 * All public (no-auth) route definitions.
 */
import React from 'react';
import { createRoute } from '@tanstack/react-router';
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
const TestimonialsPage      = React.lazy(() => import('../pages/TestimonialsPage'));
const FAQPage              = React.lazy(() => import('../pages/FAQPage'));
const TunnelReportPage        = React.lazy(() => import('../pages/TunnelReportPage'));
const KompilotShowcasePage  = React.lazy(() => import('../pages/demo/KompilotShowcasePage'));
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

export const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: LandingPage });
export const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
export const signupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signup', component: SignupPage });
export const privacyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/privacy', component: PrivacyPage });
export const legalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/legal', component: LegalPage });
export const cgvRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cgv', component: CGVPage });
export const informationsKompilotRoute = createRoute({ getParentRoute: () => rootRoute, path: '/informations-kompilot', component: InformationsKompilotPage });
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
export const tunnelReportRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tunnel-report/$token', component: TunnelReportPage });
export const showcaseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/showcase', component: KompilotShowcasePage });
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
