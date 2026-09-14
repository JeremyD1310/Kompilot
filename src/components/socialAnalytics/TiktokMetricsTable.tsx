/**
 * TiktokMetricsTable — Performance TikTok par post avec filtres
 */
import { useState, useMemo } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@blinkdotnew/ui';
import { Heart, MessageSquare, Share2, Filter, ArrowUpDown } from 'lucide-react';
import type { TiktokVideoMetric } from '@/hooks/useSocialPublish';
import { fmt, type SortKey, type PostTypeFilter } from './types';

export function TiktokMetricsTable({ data, loading }: { data?: { videos: TiktokVideoMetric[]; total: number }; loading: boolean }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('views');
  const [postType, setPostType] = useState<PostTypeFilter>('all');

  const filteredVideos = useMemo(() => {
    if (!data?.videos) return [];
    let videos = [...data.videos];

    if (dateFrom) {
      const from = new Date(dateFrom).getTime() / 1000;
      videos = videos.filter(v => v.createTime >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() / 1000 + 86400;
      videos = videos.filter(v => v.createTime <= to);
    }

    if (postType === 'viral') {
      videos = videos.filter(v => v.views >= 10000);
    } else if (postType === 'high_engagement') {
      const engagement = (v: TiktokVideoMetric) => v.views > 0 ? ((v.likes + v.comments + v.shares) / v.views) * 100 : 0;
      videos = videos.filter(v => engagement(v) >= 5);
    } else if (postType === 'recent') {
      const sevenDaysAgo = Date.now() / 1000 - 7 * 86400;
      videos = videos.filter(v => v.createTime >= sevenDaysAgo);
    }

    if (sortBy === 'date') {
      videos.sort((a, b) => b.createTime - a.createTime);
    } else {
      videos.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    }

    return videos.slice(0, 50);
  }, [data, dateFrom, dateTo, sortBy, postType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">🎵 Performance TikTok — par post</CardTitle>
            <CardDescription>Métriques détaillées : vues, likes, commentaires, partages</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">{data?.total || 0} vidéos</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filtres :</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Du</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">au</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground" />
          </div>
          <Select value={postType} onValueChange={(v) => setPostType(v as PostTypeFilter)}>
            <SelectTrigger className="w-[160px] h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les vidéos</SelectItem>
              <SelectItem value="viral">Virales (≥10K vues)</SelectItem>
              <SelectItem value="high_engagement">Engagement élevé (≥5%)</SelectItem>
              <SelectItem value="recent">Récentes (7 jours)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Tri : Vues</SelectItem>
                <SelectItem value="likes">Tri : Likes</SelectItem>
                <SelectItem value="comments">Tri : Commentaires</SelectItem>
                <SelectItem value="shares">Tri : Partages</SelectItem>
                <SelectItem value="date">Tri : Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucune vidéo TikTok trouvée</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {data?.total ? 'Essayez de modifier les filtres' : 'Connectez TikTok et publiez des vidéos'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Titre</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('views')}>Vues {sortBy === 'views' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('likes')}><span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</span> {sortBy === 'likes' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('comments')}><span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Commentaires</span> {sortBy === 'comments' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('shares')}><span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Partages</span> {sortBy === 'shares' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('date')}>Date {sortBy === 'date' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((video) => {
                  const engRate = video.views > 0 ? ((video.likes + video.comments + video.shares) / video.views) * 100 : 0;
                  return (
                    <tr key={video.videoId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 max-w-[260px]"><p className="text-sm text-foreground truncate">{video.title}</p></td>
                      <td className="py-2.5 px-3 text-right text-sm font-medium">{fmt(video.views)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(video.likes)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(video.comments)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(video.shares)}</td>
                      <td className="py-2.5 px-3 text-right text-[11px] text-muted-foreground">{new Date(video.createTime * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-2.5 px-3 text-right"><span className={`text-xs font-medium ${engRate >= 5 ? 'text-emerald-600 dark:text-emerald-400' : engRate >= 2 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'}`}>{engRate.toFixed(1)}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
