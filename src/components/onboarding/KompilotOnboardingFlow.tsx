/**
 * KompilotOnboardingFlow — Full-screen 3-state magic input onboarding.
 * States: INPUT → PROCESSING → TWEAK
 */
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { KompilotLogo } from '../brand/KompilotLogo';

type FlowState = 'input' | 'processing' | 'tweak';

const CHECKLIST_ITEMS = [
  { icon: '🔍', label: 'Extraction et analyse de l\'identité de votre marque...' },
  { icon: '🎨', label: 'Génération des assets stratégiques et créatifs...' },
  { icon: '📅', label: 'Planification du calendrier de campagnes...' },
  { icon: '💳', label: 'Alignement des tunnels de conversion et paiements...' },
];

interface KompilotOnboardingFlowProps {
  initialValue?: string;
  onComplete?: (url: string, tweak?: string) => void;
}

export function KompilotOnboardingFlow({ initialValue = '', onComplete }: KompilotOnboardingFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [inputValue, setInputValue] = useState(initialValue);
  const [focusedInput, setFocusedInput] = useState(false);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [tweakValue, setTweakValue] = useState('');
  const [tweakFocused, setTweakFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tweakRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => { timerRef.current.forEach(clearTimeout); };
  }, []);

  const startProcessing = () => {
    if (!inputValue.trim()) { inputRef.current?.focus(); return; }
    setFlowState('processing');
    setCompletedItems([]);

    // Stagger item completions
    CHECKLIST_ITEMS.forEach((_, i) => {
      const t = setTimeout(() => {
        setCompletedItems(prev => [...prev, i]);
        if (i === CHECKLIST_ITEMS.length - 1) {
          const finalT = setTimeout(() => {
            setFlowState('tweak');
            setTimeout(() => tweakRef.current?.focus(), 200);
          }, 700);
          timerRef.current.push(finalT);
        }
      }, 900 + i * 1100);
      timerRef.current.push(t);
    });
  };

  const handleTweakSubmit = () => {
    onComplete?.(inputValue, tweakValue.trim() || undefined);
  };

  return (
    <div className="kof-root">
      <style>{`
        .kof-root {
          min-height: 100vh;
          background: #080D1A;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative; overflow: hidden;
        }
        .kof-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 30% 20%, rgba(37,99,235,.09) 0%, transparent 55%),
                      radial-gradient(ellipse at 75% 80%, rgba(79,70,229,.07) 0%, transparent 55%);
        }
        .kof-card {
          position: relative; width: 100%; max-width: 680px;
          background: rgba(10,16,32,.85);
          border: 1px solid rgba(51,65,85,.7);
          border-radius: 24px;
          padding: clamp(36px, 6vw, 56px) clamp(28px, 5vw, 52px);
          box-shadow: 0 32px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(59,130,246,.06);
          backdrop-filter: blur(20px);
        }
        .kof-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 40px;
        }
        .kof-logo-mark {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #2563EB, #4F46E5);
          display: flex; align-items: center; justify-content: center;
        }
        .kof-logo-text {
          font-size: 1.05rem; font-weight: 800; color: #F1F5F9;
          letter-spacing: -.02em;
        }

        /* ── INPUT STATE ── */
        .kof-step-label {
          font-size: .68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .1em; color: #3B82F6; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .kof-step-label::before {
          content: ''; width: 18px; height: 1.5px; background: #3B82F6;
        }
        .kof-title {
          font-size: clamp(1.55rem, 4vw, 2.2rem);
          font-weight: 800; letter-spacing: -.03em;
          color: #F1F5F9; line-height: 1.18; margin-bottom: 10px;
        }
        .kof-desc {
          font-size: .9rem; color: #475569; line-height: 1.7; margin-bottom: 36px;
        }
        .kof-textarea-wrap {
          position: relative; margin-bottom: 14px;
        }
        .kof-textarea {
          width: 100%; background: rgba(15,23,42,.8);
          border: 1.5px solid rgba(51,65,85,.9);
          border-radius: 14px; padding: 18px 20px;
          font-size: .98rem; color: #E2E8F0;
          font-family: inherit; resize: none; outline: none;
          min-height: 100px; line-height: 1.7;
          transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
        }
        .kof-textarea.focused {
          border-color: rgba(59,130,246,.55);
          box-shadow: 0 0 0 3px rgba(59,130,246,.10);
        }
        .kof-textarea::placeholder { color: rgba(71,85,105,.75); }
        .kof-helper { font-size: .78rem; color: #1E293B; margin-bottom: 28px; }
        .kof-submit-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
          color: #fff; font-weight: 700; font-size: .97rem;
          border: none; border-radius: 12px; padding: 17px 24px;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 24px rgba(37,99,235,.35);
          transition: transform .15s, box-shadow .15s;
        }
        .kof-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 36px rgba(37,99,235,.5); }
        .kof-submit-btn:active { transform: scale(.98); }
        .kof-submit-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

        /* ── PROCESSING STATE ── */
        .kof-checklist { display: flex; flex-direction: column; gap: 0; margin-bottom: 12px; }
        .kof-checklist-item {
          display: flex; align-items: center; gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,.04);
          animation: kofSlideIn .4s ease both;
        }
        .kof-checklist-item:last-child { border-bottom: none; }
        .kof-check-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          background: rgba(37,99,235,.08);
          border: 1px solid rgba(37,99,235,.15);
          transition: background .3s, border-color .3s;
        }
        .kof-checklist-item.done .kof-check-icon {
          background: rgba(34,197,94,.08);
          border-color: rgba(34,197,94,.2);
        }
        .kof-check-label {
          flex: 1; font-size: .93rem; color: #475569;
          transition: color .3s; line-height: 1.5;
        }
        .kof-checklist-item.done .kof-check-label { color: #94A3B8; }
        .kof-check-status { flex-shrink: 0; }
        .kof-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(59,130,246,.15);
          border-top-color: #3B82F6;
          border-radius: 50%;
          animation: kofSpin .8s linear infinite;
        }
        .kof-processing-heading {
          font-size: 1.3rem; font-weight: 700; color: #F1F5F9;
          letter-spacing: -.025em; margin-bottom: 6px;
        }
        .kof-processing-sub {
          font-size: .85rem; color: #334155; margin-bottom: 32px;
        }

        /* ── TWEAK STATE ── */
        .kof-preview-frame {
          background: rgba(15,23,42,.6);
          border: 1px solid rgba(51,65,85,.7);
          border-radius: 14px; padding: 24px 24px 20px;
          margin-bottom: 24px; min-height: 180px;
        }
        .kof-preview-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.22);
          border-radius: 9999px; padding: 5px 12px;
          font-size: .68rem; font-weight: 700; color: #4ADE80;
          text-transform: uppercase; letter-spacing: .07em; margin-bottom: 20px;
        }
        .kof-preview-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .kof-preview-card {
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px; padding: 14px 16px;
        }
        .kof-preview-card-label {
          font-size: .65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .07em; color: #475569; margin-bottom: 6px;
        }
        .kof-preview-card-value {
          font-size: .88rem; font-weight: 600; color: #CBD5E1;
        }
        .kof-tweak-row {
          display: flex; gap: 10px; align-items: center;
        }
        .kof-tweak-input {
          flex: 1; background: rgba(15,23,42,.8);
          border: 1.5px solid rgba(51,65,85,.9);
          border-radius: 12px; padding: 15px 18px;
          font-size: .93rem; color: #E2E8F0; font-family: inherit;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .kof-tweak-input.focused {
          border-color: rgba(59,130,246,.55);
          box-shadow: 0 0 0 3px rgba(59,130,246,.10);
        }
        .kof-tweak-input::placeholder { color: rgba(71,85,105,.65); }
        .kof-tweak-btn {
          width: 46px; height: 46px; flex-shrink: 0; border-radius: 11px;
          background: linear-gradient(135deg, #2563EB, #4F46E5);
          border: none; cursor: pointer; display: flex;
          align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 4px 16px rgba(37,99,235,.3);
          transition: transform .15s, box-shadow .15s;
        }
        .kof-tweak-btn:hover { transform: scale(1.06); box-shadow: 0 6px 24px rgba(37,99,235,.45); }

        .kof-complete-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 9px;
          background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.25);
          color: #4ADE80; font-weight: 700; font-size: .92rem;
          border-radius: 12px; padding: 15px; cursor: pointer; font-family: inherit;
          transition: background .2s, border-color .2s; margin-top: 16px;
        }
        .kof-complete-btn:hover { background: rgba(34,197,94,.13); border-color: rgba(34,197,94,.4); }

        @keyframes kofSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes kofSpin { to { transform: rotate(360deg); } }
        @keyframes kofFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kof-tweak-appear { animation: kofFadeIn .4s ease both; }
      `}</style>

      <div className="kof-bg" />
      <div className="kof-card">
        {/* Logo */}
        <div className="kof-logo">
          <KompilotLogo variant="full" height={28} textColor="#F1F5F9" />
        </div>

        {/* ── STATE: INPUT ── */}
        {flowState === 'input' && (
          <>
            <div className="kof-step-label">Étape 1 — Démarrage</div>
            <h2 className="kof-title">
              Parlez-nous de<br />votre projet.
            </h2>
            <p className="kof-desc">
              Collez l'URL de votre site ou décrivez votre activité en quelques mots.
              Kompilot fait le reste.
            </p>
            <div className="kof-textarea-wrap">
              <textarea
                ref={inputRef}
                className={`kof-textarea${focusedInput ? ' focused' : ''}`}
                placeholder="Collez l'URL de votre entreprise ou décrivez votre projet..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                rows={3}
              />
            </div>
            <p className="kof-helper">
              Ex: https://monagence.com ou «&nbsp;SaaS de gestion de calendrier pour freelances&nbsp;»
            </p>
            <button
              className="kof-submit-btn"
              onClick={startProcessing}
              disabled={!inputValue.trim()}
            >
              Analyser mon projet
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── STATE: PROCESSING ── */}
        {flowState === 'processing' && (
          <>
            <div className="kof-step-label">Étape 2 — Analyse en cours</div>
            <h2 className="kof-processing-heading">
              Kompilot travaille<br />pour vous…
            </h2>
            <p className="kof-processing-sub">
              Cela prend environ 15 secondes.
            </p>
            <div className="kof-checklist">
              {CHECKLIST_ITEMS.map((item, i) => {
                const isDone = completedItems.includes(i);
                const isActive = !isDone && completedItems.length === i;
                return (
                  <div
                    key={i}
                    className={`kof-checklist-item${isDone ? ' done' : ''}`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="kof-check-icon">{item.icon}</div>
                    <span className="kof-check-label">{item.label}</span>
                    <div className="kof-check-status">
                      {isDone ? (
                        <CheckCircle2 size={18} color="#4ADE80" />
                      ) : isActive ? (
                        <div className="kof-spinner" />
                      ) : (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(51,65,85,.5)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── STATE: TWEAK ── */}
        {flowState === 'tweak' && (
          <div className="kof-tweak-appear">
            <div className="kof-step-label">Étape 3 — Affinez le résultat</div>
            <h2 className="kof-title" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', marginBottom: 8 }}>
              Votre copilote est prêt.
            </h2>
            <p className="kof-desc" style={{ marginBottom: 24 }}>
              Consultez l'aperçu de votre stratégie et affinez si besoin.
            </p>

            {/* Preview frame */}
            <div className="kof-preview-frame">
              <div className="kof-preview-badge">
                <CheckCircle2 size={10} />
                Analyse complète
              </div>
              <div className="kof-preview-grid">
                {[
                  { label: 'Identité de marque', value: 'Extraite & validée' },
                  { label: 'Assets créatifs', value: '12 formats générés' },
                  { label: 'Calendrier de campagnes', value: '8 semaines planifiées' },
                  { label: 'Tunnels de conversion', value: '3 flux configurés' },
                ].map(card => (
                  <div key={card.label} className="kof-preview-card">
                    <div className="kof-preview-card-label">{card.label}</div>
                    <div className="kof-preview-card-value">{card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tweak input */}
            <div className="kof-tweak-row">
              <input
                ref={tweakRef}
                className={`kof-tweak-input${tweakFocused ? ' focused' : ''}`}
                placeholder="Une modification ? Ex: 'Change l'offre principale pour cibler les agences'..."
                value={tweakValue}
                onChange={e => setTweakValue(e.target.value)}
                onFocus={() => setTweakFocused(true)}
                onBlur={() => setTweakFocused(false)}
                onKeyDown={e => { if (e.key === 'Enter' && tweakValue.trim()) handleTweakSubmit(); }}
              />
              <button className="kof-tweak-btn" onClick={handleTweakSubmit} disabled={!tweakValue.trim()}>
                <Send size={16} />
              </button>
            </div>

            <button className="kof-complete-btn" onClick={() => onComplete?.(inputValue)}>
              <CheckCircle2 size={16} />
              Accéder à mon tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
