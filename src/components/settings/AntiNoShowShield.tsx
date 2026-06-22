/**
 * AntiNoShowShield — Orchestrateur principal du module Bouclier Anti-No-Show.
 * Compose : slider pénalité · conseils IA · fidélité · re-remplissage flash · heures chaudes · activation Stripe
 */
import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Check, CreditCard, Zap, Heart, Loader2 } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { AntiNoShowAIAdvice } from './antiNoShow/AntiNoShowAIAdvice';
import { DynamicPricingAdvisor } from './antiNoShow/DynamicPricingAdvisor';
import { AntiNoShowHotHours, DEFAULT_HOT_SLOTS } from './antiNoShow/AntiNoShowHotHours';
import { Toggle } from './antiNoShow/AntiNoShowToggle';
import { StripePanicButton } from './StripePanicButton';
import { NoShowAccountingExport } from './antiNoShow/NoShowAccountingExport';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useTracking } from '../../hooks/useTracking';

const BACKEND = 'https://gbrhsehk.backend.blink.new';

interface ConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  requiresAction: boolean;
  currentlyDue: string[];
  disabledReason: string | null;
  accountId: string | null;
}

export function AntiNoShowShield() {
  const { activeEstablishment: establishment } = useEstablishment();
  const { trackAudienceSignal } = useTracking();
  const { user } = useAuth();

  // ── Stripe Connect state ─────────────────────────────────────────────────
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectStatusLoading, setConnectStatusLoading] = useState(true);
  const isMountedRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const fetchConnectStatus = async (signal?: AbortSignal) => {
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND}/api/stripe-connect/status`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!isMountedRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) setConnectStatus(data);
      } else {
        // Non-blocking: show brief info if first load fails
        console.warn('[AntiNoShowShield] stripe-connect/status returned', res.status);
      }
    } catch (err: unknown) {
      // AbortError is expected on unmount — don't log or set state
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('[AntiNoShowShield] fetchConnectStatus error', err);
    } finally {
      if (isMountedRef.current) setConnectStatusLoading(false);
    }
  };

  const handleConnectSetup = async () => {
    setConnectLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      // Create account if not yet connected
      if (!connectStatus?.connected) {
        await fetch(`${BACKEND}/api/stripe-connect/create-account`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      // Get onboarding link
      const linkRes = await fetch(`${BACKEND}/api/stripe-connect/account-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (linkRes.ok) {
        const { url } = await linkRes.json();
        window.location.href = url;
      } else {
        toast.error('Erreur lors de la connexion à Stripe. Veuillez réessayer.');
      }
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setConnectLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const linkRes = await fetch(`${BACKEND}/api/stripe-connect/account-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (linkRes.ok) {
        const { url } = await linkRes.json();
        window.location.href = url;
      } else {
        toast.error('Erreur lors de la connexion à Stripe. Veuillez réessayer.');
      }
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.');
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Check for successful connect redirect
    if (window.location.search.includes('connect=success')) {
      toast.success('✅ Compte bancaire configuré avec succès !');
      // Mark Anti-No-Show as activated for StartupChecklist progress
      try { localStorage.setItem(`noshow_activated_${user.id}`, '1'); } catch { /* noop */ }
      // Clean up the URL param without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('connect');
      window.history.replaceState({}, '', url.toString());
    }

    const abortController = new AbortController();
    fetchConnectStatus(abortController.signal);
    return () => abortController.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [penaltyPct, setPenaltyPct] = useState(20);
  const [loyaltyPardon, setLoyaltyPardon] = useState(true);
  const [flashRefill, setFlashRefill] = useState(false);
  const [hotHoursOnly, setHotHoursOnly] = useState(false);
  const [hotSlots, setHotSlots] = useState<Set<string>>(new Set(DEFAULT_HOT_SLOTS));
  const [shieldActive, setShieldActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSlot = (slot: string) =>
    setHotSlots(prev => { const n = new Set(prev); n.has(slot) ? n.delete(slot) : n.add(slot); return n; });

  const handleSave = () => {
    if (saved) return; // Anti-spam-click: block rapid re-save
    setSaved(true);
    const wasActive = shieldActive;
    setShieldActive(penaltyPct > 0);
    // Use tracked ref to avoid setting state after unmount
    saveTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setSaved(false);
    }, 2500);

    // ── HighValuePro : Bouclier Stripe activé ─────────────────────────────
    // Déclenche quand l'utilisateur active le bouclier pour la 1ère fois
    if (!wasActive && penaltyPct > 0) {
      trackAudienceSignal('HighValuePro').catch(() => {});
    }
  };

  const penaltyLabel =
    penaltyPct === 0 ? '🔴 Désactivé' :
    penaltyPct <= 15 ? '🟡 Léger' :
    penaltyPct <= 30 ? '🟢 Recommandé' : '🔶 Maximum';

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/90 to-teal-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.5) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h2 className="text-lg font-extrabold">🛡️ Bouclier Anti-No-Show & Empreinte Bancaire</h2>
              {shieldActive && penaltyPct > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse" />
                  Actif · {penaltyPct}%
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Sécurisez vos créneaux avec une empreinte bancaire Stripe. L'IA adapte vos paramètres en temps réel selon la saisonnalité et votre historique.
            </p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {[
            { v: '−78%', l: 'de No-Shows' },
            { v: '+34%', l: 'de CA sécurisé' },
            { v: '< 15min', l: 'Re-remplissage IA' },
          ].map(s => (
            <div key={s.l} className="bg-white/15 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold text-white leading-none">{s.v}</p>
              <p className="text-[11px] text-white/70 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Export Comptable ── */}
      <NoShowAccountingExport />

      {/* ── Slider pénalité ── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Pénalité de désistement</h3>
            <p className="text-xs text-muted-foreground">Montant prélevé en cas de no-show de dernière minute</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">0% · Désactivé</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                penaltyPct === 0 ? 'bg-red-50 text-red-600 border-red-200' :
                penaltyPct <= 15 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                penaltyPct <= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-orange-50 text-orange-700 border-orange-200'
              }`}>{penaltyLabel}</span>
              <span className="text-2xl font-black text-primary">{penaltyPct}%</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">50% · Max.</span>
          </div>
          <input
            type="range" min={0} max={50} step={5} value={penaltyPct}
            onChange={e => setPenaltyPct(Number(e.target.value))}
            className="w-full h-2 appearance-none rounded-full cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${penaltyPct * 2}%, hsl(var(--muted)) ${penaltyPct * 2}%, hsl(var(--muted)) 100%)` }}
          />
          <div className="flex justify-between px-0.5">
            {[0,5,10,15,20,25,30,35,40,45,50].map(v => (
              <div key={v} className={`flex flex-col items-center gap-0.5 ${v % 10 === 0 ? '' : 'opacity-40'}`}>
                <div className={`w-0.5 h-1 rounded-full ${v <= penaltyPct ? 'bg-primary' : 'bg-border'}`} />
                {v % 10 === 0 && <span className="text-[9px] text-muted-foreground">{v}%</span>}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              💳 Pénalité configurée :{' '}
              <span className="text-primary font-extrabold">{penaltyPct}% du montant de la prestation</span>
            </p>
            {penaltyPct > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Exemple : pour 60€, l'empreinte est de <strong>{(60 * penaltyPct / 100).toFixed(0)}€</strong>. Le client est notifié lors de la réservation.
              </p>
            )}
            {penaltyPct === 0 && <p className="text-xs text-red-500 mt-1">Le bouclier est désactivé — aucune empreinte ne sera prélevée.</p>}
          </div>
        </div>
      </div>

      {/* ── Dynamic Pricing Advisor IA ── */}
      <DynamicPricingAdvisor
        currentPenaltyPct={penaltyPct}
        onApplyRate={(rate) => setPenaltyPct(rate)}
      />

      {/* ── AI Copilot advice ── */}
      <AntiNoShowAIAdvice
        penaltyPct={penaltyPct}
        sector={establishment?.category}
        city={establishment?.address}
      />

      {/* ── Options avancées ── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <Zap size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Options d'automatisation IA</h3>
            <p className="text-xs text-muted-foreground">Fidélisation & re-remplissage intelligent</p>
          </div>
        </div>

        {/* Loyalty pardon toggle */}
        <div className={`rounded-xl border p-4 transition-colors ${loyaltyPardon ? 'border-primary/25 bg-primary/5' : 'border-border bg-muted/20'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Heart size={18} className={`shrink-0 mt-0.5 ${loyaltyPardon ? 'text-rose-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-bold text-foreground">🔓 Pardon de Fidélité Automatique</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  L'IA identifie vos clients fidèles (+5 RDV honorés) pour annuler automatiquement la pénalité en cas d'imprévu exceptionnel. Renforce la relation sans effort.
                </p>
                {loyaltyPardon && (
                  <span className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <Check size={11} /> Actif — les clients VIP sont protégés
                  </span>
                )}
              </div>
            </div>
            <Toggle checked={loyaltyPardon} onChange={setLoyaltyPardon} />
          </div>
        </div>

        {/* Flash refill checkbox */}
        <div className={`rounded-xl border p-4 transition-colors ${flashRefill ? 'border-primary/25 bg-primary/5' : 'border-border bg-muted/20'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Zap size={18} className={`shrink-0 mt-0.5 ${flashRefill ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-bold text-foreground">🚀 Bourse aux Créneaux Flash</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  En cas de désistement, l'IA alerte par SMS votre liste d'attente pour ré-attribuer le créneau{' '}
                  <strong className="text-foreground">en moins de 15 min</strong>. Double encaissement possible.
                </p>
                {flashRefill && (
                  <span className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                    <Zap size={11} /> Actif — liste d'attente SMS en temps réel
                  </span>
                )}
              </div>
            </div>
            <input
              type="checkbox" checked={flashRefill} onChange={e => setFlashRefill(e.target.checked)}
              className="w-5 h-5 rounded border-border cursor-pointer shrink-0 mt-0.5 accent-teal-600"
            />
          </div>
        </div>
      </div>

      {/* ── Heures chaudes ── */}
      <AntiNoShowHotHours
        enabled={hotHoursOnly}
        onToggleEnabled={setHotHoursOnly}
        hotSlots={hotSlots}
        onToggleSlot={toggleSlot}
        onReset={() => setHotSlots(new Set(DEFAULT_HOT_SLOTS))}
      />

      {/* ── Panic Button Stripe ── */}
      <StripePanicButton
        variant="full"
        clientName=""
        onBypass={(name) => {
          // Log the bypass for audit trail (in production: send to backend)
          console.info('[AntiNoShow] Manual bypass for client:', name || 'anonymous');
        }}
      />

      {/* ── Compte de Versement Sécurisé (Stripe Connect) ── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">
              🔗 Compte bancaire pour versements No-Show
            </h3>
            <p className="text-xs text-muted-foreground">
              Recevez les pénalités directement sur votre compte bancaire
            </p>
          </div>
        </div>

        {/* Status display */}
        {connectStatusLoading ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Loader2 size={15} className="animate-spin text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Vérification du statut Stripe…</span>
          </div>
        ) : connectStatus?.connected && connectStatus.payoutsEnabled ? (
          /* ✅ Fully verified */
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              🟢 Compte bancaire vérifié — Versements Stripe actifs
            </span>
          </div>
        ) : connectStatus?.connected && !connectStatus.payoutsEnabled ? (
          /* ⚠️ Action required */
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                ⚠️ Action requise : Stripe demande la mise à jour de votre pièce d'identité pour débloquer vos fonds.
              </p>
            </div>
            <button
              onClick={handleCompleteOnboarding}
              disabled={connectLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {connectLoading
                ? <><Loader2 size={15} className="animate-spin" /> Redirection vers Stripe…</>
                : <>📋 Compléter mon dossier Stripe</>
              }
            </button>
          </div>
        ) : (
          /* Not connected */
          <div className="space-y-3">
            <button
              onClick={handleConnectSetup}
              disabled={connectLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-90 active:scale-[.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {connectLoading
                ? <><Loader2 size={15} className="animate-spin" /> Connexion en cours…</>
                : <>🔗 Configurer mon compte de versement sécurisé</>
              }
            </button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Stripe collectera de manière sécurisée votre pièce d'identité et RIB (IBAN/BIC).
            </p>
          </div>
        )}

        {/* Privacy note — always shown */}
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            🔒 Kompilot ne collecte jamais vos données bancaires. La vérification est déléguée 100% à{' '}
            <span className="font-semibold text-foreground">Stripe</span>{' '}
            (certifié PCI DSS).
          </p>
        </div>
      </div>

      {/* ── Activation Stripe ── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-teal-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Activation du bouclier</h3>
            <p className="text-xs text-muted-foreground">Liez la configuration à vos webhooks Stripe</p>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 space-y-2.5">
          {[
            { label: 'Pénalité configurée', value: penaltyPct === 0 ? 'Désactivée' : `${penaltyPct}% du montant`, ok: penaltyPct > 0 },
            { label: 'Pardon fidélité', value: loyaltyPardon ? 'Actif (clients VIP)' : 'Désactivé', ok: loyaltyPardon },
            { label: 'Re-remplissage Flash', value: flashRefill ? "Actif (SMS liste d'attente)" : 'Désactivé', ok: flashRefill },
            { label: 'Mode heures chaudes', value: hotHoursOnly ? `${hotSlots.size} créneaux protégés` : 'Tous les créneaux', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className={`text-xs font-semibold ${item.ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>{item.value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-extrabold transition-all shadow-md ${
            saved ? 'bg-emerald-500 text-white' :
            penaltyPct === 0 ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed' :
            'bg-gradient-to-r from-primary to-teal-600 text-white hover:opacity-90 active:scale-[.98]'
          }`}
        >
          {saved ? <><Check size={16} /> Bouclier activé avec succès !</> : <><Lock size={16} /> Activer le bouclier Anti-No-Show</>}
        </button>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          🔒 L'empreinte bancaire est sécurisée par <span className="font-semibold text-foreground">Stripe</span>. Les clients sont notifiés automatiquement lors de la réservation. Conforme PSD2 & RGPD.
        </p>
      </div>
    </div>
  );
}
