/**
 * CurrentPlanBadge — Compact badge showing the user's current subscription plan + status.
 * Used in the account sidebar and billing tab.
 */

interface CurrentPlanBadgeProps {
  planId: string | null;
  status: string;
  className?: string;
}

export function CurrentPlanBadge({ planId, status, className = '' }: CurrentPlanBadgeProps) {
  if (status === 'payment_failed') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 ${className}`}>
        Paiement échoué ⚠
      </span>
    );
  }

  if (status === 'cancelled' || status === 'unpaid') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 ${className}`}>
        Annulé
      </span>
    );
  }

  if (status === 'active' && (planId === 'pro' || planId === 'multi' || planId === 'agency')) {
    const styles = planId === 'agency'
      ? 'bg-violet-100 text-violet-700 border-violet-200'
      : planId === 'multi'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : 'bg-teal-100 text-teal-700 border-teal-200';
    const label = planId === 'agency' ? 'Agency' : planId === 'multi' ? 'Multi' : 'Pro';
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles} ${className}`}>
        Plan {label} ✓
      </span>
    );
  }

  // Unknown or pending state.
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 ${className}`}>
      En attente
    </span>
  );
}
