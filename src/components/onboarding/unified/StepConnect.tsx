/**
 * StepConnect — 1-click sector-specific API connector (optional).
 */
import { useState } from 'react';
import { Plug } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import type { OnboardingData } from './types';
import { CONNECTORS } from './types';

interface Props { data: OnboardingData; onDone: () => void; }

export function StepConnect({ data, onDone }: Props) {
  const [connecting, setConnecting] = useState(false);
  const connector = CONNECTORS[data.sector] || CONNECTORS.default;

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); onDone(); toast.success(`${connector.label} connecté !`); }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
      }}>{connector.icon}</div>
      <div>
        <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 6px' }}>Connectez {connector.label}</p>
        <p style={{ color: '#94A3B8', fontSize: '.85rem', margin: 0, lineHeight: 1.6 }}>{connector.desc}</p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleConnect} disabled={connecting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #0D9488, #0f766e)',
            color: '#fff', fontWeight: 700, padding: '12px 28px',
            borderRadius: 12, border: 'none', cursor: connecting ? 'not-allowed' : 'pointer',
          }}
        >{connecting ? 'Connexion…' : <><Plug size={16} /> Connecter en 1 clic</>}</button>
        <button onClick={onDone} style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
          color: '#64748B', fontWeight: 600, fontSize: '.82rem',
          padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
        }}>Passer cette étape</button>
      </div>
    </div>
  );
}
