import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ── IBAN helpers ──────────────────────────────────────────────────────────────

/** Strip spaces and convert to uppercase */
const rawIBAN = (v: string) => v.replace(/\s/g, '').toUpperCase();

/** Format IBAN with a space every 4 chars */
const formatIBAN = (v: string): string => {
  const clean = rawIBAN(v).replace(/[^A-Z0-9]/g, '');
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
};

/** Validate IBAN: 2 letter country, 2 check digits, 11–30 alphanumeric chars */
function validateIBAN(v: string): 'valid' | 'invalid' | 'empty' {
  const iban = rawIBAN(v);
  if (!iban) return 'empty';
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return 'invalid';
  // Basic length check per country (FR = 27)
  const LENGTHS: Record<string, number> = { FR: 27, DE: 22, ES: 24, IT: 27, BE: 16, CH: 21, GB: 22, NL: 18 };
  const country = iban.slice(0, 2);
  if (LENGTHS[country] && iban.length !== LENGTHS[country]) return 'invalid';
  return 'valid';
}

/** BIC/SWIFT: 8 or 11 alphanumeric chars */
const validateBIC = (v: string) => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(v.trim());

// ── Sub-components ────────────────────────────────────────────────────────────

function SecurityBadges() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
        <Lock size={9} className="shrink-0" /> Connexion chiffrée SSL 🔒
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#635BFF]/8 border border-[#635BFF]/20 px-2.5 py-1 text-[10px] font-semibold text-[#635BFF]">
        <svg height="11" viewBox="0 0 60 25" fill="none" className="shrink-0">
          <text x="0" y="18" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="18" fill="#635BFF">stripe</text>
        </svg>
        Propulsé par Stripe.net 💳
      </span>
    </div>
  );
}

function FrenchBankBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
    >
      🇫🇷 Banque Française
    </motion.span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SEPAFormProps {
  priceTTC: string;
  /** Called on success in payment mode */
  onSuccess?: () => void;
  /** Called on success in update mode — passes back the raw IBAN */
  onSuccessWithIban?: (iban: string) => void;
  disabled?: boolean;
  /** 'payment' = subscription purchase (default) | 'update' = just save method */
  mode?: 'payment' | 'update';
}

// ── Main component ────────────────────────────────────────────────────────────

