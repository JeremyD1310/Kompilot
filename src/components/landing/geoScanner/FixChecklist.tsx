/**
 * FixChecklist — Actionable error checklist shown after GEO scan.
 * Each item has a "⚡ Corriger instantanément" button that:
 *   1. Shows an AI writing animation (fake code lines)
 *   2. In demo mode → shows conversion gate (🔑 message + CTA)
 *   3. When "applied" → marks item as fixed (green checkmark)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlockerItem } from './blockerData';

// ── Types ─────────────────────────────────────────────────────────────────────

type ItemState = 'idle' | 'writing' | 'gate' | 'fixed';

// ── AI Writing Animation ───────────────────────────────────────────────────────

function AIWritingAnimation({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);

  // Reveal lines one by one
  useState(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= lines.length) {
        clearInterval(interval);
        setTimeout(onDone, 500);
      }
    }, 260);
    return () => clearInterval(interval);
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        background: '#0B1120',
        border: '1px solid rgba(6,182,212,.25)',
        borderRadius: 10,
        padding: '10px 14px',
        marginTop: 10,
        fontFamily: 'monospace',
        fontSize: '.72rem',
        overflow: 'hidden',
      }}
    >
      {lines.slice(0, visibleCount).map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ margin: '2px 0', color: line.startsWith('>') ? '#67E8F9' : '#6EE7B7' }}
        >
          {line}
        </motion.p>
      ))}
      {visibleCount < lines.length && (
        <span style={{ color: '#06B6D4', animation: 'scanPulse 0.8s ease-in-out infinite' }}>▋</span>
      )}
    </motion.div>
  );
}

// ── Conversion Gate ────────────────────────────────────────────────────────────

function ConversionGate({ onCta, onDismiss }: { onCta: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        marginTop: 10,
        background: 'linear-gradient(135deg, rgba(13,21,38,.98), rgba(15,23,42,.99))',
        border: '1px solid rgba(249,115,22,.35)',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 0 28px rgba(249,115,22,.1)',
      }}
    >
      <p style={{ color: '#FED7AA', fontWeight: 700, fontSize: '.82rem', margin: '0 0 6px' }}>
        🔑 Configuration prête !
      </p>
      <p style={{ color: '#94A3B8', fontSize: '.75rem', margin: '0 0 12px', lineHeight: 1.5 }}>
        Pour injecter cette correction sur votre établissement et activer la protection en continu,
        validez votre essai gratuit de 14 jours.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCta}
          style={{
            flex: 1, minWidth: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'linear-gradient(135deg, #0D9488, #0f766e)',
            color: '#fff', fontWeight: 700, fontSize: '.8rem',
            borderRadius: 9, padding: '10px 16px',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 0 16px rgba(13,148,136,.4)',
          }}
        >
          🚀 Activer mon essai gratuit →
        </motion.button>
        <button
          onClick={onDismiss}
          style={{
            color: '#475569', fontSize: '.72rem', background: 'none',
            border: 'none', cursor: 'pointer', padding: '0 8px',
          }}
        >
          Plus tard
        </button>
      </div>
      <p style={{ color: '#334155', fontSize: '.67rem', margin: '8px 0 0', textAlign: 'center' }}>
        ✓ 14 jours gratuits · Sans carte bancaire · Accès immédiat
      </p>
    </motion.div>
  );
}

// ── Single checklist item ──────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { color: '#F87171', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)', label: 'Critique' },
  high:     { color: '#FBBF24', bg: 'rgba(251,191,36,.06)', border: 'rgba(251,191,36,.2)', label: 'Haute' },
  medium:   { color: '#94A3B8', bg: 'rgba(148,163,184,.05)', border: 'rgba(148,163,184,.15)', label: 'Moyenne' },
};

function ChecklistItem({ item, onCta }: { item: BlockerItem; onCta: () => void }) {
  const [state, setState] = useState<ItemState>('idle');
  const cfg = SEVERITY_CONFIG[item.severity];

  const handleFix = () => {
    if (state !== 'idle') return;
    setState('writing');
  };

  const handleWritingDone = () => {
    setState('gate');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: state === 'fixed' ? 'rgba(16,185,129,.06)' : cfg.bg,
        border: `1px solid ${state === 'fixed' ? 'rgba(16,185,129,.25)' : cfg.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        transition: 'all .3s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Status icon */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: state === 'fixed' ? '#10B981' : cfg.bg,
          border: `1.5px solid ${state === 'fixed' ? '#10B981' : cfg.color}`,
          fontSize: '.65rem', color: state === 'fixed' ? '#fff' : cfg.color, fontWeight: 900,
        }}>
          {state === 'fixed' ? '✓' : '✕'}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{
              fontSize: '.8rem', fontWeight: 700,
              color: state === 'fixed' ? '#6EE7B7' : '#E2E8F0',
              textDecoration: state === 'fixed' ? 'line-through' : 'none',
              opacity: state === 'fixed' ? 0.7 : 1,
            }}>
              {item.label}
            </span>
            <span style={{
              fontSize: '.62rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 9999, border: `1px solid ${cfg.border}`,
              color: cfg.color, flexShrink: 0,
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#F87171', marginLeft: 'auto', flexShrink: 0 }}>
              {item.impact}
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '.72rem', margin: 0 }}>{item.detail}</p>
        </div>

        {/* Action button */}
        {state === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFix}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', fontWeight: 700, fontSize: '.72rem',
              borderRadius: 8, padding: '7px 12px',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 0 14px rgba(5,150,105,.35)',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ Corriger instantanément
          </motion.button>
        )}
        {state === 'writing' && (
          <span style={{ flexShrink: 0, color: '#67E8F9', fontSize: '.7rem', fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 4 }}>
            IA en cours…
          </span>
        )}
        {state === 'gate' && (
          <span style={{ flexShrink: 0, color: '#FB923C', fontSize: '.7rem', fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 4 }}>
            🔑 Prêt
          </span>
        )}
        {state === 'fixed' && (
          <span style={{ flexShrink: 0, color: '#10B981', fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: 4 }}>
            ✓ Appliqué
          </span>
        )}
      </div>

      {/* Writing animation */}
      <AnimatePresence>
        {state === 'writing' && (
          <AIWritingAnimation lines={item.fixLines} onDone={handleWritingDone} />
        )}
      </AnimatePresence>

      {/* Conversion gate */}
      <AnimatePresence>
        {state === 'gate' && (
          <ConversionGate
            onCta={() => { setState('idle'); onCta(); }}
            onDismiss={() => setState('fixed')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── FixChecklist (exported) ────────────────────────────────────────────────────

interface Props {
  items: BlockerItem[];
  onCta: () => void;
  query: string;
}

export function FixChecklist({ items, onCta, query }: Props) {
  const fixedCount = 0; // items start as idle

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.25)',
          color: '#FB923C', borderRadius: 9999, padding: '4px 12px',
          fontSize: '.72rem', fontWeight: 700,
        }}>
          🚨 {items.length} points de blocage détectés pour « {query} »
        </span>
        <span style={{ color: '#475569', fontSize: '.7rem', marginLeft: 'auto' }}>
          Cliquez ⚡ pour corriger en 1 clic
        </span>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <ChecklistItem item={item} onCta={onCta} />
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 14, textAlign: 'center' }}
      >
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(13,148,136,.5)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onCta}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #0D9488, #0f766e)',
            color: '#fff', fontWeight: 800, fontSize: '.88rem',
            borderRadius: 13, padding: '13px 28px',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 0 28px rgba(13,148,136,.4)',
          }}
        >
          🚀 Corriger tous les points automatiquement →
        </motion.button>
        <p style={{ color: '#475569', fontSize: '.7rem', marginTop: 8 }}>
          ✓ Essai 14 jours gratuit · Sans carte bancaire · Accès immédiat
        </p>
      </motion.div>
    </div>
  );
}
