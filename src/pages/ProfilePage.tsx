import { useState } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardHeader, CardTitle, CardContent,
  Button, Separator, Badge,
} from '@blinkdotnew/ui';
import {
  User, KeyRound, Eye, EyeOff, CheckCircle,
  XCircle, AlertCircle, ShieldCheck, Mail,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { blink } from '../blink/client';

/* ── Password strength indicator ─────────────────────────────────────── */
const CRITERIA = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /[0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = CRITERIA.filter(c => c.test(password)).length;
  const barColors = ['bg-red-400', 'bg-amber-400', 'bg-green-500'];
  const scoreLabels = ['Faible', 'Moyen', 'Fort'];
  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? barColors[score - 1] : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {CRITERIA.map(c => (
            <span key={c.label} className={`flex items-center gap-1 text-[11px] ${c.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
              {c.test(password) ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[11px] font-semibold ${score === 3 ? 'text-green-600' : score === 2 ? 'text-amber-600' : 'text-red-600'}`}>
            {scoreLabels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Password input with show/hide toggle ─────────────────────────────── */
function PasswordInput({
  id, label, value, onChange, placeholder, showStrength = false,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {showStrength && <PasswordStrength password={value} />}
    </div>
  );
}

/* ── Avatar with initials ─────────────────────────────────────────────── */
function UserAvatar({ email, displayName }: { email?: string; displayName?: string }) {
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : email
      ? email[0].toUpperCase()
      : 'U';

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 text-primary text-2xl font-bold shrink-0">
      {initials}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuth();

  /* Password change state */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwdError, setPwdError] = useState('');

  const isNewStrong = CRITERIA.every(c => c.test(newPwd));
  const passwordsMatch = newPwd === confirmPwd;
  const canSubmit =
    currentPwd.length > 0 &&
    isNewStrong &&
    confirmPwd.length > 0 &&
    passwordsMatch &&
    pwdStatus !== 'loading';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setPwdStatus('loading');
    setPwdError('');

    try {
      await blink.auth.changePassword(currentPwd, newPwd);
      setPwdStatus('success');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      // Reset success badge after 4s
      setTimeout(() => setPwdStatus('idle'), 4000);
    } catch (err: any) {
      setPwdStatus('error');
      if (err?.code === 'INVALID_CREDENTIALS' || err?.message?.toLowerCase().includes('incorrect') || err?.message?.toLowerCase().includes('invalid')) {
        setPwdError('Mot de passe actuel incorrect.');
      } else if (err?.code === 'WEAK_PASSWORD') {
        setPwdError('Le nouveau mot de passe est trop faible.');
      } else {
        setPwdError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <Page>
      <PageHeader>
        <PageTitle>Mon profil</PageTitle>
        <PageDescription>Consultez vos informations et modifiez votre mot de passe.</PageDescription>
      </PageHeader>

      <PageBody className="space-y-6 max-w-2xl">

        {/* ── Identity card ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-5">
              <UserAvatar email={user?.email} displayName={user?.displayName ?? undefined} />
              <div className="flex-1 space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Mail size={11} /> Adresse email
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
                    {user?.emailVerified ? (
                      <Badge variant="outline" className="gap-1 text-[10px] text-green-700 border-green-200 bg-green-50 rounded-full px-2 py-0">
                        <CheckCircle size={9} /> Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] text-amber-700 border-amber-200 bg-amber-50 rounded-full px-2 py-0">
                        <AlertCircle size={9} /> Non vérifié
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Display name (if set) */}
                {user?.displayName && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Nom d'affichage
                    </p>
                    <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                  </div>
                )}

                {/* Member since */}
                {memberSince && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Membre depuis
                    </p>
                    <p className="text-sm text-foreground">{memberSince}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Password change ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={14} className="text-primary" />
              </div>
              Changer le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pwdStatus === 'success' ? (
              <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-100 p-4">
                <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Mot de passe mis à jour !</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Votre mot de passe a été modifié avec succès.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <PasswordInput
                  id="current-password"
                  label="Mot de passe actuel"
                  value={currentPwd}
                  onChange={setCurrentPwd}
                  placeholder="Votre mot de passe actuel"
                />

                <Separator />

                <PasswordInput
                  id="new-password"
                  label="Nouveau mot de passe"
                  value={newPwd}
                  onChange={setNewPwd}
                  showStrength
                />

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full rounded-lg border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                        confirmPwd && !passwordsMatch
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                          : confirmPwd && passwordsMatch
                            ? 'border-green-400 focus:border-green-400 focus:ring-green-200'
                            : 'border-input focus:border-primary'
                      }`}
                    />
                  </div>
                  {confirmPwd && !passwordsMatch && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <XCircle size={11} /> Les mots de passe ne correspondent pas.
                    </p>
                  )}
                  {confirmPwd && passwordsMatch && (
                    <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <CheckCircle size={11} /> Les mots de passe correspondent.
                    </p>
                  )}
                </div>

                {pwdStatus === 'error' && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                    <p className="text-xs text-red-700">{pwdError}</p>
                  </div>
                )}

                <div className="pt-1">
                  <Button type="submit" disabled={!canSubmit} className="gap-2">
                    {pwdStatus === 'loading' ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </Page>
  );
}
