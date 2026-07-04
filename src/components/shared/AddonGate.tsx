/**
 * AddonGate — Paywall wrapper component for add-on gated features.
 *
 * If the user has the addon active, renders children normally.
 * Otherwise, shows a blurred preview with an upsell CTA.
 *
 * Usage:
 *   <AddonGate addonId="creative_premium" featureName="URL-to-Video en masse">
 *     <URLToVideoSection />
 *   </AddonGate>
 *
 *   <AddonGate addonId="white_label" featureName="Rapports AIO Marque Blanche">
 *     <WhiteLabelConfigPanel />
 *   </AddonGate>
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { useAddons, type AddonId } from '../../hooks/useAddons';
import { toast } from '@blinkdotnew/ui';

interface AddonGateProps {
  children: React.ReactNode;
  addonId: AddonId;
  featureName?: string;
  /** If true, shows a 5-second peek (like FeaturePreview) */
  allowPeek?: boolean;
}

const ADDON_DISPLAY: Record<AddonId, {
  label: string;
  price: string;
  badge: string;
  color: string;
  borderColor: string;
  features: string[];
}> = {
  creative_premium: {
    label: 'Creative Studio Hyper-Automation',
    price: '+39€ HT/mois',
    badge: '🎬 Hyper-Automation',
    color: '#818CF8',
    borderColor: 'rgba(129,140,248,.3)',
    features: [
      'URL-to-Video en masse (illimité)',
      'Scripts IA avancés multi-format',
      'Watermarking automatique',
      'Templates vidéo premium',
    ],
  },
  white_label: {
    label: 'Agence White-Label & Rapports AIO',
    price: '+49€ HT/mois',
    badge: '🏷️ White-Label',
    color: '#F59E0B',
    borderColor: 'rgba(245,158,11,.3)',
    features: [
      'Rapports AIO sans marque Kompilot',
      'Logo personnalisé sur PDF',
      'Domaine CNAME pour dashboards',
      'Exports PDF aux couleurs de votre agence',
    ],
  },
};

export function AddonGate({ children, addonId, featureName, allowPeek = true }: AddonGateProps) {
  const { hasCreativePremium, hasWhiteLabel, subscribe, subscribing, loading } = useAddons();
  const [peeking, setPeeking] = useState(false);

  const isUnlocked = addonId === 'creative_premium' ? hasCreativePremium : hasWhiteLabel;

  // If unlocked, render children directly
  if (isUnlocked) {
    return <>{children}</>;
  }

  // If still loading, show a skeleton
  if (loading) {
    return (
      <div style={{
        background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 16, padding: '40px', textAlign: 'center',
      }}>
        <Loader2 size={24} className="animate-spin" style={{ color: '#64748B', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B', fontSize: '.82rem' }}>Vérification de l'accès…</p>
      </div>
    );
  }

  const display = ADDON_DISPLAY[addonId];

  const handleSubscribe = async () => {
    try {
      await subscribe(addonId);
      toast.success(`${display.label} activé !`, {
        description: 'Votre add-on est maintenant actif sur votre abonnement.',
      });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'activation');
    }
  };

  const handlePeek = () => {
    if (!allowPeek) return;
    setPeeking(true);
    setTimeout(() => setPeeking(false), 5000);
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      {/* Content (blurred or peeking) */}
      <div style={{
        filter: peeking ? 'none' : 'blur(8px) saturate(0.3) brightness(0.5)',
        transition: 'filter 0.6s ease',
        pointerEvents: peeking ? 'auto' : 'none',
        userSelect: peeking ? 'auto' : 'none',
      }}>
        {children}
      </div>

      {/* Upsell overlay */}
      <AnimatePresence>
        {!peeking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, padding: 28, zIndex: 10,
              background: 'rgba(15,23,42,0.82)',
              backdropFilter: 'blur(6px)',
            }}
          >
            {/* Lock icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${display.color}15`, border: `1px solid ${display.borderColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={22} color={display.color} />
            </div>

            {/* Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${display.color}12`, border: `1px solid ${display.borderColor}`,
              borderRadius: 9999, padding: '4px 14px',
              fontSize: '.72rem', fontWeight: 700, color: display.color,
            }}>
              {display.badge}
            </span>

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '1.05rem', margin: '0 0 4px' }}>
                {featureName || display.label}
              </p>
              <p style={{ color: '#94A3B8', fontSize: '.82rem', margin: 0 }}>
                Débloquez cette fonctionnalité pour aller plus loin.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 280 }}>
              {display.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color={display.color} style={{ flexShrink: 0 }} />
                  <span style={{ color: '#CBD5E1', fontSize: '.78rem' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: `linear-gradient(135deg, ${display.color}, ${display.color}dd)`,
                  color: '#fff', fontWeight: 700, fontSize: '.85rem',
                  border: 'none', borderRadius: 12, padding: '12px 24px',
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                  boxShadow: `0 0 20px ${display.color}40`,
                  transition: 'transform .15s',
                  opacity: subscribing ? 0.7 : 1,
                }}
              >
                {subscribing
                  ? <><Loader2 size={14} className="animate-spin" /> Activation…</>
                  : <>{display.price} — Activer <ArrowUpRight size={14} /></>
                }
              </button>

              {allowPeek && (
                <button
                  onClick={handlePeek}
                  style={{
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.12)',
                    color: '#94A3B8', fontWeight: 600, fontSize: '.78rem',
                    borderRadius: 12, padding: '12px 18px',
                    cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  Aperçu 5s
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Peek timer indicator */}
      <AnimatePresence>
        {peeking && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 20,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(15,23,42,.88)', backdropFilter: 'blur(8px)',
              border: `1px solid ${display.borderColor}`,
              borderRadius: 8, padding: '6px 14px',
            }}
          >
            <span style={{ fontSize: '.7rem', color: display.color, fontWeight: 700 }}>Aperçu…</span>
            <motion.div
              animate={{ width: ['100%', '0%'] }}
              transition={{ duration: 5, ease: 'linear' }}
              style={{
                height: 3, borderRadius: 2, overflow: 'hidden',
                background: `${display.color}30`, width: 50, flexShrink: 0,
              }}
            >
              <div style={{ height: '100%', background: display.color, borderRadius: 2 }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
