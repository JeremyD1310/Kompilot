// Persistent billing storage using localStorage

// ── User-scoped key helper ────────────────────────────────────────────────────
// All user-sensitive keys are prefixed with the userId to prevent cross-user
// data leakage when multiple accounts share the same browser.

let _activeUserId: string | null = null;

/** Call this immediately after auth state resolves (useAuth hook). */
export function setActiveUserId(id: string | null): void {
  _activeUserId = id;
}

/** Builds a scoped key: <prefix>_<userId> or <prefix>_anon when no user. */
function scopedKey(prefix: string): string {
  return _activeUserId ? `${prefix}_${_activeUserId}` : `${prefix}_anon`;
}

// ── Invoice storage ───────────────────────────────────────────────────────────

export interface StoredInvoice {
  id: string;
  number: string;
  date: string;
  description: string;
  amountHT: number;
  tvaRate: number;
  paymentMethod?: 'card' | 'sepa';
}

const KEY = 'kompilot_invoices';

export function getStoredInvoices(): StoredInvoice[] {
  try { return JSON.parse(localStorage.getItem(scopedKey(KEY)) || '[]'); }
  catch { return []; }
}

export function addStoredInvoice(
  description: string,
  amountHT: number,
  paymentMethod: 'card' | 'sepa' = 'card',
): StoredInvoice {
  const invoices = getStoredInvoices();
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(invoices.length + 1).padStart(3, '0');
  const invoice: StoredInvoice = {
    id: `dyn-${Date.now()}`,
    number: `NC-${year}-${month}-${seq}`,
    date: new Date().toLocaleDateString('fr-FR'),
    description,
    amountHT: parseFloat(amountHT.toFixed(2)),
    tvaRate: 20,
    paymentMethod,
  };
  localStorage.setItem(scopedKey(KEY), JSON.stringify([invoice, ...invoices]));
  return invoice;
}

// ── Active payment method ─────────────────────────────────────────────────────

export interface ActivePaymentMethod {
  type: 'card' | 'sepa';
  /** Display label, ex: "Carte Visa finissant par 4242" */
  label: string;
  /** Raw masked value for BillingTab display */
  raw?: string;
}

const PM_KEY = 'kompilot_active_payment_method';

/** Default demo method shown before any real payment */
const DEFAULT_PAYMENT_METHOD: ActivePaymentMethod = {
  type: 'card',
  label: 'Carte Visa finissant par 4242',
  raw: '•••• •••• •••• 4242',
};

export function getActivePaymentMethod(): ActivePaymentMethod {
  try {
    const stored = localStorage.getItem(scopedKey(PM_KEY));
    return stored ? JSON.parse(stored) : DEFAULT_PAYMENT_METHOD;
  } catch {
    return DEFAULT_PAYMENT_METHOD;
  }
}

export function setActivePaymentMethod(method: ActivePaymentMethod): void {
  localStorage.setItem(scopedKey(PM_KEY), JSON.stringify(method));
}

/** Build a payment method from card number (last 4 digits) */
export function buildCardPaymentMethod(cardNumber: string): ActivePaymentMethod {
  const digits = cardNumber.replace(/\s/g, '');
  const last4 = digits.slice(-4);
  const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Carte';
  return {
    type: 'card',
    label: `Carte ${brand} finissant par ${last4}`,
    raw: `•••• •••• •••• ${last4}`,
  };
}

/** Build a payment method from IBAN */
export function buildSepaPaymentMethod(iban: string): ActivePaymentMethod {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  // Show first 4 + last 4, mask the middle
  const display = clean.length > 8
    ? `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`
    : clean;
  return {
    type: 'sepa',
    label: `Compte SEPA ${display}`,
    raw: display,
  };
}

// ── Payment failure state ─────────────────────────────────────────────────────

const PF_KEY = 'kompilot_payment_failed';

/** Returns true if a simulated payment failure is active */
export function getPaymentFailed(): boolean {
  return localStorage.getItem(scopedKey(PF_KEY)) === 'true';
}

