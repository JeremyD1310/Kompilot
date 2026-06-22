/**
 * ValidationLinkGenerator — Magic link generator for agency client approval workflow.
 * Allows agencies to send clients a secure, no-login approval link for AI-scheduled posts.
 */
import { useState } from 'react';
import { Link2, Copy, CheckCircle, Clock, Send, Trash2, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { nanoid } from '../../lib/nanoid';
import { AISpamChecker } from '../shared/AISpamChecker';

interface ApprovalToken {
  id: string;
  userId: string;
  token: string;
  clientName: string;
  agencyName: string;
  agencyLogoUrl?: string;
  whiteLabelDomain?: string;
  postIds: string;
  aiSummary?: string;
  status: 'pending' | 'approved' | 'modification_requested' | 'expired';
  expiresAt: string;
  approvedAt?: string;
  modificationRequest?: string;
  createdAt?: string;
}

// ── Mock posts for demo ──────────────────────────────────────────────────────
const DEMO_POSTS = [
  { id: 'p1', title: 'Promo du weekend — -20% sur la carte', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString() },
  { id: 'p2', title: 'Recette du chef : Tarte tatin revisitée', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 4).toISOString() },
  { id: 'p3', title: 'Bonne fête des pères ! Réservez votre table', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 6).toISOString() },
];

const DEMO_AI_SUMMARY = "Cette semaine, l'IA Kompilot a préparé 3 publications ciblées : une promotion weekend pour booster le trafic du samedi (+18% estimé), un contenu brand editorial sur la signature culinaire du chef, et une publication événementielle fête des pères. Toutes les publications incluent des hashtags géolocalisés et des heures d'envoi optimisées par l'algorithme.";

function getApprovalUrl(token: string, whiteLabelDomain?: string): string {
  const base = whiteLabelDomain
    ? `https://${whiteLabelDomain}`
    : window.location.origin;
  return `${base}/approve/${token}`;
}

