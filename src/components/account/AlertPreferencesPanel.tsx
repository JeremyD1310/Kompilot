/**
 * AlertPreferencesPanel — "🔔 Préférences d'alertes"
 *
 * Grille de switches permettant à l'utilisateur d'activer/désactiver
 * chaque type d'alerte sur le dashboard. Sauvegarde automatique asynchrone.
 *
 * Pour les profils Agence, un bouton supplémentaire permet d'appliquer
 * ces réglages à tous les nouveaux sous-comptes clients.
 */

import { useCallback } from 'react';
import { Bell, MapPin, CreditCard, MessageSquare, Shield, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@blinkdotnew/ui';
import { useNotificationSettings, type NotificationSettings } from '../../hooks/useNotificationSettings';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../context/SubscriptionContext';
import { toast } from '@blinkdotnew/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ToggleSwitch({
  id, checked, onChange, disabled,
}: { id: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
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
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Alert row definitions ─────────────────────────────────────────────────────

interface AlertRow {
  key: keyof NotificationSettings;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: { label: string; color: string };
}

const ALERT_ROWS: AlertRow[] = [
  {
    key: 'showGeoAlerts',
    icon: <MapPin size={16} className="text-teal-500" />,
    label: 'Alertes Géo-SEO',
    description: 'Baisse de part de voix sémantique ou perte de position sur Google Maps.',
    badge: { label: 'Géo', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  },
  {
    key: 'showStripeAlerts',
    icon: <CreditCard size={16} className="text-violet-500" />,
    label: 'Alertes de paiement Stripe',
    description: "Échecs de prélèvement, litiges No-Show ou seuils de versements dépassés.",
    badge: { label: 'Stripe', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  },
  {
    key: 'showSmsAlerts',
    icon: <MessageSquare size={16} className="text-blue-500" />,
    label: 'Alertes solde SMS bas',
    description: "Notification quand votre solde SMS passe sous 10 crédits restants.",
    badge: { label: '< 10 SMS', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  },
  {
    key: 'showRaidAlerts',
    icon: <Shield size={16} className="text-red-500" />,
    label: 'Alertes sécurité (vagues d\'avis)',
    description: "Détection de vagues d'avis suspects ou de tentatives de spam coordonné.",
    badge: { label: 'Sécurité', color: 'text-red-700 bg-red-50 border-red-200' },
  },
  {
    key: 'showLeadAlerts',
    icon: <Users size={16} className="text-amber-500" />,
    label: 'Notifications de nouveaux leads',
    description: "Alerte en temps réel dès qu'un nouveau lead est capturé via vos widgets.",
    badge: { label: 'Leads', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export function AlertPreferencesPanel() {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const isAgency = currentPlan.id === 'expert' || (user?.role === 'agency');
  const { settings, isLoading, isSaving, updateSetting, updateAll } = useNotificationSettings(user?.id);

  const handleToggle = useCallback(
    (key: keyof NotificationSettings) => {
      updateSetting(key, !settings[key]);
    },
    [settings, updateSetting]
  );

  const handleApplyToSubAccounts = useCallback(async () => {
    await updateAll({ applyToSubAccounts: true });
    toast.success('Réglages appliqués', {
      description: 'Tous vos futurs sous-comptes hériteront de cette configuration.',
    });
  }, [updateAll]);

  const enabledCount = Object.entries(settings)
    .filter(([k, v]) => k !== 'applyToSubAccounts' && v === true)
    .length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bell size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Préférences d'alertes</h3>
            <p className="text-xs text-muted-foreground">
              {enabledCount}/{ALERT_ROWS.length} alertes actives sur le dashboard
            </p>
          </div>
        </div>
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Sauvegarde...
          </span>
        )}
        {!isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle size={12} /> Synchronisé
          </span>
        )}
      </div>

      {/* Alert rows */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {ALERT_ROWS.map((row) => {
          const isEnabled = settings[row.key] as boolean;
          return (
            <div
              key={row.key}
              className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${
                isEnabled ? 'bg-card' : 'bg-muted/30'
              }`}
            >
              {/* Icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                isEnabled
                  ? 'bg-background border-border'
                  : 'bg-muted/60 border-transparent opacity-50'
              }`}>
                {row.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {row.label}
                  </p>
                  {row.badge && (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${row.badge.color}`}>
                      {row.badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {row.description}
                </p>
              </div>

              {/* Toggle */}
              <ToggleSwitch
                id={`alert-${row.key}`}
                checked={isEnabled}
                onChange={() => handleToggle(row.key)}
              />
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-muted-foreground">
        Les alertes désactivées disparaissent silencieusement de votre dashboard. Aucune donnée n'est supprimée.
      </p>

      {/* Agency block: apply to sub-accounts */}
      {isAgency && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 dark:bg-violet-950/20 dark:border-violet-800/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <Users size={15} className="text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                  White Label — Héritage vers les sous-comptes
                </p>
                <Badge className="text-[9px] px-1.5 py-0 bg-violet-600 text-white border-0">Agence</Badge>
              </div>
              <p className="text-xs text-violet-700 dark:text-violet-400 mb-3">
                Appliquez ces réglages d'alertes comme configuration par défaut pour tous vos nouveaux
                sous-comptes clients. Cela garantit une expérience cohérente sur votre marque blanche.
              </p>

              {/* Apply to sub-accounts toggle */}
              <div className="flex items-center gap-3 mb-3">
                <ToggleSwitch
                  id="apply-to-sub-accounts"
                  checked={settings.applyToSubAccounts}
                  onChange={() => handleToggle('applyToSubAccounts')}
                />
                <label htmlFor="apply-to-sub-accounts" className="text-xs font-medium text-violet-800 dark:text-violet-300 cursor-pointer">
                  Activer l'héritage automatique pour les nouvelles souscriptions
                </label>
              </div>

              {settings.applyToSubAccounts && (
                <div className="flex items-center gap-2 rounded-lg bg-violet-100/60 dark:bg-violet-900/30 px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
                  <CheckCircle size={13} className="text-violet-500 shrink-0" />
                  <span>
                    <strong>Actif</strong> — Toute nouvelle souscription de sous-compte héritera de votre configuration d'alertes actuelle.
                  </span>
                </div>
              )}

              {/* Bulk apply button */}
              <button
                type="button"
                onClick={handleApplyToSubAccounts}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white dark:bg-violet-900/30 dark:border-violet-700 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/50 transition-colors"
              >
                <Users size={12} />
                Appliquer ces réglages par défaut à tous mes sous-comptes clients
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
