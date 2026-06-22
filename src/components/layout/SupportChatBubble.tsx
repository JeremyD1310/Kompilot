/**
 * SupportChatBubble — Floating support chat button + mini panel.
 * Appears in bottom-right corner on all dashboard pages.
 */
import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

export function SupportChatBubble() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    toast.success('✅ Message envoyé ! L\'équipe Kompilot vous répond en moins de 10 min.');
    setTimeout(() => { setSent(false); setOpen(false); }, 2500);
  };

  return (
    <>
      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, zIndex: 9999,
          width: 320, borderRadius: 20,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'chatIn .25s cubic-bezier(.4,0,.2,1)',
        }}>
          <style>{`@keyframes chatIn { from { opacity:0; transform:translateY(16px) scale(.96) } to { opacity:1; transform:none } }`}</style>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0D9488, #2DD4BF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1rem' }}>🚀</span>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Support Kompilot</p>
                <p style={{ fontSize: '.72rem', color: '#22c55e', margin: 0, fontWeight: 600 }}>● En ligne · Répond en 10 min</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4, borderRadius: 8, display: 'flex', transition: 'color .2s' }}>
              <X size={16} />
            </button>
          </div>
          {/* Body */}
          <div style={{ padding: '14px 18px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: '.88rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>Message envoyé !</p>
                <p style={{ fontSize: '.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Nous vous répondons en moins de 10 min.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '.82rem', color: 'hsl(var(--muted-foreground))', marginBottom: 12, lineHeight: 1.5 }}>
                  Besoin d'aide ? L'équipe Kompilot vous répond en 10 min. Laissez votre message ici...
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ex: Comment connecter mon compte Instagram ?"
                  rows={3}
                  style={{
                    width: '100%', borderRadius: 12, border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--muted))', padding: '10px 14px',
                    fontSize: '.82rem', resize: 'none', outline: 'none',
                    color: 'hsl(var(--foreground))', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0D9488')}
                  onBlur={e => (e.target.style.borderColor = 'hsl(var(--border))')}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  style={{
                    marginTop: 10, width: '100%', padding: '11px 0',
                    background: message.trim() ? '#0D9488' : 'hsl(var(--muted))',
                    color: message.trim() ? '#fff' : 'hsl(var(--muted-foreground))',
                    border: 'none', borderRadius: 12, fontSize: '.88rem',
                    fontWeight: 700, cursor: message.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background .2s',
                  }}
                >
                  <Send size={14} /> Envoyer le message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        data-tour="support-chat-bubble"
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 20, right: 24, zIndex: 9999,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: open ? '#0f766e' : '#0D9488',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(13,148,136,.45)',
          transition: 'background .2s, transform .15s',
          transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
        title="Support Kompilot"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
