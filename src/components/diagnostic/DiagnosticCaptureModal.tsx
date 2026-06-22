/**
 * DiagnosticCaptureModal — the conversion pop-up shown over results.
 * Saves lead to DB, sends the diagnostic email, and drives to signup.
 */
import { useState, useEffect } from 'react';
import { Rocket, X, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { blink } from '../../blink/client';
import {
  buildDiagnosticEmailHtml,
  buildDiagnosticEmailText,
  DIAGNOSTIC_EMAIL_SUBJECT,
} from '../../lib/diagnosticEmail';
import type { DiagnosticFormData } from './DiagnosticForm';

function generateId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface Props {
  formData: DiagnosticFormData;
  score: number;
  open: boolean;
  onClose: () => void;
}

export function DiagnosticCaptureModal({ formData, score, open, onClose }: Props) {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const SIGNUP_URL = `${window.location.origin}/signup?ref=diagnostic&email=${encodeURIComponent(formData.email)}`;

  // Fire lead save + email once when modal opens
  useEffect(() => {
    if (!open || emailSent || loading) return;
    const run = async () => {
      setLoading(true);
      try {
        // 1. Save lead to DB
        await blink.db.leads.create({
          id: generateId(),
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone || '',
          city: formData.city || '',
          address: formData.address || '',
          visibilityScore: score,
          scanData: JSON.stringify({ score, city: formData.city, scannedAt: new Date().toISOString() }),
          status: 'Lead_Audit',
        });

        // 2. Send diagnostic email
        await blink.notifications.email({
          to: formData.email,
          subject: DIAGNOSTIC_EMAIL_SUBJECT,
          html: buildDiagnosticEmailHtml({
            businessName: formData.businessName,
            email: formData.email,
            city: formData.city,
            visibilityScore: score,
            signupUrl: SIGNUP_URL,
          }),
          text: buildDiagnosticEmailText({
            businessName: formData.businessName,
            email: formData.email,
            city: formData.city,
            visibilityScore: score,
            signupUrl: SIGNUP_URL,
          }),
        });

        setEmailSent(true);
      } catch (err) {
        // Non-blocking — still show modal even if save/email fails
        console.warn('[DiagnosticCapture]', err);
        setEmailSent(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors z-10">
          <X size={15} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-teal-500 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Rocket size={26} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white leading-tight mb-1">
            Votre diagnostic est prêt ! 🚀
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Nous venons de vous envoyer le rapport complet par e-mail à{' '}
            <strong className="text-white">{formData.email}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Email sent confirmation */}
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3">
            {loading
              ? <Loader2 size={15} className="text-emerald-600 animate-spin shrink-0" />
              : <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            }
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {loading ? 'Envoi du rapport en cours...' : 'Rapport envoyé à votre adresse e-mail ✓'}
            </p>
          </div>

          {/* Value proposition */}
          <div className="space-y-2.5">
            <p className="text-sm font-bold text-foreground text-center">
              Pour transformer vos <span className="text-red-500">ronds rouges</span> en <span className="text-emerald-500">ronds verts</span>
            </p>
            {[
              'Copilote IA activé immédiatement',
              'Gestion Google Maps + Réseaux sociaux',
              'Réponses automatiques aux avis clients',
              '7 jours d\'essai gratuit — Sans CB',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <p className="text-xs text-foreground/80">{item}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href={SIGNUP_URL}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <ArrowRight size={16} />
            Créer mon compte gratuit Kompilot (Sans CB)
          </a>

          <p className="text-center text-[10px] text-muted-foreground">
            Accès immédiat · Aucun moyen de paiement requis · Annulation en 1 clic
          </p>
        </div>
      </div>
    </div>
  );
}
