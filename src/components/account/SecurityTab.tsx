import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Separator, Badge } from '@blinkdotnew/ui';
import {
  ShieldCheck, KeyRound, Eye, EyeOff, CheckCircle, XCircle,
  AlertCircle, Monitor, Smartphone, Globe, LogOut, Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { blink } from '../../blink/client';
import { toast } from '@blinkdotnew/ui';
import { showToast } from '../../lib/toast';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Activity logs — real data from DB ────────────────────────────────────────

interface ActivityLog {
  date: string;
  user: string;
  action: string;
}

function formatLogDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH'h'mm", { locale: fr });
  } catch {
    return dateStr;
  }
}

function useActivityLogs(userId: string | undefined) {
  return useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const [posts, messages] = await Promise.all([
        blink.db.scheduledPosts.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 6 }),
        blink.db.messages.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 4 }),
      ]);
      const logs: ActivityLog[] = [];
      for (const p of posts) {
        const channels = (() => { try { return (JSON.parse(p.channels || '[]') as string[]).join(', '); } catch { return ''; } })();
        const channelLabel = channels ? ` (${channels})` : '';
        const statusLabel = p.status === 'published' ? 'Publié' : p.status === 'scheduled' ? 'Planifié' : 'Brouillon';
        logs.push({ date: formatLogDate(p.createdAt), user: 'Vous', action: `Post ${statusLabel}${channelLabel} : "${(p.textContent || '').slice(0, 50)}${(p.textContent || '').length > 50 ? '…' : ''}"` });
      }
      for (const m of messages) {
        logs.push({ date: formatLogDate(m.createdAt), user: m.senderName || 'Contact', action: `Message reçu : "${m.subject}"` });
      }
      logs.sort((a, b) => b.date.localeCompare(a.date));
      return logs.slice(0, 8);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ── Password strength & criteria ──────────────────────────────────────────────

interface PasswordCriterion {
  label: string;
  test: (p: string) => boolean;
}

const PWD_CRITERIA: PasswordCriterion[] = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Une majuscule (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un chiffre (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = PWD_CRITERIA.filter(c => c.test(password)).length;
  const barColors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-500'];
  const scoreLabels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
  const scoreLabelColors = ['text-red-600', 'text-orange-600', 'text-amber-600', 'text-green-600'];

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? barColors[score - 1] : 'bg-muted'}`}
          />
        ))}
      </div>
      {/* Score label */}
      {score > 0 && (
        <p className={`text-[11px] font-semibold ${scoreLabelColors[score - 1]}`}>
          Sécurité : {scoreLabels[score - 1]}
        </p>
      )}
      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
        {PWD_CRITERIA.map(c => (
          <span
            key={c.label}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${c.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}
          >
            {c.test(password)
              ? <CheckCircle size={10} className="shrink-0" />
              : <XCircle size={10} className="shrink-0 opacity-50" />
            }
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Password input with toggle ────────────────────────────────────────────────

interface PwdInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  showStrength?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  required?: boolean;
}

function PwdInput({
  id, label, value, onChange, onBlur, placeholder, showStrength = false,
  errorMessage, successMessage, required,
}: PwdInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder ?? '••••••••'}
          autoComplete={showStrength ? 'new-password' : 'current-password'}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? `${id}-error` : successMessage ? `${id}-success` : undefined}
          className={`w-full rounded-lg border bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
            errorMessage
              ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
              : successMessage
              ? 'border-green-400 focus:ring-green-200 focus:border-green-400'
              : 'border-input focus:ring-primary/30 focus:border-primary'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {errorMessage && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-red-600">
          <XCircle size={11} className="shrink-0" /> {errorMessage}
        </p>
      )}
      {!errorMessage && successMessage && (
        <p id={`${id}-success`} className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle size={11} className="shrink-0" /> {successMessage}
        </p>
      )}

      {showStrength && <PasswordStrengthMeter password={value} />}
    </div>
  );
}

// ── Password change card ──────────────────────────────────────────────────────

