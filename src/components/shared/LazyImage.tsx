/**
 * LazyImage — lazy-loaded image with IntersectionObserver.
 * Only starts loading when the image enters the viewport.
 * Shows a subtle skeleton placeholder until loaded.
 *
 * Usage:
 *   <LazyImage src="https://…/photo.jpg" alt="Description" className="w-full h-48 object-cover" />
 */
import { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  rootMargin?: string;   // IntersectionObserver rootMargin, default "200px"
  /** Called when the image actually loads */
  onLoaded?: () => void;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  rootMargin = '200px',
  onLoaded,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {/* Skeleton */}
      {!loaded && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse rounded-inherit',
            placeholderClassName
          )}
        />
      )}
      {/* Actual image — only rendered after entering viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => { setLoaded(true); onLoaded?.(); }}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
