import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, toast,
} from '@blinkdotnew/ui';
import { Globe, Check, Bot } from 'lucide-react';

function LinkedinIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>; }
function InstagramIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>; }
function FacebookIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>; }
function GoogleIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" /></svg>; }

const CHANNELS = [
  { id: 'website', label: 'Mon site web', icon: Globe, color: 'text-primary' },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: 'text-blue-600' },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'text-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-blue-500' },
  { id: 'google_business', label: 'Google Business', icon: GoogleIcon, color: 'text-orange-500' },
];

export interface VacationConfig {
  startDate: string;
  endDate: string;
  reason: string;
  channels: string[];
  message: string;
  syncGoogleMaps?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onActivate: (config: VacationConfig) => void;
}

const today = new Date().toISOString().split('T')[0];

export function VacationModeModal({ open, onClose, onActivate }: Props) {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(CHANNELS.map(c => c.id));
  const [syncGoogleMaps, setSyncGoogleMaps] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (id: string) =>
    setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleActivate = async () => {
    if (!startDate || !endDate) { toast.error('Veuillez sélectionner les dates.'); return; }
    if (!reason.trim()) { toast.error('Veuillez indiquer une raison.'); return; }
    if (channels.length === 0) { toast.error('Sélectionnez au moins un canal.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    onActivate({ startDate, endDate, reason, channels, message, syncGoogleMaps });
    setSaving(false);
    toast.success('Mode Vacances activé !', {
      description: `Du ${startDate} au ${endDate}.${syncGoogleMaps ? ' Google Maps et réseaux synchronisés ✅' : ''}`
    });
    onClose();
  };

  const handleClose = () => {
    setStartDate(today); setEndDate(''); setReason(''); setMessage('');
    setChannels(CHANNELS.map(c => c.id));
    setSyncGoogleMaps(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">🌴</div>
            Mode Vacances
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-1">
          {/* AI confirmation message */}
          <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 to-teal-500/5 px-4 py-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Kompilot IA</p>
              <p className="text-sm text-foreground leading-relaxed">
                Votre copilote va <strong>synchroniser vos horaires</strong>, rédiger les <strong>publications de fermeture</strong> et configurer l'Inbox pour rediriger vos clients vers la <strong>réouverture</strong>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date de départ</Label>
              <Input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date de retour</Label>
              <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Raison de l'absence</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Congés annuels', 'Fermeture estivale', 'Déplacement professionnel', 'Autre'].map(r => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    reason === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground hover:border-primary/40'
                  }`}>{r}</button>
              ))}
            </div>
            <Input placeholder="Précisez la raison..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Message personnalisé <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
            <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px]"
              placeholder="Ex : Nous serons de retour le [date]. Merci pour votre compréhension !"
              value={message} onChange={e => setMessage(e.target.value)} />
          </div>

          {/* Sync Google Maps + social post */}
          <div className={`flex items-start gap-3 px-3 py-3 rounded-xl border transition-all cursor-pointer ${syncGoogleMaps ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
            onClick={() => setSyncGoogleMaps(!syncGoogleMaps)}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${syncGoogleMaps ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background'}`}>
              {syncGoogleMaps && <Check size={11} className="text-primary-foreground" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                Mettre à jour automatiquement ma fiche Google Maps et publier un post d'information sur mes réseaux
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                L'IA rédigera un post d'annonce et synchronisera vos horaires sur Google Business pour toute la période.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Canaux à synchroniser</Label>
              <button type="button" onClick={() => setChannels(prev => prev.length === CHANNELS.length ? [] : CHANNELS.map(c => c.id))} className="text-xs text-primary hover:underline">
                {channels.length === CHANNELS.length ? 'Tout décocher' : 'Tout cocher'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const checked = channels.includes(ch.id);
                return (
                  <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-card'}`}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background'}`}>
                      {checked && <Check size={11} className="text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <Icon />
                    <span className={checked ? 'font-medium text-foreground' : 'text-muted-foreground'}>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button onClick={handleActivate} disabled={saving} className="gap-2">
            {saving ? '⏳ Activation...' : '🌴 Activer le mode vacances'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}