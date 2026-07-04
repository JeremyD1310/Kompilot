/**
 * AioCreditPackCard — Purchase card for the AIO Sync & Creative Studio credit pack.
 *
 * Shown in:
 *   - SubscriptionPage (billing tab)
 *   - Quota alert banner (when user hits 80% threshold)
 *   - Creative Studio paywall
 */

import { motion } from 'framer-motion';
import { Video, Search, Zap, Loader2, Check, Clock } from 'lucide-react';
import { useAioCreditPack } from '../../hooks/useAioCreditPack';
import { toast } from '@blinkdotnew/ui';

interface AioCreditPackCardProps {
  /** Compact mode for inline display (e.g. inside a banner) */
  compact?: boolean;
  /** Called after successful purchase initiation */
  onPurchaseStarted?: () => void;
}

export function AioCreditPackCard({ compact = false, onPurchaseStarted }: AioCreditPackCardProps) {
  const { pack, purchase, purchasing, error } = useAioCreditPack();

  const handlePurchase = async () => {
    const result = await purchase();
    if (result.url) {
      toast.success('Redirection vers Stripe…', {
        description: 'Le paiement s\'effectue dans un nouvel onglet.',
      });
      onPurchaseStarted?.();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        background: 'linear-gradient(135deg, rgba(13,148,136,.08), rgba(129,140,248,.06))',
        border: '1px solid rgba(13,148,136,.2)',
        borderRadius: 14, padding: '16px 20px',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.88rem', margin: '0 0 2px' }}>
            {pack.label}
          </p>
          <p style={{ color: '#94A3B8', fontSize: '.75rem', margin: 0 }}>
            {pack.lumaCredits} vidéos Luma AI + {pack.serpapiCredits} requêtes SerpApi
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#0D9488', fontWeight: 900, fontSize: '1.2rem', margin: '0 0 4px' }}>
            {pack.priceHT} € HT
          </p>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg, #0D9488, #0f766e)',
              color: '#fff', fontWeight: 700, fontSize: '.78rem',
              border: 'none', borderRadius: 10, padding: '8px 16px',
              cursor: purchasing ? 'not-allowed' : 'pointer',
              opacity: purchasing ? 0.7 : 1,
            }}
          >
            {purchasing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {purchasing ? '…' : 'Recharger'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,21,38,.98), rgba(8,14,28,.99))',
        border: '1px solid rgba(13,148,136,.25)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,.3), 0 0 0 1px rgba(13,148,136,.08)',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,.12), rgba(129,140,248,.08))',
        padding: '20px 24px', borderBottom: '1px solid rgba(13,148,136,.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#0D9488" />
          </div>
          <div>
            <h3 style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
              {pack.label}
            </h3>
            <p style={{ color: '#64748B', fontSize: '.75rem', margin: 0 }}>
              Achat unique — crédits sans limite de durée
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {/* Credits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(129,140,248,.06)', border: '1px solid rgba(129,140,248,.15)',
            borderRadius: 14, padding: '16px', textAlign: 'center',
          }}>
            <Video size={20} color="#818CF8" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: '#818CF8', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 2px' }}>
              {pack.lumaCredits}
            </p>
            <p style={{ color: '#94A3B8', fontSize: '.72rem', margin: 0 }}>
              Générations vidéo Luma AI
            </p>
          </div>
          <div style={{
            background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.15)',
            borderRadius: 14, padding: '16px', textAlign: 'center',
          }}>
            <Search size={20} color="#0D9488" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: '#0D9488', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 2px' }}>
              {pack.serpapiCredits}
            </p>
            <p style={{ color: '#94A3B8', fontSize: '.72rem', margin: 0 }}>
              Requêtes SerpApi AIO Sync
            </p>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 20 }}>
          {[
            'Crédits sans limite de durée — consommés à la demande',
            'Activés instantanément après paiement',
            'Cumulables avec votre forfait mensuel/annuel',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />
              <span style={{ color: '#CBD5E1', fontSize: '.78rem' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.15)',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div>
            <p style={{ color: '#0D9488', fontWeight: 900, fontSize: '1.6rem', margin: 0, lineHeight: 1 }}>
              {pack.priceHT} €
              <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748B', marginLeft: 4 }}>HT</span>
            </p>
            <p style={{ color: '#64748B', fontSize: '.7rem', margin: '2px 0 0' }}>
              {pack.priceTTC.toFixed(2)} € TTC
            </p>
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: purchasing ? 'rgba(13,148,136,.2)' : 'linear-gradient(135deg, #0D9488, #0f766e)',
              color: '#fff', fontWeight: 700, fontSize: '.88rem',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              cursor: purchasing ? 'not-allowed' : 'pointer',
              boxShadow: purchasing ? 'none' : '0 0 20px rgba(13,148,136,.3)',
              transition: 'all .2s',
              opacity: purchasing ? 0.7 : 1,
            }}
          >
            {purchasing
              ? <><Loader2 size={15} className="animate-spin" /> Redirection…</>
              : <><Zap size={15} /> Recharger maintenant</>}
          </button>
        </div>

        {error && (
          <p style={{ color: '#EF4444', fontSize: '.75rem', margin: '10px 0 0', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}
