/**
 * MobileValidationWidget
 * Option "Déléguer la validation au Copilote (Mode SMS/Push)"
 * Simule visuellement une notification mobile interactive permettant
 * d'approuver ou rejeter une suggestion de post IA en 1 clic.
 */
import { useState } from 'react';
import { Smartphone, Bell, CheckCircle, XCircle, ChevronDown, ChevronUp, Zap, BellRing, MessageSquare, Sparkles } from 'lucide-react';

interface PostPreview {
  id: string;
  text: string;
  channel: string;
  scheduledAt: string;
  emoji: string;
}

const DEMO_POSTS: PostPreview[] = [
  {
    id: 'np1',
    text: '☀️ Pic de chaleur prévu vendredi — venez vous rafraîchir avec notre carte boissons fraîches ! Profitez de -20% sur tous les softdrinks.',
    channel: 'Instagram',
    scheduledAt: 'Vendredi 14h00',
    emoji: '☀️',
  },
  {
    id: 'np2',
    text: '🏆 Fête du quartier ce weekend ! On vous attend pour fêter ça ensemble. Ambiance garantie 🎉',
    channel: 'Facebook',
    scheduledAt: 'Samedi 09h00',
    emoji: '🎉',
  },
  {
    id: 'np3',
    text: '🍂 Rentrée des classes ! Nos formules familiales sont de retour. Réservez dès maintenant 👨‍👩‍👧‍👦',
    channel: 'Instagram',
    scheduledAt: 'Lundi 18h00',
    emoji: '🍂',
  },
];

type PostAction = 'approved' | 'rejected' | null;

