/**
 * InstagramReelsMetricsTable — Performance Instagram Reels par post
 */
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Badge,
} from '@blinkdotnew/ui';
import { useInstagramReelsMetrics } from '@/hooks/useSocialPublish';
import { fmt } from './types';

export function InstagramReelsMetricsTable() {
  const { data, isLoading } = useInstagramReelsMetrics();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">📸 Performance Instagram Reels — par post</CardTitle>
            <CardDescription>Vues, likes et commentaires de chaque Reel publié</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">{data?.total || 0} Reels</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : !data?.reels?.length ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucun Reel Instagram trouvé</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Connectez Instagram et publiez des Reels pour voir les métriques</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Légende</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vues</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Likes</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Commentaires</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.reels.map((reel) => (
                  <tr key={reel.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 max-w-[260px]"><p className="text-sm text-foreground truncate">{reel.caption || 'Sans légende'}</p></td>
                    <td className="py-2.5 px-3 text-right text-sm font-medium">{fmt(reel.views)}</td>
                    <td className="py-2.5 px-3 text-right text-sm">{fmt(reel.likes)}</td>
                    <td className="py-2.5 px-3 text-right text-sm">{fmt(reel.comments)}</td>
                    <td className="py-2.5 px-3 text-right text-[11px] text-muted-foreground">{new Date(reel.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
