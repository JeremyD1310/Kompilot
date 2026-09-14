/**
 * SendCampaignDialog — Real-time email sending progress dialog
 *
 * Shows sending progress with batch counter, animated progress bar,
 * and final result summary. Uses Blink Notifications SDK under the hood.
 */
import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, toast } from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertTriangle, Loader2, Mail, Clock, ArrowRight } from 'lucide-react';
import { sendCampaign, type CampaignRecipient, type SendResult, type SendCampaignOptions } from '../../lib/campaignEmailService';

interface SendCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  campaignName: string;
  subject: string;
  htmlContent: string;
  recipients: CampaignRecipient[];
  onSendCampaign?: () => Promise<SendResult>;
}

type SendPhase = 'confirm' | 'sending' | 'result';

export function SendCampaignDialog({
  open,
  onClose,
  onComplete,
  campaignName,
  subject,
  htmlContent,
  recipients,
  onSendCampaign,
}: SendCampaignDialogProps) {
  const [phase, setPhase] = useState<SendPhase>('confirm');
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 });
  const [result, setResult] = useState<SendResult | null>(null);

  const handleSend = useCallback(async () => {
    setPhase('sending');
    setProgress({ sent: 0, total: recipients.length, errors: 0 });

    try {
      const sendResult = onSendCampaign
        ? await onSendCampaign()
        : await sendCampaign({
            subject,
            htmlContent,
            recipients,
            batchSize: 10,
            delayMs: 800,
            onProgress: (sent, total, errors) => {
              setProgress({ sent, total, errors });
            },
          });

      setResult(sendResult);
      setPhase('result');

      if (sendResult.totalSent > 0) {
        toast.success(`${sendResult.totalSent} email(s) envoyé(s)`, {
          description: sendResult.totalFailed > 0
            ? `${sendResult.totalFailed} échec(s) sur ${sendResult.totalRecipients} destinataires.`
            : `Campagne envoyée avec succès à ${sendResult.totalSent} destinataires.`,
        });
      } else {
        toast.error("Aucun email n'a pu être envoyé.");
      }
    } catch (err: any) {
      setPhase('result');
      setResult({
        totalSent: 0,
        totalFailed: recipients.length,
        totalRecipients: recipients.length,
        errors: [{ email: 'all', error: err?.message || 'Erreur inconnue' }],
        duration: 0,
      });
      toast.error("Erreur lors de l'envoi", { description: err?.message });
    }
  }, [subject, htmlContent, recipients, onSendCampaign]);

  const handleClose = () => {
    if (phase === 'sending') return; // prevent close while sending
    setPhase('confirm');
    setResult(null);
    setProgress({ sent: 0, total: 0, errors: 0 });
    onClose();
  };

  const handleDone = () => {
    onComplete();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            {phase === 'confirm' ? 'Confirmer l\'envoi' : phase === 'sending' ? 'Envoi en cours…' : 'Rapport d\'envoi'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Confirmation ─────────────────────── */}
          {phase === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Campagne</span>
                  <span className="font-medium text-foreground">{campaignName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Objet</span>
                  <span className="font-medium text-foreground truncate max-w-[200px]">{subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destinataires</span>
                  <span className="font-bold text-primary">{recipients.length} contacts</span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Cette action est irrévocable. Les emails seront envoyés immédiatement à tous les destinataires sélectionnés.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">
                  Annuler
                </Button>
                <Button onClick={handleSend} className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
                  <Send size={14} /> Envoyer maintenant
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Sending progress ─────────────────── */}
          {phase === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Send size={24} className="text-primary animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Envoi en cours…
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.sent} / {progress.total} emails envoyés
                  {progress.errors > 0 && <span className="text-destructive ml-1">({progress.errors} erreurs)</span>}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(progress.sent / Math.max(progress.total, 1)) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  {Math.round((progress.sent / Math.max(progress.total, 1)) * 100)}%
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Result ───────────────────────────── */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Success summary */}
              <div className="flex flex-col items-center gap-3 py-4">
                {result.totalSent > 0 ? (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-destructive" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {result.totalSent > 0 ? 'Campagne envoyée !' : 'Échec de l\'envoi'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.totalSent}/{result.totalRecipients} emails envoyés
                    {result.duration > 0 && ` en ${(result.duration / 1000).toFixed(1)}s`}
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Envoyés', value: result.totalSent, color: 'text-emerald-600 bg-emerald-500/10' },
                  { label: 'Échecs', value: result.totalFailed, color: result.totalFailed > 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted/50' },
                  { label: 'Durée', value: `${(result.duration / 1000).toFixed(0)}s`, color: 'text-primary bg-primary/10' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl p-3 text-center ${stat.color}`}>
                    <p className="text-xl font-black">{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Error details */}
              {result.errors.length > 0 && result.errors.length <= 5 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                  <p className="text-xs font-semibold text-destructive">Détails des erreurs :</p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-destructive/80">• {err.email}: {err.error}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">
                  Fermer
                </Button>
                <Button onClick={handleDone} className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
                  Terminer <ArrowRight size={14} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
