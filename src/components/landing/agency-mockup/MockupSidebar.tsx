/** Sidebar panel of the AgencyDashboardMockup cockpit */
import { NAV_ITEMS, SIDEBAR_CLIENTS } from './mockupData';

export function MockupSidebar() {
  return (
    <div style={{
      width: 164, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,.05)',
      background: 'rgba(0,0,0,.18)',
      padding: '12px 0',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '0 12px 12px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        marginBottom: 8,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#6359F8,#0D9488)', flexShrink: 0 }} />
        <span style={{ color: '#CBD5E1', fontSize: '.68rem', fontWeight: 800 }}>Kompilot</span>
        <span style={{
          marginLeft: 'auto', fontSize: '.5rem', color: '#475569',
          background: 'rgba(255,255,255,.05)', borderRadius: 3, padding: '1px 4px', fontWeight: 700,
        }}>AGENCE</span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(n => (
        <div key={n.l} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 12px', margin: '0 5px 1px',
          borderRadius: 7,
          background: n.a ? 'rgba(99,89,248,.14)' : 'transparent',
          border: n.a ? '1px solid rgba(99,89,248,.22)' : '1px solid transparent',
        }}>
          <span style={{ fontSize: '.68rem' }}>{n.e}</span>
          <span style={{ color: n.a ? '#C4B5FD' : '#94A3B8', fontSize: '.65rem', fontWeight: n.a ? 700 : 400 }}>{n.l}</span>
          {n.a && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#A78BFA' }} />}
        </div>
      ))}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,.04)', margin: '10px 12px' }} />

      {/* Active clients mini-list */}
      <p style={{ color: '#475569', fontSize: '.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '0 12px', marginBottom: 5 }}>
        Clients actifs
      </p>
      {SIDEBAR_CLIENTS.map(c => (
        <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px' }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: c.s >= 80 ? '#22C55E' : c.s >= 60 ? '#F59E0B' : '#EF4444',
          }} />
          <span style={{ color: '#64748B', fontSize: '.6rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.n}</span>
          <span style={{ color: c.u ? '#22C55E' : '#EF4444', fontSize: '.58rem', fontWeight: 700 }}>
            {c.u ? '▲' : '▼'}{c.s}
          </span>
        </div>
      ))}
    </div>
  );
}