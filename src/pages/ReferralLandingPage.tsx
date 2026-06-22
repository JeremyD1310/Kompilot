/**
 * ReferralLandingPage — /ref/:code
 *
 * Public page reached when a customer clicks a referral link shared by a sponsor.
 * 1. Looks up the referral link by shortCode
 * 2. Increments click_count (one-time per session)
 * 3. Shows a branded discount offer + CTA to claim it (sign up)
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Gift, Star, Zap, ArrowRight, CheckCircle2, Users, Shield, Sparkles, Copy, Check } from 'lucide-react';
import { blink } from '../blink/client';
import { KompilotLogo } from '../components/brand/KompilotLogo';

// ── Logo ────────────────────────────────────────────────────────────────────────
function Logo() { return <KompilotLogo variant="icon" height={32} />; }

// ── Star rating ─────────────────────────────────────────────────────────────────
function StarRow({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24"
          fill={i <= n ? '#F59E0B' : 'none'} stroke={i <= n ? '#F59E0B' : '#CBD5E1'} strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── State types ─────────────────────────────────────────────────────────────────
type LoadState = 'loading' | 'found' | 'notfound' | 'error';

interface LinkData {
  id: string;
  sponsorName: string;
  sponsorReviewRating: number;
  discountPercent: number;
  establishmentName?: string;
  sector?: string;
  messageTemplate?: string;
}

// ── Benefit rows ────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: Zap,    text: 'Accès immédiat — sans carte bancaire' },
  { icon: Shield, text: 'Données sécurisées, jamais revendues' },
  { icon: Users,  text: 'Utilisé par +2 400 commerçants en France' },
];

export default function ReferralLandingPage() {
  const { code } = useParams({ from: '/ref/$code' });
  const [state, setState] = useState<LoadState>('loading');
  const [link, setLink] = useState<LinkData | null>(null);
  const [copied, setCopied] = useState(false);
  const [clickTracked, setClickTracked] = useState(false);

  // ── Fetch link data + track click ─────────────────────────────────────────────
  useEffect(() => {
    if (!code) { setState('notfound'); return; }

    // Only track click once per session
    const sessionKey = `ref_click_${code}`;

    async function loadLink() {
      try {
        // Look up referral link by short_code
        const rows = await blink.db.referralLinks.list({
          where: { shortCode: code },
          limit: 1,
        });

        if (!rows.length) {
          setState('notfound');
          return;
        }

        const row = rows[0] as any;

        // Look up campaign for discount + establishment info
        let discountPercent = 10;
        let establishmentName: string | undefined;
        let sector: string | undefined;
        let messageTemplate: string | undefined;

        try {
          if (row.campaignId) {
            const campaigns = await blink.db.referralCampaigns.list({
              where: { id: row.campaignId },
              limit: 1,
            });
            if (campaigns.length) {
              const c = campaigns[0] as any;
              discountPercent = c.discountPercent ?? 10;
              sector = c.sector;
              messageTemplate = c.messageTemplate;
            }
          }
          if (row.establishmentId) {
            const ests = await blink.db.establishments.list({
              where: { id: row.establishmentId },
              limit: 1,
            });
            if (ests.length) {
              establishmentName = (ests[0] as any).name;
            }
          }
        } catch {
          // Non-critical — proceed with partial data
        }

        setLink({
          id: row.id,
          sponsorName: row.sponsorName,
          sponsorReviewRating: Number(row.sponsorReviewRating) || 5,
          discountPercent,
          establishmentName,
          sector,
          messageTemplate,
        });
        setState('found');

        // Track click — only once per session
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1');
          try {
            // Increment click count
            const currentClicks = Number(row.clickCount) || 0;
            await blink.db.referralLinks.update(row.id, {
              clickCount: currentClicks + 1,
            });
          } catch {
            // Non-critical — don't block page render
          }
          setClickTracked(true);
        }
      } catch (err) {
        console.error('[referral] load error', err);
        setState('error');
      }
    }

    loadLink();
  }, [code]);

  // ── Handle claim — redirect to signup with referral context ──────────────────
  const handleClaim = () => {
    const params = new URLSearchParams({ ref: code ?? '', type: 'claim' });
    window.location.href = `/signup?${params.toString()}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Loading state ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(13,148,136,.3)', borderTopColor: '#0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748B', fontSize: '.88rem' }}>Chargement de votre offre…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // ── Not found state ─────────────────────────────────────────────────────────────
  if (state === 'notfound') {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Logo />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 20, marginBottom: 10, textAlign: 'center' }}>Lien introuvable</h1>
        <p style={{ color: '#64748B', textAlign: 'center', marginBottom: 28, maxWidth: 400, lineHeight: 1.7 }}>
          Ce lien de parrainage n'existe pas ou a expiré. Demandez un nouveau lien à votre contact.
        </p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0D9488', color: '#fff', borderRadius: 10, padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: '.9rem' }}>
          Découvrir Kompilot <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────────
  if (state === 'error' || !link) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Logo />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 20, marginBottom: 10, textAlign: 'center' }}>Une erreur est survenue</h1>
        <p style={{ color: '#64748B', textAlign: 'center', marginBottom: 28 }}>Réessayez ou contactez-nous.</p>
        <Link to="/" style={{ color: '#0D9488', textDecoration: 'none', fontSize: '.9rem', fontWeight: 600 }}>← Retour à l'accueil</Link>
      </div>
    );
  }

  // ── Found — full referral landing ───────────────────────────────────────────────
  const { sponsorName, sponsorReviewRating, discountPercent, establishmentName, messageTemplate } = link;
  const estLabel = establishmentName || 'cet établissement';
  const ctaText = `Profiter de mes ${discountPercent}% de réduction →`;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#F1F5F9' }}>Kompilot</span>
        </div>
        <Link to="/login" style={{ color: '#64748B', fontSize: '.82rem', textDecoration: 'none', fontWeight: 600 }}>
          Déjà client ? Connexion →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '56px 24px 40px', textAlign: 'center' }}>

        {/* Sponsor badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(13,148,136,.08)', border: '1px solid rgba(45,212,191,.25)', borderRadius: 9999, padding: '10px 20px', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0D9488, #2DD4BF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: '#fff', flexShrink: 0 }}>
            {sponsorName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '.75rem', color: '#2DD4BF', fontWeight: 700, lineHeight: 1.2 }}>{sponsorName} vous recommande</p>
            <StarRow n={sponsorReviewRating} />
          </div>
        </div>

        {/* Discount pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.4)', borderRadius: 9999, padding: '6px 18px', marginBottom: 20 }}>
          <Gift size={14} style={{ color: '#2DD4BF' }} />
          <span style={{ color: '#2DD4BF', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.04em' }}>OFFRE EXCLUSIVE — CODE PARRAINAGE</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.12, color: '#F8FAFC', margin: '0 0 16px' }}>
          Profitez de{' '}
          <span style={{ background: 'linear-gradient(90deg, #0D9488, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {discountPercent}% de réduction
          </span>
          <br />sur Kompilot
        </h1>

        <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.7, marginBottom: 12, maxWidth: 440, margin: '0 auto 20px' }}>
          <strong style={{ color: '#CBD5E1' }}>{sponsorName}</strong> a adoré Kompilot chez{' '}
          <strong style={{ color: '#CBD5E1' }}>{estLabel}</strong> et vous offre une remise exclusive.
          Rejoignez +2 400 commerçants qui gèrent leur présence Google en automatique.
        </p>

        {/* Sponsor testimonial */}
        {messageTemplate && (
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: '.83rem', color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.65 }}>
              "{messageTemplate.length > 180 ? messageTemplate.slice(0, 180) + '…' : messageTemplate}"
            </p>
            <p style={{ fontSize: '.73rem', color: '#475569', marginTop: 10, fontWeight: 600 }}>— {sponsorName}</p>
          </div>
        )}

        {/* Code display */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: '1px dashed rgba(45,212,191,.4)', borderRadius: 10, padding: '10px 18px' }}>
            <span style={{ fontSize: '.75rem', color: '#64748B', fontWeight: 600 }}>Code :</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: '#2DD4BF', letterSpacing: '.06em' }}>
              {code?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={copyCode}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.3)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: '#2DD4BF', fontWeight: 600, fontSize: '.78rem', transition: 'all .15s' }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handleClaim}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(90deg, #0D9488, #0891B2)',
            color: '#fff', fontWeight: 800, fontSize: '1rem',
            border: 'none', borderRadius: 14, padding: '16px 36px',
            cursor: 'pointer', width: '100%', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(13,148,136,.5), 0 8px 32px rgba(13,148,136,.3)',
            letterSpacing: '.01em', marginBottom: 14,
          }}
        >
          <Sparkles size={18} />
          {ctaText}
        </button>

        <p style={{ fontSize: '.75rem', color: '#475569', marginBottom: 40 }}>
          Essai gratuit 14 jours · Sans carte bancaire · Accès immédiat
        </p>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48, textAlign: 'left' }}>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: '#2DD4BF' }} />
              </div>
              <span style={{ fontSize: '.85rem', color: '#94A3B8' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* What is Kompilot */}
        <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '28px 24px', textAlign: 'left' }}>
          <p style={{ fontSize: '.7rem', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
            ✦ Qu'est-ce que Kompilot ?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            {[
              { emoji: '📅', text: 'Calendrier IA multi-canaux' },
              { emoji: '⭐', text: 'Réponses avis Google en 1 clic' },
              { emoji: '📥', text: 'Inbox unifié (DM, commentaires)' },
              { emoji: '📊', text: 'Analytics & score de visibilité' },
              { emoji: '🛡️', text: 'Anti-no-show Stripe' },
              { emoji: '🤖', text: 'Posts IA pour votre secteur' },
            ].map(({ emoji, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{emoji}</span>
                <span style={{ fontSize: '.8rem', color: '#94A3B8', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '.73rem', color: '#334155' }}>
          © 2025 Kompilot · <Link to="/privacy" style={{ color: '#475569', textDecoration: 'none' }}>Confidentialité</Link>{' '}·{' '}
          <Link to="/cgv" style={{ color: '#475569', textDecoration: 'none' }}>CGV</Link>
        </p>
      </div>
    </div>
  );
}
