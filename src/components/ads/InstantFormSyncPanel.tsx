/**
 * InstantFormSyncPanel — Configure Meta Instant Form → appointment scheduling
 * Supports: Calendly, HighLevel, HubSpot
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck, Settings, ExternalLink, Loader2,
  CheckCircle2, AlertCircle, Zap, RefreshCw, Link2,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormConfig {
  id: string;
  formId: string;
  formName: string;
  pageId: string;
  schedulingProvider: 'calendly' | 'highlevel' | 'hubspot' | 'none';
  schedulingUrl: string;
  autoConfirm: boolean;
  isActive: boolean;
  totalLeads: number;
  totalAppointments: number;
  lastSyncAt: string | null;
  createdAt: string;
}

interface Appointment {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  appointmentStatus: string;
  schedulingUrl: string;
  provider: string;
  syncedAt: string;
  createdAt: string;
}

const PROVIDERS = [
  { id: 'calendly' as const, name: 'Calendly', color: '#006BFF', icon: '📅', urlPlaceholder: 'https://calendly.com/your-link' },
  { id: 'highlevel' as const, name: 'HighLevel', color: '#147BFF', icon: '🔷', urlPlaceholder: 'https://your-app.gohighlevel.com' },
  { id: 'hubspot' as const, name: 'HubSpot', color: '#FF7A59', icon: '🟠', urlPlaceholder: 'https://api.hubapi.com' },
  { id: 'none' as const, name: 'Aucun (collecte uniquement)', color: '#64748B', icon: '📋', urlPlaceholder: '' },
];

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'bg-amber-500/10 text-amber-600', label: 'En attente' },
  confirmed: { cls: 'bg-emerald-500/10 text-emerald-600', label: 'Confirmé' },
  cancelled: { cls: 'bg-red-500/10 text-red-600', label: 'Annulé' },
  completed: { cls: 'bg-blue-500/10 text-blue-600', label: 'Terminé' },
};

export function InstantFormSyncPanel() {
  const [configs, setConfigs] = useState<FormConfig[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [provider, setProvider] = useState<string>('none');
  const [schedulingUrl, setSchedulingUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const [cfgResp, apptResp] = await Promise.all([
        fetch('/api/instant-forms/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/instant-forms/appointments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (cfgResp.ok) {
        const data = await cfgResp.json();
        setConfigs(data.configs || []);
      }
      if (apptResp.ok) {
        const data = await apptResp.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('[InstantFormSync] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formId.trim()) {
      toast.error('ID du formulaire requis');
      return;
    }

    setSaving(true);
    try {
      const token = await blink.auth.getValidToken();
      const resp = await fetch('/api/instant-forms/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          formId: formId.trim(),
          formName: formName.trim() || 'Formulaire Instant',
          schedulingProvider: provider,
          schedulingUrl: schedulingUrl.trim(),
          schedulingApiKey: apiKey.trim(),
          autoConfirm,
        }),
      });

      if (resp.ok) {
        toast.success('Configuration sauvegardée');
        setShowForm(false);
        setFormId('');
        setFormName('');
        setProvider('none');
        setSchedulingUrl('');
        setApiKey('');
        setAutoConfirm(false);
        loadData();
      } else {
        const err = await resp.json();
        toast.error(err.error || 'Erreur de sauvegarde');
      }
    } catch (err) {
      toast.error('Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(configId: string) {
    setTesting(configId);
    try {
      const token = await blink.auth.getValidToken();
      const resp = await fetch('/api/instant-forms/sync-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ configId }),
      });

      if (resp.ok) {
        const data = await resp.json();
        toast.success(`Test réussi — lien: ${data.schedulingUrl || 'collecte OK'}`);
      } else {
        const err = await resp.json();
        toast.error(err.error || 'Test échoué');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <CalendarCheck size={20} className="text-teal-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Formulaires Instant → RDV</h3>
            <p className="text-xs text-muted-foreground">
              Synchronisez les leads de vos formulaires Meta avec votre agenda
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1.5">
          <Settings size={14} />
          Configurer
        </Button>
      </div>

      {/* Provider logos */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Compatibles :</span>
        {PROVIDERS.filter(p => p.id !== 'none').map(p => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs font-medium">
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </div>
        ))}
      </div>

      {/* Config form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-border bg-card p-5 space-y-4"
        >
          <h4 className="text-sm font-bold text-foreground">Nouvelle configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                ID Formulaire Meta
              </label>
              <input
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="1234567890123456"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Nom du formulaire
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Formulaire RDV Gratuit"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Fournisseur de prise de RDV
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    provider === p.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>{p.icon}</span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {provider !== 'none' && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  URL {PROVIDERS.find(p => p.id === provider)?.name}
                </label>
                <input
                  value={schedulingUrl}
                  onChange={(e) => setSchedulingUrl(e.target.value)}
                  placeholder={PROVIDERS.find(p => p.id === provider)?.urlPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Clé API (optionnel — pour liens auto)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              className="rounded"
              id="autoConfirm"
            />
            <label htmlFor="autoConfirm" className="text-xs text-muted-foreground">
              Confirmer automatiquement les RDV sans validation manuelle
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Sauvegarder
            </Button>
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm">
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {/* Config list */}
      {configs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configurations actives</h4>
          {configs.map(cfg => {
            const prov = PROVIDERS.find(p => p.id === cfg.schedulingProvider);
            return (
              <div key={cfg.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <span className="text-lg">{prov?.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{cfg.formName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Form ID: {cfg.formId} · {prov?.name || 'Aucun'} ·
                    {cfg.totalLeads} leads · {cfg.totalAppointments} RDV
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {cfg.isActive && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 rounded-full px-2 py-0.5">
                      ● Actif
                    </span>
                  )}
                  <button
                    onClick={() => handleTest(cfg.id)}
                    disabled={testing === cfg.id}
                    className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                  >
                    {testing === cfg.id ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Zap size={10} />
                    )}
                    Tester
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointments table */}
      {appointments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Derniers RDV synchronisés ({appointments.length})
            </h4>
            <button
              onClick={loadData}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <RefreshCw size={10} />
              Actualiser
            </button>
          </div>
          <div className="space-y-1.5">
            {appointments.slice(0, 10).map(appt => {
              const status = STATUS_STYLES[appt.appointmentStatus] || STATUS_STYLES.pending;
              return (
                <div key={appt.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{appt.leadName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{appt.leadEmail} · {appt.leadPhone}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${status.cls}`}>
                    {status.label}
                  </span>
                  {appt.schedulingUrl && (
                    <a href={appt.schedulingUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Link2 size={12} />
                    </a>
                  )}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(appt.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && configs.length === 0 && (
        <div className="text-center py-8">
          <CalendarCheck size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucune configuration</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Connectez un formulaire Meta Instant à votre agenda Calendly, HighLevel ou HubSpot.
          </p>
        </div>
      )}
    </div>
  );
}
