/**
 * goldenWin.ts — Golden Win Engine (confetti + celebration animation).
 * Lightweight, no external deps — uses requestAnimationFrame canvas rendering.
 */

export interface GoldenWinOptions {
  /** Duration in ms (default: 2500) */
  duration?: number;
  /** Number of confetti particles (default: 120) */
  count?: number;
  /** Primary colors — defaults to teal/gold brand palette */
  colors?: string[];
}

export function launchGoldenWin(options: GoldenWinOptions = {}): void {
  const {
    duration = 2500,
    count = 120,
    colors = ['#0D9488', '#2DD4BF', '#F59E0B', '#FCD34D', '#818CF8', '#ffffff'],
  } = options;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100vw', 'height:100vh',
    'pointer-events:none', 'z-index:99999',
  ].join(';');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    w: number; h: number;
    color: string;
    rot: number;
    rotSpeed: number;
    opacity: number;
  }

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    w: Math.random() * 10 + 6,
    h: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    opacity: 1,
  }));

  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.rot += p.rotSpeed;
      p.opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

      ctx!.save();
      ctx!.globalAlpha = p.opacity;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
