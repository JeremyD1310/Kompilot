/**
 * AddWebhookModal — Dialog for creating a new HTTP webhook.
 */
import { Webhook } from 'lucide-react';
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@blinkdotnew/ui';
import { EVENT_LABELS } from './WebhookTypes';
import type { WebhookEvent } from './WebhookTypes';

// ── Shared input className ────────────────────────────────────────────────────

const inputCls =
  'w-full h-10 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddWebhookModalProps {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  newLabel:       string;
  onLabelChange:  (v: string) => void;
  newUrl:         string;
  onUrlChange:    (v: string) => void;
  selectedEvents: WebhookEvent[];
  onToggleEvent:  (ev: WebhookEvent) => void;
  onConfirm:      () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddWebhookModal({
  open, onOpenChange,
  newLabel, onLabelChange,
  newUrl, onUrlChange,
  selectedEvents, onToggleEvent,
  onConfirm,
}: AddWebhookModalProps) {
  const canSubmit = newUrl.trim() !== '' && newLabel.trim() !== '' && selectedEvents.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un webhook</DialogTitle>
          <DialogDescription>
            Configurez un endpoint HTTP pour recevoir les événements Kompilot en temps réel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Label */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">Nom du webhook</label>
            <input
              value={newLabel}
              onChange={e => onLabelChange(e.target.value)}
              placeholder="ex: HubSpot Production"
              className={inputCls}
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">URL de l'endpoint</label>
            <input
              value={newUrl}
              onChange={e => onUrlChange(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className={inputCls}
            />
          </div>

          {/* Events */}
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Événements à écouter</label>
            <div className="space-y-2">
              {(Object.keys(EVENT_LABELS) as WebhookEvent[]).map(ev => (
                <label key={ev} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev)}
                    onChange={() => onToggleEvent(ev)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span
                    className="text-xs font-medium transition-colors"
                    style={{
                      color: selectedEvents.includes(ev)
                        ? EVENT_LABELS[ev].color
                        : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {EVENT_LABELS[ev].label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onConfirm} disabled={!canSubmit} className="gap-2">
            <Webhook size={14} />
            Créer le webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
