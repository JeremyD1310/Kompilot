import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { Fingerprint, CheckCircle, ShieldCheck, KeyRound, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { usePinAuth } from '../../hooks/usePinAuth';

// ── PIN sub-section ────────────────────────────────────────────────────────────

function PinSection() {
  const { isPinSet, setPin, clearPin } = usePinAuth();
  const [pin, setLocalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'view' | 'set' | 'confirm'>('view');

  const handleSave = () => {
    if (pin.length < 4) return;
    if (pin !== confirmPin) { toast.error('Les PINs ne correspondent pas.'); return; }
    setPin(pin);
    setLocalPin(''); setConfirmPin(''); setMode('view');
    toast.success('Code PIN défini avec succès !');
  };

  const handleClear = () => {
    clearPin();
    toast.success('Code PIN supprimé.');
  };

  const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-[0.3em] text-center';

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 mt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <KeyRound size={12} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Code PIN de secours</p>
        </div>
        {isPinSet && (
          <Badge className="text-[10px] py-0 gap-1 bg-green-100 text-green-700 border-green-200 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />PIN configuré
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isPinSet && mode === 'view' ? (
          <motion.div key="set-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setMode('set'); setLocalPin(''); setConfirmPin(''); }}
              className="text-xs h-8">Modifier</Button>
            <Button size="sm" variant="ghost" onClick={handleClear}
              className="text-xs h-8 text-muted-foreground hover:text-red-600">Supprimer</Button>
          </motion.div>
        ) : mode === 'view' ? (
          <motion.div key="unset-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Définissez un code PIN de 4 à 6 chiffres comme alternative si la biométrie échoue.
            </p>
            <Button size="sm" variant="outline" onClick={() => setMode('set')} className="text-xs h-8 gap-1.5">
              <KeyRound size={12} /> Définir mon PIN
            </Button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2.5">
            <input
              type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
              value={pin} onChange={e => setLocalPin(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
            />
            <input
              type="password" inputMode="numeric" maxLength={6} placeholder="Confirmer ••••••"
              value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={pin.length < 4 || confirmPin.length < 4}
                className="text-xs h-8 gap-1.5 flex-1">
                <CheckCircle size={12} /> Définir mon PIN
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMode('view'); setLocalPin(''); setConfirmPin(''); }}
                className="text-xs h-8 w-8 p-0"><X size={14} /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main biometric section ─────────────────────────────────────────────────────

export function BiometricAuthSection() {
  const { isSupported, isPlatformAuthAvailable, deviceLabel, deviceIcon, isEnrolled, enroll, unenroll, isLoading } = useBiometricAuth();
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    await enroll();
    setEnrolling(false);
    toast.success('Authentification biométrique activée ! 🔒');
  };

  const handleUnenroll = () => {
    unenroll();
    toast.success('Biométrie désactivée');
  };

  // Loading state
  if (isSupported && isPlatformAuthAvailable === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint size={14} className="text-primary" />
            </div>
            Authentification biométrique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-sm text-muted-foreground">Vérification de la compatibilité…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isEnrolled ? 'bg-green-100' : 'bg-primary/10'}`}>
            <Fingerprint size={14} className={isEnrolled ? 'text-green-600' : 'text-primary'} />
          </div>
          Authentification biométrique
          {isEnrolled && (
            <Badge className="text-[10px] py-0 gap-1 bg-green-100 text-green-700 border-green-200 rounded-full ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Activée
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">

        {/* Not supported */}
        {(!isSupported || isPlatformAuthAvailable === false) && (
          <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-3 mb-2">
            <ShieldCheck size={15} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Votre appareil ne supporte pas l'authentification biométrique. Utilisez le code PIN de secours ci-dessous.
            </p>
          </div>
        )}

        {/* Supported & available */}
        {isSupported && isPlatformAuthAvailable === true && (
          <AnimatePresence mode="wait">
            {!isEnrolled ? (
              <motion.div key="unenrolled"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { icon: '⚡', title: 'Accès instantané', desc: 'Déverrouillez en moins d\'une seconde' },
                    { icon: '🔐', title: 'Sécurité maximale', desc: 'Clé biométrique stockée sur votre appareil' },
                    { icon: '🛡️', title: 'Sans mot de passe', desc: 'Aucune saisie requise pour vous connecter' },
                  ].map(f => (
                    <div key={f.title} className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{f.icon}</span>
                        <p className="text-[11px] font-semibold text-foreground">{f.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Fingerprint size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Activer {deviceIcon} {deviceLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Déverrouillez votre cockpit en une seconde avec votre empreinte ou reconnaissance faciale.
                    </p>
                    <Button
                      size="sm" onClick={handleEnroll}
                      disabled={enrolling || isLoading}
                      className="mt-3 gap-2 h-9"
                    >
                      {enrolling
                        ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />Activation…</>
                        : <><Fingerprint size={14} />Activer le déverrouillage rapide</>
                      }
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="enrolled"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">
                      {deviceIcon} {deviceLabel} activé
                    </p>
                    <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                      Votre cockpit est protégé par la biométrie de votre appareil.
                    </p>
                    <Button
                      size="sm" variant="ghost" onClick={handleUnenroll}
                      className="mt-3 text-xs h-8 text-green-700 hover:text-red-600 hover:bg-red-50 gap-1.5"
                    >
                      <X size={12} /> Désactiver
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* PIN fallback — always shown */}
        <PinSection />
      </CardContent>
    </Card>
  );
}
