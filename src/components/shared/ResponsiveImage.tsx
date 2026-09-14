import type { ImgHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ImageLoading = 'lazy' | 'eager';
type FetchPriority = 'high' | 'low' | 'auto';

const DEFAULT_WIDTHS = [320, 640, 960, 1280];

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding' | 'fetchPriority' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  loading?: ImageLoading;
  fetchPriority?: FetchPriority;
  className?: string;
}

function isUnsplashUrl(src: string) {
  try {
    return new URL(src).hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
}

function unsplashUrl(src: string, width: number, format: 'avif' | 'webp') {
  const url = new URL(src);
  url.searchParams.set('fm', format);
  url.searchParams.set('w', String(width));
  if (!url.searchParams.has('q')) url.searchParams.set('q', '78');
  return url.toString();
}

/**
 * Stable image primitive: reserves layout space and serves WebP/AVIF variants
 * for Unsplash assets while preserving a safe fallback for user-provided URLs.
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  loading = 'lazy',
  fetchPriority = 'auto',
  className,
  ...rest
}: ResponsiveImageProps) {
  const optimized = isUnsplashUrl(src);
  const widths = Array.from(new Set([
    ...DEFAULT_WIDTHS.filter(candidate => candidate < width),
    Math.max(1, width),
    Math.max(1, Math.round(width * 1.5)),
  ])).sort((a, b) => a - b);
  const avifSrcSet = optimized ? widths.map(w => `${unsplashUrl(src, w, 'avif')} ${w}w`).join(', ') : undefined;
  const webpSrcSet = optimized ? widths.map(w => `${unsplashUrl(src, w, 'webp')} ${w}w`).join(', ') : undefined;
  const fallbackSrc = optimized ? unsplashUrl(src, width, 'webp') : src;

  return (
    <picture>
      {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
      {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
      <img
        {...rest}
        src={fallbackSrc}
        srcSet={webpSrcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn('block', className)}
      />
    </picture>
  );
}
