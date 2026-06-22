/**
 * KompilotOnboardingPage — Full-screen magic-input onboarding.
 * Route: /onboarding-copilot
 */
import { useNavigate } from '@tanstack/react-router';
import { KompilotOnboardingFlow } from '../components/onboarding/KompilotOnboardingFlow';

export default function KompilotOnboardingPage() {
  const navigate = useNavigate();

  return (
    <KompilotOnboardingFlow
      onComplete={() => {
        navigate({ to: '/dashboard' });
      }}
    />
  );
}
