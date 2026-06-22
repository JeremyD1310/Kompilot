/**
 * KompilotLogo — Canonical brand component.
 * Exact replica of the official SVG spec (viewBox 0 0 800 200).
 *
 * variant="full"      → icon + wordmark  (default)
 * variant="icon"      → icon mark only   (square, 1:1)
 * variant="wordmark"  → text only
 *
 * Props:
 *   height     — rendered height in px (width auto-scales)
 *   textColor  — wordmark fill (default #0F172A; use "#FFFFFF" on dark bg)
 *   className  — forwarded to the <svg> element
 */

interface KompilotLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  height?: number;
  textColor?: string;
  className?: string;
}

// Original SVG viewport: 800 × 200
// Icon group: 120×120 square starting at translate(40,40)
// Chevron: M35 40 L55 60 L35 80  (inside the 120×120 group)
// Star:    M75 60 Q75 45 90 45 Q75 45 75 30 Q75 45 60 45 Q75 45 75 60 Z
// Line:    x1=50 y1=80 x2=75 y2=80
// Text:    x=190 y=122 font-size=68 font-weight=700

export function KompilotLogo({
  variant = 'full',
  height = 32,
  textColor = '#0F172A',
  className,
}: KompilotLogoProps) {

  /* ── Icon-only ──────────────────────────────────────────────────────────── */
  if (variant === 'icon') {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Kompilot"
        role="img"
      >
        <defs>
          <linearGradient id="klg-star" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4694" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {/* Navy background */}
        <rect width="120" height="120" rx="32" fill="#0F172A" />
        {/* Chevron Tech — exact original coords */}
        <path
          d="M35 40 L55 60 L35 80"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* AI star — exact original */}
        <path
          d="M75 60 Q75 45 90 45 Q75 45 75 30 Q75 45 60 45 Q75 45 75 60 Z"
          fill="url(#klg-star)"
        />
        {/* Prompt underline — exact original */}
        <line
          x1="50" y1="80"
          x2="75" y2="80"
          stroke="#7C3AED"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  /* ── Wordmark-only ──────────────────────────────────────────────────────── */
  if (variant === 'wordmark') {
    // "kompilot" at font-size 68 in a 200-tall viewport ≈ 610px wide
    const w = Math.round(height * (610 / 200));
    return (
      <svg
        width={w}
        height={height}
        viewBox="0 0 610 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Kompilot"
        role="img"
      >
        <text
          x="0"
          y="152"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          fontSize="136"
          fontWeight="700"
          fill={textColor}
        >
          kompilot
        </text>
      </svg>
    );
  }

  /* ── Full logo (icon + wordmark) — 800×200 viewport ────────────────────── */
  const w = Math.round(height * (800 / 200));
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kompilot"
      role="img"
    >
      <defs>
        <linearGradient id="klg-star-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4694" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Icon group at translate(40,40) — exact original */}
      <g transform="translate(40, 40)">
        <rect width="120" height="120" rx="32" fill="#0F172A" />
        <path
          d="M35 40 L55 60 L35 80"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M75 60 Q75 45 90 45 Q75 45 75 30 Q75 45 60 45 Q75 45 75 60 Z"
          fill="url(#klg-star-full)"
        />
        <line
          x1="50" y1="80"
          x2="75" y2="80"
          stroke="#7C3AED"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>

      {/* Wordmark — exact original */}
      <text
        x="190"
        y="122"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="68"
        fontWeight="700"
        fill={textColor}
      >
        kompilot
      </text>
    </svg>
  );
}

/** Full logo with white wordmark — for dark backgrounds */
export function KompilotLogoWhite(props: Omit<KompilotLogoProps, 'textColor'>) {
  return <KompilotLogo {...props} textColor="#FFFFFF" />;
}
