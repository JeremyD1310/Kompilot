/** Bottom action bar for the client approval view */
import { useState } from 'react';
import { CheckCircle, MessageSquare, Loader2 } from 'lucide-react';

interface ApprovalActionsProps {
  isExpired: boolean;
  onApprove: () => Promise<void>;
  onRequestMod: (text: string) => Promise<void>;
}

export function ApprovalActions({ isExpired, onApprove, onRequestMod }: ApprovalActionsProps) {
  const [modText, setModText] = useState('');
  const [showModInput, setShowModInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isExpired) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 14, padding: '16px' }}>
          <p style={{ fontWeight: 700, color: '#EF4444', fontSize: '.88rem', marginBottom: 4 }}>⏰ Lien expiré</p>
          <p style={{ color: '#94A3B8', fontSize: '.8rem' }}>Contactez votre agence pour un nouveau lien.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setSubmitting(true);
    try { await onApprove(); } finally { setSubmitting(false); }
  };

  const handleSendMod = async () => {
    if (!modText.trim()) return;
    setSubmitting(true);
    try { await onRequestMod(modText.trim()); } finally { setSubmitting(false); }
  };

  return (
    <div style={{
      position: 'sticky', bottom: 0,
      padding: '16px 20px 24px',
      background: 'linear-gradient(180deg, transparent 0%, #F8FAFC 30%)',
      zIndex: 10,
    }}>
      {!showModInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleApprove}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
              color: '#fff', border: 'none', borderRadius: 16, padding: '18px 24px',
              fontWeight: 800, fontSize: '1.05rem', cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(34,197,94,.35)', width: '100%',
              opacity: submitting ? 0.7 : 1, transition: 'opacity .2s',
            }}
          >
            {submitting ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
            ✅ Approuver le planning de la semaine
          </button>
          <button
            onClick={() => setShowModInput(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0',
              borderRadius: 16, padding: '16px 24px', fontWeight: 700, fontSize: '.95rem',
              cursor: 'pointer', width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,.06)',
            }}
          >
            <MessageSquare size={18} />
            💬 Demander une modification
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            value={modText}
            onChange={e => setModText(e.target.value)}
            placeholder="Décrivez la modification souhaitée…"
            rows={3}
            autoFocus
            style={{
              width: '100%', padding: '13px 14px',
              background: '#fff', border: '1.5px solid #E2E8F0',
              borderRadius: 14, fontSize: '.88rem', color: '#0F172A',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowModInput(false)}
              style={{ flex: 1, padding: '14px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 12, fontWeight: 600, fontSize: '.87rem', color: '#64748B', cursor: 'pointer' }}
            >Annuler</button>
            <button
              onClick={handleSendMod}
              disabled={!modText.trim() || submitting}
              style={{
                flex: 2, padding: '14px',
                background: modText.trim() ? 'linear-gradient(135deg, #6359F8 0%, #8B5CF6 100%)' : '#CBD5E1',
                color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: '.87rem',
                cursor: !modText.trim() || submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <MessageSquare size={16} />}
              Envoyer
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
