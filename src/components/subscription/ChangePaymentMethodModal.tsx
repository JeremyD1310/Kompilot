/**
 * Modal de changement de moyen de paiement
 * Permet de mettre à jour la carte bancaire ou le RIB SEPA sans traiter un nouveau paiement
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Building2, ShieldCheck, Lock, Check } from 'lucide-react';
import { SEPAForm } from './SEPAForm';
import {
  setActivePaymentMethod,
  buildCardPaymentMethod,
  buildSepaPaymentMethod,
} from '../../lib/billingStorage';
import { toast } from '@blinkdotnew/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────

function VisaLogo() {
  return (
    <div className="w-10 h-6 rounded bg-[#1A1F71] flex items-center justify-center shrink-0">
      <span style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontWeight: 'bold', color: '#fff', fontSize: '11px' }}>VISA</span>
    </div>
  );
}
function MastercardLogo() {
  return (
    <svg width="36" height="24" viewBox="0 0 38 24" fill="none" className="shrink-0">
      <circle cx="14" cy="12" r="11" fill="#EB001B" />
      <circle cx="24" cy="12" r="11" fill="#F79E1B" opacity="0.9" />
      <path d="M19 3.47a11 11 0 0 1 0 17.06A11 11 0 0 1 19 3.47z" fill="#FF5F00" />
    </svg>
  );
}
function detectBrand(num: string): 'visa' | 'mastercard' | null {
  const d = num.replace(/\s/g, '');
  if (d.startsWith('4')) return 'visa';
  const n2 = parseInt(d.slice(0, 2));
  const n4 = parseInt(d.slice(0, 4));
  if ((n2 >= 51 && n2 <= 55) || (n4 >= 2221 && n4 <= 2720)) return 'mastercard';
  return null;
}
const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// ── Card update form ──────────────────────────────────────────────────────────

function CardUpdateForm({ onSaved }: { onSaved: () => void }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');
  const [saving, setSaving] = useState(false);

  const raw = cardNumber.replace(/\s/g, '');
  const brand = detectBrand(raw);
  const canSave = raw.length === 16 && expiry.length === 5 && cvc.length >= 3 && holder.trim().length > 1;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setActivePaymentMethod(buildCardPaymentMethod(cardNumber));
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      {/* Security badges */}
      <div className="flex flex-wrap gap-2 justify-end mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          <Lock size={9} /> Connexion chiffrée SSL 🔒
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#635BFF]/8 border border-[#635BFF]/20 px-2.5 py-1 text-[10px] font-semibold text-[#635BFF]">
          <svg height="11" viewBox="0 0 60 25" fill="none"><text x="0" y="18" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="18" fill="#635BFF">stripe</text></svg>
          Propulsé par Stripe.net 💳
        </span>
      </div>

      {/* Holder */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Nom du titulaire</label>
        <input type="text" placeholder="Jean Dupont" value={holder} onChange={e => setHolder(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all" />
      </div>

      {/* Card number */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Numéro de carte</label>
        <div className="relative">
          <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
            value={cardNumber} maxLength={19}
            onChange={e => setCardNumber(fmtCard(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all pr-16" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {brand === 'visa' && <VisaLogo />}
            {brand === 'mastercard' && <MastercardLogo />}
            {!brand && <div className="w-10 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center"><Lock size={10} className="text-gray-300" /></div>}
          </div>
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Expiration</label>
          <input type="text" inputMode="numeric" placeholder="MM/AA" value={expiry} maxLength={5}
            onChange={e => setExpiry(fmtExpiry(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">CVC</label>
          <input type="text" inputMode="numeric" placeholder="123" value={cvc} maxLength={3}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all" />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className={`w-full flex items-center justify-center gap-2.5 rounded-xl text-white text-sm font-bold py-3.5 transition-all ${
          canSave ? 'bg-[#635BFF] hover:bg-[#5144DD] shadow-lg shadow-[#635BFF]/30 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />Enregistrement...</>
        ) : (
          <><Check size={14} />Enregistrer cette carte</>
        )}
      </button>
      <p className="text-center text-[10px] text-gray-400">🔒 Données cryptées SSL · Simulation Kompilot</p>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ChangePaymentMethodModal({ open, onClose, onSaved }: Props) {
  const [method, setMethod] = useState<'card' | 'sepa'>('card');

  useEffect(() => {
    if (open) setMethod('card');
  }, [open]);

  if (!open) return null;

  const handleCardSaved = () => {
    toast.success('Carte bancaire enregistrée ! ✅', {
      description: 'Votre nouveau moyen de paiement est actif.',
    });
    onSaved?.();
    onClose();
  };

  const handleSepaSaved = (iban: string) => {
    setActivePaymentMethod(buildSepaPaymentMethod(iban));
    toast.success('RIB SEPA enregistré ! ✅', {
      description: 'Votre prélèvement automatique est configuré.',
    });
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

      <motion.div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-gray-900">Changer de moyen de paiement 🔄</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Carte bancaire ou prélèvement SEPA</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pt-5 pb-6 space-y-4">
          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod('card')}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                method === 'card'
                  ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CreditCard size={15} className="shrink-0" /> Carte bancaire
            </button>
            <button
              onClick={() => setMethod('sepa')}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                method === 'sepa'
                  ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Building2 size={15} className="shrink-0" /> Prélèvement SEPA 🏦
            </button>
          </div>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {method === 'card' ? (
              <motion.div key="card" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                <CardUpdateForm onSaved={handleCardSaved} />
              </motion.div>
            ) : (
              <motion.div key="sepa" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                <SEPAForm
                  priceTTC=""
                  mode="update"
                  onSuccessWithIban={handleSepaSaved}
                  disabled={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
