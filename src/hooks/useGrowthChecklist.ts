/**
 * useGrowthChecklist — Real-time DB checks for the Growth Flight Plan widget.
 *
 * Step 1 — Acquisition & G.E.O.
 *   ✅ when the establishment has a google_maps_url set
 *
 * Step 2 — Paid Media & Leads
 *   ✅ when captured_leads has at least 1 entry OR meta_audit_launched localStorage flag
 *
 * Step 3 — Protection & Stripe
 *   ✅ when user metadata has stripe_customer_id AND anti_noshow_enabled flag
 *
 * Step 4 — Creative Factory & AI Studio
 *   ✅ when ai_creative_generated localStorage flag is set
 *      OR when scheduled_posts has at least 1 published/approved post
 *
 * Step 5 — Smart SMS
 *   ✅ when sms_credits.total_used > 0
 */

import { useState, useEffect } from 'react';
import { blink } from '../blink/client';

export interface GrowthStep {
  id:          number;
  key:         string;
  label:       string;
  description: string;
  icon:        string;
  completed:   boolean;
  loading:     boolean;
  href:        string;
  ctaLabel:    string;
}

const INITIAL_STEPS: Omit<GrowthStep, 'completed' | 'loading'>[] = [
  {
    id:          1,
    key:         'geo',
    label:       'Acquisition & G.E.O.',
    description: 'Fiche Google synchronisée et visible',
    icon:        '📍',
    href:        '/google-maps',
    ctaLabel:    'Connecter ma fiche Google',
  },
  {
    id:          2,
    key:         'leads',
    label:       'Paid Media & Leads',
    description: 'Premier lead capturé ou audit Meta lancé',
    icon:        '📈',
    href:        '/lead-gen',
    ctaLabel:    'Capturer mon premier lead',
  },
  {
    id:          3,
    key:         'stripe',
    label:       'Protection & Stripe Connect',
    description: 'Compte bancaire Stripe Connect configuré et Bouclier No-Show actif',
    icon:        '🛡️',
    href:        '/settings?tab=no-show',
    ctaLabel:    'Configurer mon compte de versement Stripe',
  },
  {
    id:          4,
    key:         'creative',
    label:       'Creative Factory & AI Studio',
    description: 'Visuel IA généré ou premier avis exporté en Story vidéo',
    icon:        '🎨',
    href:        '/ai-creative-studio',
    ctaLabel:    'Générer une image IA ou exporter une Story vidéo',
  },
  {
    id:          5,
    key:         'sms',
    label:       'Smart SMS',
    description: 'Première relance SMS envoyée depuis le solde de bienvenue',
    icon:        '💬',
    href:        '/lead-gen',
    ctaLabel:    'Lancer ma première campagne SMS',
  },
];

interface ChecklistState {
  steps:          GrowthStep[];
  completedCount: number;
  totalCount:     number;
  allDone:        boolean;
  isLoading:      boolean;
}

export function useGrowthChecklist(userId: string | undefined): ChecklistState {
  const [steps, setSteps] = useState<GrowthStep[]>(
    INITIAL_STEPS.map(s => ({ ...s, completed: false, loading: true }))
  );

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function checkAll() {
      const [geoResult, leadsResult, stripeResult, creativeResult, smsResult] = await Promise.allSettled([
        // Step 1 — Geo: establishment has google_maps_url
        blink.db.establishments.list({ where: { userId } }).then(rows =>
          (rows ?? []).some((r: any) => !!(r.googleMapsUrl || r.google_maps_url))
        ),

        // Step 2 — Leads: captured lead OR meta audit localStorage flag
        Promise.resolve(
          localStorage.getItem(`meta_audit_launched_${userId}`) === '1'
        ).then(async (metaLaunched) => {
          if (metaLaunched) return true;
          const rows = await blink.db.capturedLeads.list({ where: { userId }, limit: 1 });
          return (rows ?? []).length > 0;
        }),

        // Step 3 — Stripe Connect: stripe_connect_account_id in metadata (KYC completed)
        // OR fallback: stripe_customer_id + no-show flag (legacy check)
        blink.db.users.list({ where: { id: userId } }).then(rows => {
          const u = rows?.[0] as any;
          if (!u) return false;
          try {
            const meta = typeof u.metadata === 'string'
              ? JSON.parse(u.metadata)
              : (u.metadata ?? {});
            // Preferred: Stripe Connect account configured for direct payouts
            const hasConnectAccount = !!meta.stripe_connect_account_id;
            // Legacy: subscription Stripe + local no-show activation flag
            const hasLegacyNoShow =
              !!meta.stripe_customer_id &&
              (localStorage.getItem(`anti_noshow_enabled_${userId}`) === '1' || !!meta.anti_noshow_enabled);
            return hasConnectAccount || hasLegacyNoShow;
          } catch { return false; }
        }),

        // Step 4 — Creative: AI image/script generated, video story exported, OR published post
        Promise.resolve(
          localStorage.getItem(`ai_creative_generated_${userId}`) === '1' ||
          localStorage.getItem(`video_story_exported_${userId}`) === '1'
        ).then(async (aiGenerated) => {
          if (aiGenerated) return true;
          const rows = await blink.db.scheduledPosts.list({ where: { userId }, limit: 10 });
          return (rows ?? []).some((p: any) =>
            p.status === 'published' ||
            p.status === 'approved' ||
            p.status === 'Approuvé' ||
            p.status === 'Publié'
          );
        }),

        // Step 5 — SMS: total_used > 0
        blink.db.smsCredits.list({ where: { userId }, limit: 1 }).then(rows => {
          const row = rows?.[0] as any;
          if (!row) return false;
          return Number(row.totalUsed ?? row.total_used ?? 0) > 0;
        }),
      ]);

      if (cancelled) return;

      const results = [
        geoResult.status      === 'fulfilled' ? geoResult.value      : false,
        leadsResult.status    === 'fulfilled' ? leadsResult.value    : false,
        stripeResult.status   === 'fulfilled' ? stripeResult.value   : false,
        creativeResult.status === 'fulfilled' ? creativeResult.value : false,
        smsResult.status      === 'fulfilled' ? smsResult.value      : false,
      ] as boolean[];

      setSteps(INITIAL_STEPS.map((s, i) => ({
        ...s,
        completed: results[i],
        loading:   false,
      })));
    }

    checkAll();
    return () => { cancelled = true; };
  }, [userId]);

  const completedCount = steps.filter(s => s.completed).length;

  return {
    steps,
    completedCount,
    totalCount:  INITIAL_STEPS.length,
    allDone:     completedCount === INITIAL_STEPS.length,
    isLoading:   steps.some(s => s.loading),
  };
}
