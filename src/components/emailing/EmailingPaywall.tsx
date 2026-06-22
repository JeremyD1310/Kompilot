import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@blinkdotnew/ui';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface EmailingPaywallProps {
  open: boolean;
  onClose: () => void;
}

export function EmailingPaywall({ open, onClose }: EmailingPaywallProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            Fonctionnalité Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center space-y-3">
            <p className="text-3xl">✉️</p>
            <p className="text-sm font-semibold text-foreground leading-snug">
              🔒 L'Emailing est une fonctionnalité Premium.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Passez à l'offre <strong className="text-primary">Pro</strong> pour envoyer votre première campagne
              et toucher jusqu'à <strong>500 clients par mois</strong> directement depuis Kompilot.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-muted-foreground">
            {[
              '✅ 500 emails / mois (Pro) ou 5 000 (Expert)',
              '✅ Génération IA du contenu email',
              '✅ Statistiques d\'ouverture & de clic',
              '✅ Scénarios de relance automatiques (Expert)',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Plus tard
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => { onClose(); navigate({ to: '/subscription' }); }}
            >
              <Sparkles size={15} /> Passer au Pro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
