import { useState, useEffect } from 'react';
import { Typewriter, Counter, Stars, MiniSidebar, Topbar, FakeCursor } from './DemoShared';
import type { CursorWaypoint } from './DemoShared';

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 1 — Dashboard KPIs animés + live feed
══════════════════════════════════════════════════════════════════════════════ */
const DASHBOARD_CURSOR: CursorWaypoint[] = [
  { x: 35, y: 30, delay: 200 },
  { x: 35, y: 30, delay: 700, click: true },   // click KPI 1
  { x: 62, y: 30, delay: 1200 },
  { x: 62, y: 30, delay: 1600, click: true },   // click KPI 2
  { x: 88, y: 30, delay: 2100 },
  { x: 88, y: 30, delay: 2500, click: true },   // click KPI 3
  { x: 55, y: 65, delay: 3000 },
  { x: 55, y: 70, delay: 3600, click: true },   // click live feed item
  { x: 55, y: 78, delay: 4100 },
  { x: 30, y: 78, delay: 4600, click: true },   // click second feed item
];

export function SceneDashboard() {
  const [phase, setPhase] = useState(0); // 0=initial, 1=mid, 2=highlight

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2500);
    const t2 = setTimeout(() => setPhase(2), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const kpis = [
    { label: '🎯 Score IA', from: 72, to: 94, suffix: '%', color: '#0D9488', border: 'rgba(13,148,136,.25)', bg: 'rgba(13,148,136,.08)', badge: '▲ +22%', badgeColor: '#22C55E' },
    { label: '⭐ Avis Google', from: 4.2, to: 4.9, suffix: '★', color: '#FBBF24', border: 'rgba(251,191,36,.25)', bg: 'rgba(251,191,36,.07)', badge: '+12 ce mois', badgeColor: '#FCD34D' },
    { label: '👁 Impressions', from: 8100, to: 12850, suffix: '', color: '#818CF8', border: 'rgba(129,140,248,.25)', bg: 'rgba(129,140,248,.08)', badge: '▲ +58%', badgeColor: '#A5B4FC' },
  ];

  const feed = [
    { icon: '✅', text: 'Post publié sur Instagram', time: '09:14', color: '#22C55E', delay: 400 },
    { icon: '💬', text: 'Avis 5★ reçu', time: '09:27', color: '#FBBF24', delay: 700 },
    { icon: '🚀', text: 'Campagne SMS démarrée', time: '09:41', color: '#818CF8', delay: 1000 },
    { icon: '📍', text: 'Fiche Maps mise à jour', time: '09:55', color: '#0D9488', delay: 1300 },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <FakeCursor waypoints={DASHBOARD_CURSOR} />
      <MiniSidebar active="dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title="Dashboard · Lundi 9 juin 2026" />
        <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
            {kpis.map((k, i) => (
              <div key={k.label} style={{
                background: k.bg,
                border: `1px solid ${k.border}`,
                borderRadius: 10,
                padding: '8px 10px',
                animation: `hd-fade-up .4s ${i * 120}ms cubic-bezier(.34,1.2,.64,1) both`,
                transition: 'box-shadow .2s',
                boxShadow: phase === 2 && i === 0 ? '0 0 0 2px rgba(13,148,136,.5)' : 'none',
              }}>
                <p style={{ fontSize: '.5rem', color: '#64748B', fontWeight: 600, marginBottom: 3 }}>{k.label}</p>
                <p style={{ fontSize: '.95rem', fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 4 }}>
                  <Counter from={k.from} to={k.to} suffix={k.suffix} dur={1200} delay={i * 150} />
                </p>
                <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 9999, marginBottom: 3, overflow: 'hidden' }}>
                  <div className="hd-kpi-bar" style={{ '--w': i === 0 ? '94%' : i === 1 ? '98%' : '76%' } as React.CSSProperties} />
                </div>
                <span style={{ fontSize: '.45rem', color: k.badgeColor, fontWeight: 700 }}>{k.badge}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.5rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>● Live Activity</span>
              <span style={{ fontSize: '.45rem', color: '#0D9488', fontWeight: 600, animation: phase >= 1 ? 'hd-pulse-dot 2s ease infinite' : undefined }}>Aujourd'hui</span>
            </div>
            {feed.map((f, idx) => (
              <div key={f.text} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0',
                borderBottom: '1px solid rgba(255,255,255,.04)',
                animation: `hd-slide-in-r .35s ${f.delay}ms ease both`,
                background: phase >= 1 && idx === 0 ? 'rgba(34,197,94,.04)' : 'transparent',
                borderRadius: 5,
                transition: 'background .3s',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', flexShrink: 0 }}>{f.icon}</div>
                <span style={{ flex: 1, fontSize: '.52rem', color: '#CBD5E1', lineHeight: 1.4 }}>{f.text}</span>
                <span style={{ fontSize: '.45rem', color: '#475569', flexShrink: 0 }}>{f.time}</span>
              </div>
            ))}
          </div>

          {/* Phase-2: notification badge pops in */}
          {phase >= 2 && (
            <div style={{
              marginTop: 6, background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.25)',
              borderRadius: 8, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 6,
              animation: 'hd-pop .35s cubic-bezier(.34,1.56,.64,1) both',
            }}>
              <span style={{ fontSize: '.6rem' }}>🤖</span>
              <span style={{ fontSize: '.48rem', color: '#2DD4BF', fontWeight: 700 }}>Copilote IA : 3 actions recommandées ce soir</span>
              <span style={{ marginLeft: 'auto', fontSize: '.44rem', color: '#0D9488', fontWeight: 600 }}>Voir →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 2 — Cockpit IA: génération + preview Instagram
══════════════════════════════════════════════════════════════════════════════ */
const COCKPIT_CURSOR: CursorWaypoint[] = [
  { x: 35, y: 42, delay: 300 },
  { x: 35, y: 42, delay: 700, click: true },   // click prompt area
  { x: 35, y: 55, delay: 1400, click: true },   // click generate
  { x: 78, y: 50, delay: 2600 },               // move to preview
  { x: 78, y: 68, delay: 3200, click: true },   // click preview action
  { x: 35, y: 72, delay: 4200 },               // hover publish
  { x: 35, y: 72, delay: 4600, click: true },   // click publish
  { x: 65, y: 38, delay: 5400 },               // review result
];

export function SceneCockpit() {
  const [step, setStep] = useState<'prompt' | 'generating' | 'preview' | 'published'>('prompt');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setStep('generating'), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (step !== 'generating') return;
    let count = 0;
    const id = setInterval(() => { count++; setDots('.'.repeat((count % 3) + 1)); }, 300);
    const t2 = setTimeout(() => { clearInterval(id); setStep('preview'); }, 2200);
    return () => { clearInterval(id); clearTimeout(t2); };
  }, [step]);

  useEffect(() => {
    if (step !== 'preview') return;
    const t = setTimeout(() => setStep('published'), 2400);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <FakeCursor waypoints={COCKPIT_CURSOR} />
      <MiniSidebar active="cockpit" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title="Cockpit IA — Créer un post" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '8px 10px' }}>
              <p style={{ fontSize: '.47rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>💡 Idée de post</p>
              <div style={{ background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 7, padding: '6px 8px', fontSize: '.55rem', color: '#CBD5E1', lineHeight: 1.5, animation: 'hd-fade-up .35s ease both' }}>
                {step === 'prompt' ? <Typewriter text="Spécial midi — notre tajine d'agneau confit avec vue sur le port ☀️" speed={28} /> : <>Spécial midi — notre tajine d'agneau confit avec vue sur le port ☀️</>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, animation: 'hd-fade-up .35s .2s ease both' }}>
              {[['📘 Facebook', 'rgba(59,130,246,.15)', 'rgba(59,130,246,.3)', '#93C5FD'], ['📸 Insta', 'rgba(236,72,153,.15)', 'rgba(236,72,153,.3)', '#F9A8D4'], ['💼 LinkedIn', 'rgba(59,130,246,.1)', 'rgba(59,130,246,.2)', '#93C5FD']].map(([p, bg, border, color]) => (
                <div key={p} style={{ padding: '3px 7px', borderRadius: 9999, fontSize: '.48rem', fontWeight: 700, background: bg, border: `1px solid ${border}`, color }}>{p}</div>
              ))}
            </div>

            {step === 'generating' && (
              <div style={{ background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.22)', borderRadius: 9, padding: '8px 10px', animation: 'hd-pop .35s cubic-bezier(.34,1.56,.64,1) both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#0D9488,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', animation: 'hd-pulse-dot 1s ease infinite' }}>🤖</div>
                  <span style={{ fontSize: '.52rem', color: '#2DD4BF', fontWeight: 700 }}>Copilote IA génère{dots}</span>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0,1,2,3,4].map(i => <div key={i} style={{ height: 3, flex: 1, borderRadius: 9999, background: `rgba(13,148,136,${0.15 + i * 0.15})`, animation: `hd-bar-grow .6s ${i * 120}ms ease both`, '--w': '100%' } as React.CSSProperties} />)}
                </div>
              </div>
            )}

            {(step === 'preview' || step === 'published') && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '8px 10px', animation: 'hd-fade-up .3s ease both' }}>
                <p style={{ fontSize: '.47rem', color: '#64748B', fontWeight: 700, marginBottom: 4 }}>📊 Analyse IA</p>
                {[['Accroche', '94%', '#22C55E'], ['Emojis', '✓', '#0D9488'], ['Longueur', 'Idéale', '#818CF8']].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '.45rem', color: '#64748B' }}>{label}</span>
                    <span style={{ fontSize: '.45rem', color, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 'published' && (
              <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 9, padding: '8px 10px', textAlign: 'center', animation: 'hd-pop-green .4s cubic-bezier(.34,1.56,.64,1) both' }}>
                <span style={{ fontSize: '1.1rem' }}>🎉</span>
                <p style={{ fontSize: '.6rem', color: '#22C55E', fontWeight: 800, margin: '3px 0 1px' }}>Publié avec succès !</p>
                <p style={{ fontSize: '.48rem', color: '#86EFAC' }}>Facebook · Instagram · LinkedIn</p>
                <p style={{ fontSize: '.48rem', color: '#4ADE80', marginTop: 2, animation: 'hd-count-up .4s .3s both' }}>▲ +18% portée estimée 🚀</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <p style={{ fontSize: '.47rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', animation: 'hd-fade-up .35s .1s ease both' }}>📱 Aperçu Instagram</p>
            {(step === 'preview' || step === 'published') ? (
              <div style={{ background: '#1A2233', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden', animation: 'hd-slide-in-r .4s cubic-bezier(.34,1.56,.64,1) both', flex: 1 }}>
                <div style={{ height: 70, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(13,148,136,.3) 0%, rgba(8,145,178,.4) 100%)' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', opacity: .6 }}>🍲</div>
                  <div style={{ position: 'absolute', top: 6, left: 8, right: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0D9488', border: '2px solid white', fontSize: '.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍴</div>
                    <span style={{ fontSize: '.45rem', color: 'white', fontWeight: 700 }}>Le Bistrot du Port</span>
                    <span style={{ marginLeft: 'auto', fontSize: '.42rem', color: 'rgba(255,255,255,.7)' }}>Il y a 1 min</span>
                  </div>
                </div>
                <div style={{ padding: '7px 8px' }}>
                  <p style={{ fontSize: '.52rem', color: '#F1F5F9', lineHeight: 1.5, marginBottom: 5 }}>☀️ <strong>Spécial midi</strong> — Notre tajine d'agneau confit avec vue sur le port…</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['❤️ 24', '💬 3', '🔗'].map((a, i) => <span key={a} style={{ fontSize: '.48rem', color: '#94A3B8', animation: `hd-fade-up .25s ${i * 80 + 200}ms ease both` }}>{a}</span>)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '.5rem', color: '#334155', textAlign: 'center' }}>Aperçu après<br/>génération IA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 3 — Reviews: avis entrant + réponse IA publiée
══════════════════════════════════════════════════════════════════════════════ */
const REVIEWS_CURSOR: CursorWaypoint[] = [
  { x: 38, y: 48, delay: 300 },                // hover first review
  { x: 38, y: 48, delay: 700, click: true },   // click review
  { x: 82, y: 42, delay: 1200 },               // move to AI panel
  { x: 82, y: 55, delay: 1800 },               // hover response text
  { x: 82, y: 78, delay: 3000, click: true },  // click "publish response"
  { x: 38, y: 22, delay: 4000 },               // back to stats
  { x: 38, y: 62, delay: 4700, click: true },  // click second review
  { x: 65, y: 62, delay: 5200 },               // hover SEO widget
];

export function SceneReviews() {
  const [step, setStep] = useState<'incoming' | 'typing' | 'sent' | 'highlight'>('incoming');

  useEffect(() => {
    const t1 = setTimeout(() => setStep('typing'), 1400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (step !== 'typing') return;
    const t1 = setTimeout(() => setStep('sent'), 2600);
    return () => clearTimeout(t1);
  }, [step]);

  useEffect(() => {
    if (step !== 'sent') return;
    const t = setTimeout(() => setStep('highlight'), 4200);
    return () => clearTimeout(t);
  }, [step]);

  const reviews = [
    { author: 'Sophie M.', stars: 5, text: 'Endroit magique ! Service impeccable et cuisine raffinée.', time: 'À l\'instant', fresh: true },
    { author: 'Marc L.',   stars: 4, text: 'Très bonne table, je reviendrai avec plaisir.', time: '3h', fresh: false },
    { author: 'Julie R.',  stars: 5, text: 'La meilleure expérience culinaire de l\'année !', time: '1j', fresh: false },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <FakeCursor waypoints={REVIEWS_CURSOR} />
      <MiniSidebar active="reviews" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title="Gestion des avis Google" />
        <div style={{ flex: 1, display: 'flex', gap: 8, padding: '10px 12px', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 9, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, animation: 'hd-fade-down .4s ease both' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⭐</span>
              <div>
                <p style={{ fontSize: '.65rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1 }}>4.9 / 5</p>
                <p style={{ fontSize: '.45rem', color: '#64748B' }}>127 avis · Top 1% de la ville</p>
              </div>
              <div style={{ marginLeft: 'auto', animation: 'hd-count-up .4s .5s both' }}>
                <span style={{ fontSize: '.48rem', color: '#22C55E', fontWeight: 700 }}>▲ +8 ce mois</span>
              </div>
            </div>
            {reviews.map((r, i) => (
              <div key={r.author} style={{
                background: r.fresh
                  ? (step === 'highlight' ? 'rgba(34,197,94,.1)' : 'rgba(34,197,94,.06)')
                  : 'rgba(255,255,255,.02)',
                border: `1px solid ${r.fresh ? 'rgba(34,197,94,.25)' : 'rgba(255,255,255,.06)'}`,
                borderRadius: 9, padding: '7px 9px',
                animation: `hd-notification .4s ${i * 150}ms cubic-bezier(.34,1.2,.64,1) both`,
                position: 'relative',
                transition: 'background .3s',
              }}>
                {r.fresh && <span style={{ position: 'absolute', top: 6, right: 7, fontSize: '.42rem', background: 'rgba(34,197,94,.15)', color: '#22C55E', fontWeight: 800, padding: '2px 5px', borderRadius: 9999, animation: 'hd-pulse-dot 1.5s ease infinite' }}>NOUVEAU</span>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: '.52rem', color: '#F1F5F9', fontWeight: 700 }}>{r.author}</span>
                  <Stars n={r.stars} delay={i * 100} />
                </div>
                <p style={{ fontSize: '.5rem', color: '#94A3B8', lineHeight: 1.4, marginBottom: 3 }}>{r.text}</p>
                <span style={{ fontSize: '.42rem', color: '#475569' }}>{r.time}</span>
              </div>
            ))}
          </div>

          <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ flex: 1, background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 9, padding: '8px 9px', animation: 'hd-slide-in-r .4s .3s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: '.7rem' }}>🤖</span>
                <span style={{ fontSize: '.48rem', color: '#2DD4BF', fontWeight: 700 }}>Réponse IA</span>
              </div>
              <div style={{ fontSize: '.5rem', color: '#CBD5E1', lineHeight: 1.55, minHeight: 50 }}>
                {step === 'incoming' && <span style={{ color: '#475569', fontStyle: 'italic' }}>En attente du nouvel avis…</span>}
                {step === 'typing' && <Typewriter text="Merci Sophie pour ce magnifique retour ✨ Toute l'équipe est ravie ! À très bientôt 🍽️" speed={25} />}
                {(step === 'sent' || step === 'highlight') && <span style={{ animation: 'hd-fade-up .3s ease both' }}>Merci Sophie pour ce magnifique retour ✨ Toute l'équipe est ravie ! À très bientôt 🍽️</span>}
              </div>
              {(step === 'sent' || step === 'highlight') && (
                <div style={{ marginTop: 6, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 6, padding: '5px 7px', textAlign: 'center', animation: 'hd-pop-green .35s cubic-bezier(.34,1.56,.64,1) both' }}>
                  <p style={{ fontSize: '.5rem', color: '#22C55E', fontWeight: 800 }}>✅ Réponse publiée</p>
                  <p style={{ fontSize: '.43rem', color: '#86EFAC', marginTop: 1 }}>via Google Maps</p>
                </div>
              )}
            </div>
            <div style={{ background: 'rgba(129,140,248,.08)', border: '1px solid rgba(129,140,248,.2)', borderRadius: 9, padding: '7px 9px', animation: 'hd-fade-up .4s .5s ease both' }}>
              <p style={{ fontSize: '.45rem', color: '#818CF8', fontWeight: 700, marginBottom: 3 }}>📈 Impact SEO local</p>
              <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 9999, marginBottom: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '78%', background: '#818CF8', borderRadius: 9999, animation: 'hd-bar-grow .8s .6s ease both', '--w': '78%' } as React.CSSProperties} />
              </div>
              <p style={{ fontSize: '.43rem', color: '#A5B4FC' }}>+0.4 pt de réputation</p>
              {step === 'highlight' && (
                <p style={{ fontSize: '.43rem', color: '#22C55E', marginTop: 2, fontWeight: 700, animation: 'hd-count-up .3s ease both' }}>+2 nouvelles vues</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 4 — Inbox: message entrant + brouillon IA
══════════════════════════════════════════════════════════════════════════════ */
const INBOX_CURSOR: CursorWaypoint[] = [
  { x: 17, y: 38, delay: 300 },               // hover message list
  { x: 17, y: 38, delay: 800, click: true },  // click first message
  { x: 65, y: 52, delay: 1600 },              // move to message body
  { x: 65, y: 67, delay: 2200 },              // hover AI draft
  { x: 35, y: 82, delay: 3200, click: true }, // click "Envoyer"
  { x: 17, y: 55, delay: 4100, click: true }, // click second message
  { x: 65, y: 45, delay: 4800 },              // review second message
];

export function SceneInbox() {
  const [selected, setSelected] = useState<number | null>(null);
  const [replied, setReplied] = useState(false);
  const [phase2, setPhase2] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSelected(0), 1000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const t1 = setTimeout(() => setReplied(true), 2500);
    const t2 = setTimeout(() => setPhase2(true), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [selected]);

  const messages = [
    { from: 'Sophie Marchand', preview: 'Bonjour, je suis créatrice de contenu et j\'adorerais...', channel: '📸', unread: true, time: '09:14' },
    { from: 'Arnaud Petit', preview: 'Nous cherchons à centraliser notre présence sociale...', channel: '🌐', unread: true, time: '11:32' },
    { from: 'Marie Lefebvre', preview: 'Votre publication était vraiment pertinente !', channel: '💼', unread: false, time: 'Hier' },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <FakeCursor waypoints={INBOX_CURSOR} />
      <MiniSidebar active="inbox" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title="Inbox Unifié — 2 non lus" />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 130, borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {messages.map((m, i) => (
              <div key={m.from} style={{
                padding: '7px 8px',
                background: selected === i ? 'rgba(13,148,136,.1)' : (phase2 && i === 1 ? 'rgba(255,255,255,.03)' : 'transparent'),
                borderBottom: '1px solid rgba(255,255,255,.04)',
                borderLeft: selected === i ? '2px solid #0D9488' : '2px solid transparent',
                animation: `hd-slide-in-l .35s ${i * 120}ms ease both`,
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '.52rem', color: m.unread ? '#F1F5F9' : '#94A3B8', fontWeight: m.unread ? 700 : 400 }}>{m.from.split(' ')[0]}</span>
                  <span style={{ fontSize: '.42rem', color: '#475569' }}>{m.time}</span>
                </div>
                <p style={{ fontSize: '.46rem', color: '#64748B', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{m.preview}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: '.55rem' }}>{m.channel}</span>
                  {m.unread && !replied && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0D9488', animation: 'hd-pulse-dot 1s ease infinite', marginLeft: 'auto' }} />}
                </div>
              </div>
            ))}
          </div>

          {selected !== null && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '9px 11px', gap: 7, animation: 'hd-slide-in-r .35s ease both', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '.6rem', fontWeight: 700, color: '#F1F5F9' }}>{messages[selected].from}</p>
                  <p style={{ fontSize: '.5rem', color: '#64748B' }}>Collaboration créative</p>
                </div>
                <span style={{ fontSize: '.7rem' }}>{messages[selected].channel}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, padding: '7px 9px', animation: 'hd-float-msg .4s .15s ease both' }}>
                <p style={{ fontSize: '.51rem', color: '#CBD5E1', lineHeight: 1.6 }}>Bonjour ! Je suis créatrice de contenu et j'adorerais collaborer avec vous sur un projet Instagram. Seriez-vous disponible cette semaine ? 🙏</p>
              </div>
              <div style={{ background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 9, padding: '7px 9px', animation: 'hd-float-msg .4s .4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: '.6rem' }}>🤖</span>
                  <span style={{ fontSize: '.45rem', color: '#2DD4BF', fontWeight: 700 }}>Brouillon IA suggéré</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.42rem', color: '#0D9488', fontWeight: 600 }}>98% pertinence</span>
                </div>
                <p style={{ fontSize: '.51rem', color: '#CBD5E1', lineHeight: 1.55 }}>Bonjour Sophie ! Merci pour votre intérêt 😊 Nous serions ravis d'explorer une collaboration. Pouvez-vous préciser le type de contenu envisagé ?</p>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 'auto', flexWrap: 'wrap' }}>
                {['✅ Envoyer le brouillon', '✏️ Modifier', '📋 Template'].map((btn, i) => (
                  <button key={btn} style={{ padding: '4px 8px', borderRadius: 7, fontSize: '.47rem', fontWeight: 700, background: i === 0 ? 'rgba(13,148,136,.2)' : 'rgba(255,255,255,.05)', border: i === 0 ? '1px solid rgba(13,148,136,.4)' : '1px solid rgba(255,255,255,.08)', color: i === 0 ? '#2DD4BF' : '#94A3B8', cursor: 'pointer', animation: `hd-fade-up .3s ${i * 100 + 600}ms ease both` }}>{btn}</button>
                ))}
              </div>
              {replied && (
                <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 7, padding: '5px 8px', textAlign: 'center', animation: 'hd-pop-green .35s cubic-bezier(.34,1.56,.64,1) both' }}>
                  <p style={{ fontSize: '.5rem', color: '#22C55E', fontWeight: 800 }}>✅ Réponse envoyée à Sophie !</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 5 — Calendar: planning hebdo animé
══════════════════════════════════════════════════════════════════════════════ */
const CALENDAR_CURSOR: CursorWaypoint[] = [
  { x: 12, y: 60, delay: 300 },               // hover day 1
  { x: 12, y: 60, delay: 700, click: true },  // click day 1
  { x: 28, y: 60, delay: 1300 },              // move day 3
  { x: 28, y: 60, delay: 1700, click: true }, // click day 3 event
  { x: 48, y: 60, delay: 2300 },              // hover day 4
  { x: 70, y: 60, delay: 2900, click: true }, // click day 6 with 2 events
  { x: 82, y: 88, delay: 3700 },              // move to AI suggestion bar
  { x: 88, y: 88, delay: 4200, click: true }, // click "Planifier"
  { x: 55, y: 45, delay: 4900 },              // back to calendar middle
];

export function SceneCalendar() {
  const [phase, setPhase] = useState(0); // 0=initial, 1=event-selected, 2=ai-suggestion

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dates = [9, 10, 11, 12, 13, 14, 15];
  const events: Record<number, { label: string; color: string; icon: string; highlighted?: boolean }[]> = {
    9:  [{ label: '12h — Tajine midi', color: '#0D9488', icon: '📸', highlighted: true }],
    10: [{ label: '10h — Anniv 5 ans', color: '#818CF8', icon: '🎉' }, { label: '18h — Stories WE', color: '#F59E0B', icon: '📱' }],
    11: [{ label: '9h — SEO article', color: '#22C55E', icon: '✍️' }],
    12: [{ label: '12h — Offre flash', color: '#EF4444', icon: '⚡' }],
    13: [{ label: '11h — Témoignage', color: '#0891B2', icon: '💬' }],
    14: [{ label: '9h — Post WE', color: '#818CF8', icon: '📸' }, { label: '14h — Reel', color: '#F59E0B', icon: '🎬' }],
    15: [],
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <FakeCursor waypoints={CALENDAR_CURSOR} />
      <MiniSidebar active="calendar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title="Calendrier — Semaine du 9 juin 2026" />
        <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {days.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', padding: '4px 0', animation: `hd-fade-down .3s ${i * 60}ms ease both` }}>
                <p style={{ fontSize: '.45rem', color: '#475569', fontWeight: 600, marginBottom: 2 }}>{d}</p>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', margin: '0 auto',
                  background: i === 0 ? '#0D9488' : (phase >= 1 && i === 5 ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.05)'),
                  border: i === 0 ? 'none' : (phase >= 1 && i === 5 ? '1px solid rgba(129,140,248,.4)' : '1px solid rgba(255,255,255,.07)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .3s, border .3s',
                }}>
                  <span style={{ fontSize: '.52rem', color: i === 0 ? '#fff' : (phase >= 1 && i === 5 ? '#A5B4FC' : '#64748B'), fontWeight: i === 0 ? 800 : 400 }}>{dates[i]}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, flex: 1 }}>
            {dates.map((d, i) => (
              <div key={d} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                background: (phase >= 1 && i === 0) ? 'rgba(13,148,136,.06)' : 'rgba(255,255,255,.02)',
                borderRadius: 8,
                border: (phase >= 1 && i === 0) ? '1px solid rgba(13,148,136,.2)' : '1px solid rgba(255,255,255,.05)',
                padding: '5px 4px', minHeight: 70,
                transition: 'all .3s',
              }}>
                {(events[d] || []).map((ev, j) => (
                  <div key={ev.label} style={{
                    background: `${ev.color}18`,
                    border: `1px solid ${ev.color}35`,
                    borderRadius: 5, padding: '3px 4px',
                    animation: `hd-cal-item .5s ${i * 80 + j * 120}ms cubic-bezier(.4,0,.2,1) both`,
                    boxShadow: ev.highlighted && phase >= 1 ? `0 0 0 1px ${ev.color}60` : 'none',
                    transition: 'box-shadow .3s',
                  }}>
                    <span style={{ fontSize: '.48rem' }}>{ev.icon} </span>
                    <span style={{ fontSize: '.43rem', color: '#CBD5E1', fontWeight: 600 }}>{ev.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            background: phase >= 2 ? 'rgba(13,148,136,.1)' : 'rgba(13,148,136,.06)',
            border: `1px solid ${phase >= 2 ? 'rgba(13,148,136,.35)' : 'rgba(13,148,136,.18)'}`,
            borderRadius: 9, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 7,
            animation: 'hd-fade-up .4s .8s ease both',
            transition: 'all .3s',
          }}>
            <span style={{ fontSize: '.8rem', animation: phase >= 2 ? 'hd-pulse-dot .8s ease infinite' : undefined }}>✦</span>
            <p style={{ fontSize: '.5rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              <strong style={{ color: '#2DD4BF' }}>IA suggère</strong> — Idéal pour publier <strong>samedi 14h</strong> (pic d'engagement +34%)
            </p>
            <button style={{
              marginLeft: 'auto', flexShrink: 0, padding: '4px 9px',
              background: phase >= 2 ? 'rgba(13,148,136,.35)' : 'rgba(13,148,136,.2)',
              border: '1px solid rgba(13,148,136,.4)', borderRadius: 9999,
              fontSize: '.47rem', fontWeight: 700, color: '#2DD4BF', cursor: 'pointer',
              transition: 'background .2s',
            }}>
              {phase >= 2 ? '✓ Planifié !' : 'Planifier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
