import type { Channel } from './inboxData';
import { Mail } from 'lucide-react';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="14" height="14">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const CONFIG: Record<Channel, { icon: React.ComponentType<{ className?: string }>, bg: string, text: string, label: string }> = {
  website:   { icon: Mail,          bg: 'bg-primary/10',   text: 'text-primary',    label: 'Formulaire web' },
  linkedin:  { icon: LinkedinIcon,  bg: 'bg-blue-100',     text: 'text-blue-600',   label: 'LinkedIn'       },
  instagram: { icon: InstagramIcon, bg: 'bg-pink-100',     text: 'text-pink-500',   label: 'Instagram'      },
  facebook:  { icon: FacebookIcon,  bg: 'bg-indigo-100',   text: 'text-indigo-600', label: 'Facebook'       },
  google:    { icon: GoogleIcon,    bg: 'bg-orange-50',    text: 'text-orange-500', label: 'Google'         },
};

export function ChannelIcon({ channel, size = 'sm' }: { channel: Channel; size?: 'sm' | 'md' }) {
  const { icon: Icon, bg, text } = CONFIG[channel];
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  return (
    <span className={`inline-flex items-center justify-center rounded-full shrink-0 ${dim} ${bg} ${text}`}>
      <Icon />
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const { bg, text, label } = CONFIG[channel];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}
