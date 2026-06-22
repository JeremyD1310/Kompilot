/**
 * IntelligenceHub — Zone 1: source selector + trend script generation
 */
import { useState, useEffect, useRef } from 'react';
import { Zap, ChevronDown, Check } from 'lucide-react';
import { type CreativeSource, CREATIVE_SOURCES } from './adsTypes';

// ── Dropdown ──────────────────────────────────────────────────────────────────

function SourceDropdown({
  value, onChange,
}: {
  value: CreativeSource;
  onChange: (v: CreativeSource) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = CREATIVE_SOURCES.find(o => o.id === value);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#64748B',
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
      }}>
        Winning Creative Source
      </label>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', minWidth: 260,
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 10, padding: '10px 14px', cursor: 'pointer', color: '#E2E8F0',
          fontSize: '.88rem', fontFamily: 'inherit', transition: 'border-color .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(13,148,136,.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {current?.label}
          {current?.badge && (
            <span style={{ fontSize: '.65rem', background: 'rgba(255,255,255,.08)', borderRadius: 4, padding: '1px 6px' }}>
              {current.badge}
            </span>
          )}
        </span>
        <ChevronDown size={14} style={{
          color: '#64748B', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .15s',
        }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#1A2640', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
          boxShadow: '0 16px 40px rgba(0,0,0,.5)', overflow: 'hidden',
        }}>
          {CREATIVE_SOURCES.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px', cursor: 'pointer',
                background: value === opt.id ? 'rgba(13,148,136,.15)' : 'transparent',
                border: 'none', color: value === opt.id ? '#0D9488' : '#CBD5E1',
                fontSize: '.88rem', fontFamily: 'inherit', textAlign: 'left',
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (value !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
              onMouseLeave={e => { if (value !== opt.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{opt.label}</span>
              {opt.badge && <span style={{ fontSize: '.65rem', color: '#64748B' }}>{opt.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HookBadge ─────────────────────────────────────────────────────────────────

function HookBadge({ performance = 'High' }: { performance?: 'High' | 'Medium' | 'Low' }) {
  const colours = { High: '#22C55E', Medium: '#F59E0B', Low: '#EF4444' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)',
      borderRadius: 20, padding: '3px 10px', fontSize: '.72rem', fontWeight: 700,
      color: colours[performance], letterSpacing: '.02em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: colours[performance],
        boxShadow: `0 0 6px ${colours[performance]}`,
      }} />
      Estimated Hook Performance: {performance}
    </span>
  );
}

// ── IntelligenceHub ───────────────────────────────────────────────────────────

interface IntelligenceHubProps {
  source: CreativeSource;
  onSourceChange: (s: CreativeSource) => void;
  onGenerateScript: () => Promise<void>;
  isGenerating: boolean;
  scriptGenerated: boolean;
}

export function IntelligenceHub({
  source, onSourceChange, onGenerateScript, isGenerating, scriptGenerated,
}: IntelligenceHubProps) {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,.07) 0%, rgba(124,58,237,.07) 100%)',
        border: '1px solid rgba(13,148,136,.2)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: 16, justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 20, flex: 1, minWidth: 0 }}>
          <SourceDropdown value={source} onChange={onSourceChange} />
          <HookBadge performance="High" />
        </div>
        <button
          onClick={onGenerateScript}
          disabled={isGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isGenerating ? 'rgba(13,148,136,.3)' : '#0D9488',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 20px', fontSize: '.9rem', fontWeight: 700,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(13,148,136,.3)', transition: 'all .15s',
          }}
        >
          {isGenerating ? (
            <>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', animation: 'ddSpin .8s linear infinite' }} />
              Génération…
            </>
          ) : (
            <>
              <Zap size={15} />
              Générer un script basé sur les tendances ⚡
            </>
          )}
        </button>
      </div>

      {scriptGenerated && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        }}>
          <Check size={14} style={{ color: '#22C55E' }} />
          <span style={{ fontSize: '.82rem', color: '#86EFAC' }}>
            Script généré depuis <strong>{CREATIVE_SOURCES.find(s => s.id === source)?.label.split('—')[0].trim()}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
