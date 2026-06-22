/**
 * AgencyDashboardMockup v3 — Nimt.ai cockpit preview.
 * Composed from sub-modules in agency-mockup/
 */
import { useState, useEffect, useRef } from 'react';
import { MOCKUP_CSS, PROMPTS, WEEKLY_DATA, SOV_DATA, CITED_PAGES } from './agency-mockup/mockupData';
import { Spark } from './agency-mockup/MockupPrimitives';
import { MockupSidebar } from './agency-mockup/MockupSidebar';
import { MockupRightPanel } from './agency-mockup/MockupRightPanel';

function useTypewriter(text: string, speed = 20) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const i = useRef(0);
  useEffect(() => {
    i.current = 0; setOut(''); setDone(false);
    const id = setInterval(() => {
      i.current += 1;
      setOut(text.slice(0, i.current));
      if (i.current >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { out, done };
}

export function AgencyDashboardMockup({ onCta: _onCta }: { onCta?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [pIdx, setPIdx] = useState(0);
  const [promptFade, setPromptFade] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setPromptFade(true); // fade text out first
      setTimeout(() => {
        setPIdx(i => (i + 1) % PROMPTS.length);
        setPromptFade(false); // fade back in with new prompt
      }, 330);
    }, 4800);
    return () => clearInterval(t);
  }, [visible]);

  const { out, done } = useTypewriter(visible && !promptFade ? PROMPTS[pIdx] : '', 20);

  return (
    <>
      <style>{MOCKUP_CSS}</style>
      <div ref={ref} style={{ position: 'relative', margin: '0 0 72px', opacity: visible ? 1 : 0, transition: 'opacity .15s' }}>

        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: '-30px -20px', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 80% 55% at 50% 65%, rgba(99,89,248,.16) 0%, rgba(13,148,136,.08) 55%, transparent 100%)',
        }} />

        {/* Shell */}
        <div className={visible ? '_nc_enter' : ''} style={{
          position: 'relative', zIndex: 1, borderRadius: 18,
          border: '1px solid rgba(255,255,255,.09)',
          background: 'linear-gradient(155deg,#09111F 0%,#0D1829 50%,#0B1520 100%)',
          boxShadow: '0 2px 0 rgba(255,255,255,.06) inset, 0 40px 100px rgba(0,0,0,.75)',
          overflow: 'hidden',
        }}>

          {/* Chrome topbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px', background: 'rgba(0,0,0,.3)',
            borderBottom: '1px solid rgba(255,255,255,.05)',
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#FF5F57','#FFBD2E','#28C840'].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: .75 }} />
              ))}
            </div>
            <div style={{
              flex: 1, height: 19, borderRadius: 5, background: 'rgba(255,255,255,.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#475569', fontSize: '.63rem', letterSpacing: '.03em' }}>
                app.kompilot.com · Mode Agence — Marque Blanche ✓
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)',
              borderRadius: 5, padding: '2px 7px',
            }}>
              <div className="_nc_pdot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
              <span style={{ color: '#4ADE80', fontSize: '.6rem', fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          {/* 3-column body */}
          <div style={{ display: 'flex', minHeight: 460 }}>
            <MockupSidebar />

            {/* Main panel */}
            <div style={{ flex: 1, minWidth: 0, padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '.85rem', marginBottom: 1 }}>Prospection IA</p>
                  <p style={{ color: '#475569', fontSize: '.6rem' }}>6 établissements pilotés · G.E.O. en temps réel</p>
                </div>
                <div style={{
                  background: 'rgba(99,89,248,.1)', border: '1px solid rgba(99,89,248,.25)',
                  borderRadius: 7, padding: '4px 9px', color: '#A78BFA', fontSize: '.6rem', fontWeight: 700,
                }}>
                  🎯 Machine à Clients
                </div>
              </div>

              {/* AI Command bar — typewriter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(167,139,250,.22)',
                borderRadius: 11, padding: '9px 12px',
                boxShadow: '0 0 0 1px rgba(167,139,250,.05) inset, 0 4px 16px rgba(0,0,0,.3)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: 'linear-gradient(135deg,#6359F8,#A78BFA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem',
                }}>✨</div>
                <span style={{ color: '#64748B', fontSize: '.74rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  opacity: promptFade ? 0 : 1, transition: 'opacity .28s ease' }}>
                  {out}
                  {!done && <span className="_nc_cursor" />}
                </span>
                <div style={{
                  background: 'rgba(99,89,248,.15)', borderRadius: 6, padding: '3px 8px',
                  flexShrink: 0, color: '#A78BFA', fontSize: '.6rem', fontWeight: 700,
                }}>⌘K</div>
              </div>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                {[
                  { l: 'Score G.E.O. moyen', v: '74%', d: '+12%' },
                  { l: 'Share of Voice IA',   v: '47%', d: '+8%'  },
                  { l: 'Leads générés',        v: '38',  d: '↑22'  },
                ].map(k => (
                  <div key={k.l} style={{
                    background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)',
                    borderRadius: 9, padding: '9px 11px',
                  }}>
                    <p style={{ color: '#475569', fontSize: '.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{k.l}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em', lineHeight: 1 }}>{k.v}</span>
                      <span style={{ fontSize: '.62rem', fontWeight: 700, color: '#22C55E' }}>{k.d}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sparklines */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {[
                  { l: 'Weekly Average',    d: '+34%', c: '#818CF8', data: WEEKLY_DATA },
                  { l: 'Share of Voice IA', d: '+47%', c: '#0D9488', data: SOV_DATA },
                ].map(ch => (
                  <div key={ch.l} style={{
                    background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.045)',
                    borderRadius: 9, padding: '9px 11px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ color: '#64748B', fontSize: '.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{ch.l}</span>
                      <span style={{ color: ch.c, fontSize: '.63rem', fontWeight: 800 }}>{ch.d}</span>
                    </div>
                    <Spark data={ch.data} color={ch.c} />
                  </div>
                ))}
              </div>

              {/* Top Cited Pages */}
              <div style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.045)',
                borderRadius: 9, padding: '10px 11px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ color: '#64748B', fontSize: '.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Top Cited Pages — ChatGPT / Gemini</span>
                  <span style={{ color: '#334155', fontSize: '.52rem' }}>4 pages</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CITED_PAGES.map((p, i) => (
                    <div key={p.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ color: '#475569', fontSize: '.6rem' }}>{p.name}</span>
                        <span style={{ color: p.color, fontSize: '.6rem', fontWeight: 700 }}>{p.pct}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99, background: p.color,
                          width: visible ? `${p.pct}%` : '0%',
                          transition: `width 1.3s cubic-bezier(.22,1,.36,1) ${.5 + i * .16}s`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live strip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 9px', marginBottom: 14,
                background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.12)', borderRadius: 7,
              }}>
                <div className="_nc_pdot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                <span style={{ color: '#4ADE80', fontSize: '.62rem', fontWeight: 600 }}>
                  3 agents IA actifs — Analyse G.E.O. en cours pour 6 établissements clients
                </span>
              </div>
            </div>

            <MockupRightPanel visible={visible} />
          </div>


        </div>
      </div>
    </>
  );
}
