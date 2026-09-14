/**
 * Social-to-SEO Page — thin wrapper that loads the feature component + onboarding
 */

import React from 'react'
const SocialSeoPage = React.lazy(() => import('../components/socialSeo/SocialSeoPage'))
const SocialSeoOnboarding = React.lazy(() => import('../components/socialSeo/onboarding/SocialSeoOnboarding').then(m => ({ default: m.SocialSeoOnboarding })))

export default function SocialSeoPageWrapper() {
  return (
    <>
      <SocialSeoPage />
      <SocialSeoOnboarding />
    </>
  )
}