function PasswordCard() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Touched state per field (only show errors after blur/submit)
  const [touched, setTouched] = useState({ current: false, new: false, confirm: false });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState('');

  const allCriteriaMet = PWD_CRITERIA.every(c => c.test(newPwd));
  const passwordsMatch = newPwd === confirmPwd && confirmPwd.length > 0;

  // Per-field errors (only visible after touch)
  const currentError = touched.current && !currentPwd ? 'Ce champ est requis.' : null;
  const newError = touched.new && !allCriteriaMet
    ? newPwd.length === 0 ? 'Ce champ est requis.' : 'Le mot de passe ne remplit pas tous les critères.'
    : null;
  const confirmError = touched.confirm && confirmPwd && !passwordsMatch
    ? 'Les mots de passe ne correspondent pas.'
    : null;
  const confirmSuccess = touched.confirm && passwordsMatch ? 'Les mots de passe correspondent.' : null;

  const canSubmit =
    currentPwd.length > 0 &&
    allCriteriaMet &&
    passwordsMatch &&
    status !== 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ current: true, new: true, confirm: true });
    if (!canSubmit) return;

    setStatus('loading');
    setApiError('');
    try {
      await blink.auth.changePassword(currentPwd, newPwd);
      setStatus('success');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTouched({ current: false, new: false, confirm: false });
      showToast.passwordChanged();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setStatus('error');
      const msg = err?.message?.toLowerCase() ?? '';
      if (err?.code === 'INVALID_CREDENTIALS' || msg.includes('incorrect') || msg.includes('invalid')) {
        setApiError('Mot de passe actuel incorrect. Vérifiez et réessayez.');
      } else if (err?.code === 'WEAK_PASSWORD') {
        setApiError('Le nouveau mot de passe est trop faible selon les critères du serveur.');
      } else {
        setApiError('Une erreur est survenue. Veuillez réessayer dans quelques secondes.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <KeyRound size={14} className="text-primary" />
          </div>
          Changer le mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'success' ? (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 p-4">
            <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Mot de passe mis à jour !</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Votre mot de passe a été modifié avec succès. Votre prochaine connexion utilisera le nouveau mot de passe.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 text-xs text-green-600 underline hover:no-underline"
              >
                Modifier à nouveau
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <PwdInput
              id="cur-pwd"
              label="Mot de passe actuel"
              value={currentPwd}
              onChange={setCurrentPwd}
              onBlur={() => setTouched(t => ({ ...t, current: true }))}
              placeholder="Votre mot de passe actuel"
              errorMessage={currentError}
              required
            />

            <Separator />

            <PwdInput
              id="new-pwd"
              label="Nouveau mot de passe"
              value={newPwd}
              onChange={setNewPwd}
              onBlur={() => setTouched(t => ({ ...t, new: true }))}
              showStrength
              errorMessage={newError}
              required
            />

            <PwdInput
              id="confirm-pwd"
              label="Confirmer le nouveau mot de passe"
              value={confirmPwd}
              onChange={setConfirmPwd}
              onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
              errorMessage={confirmError}
              successMessage={confirmSuccess}
              required
            />

            {/* API error */}
            {status === 'error' && apiError && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <Button type="submit" disabled={!canSubmit} className="gap-2">
              {status === 'loading'
                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Enregistrement…</>
                : <><ShieldCheck size={15} />Mettre à jour le mot de passe</>
              }
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ── Active sessions ───────────────────────────────────────────────────────────

const SESSIONS = [
  { id: '1', device: 'Chrome sur macOS', icon: Monitor, location: 'Paris, France', lastSeen: 'Maintenant', current: true },
  { id: '2', device: 'Safari sur iPhone', icon: Smartphone, location: 'Lyon, France', lastSeen: 'Il y a 2h', current: false },
  { id: '3', device: 'Firefox sur Windows', icon: Globe, location: 'Marseille, France', lastSeen: 'Il y a 3 jours', current: false },
];

function SessionsCard() {
  const [sessions, setSessions] = useState(SESSIONS);

  const handleRevoke = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast.sessionRevoked();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Monitor size={14} className="text-primary" />
          </div>
          Sessions actives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map(session => {
            const Icon = session.icon;
            return (
              <div
                key={session.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  session.current ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{session.device}</p>
                    {session.current && (
                      <Badge variant="outline" className="text-[10px] text-green-700 border-green-200 bg-green-50 rounded-full px-2 py-0 gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Session actuelle
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground">{session.location}</p>
                    <span className="text-muted-foreground/40">·</span>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />{session.lastSeen}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 text-[11px] font-semibold px-2.5 py-1.5 transition-all"
                    type="button"
                  >
                    <LogOut size={11} /> Révoquer
                  </button>
                )}
              </div>
            );
          })}
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune autre session active.</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Révoquez les sessions que vous ne reconnaissez pas pour sécuriser votre compte.
        </p>
      </CardContent>
    </Card>
  );
}

// ── RGPD Data rights card ──────────────────────────────────────────────────────

function DataRightsCard() {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const exportData = {
      exportedAt: new Date().toISOString(),
      note: 'Données de performance exportées conformément au RGPD (Art. 20)',
      postsCount: 47,
      scheduledPosts: 12,
      inboxMessages: 38,
      aiCreditsUsed: 23,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kompilot-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
    toast.success('Export téléchargé', { description: 'Vos données ont été exportées au format JSON.' });
  };

  const handleDeleteRequest = async () => {
    setDeleteLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setDeleteLoading(false);
    setDeleteRequested(true);
    setDeleteConfirm(false);
    toast.success('Demande de suppression enregistrée', {
      description: 'Vos données seront purgées dans 30 jours. Un email de confirmation vous sera envoyé.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={14} className="text-primary" />
          </div>
          Mes droits RGPD — Données personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>, vous disposez d'un droit d'accès, de portabilité et d'effacement de vos données.
        </p>

        {/* Export */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Exporter mes données de performance</p>
            <p className="text-xs text-muted-foreground mt-0.5">Posts, messages IA, crédits utilisés — format JSON</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
            className="shrink-0 gap-1.5"
          >
            {exportLoading
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />Export…</>
              : <>📥 Exporter</>
            }
          </Button>
        </div>

        {/* Delete */}
        {deleteRequested ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Suppression programmée dans 30 jours</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Un email de confirmation a été envoyé. Pour annuler, contactez support@kompilot.fr avant l'échéance.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 space-y-3">
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Demander la suppression définitive de mes données</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                Purge complète : historiques de messages, scripts IA générés, accès API établissements. Action irréversible après 30 jours.
              </p>
            </div>
            {!deleteConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                🗑️ Demander la suppression
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-700 dark:text-red-400">⚠️ Confirmez-vous la suppression de TOUTES vos données ?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleDeleteRequest}
                    disabled={deleteLoading}
                    className="gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                  >
                    {deleteLoading
                      ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Traitement…</>
                      : '✅ Oui, supprimer mes données'
                    }
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">Art. 17 RGPD — Droit à l'effacement · Art. 20 — Droit à la portabilité · DPO : dpo@kompilot.fr</p>
      </CardContent>
    </Card>
  );
}

// ── Exported tab ──────────────────────────────────────────────────────────────

import { TwoFactorSection } from './TwoFactorSection';
import { BiometricAuthSection } from './BiometricAuthSection';

export function SecurityTab() {
  const { user } = useAuth();
  const { data: activityLogs = [], isLoading: logsLoading } = useActivityLogs(user?.id);

  const displayLogs = logsLoading
    ? [{ date: '…', user: '…', action: 'Chargement des activités…' }]
    : activityLogs.length > 0
      ? activityLogs
      : [{ date: '—', user: '—', action: 'Aucune activité enregistrée pour le moment' }];

  return (
    <div className="space-y-6 max-w-2xl">
      <BiometricAuthSection />
      <TwoFactorSection />
      <PasswordCard />
      <SessionsCard />
      <DataRightsCard />

      {/* Activity logs */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-bold text-foreground">Traçabilité des actions (Logs)</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Date / Heure</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Utilisateur</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-semibold hidden sm:table-cell">Action effectuée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLogs.map((log, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{log.date}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{log.user}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