export function setPaymentFailed(failed: boolean): void {
  if (failed) {
    localStorage.setItem(scopedKey(PF_KEY), 'true');
  } else {
    localStorage.removeItem(scopedKey(PF_KEY));
  }
}

// ── Subscription status (synced from backend + stored locally) ────────────────

export type SubscriptionStatus =
  | 'active'
  | 'payment_failed'
  | 'grace'
  | 'cancelled'
  | 'unpaid';

const SS_KEY  = 'kompilot_subscription_status';
const GP_KEY  = 'kompilot_grace_period_end';

export function getSubscriptionStatus(): SubscriptionStatus {
  return (localStorage.getItem(scopedKey(SS_KEY)) as SubscriptionStatus)
    || (localStorage.getItem(SS_KEY) as SubscriptionStatus)  // legacy fallback
    || 'active';
}

export function setSubscriptionStatus(status: SubscriptionStatus): void {
  localStorage.setItem(scopedKey(SS_KEY), status);
  // Keep legacy key in sync for any code not yet migrated
  localStorage.setItem(SS_KEY, status);
}

export function getGracePeriodEnd(): Date | null {
  const stored = localStorage.getItem(scopedKey(GP_KEY))
    ?? localStorage.getItem(GP_KEY);  // legacy fallback
  return stored ? new Date(stored) : null;
}

export function setGracePeriodEnd(date: Date | null): void {
  if (date) {
    localStorage.setItem(scopedKey(GP_KEY), date.toISOString());
    localStorage.setItem(GP_KEY, date.toISOString());
  } else {
    localStorage.removeItem(scopedKey(GP_KEY));
    localStorage.removeItem(GP_KEY);
  }
}

/**
 * Returns false when the subscription is cancelled or unpaid and the grace
 * period has expired — signals that background AI tasks should be halted.
 */
export function isAgentEnabled(): boolean {
  const status = getSubscriptionStatus();
  if (status === 'active' || status === 'payment_failed' || status === 'grace') return true;
  if (status === 'cancelled' || status === 'unpaid') {
    const graceEnd = getGracePeriodEnd();
    return !!(graceEnd && graceEnd > new Date());
  }
  return true;
}

// ── Accountant automation settings ───────────────────────────────────────────

const ACCT_KEY = 'kompilot_accountant';

interface AccountantSettings {
  autoSend: boolean;
  email: string;
}

export function getAccountantSettings(): AccountantSettings {
  try {
    const stored = localStorage.getItem(scopedKey(ACCT_KEY));
    return stored ? JSON.parse(stored) : { autoSend: false, email: '' };
  } catch {
    return { autoSend: false, email: '' };
  }
}

export function setAccountantSettings(settings: AccountantSettings): void {
  localStorage.setItem(scopedKey(ACCT_KEY), JSON.stringify(settings));
}

/**
 * Clear all scoped billing data for the given userId (call on logout).
 * Also removes legacy unscoped keys to prevent cross-session data leaks.
 */
export function clearBillingStorageForUser(userId: string | null): void {
  const uid = userId ?? _activeUserId;
  // All billing keys — both scoped (per-user) and legacy global keys
  const keys = [
    'kompilot_plan', 'kompilot_subscription_status', 'kompilot_grace_period_end',
    'kompilot_payment_failed', 'kompilot_active_payment_method',
    'kompilot_invoices', 'kompilot_accountant',
    'kompilot_trial_end', 'kompilot_credits_balance',
  ];
  for (const k of keys) {
    try {
      // Remove user-scoped variant (if uid is known)
      if (uid) localStorage.removeItem(`${k}_${uid}`);
      // Also remove legacy unscoped variant (pre-scoping migration)
      localStorage.removeItem(k);
    } catch { /* noop — incognito strict mode */ }
  }
  // Clear the plan key unconditionally (no scoping on this one)
  try { localStorage.removeItem('kompilot_plan'); } catch { /* noop */ }
}