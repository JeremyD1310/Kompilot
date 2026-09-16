/**
 * AgencyAffiliateLandingPage — /affilies/:code
 *
 * Landing page publique atteinte quand un prospect clique sur un lien d'affiliation agence.
 * 1. Résout le code via GET /api/affiliates/resolve/:code
 * 2. Track le clic via POST /api/affiliates/track-click
 * 3. Affiche une landing de parrainage puis redirige vers /signup?affiliate_code=<code>
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Gift, Star, ArrowRight, Copy, Check, Sparkles, Zap, Shield, Users } from 'lucide-react';
import { KompilotLogo } from '../components/brand/KompilotLogo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';

function Logo() { return <KompilotLogo variant="icon" height={32} />; }

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

type LoadState = 'loading' | 'found' | 'notfound' | 'error';

interface AffiliateData {
  id: string;
  code: string;
  commissionPercent: number;
  totalConversions: number;
}

const BENEFITS = [
  { icon: Zap, text: 'Essai gratuit 14 jours — sans carte bancaire' },
  { icon: Shield, text: 'Données sécurisées, jamais revendues' },
  { icon: Users, text: 'Utilisé par +2 400 commerçants en France' },
];

export default function AgencyAffiliateLandingPage() {
  const { code } = useParams({ from: '/affilies/$code' });
  const [state, setState] = useState<LoadState>('loading');
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [copied, setCopied] = useState(false);
  const [clickTracked, setClickTracked] = useState(false);

  useEffect(() => {
    if (!code) { setState('notfound'); return; }

    const sessionKey = `affiliate_click_${code}`;

    async function load() {
      try {
        // 1. Resolve the affiliate code
        const res = await fetch(`${BACKEND_URL}/api/affiliates/resolve/${code}`);
        if (!res.ok) { setState('notfound'); return; }

        const data = await res.json();
        if (!data.found || !data.affiliate) { setState('notfound'); return; }

        setAffiliate(data.affiliate);
        setState('found');

        // 2. Track click (once per session)
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1');
          try {
            await fetch(`${BACKEND_URL}/api/affiliates/track-click`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ affiliateId: data.affiliate.id }),
            });
          } catch { /* non-critical */ }
          setClickTracked(true);
        }
      } catch {
        setState('error');
      }
    }

    load();
  }, [code]);

  const handleClaim = () => {
    const params = new URLSearchParams({ affiliate_code: code ?? '' });
    window.location.href = `/signup?${params.toString()}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--landing-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(13,148,136,.3)', borderTopColor: 'hsl(var(--landing-primary))', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'hsl(var(--landing-subdued))', fontSize: '.88rem' }}>Chargement de votre offre…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (state === 'notfound') {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--landing-bg))', color: 'hsl(var(--landing-body))', fontFamily: 'var(--font-sans), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Logo />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 20, marginBottom: 10, textAlign: 'center' }}>Lien introuvable</h1>
        <p style={{ color: 'hsl(var(--landing-subdued))', textAlign: 'center', marginBottom: 28, maxWidth: 400, lineHeight: 1.7 }}>
          Ce lien d'affiliation n'existe pas ou a été désactivé. Contactez l'agence qui vous l'a transmis.
        </p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'hsl(var(--landing-primary))', color: 'hsl(var(--landing-white))', borderRadius: 10, padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: '.9rem' }}>
          Découvrir Kompilot <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === 'error' || !affiliate) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--landing-bg))', color: 'hsl(var(--landing-body))', fontFamily: 'var(--font-sans), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Logo />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 20, marginBottom: 10, textAlign: 'center' }}>Une erreur est survenue</h1>
        <p style={{ color: 'hsl(var(--landing-subdued))', textAlign: 'center', marginBottom: 28 }}>Réessayez ou contactez-nous.</p>
        <Link to="/" style={{ color: 'hsl(var(--landing-primary))', textDecoration: 'none', fontSize: '.9rem', fontWeight: 600 }}>← Retour à l'accueil</Link>
      </div>
    );
  }

  // ── Found — full landing ─────────────────────────────────────────────────
  const commissionLabel = `${affiliate.commissionPercent}% de commission`;
  const ctaText = `Essayer Kompilot gratuitement →`;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--landing-bg))', color: 'hsl(var(--landing-body))', fontFamily: 'var(--font-sans), sans-serif', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'hsl(var(--landing-heading))' }}>Kompilot</span>
        </div>
        <Link to="/login" style={{ color: 'hsl(var(--landing-subdued))', fontSize: '.82rem', textDecoration: 'none', fontWeight: 600 }}>
          Déjà client ? Connexion →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '56px 24px 40px', textAlign: 'center' }}>

        {/* Agency badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,.08)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 9999, padding: '10px 20px', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: 'hsl(var(--landing-white))', flexShrink: 0 }}>
            🏢
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '.75rem', color: '#A78BFA', fontWeight: 700, lineHeight: 1.2 }}>Une agence vous recommande</p>
            <StarRow n={5} />
          </div>
        </div>

        {/* Commission pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.4)', borderRadius: 9999, padding: '6px 18px', marginBottom: 20 }}>
          <Gift size={14} style={{ color: '#A78BFA' }} />
          <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.04em' }}>OFFRE PARTENAIRE — {commissionLabel}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.12, color: '#F8FAFC', margin: '0 0 16px' }}>
          Votre agence vous offre{' '}
          <span style={{ background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            l'accès à Kompilot
          </span>
        </h1>

        <p style={{ color: 'hsl(var(--landing-muted))', fontSize: '1rem', lineHeight: 1.7, marginBottom: 12, maxWidth: 440, margin: '0 auto 20px' }}>
          Votre agence utilise <strong style={{ color: '#CBD5E1' }}>Kompilot</strong> pour gérer sa présence en ligne.
          Rejoignez +2 400 commerçants et profitez de l'outil recommandé par votre partenaire.
        </p>

        {/* Code display */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: '1px dashed rgba(167,139,250,.4)', borderRadius: 10, padding: '10px 18px' }}>
            <span style={{ fontSize: '.75rem', color: 'hsl(var(--landing-subdued))', fontWeight: 600 }}>Code :</span>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '1rem', fontWeight: 800, color: '#A78BFA', letterSpacing: '.06em' }}>
              {code?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={copyCode}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: '#A78BFA', fontWeight: 600, fontSize: '.78rem', transition: 'all .15s' }}
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
            background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)',
            color: 'hsl(var(--landing-white))', fontWeight: 800, fontSize: '1rem',
            border: 'none', borderRadius: 14, padding: '16px 36px',
            cursor: 'pointer', width: '100%', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(139,92,246,.5), 0 8px 32px rgba(139,92,246,.3)',
            letterSpacing: '.01em', marginBottom: 14,
          }}
        >
          <Sparkles size={18} />
          {ctaText}
        </button>

        <p style={{ fontSize: '.75rem', color: 'hsl(var(--landing-subtle))', marginBottom: 40 }}>
          Essai gratuit 14 jours · Sans carte bancaire · Accès immédiat
        </p>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48, textAlign: 'left' }}>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: '#A78BFA' }} />
              </div>
              <span style={{ fontSize: '.85rem', color: 'hsl(var(--landing-muted))' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* What is Kompilot */}
        <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '28px 24px', textAlign: 'left' }}>
          <p style={{ fontSize: '.7rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
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
                <span style={{ fontSize: '.8rem', color: 'hsl(var(--landing-muted))', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '.73rem', color: '#334155' }}>
          © 2025 Kompilot · <Link to="/privacy" style={{ color: 'hsl(var(--landing-subtle))', textDecoration: 'none' }}>Confidentialité</Link>{' '}·{' '}
          <Link to="/cgv" style={{ color: 'hsl(var(--landing-subtle))', textDecoration: 'none' }}>CGV</Link>
        </p>
      </div>
    </div>
  );
}
