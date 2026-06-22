import React, { useState } from 'react';
import {
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast,
} from '@blinkdotnew/ui';
import { CalendarCheck, Map, Wand2, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Establishment, EstablishmentCreate } from '../../hooks/useEstablishments';
import { getPlatformsForSector, type BookingPlatform } from '../../lib/bookingPlatforms';

export const ACTIVITY_OPTIONS = [
  { value: 'restauration', label: 'Restauration' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'artisanat', label: 'Artisanat' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'sport', label: 'Sport' },
  { value: 'sante', label: 'Santé' },
  { value: 'tech', label: 'Tech' },
  { value: 'conseil', label: 'Conseil' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'tourisme', label: 'Tourisme' },
  { value: 'education', label: 'Éducation' },
  { value: 'autre', label: 'Autre' },
];

const DEFAULT_FORM: EstablishmentCreate = {
  name: '', activity: '', city: '', description: '',
  website: '', phone: '', bookingUrl: '', googleMapsUrl: '', aiCreditsLimit: 50, aiCreditsUsed: 0,
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EstablishmentCreate) => void;
  isSubmitting: boolean;
  initial?: Partial<Establishment>;
}

export function EstablishmentModal({ open, onClose, onSubmit, isSubmitting, initial }: ModalProps) {
  const [form, setForm] = useState<EstablishmentCreate>({ ...DEFAULT_FORM, ...initial });
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, ...initial });
      setSelectedPlatformId(null);
    }
  }, [open, initial]);

  const set = (field: keyof EstablishmentCreate, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    if (!form.activity) { toast.error("L'activité est requise"); return; }
    if (!form.city.trim()) { toast.error('La ville est requise'); return; }
    onSubmit(form);
  };

  const isEditing = !!initial?.name;

  const handleAutoGenerateMapsUrl = () => {
    const name = form.name.trim();
    const city = form.city.trim();
    if (!name && !city) {
      toast.error("Renseignez au moins le nom ou la ville d'abord.");
      return;
    }
    const query = encodeURIComponent([name, city].filter(Boolean).join(' '));
    set('googleMapsUrl', `https://www.google.com/maps/search/?api=1&query=${query}`);
    toast.success('Lien Google Maps généré ✓');
  };

  const handleSelectPlatform = (platform: BookingPlatform) => {
    if (selectedPlatformId === platform.id) {
      setSelectedPlatformId(null);
    } else {
      setSelectedPlatformId(platform.id);
      // Only auto-fill if field is empty
      if (!form.bookingUrl?.trim()) {
        set('bookingUrl', platform.baseUrl);
      }
    }
  };

  const sectorPlatforms = getPlatformsForSector(form.activity || '');
  const selectedPlatform = sectorPlatforms?.platforms.find(p => p.id === selectedPlatformId) ?? null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '✏️ Modifier l\'établissement' : '🏪 Nouvel établissement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nom du commerce *</label>
            <Input placeholder="Ex : Boulangerie Dupont" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          {/* Activité */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Activité *</label>
            <Select value={form.activity} onValueChange={v => { set('activity', v); setSelectedPlatformId(null); }}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une activité" /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Ville */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Ville *</label>
            <Input placeholder="Ex : Paris" value={form.city} onChange={e => set('city', e.target.value)} required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Input placeholder="Courte description de l'activité..." value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Site web + Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Site web</label>
              <Input placeholder="https://..." value={form.website ?? ''} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Téléphone</label>
              <Input placeholder="06 00 00 00 00" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          {/* BOOKING SECTION */}
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 p-3.5">
            <div className="flex items-center gap-2">
              <CalendarCheck size={15} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-foreground">Votre outil de réservation en ligne</span>
            </div>

            {/* Platform pills — shown only when sector is known */}
            {sectorPlatforms && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  {sectorPlatforms.sectorLabel} — sélectionnez votre plateforme :
                </p>
                <div className="flex flex-wrap gap-2">
                  {sectorPlatforms.platforms.map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handleSelectPlatform(platform)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        selectedPlatformId === platform.id
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-foreground'
                      )}
                    >
                      <span>{platform.emoji}</span>
                      <span>{platform.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setSelectedPlatformId('other'); }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      selectedPlatformId === 'other'
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                        : 'border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-foreground'
                    )}
                  >
                    🔗 Autre / lien direct
                  </button>
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-1.5">
              <Input
                placeholder={
                  selectedPlatform
                    ? `Ex: ${selectedPlatform.baseUrl}votre-etablissement`
                    : 'https://planity.com/mon-salon — ou lien ZenChef, site web...'
                }
                value={form.bookingUrl ?? ''}
                onChange={e => set('bookingUrl', e.target.value)}
              />
              {selectedPlatform && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ExternalLink size={9} />
                  Collez votre lien {selectedPlatform.name} complet ci-dessus
                </p>
              )}
              {!selectedPlatform && (
                <p className="text-[10px] text-muted-foreground">
                  Utilisé pour le bouton "Réserver 📅" dans le Cockpit IA et les CTAs générés automatiquement
                </p>
              )}
            </div>
          </div>

          {/* Google Maps */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Map size={14} className="text-red-500" />
              Lien Google Maps
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Collez votre lien Google Maps ou cliquez sur Générer →"
                value={form.googleMapsUrl ?? ''}
                onChange={e => set('googleMapsUrl', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoGenerateMapsUrl}
                className="shrink-0 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 px-3"
              >
                <Wand2 size={12} /> Générer
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Affiché sur votre fiche et dans vos contenus SEO. Cliquez sur "Générer" pour créer le lien automatiquement depuis le nom et la ville.
            </p>
          </div>

          {/* Crédits IA */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Limite crédits IA</label>
            <Input
              type="number" min={1} max={1000} placeholder="50"
              value={form.aiCreditsLimit ?? 50}
              onChange={e => set('aiCreditsLimit', parseInt(e.target.value, 10) || 50)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
