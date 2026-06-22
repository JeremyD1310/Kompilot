import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import {
  Bell, BellOff, Mail, Calendar, Clock, ShieldCheck,
  Save, Info, CheckCircle, AlertCircle, MessageSquare, BarChart2,
  TrendingUp, Smartphone,
} from 'lucide-react';
import { useNotificationPreferences, type NotificationPreferences } from '../../context/NotificationPreferencesContext';
import { useAuth } from '../../hooks/useAuth';
import { ROIFlashPushMockup } from '../../components/dashboard/ROIFlashPushMockup';
import { AlertPreferencesPanel } from './AlertPreferencesPanel';

// ── Notification row definitions ──────────────────────────────────────────────

interface NotifRow {
  key: keyof NotificationPreferences;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  group: 'activity' | 'reports';
}

const NOTIF_ROWS: NotifRow[] = [
  {
    key: 'liveChatMessage',
    group: 'activity',
    icon: <MessageSquare size={15} className="text-teal-500" />,
    label: 'Messages Live Chat',
    description: "Email instantané dès qu'un client envoie un message via le live chat de votre site.",
  },
  {
    key: 'inboxMessages',
    group: 'activity',
    icon: <MessageSquare size={15} className="text-blue-500" />,
    label: 'Messages Inbox (WhatsApp / Instagram / Facebook)',
    description: "Recevez un email dès qu'un nouveau message arrive dans votre boîte unifiée.",
  },
  {
    key: 'reviewAlert',
    group: 'activity',
    icon: <Bell size={15} className="text-amber-500" />,
    label: 'Nouvel avis Google',
    description: "Alerte immédiate quand un client laisse un avis sur votre fiche Google Business Profile.",
  },
  {
    key: 'scheduledPosts',
    group: 'activity',
    icon: <Calendar size={15} className="text-primary" />,
    label: 'Confirmation de planification',
    description: "Un email de confirmation est envoyé chaque fois qu'une publication est planifiée dans votre calendrier.",
  },
  {
    key: 'postReminder',
    group: 'activity',
    icon: <Clock size={15} className="text-violet-500" />,
    label: 'Rappel avant publication',
    description: "Email de rappel 24h avant chaque publication planifiée dans votre calendrier éditorial.",
    badge: '24h avant',
  },
  {
    key: 'approvalRequired',
    group: 'activity',
    icon: <ShieldCheck size={15} className="text-orange-500" />,
    label: 'Publications en attente de validation',
    description: 'Recevez un rappel email quand une publication est en statut "En attente de validation".',
  },
  {
    key: 'weeklyDigest',
    group: 'reports',
    icon: <BarChart2 size={15} className="text-purple-500" />,
    label: 'Bilan hebdomadaire',
    description: 'Résumé chaque lundi : portée, messages reçus, avis Google, meilleures publications de la semaine.',
    badge: 'Chaque lundi',
  },
];

const GROUPS = [
  { id: 'activity' as const, label: 'Activité en temps réel', icon: <Bell size={13} /> },
  { id: 'reports'  as const, label: 'Rapports & Résumés',      icon: <Mail size={13} /> },
];

// ── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  id, checked, onChange, disabled,
}: {
  id: string; checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Group header ──────────────────────────────────────────────────────────────

function GroupHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/30 border-b border-border/60">
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Unsaved changes banner ────────────────────────────────────────────────────

function UnsavedBanner({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Modifications non enregistrées</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} className="gap-1.5 h-7 text-xs">
          <Save size={11} /> Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard} className="h-7 text-xs text-muted-foreground">
          Ignorer
        </Button>
      </div>
    </div>
  );
}

// ── Notifications tab ─────────────────────────────────────────────────────────

