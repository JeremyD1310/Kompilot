import { CheckCircle2 } from 'lucide-react';
import { KompilotLogo } from '../brand/KompilotLogo';

export function SignupLogo({ size = 44 }: { size?: number }) {
  return <KompilotLogo variant="icon" height={size} />;
}

export function SiretBadge({ valid }: { valid: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      fontSize: '.75rem', fontWeight: 700,
      transition: 'all .3s cubic-bezier(.4,0,.2,1)',
      background: valid ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.08)',
      border: `1px solid ${valid ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)'}`,
      color: valid ? '#4ade80' : '#f87171',
    }}>
      {valid ? (
        <><CheckCircle2 size={13} /> SIRET Valide 🟢</>
      ) : (
        <><span style={{ fontSize: 13 }}>⏳</span> Vérification…</>
      )}
    </div>
  );
}