export function SEPAForm({
  priceTTC,
  onSuccess,
  onSuccessWithIban,
  disabled = false,
  mode = 'payment',
}: SEPAFormProps) {
  const [holder, setHolder] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [mandateChecked, setMandateChecked] = useState(false);
  const [touched, setTouched] = useState({ iban: false, bic: false, holder: false });
  const [phase, setPhase] = useState<'idle' | 'processing' | 'done'>('idle');

  const ibanStatus = validateIBAN(iban);
  const bicValid = validateBIC(bic);
  const holderValid = holder.trim().length > 1;
  const isFrench = rawIBAN(iban).startsWith('FR');

  // In update mode, mandate checkbox is optional
  const canConfirm =
    holderValid &&
    ibanStatus === 'valid' &&
    bicValid &&
    (mode === 'update' || mandateChecked) &&
    !disabled &&
    phase === 'idle';

  const handleIBANChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIBAN(e.target.value);
    // Cap at 42 chars (max IBAN 34 + spaces)
    if (formatted.length <= 42) setIban(formatted);
  }, []);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setPhase('processing');
    await new Promise(r => setTimeout(r, mode === 'update' ? 1000 : 1800));
    setPhase('done');
    if (mode === 'update' && onSuccessWithIban) {
      setTimeout(() => onSuccessWithIban(iban), 300);
    } else {
      setTimeout(() => onSuccess?.(), 600);
    }
  };

  // Border styles based on IBAN validation
  const ibanBorderClass =
    !touched.iban || !iban
      ? 'border-gray-200 focus:border-[#635BFF] focus:ring-[#635BFF]/20'
      : ibanStatus === 'valid'
        ? 'border-[#00FF88] ring-2 ring-[#00FF88]/25 bg-emerald-50/30'
        : 'border-[#FF2D55] ring-2 ring-[#FF2D55]/20 bg-red-50/30';

  return (
    <div className="space-y-4">
      <SecurityBadges />

      {/* ── Titulaire ── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
          Titulaire du compte
        </label>
        <input
          type="text"
          placeholder="SARL ART ET COIFFURE ou Jean Dupont"
          value={holder}
          disabled={phase !== 'idle'}
          onBlur={() => setTouched(t => ({ ...t, holder: true }))}
          onChange={e => setHolder(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
        />
      </div>

      {/* ── IBAN ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
            IBAN
          </label>
          <AnimatePresence>
            {isFrench && <FrenchBankBadge />}
          </AnimatePresence>
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="text"
            placeholder="FR76 3000 6000 0123 4567 8901 234"
            value={iban}
            disabled={phase !== 'idle'}
            onBlur={() => setTouched(t => ({ ...t, iban: true }))}
            onChange={handleIBANChange}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all pr-10 disabled:bg-gray-50/70 ${ibanBorderClass}`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AnimatePresence mode="wait">
              {touched.iban && ibanStatus === 'valid' && (
                <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle2 size={16} className="text-[#00FF88]" />
                </motion.div>
              )}
              {touched.iban && ibanStatus === 'invalid' && iban && (
                <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <AlertCircle size={16} className="text-[#FF2D55]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {touched.iban && ibanStatus === 'invalid' && iban && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[#FF2D55] font-medium flex items-center gap-1.5 mt-1"
            >
              <AlertCircle size={11} className="shrink-0" />
              IBAN invalide. Veuillez vérifier votre saisie.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── BIC / SWIFT ── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
          BIC / SWIFT
        </label>
        <input
          type="text"
          placeholder="BNPAFRPPXXX"
          value={bic}
          disabled={phase !== 'idle'}
          onBlur={() => setTouched(t => ({ ...t, bic: true }))}
          onChange={e => setBic(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono text-gray-900 uppercase placeholder:text-gray-300 placeholder:normal-case focus:outline-none transition-all disabled:bg-gray-50/70 ${
            touched.bic && bic
              ? bicValid
                ? 'border-[#00FF88] ring-2 ring-[#00FF88]/25 bg-emerald-50/30 focus:border-[#00FF88]'
                : 'border-[#FF2D55] ring-2 ring-[#FF2D55]/20 bg-red-50/30 focus:border-[#FF2D55]'
              : 'border-gray-200 focus:border-[#635BFF] focus:ring-[#635BFF]/20 focus:ring-2'
          }`}
        />
      </div>

      {/* ── Mandate block (hidden in update mode) ── */}
      {mode !== 'update' && (
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-[#635BFF] shrink-0" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Mandat de prélèvement SEPA
          </p>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          En validant ce formulaire, vous autorisez <strong>Kompilot</strong> à envoyer
          des instructions à votre banque pour débiter votre compte, et votre banque à
          débiter votre compte conformément aux instructions de Kompilot. Ce mandat est
          destiné à un paiement récurrent et vous bénéficiez d'un droit au remboursement
          auprès de votre banque selon les conditions décrites dans la convention que vous
          avez passée avec elle.
        </p>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={mandateChecked}
              onChange={e => setMandateChecked(e.target.checked)}
              disabled={phase !== 'idle'}
              className="sr-only"
            />
            <div
              onClick={() => phase === 'idle' && setMandateChecked(v => !v)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                mandateChecked
                  ? 'bg-[#635BFF] border-[#635BFF]'
                  : 'border-gray-300 bg-white group-hover:border-[#635BFF]/50'
              }`}
            >
              {mandateChecked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-700 leading-relaxed">
            J'autorise ce mandat de prélèvement SEPA et je valide mon abonnement mensuel.
            <span className="text-[#FF2D55] ml-0.5">*</span>
          </span>
        </label>
      </div>
      )}

      {/* ── Confirm button ── */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`w-full flex items-center justify-center gap-2.5 rounded-xl text-white text-sm font-bold py-3.5 transition-all duration-200 ${
          canConfirm
            ? 'bg-[#0D9488] hover:bg-[#0F766E] active:scale-[0.98] shadow-lg shadow-[#0D9488]/30 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        {phase === 'processing' ? (
          <>
            <Loader2 size={15} className="animate-spin shrink-0" />
            {mode === 'update' ? 'Enregistrement...' : 'Activation en cours…'}
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="shrink-0" />
            {mode === 'update' ? 'Enregistrer ce RIB SEPA' : 'Confirmer et activer mon abonnement 🚀'}
          </>
        )}
      </button>

      {/* Summary — payment mode only */}
      {mode === 'payment' && priceTTC && (
      <p className="text-center text-[10px] text-gray-400">
        Montant prélevé : <strong>{priceTTC}</strong> · Prélèvement mensuel automatique
        · Résiliable à tout moment
      </p>
      )}

      {/* Stripe branding */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        <span className="text-[10px] text-gray-300">Sécurisé par</span>
        <svg height="14" viewBox="0 0 60 25" fill="none">
          <text x="0" y="19" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="19" fill="#635BFF">stripe</text>
        </svg>
      </div>
    </div>
  );
}
