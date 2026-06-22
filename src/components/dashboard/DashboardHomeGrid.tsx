/**
 * DashboardHomeGrid
 *
 * Ultra-minimalist focused grid — the "control centre at a glance".
 * Linear/Notion aesthetic: generous whitespace, subtle borders, clean
 * DM Sans type, no decorative gradients on the main content area.
 *
 * Sections (top → bottom):
 *  1. Welcome header
 *  2. KPI row  — 4 stat cards
 *  3. Quick actions — 4 nav buttons
 *  4. Recent activity — last 3 scheduled posts
 *  5. Copilot activation widget
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Calendar,
  Clock,
  Inbox,
  PlusCircle,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useEstablishment } from '../../context/EstablishmentContext';
import { DashboardWelcome } from './DashboardWelcome';
import { CopilotActivationWidget } from './CopilotActivationWidget';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

// ── Skeleton primitives ───────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-muted animate-pulse rounded-xl ${className}`}
      aria-hidden
    />
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  loading?: boolean;
}

function KpiCard({ label, value, icon, href, loading }: KpiCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
        <SkeletonBlock className="h-8 w-8" />
        <SkeletonBlock className="h-7 w-12" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate({ to: href as any })}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-primary/40 hover:shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </button>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  accent?: boolean;
}

function QuickAction({ icon, label, href, accent = false }: QuickActionProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: href as any })}
      className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
        accent
          ? 'bg-primary text-primary-foreground border-primary hover:brightness-95'
          : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/40'
      }`}
    >
      <span className={accent ? 'text-primary-foreground' : 'text-primary'}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// ── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isApproved =
    status === 'Approuvé' || status === 'Publié' || status === 'published';
  return (
    <span
      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${
        isApproved
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
          : 'bg-primary/10 text-primary'
      }`}
    >
      {status === 'published' ? 'Publié' : status}
    </span>
  );
}

// ── Calendar footer link (needs its own navigate hook call) ──────────────────

function CalendarFooterLink() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: '/calendar' as any })}
      className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
    >
      Voir tous les posts <ArrowRight size={12} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardHomeGrid() {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();

  // ── Scheduled posts (last 3) ──────────────────────────────────────────────
  const {
    data: recentPosts,
    isLoading: postsLoading,
  } = useQuery({
    queryKey: ['dashboard-recent-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await blink.db.scheduledPosts.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 3,
      });
      return rows ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // ── Unread messages ───────────────────────────────────────────────────────
  const {
    data: unreadCount,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['dashboard-unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const rows = await blink.db.messages.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      return (rows ?? []).filter((m: any) => !m.isRead).length;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // ── Derived stats from fetched posts ─────────────────────────────────────
  const {
    data: allPostsStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['dashboard-post-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { scheduled: 0, pending: 0 };
      const rows = await blink.db.scheduledPosts.list({
        where: { userId: user.id },
        limit: 500,
      });
      const list = rows ?? [];
      return {
        scheduled: list.filter((p: any) => p.status === 'scheduled').length,
        pending: list.filter((p: any) => p.status === 'draft').length,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const kpiLoading = statsLoading || messagesLoading;

  // ── Format a post's scheduled date ───────────────────────────────────────
  function formatScheduledAt(scheduledAt?: string | null): string {
    if (!scheduledAt) return '—';
    try {
      return new Date(scheduledAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return scheduledAt.slice(0, 10);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── 1. Welcome header ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <DashboardWelcome />
      </div>

      {/* ── 2. KPI row ────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Vue d'ensemble</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Posts planifiés"
            value={kpiLoading ? '…' : (allPostsStats?.scheduled ?? 0)}
            icon={<Calendar size={16} />}
            href="/calendar"
            loading={kpiLoading}
          />
          <KpiCard
            label="Avis en attente"
            value={kpiLoading ? '…' : (allPostsStats?.pending ?? 0)}
            icon={<Star size={16} />}
            href="/reviews"
            loading={kpiLoading}
          />
          <KpiCard
            label="Score visibilité"
            value="78"
            icon={<TrendingUp size={16} />}
            href="/performance"
          />
          <KpiCard
            label="Messages non lus"
            value={messagesLoading ? '…' : (unreadCount ?? 0)}
            icon={<Inbox size={16} />}
            href="/inbox"
            loading={messagesLoading}
          />
        </div>
      </div>

      {/* ── 3. Quick actions ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Actions rapides</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <QuickAction
            icon={<PlusCircle size={15} />}
            label="Nouveau post"
            href="/cockpit"
            accent
          />
          <QuickAction
            icon={<Star size={15} />}
            label="Gérer les avis"
            href="/reviews"
          />
          <QuickAction
            icon={<Calendar size={15} />}
            label="Voir le calendrier"
            href="/calendar"
          />
          <QuickAction
            icon={<Inbox size={15} />}
            label="Boîte de réception"
            href="/inbox"
          />
        </div>
      </div>

      {/* ── 4. Recent activity ────────────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <SectionLabel>Activité récente</SectionLabel>
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {/* Loading state */}
          {postsLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <SkeletonBlock className="h-8 w-8 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className="h-3 w-3/4" />
                    <SkeletonBlock className="h-2.5 w-1/3" />
                  </div>
                  <SkeletonBlock className="h-5 w-14 shrink-0" />
                </div>
              ))}
            </>
          )}

          {/* Empty state */}
          {!postsLoading && (!recentPosts || recentPosts.length === 0) && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Calendar size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Aucune activité récente
              </p>
              <p className="text-xs text-muted-foreground">
                Créez votre premier post pour le voir apparaître ici.
              </p>
            </div>
          )}

          {/* Post rows */}
          {!postsLoading &&
            recentPosts &&
            recentPosts.map((post: any, i: number) => (
              <div
                key={post.id ?? i}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* icon */}
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-primary" />
                </div>

                {/* text + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {post.textContent ?? post.title ?? 'Post planifié'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {formatScheduledAt(post.scheduledAt)}
                    {post.channels && (
                      <>
                        {' · '}
                        {(() => {
                          try {
                            const ch = JSON.parse(post.channels);
                            return Array.isArray(ch) ? ch[0] : post.channels;
                          } catch {
                            return post.channels;
                          }
                        })()}
                      </>
                    )}
                  </p>
                </div>

                {/* badge */}
                <StatusBadge status={post.status ?? 'draft'} />
              </div>
            ))}

          {/* Footer link */}
          {!postsLoading && recentPosts && recentPosts.length > 0 && (
            <CalendarFooterLink />
          )}
        </div>
      </div>

      {/* ── 5. Copilot activation ─────────────────────────────────────────── */}
      {user && (
        <div>
          <SectionLabel>Copilote Marketing IA</SectionLabel>
          <CopilotActivationWidget />
        </div>
      )}
    </div>
  );
}
