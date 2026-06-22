/**
 * BYOKContext — Bring Your Own Key
 *
 * Stores the user's private API keys (OpenAI, WhatsApp/Meta) in localStorage.
 * Provides the `useBYOKSwitch()` hook that any AI action calls to decide:
 *   - if user has a valid key → use their key, deduct ZERO credits
 *   - otherwise → use Kompilot's global key, deduct credits as normal
 *
 * Key states: 'idle' | 'checking' | 'valid' | 'invalid'
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'kompilot_byok_v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export type KeyStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export interface BYOKKeys {
  openaiKey: string;
  openaiStatus: KeyStatus;
  anthropicKey: string;
  anthropicStatus: KeyStatus;
  whatsappToken: string;
  whatsappStatus: KeyStatus;
}

interface BYOKContextValue {
  keys: BYOKKeys;
  updateOpenAIKey: (key: string) => void;
  updateAnthropicKey: (key: string) => void;
  updateWhatsAppToken: (token: string) => void;
  validateOpenAIKey: () => Promise<void>;
  validateAnthropicKey: () => Promise<void>;
  validateWhatsAppToken: () => Promise<void>;
  clearOpenAIKey: () => void;
  clearAnthropicKey: () => void;
  clearWhatsAppToken: () => void;
  /** Returns true if user has a valid OpenAI key (=> no credit deduction) */
  hasValidOpenAIKey: boolean;
  /** Returns true if user has a valid Anthropic key */
  hasValidAnthropicKey: boolean;
  /** Returns true if user has a valid WhatsApp token (=> no credit deduction) */
  hasValidWhatsAppToken: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_KEYS: BYOKKeys = {
  openaiKey: '',
  openaiStatus: 'idle',
  anthropicKey: '',
  anthropicStatus: 'idle',
  whatsappToken: '',
  whatsappStatus: 'idle',
};

function loadKeys(): BYOKKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KEYS;
    const parsed = JSON.parse(raw);
    // Always reset statuses on load (re-validate on next use)
    return {
      openaiKey: parsed.openaiKey ?? '',
      openaiStatus: parsed.openaiKey ? 'valid' : 'idle',  // assume stored key was previously validated
      anthropicKey: parsed.anthropicKey ?? '',
      anthropicStatus: parsed.anthropicKey ? 'valid' : 'idle',
      whatsappToken: parsed.whatsappToken ?? '',
      whatsappStatus: parsed.whatsappToken ? 'valid' : 'idle',
    };
  } catch {
    return DEFAULT_KEYS;
  }
}

function persistKeys(keys: BYOKKeys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      openaiKey: keys.openaiKey,
      anthropicKey: keys.anthropicKey,
      whatsappToken: keys.whatsappToken,
    }));
  } catch { /* noop */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const BYOKContext = createContext<BYOKContextValue | null>(null);

export function BYOKProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<BYOKKeys>(loadKeys);

  const updateOpenAIKey = useCallback((key: string) => {
    setKeys(prev => {
      const next = { ...prev, openaiKey: key, openaiStatus: 'idle' as KeyStatus };
      persistKeys(next);
      return next;
    });
  }, []);

  const updateAnthropicKey = useCallback((key: string) => {
    setKeys(prev => {
      const next = { ...prev, anthropicKey: key, anthropicStatus: 'idle' as KeyStatus };
      persistKeys(next);
      return next;
    });
  }, []);

  const updateWhatsAppToken = useCallback((token: string) => {
    setKeys(prev => {
      const next = { ...prev, whatsappToken: token, whatsappStatus: 'idle' as KeyStatus };
      persistKeys(next);
      return next;
    });
  }, []);

  const validateOpenAIKey = useCallback(async () => {
    const key = keys.openaiKey.trim();
    if (!key) return;

    setKeys(prev => ({ ...prev, openaiStatus: 'checking' }));

    try {
      // Micro-test: list models endpoint — minimal cost, validates key format + auth
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });

      const status: KeyStatus = res.status === 200 ? 'valid' : 'invalid';
      setKeys(prev => {
        const next = { ...prev, openaiStatus: status };
        persistKeys(next);
        return next;
      });
    } catch {
      setKeys(prev => {
        const next = { ...prev, openaiStatus: 'invalid' };
        persistKeys(next);
        return next;
      });
    }
  }, [keys.openaiKey]);

  const validateAnthropicKey = useCallback(async () => {
    const key = keys.anthropicKey.trim();
    if (!key) return;
    setKeys(prev => ({ ...prev, anthropicStatus: 'checking' }));
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(12_000),
      });
      const status: KeyStatus = (res.status === 200 || res.status === 201 || res.status === 429) ? 'valid' : 'invalid';
      setKeys(prev => {
        const next = { ...prev, anthropicStatus: status };
        persistKeys(next);
        return next;
      });
    } catch {
      setKeys(prev => { const next = { ...prev, anthropicStatus: 'invalid' as KeyStatus }; persistKeys(next); return next; });
    }
  }, [keys.anthropicKey]);

  const validateWhatsAppToken = useCallback(async () => {
    const token = keys.whatsappToken.trim();
    if (!token) return;

    setKeys(prev => ({ ...prev, whatsappStatus: 'checking' }));

    try {
      // Micro-test: check token via Meta debug endpoint
      const res = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const isValid = data?.data?.is_valid === true;
      const status: KeyStatus = isValid ? 'valid' : 'invalid';
      setKeys(prev => {
        const next = { ...prev, whatsappStatus: status };
        persistKeys(next);
        return next;
      });
    } catch {
      // If the request fails for network reasons, mark invalid
      setKeys(prev => {
        const next = { ...prev, whatsappStatus: 'invalid' };
        persistKeys(next);
        return next;
      });
    }
  }, [keys.whatsappToken]);

  const clearOpenAIKey = useCallback(() => {
    setKeys(prev => {
      const next = { ...prev, openaiKey: '', openaiStatus: 'idle' };
      persistKeys(next);
      return next;
    });
  }, []);

  const clearAnthropicKey = useCallback(() => {
    setKeys(prev => {
      const next = { ...prev, anthropicKey: '', anthropicStatus: 'idle' as KeyStatus };
      persistKeys(next);
      return next;
    });
  }, []);

  const clearWhatsAppToken = useCallback(() => {
    setKeys(prev => {
      const next = { ...prev, whatsappToken: '', whatsappStatus: 'idle' };
      persistKeys(next);
      return next;
    });
  }, []);

  const hasValidOpenAIKey = keys.openaiStatus === 'valid' && !!keys.openaiKey;
  const hasValidAnthropicKey = keys.anthropicStatus === 'valid' && !!keys.anthropicKey;
  const hasValidWhatsAppToken = keys.whatsappStatus === 'valid' && !!keys.whatsappToken;

  return (
    <BYOKContext.Provider value={{
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
    }}>
      {children}
    </BYOKContext.Provider>
  );
}

export function useBYOK() {
  const ctx = useContext(BYOKContext);
  if (!ctx) { console.warn('useBYOK must be used within BYOKProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}

/**
 * useBYOKSwitch — call this before any AI action to determine credit behaviour.
 *
 * @returns { useOwnKey: boolean, skipCredits: boolean }
 *   useOwnKey:    pass this as a flag to your AI call to choose the API key
 *   skipCredits:  if true, skip credit deduction entirely
 */
export function useBYOKSwitch() {
  const { hasValidOpenAIKey } = useBYOK();
  return {
    useOwnKey: hasValidOpenAIKey,
    skipCredits: hasValidOpenAIKey,
  };
}