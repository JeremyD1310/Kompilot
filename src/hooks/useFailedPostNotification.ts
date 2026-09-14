import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { blink } from '@/blink/client';
import { useAuth } from './useAuth';
import { isDemoRuntime } from '../lib/demoDomain';

export function useFailedPostNotification() {
  const { user } = useAuth();

  useEffect(() => {
    if (isDemoRuntime() || !user?.id) return;
    const timer = setTimeout(async () => {
      try {
        const posts = await blink.db.table('scheduled_posts').list({
          where: { userId: user.id, status: 'failed' },
          limit: 10,
        });
        const notified = JSON.parse(localStorage.getItem('notified_failed_posts') || '[]');
        for (const post of posts) {
          if (!notified.includes(post.id)) {
            toast.error(
              `Publication échouée: "${(post.textContent || '').substring(0, 60)}..."`,
              { duration: 6000, icon: '⚠️' }
            );
            notified.push(post.id);
          }
        }
        // Keep only last 50 IDs
        localStorage.setItem('notified_failed_posts', JSON.stringify(notified.slice(-50)));
      } catch { /* silently fail */ }
    }, 5000);
    return () => clearTimeout(timer);
  }, [user?.id]);
}
