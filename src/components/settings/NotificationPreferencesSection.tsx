import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Bell, BellOff, Mail, Calendar, Clock, ShieldCheck, Save, Info, Smartphone } from 'lucide-react';
import { ROIFlashPushMockup } from '../../components/dashboard/ROIFlashPushMockup';
import { useNotificationPreferences, type NotificationPreferences } from '../../context/NotificationPreferencesContext';
import { useAuth } from '../../hooks/useAuth';

interface NotifRow {
  key: keyof NotificationPreferences;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
}

const ROWS: NotifRow[] = [
  {
    key: 'inboxMessages',
    icon: <Mail size={16} className="text-blue-500" />,
    label: 'Nouveaux messages (Inbox)',
    description: "Recevez un email dès qu'un visiteur vous envoie un message via votre site, LinkedIn ou Instagram.",
  },
  {
    key: 'scheduledPosts',
    icon: <Calendar size={16} className="text-primary" />,
    label: 'Confirmation de planification',
    description: "Un email de confirmation est envoyé chaque fois qu'une publication est planifiée dans votre calendrier.",
  },
  {
    key: 'approvalRequired',
    icon: <ShieldCheck size={16} className="text-orange-500" />,
    label: 'Publications en attente de validation',
    description: 'Recevez un rappel email quand une publication est en statut "En attente de validation".',
  },
  {
    key: 'weeklyDigest',
    icon: <Clock size={16} className="text-violet-500" />,
    label: 'Rapport hebdomadaire',
    description: 'Résumé de votre activité de la semaine : portée, messages reçus, publications publiées. Envoyé chaque lundi matin.',
    badge: 'Chaque lundi',
  },
];

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
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

export function NotificationPreferencesSection() {
  const { prefs, updatePref } = useNotificationPreferences();
  const { user } = useAuth();
  const [local, setLocal] = useState({ ...prefs });
  const [dirty, setDirty] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocal(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = () => {
    Object.entries(local).forEach(([k, v]) => {
      updatePref(k as keyof NotificationPreferences, v as boolean);
    });
    setDirty(false);
    toast.success('Préférences de notifications enregistrées !', {
      description: 'Vos paramètres ont été sauvegardés.',
    });
  };

  const allEnabled = Object.values(local).every(Boolean);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
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
          {dirty && (
            <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs">
              <Save size={12} /> Enregistrer
            </Button>
          )}
        </div>

        {/* Email address info */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-border/60 bg-blue-50/50 dark:bg-blue-950/10">
          <Info size={13} className="text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Les notifications seront envoyées à{' '}
            <span className="font-semibold">{user?.email ?? 'votre adresse email'}</span>.
          </p>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {ROWS.map(row => (
            <div key={row.key} className="flex items-center justify-between px-5 py-4 gap-4 group hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    {row.badge && (
                      <span className={`rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide ${
                        row.badge === 'Chaque lundi'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {row.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.description}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={local[row.key]}
                onChange={() => handleToggle(row.key)}
                disabled={false}
              />
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-border/60 bg-muted/10">
          <button
            type="button"
            onClick={() => {
              const next = ROWS.reduce((acc, r) => ({
                ...acc,
                [r.key]: !allEnabled,
              }), { ...local });
              setLocal(next as typeof local);
              setDirty(true);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allEnabled ? <BellOff size={12} /> : <Bell size={12} />}
            {allEnabled ? 'Tout désactiver' : 'Tout activer'}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {Object.values(local).filter(Boolean).length} notification{Object.values(local).filter(Boolean).length > 1 ? 's' : ''} active{Object.values(local).filter(Boolean).length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-3">
        <Mail size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Les emails sont envoyés depuis <span className="font-medium text-foreground">noreply@kompilot.blink-email.com</span>.
          Ajoutez cette adresse à vos contacts pour éviter les spams. Les notifications de simulation
          (bouton dans l'Inbox) utilisent votre email réel et vous permettent de tester les templates.
        </p>
      </div>

      {/* ── ROI FlashPush Weekly Report ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
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
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm font-medium text-foreground">Ce rapport contient :</p>
            <ul className="space-y-2.5">
              {[
                { icon: '💰', title: 'CA sauvé — Bouclier Anti No-Show', desc: 'Montant estimé en euros récupéré grâce aux empreintes bancaires et rappels.' },
                { icon: '⭐', title: 'Avis Google traités cette semaine', desc: "Nombre d'avis auxquels l'IA a répondu." },
                { icon: '📈', title: 'Évolution du score G.E.O.', desc: 'Progression dans ChatGPT, Perplexity et Google AI.' },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span className="text-base leading-none shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Aperçu</p>
            <ROIFlashPushMockup noShow={380} reviews={8} geoScore={72} geoChange={4} />
          </div>
        </div>
      </div>
    </div>
  );
}