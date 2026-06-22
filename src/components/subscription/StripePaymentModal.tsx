import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, X, ArrowLeft, AlertCircle, CreditCard, Building2 } from 'lucide-react';
import { launchConfetti } from '../../lib/confetti';
import { addStoredInvoice } from '../../lib/billingStorage';
import { SEPAForm } from './SEPAForm';

// ── Card brand logos ─────────────────────────────────────────────────────────

function VisaLogo() {
  return (
    <div className="w-10 h-6 rounded bg-[#1A1F71] flex items-center justify-center shrink-0">
      <span style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontWeight: 'bold', color: '#fff', fontSize: '11px', letterSpacing: '0.5px' }}>
        VISA
      </span>
    </div>
  );
}

function MastercardLogo() {
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" className="shrink-0">
      <circle cx="14" cy="12" r="11" fill="#EB001B" />
      <circle cx="24" cy="12" r="11" fill="#F79E1B" opacity="0.9" />
      <path d="M19 3.47a11 11 0 0 1 0 17.06A11 11 0 0 1 19 3.47z" fill="#FF5F00" />
    </svg>
  );
}

function detectCardBrand(num: string): 'visa' | 'mastercard' | null {
  const d = num.replace(/\s/g, '');
  if (d.startsWith('4')) return 'visa';
  const n2 = parseInt(d.slice(0, 2));
  const n4 = parseInt(d.slice(0, 4));
  if ((n2 >= 51 && n2 <= 55) || (n4 >= 2221 && n4 <= 2720)) return 'mastercard';
  return null;
}

// ── Animated success checkmark ───────────────────────────────────────────────

