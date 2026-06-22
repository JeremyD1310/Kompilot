import { useState } from 'react';
import { Button, Badge } from '@blinkdotnew/ui';
import { MapPin, Zap, Pencil, Trash2, CalendarCheck, ExternalLink, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Establishment } from '../../hooks/useEstablishments';

const ACTIVITY_OPTIONS = [
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

function CreditsBar({ used, limit }: { used: number; limit: number }) {
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = percent < 60 ? 'bg-emerald-500' : percent < 80 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percent < 60 ? 'text-emerald-600' : percent < 80 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className={textColor} />
          <span className="text-[11px] text-muted-foreground font-medium">{used} / {limit} crédits IA</span>
        </div>
        <span className={`text-[10px] font-bold ${textColor}`}>{Math.round(percent)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface EstablishmentCardProps {
  establishment: Establishment;
  onEdit: (e: Establishment) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function EstablishmentCard({ establishment, onEdit, onDelete, isDeleting }: EstablishmentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const activityLabel = ACTIVITY_OPTIONS.find(a => a.value === establishment.activity)?.label ?? establishment.activity;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground leading-tight truncate">{establishment.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin size={12} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{establishment.city}</span>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0 text-[11px] font-medium">
          {activityLabel}
        </Badge>
      </div>

      {/* Description */}
      {establishment.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{establishment.description}</p>
      )}

      {/* Links row: Google Maps + Booking */}
      {(establishment.googleMapsUrl || establishment.bookingUrl) && (
        <div className="flex flex-wrap gap-2">
          {establishment.googleMapsUrl && (
            <a
              href={establishment.googleMapsUrl.startsWith('http') ? establishment.googleMapsUrl : `https://${establishment.googleMapsUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100 transition-colors w-fit max-w-full"
              onClick={e => e.stopPropagation()}
            >
              <Navigation size={11} className="shrink-0" />
              <span className="truncate">Voir sur Google Maps</span>
              <ExternalLink size={9} className="shrink-0 opacity-60" />
            </a>
          )}
          {establishment.bookingUrl && (
            <a
              href={establishment.bookingUrl.startsWith('http') ? establishment.bookingUrl : `https://${establishment.bookingUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors w-fit max-w-full"
              onClick={e => e.stopPropagation()}
            >
              <CalendarCheck size={11} className="shrink-0" />
              <span className="truncate">Réservation en ligne</span>
              <ExternalLink size={9} className="shrink-0 opacity-60" />
            </a>
          )}
        </div>
      )}

      {/* Credits bar */}
      <CreditsBar used={establishment.aiCreditsUsed ?? 0} limit={establishment.aiCreditsLimit ?? 50} />

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {establishment.website && (
            <a
              href={establishment.website.startsWith('http') ? establishment.website : `https://${establishment.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline truncate max-w-[120px]"
            >
              {establishment.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {establishment.phone && !establishment.website && (
            <span className="text-[11px] text-muted-foreground">{establishment.phone}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border hover:border-primary/40 hover:text-primary" onClick={() => onEdit(establishment)}>
            <Pencil size={13} />
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 px-2 text-[11px] rounded-lg" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>Annuler</Button>
              <Button variant="destructive" size="sm" className="h-8 px-2 text-[11px] rounded-lg" onClick={() => { onDelete(establishment.id); setConfirmDelete(false); }} disabled={isDeleting}>
                {isDeleting ? '...' : 'Confirmer'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border hover:border-red-400/60 hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
