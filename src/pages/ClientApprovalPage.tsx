/**
 * ClientApprovalPage — /approve/:token
 * Mobile-first external view. No login required for end clients.
 */
import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Clock, Sparkles, AlertCircle, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { blink } from '../blink/client';
import { ApprovalPostCard } from '../components/approval/ApprovalPostCard';
import { ApprovalActions } from '../components/approval/ApprovalActions';
import { notifyApproval } from '../lib/analyticsApi';

interface Post {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
}

interface ApprovalData {
  id: string;
  token: string;
  clientName: string;
  agencyName: string;
  agencyLogoUrl?: string;
  postIds: string;
  aiSummary?: string;
  status: 'pending' | 'approved' | 'modification_requested' | 'expired';
  expiresAt: string;
  modificationRequest?: string;
}

const DEMO_POSTS: Post[] = [
  { id: 'p1', title: 'Promo du weekend — -20% sur la carte', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString() },
  { id: 'p2', title: 'Recette du chef : Tarte tatin revisitée', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 4).toISOString() },
  { id: 'p3', title: 'Bonne fête des pères ! Réservez votre table', status: 'draft', scheduledAt: new Date(Date.now() + 86400000 * 6).toISOString() },
];

// ── Success screens ───────────────────────────────────────────────────────────
function ApprovedScreen({ count }: { count: number }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #F0FDF4 0%, #DCFCE7 100%)', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 0 16px rgba(34,197,94,.08)' }}>
        <CheckCircle size={44} style={{ color: '#16A34A' }} />
      </div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#14532D', marginBottom: 10 }}>Planning approuvé ! 🎉</h1>
      <p style={{ fontSize: '.92rem', color: '#166534', lineHeight: 1.6, maxWidth: 320 }}>
        Votre agence a été notifiée. Les {count} publications seront envoyées automatiquement aux dates prévues.
      </p>
      <div style={{ marginTop: 24, background: 'rgba(22,163,74,.12)', border: '1px solid rgba(22,163,74,.25)', borderRadius: 14, padding: '14px 20px' }}>
        <p style={{ fontSize: '.82rem', color: '#166534', fontWeight: 600 }}>
          ✅ {count} publication{count > 1 ? 's' : ''} planifiée{count > 1 ? 's' : ''} et prête{count > 1 ? 's' : ''} à l'envoi
        </p>
      </div>
    </div>
  );
}

function ModSentScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 100%)', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(99,89,248,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 0 16px rgba(99,89,248,.08)' }}>
        <MessageSquare size={44} style={{ color: '#6359F8' }} />
      </div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3730A3', marginBottom: 10 }}>Demande envoyée !</h1>
      <p style={{ fontSize: '.92rem', color: '#4338CA', lineHeight: 1.6, maxWidth: 320 }}>
        Votre agence a reçu votre demande de modification et vous recontactera rapidement.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClientApprovalPage() {
  const { token } = useParams({ from: '/approve/$token' });
  const [data, setData] = useState<ApprovalData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionDone, setActionDone] = useState<'approved' | 'modification_requested' | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await blink.db.clientApprovalTokens.list({ where: { token }, limit: 1 });
        if (rows.length === 0) { setNotFound(true); setLoading(false); return; }
        const row = rows[0] as ApprovalData;
        setData(row);
        if (row.status === 'approved') setActionDone('approved');
        if (row.status === 'modification_requested') setActionDone('modification_requested');
        let ids: string[] = [];
        try { ids = JSON.parse(row.postIds || '[]'); } catch {}
        setPosts(DEMO_POSTS.filter(p => ids.includes(p.id)));
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    }
    load();
  }, [token]);

  const handleApprove = async () => {
    if (!data) return;
    // 1. Mark token as approved in DB
    await blink.db.clientApprovalTokens.update(data.id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });
    // 2. Fire backend to auto-promote post_ids → 'scheduled'
    try {
      await notifyApproval(data.id);
    } catch {
      // Non-blocking: posts will be promoted next time the agency syncs
    }
    setActionDone('approved');
  };

  const handleRequestMod = async (text: string) => {
    if (!data) return;
    await blink.db.clientApprovalTokens.update(data.id, { status: 'modification_requested', modificationRequest: text });
    setActionDone('modification_requested');
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: '#6359F8', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B', fontSize: '.9rem' }}>Chargement du planning…</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound || !data) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <AlertCircle size={48} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Lien introuvable ou expiré</h1>
        <p style={{ color: '#64748B', fontSize: '.88rem', lineHeight: 1.5 }}>Ce lien de validation n'existe plus ou a expiré. Contactez votre agence pour obtenir un nouveau lien.</p>
      </div>
    </div>
  );

  if (actionDone === 'approved') return <ApprovedScreen count={posts.length} />;
  if (actionDone === 'modification_requested') return <ModSentScreen />;

  const isExpired = new Date(data.expiresAt) < new Date();

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6359F8 0%, #8B5CF6 100%)', padding: '28px 24px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.6rem', border: '1.5px solid rgba(255,255,255,.3)' }}>
          {data.agencyLogoUrl ? <img src={data.agencyLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} /> : '🚀'}
        </div>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.75rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{data.agencyName}</p>
        <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>
          Planning de la semaine pour<br />{data.clientName}
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 13px', marginTop: 4 }}>
          <Clock size={12} style={{ color: 'rgba(255,255,255,.85)' }} />
          <span style={{ color: 'rgba(255,255,255,.85)', fontSize: '.72rem', fontWeight: 600 }}>
            Valide jusqu'au {new Date(data.expiresAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* AI Summary */}
      {data.aiSummary && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ background: 'rgba(99,89,248,.06)', border: '1px solid rgba(99,89,248,.15)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} style={{ color: '#6359F8' }} />
              <p style={{ fontWeight: 700, fontSize: '.8rem', color: '#6359F8' }}>Résumé de la semaine par l'IA</p>
            </div>
            <p style={{ fontSize: '.82rem', color: '#475569', lineHeight: 1.6 }}>{data.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Posts */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          {posts.length} publication{posts.length > 1 ? 's' : ''} prête{posts.length > 1 ? 's' : ''}
        </p>
        {posts.map((post, i) => <ApprovalPostCard key={post.id} post={post} index={i} />)}
      </div>

      {/* Action buttons */}
      <ApprovalActions isExpired={isExpired} onApprove={handleApprove} onRequestMod={handleRequestMod} />

      {/* Footer */}
      <div style={{ padding: '0 20px 40px', textAlign: 'center', marginTop: 8 }}>
        <p style={{ fontSize: '.68rem', color: '#CBD5E1' }}>
          Propulsé par <strong style={{ color: '#6359F8' }}>Kompilot</strong> · Espace client sécurisé
        </p>
      </div>
    </div>
  );
}
