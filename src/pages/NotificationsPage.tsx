/**
 * NotificationsPage — In-app notification center.
 * Shows notification history (logged to localStorage) and per-type email
 * preferences with test-send buttons.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@blinkdotnew/ui';
import {
  Bell, Mail, MessageCircle, Calendar, Star, BarChart2,
  CheckCircle2, Clock, Trash2, RefreshCw, Send, Settings,
  BellOff, Zap, Eye, EyeOff, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { useNotificationPreferences, type NotificationPreferences } from '../context/NotificationPreferencesContext';
import { useEmailNotifications, loadNotificationLog, saveNotificationLog, type AppNotification, type NotifType } from '../hooks/useEmailNotifications';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

// ── Notification type config ─────────────────────────────────────────────────

interface NotifTypeConfig {
  id: NotifType;
  prefKey: keyof NotificationPreferences;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  badge?: string;
}

const NOTIF_TYPES: NotifTypeConfig[] = [
  {
    id: 'message',
    prefKey: 'liveChatMessage',
    icon: <MessageCircle size={14} />,
    label: 'Messages Live Chat',
    description: 'Email instantané dès qu\'un client vous envoie un message via le live chat de votre site.',
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400',
    badge: 'Temps réel',
  },
  {
    id: 'message',
    prefKey: 'inboxMessages',
    icon: <Mail size={14} />,
    label: 'Messages Inbox (WhatsApp / Instagram / Facebook)',
    description: 'Email dès qu\'un nouveau message arrive dans votre boîte de réception unifiée.',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400',
    badge: 'Temps réel',
  },
  {
    id: 'review',
    prefKey: 'reviewAlert',
    icon: <Star size={14} />,
    label: 'Nouvel avis Google',
    description: 'Alerte immédiate quand un client laisse un avis sur votre fiche Google Business Profile.',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
    badge: 'Temps réel',
  },
  {
    id: 'post_reminder',
    prefKey: 'postReminder',
    icon: <Calendar size={14} />,
    label: 'Rappel avant publication',
    description: 'Email de rappel 24h avant chaque publication planifiée dans votre calendrier éditorial.',
    color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400',
    badge: '24h avant',
  },
  {
    id: 'post_reminder',
    prefKey: 'scheduledPosts',
    icon: <CheckCircle2 size={14} />,
    label: 'Confirmation de planification',
    description: 'Email de confirmation chaque fois qu\'une publication est ajoutée au calendrier.',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  {
    id: 'post_reminder',
    prefKey: 'approvalRequired',
    icon: <ShieldCheck size={14} />,
    label: 'Validation requise',
    description: 'Email quand une publication est en attente de validation (mode équipe).',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400',
  },
  {
    id: 'weekly_digest',
    prefKey: 'weeklyDigest',
    icon: <BarChart2 size={14} />,
    label: 'Bilan hebdomadaire',
    description: 'Résumé chaque lundi : portée, messages, avis, meilleures publications de la semaine.',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400',
    badge: 'Chaque lundi',
  },
];

// ── Notification icon by type ────────────────────────────────────────────────

function typeIcon(type: NotifType) {
  switch (type) {
    case 'message':      return <MessageCircle size={14} className="text-teal-600" />;
    case 'post_reminder':return <Calendar size={14} className="text-violet-600" />;
    case 'review':       return <Star size={14} className="text-amber-500" />;
    case 'weekly_digest':return <BarChart2 size={14} className="text-purple-600" />;
  }
}

function typeColor(type: NotifType) {
  switch (type) {
    case 'message':      return 'bg-teal-100 dark:bg-teal-950/30';
    case 'post_reminder':return 'bg-violet-100 dark:bg-violet-950/30';
    case 'review':       return 'bg-amber-100 dark:bg-amber-950/30';
    case 'weekly_digest':return 'bg-purple-100 dark:bg-purple-950/30';
  }
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000)  return 'À l\'instant';
  if (diff < 3600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `Il y a ${Math.floor(diff / 3600_000)}h`;
  return `Il y a ${Math.floor(diff / 86400_000)}j`;
}

// ── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30',
        checked ? 'bg-primary' : 'bg-muted-foreground/25'
      )}
    >
      <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200', checked ? 'translate-x-4' : 'translate-x-0')} />
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { prefs, updatePref } = useNotificationPreferences();
  const { sendTestEmail } = useEmailNotifications();
  const { user } = useAuth();

  const [log, setLog]               = useState<AppNotification[]>([]);
  const [tab, setTab]               = useState<'history' | 'settings'>('history');
  const [testLoading, setTestLoading] = useState<NotifType | null>(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const refreshLog = useCallback(() => setLog(loadNotificationLog()), []);

  useEffect(() => {
    refreshLog();
    const handler = () => refreshLog();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refreshLog]);

  const markAllRead = () => {
    const updated = log.map(n => ({ ...n, read: true }));
    setLog(updated);
    saveNotificationLog(updated);
    toast.success('Toutes les notifications marquées comme lues');
  };

  const clearLog = () => {
    saveNotificationLog([]);
    setLog([]);
    toast.success('Historique effacé');
  };

  const markRead = (id: string) => {
    const updated = log.map(n => n.id === id ? { ...n, read: true } : n);
    setLog(updated);
    saveNotificationLog(updated);
  };

  const handleTestSend = async (type: NotifType) => {
    setTestLoading(type);
    const ok = await sendTestEmail(type);
    setTestLoading(null);
    if (ok) {
      toast.success('Email de test envoyé !', { description: `Vérifiez ${user?.email}` });
      refreshLog();
    } else {
      toast.error('Échec de l\'envoi', { description: 'Vérifiez votre connexion ou l\'adresse email.' });
    }
  };

  const unreadCount = log.filter(n => !n.read).length;
  const displayedLog = showOnlyUnread ? log.filter(n => !n.read) : log;

  const activePrefsCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bell size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground leading-tight">Centre de notifications 🔔</h1>
          <p className="text-sm text-muted-foreground">Gérez vos alertes email et consultez l'historique de vos notifications.</p>
        </div>
        {unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[24px] h-6 rounded-full bg-red-500 text-white text-xs font-extrabold px-1.5 shrink-0">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
        {[
          { id: 'history' as const, label: 'Historique', icon: <Clock size={13} /> },
          { id: 'settings' as const, label: 'Paramètres email', icon: <Settings size={13} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            {t.id === 'history' && unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-extrabold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Actions bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowOnlyUnread(v => !v)}
              className={cn('flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-all', showOnlyUnread ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground')}
            >
              {showOnlyUnread ? <EyeOff size={11} /> : <Eye size={11} />}
              {showOnlyUnread ? 'Voir tout' : `Non lus (${unreadCount})`}
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 bg-card border border-border transition-colors">
                <CheckCircle2 size={11} /> Tout marquer lu
              </button>
            )}
            <button onClick={refreshLog} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 bg-card border border-border transition-colors">
              <RefreshCw size={11} />
            </button>
            {log.length > 0 && (
              <button onClick={clearLog} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 rounded-lg px-3 py-1.5 bg-card border border-border transition-colors ml-auto">
                <Trash2 size={11} /> Effacer l'historique
              </button>
            )}
          </div>

          {/* Notification cards */}
          {displayedLog.length === 0 ? (
            <div className="text-center py-14 bg-card border border-border rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <BellOff size={24} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-foreground">Aucune notification</p>
              <p className="text-xs text-muted-foreground mt-1">
                {showOnlyUnread ? 'Aucune notification non lue.' : 'Vos notifications apparaîtront ici quand elles arrivent.'}
              </p>
              <button
                onClick={() => setTab('settings')}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary mx-auto hover:underline"
              >
                Configurer les notifications <ChevronRight size={11} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedLog.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm',
                    notif.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeColor(notif.type))}>
                    {typeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className={cn('text-sm leading-tight', notif.read ? 'font-medium text-foreground' : 'font-bold text-foreground')}>
                        {notif.title}
                      </p>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={9} /> {relativeTime(notif.timestamp)}
                      </span>
                      {notif.emailSent && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-semibold">
                          <Mail size={9} /> Email envoyé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seed demo notifications button */}
          {log.length === 0 && (
            <button
              onClick={() => {
                const demos: Omit<AppNotification, 'id' | 'timestamp' | 'read'>[] = [
                  { type: 'message', title: 'Nouveau message de Léa Moreau', body: 'Via Site web : "Bonjour, j\'ai une question sur les tarifs 💬"', emailSent: true, meta: { sender: 'Léa Moreau', channel: 'Site web' } },
                  { type: 'review', title: 'Nouvel avis ★★★★★ de Thomas Dupont', body: '"Excellent service ! L\'équipe est très professionnelle et à l\'écoute."', emailSent: true, meta: { rating: 5, reviewer: 'Thomas Dupont' } },
                  { type: 'post_reminder', title: 'Publication prévue demain à 14:00', body: 'Découvrez nos nouvelles offres du printemps 🌸 — Instagram, Facebook', emailSent: true, meta: { date: 'demain', time: '14:00' } },
                  { type: 'weekly_digest', title: 'Bilan hebdomadaire — semaine du 27 mai', body: '7 publications · 12 messages · 4.6/5 ⭐ · +18% de portée', emailSent: false },
                ];
                const entries: AppNotification[] = demos.map((d, i) => ({
                  ...d, id: `demo_${i}`, timestamp: Date.now() - i * 3600_000, read: i > 1,
                }));
                saveNotificationLog(entries);
                setLog(entries);
              }}
              className="w-full py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl hover:border-primary/40 transition-colors"
            >
              + Charger des exemples de notifications
            </button>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === 'settings' && (
        <div className="space-y-4">
          {/* Email destination */}
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3">
            <Mail size={14} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Notifications envoyées à <strong>{user?.email ?? 'votre adresse email'}</strong>
              <span className="text-blue-500 ml-2">· {activePrefsCount} active{activePrefsCount > 1 ? 's' : ''} sur {NOTIF_TYPES.length}</span>
            </p>
          </div>

          {/* Notification rows */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Préférences de notification</p>
              <button
                onClick={() => {
                  const allOn = Object.values(prefs).every(Boolean);
                  (Object.keys(prefs) as (keyof NotificationPreferences)[]).forEach(k => updatePref(k, !allOn));
                  toast.success(allOn ? 'Toutes les notifications désactivées' : 'Toutes les notifications activées');
                }}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {Object.values(prefs).every(Boolean) ? <BellOff size={10} /> : <Bell size={10} />}
                {Object.values(prefs).every(Boolean) ? 'Tout désactiver' : 'Tout activer'}
              </button>
            </div>

            <div className="divide-y divide-border/60">
              {NOTIF_TYPES.map((cfg, idx) => (
                <div key={`${cfg.prefKey}-${idx}`} className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.color.includes('bg-') ? '' : 'bg-muted')}>
                      <span className={cn('', cfg.color.split(' ')[0])}>{cfg.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                        {cfg.badge && (
                          <span className="text-[9px] font-bold rounded-full bg-muted text-muted-foreground px-2 py-0.5 uppercase tracking-wide">{cfg.badge}</span>
                        )}
                        {prefs[cfg.prefKey] && (
                          <span className="text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">Activé</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
                      {prefs[cfg.prefKey] && (
                        <button
                          onClick={() => handleTestSend(cfg.id)}
                          disabled={testLoading === cfg.id}
                          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-wait"
                        >
                          {testLoading === cfg.id ? <RefreshCw size={9} className="animate-spin" /> : <Send size={9} />}
                          {testLoading === cfg.id ? 'Envoi…' : 'Envoyer un test'}
                        </button>
                      )}
                    </div>
                  </div>
                  <Toggle
                    checked={prefs[cfg.prefKey]}
                    onChange={() => {
                      updatePref(cfg.prefKey, !prefs[cfg.prefKey]);
                      toast.success(prefs[cfg.prefKey] ? 'Notification désactivée' : 'Notification activée');
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sender info */}
          <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
            <Zap size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les emails sont envoyés depuis <span className="font-medium text-foreground">noreply@kompilot.blink-email.com</span>.
              Ajoutez cette adresse à vos contacts pour éviter les spams.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
