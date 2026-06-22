import { useState, useEffect, useRef } from 'react';
import { DEMO_CSS } from './demo/DemoShared';
import { SceneDashboard, SceneCockpit, SceneReviews, SceneInbox, SceneCalendar } from './demo/DemoScenes';

/* ─── Scene registry ─────────────────────────────────────────────────────── */
const SCENES = [
  { id: 'dashboard', Component: SceneDashboard, label: 'Dashboard', icon: '⊞', duration: 5000 },
  { id: 'cockpit',   Component: SceneCockpit,   label: 'Cockpit IA', icon: '✦', duration: 6500 },
  { id: 'reviews',   Component: SceneReviews,   label: 'Avis Google', icon: '⭐', duration: 6000 },
  { id: 'inbox',     Component: SceneInbox,     label: 'Inbox', icon: '💬', duration: 6000 },
  { id: 'calendar',  Component: SceneCalendar,  label: 'Calendrier', icon: '📅', duration: 5500 },
] as const;

/* ─── Main orchestrator ──────────────────────────────────────────────────── */
export function HeroDashboardMockup() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScene = SCENES[sceneIdx];

  /* Auto-advance + progress bar */
  useEffect(() => {
    setProgress(0);
    const duration = currentScene.duration;
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(progressRef.current!);
        setExiting(true);
        setTimeout(() => {
          setExiting(false);
          setSceneIdx(i => (i + 1) % SCENES.length);
        }, 380);
      }
    }, 30);

    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [sceneIdx]);

  /* Manual tab click */
  const goToScene = (i: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setExiting(true);
    setTimeout(() => { setExiting(false); setSceneIdx(i); }, 280);
  };

  const { Component } = currentScene;

  return (
    <>
      <style>{DEMO_CSS}</style>
      <div style={{ background: '#0B1120', display: 'flex', flexDirection: 'column', height: 280 }}>

        {/* Top progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,.05)', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#0D9488,#0891B2)',
            width: `${progress * 100}%`,
            transition: 'width .03s linear',
            boxShadow: '0 0 8px rgba(13,148,136,.6)',
          }} />
        </div>

        {/* Scene tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '5px 8px',
          borderBottom: '1px solid rgba(255,255,255,.05)',
          flexShrink: 0, background: 'rgba(0,0,0,.2)',
        }}>
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToScene(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 6, border: 'none',
                background: i === sceneIdx ? 'rgba(13,148,136,.18)' : 'transparent',
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <span style={{ fontSize: '.6rem' }}>{s.icon}</span>
              <span style={{
                fontSize: '.45rem',
                fontWeight: i === sceneIdx ? 700 : 400,
                color: i === sceneIdx ? '#2DD4BF' : '#475569',
              }}>
                {s.label}
              </span>
            </button>
          ))}

          {/* Active scene progress dot */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {SCENES.map((_, i) => (
              <div key={i} style={{
                width: i === sceneIdx ? 16 : 4, height: 4, borderRadius: 9999,
                background: i === sceneIdx ? '#0D9488' : 'rgba(255,255,255,.12)',
                transition: 'all .3s ease',
                overflow: 'hidden',
              }}>
                {i === sceneIdx && (
                  <div style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    background: '#2DD4BF',
                    transition: 'width .03s linear',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scene content — fade + scale on transition */}
        <div style={{
          flex: 1, display: 'flex', overflow: 'hidden',
          opacity: exiting ? 0 : 1,
          transform: exiting ? 'scale(.985) translateY(4px)' : 'scale(1) translateY(0)',
          transition: exiting
            ? 'opacity .28s ease, transform .28s ease'
            : 'opacity .2s ease',
          animation: !exiting ? 'hd-scene-in .3s ease both' : undefined,
        }}>
          <Component key={`${sceneIdx}-${exiting}`} />
        </div>
      </div>
    </>
  );
}
