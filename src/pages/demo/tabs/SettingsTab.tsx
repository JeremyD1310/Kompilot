import React from 'react';
import { CheckCircle } from 'lucide-react';

interface AlertPrefs {
  raidAlert: boolean;
  noshowSecured: boolean;
  metaAudit: boolean;
  newLead: boolean;
  apiMaintenance: boolean;
}

interface Props {
  dashboardAlerts: AlertPrefs;
  setDashboardAlerts: (v: AlertPrefs) => void;
  kycStatus: string;
  setKycStatus: (v: string) => void;
  onOpenResignModal: () => void;
}

const ALERT_LABELS: Record<keyof AlertPrefs, string> = {
  raidAlert: 'Alerte Review Raid',
  noshowSecured: 'No-Show Sécurisé',
  metaAudit: 'Audit Meta Ads',
  newLead: 'Nouveau Lead',
  apiMaintenance: 'Maintenance API',
};

export default function SettingsTab({ dashboardAlerts, setDashboardAlerts, kycStatus, setKycStatus, onOpenResignModal }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Notification prefs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white">🔔 Préférences de Notifications</h2>
        <div className="space-y-4">
          {(Object.keys(dashboardAlerts) as (keyof AlertPrefs)[]).map((key) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-sm font-semibold text-white">{ALERT_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={dashboardAlerts[key]}
                onChange={(e) => setDashboardAlerts({ ...dashboardAlerts, [key]: e.target.checked })}
                className="h-5 w-5 rounded border-slate-700 text-teal-500 bg-slate-900 focus:ring-0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* KYC + Danger zone */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white">💳 Statut KYC & Versements Stripe</h3>
          {kycStatus === 'pending' ? (
            <button
              onClick={() => setKycStatus('verified')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl transition"
            >
              Lier ma pièce d'identité & mon RIB de versement
            </button>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-extrabold flex items-center gap-2 animate-pulse">
              <CheckCircle className="h-4 w-4" />
              RIB & KYC de versement approuvés par Stripe !
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-red-500/10 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-red-400 text-sm">⚠️ Zone de Résiliation</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            La résiliation supprime votre accès et purge vos données G.E.O. sous 30 jours conformément au RGPD.
          </p>
          <button
            onClick={onOpenResignModal}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs py-2.5 rounded-xl transition"
          >
            Résilier mon abonnement
          </button>
        </div>
      </div>
    </div>
  );
}
