import { useState, useEffect } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { X, AlertTriangle, Sparkles, MapPin, Share2, Globe, CheckCircle, Loader2, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MOTIFS = [
  { id: 'conges', label: 'Congés annuels', emoji: '🏖️' },
  { id: 'travaux', label: 'Travaux / Rénovation', emoji: '🔨' },
  { id: 'maladie', label: 'Fermeture pour maladie', emoji: '🏥' },
  { id: 'evenement', label: 'Événement exceptionnel', emoji: '🎉' },
  { id: 'intemperies', label: 'Intempéries', emoji: '⛈️' },
  { id: 'autre', label: 'Autre motif', emoji: '📌' },
];

const CHANNELS = [
  { id: 'google', label: 'Mettre à jour ma fiche Google Maps', icon: <MapPin size={14} className="text-red-500" />, color: 'red' },
  { id: 'social', label: 'Publier sur Facebook & Instagram', icon: <Share2 size={14} className="text-blue-500" />, color: 'blue' },
  { id: 'site', label: 'Afficher un bandeau d\'alerte sur mon site web', icon: <Globe size={14} className="text-teal-500" />, color: 'teal' },
];

const PROGRESS_STEPS = [
  'Connexion à Google My Business...',
  'Mise à jour des horaires Google Maps...',
  'Publication sur Facebook...',
  'Publication sur Instagram...',
  'Activation du bandeau sur le site web...',
  'Vérification finale...',
];

export function ClosureAlertModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'preview' | 'launching'>('form');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [motif, setMotif] = useState('conges');
  const [selectedChannels, setSelectedChannels] = useState(['google', 'social', 'site']);
  const [aiMessage, setAiMessage] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setTimeout(() => {
        setStep('form');
        setProgressStep(0);
        setProgressPct(0);
        setDone(false);
        setAiMessage('');
      }, 300);
    }
  }, [open]);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const next = new Date();
    next.setDate(today.getDate() + 7);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateFrom(fmt(today));
    setDateTo(fmt(next));
  }, []);

  const selectedMotif = MOTIFS.find(m => m.id === motif);

  const generateAIMessage = async () => {
    if (!dateFrom || !dateTo) return;
    setGeneratingAI(true);
    await new Promise(r => setTimeout(r, 1400));
    const fromFmt = new Date(dateFrom).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const toFmt = new Date(dateTo).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const motifLabel = selectedMotif?.label.toLowerCase() ?? 'raisons exceptionnelles';
    setAiMessage(
      `🚨 Information importante\n\nNotre établissement sera exceptionnellement fermé du ${fromFmt} au ${toFmt} pour ${motifLabel}.\n\nNous vous remercions de votre compréhension et restons disponibles par email pour toute question urgente.\n\nNous aurons le plaisir de vous retrouver dès le ${toFmt} ! Merci pour votre fidélité. 🙏`
    );
    setGeneratingAI(false);
    setStep('preview');
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const launchAlert = async () => {
    setStep('launching');
    setProgressPct(0);
    setProgressStep(0);

    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setProgressStep(i);
      setProgressPct(Math.round(((i + 1) / PROGRESS_STEPS.length) * 100));
    }

    await new Promise(r => setTimeout(r, 500));
    setDone(true);
    toast.success('🚨 Alerte lancée avec succès !', {
      description: `${selectedChannels.length} canal${selectedChannels.length > 1 ? 'aux' : ''} mis à jour simultanément.`,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-red-50 to-orange-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Fermeture Exceptionnelle</h2>
              <p className="text-[11px] text-muted-foreground">Alertez tous vos canaux en un clic</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP: Form */}
          {(step === 'form' || step === 'preview') && (
            <>
              {/* Dates */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Période de fermeture</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Du</p>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => { setDateFrom(e.target.value); setStep('form'); }}
                      className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Au</p>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => { setDateTo(e.target.value); setStep('form'); }}
                      className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              {/* Motif */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Motif de fermeture</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIFS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setMotif(m.id); setStep('form'); }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium text-left transition-all ${
                        motif === m.id
                          ? 'border-primary bg-primary/8 text-primary'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Message */}
              {step === 'form' && (
                <Button
                  onClick={generateAIMessage}
                  disabled={!dateFrom || !dateTo || generatingAI}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-teal-400 hover:opacity-90 border-0 text-sm"
                >
                  {generatingAI ? (
                    <><Loader2 size={14} className="animate-spin" /> L'IA rédige votre annonce...</>
                  ) : (
                    <><Sparkles size={14} /> Générer l'annonce avec l'IA</>
                  )}
                </Button>
              )}

              {/* Preview step: AI message + channels */}
              {step === 'preview' && aiMessage && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary" />
                      <label className="text-xs font-semibold text-primary">Message généré par l'IA</label>
                    </div>
                    <textarea
                      value={aiMessage}
                      onChange={e => setAiMessage(e.target.value)}
                      rows={6}
                      className="w-full text-sm border border-primary/30 rounded-xl px-3 py-2.5 bg-primary/5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow leading-relaxed"
                    />
                    <p className="text-[10px] text-muted-foreground">Vous pouvez modifier ce texte avant de lancer l'alerte.</p>
                  </div>

                  {/* Channel selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Canaux à mettre à jour</label>
                    <div className="space-y-2">
                      {CHANNELS.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => toggleChannel(ch.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                            selectedChannels.includes(ch.id)
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border hover:border-border hover:bg-muted/30 opacity-60'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                            selectedChannels.includes(ch.id) ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {selectedChannels.includes(ch.id) && <CheckCircle size={12} className="text-primary-foreground" />}
                          </div>
                          {ch.icon}
                          <span className={`flex-1 text-left text-xs font-medium ${selectedChannels.includes(ch.id) ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {ch.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP: Launching */}
          {step === 'launching' && (
            <div className="space-y-5 py-4">
              {done ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Alerte lancée avec succès !</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedChannels.length} canal{selectedChannels.length > 1 ? 'aux' : ''} mis à jour simultanément.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full">
                    {CHANNELS.filter(c => selectedChannels.includes(c.id)).map(ch => (
                      <div key={ch.id} className="flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
                        {ch.icon}
                        <span className="text-xs font-medium text-green-800 flex-1">{ch.label}</span>
                        <CheckCircle size={14} className="text-green-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                      <Zap size={24} className="text-red-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Mise à jour en cours…</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Tous vos canaux sont mis à jour simultanément</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{PROGRESS_STEPS[progressStep]}</span>
                      <span className="font-bold text-primary">{progressPct}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    {PROGRESS_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-300 ${
                        i < progressStep ? 'opacity-50' : i === progressStep ? 'bg-primary/8' : 'opacity-30'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          i < progressStep ? 'bg-green-500' : i === progressStep ? 'bg-primary animate-pulse' : 'bg-muted'
                        }`}>
                          {i < progressStep ? (
                            <CheckCircle size={10} className="text-white" />
                          ) : i === progressStep ? (
                            <Loader2 size={10} className="text-primary-foreground animate-spin" />
                          ) : null}
                        </div>
                        <span className={`text-xs ${i === progressStep ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-between gap-3 bg-background">
          {step === 'form' && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Annuler
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep('form')} className="text-xs">
                ← Modifier
              </Button>
              <Button
                size="sm"
                onClick={launchAlert}
                disabled={selectedChannels.length === 0}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white text-xs border-0"
              >
                <AlertTriangle size={13} />
                Lancer l'alerte ({selectedChannels.length} canal{selectedChannels.length > 1 ? 'aux' : ''})
              </Button>
            </>
          )}
          {step === 'launching' && done && (
            <Button size="sm" onClick={onClose} className="w-full gap-2 text-xs">
              <CheckCircle size={13} /> Fermer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
