/**
 * SequenceEditor — Create/edit an email sequence with steps + enrollments.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, Mail, Users,
  Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { apiFetch } from '../../config/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Step {
  id?: string;
  stepOrder: number;
  delayDays: number;
  delayHours: number;
  sendTime: string;
  subject: string;
  htmlContent: string;
}

const TRIGGER_OPTIONS = [
  { value: 'signup', label: '👋 Inscription / Lead capturé', desc: "Envoi automatique dès qu'un contact rejoint votre liste (formulaire, widget, API)." },
  { value: 'manual', label: '▶️ Déclenchement manuel', desc: 'Vous choisissez quand lancer la séquence — idéal pour les relances ponctuelles.' },
  { value: 'date', label: '📅 Date spécifique', desc: "Planifiez en fonction d'une date : anniversaire, événement, expiration d'offre." },
  { value: 'purchase', label: '🛒 Après achat / conversion', desc: "Déclenche un email de suivi juste après qu'un client a acheté ou converti." },
  { value: 'inactivity', label: '😴 Inactivité (re-engagement)', desc: "Réactivez les contacts qui n'ont pas ouvert vos emails depuis X jours." },
];

// ── Tab button ─────────────────────────────────────────────────────────────────

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60'}`}
    >
      {label}
    </button>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────────

function StepCard({ step, index, onChange, onDelete }: {
  step: Step; index: number;
  onChange: (s: Partial<Step>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shrink-0">
            {index + 1}
          </div>
          <span className="font-semibold text-sm text-foreground">Étape {index + 1}</span>
        </div>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Delay */}
      <div className="flex items-center gap-2 flex-wrap">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">Envoyer après</span>
        <input
          type="number" min={0} value={step.delayDays}
          onChange={e => onChange({ delayDays: Number(e.target.value) })}
          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted-foreground">j</span>
        <input
          type="number" min={0} max={23} value={step.delayHours}
          onChange={e => onChange({ delayHours: Number(e.target.value) })}
          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted-foreground">h · à</span>
        <input
          type="time" value={step.sendTime}
          onChange={e => onChange({ sendTime: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Subject */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Objet *</label>
        <input
          type="text" value={step.subject} placeholder="Objet de l'email..."
          onChange={e => onChange({ subject: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* HTML content */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Contenu HTML *</label>
        <textarea
          rows={4} value={step.htmlContent}
          placeholder="<p>Bonjour, ...</p>"
          onChange={e => onChange({ htmlContent: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono resize-y"
        />
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────

interface Props {
  sequenceId: string | null;
  token: string;
  onBack: () => void;
  onDeleted: () => void;
}

export function SequenceEditor({ sequenceId, token, onBack, onDeleted }: Props) {
  const isNew = !sequenceId;
  const [tab, setTab] = useState<'settings' | 'steps' | 'enroll'>('settings');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Settings
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [sendgridKey, setSendgridKey] = useState('');

  // Steps
  const [steps, setSteps] = useState<Step[]>([]);

  // Enrollment
  const [enrollEmails, setEnrollEmails] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Load existing sequence
  useEffect(() => {
    if (!sequenceId) return;
    setLoading(true);
    Promise.all([
      apiFetch<any>(`/api/sequences/${sequenceId}/steps`, { method: 'GET', token }),
      apiFetch<any>(`/api/sequences/${sequenceId}/enrollments`, { method: 'GET', token }),
    ]).then(([stepsRes, enrollRes]) => {
      setSteps(((stepsRes as any).steps ?? []).map((s: any) => ({
        id: s.id, stepOrder: s.stepOrder, delayDays: s.delayDays, delayHours: s.delayHours,
        sendTime: s.sendTime ?? '09:00', subject: s.subject, htmlContent: s.htmlContent,
      })));
      setEnrollments((enrollRes as any).enrollments ?? []);
    }).catch(() => { }).finally(() => setLoading(false));
  }, [sequenceId, token]);

  const addStep = () => setSteps(prev => [
    ...prev, { stepOrder: prev.length, delayDays: prev.length === 0 ? 0 : 1, delayHours: 0, sendTime: '09:00', subject: '', htmlContent: '' },
  ]);

  const saveSettings = async () => {
    if (!name || !fromEmail) { toast.error('Nom et email expéditeur requis'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const res = await apiFetch<any>('/api/sequences', {
          method: 'POST', token,
          body: JSON.stringify({ name, triggerType, fromEmail, fromName, sendgridKey }),
        });
        toast.success('Séquence créée !');
        onBack();
        return;
      }
      await apiFetch(`/api/sequences/${sequenceId}`, {
        method: 'PATCH', token,
        body: JSON.stringify({ name, triggerType, fromEmail, fromName, ...(sendgridKey && sendgridKey !== '***' ? { sendgridKey } : {}) }),
      });

      // Save all steps
      for (const step of steps) {
        if (step.id) {
          await apiFetch(`/api/sequences/${sequenceId}/steps/${step.id}`, {
            method: 'PATCH', token,
            body: JSON.stringify({ subject: step.subject, htmlContent: step.htmlContent, delayDays: step.delayDays, delayHours: step.delayHours, sendTime: step.sendTime }),
          });
        } else {
          await apiFetch(`/api/sequences/${sequenceId}/steps`, {
            method: 'POST', token,
            body: JSON.stringify({ subject: step.subject, htmlContent: step.htmlContent, delayDays: step.delayDays, delayHours: step.delayHours, sendTime: step.sendTime, stepOrder: step.stepOrder }),
          });
        }
      }
      toast.success('Séquence sauvegardée !');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollEmails.trim()) return;
    const emails = enrollEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    setEnrolling(true);
    try {
      const res = await apiFetch<any>(`/api/sequences/${sequenceId}/enroll`, {
        method: 'POST', token,
        body: JSON.stringify({ contacts: emails.map(email => ({ email })) }),
      });
      toast.success(`${(res as any).enrolled ?? emails.length} contact(s) inscrit(s) !`);
      setEnrollEmails('');
      const er = await apiFetch<any>(`/api/sequences/${sequenceId}/enrollments`, { method: 'GET', token });
      setEnrollments((er as any).enrollments ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur d\'inscription');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <h1 className="text-xl font-black text-foreground">
            {isNew ? 'Nouvelle séquence' : name || 'Modifier la séquence'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          <Tab active={tab === 'settings'} onClick={() => setTab('settings')} label="⚙️ Paramètres" />
          {!isNew && <Tab active={tab === 'steps'} onClick={() => setTab('steps')} label={`📧 Étapes${steps.length ? ` (${steps.length})` : ''}`} />}
          {!isNew && <Tab active={tab === 'enroll'} onClick={() => setTab('enroll')} label={`👥 Inscrits${enrollments.length ? ` (${enrollments.length})` : ''}`} />}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Settings tab */}
            {tab === 'settings' && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Nom de la séquence *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bienvenue nouveaux clients"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Déclencheur</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TRIGGER_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setTriggerType(o.value)}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                            triggerType === o.value
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span className="text-sm font-bold leading-tight">{o.label}</span>
                          <span className="text-[11px] leading-relaxed opacity-80">{o.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email expéditeur *</label>
                    <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="hello@votredomaine.com"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Nom affiché</label>
                    <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Votre enseigne"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Clé API SendGrid</label>
                    <input type="password" value={sendgridKey} onChange={e => setSendgridKey(e.target.value)} placeholder="SG.xxx… (déjà configurée : laissez vide pour conserver)"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                  </div>
                </div>

                {isNew && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                    💡 Après création, ajoutez vos étapes dans l'onglet <strong className="text-foreground">Étapes</strong> puis inscrivez vos contacts dans <strong className="text-foreground">Inscrits</strong>.
                  </div>
                )}

                <button onClick={saveSettings} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm hover:opacity-90 transition-all disabled:opacity-50">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</> : <><Save size={14} /> {isNew ? 'Créer la séquence' : 'Sauvegarder'}</>}
                </button>
              </div>
            )}

            {/* Steps tab */}
            {tab === 'steps' && !isNew && (
              <div className="space-y-3">
                {steps.length === 0 && (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Aucune étape — ajoutez le premier email de la séquence.</p>
                  </div>
                )}
                {steps.map((step, i) => (
                  <StepCard
                    key={step.id ?? i} step={step} index={i}
                    onChange={patch => setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))}
                    onDelete={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
                <button onClick={addStep}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <Plus size={15} /> Ajouter une étape
                </button>
                {steps.length > 0 && (
                  <button onClick={saveSettings} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm hover:opacity-90 transition-all disabled:opacity-50">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</> : <><Save size={14} /> Sauvegarder les étapes</>}
                  </button>
                )}
              </div>
            )}

            {/* Enrollment tab */}
            {tab === 'enroll' && !isNew && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h3 className="font-bold text-sm text-foreground">Inscrire des contacts</h3>
                  <textarea rows={4} value={enrollEmails} onChange={e => setEnrollEmails(e.target.value)}
                    placeholder="email1@exemple.com&#10;email2@exemple.com&#10;email3@exemple.com"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={handleEnroll} disabled={enrolling || !enrollEmails.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    {enrolling ? <><Loader2 size={13} className="animate-spin" /> Inscription...</> : <><Users size={13} /> Inscrire</>}
                  </button>
                </div>

                {enrollments.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-bold text-sm text-foreground">{enrollments.length} contact{enrollments.length > 1 ? 's' : ''} inscrit{enrollments.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="divide-y divide-border max-h-72 overflow-y-auto">
                      {enrollments.slice(0, 50).map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.contactName || e.contactEmail}</p>
                            <p className="text-xs text-muted-foreground">{e.contactEmail}</p>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-xs text-muted-foreground">Étape {(e.currentStep ?? 0) + 1}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${e.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : e.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {e.status === 'active' ? 'Actif' : e.status === 'completed' ? 'Terminé' : e.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