function SuccessScreen({ planName }: { planName: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 px-8 py-14 text-center"
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <motion.path
              d="M13 26l10 10 16-20"
              stroke="#22C55E"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Paiement validé avec succès ! 🎉
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Votre offre <strong className="text-gray-800">{planName}</strong> est maintenant active.<br />
          Une facture a été générée dans votre espace Facturation.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-5 py-2 text-xs font-semibold text-green-700">
        <ShieldCheck size={13} /> Paiement sécurisé confirmé
      </div>
    </motion.div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' €';
const fmtCard = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const TEST_CARD = '4242 4242 4242 4242';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface StripePaymentModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  priceHT: number;
  tvaRate?: number;
  invoiceDesc: string;
  isSubscription?: boolean;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StripePaymentModal({
  open, onClose, planName, priceHT, tvaRate = 20,
  invoiceDesc, isSubscription = true, onSuccess,
}: StripePaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sepa'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');
  const [error, setError] = useState('');
  const [billingCompany, setBillingCompany] = useState(() => {
    try { return localStorage.getItem('kompilot_billing_company') ?? ''; } catch { return ''; }
  });
  const [billingVat, setBillingVat] = useState(() => {
    try { return localStorage.getItem('kompilot_billing_vat') ?? ''; } catch { return ''; }
  });

  const tva = priceHT * (tvaRate / 100);
  const priceTTC = priceHT + tva;

  const rawCard = cardNumber.replace(/\s/g, '');
  const brand = detectCardBrand(rawCard);
  const isTest = rawCard === '4242424242424242';
  // B2B validation: company name required if VAT number is filled (and vice versa)
  const hasVat = billingVat.trim().length > 0;
  const hasCompany = billingCompany.trim().length > 0;
  const b2bValid = (hasVat && hasCompany) || (!hasVat && !hasCompany); // either both or neither
  const canPay = rawCard.length === 16 && expiry.length === 5 && cvc.length >= 3 && name.trim().length > 1 && b2bValid;

  useEffect(() => {
    if (open) {
      setCardNumber(''); setExpiry(''); setCvc(''); setName('');
      setPhase('form'); setError(''); setPaymentMethod('card');
    }
  }, [open]);

  const handlePay = async () => {
    if (!canPay || phase === 'processing') return;
    setError('');
    if (!isTest) {
      setError(`Carte refusée. Utilisez la carte de test : ${TEST_CARD}`);
      return;
    }
    setPhase('processing');
    await new Promise(r => setTimeout(r, 1500));
    addStoredInvoice(invoiceDesc, priceHT);
    onSuccess();
    setPhase('success');
    launchConfetti();
    setTimeout(onClose, 3200);
  };

  const handleSepaSuccess = () => {
    addStoredInvoice(invoiceDesc, priceHT, 'sepa');
    onSuccess();
    setPhase('success');
    launchConfetti();
    setTimeout(onClose, 3200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget && phase !== 'processing') onClose(); }}
    >
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      >
        <AnimatePresence mode="wait">
          {phase === 'success' ? (
            <SuccessScreen planName={planName} key="success" />
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden">
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <button
                  onClick={onClose}
                  disabled={phase === 'processing'}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                >
                  <ArrowLeft size={14} /> Retour
                </button>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <ShieldCheck size={13} className="text-green-500" /> Paiement sécurisé
                </div>
                <button
                  onClick={onClose}
                  disabled={phase === 'processing'}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Scrollable body ── */}
              <div className="overflow-y-auto flex-1">
                {/* Order summary */}
                <div className="px-6 py-5 bg-gradient-to-br from-[#0D9488]/5 to-transparent border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Récapitulatif</p>
                      <p className="text-lg font-extrabold text-gray-900">{planName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isSubscription ? 'Abonnement mensuel, résiliable à tout moment' : 'Achat unique, sans engagement'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-gray-900">{fmt(priceTTC)}</p>
                      <p className="text-[11px] text-gray-400">TTC{isSubscription ? ' / mois' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span>Montant HT</span>
                      <span className="font-semibold text-gray-600">{fmt(priceHT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA {tvaRate}%</span>
                      <span className="font-semibold text-gray-600">{fmt(tva)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
                    <Lock size={9} /> Paiement sécurisé via Stripe
                  </p>
                </div>

                {/* ── Payment method tabs ── */}
                <div className="px-6 pt-5 pb-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Mode de paiement
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard size={15} className="shrink-0" />
                      Carte bancaire
                    </button>
                    <button
                      onClick={() => setPaymentMethod('sepa')}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        paymentMethod === 'sepa'
                          ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 size={15} className="shrink-0" />
                      Prélèvement SEPA 🏦
                    </button>
                  </div>
                </div>

                {/* ── Form area ── */}
                <div className="px-6 pt-4 pb-6">
                  <AnimatePresence mode="wait">
                    {paymentMethod === 'sepa' ? (
                      <motion.div
                        key="sepa"
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SEPAForm
                          priceTTC={fmt(priceTTC)}
                          disabled={phase === 'processing'}
                          onSuccess={handleSepaSuccess}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="card"
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 14 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Test hint */}
                        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                          <span className="shrink-0 mt-0.5">💳</span>
                          <span>
                            <strong>Pour le test, utilisez cette carte :</strong><br />
                            {TEST_CARD} · Expiry: 12/28 · CVC: 123
                          </span>
                        </div>

                        {/* B2B section — paired fields: fill both or neither */}
                        <div className={`space-y-3 rounded-xl border px-4 py-3.5 ${
                          !b2bValid
                            ? 'border-amber-300 bg-amber-50/60'
                            : (hasVat || hasCompany) ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-gray-50/60'
                        }`}>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Building2 size={11} />
                            Facturation entreprise (Agences &amp; Pros)
                            {hasVat || hasCompany
                              ? <span className="text-primary font-normal normal-case tracking-normal ml-1">— les deux champs sont requis ensemble</span>
                              : <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(optionnel)</span>
                            }
                          </p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                                Raison sociale / Nom de l'entreprise
                              </label>
                              <input
                                type="text"
                                placeholder="Ex : Ma Société SAS"
                                value={billingCompany}
                                onChange={e => {
                                  setBillingCompany(e.target.value);
                                  try { localStorage.setItem('kompilot_billing_company', e.target.value); } catch { /* noop */ }
                                }}
                                disabled={phase === 'processing'}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                                N° TVA Intracommunautaire
                              </label>
                              <input
                                type="text"
                                placeholder="Ex : FR12 345678901"
                                value={billingVat}
                                onChange={e => {
                                  setBillingVat(e.target.value);
                                  try { localStorage.setItem('kompilot_billing_vat', e.target.value); } catch { /* noop */ }
                                }}
                                disabled={phase === 'processing'}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
                              />
                            </div>
                          </div>
                          {/* Validation hint when only one B2B field is filled */}
                          {!b2bValid && (hasVat || hasCompany) && (
                            <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                              ⚠️ Veuillez remplir les deux champs entreprise ensemble pour la facturation B2B.
                            </p>
                          )}
                        </div>

                        {/* Cardholder */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                            Nom du titulaire de la carte
                          </label>
                          <input
                            type="text"
                            placeholder="Jean Dupont"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={phase === 'processing'}
                            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
                          />
                        </div>

                        {/* Card number */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                            Numéro de carte
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              maxLength={19}
                              disabled={phase === 'processing'}
                              onChange={e => { setError(''); setCardNumber(fmtCard(e.target.value)); }}
                              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all pr-16 disabled:bg-gray-50/70 ${
                                error
                                  ? 'border-red-300 bg-red-50/40 focus:ring-red-200'
                                  : 'border-gray-200 focus:border-[#635BFF] focus:ring-[#635BFF]/25'
                              }`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {brand === 'visa' && <VisaLogo />}
                              {brand === 'mastercard' && <MastercardLogo />}
                              {!brand && (
                                <div className="w-10 h-6 rounded border border-gray-200 bg-gray-50/80 flex items-center justify-center">
                                  <Lock size={10} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expiry + CVC */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                              Date d'expiration
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="MM/AA"
                              value={expiry}
                              maxLength={5}
                              disabled={phase === 'processing'}
                              onChange={e => setExpiry(fmtExpiry(e.target.value))}
                              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                              Code CVC
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="123"
                              value={cvc}
                              maxLength={3}
                              disabled={phase === 'processing'}
                              onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/25 focus:border-[#635BFF] transition-all disabled:bg-gray-50/70"
                            />
                          </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700"
                            >
                              <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* CGV checkbox */}
                        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                          <input type="checkbox" id="cgv-check" required className="mt-0.5 w-4 h-4 accent-primary shrink-0 cursor-pointer" />
                          <label htmlFor="cgv-check" className="text-[11px] text-muted-foreground cursor-pointer leading-relaxed">
                            J'accepte les <a href="/legal" className="underline hover:text-foreground">Conditions Générales de Vente et d'Utilisation</a>, incluant les clauses de responsabilité limitée du service de publication automatique.
                          </label>
                        </div>

                        {/* Pay button */}
                        <button
                          onClick={handlePay}
                          disabled={!canPay || phase === 'processing'}
                          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5144DD] active:bg-[#4338CA] text-white text-sm font-bold py-3.5 shadow-lg shadow-[#635BFF]/30 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          {phase === 'processing' ? (
                            <>
                              <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Traitement sécurisé par Stripe en cours...
                            </>
                          ) : (
                            <><Lock size={13} /> Payer {fmt(priceTTC)}</>
                          )}
                        </button>

                        <p className="text-center text-[10px] text-gray-400">
                          🔒 Données cryptées SSL · Simulation — aucune donnée réelle transmise
                        </p>

                        {/* Stripe branding */}
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                          <span className="text-[10px] text-gray-300">Propulsé par</span>
                          <svg height="15" viewBox="0 0 60 25" fill="none">
                            <text x="0" y="20" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="20" fill="#635BFF">stripe</text>
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
