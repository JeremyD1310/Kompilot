/**
 * useWelcomeEmail
 *
 * Hook that sends a post-subscription welcome email + shows an in-app
 * welcome notification. Call `sendWelcomeEmail(planName)` right after
 * a successful payment to trigger the full welcome sequence.
 *
 * - B2C solo plans (Starter, Pro, Business, Expert…) → excitement + CTA
 * - B2B franchise/réseau plans → partnership + deployment roadmap
 */

import { useCallback } from 'react';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';
import { useEstablishment } from '../context/EstablishmentContext';
import { useNotifications } from '../context/NotificationsContext';
import {
  buildB2CWelcomeEmail,
  buildB2BWelcomeEmail,
  detectWelcomeEmailType,
  getAICreditsBonusForPlan,
  getPlanSubscribedOptions,
  getOnboardingLink,
} from '../lib/welcomeEmailTemplates';
import { recordWelcomeNotifEvent } from '../lib/welcomeNotifAnalytics';

const WELCOME_SENT_KEY = 'kompilot:welcome_sent'; // per-plan dedup key

export function useWelcomeEmail() {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();
  const { push: pushNotification } = useNotifications();

  const sendWelcomeEmail = useCallback(
    async (planName: string) => {
      if (!user?.email) return;

      // Dedup — only send once per plan (survives page reload)
      const sentKey = `${WELCOME_SENT_KEY}:${planName}`;
      if (localStorage.getItem(sentKey)) return;

      const emailType = detectWelcomeEmailType(planName);
      const firstName =
        user.displayName?.split(' ')[0] ??
        user.email.split('@')[0] ??
        'vous';

      const credits = getAICreditsBonusForPlan(planName);
      const subscribedOptions = getPlanSubscribedOptions(planName);
      const onboardingLink = getOnboardingLink(emailType);

      try {
        if (emailType === 'b2c') {
          // ── Email ──────────────────────────────────────────────────────────
          const { subject, html, text } = buildB2CWelcomeEmail({
            firstName,
            planName,
            aiCreditsBonus: credits,
            email: user.email,
            subscribedOptions,
            onboardingLink,
          });
          await blink.notifications.email({ to: user.email, subject, html, text });
          recordWelcomeNotifEvent('email_sent', 'b2c', planName, user.id);

          // ── In-app push notification (B2C) ─────────────────────────────────
          pushNotification({
            id: `welcome-b2c-${planName.toLowerCase().replace(/\s+/g, '-')}`,
            category: 'ai',
            emoji: '🎉',
            title: `Félicitations ! Votre copilote IA est activé.`,
            body: `Votre abonnement ${planName} est actif. 🎁 ${credits} crédits IA de bienvenue ont été ajoutés à votre solde !`,
            actionLabel: 'Faire mes premiers pas dans mon Cockpit IA 🚀',
            actionHref: '/cockpit?onboarding=1',
          });
          recordWelcomeNotifEvent('notif_pushed', 'b2c', planName, user.id);

        } else {
          const networkName = activeEstablishment?.name ?? 'votre réseau';

          // ── Email ──────────────────────────────────────────────────────────
          const { subject, html, text } = buildB2BWelcomeEmail({
            firstName,
            networkName,
            planName,
            email: user.email,
            subscribedOptions,
            onboardingLink,
            aiCreditsBonus: credits,
          });
          await blink.notifications.email({ to: user.email, subject, html, text });
          recordWelcomeNotifEvent('email_sent', 'b2b', planName, user.id);

          // ── In-app push notification (B2B) ─────────────────────────────────
          pushNotification({
            id: `welcome-b2b-${planName.toLowerCase().replace(/\s+/g, '-')}`,
            category: 'ai',
            emoji: '🤝',
            title: 'Déploiement de votre réseau activé !',
            body: `Bienvenue chez Kompilot — votre espace Tête de réseau est prêt. 🎁 ${credits} crédits IA ajoutés. Votre gestionnaire de compte vous contacte sous 24h.`,
            actionLabel: 'Ouvrir mon Panneau de Gestion Réseau 🏢',
            actionHref: '/establishments?onboarding=1',
          });
          recordWelcomeNotifEvent('notif_pushed', 'b2b', planName, user.id);
        }

        // Mark as sent so we don't duplicate on re-render
        localStorage.setItem(sentKey, '1');
      } catch (err) {
        // Non-blocking: email failure should never block the UX
        console.warn('[useWelcomeEmail] Email send failed:', err);
      }
    },
    [user, activeEstablishment, pushNotification],
  );

  return { sendWelcomeEmail };
}
