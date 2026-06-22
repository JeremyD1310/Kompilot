/**
 * GhostEmailsPanel — Captured competitor emails + open/click/bounce analytics.
 * Shown inside Node 5 (email_sequence) of the funnel sidebar.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@blinkdotnew/ui';
import {
  Copy, Check, Mail, ChevronDown, ChevronUp,
  MousePointerClick, Eye, AlertCircle, BarChart3,
  RefreshCw, Plus,
} from 'lucide-react';
import { apiFetch } from '../../config/api';
import { blink } from '../../blink/client';

interface GhostEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
}

interface EmailAnalytics {
  totals: { opens: number; clicks: number; bounces: number };
  byEmail: Record<string, { opens: number; clicks: number; bounces: number; lastEvent: string }>;
}

interface GhostEmailsPanelProps {
  funnelId: string;
  userId: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: number; label: string; color: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg px-2 py-1.5', color)}>
      <Icon size={10} />
      <span className="text-[11px] font-bold">{value}</span>
      <span className="text-[10px] opacity-75">{label}</span>
    </div>
  );
}

function EmailCard({
  email,
  stats,
  onTrack,
}: {
  email: GhostEmail;
  stats?: { opens: number; clicks: number; bounces: number };
  onTrack: (emailId: string, type: 'open' | 'click' | 'bounce') => void;
}) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);
  const date = new Date(email.receivedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const handleTrack = async (type: 'open' | 'click' | 'bounce') => {
    setTracking(type);
    await onTrack(email.id, type);
    setTimeout(() => setTracking(null), 1000);
  };

  return (
    <motion.div layout className="rounded-lg border border-border bg-background overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <Mail size={11} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate">{email.subject}</p>
          <p className="text-[10px] text-muted-foreground truncate">{email.senderName} · {email.senderEmail}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mini analytics badges */}
          {stats && (stats.opens > 0 || stats.clicks > 0 || stats.bounces > 0) && (
            <div className="flex items-center gap-1">
              {stats.opens > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-1 py-0.5 rounded-full">
                  <Eye size={7} />{stats.opens}
                </span>
              )}
              {stats.clicks > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-1 py-0.5 rounded-full">
                  <MousePointerClick size={7} />{stats.clicks}
                </span>
              )}
              {stats.bounces > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1 py-0.5 rounded-full">
                  <AlertCircle size={7} />{stats.bounces}
                </span>
              )}
            </div>
          )}
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{date}</span>
          {open ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-border space-y-2.5">
              <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{email.body}</p>

              {/* Manual tracking buttons */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">Marquer :</p>
                {(['open', 'click', 'bounce'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleTrack(type)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold transition-all border',
                      tracking === type
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200'
                        : type === 'open' ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-600 hover:bg-blue-100'
                        : type === 'click' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 text-green-600 hover:bg-green-100'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100'
                    )}
                  >
                    {tracking === type ? <Check size={8} /> :
                      type === 'open' ? <Eye size={8} /> :
                      type === 'click' ? <MousePointerClick size={8} /> :
                      <AlertCircle size={8} />}
                    {tracking === type ? 'Enregistré !' : type === 'open' ? 'Ouvert' : type === 'click' ? 'Cliqué' : 'Rebond'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="rounded-lg border border-border p-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function GhostEmailsPanel({ funnelId, userId }: GhostEmailsPanelProps) {
  const [emails, setEmails] = useState<GhostEmail[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deterministic tracking address from first 8 chars of funnelId
  const trackingEmail = `track-${funnelId.slice(0, 8)}@spy.kompilot.com`;

  // ── Fetch emails ────────────────────────────────────────────────────────────
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;
      const data = await apiFetch<{ trackingEmail: string; emails: GhostEmail[] }>(
        `/api/funnels/${funnelId}/ghost-emails`,
        { token },
      );
      setEmails(data.emails ?? []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [funnelId]);

  // ── Fetch analytics ─────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;
      const data = await apiFetch<EmailAnalytics>(
        `/api/funnels/${funnelId}/ghost-emails/analytics`,
        { token },
      );
      setAnalytics(data);
    } catch {
      // noop
    } finally {
      setLoadingAnalytics(false);
    }
  }, [funnelId]);

  useEffect(() => {
    fetchEmails();
    fetchAnalytics();
  }, [fetchEmails, fetchAnalytics]);

  // ── Track event ─────────────────────────────────────────────────────────────
  const handleTrack = useCallback(async (emailId: string, type: 'open' | 'click' | 'bounce') => {
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;
      await apiFetch(
        `/api/funnels/${funnelId}/ghost-emails/${emailId}/track`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ eventType: type }),
        },
      );
      // Optimistic update
      setAnalytics(prev => {
        if (!prev) return prev;
        const byEmail = { ...prev.byEmail };
        if (!byEmail[emailId]) byEmail[emailId] = { opens: 0, clicks: 0, bounces: 0, lastEvent: new Date().toISOString() };
        const entry = { ...byEmail[emailId] };
        if (type === 'open') entry.opens++;
        else if (type === 'click') entry.clicks++;
        else entry.bounces++;
        byEmail[emailId] = entry;

        const totals = Object.values(byEmail).reduce(
          (acc, s) => ({ opens: acc.opens + s.opens, clicks: acc.clicks + s.clicks, bounces: acc.bounces + s.bounces }),
          { opens: 0, clicks: 0, bounces: 0 }
        );

        return { totals, byEmail };
      });
    } catch {
      // noop
    }
  }, [funnelId]);

  function copyAddress() {
    navigator.clipboard.writeText(trackingEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const totals = analytics?.totals ?? { opens: 0, clicks: 0, bounces: 0 };
  const openRate = emails.length > 0 ? Math.round((totals.opens / Math.max(emails.length, 1)) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider flex-1">📬 Ghost Opt-in Emails</p>
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white">BETA</span>
        <button
          onClick={() => { fetchEmails(); fetchAnalytics(); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={10} className={loadingAnalytics ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tracking email row */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-2.5 py-2">
        <span className="flex-1 text-[10px] font-mono text-foreground truncate">{trackingEmail}</span>
        <button
          onClick={copyAddress}
          className={cn(
            'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all',
            copied
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50'
          )}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      {/* Analytics summary strip */}
      {(analytics && (totals.opens + totals.clicks + totals.bounces > 0)) && (
        <div className="rounded-lg bg-muted/40 border border-border p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 size={10} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Analytics séquence</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill icon={Eye} value={totals.opens} label="ouvertures" color="text-blue-600 bg-blue-50 dark:bg-blue-950/30" />
            <StatPill icon={MousePointerClick} value={totals.clicks} label="clics" color="text-green-600 bg-green-50 dark:bg-green-950/30" />
            <StatPill icon={AlertCircle} value={totals.bounces} label="rebonds" color="text-red-500 bg-red-50 dark:bg-red-950/30" />
          </div>
          {emails.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(openRate, 100)}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-blue-600">{openRate}% taux d'ouverture</span>
            </div>
          )}
        </div>
      )}

      {/* Email list */}
      {loading ? (
        <Skeleton />
      ) : emails.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center space-y-2">
          <Plus size={16} className="mx-auto text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Abonnez-vous à la newsletter du concurrent avec cette adresse pour capturer ses emails ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              stats={analytics?.byEmail[email.id]}
              onTrack={handleTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
}
