import React, { useState, useEffect } from 'react';
import { Clock, Info, Save, Moon, Sun } from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Checkbox } from '@blinkdotnew/ui';
import toast from 'react-hot-toast';
import { SectionHelp } from '../shared/SectionHelp';

interface DaySlot {
  open: boolean;
  morningOpen: string;
  morningClose: string;
  hasBreak: boolean;
  eveningOpen: string;
  eveningClose: string;
}

type WeekHours = Record<string, DaySlot>;

const DAYS_ORDER = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' }
];

const DEFAULT_SLOT: DaySlot = {
  open: true,
  morningOpen: "08:00",
  morningClose: "12:00",
  hasBreak: true,
  eveningOpen: "14:00",
  eveningClose: "20:00"
};

const INITIAL_HOURS: WeekHours = {
  lundi: { ...DEFAULT_SLOT },
  mardi: { ...DEFAULT_SLOT },
  mercredi: { ...DEFAULT_SLOT },
  jeudi: { ...DEFAULT_SLOT },
  vendredi: { ...DEFAULT_SLOT },
  samedi: { ...DEFAULT_SLOT },
  dimanche: { ...DEFAULT_SLOT, open: false }
};

export function BusinessHoursPanel() {
  const { activeEstablishment } = useEstablishment();
  const [hours, setHours] = useState<WeekHours>(INITIAL_HOURS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`nc_hours_${activeEstablishment.id}`);
    if (saved) {
      try {
        setHours(JSON.parse(saved));
      } catch (e) {
        setHours(INITIAL_HOURS);
      }
    }
  }, [activeEstablishment.id]);

  const handleToggleOpen = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  };

  const handleToggleBreak = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], hasBreak: !prev[day].hasBreak }
    }));
  };

  const handleChangeTime = (day: string, field: keyof DaySlot, value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(`nc_hours_${activeEstablishment.id}`, JSON.stringify(hours));
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Horaires enregistrés');
    }, 500);
  };

  return (
    <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-accent/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Clock className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-bold">Horaires d'ouverture</CardTitle>
        </div>
        <SectionHelp 
          title="Gestion des horaires"
          description="Définissez vos heures d'ouverture pour que l'IA puisse planifier vos campagnes de manière optimale."
          faqs={[
            { q: "Que se passe-t-il si je ferme pour congés ?", a: "Vous pouvez désactiver l'ouverture pour les jours concernés ici. L'IA arrêtera toute proposition automatique durant ces périodes." },
            { q: "C'est quoi la coupure midi ?", a: "C'est un intervalle de temps où votre établissement est fermé au public. L'IA n'enverra aucune alerte flash durant cette période." }
          ]}
        />
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80 leading-snug">
            L'IA Copilote ne proposera jamais de coupon flash ou d'alerte en dehors de vos heures d'ouverture.
          </p>
        </div>

        <div className="space-y-4">
          {DAYS_ORDER.map(({ key, label }) => {
            const slot = hours[key];
            return (
              <div key={key} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl transition-colors ${slot.open ? 'bg-accent/5' : 'bg-muted/30 opacity-60'}`}>
                <div className="w-28 flex items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`open-${key}`} 
                      checked={slot.open} 
                      onCheckedChange={() => handleToggleOpen(key)}
                    />
                    <label htmlFor={`open-${key}`} className="text-sm font-bold cursor-pointer">{label}</label>
                  </div>
                </div>

                {slot.open ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-orange-400" />
                      <input 
                        type="time" 
                        value={slot.morningOpen} 
                        onChange={(e) => handleChangeTime(key, 'morningOpen', e.target.value)}
                        className="bg-background border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input 
                        type="time" 
                        value={slot.morningClose} 
                        onChange={(e) => handleChangeTime(key, 'morningClose', e.target.value)}
                        className="bg-background border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`break-${key}`} 
                        checked={slot.hasBreak} 
                        onCheckedChange={() => handleToggleBreak(key)}
                      />
                      <label htmlFor={`break-${key}`} className="text-xs text-muted-foreground cursor-pointer">Coupure midi</label>
                    </div>

                    {slot.hasBreak && (
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <input 
                          type="time" 
                          value={slot.eveningOpen} 
                          onChange={(e) => handleChangeTime(key, 'eveningOpen', e.target.value)}
                          className="bg-background border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-muted-foreground">-</span>
                        <input 
                          type="time" 
                          value={slot.eveningClose} 
                          onChange={(e) => handleChangeTime(key, 'eveningClose', e.target.value)}
                          className="bg-background border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-muted-foreground italic">Fermé toute la journée</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2 bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer les horaires'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
