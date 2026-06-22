import { useState } from 'react';
import { Send, X, Check } from 'lucide-react';
import type { ExportFormat } from './pitchData';

interface PitchSendModalProps {
  pitch: string;
  format: ExportFormat;
  onClose: () => void;
}

export function PitchSendModal({ pitch, format, onClose }: PitchSendModalProps) {
  const [to, setTo] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Envoyer en {format === 'sms' ? 'SMS' : 'Email'} de test
              </p>
              <p className="text-[11px] text-muted-foreground">Prospection directe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              {format === 'sms' ? 'Numéro de téléphone' : 'Adresse email du prospect'}
            </label>
            <input
              type={format === 'sms' ? 'tel' : 'email'}
              placeholder={format === 'sms' ? '+33 6 12 34 56 78' : 'contact@commerce.fr'}
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Message preview */}
          <div className="rounded-xl bg-muted/40 border border-border p-3">
            <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Aperçu du message
            </p>
            <p className="text-xs text-foreground leading-relaxed line-clamp-4">{pitch}</p>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            ⚠️ Fonctionnalité en mode démo. Connectez votre compte SMS ou Email dans les Paramètres pour envoyer de vrais messages.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {sent ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3">
              <Check size={15} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Message envoyé avec succès !</span>
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!to.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-3 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} /> Envoyer le pitch de prospection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
