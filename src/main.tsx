import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { CreditsProvider } from './context/CreditsContext'
import { ConnectedAccountsProvider } from './context/ConnectedAccountsContext'
import { UserRoleProvider } from './context/UserRoleContext'
import { PublicationSlotsProvider } from './context/PublicationSlotsContext'
import { ContentLibraryProvider } from './context/ContentLibraryContext'
import { NotificationPreferencesProvider } from './context/NotificationPreferencesContext'
import { AdminProvider } from './context/AdminContext'
import { TeamModeProvider } from './context/TeamModeContext'
import { ContentPillarsProvider } from './context/ContentPillarsContext'
import { EstablishmentProvider } from './context/EstablishmentContext'
import { UserProfileProvider } from './context/UserProfileContext'

// Scoped wrapper: reads userId from localStorage so the profile key is per-user
// (prevents cross-session data leakage on shared browsers)
function UserProfileProviderWithAuth({ children }: { children: React.ReactNode }) {
  const userId = (() => { try { return localStorage.getItem('blink_user_id') ?? undefined; } catch { return undefined; } })();
  return <UserProfileProvider userId={userId}>{children}</UserProfileProvider>;
}
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext'
import { ObsidianThemeProvider } from './context/ObsidianThemeContext'
import { DemoModeProvider } from './context/DemoModeContext'
import { DemoViewProvider } from './context/DemoViewContext'
import { GuidedTourProvider } from './context/GuidedTourContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { BrandSettingsProvider } from './context/BrandSettingsContext'
import { BYOKProvider } from './context/BYOKContext'
import { EcoModeProvider } from './context/EcoModeContext'
import { TrialProvider } from './context/TrialContext'
import { IntegrationStatusProvider } from './context/IntegrationStatusContext'
import { PremiumActionGate } from './components/shared/PremiumActionGate'
import { CookieBanner } from './components/layout/CookieBanner'
import { HelpFeedbackButton } from './components/layout/HelpFeedbackButton'
import { SupportChatBubble } from './components/layout/SupportChatBubble'
import { GoogleAnalyticsLoader } from './components/layout/GoogleAnalyticsLoader'
import App from './App'
import { registerServiceWorker } from './lib/registerServiceWorker'
import { installGlobalErrorHandlers } from './lib/errorLogger'
import './index.css'

// Register SW for offline caching — after first paint
registerServiceWorker()

// Install global error capture (unhandledrejection + window.onerror)
// Runs before React mounts so even early init errors are captured.
installGlobalErrorHandlers(
  (() => { try { return localStorage.getItem('blink_user_id') ?? undefined; } catch { return undefined; } })()
)

const queryClient = new QueryClient()

// ── Provider composer ────────────────────────────────────────────────────────
// Composes an array of providers to avoid deep nesting ("provider hell").
type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>

function compose(...providers: ProviderComponent[]) {
  return function ComposedProviders({ children }: { children: React.ReactNode }) {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as React.ReactElement,
    )
  }
}

// Static providers — defined once at module level (don't depend on runtime state)
const StaticProviders = compose(
  AdminProvider,
  IntegrationStatusProvider,
  DemoViewProvider,
  DemoModeProvider,
  UserProfileProviderWithAuth,
  SubscriptionProvider,
  EstablishmentProvider,
  BrandSettingsProvider,
  CreditsProvider,
  EcoModeProvider,
  BYOKProvider,
  ConnectedAccountsProvider,
  NotificationPreferencesProvider,
  ContentLibraryProvider,
  ContentPillarsProvider,
  PublicationSlotsProvider,
  UserRoleProvider,
  TeamModeProvider,
  GuidedTourProvider,
  NotificationsProvider,
  TrialProvider,
)

// Inner wrapper — only wraps BlinkUIProvider (which needs the isDark runtime value)
function ThemedApp() {
  const { isDark } = useDarkMode()

  return (
    <BlinkUIProvider theme="linear" darkMode={isDark ? 'dark' : 'light'}>
      <StaticProviders>
        <Toaster />
        <GoogleAnalyticsLoader />
        <PremiumActionGate />
        <div className="flex w-full flex-1 flex-col min-h-0">
          <App />
        </div>
        <CookieBanner />
        <HelpFeedbackButton />
        <SupportChatBubble />
      </StaticProviders>
    </BlinkUIProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ObsidianThemeProvider>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedApp />
        </QueryClientProvider>
      </DarkModeProvider>
    </ObsidianThemeProvider>
  </React.StrictMode>,
)