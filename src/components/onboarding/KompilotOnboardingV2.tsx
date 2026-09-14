/**
 * KompilotOnboardingV2 — Zero-config onboarding with SIRET lookup.
 * 4 steps: Welcome → Auto-Discovery → Connect → Dashboard
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, ChevronRight, ArrowRight, ExternalLink,
  Sparkles, Building2, MapPin, Tag, Link2, X,
} from 'lucide-react';
import { Button, Card, Input, Badge, Progress } from '@blinkdotnew/ui';
import { KompilotLogo } from '../brand/KompilotLogo';
import { authHeaders, backendFetch } from '../../lib/backend';

// ── Types ────────────────────────────────────────────────────────────────────

type FlowStep = 1 | 2 | 3 | 4;

interface CompanyInfo {
  companyName: string;
  city: string;
  activityLabel: string;
  activityCode: string;
  siret: string;
  objective?: string;
  businessUrl?: string;
}

interface ConnectorState {
  provider: string;
  label: string;
  icon: string;
  connected: boolean;
}

const DISCOVERY_ITEMS = [
  { icon: '🔍', label: 'Scan de votre présence en ligne...' },
  { icon: '📊', label: 'Analyse de votre secteur et concurrents...' },
  { icon: '🤖', label: 'Configuration de votre IA sur-mesure...' },
  { icon: '✅', label: 'Prêt !' },
];

const INITIAL_CONNECTORS: ConnectorState[] = [
  { provider: 'google', label: 'Google Business', icon: '🇬', connected: false },
  { provider: 'meta', label: 'Facebook / Instagram', icon: '🇲', connected: false },
  { provider: 'tiktok', label: 'TikTok', icon: '🇹', connected: false },
  { provider: 'linkedin', label: 'LinkedIn', icon: '🇱', connected: false },
  { provider: 'stripe', label: 'Stripe', icon: '💳', connected: false },
];

// ── Animation variants ──────────────────────────────────────────────────────

const cardVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Props ────────────────────────────────────────────────────────────────────

interface KompilotOnboardingV2Props {
  userId?: string;
  onComplete: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function KompilotOnboardingV2({ userId = 'unknown', onComplete }: KompilotOnboardingV2Props) {
  const [step, setStep] = useState<FlowStep>(1);
  const [direction, setDirection] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [connectors, setConnectors] = useState<ConnectorState[]>(INITIAL_CONNECTORS);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timers
  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  // ── Navigation ──────────────────────────────────────────────────────────

  const goTo = useCallback((next: FlowStep) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  // ── SIRET verification ──────────────────────────────────────────────────

  const handleSiretLookup = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);

    try {
      const isSiret = /^\d{14}$/.test(trimmed.replace(/\s/g, ''));
      const url = isSiret
        ? `/api/siret/verify/${trimmed.replace(/\s/g, '')}`
        : `/api/siret/search?name=${encodeURIComponent(trimmed)}`;

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      window.clearTimeout(timeout);
      const data = await res.json();

      if (isSiret) {
        if (data.valid && data.companyName) {
          setCompany({
            companyName: data.companyName,
            city: data.city || '',
            activityLabel: data.activityLabel || '',
            activityCode: data.activityCode || '',
            siret: trimmed.replace(/\s/g, ''),
          });
          goTo(2);
          startDiscovery();
        } else if (data.valid) {
          // Valid SIRET but no company data (Luhn-only)
          setCompany({ companyName: '', city: '', activityLabel: '', activityCode: '', siret: trimmed.replace(/\s/g, '') });
          goTo(2);
          startDiscovery();
        } else {
          setError('SIRET invalide. Vérifiez le numéro ou essayez avec le nom.');
        }
      } else if (data.results?.length > 0) {
        const r = data.results[0];
        setCompany({
          companyName: r.name || '',
          city: r.city || '',
          activityLabel: r.activity || '',
          activityCode: '',
          siret: r.siret || '',
        });
        goTo(2);
        startDiscovery();
      } else {
        // No results — still proceed with discovery using raw input
        setCompany({ companyName: trimmed, city: '', activityLabel: '', activityCode: '', siret: '' });
        goTo(2);
        startDiscovery();
      }
    } catch (lookupError) {
      setError(lookupError instanceof DOMException && lookupError.name === 'AbortError' ? 'La recherche a pris trop de temps. Réessayez.' : 'Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [inputValue, goTo]);

  // ── Discovery animation ─────────────────────────────────────────────────

  const startDiscovery = useCallback(() => {
    setCompletedItems([]);
    DISCOVERY_ITEMS.forEach((_, i) => {
      const t = setTimeout(() => {
        setCompletedItems(prev => {
          if (prev.includes(i)) return prev;
          return [...prev, i];
        });
      }, 350 + i * 500);
      timerRef.current.push(t);
    });
  }, []);

  const discoveryDone = completedItems.length === DISCOVERY_ITEMS.length;

  // ── Connector toggle ────────────────────────────────────────────────────

  const toggleConnector = useCallback((provider: string) => {
    setConnectors(prev =>
      prev.map(c => c.provider === provider ? { ...c, connected: !c.connected } : c),
    );
  }, []);

  // ── Persist onboarding ──────────────────────────────────────────────────

  const finishOnboarding = useCallback(async () => {
    if (!userId || userId === 'unknown' || saving) return;
    setSaving(true);
    setError('');
    const connectedProviders = connectors.filter(c => c.connected).map(c => c.provider);
    try {
      const response = await backendFetch('/api/onboarding/complete', {
        method: 'POST',
        headers: await authHeaders(true),
        body: JSON.stringify({ company, connectors: connectedProviders }),
      }, 12000);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Impossible de sauvegarder votre configuration');
      }
      const profile = { companyName: company?.companyName || '', sector: company?.activityLabel || '', objectives: [] };
      localStorage.setItem(`onboarding_profile_${userId}`, JSON.stringify(profile));
      localStorage.setItem(`kompilot_onboarding_v2_${userId}`, JSON.stringify({ completedAt: Date.now(), company, connectors: connectedProviders }));
      onComplete();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible de sauvegarder votre configuration');
    } finally {
      setSaving(false);
    }
  }, [userId, company, connectors, onComplete, saving]);

  // ── Keyboard shortcut ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (step === 1 && e.key === 'Enter' && inputValue.trim() && !loading) {
        handleSiretLookup();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, inputValue, loading, handleSiretLookup]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh overflow-y-auto bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[620px] min-w-0">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <KompilotLogo variant="full" height={30} />
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <Progress value={(step / 4) * 100} className="h-1.5" />
          <div className="flex justify-between mt-2 px-1">
            {[1, 2, 3, 4].map(s => (
              <span
                key={s}
                className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors ${
                  s <= step ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Étape {s}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* ── STEP 1: Welcome ──────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="p-5 sm:p-8 lg:p-10 shadow-lg border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary">
                    Votre entreprise en 1 clic
                  </span>
                </div>

                <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-foreground leading-[1.15] mb-2 font-serif">
                  Propulsez votre<br />présence digitale
                </h1>
                <p className="text-muted-foreground text-[0.92rem] leading-relaxed mb-8">
                  Kompilot configure tout automatiquement. Entrez votre SIRET ou nom d&apos;entreprise.
                </p>

                {/* Input */}
                <div className="relative mb-3">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setError(''); }}
                    placeholder="SIRET (14 chiffres) ou nom de l'entreprise..."
                    className="pl-11 h-12 text-[0.95rem] rounded-xl"
                    disabled={loading}
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-[0.8rem] mb-3 flex items-center gap-1.5"
                  >
                    <X className="h-3 w-3" />
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <Button
                  className="w-full h-12 rounded-xl text-[0.95rem] font-semibold gap-2"
                  onClick={handleSiretLookup}
                  disabled={!inputValue.trim() || loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Recherche...
                    </span>
                  ) : (
                    <>
                      Analyser mon entreprise
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: Auto-Discovery ───────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="p-5 sm:p-8 lg:p-10 shadow-lg border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary">
                    On s&apos;occupe de tout
                  </span>
                </div>

                <h2 className="text-[1.55rem] sm:text-[1.75rem] font-bold text-foreground leading-[1.2] mb-1 font-serif">
                  Analyse en cours…
                </h2>
                <p className="text-muted-foreground text-[0.9rem] mb-8">
                  {company?.companyName
                    ? `Nous configurons Kompilot pour ${company.companyName}.`
                    : 'Nous analysons votre activité pour tout configurer.'}
                </p>

                {/* Discovery checklist */}
                <div className="space-y-0">
                  {DISCOVERY_ITEMS.map((item, i) => {
                    const isDone = completedItems.includes(i);
                    const isActive = !isDone && completedItems.length === i;
                    return (
                      <motion.div
                        key={i}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className={`flex items-center gap-4 py-4 border-b border-border/40 last:border-b-0 ${
                          isDone ? 'opacity-70' : ''
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-50 border border-emerald-200'
                              : isActive
                                ? 'bg-primary/5 border border-primary/20'
                                : 'bg-muted border border-border'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : item.icon}
                        </div>
                        <span className={`text-[0.9rem] flex-1 transition-colors ${
                          isDone ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {item.label}
                        </span>
                        <div className="flex-shrink-0 w-5 flex justify-center">
                          {isActive && (
                            <span className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Next CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: discoveryDone ? 1 : 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8"
                >
                  <Button
                    className="w-full h-12 rounded-xl text-[0.95rem] font-semibold gap-2"
                    onClick={() => goTo(3)}
                    disabled={!discoveryDone || saving}
                  >
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: Connect ──────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="p-5 sm:p-8 lg:p-10 shadow-lg border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary">
                    Connectez vos comptes
                  </span>
                </div>

                <h2 className="text-[1.55rem] sm:text-[1.75rem] font-bold text-foreground leading-[1.2] mb-1 font-serif">
                  Boostez votre visibilité
                </h2>
                <p className="text-muted-foreground text-[0.9rem] mb-8">
                  Liez vos comptes pour que Kompilot publie et analyse automatiquement.
                </p>

                {/* Connector cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {connectors.map((c, i) => (
                    <motion.div
                      key={c.provider}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        c.connected
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-border hover:border-primary/30 hover:bg-accent/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-[0.88rem] font-medium text-foreground">{c.label}</span>
                        {c.connected && (
                          <Badge variant="secondary" className="text-[0.65rem] h-5 bg-emerald-100 text-emerald-700 border-emerald-200">
                            Connecté
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant={c.connected ? 'secondary' : 'outline'}
                        size="sm"
                        className="rounded-lg text-[0.78rem] h-8"
                        onClick={() => toggleConnector(c.provider)}
                      >
                        {c.connected ? 'Déconnecter' : 'Connecter'}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 h-11 rounded-xl text-[0.88rem] text-muted-foreground"
                    onClick={() => goTo(4)}
                  >
                    Plus tard
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl text-[0.88rem] font-semibold gap-2"
                    onClick={() => goTo(4)}
                  >
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 4: Dashboard ────────────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="p-8 sm:p-10 shadow-lg border-border/60 text-center">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                  className="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </motion.div>

                <h2 className="text-[1.55rem] sm:text-[1.75rem] font-bold text-foreground leading-[1.2] mb-2 font-serif">
                  Votre Command Center<br />est prêt !
                </h2>
                <p className="text-muted-foreground text-[0.9rem] mb-8 max-w-md mx-auto">
                  Tout est configuré. Vous pouvez maintenant gérer votre présence digitale depuis un seul endroit.
                </p>

                {/* Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-muted/60 rounded-xl p-5 mb-8 text-left"
                >
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">
                    Résumé de la configuration
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {company?.companyName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-[0.82rem] text-foreground truncate">{company.companyName}</span>
                      </div>
                    )}
                    {company?.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-[0.82rem] text-foreground">{company.city}</span>
                      </div>
                    )}
                    {company?.activityLabel && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-[0.82rem] text-foreground truncate">{company.activityLabel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-[0.82rem] text-foreground">
                        {connectors.filter(c => c.connected).length} compte{connectors.filter(c => c.connected).length !== 1 ? 's' : ''} lié{connectors.filter(c => c.connected).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <Button
                  className="w-full h-12 rounded-xl text-[0.95rem] font-semibold gap-2"
                  onClick={() => void finishOnboarding()}
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde en cours…' : 'Accéder à mon Command Center'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
