/**
 * ScanEmailCapture — Non-intrusive email capture form shown during the
 * 35-second scanning phase of GeoScannerFlash.
 *
 * Strategy: user is watching the scan animation. At ~10s in, a minimal
 * email form slides up from the bottom of the scan container.
 * "Recevez votre rapport AIO complet par email" — 1 field + 1 button.
 * On submit, saves lead to backend and shows a confirmation message.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, ArrowRight } from 'lucide-react';

interface Props {
  visible: boolean;
  query: string;
  /** Called when email is captured — parent can track the signal */
  onCaptured?: (email: string) => void;
}

export function ScanEmailCapture({ visible, query, onCaptured }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when visibility changes
  useEffect(() => {
    if (!visible) {
      setEmail('');
      setSubmitted(false);
      setSaving(false);
    }
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitted || saving) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return;

    setSaving(true);
    try {
      // Save to backend leads table (fire-and-forget)
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';
      await fetch(`${backendUrl}/api/scanner/lead-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          query,
          source: 'geo_scanner_email_capture',
        }),
      }).catch(() => {/* non-fatal */});

      setSubmitted(true);
      onCaptured?.(email.trim());
    } catch {
      // Still show success — we can retry server-side
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.3 }}
          style={{
            marginTop: 16,
            background: 'linear-gradient(135deg, rgba(13,148,136,.08), rgba(99,102,241,.06))',
            border: '1px solid rgba(13,148,136,.25)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, transparent 30%, rgba(13,148,136,.04) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'scanEmailShimmer 3s ease-in-out infinite',
          }} />

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexWrap: 'wrap' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={16} color="#0D9488" />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.82rem', margin: '0 0 2px', lineHeight: 1.3 }}>
                  Rapport AIO complet
                </p>
                <p style={{ color: '#64748B', fontSize: '.7rem', margin: 0 }}>
                  Recevez votre score de visibilité IA + 3 recommandations
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flex: '0 0 auto', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  required
                  style={{
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.12)',
                    borderRadius: 10, padding: '10px 14px',
                    color: '#E2E8F0', fontSize: '.78rem', fontWeight: 500,
                    outline: 'none', width: 190, flexShrink: 0,
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(13,148,136,.5)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
                />
                <button
                  type="submit"
                  disabled={saving || !email.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: email.trim() ? 'linear-gradient(135deg, #0D9488, #0f766e)' : 'rgba(13,148,136,.2)',
                    color: '#fff', fontWeight: 700, fontSize: '.78rem',
                    border: 'none', borderRadius: 10, padding: '10px 16px',
                    cursor: email.trim() ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all .2s',
                    boxShadow: email.trim() ? '0 0 16px rgba(13,148,136,.3)' : 'none',
                  }}
                >
                  {saving ? '…' : <><ArrowRight size={13} /> Envoyer</>}
                </button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={16} color="#10B981" />
              </div>
              <div>
                <p style={{ color: '#6EE7B7', fontWeight: 700, fontSize: '.82rem', margin: '0 0 2px' }}>
                  Rapport envoyé à {email}
                </p>
                <p style={{ color: '#64748B', fontSize: '.7rem', margin: 0 }}>
                  Vérifiez votre boîte mail dans quelques instants.
                </p>
              </div>
            </motion.div>
          )}

          <style>{`
            @keyframes scanEmailShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