function StatusBadge({ status }: { status: ApprovalToken['status'] }) {
  const map = {
    pending: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
    approved: { label: 'Approuvé ✅', color: '#22C55E', bg: 'rgba(34,197,94,.12)' },
    modification_requested: { label: 'Modification demandée 💬', color: '#6359F8', bg: 'rgba(99,89,248,.12)' },
    expired: { label: 'Expiré', color: '#94A3B8', bg: 'rgba(148,163,184,.1)' },
  };
  const s = map[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, border: `1px solid ${s.color}30`,
      color: s.color, borderRadius: 20, padding: '3px 10px',
      fontSize: '.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

function TokenCard({
  token,
  onCopy,
  onDelete,
}: {
  token: ApprovalToken;
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const url = getApprovalUrl(token.token, token.whiteLabelDomain);
  const isExpired = new Date(token.expiresAt) < new Date();
  const effectiveStatus: ApprovalToken['status'] = isExpired && token.status === 'pending' ? 'expired' : token.status;

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(99,89,248,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Link2 size={16} style={{ color: '#6359F8' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '.87rem', color: 'hsl(var(--foreground))', marginBottom: 3 }}>
            {token.clientName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={effectiveStatus} />
            <span style={{ fontSize: '.7rem', color: 'hsl(var(--muted-foreground))' }}>
              <Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
              Expire le {new Date(token.expiresAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onCopy(url)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(99,89,248,.1)', border: '1px solid rgba(99,89,248,.2)',
              color: '#6359F8', borderRadius: 8, padding: '6px 10px',
              fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
            }}
            title="Copier le lien"
          >
            <Copy size={12} />
            Copier
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))', borderRadius: 8, padding: '6px 10px',
              fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
            }}
            title="Prévisualiser"
          >
            <Eye size={12} />
          </a>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))', borderRadius: 8, padding: '6px 8px',
              cursor: 'pointer',
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onDelete(token.id)}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
              color: '#EF4444', borderRadius: 8, padding: '6px 8px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded: modification request */}
      {expanded && token.modificationRequest && (
        <div style={{
          borderTop: '1px solid hsl(var(--border))',
          padding: '12px 16px',
          background: 'rgba(99,89,248,.04)',
        }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, color: '#6359F8', marginBottom: 6 }}>
            💬 Demande de modification du client :
          </p>
          <p style={{ fontSize: '.82rem', color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
            {token.modificationRequest}
          </p>
        </div>
      )}

      {/* Expanded: URL */}
      {expanded && (
        <div style={{
          borderTop: '1px solid hsl(var(--border))',
          padding: '10px 16px',
          background: 'hsl(var(--muted))',
        }}>
          <p style={{ fontSize: '.68rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {url}
          </p>
        </div>
      )}
    </div>
  );
}

interface GenerateFormProps {
  onGenerate: (clientName: string, whiteLabelDomain: string, prospecMsg: string) => Promise<void>;
  loading: boolean;
}

function GenerateForm({ onGenerate, loading }: GenerateFormProps) {
  const [clientName, setClientName] = useState('');
  const [domain, setDomain] = useState('');
  const [prospecMsg, setProspecMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    await onGenerate(clientName.trim(), domain.trim(), prospecMsg.trim());
    setClientName('');
    setDomain('');
    setProspecMsg('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Nom du client *
          </label>
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Ex : Le Petit Bistro"
            required
            style={{
              width: '100%', padding: '9px 12px',
              background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
              borderRadius: 9, fontSize: '.85rem', color: 'hsl(var(--foreground))',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Domaine marque blanche
          </label>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Ex : app.mon-agence.fr"
            style={{
              width: '100%', padding: '9px 12px',
              background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
              borderRadius: 9, fontSize: '.85rem', color: 'hsl(var(--foreground))',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Message de prospection + AI Spam Checker */}
      <div>
        <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Message d'accompagnement (optionnel)
        </label>
        <textarea
          value={prospecMsg}
          onChange={e => setProspecMsg(e.target.value)}
          placeholder="Ex : Bonjour, voici votre planning IA de la semaine. Approuvez en 1 clic…"
          rows={3}
          style={{
            width: '100%', padding: '9px 12px',
            background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
            borderRadius: 9, fontSize: '.85rem', color: 'hsl(var(--foreground))',
            outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
          }}
        />
        {prospecMsg.length > 10 && (
          <div style={{ marginTop: 8 }}>
            <AISpamChecker
              text={prospecMsg}
              compact
              onOptimize={setProspecMsg}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !clientName.trim()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: loading ? 'rgba(99,89,248,.5)' : '#6359F8',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '11px 20px', fontWeight: 700, fontSize: '.87rem',
          cursor: loading || !clientName.trim() ? 'not-allowed' : 'pointer',
          transition: 'opacity .2s',
          alignSelf: 'flex-end',
        }}
        className="hover:opacity-90"
      >
        <Link2 size={15} />
        {loading ? 'Génération…' : '🔗 Générer le lien de validation client'}
      </button>
    </form>
  );
}

export function ValidationLinkGenerator() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<ApprovalToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleGenerate = async (clientName: string, whiteLabelDomain: string, _prospecMsg: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      const postIds = JSON.stringify(DEMO_POSTS.map(p => p.id));
      const record = {
        id: nanoid(),
        userId: user.id,
        token,
        clientName,
        agencyName: 'Mon Agence',
        whiteLabelDomain: whiteLabelDomain || undefined,
        postIds,
        aiSummary: DEMO_AI_SUMMARY,
        status: 'pending' as const,
        expiresAt,
      };
      await blink.db.clientApprovalTokens.create(record);
      setTokens(prev => [record, ...prev]);
    } catch (err) {
      setError('Erreur lors de la génération du lien. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await blink.db.clientApprovalTokens.delete(id);
      setTokens(prev => prev.filter(t => t.id !== id));
    } catch {
      // optimistic deletion
      setTokens(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1.5px solid hsl(var(--border))',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(99,89,248,.08) 0%, rgba(99,89,248,.02) 100%)',
          borderBottom: collapsed ? 'none' : '1px solid hsl(var(--border))',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'rgba(99,89,248,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Send size={18} style={{ color: '#6359F8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '.92rem', color: 'hsl(var(--foreground))' }}>
            Validation Client — Lien Magique
          </p>
          <p style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
            Envoyez un lien sécurisé pour que votre client approuve le planning IA en 1 clic
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tokens.length > 0 && (
            <span style={{
              background: '#6359F8', color: '#fff',
              borderRadius: 20, padding: '2px 9px', fontSize: '.7rem', fontWeight: 700,
            }}>
              {tokens.length} lien{tokens.length > 1 ? 's' : ''}
            </span>
          )}
          {copied && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22C55E', fontSize: '.78rem', fontWeight: 600 }}>
              <CheckCircle size={13} /> Copié !
            </span>
          )}
          {collapsed ? <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '20px' }}>
          {/* How it works strip */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            {[
              { step: '1', label: 'Entrez le nom du client', icon: '✏️' },
              { step: '2', label: 'Copiez et envoyez le lien', icon: '📤' },
              { step: '3', label: 'Le client approuve en 1 clic', icon: '✅' },
            ].map(s => (
              <div key={s.step} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'hsl(var(--muted))', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 160,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#6359F8', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.68rem', fontWeight: 900, flexShrink: 0,
                }}>{s.step}</span>
                <span style={{ fontSize: '.75rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                  {s.icon} {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 12, padding: '16px',
            marginBottom: 20,
          }}>
            <GenerateForm onGenerate={handleGenerate} loading={loading} />
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              color: '#EF4444', fontSize: '.82rem',
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Token list */}
          {tokens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
                Liens actifs
              </p>
              {tokens.map(t => (
                <TokenCard key={t.id} token={t} onCopy={handleCopy} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {tokens.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: 'hsl(var(--muted-foreground))',
            }}>
              <Link2 size={28} style={{ margin: '0 auto 10px', opacity: .25 }} />
              <p style={{ fontSize: '.82rem' }}>Aucun lien généré — créez votre premier lien de validation ci-dessus</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
