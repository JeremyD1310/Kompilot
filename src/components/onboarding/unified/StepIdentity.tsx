/**
 * StepIdentity — Business name, city, and sector selection.
 */
import { MapPin } from 'lucide-react';
import type { OnboardingData } from './types';
import { SECTORS } from './types';

interface Props {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
  padding: '14px 18px', color: '#E2E8F0', fontSize: '.92rem', outline: 'none',
};

export function StepIdentity({ data, setData }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Nom de votre entreprise
        </p>
        <input
          type="text" value={data.businessName}
          onChange={e => setData({ businessName: e.target.value })}
          placeholder="Ex: Boulangerie Dupont" autoFocus style={inputStyle}
        />
      </div>
      <div>
        <p style={{ color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Ville
        </p>
        <input
          type="text" value={data.city}
          onChange={e => setData({ city: e.target.value })}
          placeholder="Ex: Lyon, Paris, Marseille…" style={inputStyle}
        />
      </div>
      <div>
        <p style={{ color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Votre secteur
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {SECTORS.map(s => (
            <button
              key={s.id}
              onClick={() => setData({ sector: s.id, profileType: s.type })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: data.sector === s.id ? 'rgba(13,148,136,.12)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${data.sector === s.id ? 'rgba(13,148,136,.4)' : 'rgba(255,255,255,.06)'}`,
                color: data.sector === s.id ? '#2DD4BF' : '#94A3B8',
                fontWeight: 600, fontSize: '.78rem', cursor: 'pointer',
                transition: 'all .2s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
