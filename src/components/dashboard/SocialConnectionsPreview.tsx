/**
 * SocialConnectionsPreview — Compact widget showing connection status
 * for native social channels in a responsive grid.
 * Displayed in the dashboard sidebar column.
 */

import { Link } from '@tanstack/react-router';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LinkedinIcon } from '../icons/SocialIcons';
import {
  useFacebookStatus,
  useInstagramStatus,
  useTiktokStatus,
  useGbpStatus,
  useYouTubeStatus,
  useLinkedInStatus,
} from '../../hooks/useSocialPublish';

// ── Inline Platform Icons (same SVGs as SocialChannelsPanel) ───────────────

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="url(#igPreview)">
      <defs>
        <linearGradient id="igPreview" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  );
}

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#000">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.8a4.85 4.85 0 01-1.07-.11z" />
    </svg>
  );
}

function YouTubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ── Platform config ────────────────────────────────────────────────────────

const platforms = [
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'gbp', label: 'Google', Icon: GoogleIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedinIcon },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export function SocialConnectionsPreview() {
  const facebook = useFacebookStatus();
  const instagram = useInstagramStatus();
  const tiktok = useTiktokStatus();
  const gbp = useGbpStatus();
  const youtube = useYouTubeStatus();
  const linkedin = useLinkedInStatus();

  const statusMap: Record<string, { connected: boolean; loading: boolean }> = {
    facebook: { connected: !!facebook.data?.connected, loading: facebook.isLoading },
    instagram: { connected: !!instagram.data?.connected, loading: instagram.isLoading },
    tiktok: { connected: !!tiktok.data?.connected, loading: tiktok.isLoading },
    gbp: { connected: !!gbp.data?.connected, loading: gbp.isLoading },
    youtube: { connected: !!youtube.data?.connected, loading: youtube.isLoading },
    linkedin: { connected: !!linkedin.data?.connected, loading: linkedin.isLoading },
  };

  const connectedCount = Object.values(statusMap).filter((s) => s.connected).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Réseaux sociaux</span>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
            {connectedCount}/{platforms.length}
          </span>
        </div>
        <Link to="/settings" aria-label="Gérer plusieurs comptes sociaux">
          <span className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
            Gérer les comptes <ArrowRight size={11} />
          </span>
        </Link>
      </div>

      {/* Native channels grid */}
      <div className="grid grid-cols-2 gap-2">
        {platforms.map(({ key, label, Icon }) => {
          const status = statusMap[key];
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0">
                <Icon size={14} />
              </div>
              <span className="text-[11px] font-medium text-foreground/80 truncate flex-1">
                {label}
              </span>
              {/* Status dot */}
              {status.loading ? (
                <Loader2 size={10} className="text-muted-foreground/40 animate-spin shrink-0" />
              ) : (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${status.connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-muted-foreground/20'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
