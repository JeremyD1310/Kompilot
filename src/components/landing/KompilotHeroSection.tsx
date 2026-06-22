/**
 * KompilotHeroSection — Premium B2B SaaS hero.
 * Clean, minimal, high-converting. Deep slate + rich blue palette.
 */
import { useState, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { KompilotLogo } from '../brand/KompilotLogo';

interface KompilotHeroSectionProps {
  onSubmit?: (value: string) => void;
}

export function KompilotHeroSection({ onSubmit }: KompilotHeroSectionProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) { inputRef.current?.focus(); return; }
    onSubmit?.(v);
  };

  return (
    <section className="kompilot-hero">
      <style>{`
        .kompilot-hero {
          background: #0A0F1E;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(72px, 12vw, 120px) 24px clamp(64px, 10vw, 100px);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .kh-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(59,130,246,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .kh-glow-top {
          position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px; pointer-events: none;
          background: radial-gradient(ellipse at 50% 0%,
            rgba(59,130,246,.14) 0%,
            rgba(99,102,241,.07) 40%,
            transparent 70%);
        }
        .kh-glow-right {
          position: absolute; bottom: 0; right: -100px;
          width: 500px; height: 500px; pointer-events: none;
          background: radial-gradient(ellipse, rgba(14,165,233,.08) 0%, transparent 65%);
        }
        .kh-inner {
          position: relative; max-width: 780px; width: 100%; text-align: center;
        }
        .kh-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(59,130,246,.08);
          border: 1px solid rgba(59,130,246,.22);
          border-radius: 9999px;
          padding: 7px 18px;
          font-size: .72rem; font-weight: 700; letter-spacing: .07em;
          color: #93C5FD; text-transform: uppercase;
          margin-bottom: 36px;
          animation: khFadeUp .5s ease both;
        }
        .kh-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3B82F6;
          box-shadow: 0 0 6px #3B82F6;
          animation: khPulse 2s ease infinite;
        }
        .kh-h1 {
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          font-weight: 900;
          line-height: 1.07;
          letter-spacing: -0.035em;
          color: #F1F5F9;
          margin: 0 auto 28px;
          max-width: 720px;
          animation: khFadeUp .55s ease .1s both;
        }
        .kh-h1-accent {
          background: linear-gradient(90deg, #F8FAFC 0%, #93C5FD 45%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .kh-sub {
          font-size: clamp(.95rem, 2.2vw, 1.1rem);
          color: #64748B;
          line-height: 1.8;
          max-width: 620px;
          margin: 0 auto 52px;
          font-weight: 400;
          animation: khFadeUp .55s ease .2s both;
        }
        .kh-input-wrap {
          position: relative;
          max-width: 660px;
          width: 100%;
          margin: 0 auto 16px;
          animation: khFadeUp .55s ease .3s both;
        }
        .kh-input-row {
          display: flex;
          align-items: center;
          background: rgba(15,23,42,.7);
          border: 1.5px solid rgba(51,65,85,.9);
          border-radius: 16px;
          padding: 6px 6px 6px 20px;
          transition: border-color .2s, box-shadow .2s;
          gap: 8px;
        }
        .kh-input-row.focused {
          border-color: rgba(59,130,246,.55);
          box-shadow: 0 0 0 3px rgba(59,130,246,.10), 0 8px 32px rgba(0,0,0,.4);
        }
        .kh-input {
          flex: 1; background: none; border: none; outline: none;
          font-size: clamp(.9rem, 2.4vw, 1.02rem);
          color: #E2E8F0; font-family: inherit; min-width: 0;
          padding: 12px 0;
        }
        .kh-input::placeholder { color: rgba(100,116,139,.65); }
        .kh-cta-btn {
          display: inline-flex; align-items: center; gap: 9px;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
          color: #fff; font-weight: 700;
          font-size: clamp(.88rem, 2vw, .97rem);
          border: none; border-radius: 12px;
          padding: clamp(14px, 3vw, 16px) clamp(20px, 4vw, 28px);
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          box-shadow: 0 4px 24px rgba(37,99,235,.35);
          transition: transform .15s, box-shadow .15s, opacity .15s;
          font-family: inherit;
        }
        .kh-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 36px rgba(37,99,235,.50);
        }
        .kh-cta-btn:active { transform: scale(.98); }
        .kh-subtext {
          font-size: .78rem; color: #334155; text-align: center;
          margin-bottom: 64px;
          animation: khFadeUp .55s ease .35s both;
          line-height: 1.6;
        }
        .kh-subtext strong { color: #475569; font-weight: 600; }
        .kh-divider {
          display: flex; align-items: center; gap: 20px;
          max-width: 480px; margin: 0 auto 32px;
          animation: khFadeUp .55s ease .4s both;
        }
        .kh-divider-line {
          flex: 1; height: 1px; background: rgba(255,255,255,.06);
        }
        .kh-divider span {
          font-size: .7rem; color: #1E293B; font-weight: 600;
          letter-spacing: .04em; white-space: nowrap;
        }
        .kh-trust {
          display: flex; align-items: center; justify-content: center;
          flex-wrap: wrap; gap: 6px 24px;
          animation: khFadeUp .55s ease .45s both;
        }
        .kh-trust-item {
          display: flex; align-items: center; gap: 7px;
          font-size: .78rem; color: #334155; font-weight: 500;
        }
        .kh-trust-item svg { color: #1D4ED8; flex-shrink: 0; }
        @keyframes khFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes khPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(.85); }
        }
        @media (max-width: 600px) {
          .kh-input-row { flex-direction: column; padding: 14px 16px; gap: 12px; border-radius: 14px; }
          .kh-cta-btn { width: 100%; justify-content: center; border-radius: 10px; }
        }
      `}</style>

      <div className="kh-bg-grid" />
      <div className="kh-glow-top" />
      <div className="kh-glow-right" />

      <div className="kh-inner">
        {/* Brand logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <KompilotLogo variant="full" height={36} textColor="#F1F5F9" />
        </div>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
          <div className="kh-badge">
            <span className="kh-badge-dot" />
            Réservé aux professionnels &amp; agences
          </div>
        </div>

        {/* H1 */}
        <h1 className="kh-h1">
          De l'idée ou{' '}
          <span className="kh-h1-accent">l'URL,</span>
          <br />
          au chiffre d'affaires.
        </h1>

        {/* Subtitle */}
        <p className="kh-sub">
          Regardez Kompilot analyser votre marque, livrer vos assets, lancer vos campagnes et
          connecter vos flux de conversion. Votre business, en pilote automatique.
        </p>

        {/* Input + CTA */}
        <div className="kh-input-wrap">
          <div className={`kh-input-row${focused ? ' focused' : ''}`}>
            <input
              ref={inputRef}
              className="kh-input"
              type="text"
              placeholder="Entrez l'URL de votre site ou décrivez votre idée..."
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            <button className="kh-cta-btn" onClick={handleSubmit}>
              <Sparkles size={15} />
              Lancer mon copilote gratuitement
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Subtext under CTA */}
        <p className="kh-subtext">
          <strong>Réservé aux professionnels et agences.</strong>{' '}
          Configuration en 60 secondes.
        </p>

        {/* Divider */}
        <div className="kh-divider">
          <div className="kh-divider-line" />
          <span>Ce que vous obtenez</span>
          <div className="kh-divider-line" />
        </div>

        {/* Trust pillars */}
        <div className="kh-trust">
          {[
            'Analyse de marque instantanée',
            'Assets créatifs générés par IA',
            'Campagnes lancées automatiquement',
            'Tunnels de conversion synchronisés',
          ].map(item => (
            <div key={item} className="kh-trust-item">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeOpacity=".3" />
                <path d="M4 7l2 2 4-4" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
