/**
 * PostPerformanceTable — Per-post performance breakdown with sorting.
 */
import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Heart, MousePointerClick, Share2, Bookmark } from 'lucide-react';
import { type PostPerformanceMetrics, CHANNEL_META, formatNumber } from './PostPerformanceData';

type SortKey = 'reach' | 'engagement' | 'clicks' | 'engagementRate' | 'ctr';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={12} style={{ opacity: .4 }} />;
  return dir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
}

function ChannelDot({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: meta?.bg ?? 'hsl(var(--muted))',
      color: meta?.color ?? 'hsl(var(--foreground))',
      border: `1px solid ${meta?.color ?? 'hsl(var(--border))'}30`,
      borderRadius: 20, padding: '2px 9px', fontSize: '.68rem', fontWeight: 700,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta?.color ?? '#888', flexShrink: 0 }} />
      {meta?.label ?? channel}
    </span>
  );
}

function MetricCell({ value, icon, color }: { value: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color, opacity: .7 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '.83rem', color: 'hsl(var(--foreground))' }}>{value}</span>
    </div>
  );
}

interface Props {
  posts: PostPerformanceMetrics[];
}

export function PostPerformanceTable({ posts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const published = posts.filter(p => p.status === 'published');

  const sorted = [...published].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'desc' ? -diff : diff;
  });

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  function setDir(fn: (d: SortDir) => SortDir) {
    setSortDir(fn(sortDir));
  }

  const COLS: { key: SortKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'reach',          label: 'Portée',       icon: <Eye size={13} />,             color: '#6359F8' },
    { key: 'engagement',     label: 'Engagement',   icon: <Heart size={13} />,            color: '#E1306C' },
    { key: 'clicks',         label: 'Clics',        icon: <MousePointerClick size={13} />, color: '#0EA5E9' },
    { key: 'engagementRate', label: 'Tx eng.',      icon: <Share2 size={13} />,           color: '#F59E0B' },
    { key: 'ctr',            label: 'CTR',          icon: <Bookmark size={13} />,         color: '#16A34A' },
  ];

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid hsl(var(--border))' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: '.7rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em', minWidth: 200 }}>
                Publication
              </th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: '.7rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                Canal
              </th>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
                    textAlign: 'right', whiteSpace: 'nowrap',
                    fontWeight: 700, fontSize: '.7rem',
                    color: sortKey === col.key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    textTransform: 'uppercase', letterSpacing: '.04em',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <span style={{ color: col.color }}>{col.icon}</span>
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((post, i) => {
              const dateStr = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              return (
                <tr
                  key={post.id}
                  style={{
                    borderBottom: '1px solid hsl(var(--border))',
                    background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted)/.3)',
                    transition: 'background .15s',
                  }}
                  className="hover:bg-muted/50"
                >
                  {/* Title */}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '.82rem', color: 'hsl(var(--foreground))', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                          {post.title}
                        </p>
                        <p style={{ fontSize: '.68rem', color: 'hsl(var(--muted-foreground))' }}>
                          Publié le {dateStr}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Channel */}
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <ChannelDot channel={post.channel} />
                  </td>
                  {/* Metrics */}
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <MetricCell value={formatNumber(post.reach)} icon={<Eye size={12} />} color="#6359F8" />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <MetricCell value={formatNumber(post.engagement)} icon={<Heart size={12} />} color="#E1306C" />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <MetricCell value={formatNumber(post.clicks)} icon={<MousePointerClick size={12} />} color="#0EA5E9" />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 800, fontSize: '.8rem',
                      color: post.engagementRate >= 5 ? '#16A34A' : post.engagementRate >= 2 ? '#D97706' : '#DC2626',
                    }}>
                      {post.engagementRate}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '.8rem', color: 'hsl(var(--foreground))' }}>
                      {post.ctr}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '.85rem' }}>
                  Aucun post publié à afficher
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 4px', borderTop: '1px solid hsl(var(--border))' }}>
          <span style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))' }}>
            Page {page + 1} / {totalPages} · {sorted.length} posts publiés
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--muted))', fontSize: '.78rem', fontWeight: 600,
                cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1,
                color: 'hsl(var(--foreground))',
              }}
            >Précédent</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: '#6359F8', color: '#fff', fontSize: '.78rem', fontWeight: 600,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}
