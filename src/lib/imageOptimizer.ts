/**
 * imageOptimizer — Compress and convert images to WebP before upload.
 *
 * Uses the Canvas API (browser-native, zero dependencies).
 * Returns a new File object with .webp extension and significantly reduced size.
 *
 * Usage:
 *   const optimized = await optimizeImageToWebP(file, { maxWidthPx: 1200, quality: 0.82 });
 *   await blink.storage.upload(optimized, `posts/${Date.now()}.webp`);
 */

export interface OptimizeOptions {
  /** Max width in pixels — image is scaled down proportionally. Default: 1200 */
  maxWidthPx?: number;
  /** WebP quality 0–1. Default: 0.82 (good balance size/quality) */
  quality?: number;
  /** Max file size in bytes before giving up optimization. Default: 50KB */
  skipIfSmallerThan?: number;
}

export interface OptimizeResult {
  file: File;
  originalSizeKB: number;
  optimizedSizeKB: number;
  savings: string;      // e.g. "-68%"
  wasOptimized: boolean;
}

export async function optimizeImageToWebP(
  input: File,
  opts: OptimizeOptions = {}
): Promise<OptimizeResult> {
  const {
    maxWidthPx = 1200,
    quality = 0.82,
    skipIfSmallerThan = 50 * 1024,
  } = opts;

  const originalSizeKB = Math.round(input.size / 1024);

  // Skip tiny files or non-images
  if (input.size < skipIfSmallerThan || !input.type.startsWith('image/')) {
    return {
      file: input,
      originalSizeKB,
      optimizedSizeKB: originalSizeKB,
      savings: '0%',
      wasOptimized: false,
    };
  }

  try {
    const bitmap = await createImageBitmap(input);
    const { width, height } = bitmap;

    // Calculate target dimensions
    const scale = width > maxWidthPx ? maxWidthPx / width : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
    const outputName = input.name.replace(/\.[^.]+$/, '.webp');
    const outputFile = new File([blob], outputName, { type: 'image/webp' });

    const optimizedSizeKB = Math.round(outputFile.size / 1024);
    const savedPct = Math.round((1 - outputFile.size / input.size) * 100);

    return {
      file: outputFile,
      originalSizeKB,
      optimizedSizeKB,
      savings: savedPct > 0 ? `-${savedPct}%` : '+0%',
      wasOptimized: true,
    };
  } catch (err) {
    // Canvas not available (e.g. GIF, SVG) — return original
    console.warn('[imageOptimizer] Cannot optimize:', err);
    return {
      file: input,
      originalSizeKB,
      optimizedSizeKB: originalSizeKB,
      savings: '0%',
      wasOptimized: false,
    };
  }
}

/**
 * Batch optimize multiple images in parallel.
 */
export async function optimizeBatch(
  files: File[],
  opts?: OptimizeOptions
): Promise<OptimizeResult[]> {
  return Promise.all(files.map(f => optimizeImageToWebP(f, opts)));
}