// ── Phone mockup notification ──────────────────────────────────────────────
function PhoneNotification({
  post,
  action,
  onApprove,
  onReject,
  delay,
}: {
  post: PostPreview;
  action: PostAction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  delay: number;
}) {
  const isDone = action !== null;

  return (
    <div
      style={{
        background: isDone
          ? action === 'approved' ? 'rgba(22,163,74,.06)' : 'rgba(220,38,38,.06)'
          : 'rgba(255,255,255,.95)',
        border: `1.5px solid ${isDone
          ? action === 'approved' ? 'rgba(22,163,74,.3)' : 'rgba(220,38,38,.2)'
          : 'rgba(0,0,0,.1)'}`,
        borderRadius: 18,
        padding: '12px 14px',
        boxShadow: isDone ? 'none' : '0 4px 24px rgba(0,0,0,.12)',
        transition: 'all .3s ease',
        animationDelay: `${delay}ms`,
      }}
      className="animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Notification header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #6359F8, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sparkles size={14} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '.78rem', color: '#111' }}>Kompilot IA</span>
            <span style={{ fontSize: '.65rem', color: '#94A3B8' }}>{post.scheduledAt}</span>
          </div>
          <span style={{ fontSize: '.68rem', color: '#6359F8', fontWeight: 600 }}>
            {post.channel}
          </span>
        </div>
      </div>

      {/* Post preview */}
      <p style={{
        fontSize: '.78rem', color: '#334155', lineHeight: 1.45,
        background: 'rgba(99,89,248,.05)', borderRadius: 10, padding: '8px 10px',
        marginBottom: 10,
        borderLeft: '3px solid #6359F8',
      }}>
        {post.text.length > 110 ? post.text.slice(0, 110) + '…' : post.text}
      </p>

      {/* Action row */}
      {!isDone ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onReject(post.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.2)',
              color: '#DC2626', borderRadius: 12, padding: '9px 0',
              fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
            }}
          >
            <XCircle size={15} /> Rejeter
          </button>
          <button
            onClick={() => onApprove(post.id)}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'linear-gradient(135deg, #16A34A, #22C55E)',
              border: 'none', color: '#fff', borderRadius: 12, padding: '9px 0',
              fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,197,94,.3)',
            }}
          >
            <CheckCircle size={15} /> ✅ Approuver
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '8px 0',
          color: action === 'approved' ? '#16A34A' : '#DC2626',
          fontWeight: 700, fontSize: '.82rem',
        }}>
          {action === 'approved'
            ? <><CheckCircle size={15} /> Publication approuvée — planifiée ✅</>
            : <><XCircle size={15} /> Publication rejetée ❌</>
          }
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MobileValidationWidget() {
  const [enabled, setEnabled] = useState(false);
  const [actions, setActions] = useState<Record<string, PostAction>>({});
  const [expanded, setExpanded] = useState(false);
  const [channel, setChannel] = useState<'push' | 'sms'>('push');

  const handleApprove = (id: string) => setActions(prev => ({ ...prev, [id]: 'approved' }));
  const handleReject = (id: string) => setActions(prev => ({ ...prev, [id]: 'rejected' }));

  const doneCount = Object.values(actions).filter(Boolean).length;
  const approvedCount = Object.values(actions).filter(v => v === 'approved').length;

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1.5px solid hsl(var(--border))',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {/* Header toggle */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', cursor: 'pointer',
          background: enabled
            ? 'linear-gradient(135deg, rgba(99,89,248,.1) 0%, rgba(99,89,248,.03) 100%)'
            : 'linear-gradient(135deg, hsl(var(--muted)) 0%, transparent 100%)',
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: enabled ? 'rgba(99,89,248,.15)' : 'hsl(var(--muted))',
          border: `1px solid ${enabled ? 'rgba(99,89,248,.25)' : 'hsl(var(--border))'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Smartphone size={20} style={{ color: enabled ? '#6359F8' : 'hsl(var(--muted-foreground))' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: '.92rem', color: 'hsl(var(--foreground))' }}>
              Déléguer la validation au Copilote
            </span>
            <span style={{
              background: enabled ? 'rgba(99,89,248,.12)' : 'hsl(var(--muted))',
              color: enabled ? '#6359F8' : 'hsl(var(--muted-foreground))',
              border: `1px solid ${enabled ? 'rgba(99,89,248,.25)' : 'hsl(var(--border))'}`,
              borderRadius: 20, padding: '2px 10px', fontSize: '.68rem', fontWeight: 700,
            }}>
              {enabled ? '🔔 Mode SMS/Push ACTIF' : 'Désactivé'}
            </span>
          </div>
          <p style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))' }}>
            Recevez les suggestions IA directement sur votre téléphone — approuvez en 1 tap
          </p>
        </div>
        {/* Toggle switch */}
        <div
          onClick={(e) => { e.stopPropagation(); setEnabled(v => !v); if (!enabled) setExpanded(true); }}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: enabled ? '#6359F8' : 'hsl(var(--muted))',
            border: `1.5px solid ${enabled ? '#6359F8' : 'hsl(var(--border))'}`,
            position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 2,
            left: enabled ? 20 : 2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.25)',
            transition: 'left .2s',
          }} />
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid hsl(var(--border))' }}>
          {/* Channel selector */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 18 }}>
            {(['push', 'sms'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px 0',
                  background: channel === ch ? '#6359F8' : 'hsl(var(--muted))',
                  border: `1.5px solid ${channel === ch ? '#6359F8' : 'hsl(var(--border))'}`,
                  color: channel === ch ? '#fff' : 'hsl(var(--foreground))',
                  borderRadius: 12, fontWeight: 700, fontSize: '.83rem', cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                {ch === 'push' ? <><BellRing size={15} /> Notification Push</> : <><MessageSquare size={15} /> SMS</>}
              </button>
            ))}
          </div>

          {/* How it works strip */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap',
          }}>
            {[
              { n: '1', label: 'L\'IA prépare le post', icon: '🤖' },
              { n: '2', label: `Vous recevez 1 ${channel === 'push' ? 'notification' : 'SMS'}`, icon: channel === 'push' ? '📲' : '📱' },
              { n: '3', label: 'Approuvez en 1 tap', icon: '✅' },
            ].map(s => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'hsl(var(--muted))', borderRadius: 10, padding: '7px 12px', flex: 1, minWidth: 150,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#6359F8', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.65rem', fontWeight: 900, flexShrink: 0,
                }}>{s.n}</span>
                <span style={{ fontSize: '.74rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                  {s.icon} {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Phone mockup with notifications */}
          <div style={{
            background: 'linear-gradient(160deg, #1E1B4B 0%, #312E81 100%)',
            borderRadius: 24, padding: '24px 20px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>09:41</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i < 2 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.2)' }} />
                ))}
              </div>
              <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)' }}>🔋 87%</span>
            </div>

            {/* Notification banner label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
            }}>
              <Bell size={12} style={{ color: 'rgba(255,255,255,.5)' }} />
              <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {doneCount === DEMO_POSTS.length
                  ? `✓ ${approvedCount} post${approvedCount > 1 ? 's' : ''} approuvé${approvedCount > 1 ? 's' : ''} · ${DEMO_POSTS.length - approvedCount} rejeté${DEMO_POSTS.length - approvedCount > 1 ? 's' : ''}`
                  : 'Notifications en attente'
                }
              </span>
            </div>

            {/* Notification cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEMO_POSTS.map((post, i) => (
                <PhoneNotification
                  key={post.id}
                  post={post}
                  action={actions[post.id] ?? null}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  delay={i * 80}
                />
              ))}
            </div>

            {/* Quick action footer */}
            <div style={{
              marginTop: 14, display: 'flex', gap: 8,
            }}>
              <button
                onClick={() => DEMO_POSTS.forEach(p => handleReject(p.id))}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                  color: 'rgba(255,255,255,.7)', borderRadius: 12,
                  fontWeight: 600, fontSize: '.75rem', cursor: 'pointer',
                }}
              >
                ✗ Tout rejeter
              </button>
              <button
                onClick={() => DEMO_POSTS.forEach(p => handleApprove(p.id))}
                style={{
                  flex: 2, padding: '10px 0',
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  border: 'none', color: '#fff', borderRadius: 12,
                  fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(34,197,94,.3)',
                }}
              >
                ✅ Tout approuver en 1 tap
              </button>
            </div>
          </div>

          {/* Quota info */}
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,89,248,.06)', border: '1px solid rgba(99,89,248,.15)',
            borderRadius: 10, padding: '9px 14px',
          }}>
            <Zap size={14} style={{ color: '#6359F8', flexShrink: 0 }} />
            <span style={{ fontSize: '.76rem', color: 'hsl(var(--foreground))' }}>
              Le Copilote peut valider jusqu'à <strong>30 posts/mois</strong> automatiquement via {channel === 'push' ? 'notifications push' : 'SMS'} — sans connexion à l'application.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
