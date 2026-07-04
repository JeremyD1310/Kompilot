/**
 * AnnualPlanBadge — Display badge showing annual savings.
 *
 * Shown on the pricing page next to the yearly toggle or on plan cards.
 * Calculates and displays the 2-months-free savings.
 */

interface AnnualPlanBadgeProps {
  monthlyPrice: number;
  className?: string;
}

export function AnnualPlanBadge({ monthlyPrice, className = '' }: AnnualPlanBadgeProps) {
  // Annual = 10 months (2 months free)
  const annualTotal = monthlyPrice * 10;
  const monthlyEquiv = Math.round((annualTotal / 12) * 100) / 100;
  const savings = monthlyPrice * 2;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
        borderRadius: 9999, padding: '3px 10px',
        fontSize: '.68rem', fontWeight: 700, color: '#10B981',
      }}
    >
      🎁 −{savings}€ / an — 2 mois offerts
    </span>
  );
}

/**
 * AnnualPlanSavingsCard — Full savings breakdown card.
 * Used in the billing settings or pricing page.
 */
export function AnnualPlanSavingsCard({
  planName,
  monthlyPrice,
  onStartCheckout,
  isLoading = false,
}: {
  planName: string;
  monthlyPrice: number;
  onStartCheckout?: () => void;
  isLoading?: boolean;
}) {
  const annualTotal = monthlyPrice * 10;
  const monthlyEquiv = Math.round((annualTotal / 12) * 100) / 100;
  const savings = monthlyPrice * 2;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16,185,129,.06), rgba(13,148,136,.04))',
      border: '1px solid rgba(16,185,129,.2)',
      borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: '1.5rem' }}>🎁</span>
        <div>
          <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '.92rem', margin: 0 }}>
            {planName} Annuel
          </p>
          <p style={{ color: '#10B981', fontSize: '.75rem', margin: 0, fontWeight: 600 }}>
            Économisez {savings}€ — 2 mois offerts
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 12, padding: '14px', textAlign: 'center',
        }}>
          <p style={{ color: '#94A3B8', fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 4px' }}>
            Prix mensuel
          </p>
          <p style={{ color: '#F87171', fontSize: '1.1rem', fontWeight: 900, margin: 0, textDecoration: 'line-through', opacity: 0.7 }}>
            {monthlyPrice}€
          </p>
        </div>
        <div style={{
          background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)',
          borderRadius: 12, padding: '14px', textAlign: 'center',
        }}>
          <p style={{ color: '#10B981', fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 4px' }}>
            Équivalent mensuel
          </p>
          <p style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>
            {monthlyEquiv}€
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: '#94A3B8', fontSize: '.78rem' }}>Facturé une fois par an</span>
        <span style={{ color: '#E2E8F0', fontWeight: 900, fontSize: '1.2rem' }}>{annualTotal}€ HT</span>
      </div>

      {onStartCheckout && (
        <button
          onClick={onStartCheckout}
          disabled={isLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontWeight: 700, fontSize: '.88rem',
            border: 'none', borderRadius: 12, padding: '12px 20px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(16,185,129,.25)',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Chargement…' : `Passer au ${planName} Annuel — Économiser ${savings}€`}
        </button>
      )}
    </div>
  );
}
