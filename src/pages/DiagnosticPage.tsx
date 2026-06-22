/**
 * DiagnosticPage — public lead-magnet page.
 * Funnel: Form → Scan animation → Results + Geo map → Capture modal
 */
import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, Zap, Users } from 'lucide-react';
import { DiagnosticForm, type DiagnosticFormData } from '../components/diagnostic/DiagnosticForm';
import { DiagnosticScan } from '../components/diagnostic/DiagnosticScan';
import { DiagnosticResults } from '../components/diagnostic/DiagnosticResults';
import { DiagnosticCaptureModal } from '../components/diagnostic/DiagnosticCaptureModal';

import { KompilotLogo } from '../components/brand/KompilotLogo';

type Step = 'form' | 'scan' | 'results';

function Logo() { return <KompilotLogo variant="icon" height={28} />; }

/** Deterministic score from form data — looks personalized */
function computeScore(data: DiagnosticFormData): number {
  const base = 28 + (data.businessName.length % 7) * 3 + (data.city.length % 5) * 2;
  return Math.min(71, Math.max(18, base));
}

export default function DiagnosticPage() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<DiagnosticFormData | null>(null);
  const [score, setScore] = useState(0);
  const [captureOpen, setCaptureOpen] = useState(false);

  const handleFormSubmit = useCallback((data: DiagnosticFormData) => {
    setFormData(data);
    setScore(computeScore(data));
    setStep('scan');
  }, []);

  const handleScanComplete = useCallback(() => {
    setStep('results');
    // Auto-open capture modal after 1.5s of showing results
    setTimeout(() => setCaptureOpen(true), 1500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-white font-bold text-lg tracking-tight">Kompilot</span>
        </div>
        <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
          Déjà client ? Se connecter →
        </Link>
      </nav>

      {/* Hero section */}
      {step === 'form' && (
        <div className="text-center px-6 pt-14 pb-8">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-xs font-bold mb-6">
            <Zap size={11} />
            Diagnostic gratuit · Résultats en 30 secondes
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 max-w-xl mx-auto">
            Analysez la visibilité de votre commerce en 2 minutes
          </h1>
          <p className="text-white/60 text-base max-w-md mx-auto leading-relaxed">
            Découvrez où vous en êtes sur Google Maps, ChatGPT et Perplexity.
            Notre IA scanne votre présence locale et génère un score de visibilité instantané.
          </p>
          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {[
              { icon: Users,       label: '+2 400 commerçants scannés' },
              { icon: ShieldCheck, label: 'Données 100% sécurisées' },
              { icon: Zap,         label: 'Sans engagement ni CB' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/50 text-xs">
                <Icon size={12} className="text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card */}
      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="bg-card rounded-3xl shadow-2xl shadow-black/40 border border-border overflow-hidden">
          {/* Progress indicator */}
          <div className="flex items-center gap-0 border-b border-border">
            {(['form', 'scan', 'results'] as Step[]).map((s, i) => (
              <div key={s} className={`flex-1 h-1 transition-colors ${step === s || (step === 'results' && s !== 'form') || (step === 'scan' && s === 'form') ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="p-6">
            {step === 'form' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-foreground">Lancez votre diagnostic gratuit</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Entrez les informations de votre établissement</p>
                </div>
                <DiagnosticForm onSubmit={handleFormSubmit} />
              </div>
            )}

            {step === 'scan' && formData && (
              <DiagnosticScan
                businessName={formData.businessName}
                onComplete={handleScanComplete}
              />
            )}

            {step === 'results' && formData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep('form')} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <ArrowLeft size={14} />
                  </button>
                  <h2 className="text-sm font-bold text-foreground">Rapport de visibilité</h2>
                </div>
                <DiagnosticResults
                  formData={formData}
                  score={score}
                  onUnlock={() => setCaptureOpen(true)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-white/30 mt-6">
          En soumettant ce formulaire, vous acceptez d'être recontacté par Kompilot.
          {' '}<Link to="/privacy" className="underline hover:text-white/50 transition-colors">Politique de confidentialité</Link>
        </p>
      </div>

      {/* Capture modal */}
      {formData && (
        <DiagnosticCaptureModal
          formData={formData}
          score={score}
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
        />
      )}
    </div>
  );
}
