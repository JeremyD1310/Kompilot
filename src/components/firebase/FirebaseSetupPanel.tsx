/**
 * FirebaseSetupPanel — Configuration panel for Firebase in Account Settings.
 * Shows connection status for Analytics, FCM, and Firestore.
 * Allows enabling push notifications.
 */
import { useState } from 'react';
import { Bell, BellOff, Activity, Database, CheckCircle, XCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { isFirebaseConfigured } from '../../firebase/client';
import { useFirebaseMessaging } from '../../hooks/useFirebaseMessaging';
import { cn } from '../../lib/utils';

interface StatusRowProps {
  label: string;
  description: string;
  status: 'active' | 'inactive' | 'warning';
  icon: React.ReactNode;
  action?: React.ReactNode;
}

function StatusRow({ label, description, status, icon, action }: StatusRowProps) {
  const colors = {
    active: 'text-emerald-600 dark:text-emerald-400',
    inactive: 'text-muted-foreground',
    warning: 'text-amber-600 dark:text-amber-400',
  };
  const bgColors = {
    active: 'bg-emerald-50 dark:bg-emerald-950/30',
    inactive: 'bg-muted/50',
    warning: 'bg-amber-50 dark:bg-amber-950/30',
  };
  const icons = {
    active: <CheckCircle size={14} className="text-emerald-500 shrink-0" />,
    inactive: <XCircle size={14} className="text-muted-foreground shrink-0" />,
    warning: <AlertCircle size={14} className="text-amber-500 shrink-0" />,
  };

  return (
    <div className={cn('flex items-center gap-3 rounded-xl p-3.5', bgColors[status])}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', `${bgColors[status]} border border-border`)}>
        <span className={colors[status]}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {icons[status]}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FirebaseSetupPanel() {
  const configured = isFirebaseConfigured();
  const { permission, fcmToken, isLoading, requestPermission } = useFirebaseMessaging();
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopied(true);
    toast.success('Token FCM copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M3.97 5.47L12 2l8.03 3.47L12 22 3.97 5.47z" fill="#FFA000" />
            <path d="M12 2v20L3.97 5.47 12 2z" fill="#F57C00" />
            <path d="M12 2l8.03 3.47L12 22V2z" fill="#FFCA28" opacity=".5" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Intégration Firebase</h3>
          <p className="text-xs text-muted-foreground">Analytics · Notifications push · Sync temps réel</p>
        </div>
        <div className="ml-auto">
          <Badge variant={configured ? 'default' : 'secondary'} className={configured ? 'bg-emerald-500' : ''}>
            {configured ? '✓ Connecté' : 'Non configuré'}
          </Badge>
        </div>
      </div>

      {/* Not configured warning */}
      {!configured && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Firebase non configuré</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Ajoutez vos clés Firebase dans les secrets du projet pour activer Analytics, les notifications push et le sync temps réel.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-amber-900/20 rounded-lg p-3 font-mono text-xs space-y-1 text-muted-foreground">
            {[
              'VITE_FIREBASE_API_KEY',
              'VITE_FIREBASE_AUTH_DOMAIN',
              'VITE_FIREBASE_PROJECT_ID',
              'VITE_FIREBASE_STORAGE_BUCKET',
              'VITE_FIREBASE_MESSAGING_SENDER_ID',
              'VITE_FIREBASE_APP_ID',
              'VITE_FIREBASE_MEASUREMENT_ID',
              'VITE_FIREBASE_VAPID_KEY',
            ].map(key => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400">▸</span>
                <span>{key}</span>
              </div>
            ))}
          </div>
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
          >
            <ExternalLink size={12} />
            Ouvrir la console Firebase
          </a>
        </div>
      )}

      {/* Status rows */}
      <div className="space-y-2">
        <StatusRow
          label="Firebase Analytics"
          description={configured
            ? 'Tracking automatique des pages, posts, avis et abonnements'
            : 'Activez Firebase pour tracker les événements utilisateurs'}
          status={configured ? 'active' : 'inactive'}
          icon={<Activity size={16} />}
        />

        <StatusRow
          label="Notifications push (FCM)"
          description={
            !configured ? 'Firebase requis pour les notifications push' :
            permission === 'granted' ? `Notifications actives${fcmToken ? ' — Token enregistré' : ''}` :
            permission === 'denied' ? 'Notifications bloquées dans le navigateur' :
            'Activez les notifications pour recevoir les alertes en temps réel'
          }
          status={!configured ? 'inactive' : permission === 'granted' ? 'active' : permission === 'denied' ? 'inactive' : 'warning'}
          icon={permission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
          action={configured && permission !== 'denied' && permission !== 'granted' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={requestPermission}
              disabled={isLoading}
              className="shrink-0 text-xs"
            >
              {isLoading ? 'En cours…' : 'Activer'}
            </Button>
          ) : configured && permission === 'granted' && fcmToken ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToken}
              className="shrink-0 text-xs gap-1.5"
            >
              <Copy size={11} />
              {copied ? 'Copié !' : 'Token'}
            </Button>
          ) : undefined}
        />

        <StatusRow
          label="Firestore — Sync temps réel"
          description={configured
            ? 'Activité live, statuts de publication et scores GEO synchronisés'
            : 'Firebase requis pour la synchronisation temps réel'}
          status={configured ? 'active' : 'inactive'}
          icon={<Database size={16} />}
        />
      </div>

      {/* Setup link */}
      {configured && (
        <div className="text-center">
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={11} />
            Gérer le projet Firebase
          </a>
        </div>
      )}
    </div>
  );
}
