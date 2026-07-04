/**
 * StepVictory — Final graduation screen with score + dashboard CTA.
 */
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { OnboardingData } from './types';
import { SECTORS } from './types';

interface Props { data: OnboardingData; onComplete: () => void; }

export function StepVictory({ data, onComplete }: Props) {
  const navigate = useNavigate();
  const handleNavigate = () => {
    onComplete();
    navigate({ to: '/dashboard' as any });
  };
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ fontSize: '3rem', marginBottom: 16 }}
      >🎉</motion.div>
      <p style={{ color: '#E2E8F0', fontWeight: 900, fontSize: '1.3rem', margin: '0 0 8px' }}>Votre espace est prêt !</p>
      <p style={{ color: '#94A3B8', fontSize: '.88rem', margin: '0 0 8px', lineHeight: 1.6 }}>
        {data.businessName} est configuré pour {SECTORS.find(s => s.id === data.sector)?.label || data.sector}{data.city ? ` à ${data.city}` : ''}.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', margin: '16px 0 28px' }}>
        {['✅ Profil configuré', '📊 Dashboard personnalisé', '🤖 IA activée'].map(label => (
          <span key={label} style={{
            background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
            borderRadius: 20, padding: '4px 12px', color: '#6EE7B7', fontSize: '.72rem', fontWeight: 600,
          }}>{label}</span>
        ))}
      </div>
      <button
        onClick={handleNavigate}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #0D9488, #0f766e)',
          color: '#fff', fontWeight: 700, padding: '16px 36px',
          borderRadius: 9999, border: 'none', cursor: 'pointer',
          fontSize: '1rem', boxShadow: '0 0 28px rgba(13,148,136,.4)',
        }}
      >Accéder à mon tableau de bord <ChevronRight size={18} /></button>
    </div>
  );
}
