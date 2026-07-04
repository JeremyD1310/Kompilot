/**
 * QuotaAlertBanner — In-app notification banner shown when quota reaches 80%.
 *
 * Reads from user metadata (notifications array) and displays a persistent,
 * non-intrusive banner with a direct link to the credit pack checkout.
 *
 * Shown on the dashboard and any page consuming API credits.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap, ChevronRight } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { AioCreditPackCard } from './AioCreditPackCard';

interface QuotaNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
}

export function QuotaAlertBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<QuotaNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showPack, setShowPack] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Read quota alerts from user metadata
    const fetchAlerts = async () => {
      try {
        const rows = await (blink.db as any).users.list({ where: { id: user.id }, limit: 1 });
        const meta = rows?.[0]?.metadata;
        if (!meta) return;

        const parsed = typeof meta === 'string' ? JSON.parse(meta) : meta;
        const notifications = (parsed.notifications || []) as QuotaNotification[];
        const quotaAlerts = notifications
          .filter(n => n.type === 'quota_alert' && !n.read)
          .slice(-3); // show max 3 recent alerts

        setAlerts(quotaAlerts);
      } catch { /* non-fatal */ }
    };

    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  const latest = visibleAlerts[0]; // show the most recent

  return (
    <div style={{ marginBottom: 16 }}>
      <AnimatePresence>
        <motion.div
          key={latest.id}
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(239,68,68,.04))',
            border: '1px solid rgba(245,158,11,.25)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertTriangle size={16} color="#F59E0B" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#F59E0B', fontWeight: 700, fontSize: '.82rem', margin: 0 }}>
                  {latest.title}
                </p>
                <p style={{ color: '#94A3B8', fontSize: '.72rem', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {latest.body}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setShowPack(!showPack)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#fff', fontWeight: 700, fontSize: '.72rem',
                    border: 'none', borderRadius: 8, padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={12} /> Recharger
                </button>
                <button
                  onClick={() => dismiss(latest.id)}
                  style={{
                    background: 'rgba(255,255,255,.06)', border: 'none',
                    borderRadius: 8, padding: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={14} color="#64748B" />
                </button>
              </div>
            </div>

            {/* Expandable credit pack */}
            <AnimatePresence>
              {showPack && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 18px 18px' }}>
                    <AioCreditPackCard compact onPurchaseStarted={() => dismiss(latest.id)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
