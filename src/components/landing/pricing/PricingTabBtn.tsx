/**
 * PricingTabBtn — Pill tab button with emoji, label, and sublabel.
 */

export function TabBtn({
  active, onClick, emoji, label, sublabel, accent,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  sublabel: string;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 26px', borderRadius: 9999, border: 'none',
        fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', lineHeight: 1.2,
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        background: active ? accent : 'transparent',
        color: active ? '#fff' : '#64748B',
        boxShadow: active ? `0 2px 16px ${accent}55` : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      <span>
        {label}
        <span style={{
          display: 'block', fontSize: '.68rem', fontWeight: 500,
          opacity: active ? 0.8 : 0.5, marginTop: 1,
        }}>
          {sublabel}
        </span>
      </span>
    </button>
  );
}
