import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { KompilotOnboardingV2 } from '../components/onboarding/KompilotOnboardingV2';

export default function OnboardingV2Page() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex min-h-dvh items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>;
  if (!user?.id) return <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">Votre session est requise pour commencer l’onboarding.</div>;

  return (
    <KompilotOnboardingV2
      userId={user.id}
      onComplete={() => navigate({ to: '/command-center' })}
    />
  );
}
