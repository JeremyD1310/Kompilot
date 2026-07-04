/**
 * StepGoal — Primary objective selection (4 cards).
 */
import { TrendingUp, DollarSign, Calendar, Users, CheckCircle2 } from 'lucide-react';
import type { OnboardingData } from './types';
import { GOALS } from './types';

interface Props { data: OnboardingData; setData: (patch: Partial<OnboardingData>) => void; }

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  visibility: TrendingUp, revenue: DollarSign, content: Calendar, clients: Users,
};

export function StepGoal({ data, setData }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: '#94A3B8', fontSize: '.82rem', marginBottom: 8, lineHeight: 1.6 }}>
        Quel est votre objectif principal ? Kompilot adaptera votre dashboard en conséquence.
      </p>
      {GOALS.map(g => {
        const Icon = ICONS[g.id] || TrendingUp;
        const selected = data.goal === g.id;
        return (
          <button
            key={g.id} onClick={() => setData({ goal: g.id })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 14,
              background: selected ? `${g.color}12` : 'rgba(255,255,255,.02)',
              border: `1px solid ${selected ? `${g.color}50` : 'rgba(255,255,255,.06)'}`,
              cursor: 'pointer', textAlign: 'left', transition: 'all .2s',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${g.color}15`, border: `1px solid ${g.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={g.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: selected ? '#E2E8F0' : '#CBD5E1', fontWeight: 700, fontSize: '.88rem', margin: '0 0 2px' }}>{g.label}</p>
              <p style={{ color: '#64748B', fontSize: '.75rem', margin: 0 }}>{g.desc}</p>
            </div>
            {selected && <CheckCircle2 size={20} color={g.color} />}
          </button>
        );
      })}
    </div>
  );
}
