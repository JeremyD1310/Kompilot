/**
 * AdvancedAPIKeysPanel — BYOK (Bring Your Own Key) configuration panel.
 * Available on Expert / Franchise plans.
 * Fields: OpenAI Private Key, Anthropic API Key, Meta Business WhatsApp Token.
 *
 * Each key has a "Tester la connexion" ping button that validates before saving.
 * Valid → green checkmark. Invalid → red border + copy-paste guidance.
 */
import { useState } from 'react';
import { toast } from '@blinkdotnew/ui';
import {
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Trash2,
  Shield, Zap, MessageCircle, Info, Lock, Unlock, Key, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBYOK, type KeyStatus } from '../../context/BYOKContext';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  APIKeyValidatorField,
  testOpenAIKey,
  testAnthropicKey,
  type ValidationStatus,
} from './APIKeyValidatorField';

// ── Existing status dot (kept for WhatsApp) ────────────────────────────────────

function StatusDot({ status, label }: { status: KeyStatus; label: string }) {
  if (status === 'checking') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <RefreshCw size={12} className="animate-spin" /> Vérification…
      </span>
    );
  }
  if (status === 'valid') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        🟢 Clé Active — {label} illimité
      </span>
    );
  }
  if (status === 'invalid') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        🔴 Erreur de configuration
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      Non configurée
    </span>
  );
}

// ── WhatsApp field (unchanged, no external ping available) ────────────────────

interface WhatsAppFieldProps {
  value: string;
  status: KeyStatus;
  onChange: (v: string) => void;
  onValidate: () => void;
  onClear: () => void;
  disabled?: boolean;
}

