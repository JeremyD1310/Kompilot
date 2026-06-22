/**
 * Brand Image Processor — applies automatic brand banner to images using Canvas API.
 * No external dependencies. Runs 100% client-side.
 */

export interface BrandSettings {
  enabled: boolean;
  primaryColor: string;    // hex "#0D0D0D"
  secondaryColor: string;  // hex "#C9A84C"
  businessName: string;
  instagramHandle: string; // "@moncommerce"
  phone: string;
  showGoogleBadge: boolean;
  showCarouselStripe: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Blob & data URLs are same-origin; remote URLs need CORS
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Core processor ─────────────────────────────────────────────────────────────

/**
 * Composites a brand banner onto the image using Canvas API.
 * Returns a JPEG data URL. Falls back to original on error.
 */
export async function applyBrandBanner(
  imageUrl: string,
  settings: BrandSettings
): Promise<string> {
  if (!settings.enabled) return imageUrl;

  try {
    const img = await loadImage(imageUrl);
    const W = img.naturalWidth || 1080;
    const H = img.naturalHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Scale helper relative to 1080px standard
    const px = (n: number) => Math.round(n * (W / 1080));

    // 1) Source image
    ctx.drawImage(img, 0, 0, W, H);

    // 2) Carousel stripe — top + bottom brand gradient stripe
    if (settings.showCarouselStripe) {
      const sh = px(7);
      const stripeGrad = ctx.createLinearGradient(0, 0, W, 0);
      stripeGrad.addColorStop(0, settings.primaryColor);
      stripeGrad.addColorStop(1, settings.secondaryColor);
      ctx.fillStyle = stripeGrad;
      ctx.fillRect(0, 0, W, sh);
      ctx.fillRect(0, H - sh, W, sh);
    }

    // 3) Bottom gradient overlay
    const bannerH = px(230);
    const fadeY = H - bannerH - px(50);
    const bannerGrad = ctx.createLinearGradient(0, fadeY, 0, H);
    bannerGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bannerGrad.addColorStop(0.38, hexToRgba(settings.primaryColor, 0.74));
    bannerGrad.addColorStop(1, hexToRgba(settings.primaryColor, 0.97));
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, fadeY, W, H - fadeY);

    // 4) Business name (secondary/accent color, bold)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = px(8);
    const nameSize = px(38);
    ctx.font = `800 ${nameSize}px -apple-system,'Helvetica Neue',Arial,sans-serif`;
    ctx.fillStyle = settings.secondaryColor || '#FFFFFF';
    ctx.textBaseline = 'alphabetic';
    // Clip to left area, leaving room for Google badge
    ctx.rect(px(24), 0, W - px(200), H);
    ctx.clip();
    ctx.fillText(settings.businessName, px(24), H - px(78));
    ctx.restore();

    // 5) Sub-line — Instagram + Phone
    const subParts: string[] = [];
    if (settings.instagramHandle) subParts.push(`📸 ${settings.instagramHandle}`);
    if (settings.phone) subParts.push(`📞 ${settings.phone}`);
    if (subParts.length > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = px(6);
      const subSize = px(22);
      ctx.font = `500 ${subSize}px -apple-system,'Helvetica Neue',Arial,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(subParts.join('   ·   '), px(24), H - px(38));
      ctx.restore();
    }

    // 6) Google reviews badge (frosted pill, bottom-right)
    if (settings.showGoogleBadge) {
      const badgeText = '⭐ Avis Google';
      const bs = px(20);
      ctx.font = `bold ${bs}px -apple-system,'Helvetica Neue',Arial,sans-serif`;
      const tW = ctx.measureText(badgeText).width;
      const padX = px(14); const padY = px(9);
      const bW = tW + padX * 2; const bH = bs + padY * 2;
      const bX = W - bW - px(20); const bY = H - bH - px(20);

      ctx.fillStyle = 'rgba(255,255,255,0.17)';
      roundRectPath(ctx, bX, bY, bW, bH, px(10));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.38)';
      ctx.lineWidth = px(1.5);
      roundRectPath(ctx, bX, bY, bW, bH, px(10));
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bX + padX, bY + bH / 2);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (err) {
    console.warn('[BrandProcessor] Fallback to original:', err);
    return imageUrl;
  }
}
