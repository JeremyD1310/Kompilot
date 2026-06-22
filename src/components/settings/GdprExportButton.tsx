import { useState } from 'react';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

interface GdprExportButtonProps {
  userId: string;
  userEmail: string;
}

export function GdprExportButton({ userId, userEmail }: GdprExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch all user data in parallel
      const [establishments, posts, messages, scheduledPosts] = await Promise.allSettled([
        blink.db.establishments.list({ where: { userId } }),
        blink.db.posts.list({ where: { userId } }),
        blink.db.messages.list({ where: { userId } }),
        blink.db.scheduledPosts.list({ where: { userId } }),
      ]);

      const exportData = {
        export_info: {
          generated_at: new Date().toISOString(),
          gdpr_article: 'Article 20 RGPD — Droit à la portabilité des données',
          format: 'JSON',
          user_email: userEmail,
          user_id: userId,
        },
        profile: {
          id: userId,
          email: userEmail,
        },
        establishments: establishments.status === 'fulfilled' ? establishments.value : [],
        posts: posts.status === 'fulfilled' ? posts.value : [],
        inbox_messages: messages.status === 'fulfilled' ? messages.value : [],
        scheduled_posts: scheduledPosts.status === 'fulfilled' ? scheduledPosts.value : [],
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kompilot-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (_err) {
      // Silent — user will see no state change, can retry
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/40 px-4 py-3">
        <CheckCircle size={16} className="text-green-600 shrink-0" />
        <p className="text-xs font-semibold text-green-800 dark:text-green-300">
          Export téléchargé avec succès. Vérifiez votre dossier Téléchargements.
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading || !userId}
      variant="outline"
      className="gap-2 h-9"
      size="sm"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {loading ? 'Préparation de l\'export...' : 'Exporter mes données (JSON)'}
    </Button>
  );
}