function WhatsAppField({ value, status, onChange, onValidate, onClear, disabled }: WhatsAppFieldProps) {
  const [visible, setVisible] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    onChange(localValue.trim());
    setTimeout(onValidate, 50);
  };

  return (
    <div className={cn('bg-card border border-border rounded-2xl overflow-hidden', disabled && 'opacity-50 pointer-events-none')}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <MessageCircle size={14} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Token WhatsApp Business (Meta)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pour l'envoi illimité de messages WhatsApp depuis votre compte Meta Business.</p>
        </div>
        <StatusDot status={status} label="WhatsApp" />
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={visible ? 'text' : 'password'}
              value={localValue}
              onChange={e => setLocalValue(e.target.value)}
              placeholder="EAABxx… (token Meta Business)"
              className="w-full pl-8 pr-10 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
            <button type="button" onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {visible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button onClick={handleSave} disabled={!localValue.trim() || status === 'checking'} className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-40">
            {status === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {status === 'checking' ? 'Test…' : 'Valider'}
          </button>
          {value && (
            <button onClick={onClear} className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-200 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
        {status === 'valid' && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Token actif — Envoi WhatsApp illimité ✅</p>
          </div>
        )}
        {status === 'invalid' && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 px-3 py-2.5">
            <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400">Token invalide — vérifiez votre compte Meta Business.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AdvancedAPIKeysPanel() {
  const {
    keys,
    updateOpenAIKey,
    updateAnthropicKey,
    updateWhatsAppToken,
    validateOpenAIKey,
    validateAnthropicKey,
    validateWhatsAppToken,
    clearOpenAIKey,
    clearAnthropicKey,
    clearWhatsAppToken,
    hasValidOpenAIKey,
    hasValidAnthropicKey,
    hasValidWhatsAppToken,
  } = useBYOK();

  const { currentPlan } = useSubscription();
  const isEligible = currentPlan.id === 'expert';

  // Wrap provider test functions to match APIKeyValidatorField signature
  const handleTestOpenAI = async (key: string): Promise<ValidationStatus> => {
    const result = await testOpenAIKey(key);
    return result;
  };

  const handleTestAnthropic = async (key: string): Promise<ValidationStatus> => {
    const result = await testAnthropicKey(key);
    return result;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-foreground">🔑 Clés API Propriétaires (BYOK)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intégrez vos propres clés API pour utiliser Kompilot sans consommer vos crédits — consommation illimitée, coût zéro pour vous.
          </p>
        </div>
      </div>

      {/* Eligibility gate */}
      {!isEligible && (
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-primary/5 dark:from-violet-950/20 dark:to-primary/5 border border-violet-200 dark:border-violet-800/50 p-5">
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground"> Disponible à partir de l'offre Expert / Franchise</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Le module BYOK est réservé aux offres Expert et Réseau/Franchise. Passez à l'offre supérieure pour intégrer vos propres clés OpenAI, Anthropic et Meta Business.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { icon: <Zap size={11} />, label: 'Crédits IA illimités' },
                  { icon: <MessageCircle size={11} />, label: 'WhatsApp illimité' },
                  { icon: <Unlock size={11} />, label: 'Coût IA = 0€ pour l\'éditeur' },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-full px-2.5 py-1">
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Comment fonctionne la validation en temps réel ?</p>
            <ul className="text-[11px] text-blue-600/90 dark:text-blue-400/80 space-y-1 leading-relaxed">
              <li><strong>Cliquez "Tester"</strong> pour valider votre clé avec un micro-appel API (1 token).</li>
              <li><strong>Clé valide 🟢</strong> : Coche verte + activation immédiate sans débit de crédits.</li>
              <li><strong>Clé invalide 🔴</strong> : Message d'aide explicite pour corriger le copier-coller.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* OpenAI key with real-time validator */}
      <div data-tour="api-keys">
        <APIKeyValidatorField
          label="Clé API OpenAI"
          provider="openai"
          placeholder="sk-proj-… ou sk-…"
          value={keys.openaiKey}
          status={keys.openaiStatus === 'valid' ? 'valid' : keys.openaiStatus === 'invalid' ? 'invalid' : keys.openaiStatus === 'checking' ? 'testing' : 'idle'}
          hint="Pour les générations de texte, suggestions IA, scripts vidéo et réponses automatiques."
          onChange={updateOpenAIKey}
          onValidate={handleTestOpenAI}
          onClear={() => { clearOpenAIKey(); toast.success('Clé OpenAI supprimée'); }}
          disabled={!isEligible}
        />
      </div>

      {/* Anthropic key with real-time validator */}
      <APIKeyValidatorField
        label="Clé API Anthropic (Claude)"
        provider="anthropic"
        placeholder="sk-ant-api03-…"
        value={keys.anthropicKey}
        status={keys.anthropicStatus === 'valid' ? 'valid' : keys.anthropicStatus === 'invalid' ? 'invalid' : keys.anthropicStatus === 'checking' ? 'testing' : 'idle'}
        hint="Pour les audits SEO structurés, la planification stratégique et les rapports G.E.O."
        onChange={updateAnthropicKey}
        onValidate={handleTestAnthropic}
        onClear={() => { clearAnthropicKey(); toast.success('Clé Anthropic supprimée'); }}
        disabled={!isEligible}
      />

      {/* WhatsApp token */}
      <WhatsAppField
        value={keys.whatsappToken}
        status={keys.whatsappStatus}
        onChange={updateWhatsAppToken}
        onValidate={validateWhatsAppToken}
        onClear={() => { clearWhatsAppToken(); toast.success('Token WhatsApp supprimé'); }}
        disabled={!isEligible}
      />

      {/* Summary */}
      {isEligible && (hasValidOpenAIKey || hasValidAnthropicKey || hasValidWhatsAppToken) && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 flex items-start gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">BYOK actif — Mode propriétaire activé ✅</p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500 mt-0.5">
              {hasValidOpenAIKey && 'OpenAI ✓ '}
              {hasValidAnthropicKey && 'Anthropic ✓ '}
              {hasValidWhatsAppToken && 'WhatsApp ✓ '}
              — Les actions correspondantes ne consomment aucun crédit Kompilot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
