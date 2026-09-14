/**
 * AdminActivityPage — Activity logs + Email notification audit trail.
 *
 * Access: /admin/activity (admin-only via AdminGuard)
 *
 * Features:
 *   - Real-time activity log with filters (category, severity, user)
 *   - Email notification log with delivery status
 *   - Activity statistics dashboard
 *   - Export to CSV
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Mail, Filter, RefreshCw, Download, Search,
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  User, FileText, CreditCard, Settings, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Page, PageBody, Button, Badge, Skeleton } from '@blinkdotnew/ui';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string;
  user_id: string;
  email: string;
  action_type: string;
  action_category: string;
  resource_type: string;
  resource_id: string;
  description: string;
  metadata: string;
  ip_address: string;
  user_agent: string;
  severity: string;
  created_at: string;
}

interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  notification_type: string;
  subject: string;
  status: string;
  message_id: string;
  error_message: string;
  created_at: string;
}

interface ActivityStats {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byAction: Record<string, number>;
  byDay: Record<string, number>;
}

// ── Severity / Category helpers ───────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  critical: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const CATEGORY_ICONS: Record<string, typeof Activity> = {
  auth: Shield,
  content: FileText,
  billing: CreditCard,
  admin: User,
  settings: Settings,
  security: AlertTriangle,
  api: Activity,
  general: Activity,
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  content: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  billing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  settings: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  api: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const [tab, setTab] = useState<'logs' | 'emails' | 'stats'>('logs');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await blink.auth.getValidToken();
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (severityFilter) params.set('severity', severityFilter);
      params.set('limit', '200');

      const res = await fetch(`${BACKEND_URL}/api/activity/logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, severityFilter]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/activity/emails?limit=200`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/activity/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
    else if (tab === 'emails') fetchEmails();
    else if (tab === 'stats') fetchStats();
  }, [tab, fetchLogs, fetchEmails, fetchStats]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.email?.toLowerCase().includes(q) ||
      log.action_type?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_id?.toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const rows = tab === 'logs' ? filteredLogs : emails;
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${String((row as any)[h] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kompilot-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-3.5 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Activity size={16} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Journal d'activité</h1>
            <p className="text-[11px] text-muted-foreground">Audit trail complet · Emails · Statistiques</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
            <Download size={13} /> Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => tab === 'logs' ? fetchLogs() : tab === 'emails' ? fetchEmails() : fetchStats()} className="gap-1.5">
            <RefreshCw size={13} /> Actualiser
          </Button>
        </div>
      </div>

      <PageBody className="px-5 md:px-7 pt-4 pb-12">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-muted/50 rounded-xl p-1 w-fit">
          {[
            { key: 'logs' as const, label: 'Activités', icon: Activity },
            { key: 'emails' as const, label: 'Emails', icon: Mail },
            { key: 'stats' as const, label: 'Statistiques', icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50">
            <XCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ── Activity Logs Tab ──────────────────────────────────────────────── */}
        {tab === 'logs' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher (email, action, description)…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:border-primary/40 focus:outline-none"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">Toutes catégories</option>
                {['auth', 'content', 'billing', 'admin', 'settings', 'security', 'api', 'general'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">Toutes sévérités</option>
                {['info', 'warning', 'error', 'critical'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Activity size={20} className="text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground text-center">Aucune activité trouvée.<br/>Les actions des utilisateurs seront enregistrées ici.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredLogs.map((log) => {
                  const CategoryIcon = CATEGORY_ICONS[log.action_category] || Activity;
                  const isExpanded = expandedLog === log.id;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${CATEGORY_COLORS[log.action_category] || CATEGORY_COLORS.general}`}>
                          <CategoryIcon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">{log.action_type}</span>
                            <Badge className={`text-[9px] px-1.5 py-0 ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info}`}>{log.severity}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{log.email || log.user_id} · {log.description || '—'}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(log.created_at)}</span>
                        {isExpanded ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 border-t border-border/50 bg-muted/20">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                            <div><span className="text-muted-foreground">Utilisateur:</span> <span className="text-foreground font-medium">{log.email || '—'}</span></div>
                            <div><span className="text-muted-foreground">User ID:</span> <span className="text-foreground font-mono">{log.user_id?.slice(0, 16)}…</span></div>
                            <div><span className="text-muted-foreground">IP:</span> <span className="text-foreground font-mono">{log.ip_address || '—'}</span></div>
                            <div><span className="text-muted-foreground">Ressource:</span> <span className="text-foreground">{log.resource_type ? `${log.resource_type}/${log.resource_id}` : '—'}</span></div>
                          </div>
                          {log.metadata && log.metadata !== '{}' && (
                            <pre className="mt-2 text-[9px] text-muted-foreground bg-background/50 rounded-lg p-2 overflow-x-auto max-h-24">
                              {(() => { try { return JSON.stringify(JSON.parse(log.metadata), null, 2); } catch { return log.metadata; } })()}
                            </pre>
                          )}
                          <p className="mt-1 text-[9px] text-muted-foreground/50">User-Agent: {log.user_agent?.slice(0, 80) || '—'}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Email Logs Tab ─────────────────────────────────────────────────── */}
        {tab === 'emails' && (
          <>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Mail size={20} className="text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground text-center">Aucun email envoyé.<br/>Les notifications par email seront enregistrées ici.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {emails.map((email) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      email.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {email.status === 'sent' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{email.subject}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${
                          email.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{email.status}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        → {email.recipient_email} · {email.notification_type}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(email.created_at)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Stats Tab ──────────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total événements</p>
                    <p className="text-2xl font-black text-foreground">{stats.total.toLocaleString()}</p>
                  </div>
                  {['auth', 'content', 'billing', 'security'].map((cat) => (
                    <div key={cat} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
                      <p className="text-2xl font-black text-foreground">{(stats.byCategory[cat] || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* By severity */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">Par sévérité</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.bySeverity).sort((a, b) => b[1] - a[1]).map(([severity, count]) => (
                      <div key={severity} className="flex items-center gap-3">
                        <Badge className={`text-[10px] px-2 py-0.5 w-16 justify-center ${SEVERITY_COLORS[severity] || ''}`}>{severity}</Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (count / stats.total) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-foreground w-12 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top actions */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">Actions les plus fréquentes</h3>
                  <div className="space-y-1.5">
                    {Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([action, count]) => (
                      <div key={action} className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-muted-foreground flex-1 truncate">{action}</span>
                        <span className="font-bold text-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily activity */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">Activité par jour</h3>
                  <div className="flex items-end gap-1 h-32">
                    {Object.entries(stats.byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([day, count]) => {
                      const maxCount = Math.max(...Object.values(stats.byDay));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] text-muted-foreground">{count}</span>
                          <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%` }}>
                            <div className="w-full h-full bg-primary rounded-t" />
                          </div>
                          <span className="text-[7px] text-muted-foreground truncate w-full text-center">{day.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </PageBody>
    </Page>
  );
}
