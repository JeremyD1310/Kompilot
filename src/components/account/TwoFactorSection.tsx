/**
 * Two-factor authentication (TOTP) section.
 * Simulates a real TOTP setup flow: QR scan → verify code → backup codes.
 * State is persisted to localStorage. Any valid 6-digit code is accepted (demo mode).
 */
import { useState, useEffect, useRef } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import {
  ShieldCheck, ShieldOff, Smartphone, Copy, Check, ChevronRight,
  RefreshCw, AlertTriangle, Eye, EyeOff, Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// ── Storage ───────────────────────────────────────────────────────────────────

const TFA_ENABLED_KEY = 'nc_2fa_enabled';
const TFA_SECRET_KEY  = 'nc_2fa_secret';
const TFA_CODES_KEY   = 'nc_2fa_backup_codes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatSecret(s: string): string {
  return s.match(/.{1,4}/g)?.join(' ') ?? s;
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const a = Math.random().toString(36).slice(2, 6).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${a}-${b}`;
  });
}

function getQrUrl(email: string, secret: string) {
  const label = encodeURIComponent(`Kompilot:${email}`);
  const params = encodeURIComponent(`otpauth://totp/${label}?secret=${secret}&issuer=Kompilot`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${params}`;
}

// ── Copy-to-clipboard button ──────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0">
      {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
    </button>
  );
}

// ── 6-digit code input ────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, '');
    if (!d) { onChange(value.slice(0, i) + value.slice(i + 1)); return; }
    const next = digits.slice();
    next[i] = d[0];
    onChange(next.join('').replace(/ /g, ''));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    refs[Math.min(text.length, 5)].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {refs.map((ref, i) => (
        <input
          key={i} ref={ref} type="text" inputMode="numeric" maxLength={1}
          value={digits[i]?.trim() || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      ))}
    </div>
  );
}

// ── Setup wizard ──────────────────────────────────────────────────────────────

type SetupStep = 'scan' | 'verify' | 'backup';

