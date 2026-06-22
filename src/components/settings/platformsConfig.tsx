import type { Platform } from './PlatformCard';

// ── SVG brand icons ──────────────────────────────────────────────

function WordPressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 1.542c2.407 0 4.607.894 6.274 2.362l-8.748 8.748A8.452 8.452 0 013.542 12c0-4.665 3.793-8.458 8.458-8.458zm0 16.916a8.413 8.413 0 01-5.247-1.822l7.476-7.476 1.376 3.771-1.077 2.95A8.44 8.44 0 0112 20.458zm4.453-1.38l-1.228-3.363 1.938-5.31a8.39 8.39 0 011.295 4.595 8.415 8.415 0 01-2.005 4.078zM8.413 8.009l-3.82 10.455A8.454 8.454 0 013.542 12c0-1.71.51-3.303 1.384-4.635L8.413 8.009z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.79 1.54V6.93a4.85 4.85 0 01-1.02-.24z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ── Platform definitions ──────────────────────────────────────────

export const PLATFORMS: Platform[] = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Publiez des articles directement sur votre blog.',
    icon: WordPressIcon,
    iconBg: 'bg-slate-800',
    iconColor: 'text-white',
    accentColor: 'border-slate-600',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Partagez vos actualités professionnelles.',
    icon: LinkedinIcon,
    iconBg: 'bg-[#0A66C2]',
    iconColor: 'text-white',
    accentColor: 'border-blue-400',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Publiez photos et stories sur votre compte.',
    icon: InstagramIcon,
    iconBg: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]',
    iconColor: 'text-white',
    accentColor: 'border-pink-400',
  },
  {
    id: 'google',
    name: 'Google Business',
    description: 'Mettez à jour votre fiche Google My Business.',
    icon: GoogleIcon,
    iconBg: 'bg-white border border-border',
    iconColor: '',
    accentColor: 'border-yellow-400',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Publiez sur votre page Facebook professionnelle.',
    icon: FacebookIcon,
    iconBg: 'bg-[#1877F2]',
    iconColor: 'text-white',
    accentColor: 'border-blue-500',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Planifiez vos vidéos courtes pour TikTok.',
    icon: TikTokIcon,
    iconBg: 'bg-foreground',
    iconColor: 'text-background',
    accentColor: 'border-foreground/40',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    description: 'Apparaître dans les résultats vidéo Google Search.',
    helpText: 'Objectif : Quand un client cherche votre commerce sur Google, votre vidéo apparaît en premier résultat. 🎯',
    icon: YouTubeIcon,
    iconBg: 'bg-[#FF0000]',
    iconColor: 'text-white',
    accentColor: 'border-red-400',
  },
];
