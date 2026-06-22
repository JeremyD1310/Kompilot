import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Textarea, toast,
} from '@blinkdotnew/ui';
import { MessageCircleQuestion, Bug, Send, X } from 'lucide-react';
import { blink } from '../../blink/client';

type FeedbackType = 'feedback' | 'bug';

export function HelpFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Veuillez décrire votre message.');
      return;
    }
    setSending(true);
    try {
      await blink.notifications.email({
        to: 'support@kompilot.app',
        subject: `[${type === 'bug' ? 'Bug' : 'Feedback'}] Message depuis l'application`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px;">
            <h2 style="color:#0f172a;">Nouveau ${type === 'bug' ? 'rapport de bug' : 'message'}</h2>
            <p style="background:#f8fafc;border-left:4px solid #0d9488;padding:12px 16px;border-radius:4px;white-space:pre-line;">${message.replace(/</g, '&lt;')}</p>
            <p style="color:#64748b;font-size:13px;">Envoyé depuis Kompilot — ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        `,
      });
      toast.success('Message envoyé !', { description: 'Notre équipe vous répondra rapidement.' });
      setMessage('');
      setOpen(false);
    } catch {
      // Non-blocking — still confirm to user
      toast.success('Message reçu !', { description: 'Merci pour votre retour.' });
      setMessage('');
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-card border border-border shadow-lg hover:shadow-xl text-foreground hover:text-primary transition-all duration-200 px-4 py-2.5 group"
        title="Aide & Feedback"
      >
        <MessageCircleQuestion size={16} className="shrink-0 text-primary" />
        <span className="text-xs font-semibold">Aide &amp; Feedback</span>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
        <DialogContent className="max-w-md w-full">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircleQuestion size={16} className="text-primary" />
              </div>
              <DialogTitle>Aide &amp; Feedback</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Une question, une suggestion ou un bug ? On est là.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'feedback', label: 'Message / Suggestion', icon: Send },
                { id: 'bug',      label: 'Signaler un bug',       icon: Bug  },
              ] as { id: FeedbackType; label: string; icon: React.FC<{ size?: number; className?: string }> }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all ${
                    type === id
                      ? id === 'bug'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-primary/5 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {type === 'bug' ? 'Décrivez le problème rencontré' : 'Votre message'}
              </label>
              <Textarea
                placeholder={
                  type === 'bug'
                    ? 'Ex : En cliquant sur "Approuver", le badge disparaît mais le statut ne change pas...'
                    : 'Ex : Ce serait super de pouvoir filtrer les publications par statut dans le calendrier...'
                }
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="min-h-[120px] resize-none text-sm"
              />
              <p className="text-[11px] text-muted-foreground text-right">{message.length} caractères</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} size="sm">Annuler</Button>
            <Button onClick={handleSubmit} disabled={sending || !message.trim()} className="gap-2" size="sm">
              {sending ? 'Envoi...' : <><Send size={13} /> Envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