function SetupWizard({ email, secret, onComplete, onCancel }: {
  email: string; secret: string;
  onComplete: (codes: string[]) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<SetupStep>('scan');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [backupCodes] = useState(() => generateBackupCodes());
  const [codesRevealed, setCodesRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleVerify = () => {
    if (code.length !== 6) { setCodeError('Entrez un code à 6 chiffres.'); return; }
    setCodeError('');
    setStep('backup');
  };

  const handleFinish = () => {
    if (!confirmed) return;
    onComplete(backupCodes);
  };

  const STEPS: { key: SetupStep; label: string }[] = [
    { key: 'scan', label: 'Scanner' },
    { key: 'verify', label: 'Vérifier' },
    { key: 'backup', label: 'Codes de secours' },
  ];

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-0 justify-center">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-0">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              step === s.key ? 'bg-primary text-primary-foreground' :
              STEPS.findIndex(x => x.key === step) > i ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {STEPS.findIndex(x => x.key === step) > i ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium mx-1.5 ${step === s.key ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Scan QR */}
      {step === 'scan' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Scannez ce QR code</p>
            <p className="text-xs text-muted-foreground">Ouvrez Google Authenticator, Authy ou 1Password et scannez le code ci-dessous.</p>
          </div>
          <div className="flex justify-center">
            <div className="rounded-2xl border-2 border-border bg-white p-3 shadow-sm">
              <img src={getQrUrl(email, secret)} alt="QR code 2FA" width={180} height={180} className="rounded-lg" />
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ou entrez la clé manuellement</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs font-mono text-foreground tracking-widest break-all leading-relaxed">{formatSecret(secret)}</code>
              <CopyButton text={secret} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
            <Button size="sm" onClick={() => setStep('verify')} className="gap-1.5">
              Suivant <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Confirmez votre application</p>
            <p className="text-xs text-muted-foreground">Entrez le code à 6 chiffres affiché dans votre application d'authentification.</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm">💡</span>
            <p className="text-xs text-amber-800">Mode démo : entrez n'importe quel code à 6 chiffres pour continuer.</p>
          </div>
          <OtpInput value={code} onChange={v => { setCode(v); setCodeError(''); }} />
          {codeError && <p className="text-xs text-red-600 text-center">{codeError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setStep('scan')}>Retour</Button>
            <Button size="sm" onClick={handleVerify} disabled={code.length !== 6} className="gap-1.5">
              Vérifier <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Backup codes */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Codes de secours</p>
            <p className="text-xs text-muted-foreground">Sauvegardez ces codes. Chacun peut être utilisé une fois si vous perdez l'accès à votre application.</p>
          </div>
          <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className={`grid grid-cols-2 gap-1.5 p-4 ${!codesRevealed ? 'blur-sm select-none' : ''}`}>
              {backupCodes.map(c => (
                <code key={c} className="text-xs font-mono text-center bg-background border border-border rounded-lg py-1.5 px-2 text-foreground">{c}</code>
              ))}
            </div>
            {!codesRevealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="sm" variant="outline" onClick={() => setCodesRevealed(true)} className="gap-1.5 bg-background shadow-md">
                  <Eye size={13} /> Révéler les codes
                </Button>
              </div>
            )}
          </div>
          {codesRevealed && (
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span className="text-xs text-foreground">J'ai sauvegardé mes codes de secours</span>
              </label>
              <CopyButton text={backupCodes.join('\n')} />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setStep('verify')}>Retour</Button>
            <Button size="sm" onClick={handleFinish} disabled={!confirmed || !codesRevealed} className="gap-1.5 bg-green-600 hover:bg-green-700">
              <ShieldCheck size={14} /> Activer la 2FA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main exported section ─────────────────────────────────────────────────────

export function TwoFactorSection() {
  const { user } = useAuth();
  const email = user?.email ?? 'user@example.com';

  const [enabled, setEnabled] = useState(() => localStorage.getItem(TFA_ENABLED_KEY) === 'true');
  const [secret]  = useState(() => localStorage.getItem(TFA_SECRET_KEY) || generateSecret());
  const [backupCodes, setBackupCodes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(TFA_CODES_KEY) ?? '[]'); } catch { return []; }
  });
  const [showSetup, setShowSetup]   = useState(false);
  const [showCodes, setShowCodes]   = useState(false);
  const [disabling, setDisabling]   = useState(false);

  // Persist secret across renders
  useEffect(() => { localStorage.setItem(TFA_SECRET_KEY, secret); }, [secret]);

  const handleSetupComplete = (codes: string[]) => {
    setEnabled(true);
    setBackupCodes(codes);
    setShowSetup(false);
    localStorage.setItem(TFA_ENABLED_KEY, 'true');
    localStorage.setItem(TFA_CODES_KEY, JSON.stringify(codes));
    toast.success('2FA activée avec succès ! 🔐', { description: 'Votre compte est maintenant protégé par une double authentification.' });
  };

  const handleDisable = () => {
    setEnabled(false);
    setDisabling(false);
    setBackupCodes([]);
    localStorage.setItem(TFA_ENABLED_KEY, 'false');
    localStorage.removeItem(TFA_CODES_KEY);
    toast.success('2FA désactivée.', { description: 'La double authentification a été retirée de votre compte.' });
  };

  const handleRegenCodes = () => {
    const codes = generateBackupCodes();
    setBackupCodes(codes);
    setShowCodes(true);
    localStorage.setItem(TFA_CODES_KEY, JSON.stringify(codes));
    toast.success('Nouveaux codes de secours générés !');
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${enabled ? 'bg-green-100' : 'bg-muted'}`}>
          <ShieldCheck size={17} className={enabled ? 'text-green-600' : 'text-muted-foreground'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">Double authentification (2FA)</p>
            {enabled
              ? <Badge className="text-[10px] py-0 gap-1 bg-green-100 text-green-700 border-green-200 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Activée</Badge>
              : <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground rounded-full">Désactivée</Badge>
            }
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled ? 'Votre compte est protégé par une application d\'authentification.' : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* Setup wizard (inline) */}
        {showSetup && !enabled && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-5">
            <SetupWizard email={email} secret={secret} onComplete={handleSetupComplete} onCancel={() => setShowSetup(false)} />
          </div>
        )}

        {/* Disabled state — not in setup */}
        {!enabled && !showSetup && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '🔐', title: 'Application TOTP', desc: 'Google Authenticator, Authy, 1Password' },
                { icon: '⚡', title: 'Connexion rapide', desc: 'Code renouvelé toutes les 30 secondes' },
                { icon: '🛡️', title: 'Protection renforcée', desc: 'Protège même si votre mot de passe est compromis' },
              ].map(f => (
                <div key={f.title} className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{f.icon}</span>
                    <p className="text-xs font-semibold text-foreground">{f.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setShowSetup(true)} className="gap-2">
              <Smartphone size={15} /> Configurer l'application d'authentification
            </Button>
          </div>
        )}

        {/* Enabled state */}
        {enabled && (
          <div className="space-y-4">

            {/* Method summary */}
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <Smartphone size={18} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Application d'authentification</p>
                <p className="text-xs text-green-700">Google Authenticator, Authy, 1Password, etc.</p>
              </div>
              <Check size={16} className="text-green-600 shrink-0" strokeWidth={2.5} />
            </div>

            {/* Backup codes */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Codes de secours</p>
                  <p className="text-[11px] text-muted-foreground">{backupCodes.length} codes disponibles</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowCodes(v => !v)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    {showCodes ? <EyeOff size={12} /> : <Eye size={12} />} {showCodes ? 'Masquer' : 'Voir'}
                  </button>
                  <button onClick={handleRegenCodes} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <RefreshCw size={11} /> Regénérer
                  </button>
                </div>
              </div>
              {showCodes && backupCodes.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 p-4">
                  {backupCodes.map(c => (
                    <code key={c} className="text-xs font-mono text-center bg-background border border-border rounded-lg py-1.5 px-2 text-foreground">{c}</code>
                  ))}
                </div>
              )}
            </div>

            {/* Disable */}
            {!disabling ? (
              <button
                onClick={() => setDisabling(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 transition-colors"
              >
                <ShieldOff size={12} /> Désactiver la 2FA
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Désactiver la 2FA ?</p>
                    <p className="text-xs text-red-700 mt-0.5">Cette action supprimera la protection supplémentaire de votre compte.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDisabling(false)}>Annuler</Button>
                  <Button size="sm" variant="destructive" onClick={handleDisable} className="gap-1.5">
                    <Lock size={12} /> Oui, désactiver
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
