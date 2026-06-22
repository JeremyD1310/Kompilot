import { useState, useEffect, useRef } from 'react';

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
export const DEMO_CSS = `
@keyframes hd-fade-up    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes hd-fade-down  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
@keyframes hd-pop        { 0%{opacity:0;transform:scale(.88) translateY(8px);filter:blur(2px)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)} }
@keyframes hd-pop-green  { 0%{opacity:0;transform:scale(.88)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
@keyframes hd-pulse-dot  { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes hd-radar      { 0%{transform:scale(1);opacity:.8} 70%{transform:scale(2.6);opacity:0} 100%{transform:scale(1);opacity:0} }
@keyframes hd-bar-grow   { from{width:0%} to{width:var(--w)} }
@keyframes hd-slide-in-r { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-slide-in-l { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes hd-blink-cur  { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes hd-float-msg  { 0%{opacity:0;transform:translateY(10px) scale(.95)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes hd-star-in    { 0%{opacity:0;transform:scale(0) rotate(-30deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
@keyframes hd-cal-item   { from{opacity:0;transform:scaleX(0);transform-origin:left} to{opacity:1;transform:scaleX(1)} }
@keyframes hd-notification { 0%{opacity:0;transform:translateX(20px) scale(.9)} 60%{transform:translateX(-4px) scale(1.02)} 100%{opacity:1;transform:translateX(0) scale(1)} }
@keyframes hd-scene-in   { from{opacity:0} to{opacity:1} }
@keyframes hd-count-up   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-typing-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes hd-ripple     { 0%{transform:scale(0);opacity:.7} 100%{transform:scale(3.5);opacity:0} }
@keyframes hd-cursor-click { 0%{transform:scale(1)} 40%{transform:scale(.72)} 100%{transform:scale(1)} }
@keyframes hd-highlight-pulse { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 2px rgba(13,148,136,.6)} }
.hd-kpi-bar {
  background: linear-gradient(90deg,#0D9488,#0891B2);
  animation: hd-bar-grow .9s cubic-bezier(.4,0,.2,1) both;
}
`;

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
export function Typewriter({ text, speed = 22, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t0);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    setDisplayed('');
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [started, text, speed]);

  return (
    <span>
      {displayed}
      <span style={{ display: 'inline-block', width: 1.5, height: '0.85em', background: '#2DD4BF', verticalAlign: 'middle', marginLeft: 1, animation: 'hd-typing-cursor .7s ease infinite' }} />
    </span>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
export function Counter({ from, to, suffix = '', dur = 1000, delay = 0 }: { from: number; to: number; suffix?: string; dur?: number; delay?: number }) {
  const [val, setVal] = useState(from);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      startRef.current = Date.now();
      const id = setInterval(() => {
        if (!startRef.current) return;
        const p = Math.min((Date.now() - startRef.current) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(from + (to - from) * e));
        if (p >= 1) clearInterval(id);
      }, 16);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [from, to, dur, delay]);

  return <>{val}{suffix}</>;
}

/* ─── Star rating ────────────────────────────────────────────────────────── */
export function Stars({ n, delay = 0 }: { n: number; delay?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? '#FBBF24' : '#334155', fontSize: '.75rem', animation: i < n ? `hd-star-in .3s ${delay + i * 80}ms cubic-bezier(.34,1.56,.64,1) both` : undefined }}>★</span>
      ))}
    </span>
  );
}

/* ─── Sidebar mini ───────────────────────────────────────────────────────── */
export type SidebarTab = 'dashboard' | 'calendar' | 'inbox' | 'reviews' | 'cockpit';

export function MiniSidebar({ active }: { active: SidebarTab }) {
  const items: { id: SidebarTab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'cockpit',   icon: '✦', label: 'Cockpit IA' },
    { id: 'calendar',  icon: '📅', label: 'Calendrier' },
    { id: 'inbox',     icon: '💬', label: 'Inbox' },
    { id: 'reviews',   icon: '⭐', label: 'Avis' },
  ];
  return (
    <div style={{ width: 68, background: '#080E1D', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 5px', flexShrink: 0 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 900, color: '#fff', margin: '0 auto 8px' }}>N</div>
      {items.map(({ id, icon, label }) => (
        <div key={id} style={{ borderRadius: 8, padding: '5px 3px', textAlign: 'center', background: active === id ? 'rgba(13,148,136,.15)' : 'transparent', border: active === id ? '1px solid rgba(13,148,136,.3)' : '1px solid transparent', transition: 'all .2s' }}>
          <div style={{ fontSize: '.72rem' }}>{icon}</div>
          <div style={{ fontSize: '.37rem', color: active === id ? '#2DD4BF' : '#475569', fontWeight: active === id ? 700 : 400, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Topbar ─────────────────────────────────────────────────────────────── */
export function Topbar({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
      <span style={{ fontSize: '.62rem', fontWeight: 700, color: '#F1F5F9' }}>{title}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#0D9488,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.45rem', color: '#fff' }}>AI</div>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem' }}>👤</div>
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface CursorWaypoint {
  x: number;       // % of container width
  y: number;       // % of container height
  delay: number;   // ms from scene start
  click?: boolean; // show ripple at this point
  label?: string;  // optional tooltip text
}

/* ─── FakeCursor ─────────────────────────────────────────────────────────── */
export function FakeCursor({ waypoints }: { waypoints: CursorWaypoint[] }) {
  const [pos, setPos] = useState({ x: waypoints[0]?.x ?? 50, y: waypoints[0]?.y ?? 50 });
  const [clicking, setClicking] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    waypoints.forEach((wp) => {
      // Move to position
      timers.push(setTimeout(() => {
        setPos({ x: wp.x, y: wp.y });
      }, wp.delay));

      // Click effect
      if (wp.click) {
        timers.push(setTimeout(() => {
          setClicking(true);
          const id = ++rippleId.current;
          setRipples(r => [...r, { id, x: wp.x, y: wp.y }]);
          setTimeout(() => {
            setClicking(false);
            setRipples(r => r.filter(ri => ri.id !== id));
          }, 600);
        }, wp.delay + 120));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [waypoints]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {/* Ripples */}
      {ripples.map(r => (
        <div key={r.id} style={{
          position: 'absolute',
          left: `${r.x}%`,
          top: `${r.y}%`,
          width: 18,
          height: 18,
          marginLeft: -9,
          marginTop: -9,
          borderRadius: '50%',
          background: 'rgba(13,148,136,.35)',
          border: '1px solid rgba(13,148,136,.6)',
          animation: 'hd-ripple .6s ease-out forwards',
        }} />
      ))}

      {/* Cursor */}
      <div style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transition: 'left .55s cubic-bezier(.4,0,.2,1), top .55s cubic-bezier(.4,0,.2,1)',
        animation: clicking ? 'hd-cursor-click .22s ease both' : undefined,
        pointerEvents: 'none',
        zIndex: 51,
      }}>
        {/* SVG cursor arrow */}
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.5))' }}>
          <path d="M1 1L1 14L4.5 10.5L7 16L9 15L6.5 9.5L11 9.5L1 1Z" fill="white" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
