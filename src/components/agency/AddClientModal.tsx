/**
 * AddClientModal — dialog to add a new client to the agency dashboard.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  toast,
} from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { SECTOR_EMOJIS, type MockClient } from './ClientCard';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';

export const ACTIVITY_OPTIONS = ['Restaurant', 'Salon de coiffure', 'Automobile', 'Pharmacie', 'Santé', 'Boulangerie', 'Autre'];

export function AddClientModal({ open, onClose, onAdd, userId }: {
  open: boolean;
  onClose: () => void;
  onAdd: (client: MockClient) => void;
  userId: string;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Restaurant');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load agency notification settings to apply to new sub-accounts if configured
  const { settings: agencyNotifSettings } = useNotificationSettings(userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      const newClientUserId = crypto.randomUUID();
      await blink.db.agencySubAccounts.create({
        id,
        agencyUserId: userId,
        clientUserId: newClientUserId,
        clientName: name.trim(),
        planId: type,
        isActive: 1,
      });

      // If the agency has enabled sub-account inheritance, apply notification settings to the new client
      if (agencyNotifSettings.applyToSubAccounts) {
        try {
          await blink.db.userNotificationSettings.create({
            userId: newClientUserId,
            showGeoAlerts:    agencyNotifSettings.showGeoAlerts    ? 1 : 0,
            showStripeAlerts: agencyNotifSettings.showStripeAlerts ? 1 : 0,
            showSmsAlerts:    agencyNotifSettings.showSmsAlerts    ? 1 : 0,
            showRaidAlerts:   agencyNotifSettings.showRaidAlerts   ? 1 : 0,
            showLeadAlerts:   agencyNotifSettings.showLeadAlerts   ? 1 : 0,
            applyToSubAccounts: 0, // Sub-accounts don't propagate further
          });
        } catch {
          // Non-blocking — log but don't fail the client creation
          console.warn('[AddClientModal] Could not apply notification settings to sub-account');
        }
      }
      const newClient: MockClient = {
        id,
        name: name.trim(),
        type,
        city: city.trim(),
        geoScore: Math.floor(Math.random() * 30) + 60,
        trend: Math.floor(Math.random() * 15) + 1,
        reviewsUnread: 0,
        status: 'ok' as const,
        emoji: SECTOR_EMOJIS[type] ?? '🏢',
      };
      onAdd(newClient);
      toast.success('Client ajouté avec succès', {
        description: `${name.trim()} a été ajouté à votre tableau de bord.`,
      });
      setName('');
      setType('Restaurant');
      setCity('');
      onClose();
    } catch (err) {
      console.error('AddClientModal error:', err);
      toast.error('Erreur lors de l\'ajout du client', {
        description: 'Veuillez réessayer.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
    borderRadius: 8, fontSize: '.88rem', color: 'hsl(var(--foreground))',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            Ajouter un client
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Nom du commerce
            </label>
            <input
              style={inputStyle}
              placeholder="ex : Boulangerie Martin"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Type d'activité
            </label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {ACTIVITY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{SECTOR_EMOJIS[opt]} {opt}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Ville
            </label>
            <input
              style={inputStyle}
              placeholder="ex : Paris, Lyon, Bordeaux…"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !city.trim()}
              className="flex-1 gap-2"
            >
              {submitting ? 'Ajout en cours…' : <><Plus size={14} /> Ajouter</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
