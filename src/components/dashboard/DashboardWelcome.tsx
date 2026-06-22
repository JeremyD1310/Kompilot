/**
 * DashboardWelcome
 *
 * Greeting header at the top of the dashboard.
 * All text is driven by live session data — no hardcoded names.
 *
 * - First name: extracted from user.displayName or user.email
 * - Organization name: activeEstablishment.name (real DB or demo)
 * - Subtitle: objective-based motivational line
 */

import { useAuth } from '../../hooks/useAuth';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract the user's first name from displayName ("Jérémy Chevrier" → "Jérémy")
 *  or from the email address ("jeremy.chevrier@..." → "jeremy.chevrier") */
function getFirstName(displayName?: string | null, email?: string | null): string {
  if (displayName?.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  if (email) return email.split('@')[0];
  return 'vous';
}

/** Objective-based motivational subtitle — premium, maieutique */
function getSubtitle(objectives: string[]): string {
  if (objectives.length === 0) return 'Voici votre espace de commandement. Pas de tableaux complexes — juste l\'essentiel pour piloter votre rentabilité.';

  const all = objectives.length >= 4;
  const has = (id: string) => objectives.includes(id);

  if (all)               return '💰 Tous vos leviers sont actifs. Votre moteur de croissance tourne à pleine puissance.';
  if (has('reviews') && has('ideas'))
    return '🎯 Vos avis clients et vos publications travaillent ensemble pour vous générer du chiffre d\'affaires.';
  if (has('reviews'))    return '⭐ Des avis clients en attente de réponse. Chaque réponse maïeutique renforce votre autorité locale.';
  if (has('ideas'))      return '✍️ Vos abonnés achètent-ils chez vous ? Générez un post de conversion en 2 clics.';
  if (has('time'))       return '⚡ Exécution instantanée activée. Chaque action est synchronisée, même en zone réseau faible.';
  if (has('visibility')) return '📍 58% des clients de votre zone cherchent votre expertise sur l\'IA. Inversons la tendance aujourd\'hui.';
  return 'Votre espace de commandement est prêt. Chaque action que vous prenez ici a un impact direct sur votre trésorerie.';
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DashboardWelcome() {
  const { user } = useAuth();
  const profile = useOnboardingProfile();
  const { activeEstablishment } = useEstablishment();

  const firstName = getFirstName(user?.displayName, user?.email);

  // Organization name priority:
  //   1. Active establishment from DB (real business name)
  //   2. Company name from onboarding profile
  //   3. null → hide the org line
  const orgName = activeEstablishment?.name?.trim()
    || profile?.companyName?.trim()
    || null;

  const subtitle = getSubtitle(profile?.objectives ?? []);

  return (
    <div>
      {/* Main greeting — fully dynamic */}
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">
        Bonjour {firstName} ! 👋
        {orgName && (
          <span className="font-medium text-muted-foreground">
            {' '}— Bienvenue sur le tableau de bord de{' '}
            <span className="text-foreground font-extrabold">{orgName}</span>
          </span>
        )}
      </h1>

      {/* Objective-based subtitle */}
      <p className="text-sm text-muted-foreground mt-1.5 leading-snug max-w-xl">
        {subtitle}
      </p>
    </div>
  );
}
