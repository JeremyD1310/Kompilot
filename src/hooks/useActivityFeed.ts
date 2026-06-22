/**
 * useActivityFeed — Pulls real recent activity from DB (messages + scheduled posts)
 * and blends it into a unified activity feed for the CockpitDashboard.
 */

import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  color: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const STATIC_FALLBACKS: ActivityItem[] = [
  { id: 'fb-1', icon: '🛡️', text: 'Système Anti-No Show actif', time: 'actif en continu', color: '#F87171' },
  { id: 'fb-2', icon: '⭐', text: 'Score G.E.O. en amélioration', time: 'mis à jour ce matin', color: '#8B5CF6' },
  { id: 'fb-3', icon: '🤖', text: 'Moteur IA en veille active', time: 'actif en continu', color: '#34D399' },
  { id: 'fb-4', icon: '🎟️', text: 'Coupons Flash prêts à activer', time: 'disponible', color: '#FCD34D' },
  { id: 'fb-5', icon: '💬', text: 'Aucun message en attente', time: 'synchronisé', color: '#60A5FA' },
];

export function useActivityFeed() {
  const { user } = useAuth();

  const { data: items = STATIC_FALLBACKS, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return STATIC_FALLBACKS;

      const [messages, posts] = await Promise.all([
        blink.db.messages.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 3,
        }),
        blink.db.scheduledPosts.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 3,
        }),
      ]);

      const result: ActivityItem[] = [];

      // Messages from inbox
      for (const msg of messages as Array<Record<string, string>>) {
        result.push({
          id: `msg-${msg.id}`,
          icon: '💬',
          text: `Message reçu — ${msg.senderName || msg.sender_name || 'Client'}`,
          time: timeAgo(msg.createdAt || msg.created_at || new Date().toISOString()),
          color: '#60A5FA',
        });
      }

      // Scheduled posts
      for (const post of posts as Array<Record<string, string>>) {
        let channelLabel = 'Publication';
        try {
          const channels = JSON.parse(post.channels || '[]');
          if (channels.length > 0) channelLabel = channels[0];
        } catch { /* keep default */ }

        result.push({
          id: `post-${post.id}`,
          icon: '📢',
          text: `Post planifié — ${channelLabel}`,
          time: timeAgo(post.createdAt || post.created_at || new Date().toISOString()),
          color: '#E879F9',
        });
      }

      // Fill with static fallbacks if fewer than 3 real items
      if (result.length < 3) {
        const needed = Math.min(5 - result.length, STATIC_FALLBACKS.length);
        result.push(...STATIC_FALLBACKS.slice(0, needed));
      }

      return result.slice(0, 5);
    },
    enabled: !!user?.id,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  // Scheduled posts count (for SocialFluxTracker + score cards)
  const { data: scheduledCount = 0 } = useQuery<number>({
    queryKey: ['scheduled-posts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const today = new Date().toISOString();
      const posts = await blink.db.scheduledPosts.list({
        where: { userId: user.id },
        orderBy: { scheduledAt: 'desc' },
        limit: 50,
      });
      return (posts as Array<Record<string, string>>).filter(p =>
        (p.scheduledAt || p.scheduled_at || '') >= today.slice(0, 10) ||
        (p.status || '') === 'draft'
      ).length;
    },
    enabled: !!user?.id,
    staleTime: 20_000,
  });

  // Unread messages count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const msgs = await blink.db.messages.list({
        where: { userId: user.id },
        limit: 50,
      });
      return (msgs as Array<Record<string, string | number>>).filter(
        m => !Number(m.isRead || m.is_read)
      ).length;
    },
    enabled: !!user?.id,
    staleTime: 20_000,
  });

  return { items, isLoading, scheduledCount, unreadCount };
}
