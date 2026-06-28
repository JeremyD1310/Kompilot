import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Zap, LogIn, Menu, X } from 'lucide-react';
import { LoginModal } from './LoginModal';

import { KompilotLogo } from '../brand/KompilotLogo';

export function Logo({ size = 30 }: { size?: number }) {
  return <KompilotLogo variant="icon" height={size} />;
}

// ─── Nav link definitions ────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Pro',           href: '#commerce',       isAudience: 'commerce' as const },
  { label: 'Agence',        href: '#agency',          isAudience: 'agency'   as const },
  { label: 'Tarifs',        href: '#tarifs',          isAudience: null },
  { label: 'Témoignages',   href: '#temoignages',     isAudience: null },
  { label: 'Tarifs Pro',    href: '/pricing-pro',     isAudience: null, isRoute: true },
  { label: 'Tarifs Agence', href: '/pricing-agency',  isAudience: null, isRoute: true },
] as const;

type Audience = 'commerce' | 'agency';

// ─── Scroll helper ────────────────────────────────────────────────────────────
function scrollToHref(href: string, setAudience: (a: Audience) => void, currentAudience?: Audience) {
  if (href === '#commerce') {
    setAudience('commerce');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (href === '#agency') {
    setAudience('agency');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  } else if ((href === '#temoignages' || href === '#faq') && currentAudience === 'agency') {
    // From agency view → switch to commerce first, then scroll to section
    setAudience('commerce');
    setTimeout(() => {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else {
    const el = document.getElementById(href.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LandingNavProps {
  audience: Audience;
  setAudience: (a: Audience) => void;
  onCta?: () => void;
  /** If the user is already authenticated, redirect to /dashboard instead of showing login modal */
  isLoggedIn?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingNav({ audience, setAudience, onCta, isLoggedIn = false }: LandingNavProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (isLoggedIn) {
      navigate({ to: '/dashboard' });
    } else {
      setShowLogin(true);
    }
  };

  // Fallback: if onCta is not provided (e.g. component used standalone), send to /login
  const handleCta = () => {
    if (onCta) onCta();
    else window.location.href = '/login';
  };

  const handleMobileLink = (href: string) => {
    setMobileOpen(false);
    scrollToHref(href, setAudience, audience);
  };

  return (
    <>
      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 40,
          borderBottom: '1px solid rgba(255,255,255,.06)',
          backgroundColor: 'rgba(11,17,32,.92)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div
          style={{
            maxWidth: 1120, margin: '0 auto', padding: '0 24px',
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <KompilotLogo variant="full" height={52} textColor="#F1F5F9" />
          </div>

          {/* ── Desktop nav links ────────────────────────────────────────── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 44 }}>
            {NAV_LINKS.map((navLink) => {
              const { label, href, isAudience } = navLink;
              const isRoute = 'isRoute' in navLink && navLink.isRoute;
              const isActive = isAudience ? audience === isAudience : false;
              const activeColor = isAudience === 'agency' ? '#818CF8' : '#0D9488';
              const linkClass = [
                'relative pb-1 no-underline transition-colors duration-200 cursor-pointer',
                'text-[.91rem] tracking-[.015em]',
                isActive
                  ? 'text-[#E2E8F0] font-bold'
                  : 'text-[#94A3B8] font-medium hover:text-[#E2E8F0]',
              ].join(' ');

              if (isRoute) {
                return (
                  <Link
                    key={label}
                    to={href as string}
                    className={linkClass}
                  >
                    {label}
                  </Link>
                );
              }

              return (
                <a
                  key={label}
                  href={href}
                  onClick={e => { e.preventDefault(); scrollToHref(href, setAudience, audience); }}
                  className={linkClass}
                >
                  {label}
                  {/* Active underline */}
                  <span
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2, borderRadius: 9999,
                      background: activeColor,
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity .2s',
                    }}
                  />
                </a>
              );
            })}
          </div>

          {/* ── Desktop right CTAs ───────────────────────────────────────── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Se connecter */}
            <button
              onClick={handleLogin}
              className={[
                'flex items-center gap-1.5 whitespace-nowrap rounded-full cursor-pointer',
                'text-[#E2E8F0] text-[.83rem] font-bold',
                'border transition-all duration-200',
                'px-[18px] py-[7px]',
                'bg-[rgba(255,255,255,.07)] border-[rgba(255,255,255,.14)]',
                'hover:bg-[rgba(13,148,136,.15)] hover:border-[rgba(13,148,136,.5)]',
              ].join(' ')}
            >
              <LogIn size={14} />
              Se connecter
            </button>

            {/* Essai gratuit CTA */}
            <button
              className="nc-pill nc-pill-shimmer"
              style={{ padding: '9px 22px', fontSize: '.83rem', boxShadow: '0 0 24px rgba(13,148,136,.35)' }}
              onClick={handleCta}
            >
              <Zap size={14} />
              Essai gratuit
            </button>
          </div>

          {/* ── Mobile hamburger ─────────────────────────────────────────── */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200 bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.12)] border border-[rgba(255,255,255,.1)]"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X size={18} color="#E2E8F0" />
              : <Menu size={18} color="#E2E8F0" />
            }
          </button>
        </div>

        {/* ── Mobile slide-down menu ──────────────────────────────────────── */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: mobileOpen ? 480 : 0,
            transition: 'max-height .3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderTop: mobileOpen ? '1px solid rgba(255,255,255,.06)' : '1px solid transparent',
          }}
        >
          <div style={{ padding: '12px 24px 20px' }}>
            {/* Nav links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
              {NAV_LINKS.map((navLink) => {
                const { label, href, isAudience } = navLink;
                const isRoute = 'isRoute' in navLink && navLink.isRoute;
                const isActive = isAudience ? audience === isAudience : false;
                const activeColor = isAudience === 'agency' ? '#818CF8' : '#0D9488';
                const linkStyle = {
                  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
                  padding: '10px 14px', borderRadius: 10,
                  color: isActive ? '#E2E8F0' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '.92rem',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,.05)' : 'transparent',
                  transition: 'background .15s, color .15s',
                };

                if (isRoute) {
                  return (
                    <Link
                      key={label}
                      to={href as string}
                      style={linkStyle}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{label}</span>
                    </Link>
                  );
                }

                return (
                  <a
                    key={label}
                    href={href}
                    onClick={e => { e.preventDefault(); handleMobileLink(href); }}
                    style={linkStyle}
                  >
                    <span>{label}</span>
                    {isActive && (
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: 9999,
                        background: activeColor, flexShrink: 0,
                      }} />
                    )}
                  </a>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,.07)', marginBottom: 16 }} />

            {/* Mobile CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Se connecter */}
              <button
                onClick={() => { setMobileOpen(false); handleLogin(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: '#E2E8F0', fontSize: '.88rem', fontWeight: 700,
                  background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)',
                  borderRadius: 12, padding: '11px 18px', cursor: 'pointer',
                  transition: 'background .2s',
                }}
              >
                <LogIn size={15} />
                Se connecter
              </button>

              {/* Essai gratuit */}
              <button
                className="nc-pill nc-pill-shimmer"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '.88rem' }}
                onClick={() => { setMobileOpen(false); handleCta(); }}
              >
                <Zap size={15} />
                Essai gratuit
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
