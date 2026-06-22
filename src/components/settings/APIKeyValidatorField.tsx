/**
 * APIKeyValidatorField — Real-time API key validation with ping test
 *
 * Features:
 * - "Tester la connexion" button does a live minimal API call (1 token / list models)
 * - Valid key → green checkmark + "Connexion réussie avec succès"
 * - Invalid key (401/403) → red border + explicit copy-paste error message
 * - Blocks save until key passes validation
 */
import { useState, useCallback } from 'react';
import {
  Key, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle,
  Wifi, WifiOff, Trash2, AlertTriangle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ValidationStatus = 'idle' | 'testing' | 'valid' | 'invalid' | 'network_error';

export interface APIKeyFieldProps {
  label: string;
  provider: 'openai' | 'anthropic';
  placeholder: string;
  value: string;
  status: ValidationStatus;
  hint: string;
  onChange: (v: string) => void;
  onValidate: (key: string) => Promise<ValidationStatus>;
  onClear?: () => void;
  disabled?: boolean;
}

// ── Validation logic ──────────────────────────────────────────────────────────

export async function testOpenAIKey(key: string): Promise<ValidationStatus> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key.trim()}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 200) return 'valid';
    if (res.status === 401 || res.status === 403) return 'invalid';
    return 'invalid';
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return 'network_error';
    // CORS on some environments — fall through to invalid for safety
    return 'invalid';
  }
}

export async function testAnthropicKey(key: string): Promise<ValidationStatus> {
  try {
    // Anthropic minimal ping: create a 1-token message
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key.trim(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 200 || res.status === 201) return 'valid';
    if (res.status === 401 || res.status === 403) return 'invalid';
    // 429 = rate limit but key IS valid
    if (res.status === 429) return 'valid';
    return 'invalid';
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return 'network_error';
    return 'invalid';
  }
}

// ── Status indicator ──────────────────────────────────────────────────────────

function ValidationBadge({ status }: { status: ValidationStatus }) {
  if (status === 'idle') return null;

  if (status === 'testing') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <RefreshCw size={12} className="animate-spin" /> Test en cours…
      </span>
    );
  }
  if (status === 'valid') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <Wifi size={11} /> Connexion réussie avec succès ✓
      </span>
    );
  }
  if (status === 'invalid') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
        <WifiOff size={11} /> Clé invalide ou expirée
      </span>
    );
  }
  if (status === 'network_error') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
        <AlertTriangle size={11} /> Vérification impossible (réseau)
      </span>
    );
  }
  return null;
}

// ── Main field component ──────────────────────────────────────────────────────

export function APIKeyValidatorField({
  label, provider, placeholder, value, status, hint,
  onChange, onValidate, onClear, disabled,
}: APIKeyFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const [visible, setVisible] = useState(false);
  const [localStatus, setLocalStatus] = useState<ValidationStatus>(
    status === 'valid' && value ? 'valid' : 'idle'
  );

  const isDirty = localValue.trim() !== value.trim();

  const handleTest = useCallback(async () => {
    const key = localValue.trim();
    if (!key) return;
    setLocalStatus('testing');
    const result = await onValidate(key);
    setLocalStatus(result);
    if (result === 'valid') {
      onChange(key);
    }
  }, [localValue, onValidate, onChange]);

  const handleSave = async () => {
    const key = localValue.trim();
    if (!key) return;
    // Auto-test before saving
    if (localStatus !== 'valid' || isDirty) {
      setLocalStatus('testing');
      const result = await onValidate(key);
      setLocalStatus(result);
      if (result !== 'valid') return; // block save
      onChange(key);
    } else {
      onChange(key);
    }
  };

  const handleChange = (v: string) => {
    setLocalValue(v);
    if (localStatus === 'valid' || localStatus === 'invalid') {
      setLocalStatus('idle'); // reset validation on edit
    }
  };

  const canSave = localValue.trim().length > 10 && localStatus !== 'testing';
  const isValid = localStatus === 'valid';
  const isInvalid = localStatus === 'invalid';

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${
      isValid ? 'border-emerald-300 dark:border-emerald-700'
      : isInvalid ? 'border-red-300 dark:border-red-700'
      : 'border-border'
    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Key size={13} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{hint}</p>
        </div>
        <ValidationBadge status={localStatus} />
      </div>

      {/* Input row */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <div className={`relative flex-1 transition-all ${
            isInvalid ? 'ring-2 ring-red-400/40 rounded-xl' : isValid ? 'ring-2 ring-emerald-400/40 rounded-xl' : ''
          }`}>
            <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type={visible ? 'text' : 'password'}
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full pl-8 pr-10 py-2.5 text-sm rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono transition-colors ${
                isInvalid ? 'border-red-300 dark:border-red-700'
                : isValid ? 'border-emerald-300 dark:border-emerald-700'
                : 'border-border'
              }`}
            />
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {visible ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>

          {/* Test button */}
          <button
            onClick={handleTest}
            disabled={!localValue.trim() || localStatus === 'testing'}
            title="Tester la connexion à l'API"
            className={`flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 transition-all disabled:opacity-40 shrink-0 ${
              isValid
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                : isInvalid
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
            }`}
          >
            {localStatus === 'testing' ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : isValid ? (
              <CheckCircle2 size={12} />
            ) : (
              <Wifi size={12} />
            )}
            {localStatus === 'testing' ? 'Test…' : 'Tester'}
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || (localStatus !== 'valid' && localStatus !== 'idle')}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
          >
            <CheckCircle2 size={12} />
            Sauver
          </button>

          {value && onClear && (
            <button
              onClick={() => { onClear(); setLocalValue(''); setLocalStatus('idle'); }}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-200 transition-all shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Status banners */}
        {isValid && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Connexion réussie avec succès ✅
              </p>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500 mt-0.5">
                La clé {provider === 'openai' ? 'OpenAI' : 'Anthropic'} est active et fonctionnelle. Les crédits Kompilot ne seront pas consommés.
              </p>
            </div>
          </div>
        )}

        {isInvalid && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 px-3 py-2.5">
            <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                Clé invalide ou expirée
              </p>
              <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5 leading-snug">
                Veuillez vérifier que vous n'avez pas oublié de caractère lors du copier-coller.
                {provider === 'openai' && ' Les clés OpenAI commencent par "sk-proj-" ou "sk-".'}
                {provider === 'anthropic' && ' Les clés Anthropic commencent par "sk-ant-api03-".'}
              </p>
            </div>
          </div>
        )}

        {localStatus === 'network_error' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
              Impossible de contacter l'API (timeout ou problème réseau). Vérifiez votre connexion et réessayez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
