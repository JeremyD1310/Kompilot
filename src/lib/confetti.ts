// Lightweight confetti burst — no external dependency

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  color: string;
  angle: number;
  angularV: number;
  opacity: number;
}

const COLORS = [
  '#0D9488', '#7C3AED', '#F59E0B', '#EF4444',
  '#10B981', '#3B82F6', '#EC4899', '#F97316', '#84CC16',
];

export function launchConfetti(count = 160) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 3,
    w: Math.random() * 12 + 6,
    h: Math.random() * 5 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    angularV: (Math.random() - 0.5) * 0.22,
    opacity: 1,
  }));

  let frame = 0;

  function draw() {
    if (frame > 230) { canvas.remove(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += 0.14;
      p.x += p.vx + Math.sin(frame * 0.04 + p.y * 0.008) * 0.4;
      p.y += p.vy;
      p.angle += p.angularV;
      if (frame > 150) p.opacity = Math.max(0, p.opacity - 0.018);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
