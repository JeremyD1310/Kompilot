/** Right panel of the AgencyDashboardMockup — Lead scanner results */
import { LEADS } from './mockupData';
import { ScorePill } from './MockupPrimitives';

export function MockupRightPanel({ visible }: { visible: boolean }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      borderLeft: '1px solid rgba(255,255,255,.05)',
      background: 'rgba(0,0,0,.14)',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 9,
      overflow: 'hidden',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
        <span style={{ fontSize: '.7rem' }}>🎯</span>
        <p style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '.72rem' }}>Scanner de Leads</p>
      </div>

      {/* Search bar simulation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 8, padding: '7px 10px',
      }}>
        <span style={{ fontSize: '.65rem' }}>🔍</span>
        <span style={{ color: '#64748B', fontSize: '.63rem', flex: 1 }}>Brasserie · Marseille</span>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          background: 'rgba(99,89,248,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#A78BFA', fontSize: '.5rem', fontWeight: 800 }}>→</span>
        </div>
      </div>

      <p style={{ color: '#475569', fontSize: '.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
        4 résultats · Score de vulnérabilité
      </p>

      {/* Lead rows — animated in when visible */}
      {visible && LEADS.map(l => (
        <div key={l.name} className={l.cls} style={{
          background: 'rgba(255,255,255,.025)',
          border: '1px solid rgba(255,255,255,.055)',
          borderRadius: 8, padding: '8px 9px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 4 }}>
            <p style={{ color: '#CBD5E1', fontSize: '.63rem', fontWeight: 700, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{l.name}</p>
            <ScorePill score={l.score} />
          </div>
          <p style={{ color: '#64748B', fontSize: '.57rem', marginBottom: 5 }}>📍 {l.city}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#EF4444', fontSize: '.58rem', fontWeight: 700 }}>{l.gap}</span>
            <button style={{
              background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)',
              color: '#4ADE80', fontSize: '.55rem', fontWeight: 700,
              borderRadius: 5, padding: '2px 6px', cursor: 'default',
            }}>
              Kit Closing →
            </button>
          </div>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* White-label badge */}
      <div style={{
        background: 'rgba(99,89,248,.08)',
        border: '1px solid rgba(99,89,248,.2)',
        borderRadius: 7, padding: '7px 9px', textAlign: 'center',
      }}>
        <p style={{ color: '#A78BFA', fontSize: '.62rem', fontWeight: 700, margin: '0 0 2px' }}>Marque Blanche ✓</p>
        <p style={{ color: '#64748B', fontSize: '.55rem', margin: 0 }}>Logo & domaine personnalisés</p>
      </div>
    </div>
  );
}