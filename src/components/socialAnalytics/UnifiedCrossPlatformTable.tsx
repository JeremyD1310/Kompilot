/**
 * UnifiedCrossPlatformTable — Vue unifiée des publications multi-plateformes
 */
import { useState, useMemo } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@blinkdotnew/ui';
import {
  Heart, MessageSquare, Share2, Layers, Filter, ArrowUpDown, TrendingUp,
} from 'lucide-react';
import type { TiktokVideoMetric } from '@/hooks/useSocialPublish';
import type { InstagramReelMetric } from '@/hooks/useSocialPublish';
import {
  PLATFORMS, buildUnifiedRows, fmt,
  type PlatformKey, type TopPost, type UnifiedSortKey,
} from './types';

export function UnifiedCrossPlatformTable({
  tiktokData,
  reelsData,
  topPostsData,
  loading,
}: {
  tiktokData?: { videos: TiktokVideoMetric[]; total: number };
  reelsData?: { reels: InstagramReelMetric[]; total: number };
  topPostsData: TopPost[];
  loading: boolean;
}) {
  const [sortBy, setSortBy] = useState<UnifiedSortKey>('views');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allRows = useMemo(() => {
    return buildUnifiedRows(tiktokData, reelsData, topPostsData);
  }, [tiktokData, reelsData, topPostsData]);

  const filteredRows = useMemo(() => {
    let rows = [...allRows];

    if (platformFilter !== 'all') {
      rows = rows.filter(r => r.platform === platformFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter(r => r.date >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter(r => r.date <= to);
    }

    if (sortBy === 'date') {
      rows.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (sortBy === 'engagement') {
      rows.sort((a, b) => b.engagementRate - a.engagementRate);
    } else {
      rows.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    }

    return rows.slice(0, 100);
  }, [allRows, platformFilter, dateFrom, dateTo, sortBy]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Vue unifiée — Toutes plateformes
            </CardTitle>
            <CardDescription>
              Performance croisée de vos publications sur {Object.keys(PLATFORMS).length} plateformes connectées
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">{allRows.length} publications</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filtres :</span>
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes plateformes</SelectItem>
              {(Object.entries(PLATFORMS) as [PlatformKey, typeof PLATFORMS[PlatformKey]][]).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Du</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">au</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground" />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as UnifiedSortKey)}>
              <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Tri : Impressions/Vues</SelectItem>
                <SelectItem value="likes">Tri : Likes</SelectItem>
                <SelectItem value="comments">Tri : Commentaires</SelectItem>
                <SelectItem value="engagement">Tri : Engagement %</SelectItem>
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
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune publication trouvée</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Connectez vos plateformes et publiez du contenu pour voir les métriques unifiées</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[140px]">Plateforme</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenu</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('views')}>Vues/Impressions {sortBy === 'views' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('likes')}><span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</span> {sortBy === 'likes' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('comments')}><span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Commentaires</span> {sortBy === 'comments' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"><span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Partages</span></th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('engagement')}><span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Eng. %</span> {sortBy === 'engagement' && '↓'}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => setSortBy('date')}>Date {sortBy === 'date' && '↓'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const cfg = PLATFORMS[row.platform];
                  return (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cfg?.color || '#6366f1'}15`, color: cfg?.color || '#6366f1' }}>
                          {cfg?.icon || '📱'} {cfg?.label || row.platform}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[280px]"><p className="text-sm text-foreground truncate">{row.title}</p></td>
                      <td className="py-2.5 px-3 text-right text-sm font-medium">{fmt(row.views)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(row.likes)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(row.comments)}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{fmt(row.shares)}</td>
                      <td className="py-2.5 px-3 text-right"><span className={`text-xs font-medium ${row.engagementRate >= 5 ? 'text-emerald-600 dark:text-emerald-400' : row.engagementRate >= 2 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'}`}>{row.engagementRate.toFixed(1)}%</span></td>
                      <td className="py-2.5 px-3 text-right text-[11px] text-muted-foreground">{row.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
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
