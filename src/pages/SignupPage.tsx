/**
 * SignupPage — Rebuilt with react-hook-form + zod.
 * Creates account via blink.auth.signUp() then redirects to /email-unverified.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm, Controller, type Control, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../context/UserProfileContext';
import { analyticsTrackSignup } from '../firebase/analytics';
import { SignupLogo } from '../components/auth/SignupLogo';
import { SiretSection } from '../components/auth/SiretSection';
import { SIGNUP_CSS } from '../components/auth/signupStyles';

/* ── Schema ─────────────────────────────────────────────────────────────────── */
const schema = z.object({
  firstName:       z.string().min(1, 'Prénom requis'),
  lastName:        z.string().min(1, 'Nom requis'),
  email:           z.string().email('Adresse e-mail invalide'),
  password:        z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Confirmez votre mot de passe'),
  profileType:     z.enum(['b2c', 'b2b'], { error: 'Sélectionnez un profil' }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

/* ── Small atoms ────────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p style={{ fontSize: '.7rem', color: '#f87171', marginTop: 4 }}>{message}</p>;
}

/* ── Controlled field wrapper ───────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  name: FieldPath<FormValues>;
  control: Control<FormValues>;
  error?: string;
  icon: ReactNode;
  children: (field: any) => ReactNode;
}
function Field({ label, name, control, error, icon, children }: FieldProps) {
  return (
    <div>
      <label className="nc-label">{label}</label>
      <Controller name={name} control={control} render={({ field }) => (
        <div style={{ position: 'relative' }}>
          <span className="field-icon">{icon}</span>
          {children(field)}
        </div>
      )} />
      <FieldError message={error} />
    </div>
  );
}

/* ── Password strength bar ──────────────────────────────────────────────────── */
function StrengthBar({ pw }: { pw: string }) {
  if (!pw) return null;
  const len = pw.length;
  const s = len >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4 : len >= 10 ? 3 : len >= 8 ? 2 : 1;
  const color = s >= 4 ? '#22C55E' : s >= 3 ? '#0D9488' : s >= 2 ? '#FBBF24' : '#EF4444';
  const hint = len < 8 ? `Encore ${8 - len} caractère${8 - len > 1 ? 's' : ''} minimum` : s >= 4 ? '✓ Fort' : '✓ Acceptable';
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < s ? color : 'rgba(255,255,255,.08)', transition: 'background .2s' }} />)}
      </div>
      <p style={{ fontSize: '.7rem', color: len >= 8 ? '#64748B' : '#EF4444', margin: 0 }}>{hint}</p>
    </div>
  );
}

/* ── SIRET helpers ──────────────────────────────────────────────────────────── */
const formatSiret = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return [d.slice(0,3), d.slice(3,6), d.slice(6,9), d.slice(9,14)].filter(Boolean).join(' ');
};