export function NotificationsTab() {
  const { prefs, updatePref } = useNotificationPreferences();
  const { user } = useAuth();

  // Local copy for unsaved-changes pattern
  const [local, setLocal] = useState<NotificationPreferences>({ ...prefs });
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocal(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    Object.entries(local).forEach(([k, v]) =>
      updatePref(k as keyof NotificationPreferences, v as boolean)
    );
    setDirty(false);
    setSaveStatus('saved');
    toast.success('Préférences enregistrées !', {
      description: 'Vos paramètres de notifications ont été sauvegardés.',
    });
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleDiscard = () => {
    setLocal({ ...prefs });
    setDirty(false);
  };

  const activeCount = Object.values(local).filter(Boolean).length;
  const totalCount = NOTIF_ROWS.length;
  const allEnabled = activeCount === totalCount;

  const handleToggleAll = () => {
    const next = NOTIF_ROWS.reduce(
      (acc, r) => ({ ...acc, [r.key]: !allEnabled }),
      { ...local }
    );
    setLocal(next as NotificationPreferences);
    setDirty(true);
    setSaveStatus('idle');
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Unsaved changes banner */}
      {dirty && (
        <UnsavedBanner onSave={handleSave} onDiscard={handleDiscard} />
      )}

      {/* Saved confirmation */}
      {!dirty && saveStatus === 'saved' && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/40 px-4 py-3">
          <CheckCircle size={14} className="text-green-600 shrink-0" />
          <p className="text-xs font-semibold text-green-800 dark:text-green-300">Préférences enregistrées avec succès.</p>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell size={17} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Notifications par email</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choisissez quand Kompilot vous envoie un email.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              {activeCount}/{totalCount} active{activeCount > 1 ? 's' : ''}
            </span>
            {dirty && (
              <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs">
                <Save size={12} /> Enregistrer
              </Button>
            )}
          </div>
        </div>

        {/* Email destination info */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-border/60 bg-blue-50/50 dark:bg-blue-950/10">
          <Info size={13} className="text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Les notifications seront envoyées à{' '}
            <span className="font-semibold">{user?.email ?? 'votre adresse email'}</span>.
          </p>
        </div>

        {/* Grouped rows */}
        {GROUPS.map(group => {
          const rows = NOTIF_ROWS.filter(r => r.group === group.id);
          return (
            <div key={group.id}>
              <GroupHeader label={group.label} icon={group.icon} />
              <div className="divide-y divide-border/60">
                {rows.map(row => (
                  <label
                    key={row.key}
                    htmlFor={`notif-${row.key}`}
                    className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {row.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{row.label}</p>
                          {row.badge && (
                            <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                              {row.badge}
                            </span>
                          )}
                          {local[row.key] && (
                            <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5">
                              Activé
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {row.description}
                        </p>
                        {row.key === 'weeklyDigest' && local.weeklyDigest && (
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              toast.success('Rapport envoyé !', {
                                description: `Un exemple de rapport a été envoyé à ${user?.email}.`,
                              });
                            }}
                            className="mt-1.5 text-[11px] text-primary underline hover:no-underline transition-all"
                          >
                            📊 Recevoir un exemple maintenant
                          </button>
                        )}
                      </div>
                    </div>
                    <ToggleSwitch
                      id={`notif-${row.key}`}
                      checked={local[row.key]}
                      onChange={() => handleToggle(row.key)}
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-border/60 bg-muted/10">
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allEnabled ? <BellOff size={12} /> : <Bell size={12} />}
            {allEnabled ? 'Tout désactiver' : 'Tout activer'}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {activeCount} notification{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Sender info note */}
      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-3">
        <Mail size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Les emails sont envoyés depuis{' '}
          <span className="font-medium text-foreground">noreply@kompilot.blink-email.com</span>.
          Ajoutez cette adresse à vos contacts pour éviter les spams.
        </p>
      </div>

      {/* ── ROI FlashPush Weekly Report ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-border"
          style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(5,150,105,0.05) 100%)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0D9488, #059669)' }}
          >
            <Smartphone size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-foreground">Rapport de Rentabilité Hebdomadaire FlashPush</p>
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide dark:bg-emerald-900/30 dark:text-emerald-400">
                Chaque lundi
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recevez chaque lundi à 9h00 un récapitulatif de ce que Kompilot vous a rapporté cette semaine.
            </p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col md:flex-row items-start gap-6">
          {/* Left: bullets */}
          <div className="flex-1 min-w-0 space-y-4">
            <p className="text-sm font-medium text-foreground">Ce rapport contient :</p>
            <ul className="space-y-3">
              {[
                {
                  icon: '💰',
                  title: 'CA sauvé — Bouclier Anti No-Show',
                  desc: 'Montant estimé en euros récupéré grâce aux empreintes bancaires et rappels automatiques.',
                },
                {
                  icon: '⭐',
                  title: 'Avis Google traités cette semaine',
                  desc: "Nombre d'avis auxquels l'IA a répondu, avec détail des nouveaux avis reçus.",
                },
                {
                  icon: '📈',
                  title: 'Évolution du score G.E.O.',
                  desc: 'Votre progression dans les recommandations de ChatGPT, Perplexity et Google AI.',
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="text-lg leading-none shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 px-4 py-3">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                ✓ Rapports de rentabilité transparents — Sachez exactement ce que Kompilot vous rapporte chaque semaine.
              </p>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Aperçu WhatsApp</p>
            <ROIFlashPushMockup noShow={380} reviews={8} geoScore={72} geoChange={4} />
          </div>
        </div>
      </div>

      {/* ── Alert preferences section ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bell size={17} className="text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Alertes Dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choisissez quelles alertes d'urgence apparaissent sur votre tableau de bord.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <AlertPreferencesPanel />
        </div>
      </div>
    </div>
  );
}