/* ══ Main page ═══════════════════════════════════════════════════════════════ */
export default function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { setProfile } = useUserProfile();
  const navigate = useNavigate();

  const [honeypot, setHoneypot]           = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError]     = useState('');
  const [submitError, setSubmitError]     = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [siret, setSiret]                 = useState('');
  const [siretChecking, setSiretChecking] = useState(false);
  const [siretValid, setSiretValid]       = useState(false);

  useEffect(() => { if (isAuthenticated) navigate({ to: '/dashboard' }); }, [isAuthenticated, navigate]);

  useEffect(() => {
    const digits = siret.replace(/\s/g, '');
    if (digits.length === 14) {
      setSiretChecking(true); setSiretValid(false);
      const t = setTimeout(() => { setSiretValid(true); setSiretChecking(false); }, 800);
      return () => clearTimeout(t);
    }
    setSiretValid(false); setSiretChecking(false);
  }, [siret]);

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', profileType: undefined },
  });

  const profileType = watch('profileType');
  const password    = watch('password');
  const canSubmit   = isValid && !submitting && (profileType !== 'b2b' || siretValid);

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleError(''); setGoogleLoading(true);
    try { await blink.auth.signInWithGoogle(); }
    catch (err: any) {
      const msg = (err?.message ?? '').toLowerCase();
      if (err?.code !== 'POPUP_CANCELED' && !msg.includes('cancel') && !msg.includes('closed'))
        setGoogleError('La connexion Google a échoué. Veuillez réessayer.');
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (honeypot || submitting) return;
    setSubmitError(''); setSubmitting(true);
    try {
      setProfile(data.profileType, data.profileType === 'b2b' ? siret.replace(/\s/g, '') : undefined);
      await blink.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        metadata: {
          displayName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
          profileType: data.profileType,
          ...(data.profileType === 'b2b' ? { siret: siret.replace(/\s/g, '') } : {}),
        },
      });
      analyticsTrackSignup('email');
      navigate({ to: '/email-unverified' });
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg  = (err?.message ?? '').toLowerCase();
      if (code === 'EMAIL_ALREADY_EXISTS' || msg.includes('already') || msg.includes('exists'))
        setSubmitError('Un compte avec cet email existe déjà. Connectez-vous ou utilisez un autre email.');
      else if (code === 'WEAK_PASSWORD' || msg.includes('weak') || msg.includes('password'))
        setSubmitError('Mot de passe trop faible. Utilisez au moins 8 caractères.');
      else setSubmitError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0B1120' }}>
      <Spinner size={36} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#0B1120', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{SIGNUP_CSS}</style>

      <Link to="/login" style={{ alignSelf: 'flex-start', width: '100%', maxWidth: 460, margin: '0 auto 16px', color: 'var(--muted-foreground, #64748B)', fontSize: '.82rem', textDecoration: 'none' }}>
        ← Se connecter
      </Link>

      <div className="su-card" style={{ width: '100%', maxWidth: 460, background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '40px 36px 36px', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><SignupLogo size={48} /></div>
          <h1 style={{ color: '#F8FAFC', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 6 }}>Créer votre compte</h1>
          <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.875rem', lineHeight: 1.55 }}>Déployez votre moteur de croissance en quelques minutes.</p>
        </div>

        {/* Google OAuth */}
        <div style={{ marginBottom: 20 }}>
          <button type="button" onClick={handleGoogle} disabled={googleLoading} className="hover:border-white/20 hover:text-slate-200"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 12, padding: '14px 0', color: '#CBD5E1', fontSize: '.92rem', fontWeight: 600, cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? 0.65 : 1, fontFamily: 'inherit', transition: 'all .2s' }}>
            {googleLoading ? <Spinner /> : <GoogleIcon />}
            {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
          </button>
          {googleError && <div style={{ marginTop: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '.8rem' }}>{googleError}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
            <span style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.75rem' }}>ou créez un compte</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Honeypot */}
          <input type="text" name="website_url" value={honeypot} onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prénom" name="firstName" control={control} error={errors.firstName?.message} icon={<User size={15} />}>
                {field => <input {...field} className="nc-field" type="text" placeholder="Marie" autoFocus />}
              </Field>
              <Field label="Nom" name="lastName" control={control} error={errors.lastName?.message} icon={<User size={15} />}>
                {field => <input {...field} className="nc-field" type="text" placeholder="Dupont" />}
              </Field>
            </div>

            {/* Email */}
            <Field label="Adresse e-mail" name="email" control={control} error={errors.email?.message} icon={<Mail size={15} />}>
              {field => <input {...field} className="nc-field" type="email" placeholder="marie@example.com" autoComplete="email" maxLength={254} />}
            </Field>

            {/* Password */}
            <div>
              <Field label="Mot de passe" name="password" control={control} error={errors.password?.message} icon={<Lock size={15} />}>
                {field => (
                  <>
                    <input {...field} type={showPw ? 'text' : 'password'} className="nc-field nc-field-pw" placeholder="8 caractères minimum" autoComplete="new-password" maxLength={128} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground, #64748B)', padding: 0, display: 'flex' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </>
                )}
              </Field>
              <StrengthBar pw={password} />
            </div>

            {/* Confirm password */}
            <Field label="Confirmer le mot de passe" name="confirmPassword" control={control} error={errors.confirmPassword?.message} icon={<Lock size={15} />}>
              {field => (
                <>
                  <input {...field} type={showConfirm ? 'text' : 'password'} className="nc-field nc-field-pw" placeholder="Répétez votre mot de passe" autoComplete="new-password" maxLength={128} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground, #64748B)', padding: 0, display: 'flex' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </>
              )}
            </Field>

            {/* Profile type */}
            <div>
              <label className="nc-label" style={{ marginBottom: 12 }}>Vous êtes…</label>
              <Controller name="profileType" control={control} render={({ field }) => (
                <div style={{ display: 'flex', gap: 12 }}>
                  {([['b2c', '🚀', 'Particulier', 'Créateur indépendant'], ['b2b', '💼', 'Entreprise', 'Commerçant / Artisan']] as const).map(([type, emoji, title, sub]) => (
                    <button key={type} type="button" className={`seg-btn${field.value === type ? ' active' : ''}`}
                      onClick={() => { field.onChange(type); if (type === 'b2c') { setSiret(''); setSiretValid(false); } }}>
                      {field.value === type && (
                        <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{emoji}</div>
                      <div style={{ color: field.value === type ? '#2DD4BF' : '#94A3B8', fontSize: '.78rem', fontWeight: 700, lineHeight: 1.4 }}>
                        {title}<br /><span style={{ color: field.value === type ? '#0D9488' : 'var(--muted-foreground, #64748B)', fontWeight: 500, fontSize: '.72rem' }}>{sub}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '.65rem', color: 'var(--muted-foreground, #64748B)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{type.toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              )} />
              <FieldError message={errors.profileType?.message} />
            </div>

            {/* SIRET (B2B only) */}
            {profileType === 'b2b' && (
              <SiretSection
                siret={siret} siretValid={siretValid} siretChecking={siretChecking}
                siretSearchMode={false} searchName="" searchCity="" searchResults={[]} searching={false} searchDone={false}
                onSiretChange={setSiret} onSearchNameChange={() => {}} onSearchCityChange={() => {}}
                onSearch={() => {}} onSelectResult={() => {}} onToggleSearchMode={() => {}} formatSiret={formatSiret}
              />
            )}

            {submitError && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '.8rem' }}>{submitError}</div>
            )}

            <button type="submit" className="submit-btn" disabled={!canSubmit}>
              {submitting ? <><Spinner />Création en cours…</> : 'Déployer mon moteur de croissance 🚀'}
            </button>

            <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.72rem', textAlign: 'center', lineHeight: 1.6 }}>
              En créant un compte, vous acceptez nos{' '}
              <Link to="/legal" style={{ color: '#0D9488', textDecoration: 'none' }}>Mentions légales</Link>{' '}
              et notre{' '}
              <Link to="/privacy" style={{ color: '#0D9488', textDecoration: 'none' }}>Politique de confidentialité</Link>.
            </p>
          </div>
        </form>
      </div>

      <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.82rem', marginTop: 22 }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
      </p>
    </div>
  );
}
