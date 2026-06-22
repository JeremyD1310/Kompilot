import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Coins, Save, Upload, X } from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, toast } from '@blinkdotnew/ui';
import { SectionHelp } from '../shared/SectionHelp';

const SECTORS = [
  "Restauration",
  "Beauté / Bien-être",
  "Commerce de détail",
  "Services",
  "Santé",
  "Sport & Loisirs"
];

const CURRENCIES = [
  { label: "€ Euro", value: "EUR" },
  { label: "$ Dollar", value: "USD" },
  { label: "MAD Dirham", value: "MAD" },
  { label: "CHF Franc suisse", value: "CHF" },
  { label: "£ Livre sterling", value: "GBP" },
  { label: "XOF CFA", value: "XOF" }
];

function AgencyLogoUpload() {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('kompilot_agency_logo') || '';
  });
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { blink } = await import('../../blink/client');
      const ext = file.name.split('.').pop() || 'png';
      const path = `agency-logos/${Date.now()}.${ext}`;
      const { publicUrl } = await blink.storage.upload(file, path);
      localStorage.setItem('kompilot_agency_logo', publicUrl);
      setLogoUrl(publicUrl);
      // Dispatch event so other components (CaissePage, Stripe modals) can update
      window.dispatchEvent(new CustomEvent('kompilot:agency-logo-changed', { detail: { url: publicUrl } }));
      toast.success('Logo de l\'agence mis à jour ✅');
    } catch {
      toast.error('Erreur lors de l\'upload. Réessayez.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemove = () => {
    localStorage.removeItem('kompilot_agency_logo');
    setLogoUrl('');
    window.dispatchEvent(new CustomEvent('kompilot:agency-logo-changed', { detail: { url: null } }));
    toast.success('Logo supprimé');
  };
  
  return (
    <Card className="rounded-2xl border-border shadow-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Upload size={13} className="text-violet-500" />
          </div>
          Logo de l'Agence (Marque Blanche)
          <Badge variant="outline" className="ml-auto text-[10px] text-violet-600 border-violet-200">
            Marque Blanche
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Votre logo sera affiché à la place de Kompilot dans l'interface caisse et les modales de paiement.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {logoUrl ? (
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="Logo agence" className="h-16 w-auto max-w-[160px] object-contain rounded-lg border border-border p-1 bg-white" />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => document.getElementById('agency-logo-input')?.click()}>
                <Upload size={12} /> Remplacer
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-destructive hover:text-destructive" onClick={handleRemove}>
                <X size={12} /> Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => document.getElementById('agency-logo-input')?.click()}
            disabled={uploading}
            className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs text-muted-foreground">Upload en cours...</span></>
            ) : (
              <><Upload size={18} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Cliquez pour uploader votre logo</span><span className="text-[10px] text-muted-foreground/60">PNG, JPG, SVG · max 2MB</span></>
            )}
          </button>
        )}
        <input
          id="agency-logo-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </CardContent>
    </Card>
  );
}

export function EstablishmentContextSettings() {
  const { isAgency } = useUserProfile();
  const { activeEstablishment, updateEstablishment } = useEstablishment();
  const [address, setAddress] = useState(activeEstablishment.address || '');
  const [city, setCity] = useState(''); // Assuming city might be part of address or separate
  const [sector, setSector] = useState(activeEstablishment.category || SECTORS[0]);
  const [currency, setCurrency] = useState('EUR');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load currency from localStorage
    const savedCurrency = localStorage.getItem(`nc_currency_${activeEstablishment.id}`);
    if (savedCurrency) setCurrency(savedCurrency);

    // If address contains a comma, assume "Address, City" pattern
    if (activeEstablishment.address.includes(',')) {
      const parts = activeEstablishment.address.split(',');
      setAddress(parts[0].trim());
      setCity(parts.slice(1).join(',').trim());
    } else {
      setAddress(activeEstablishment.address);
    }
  }, [activeEstablishment]);

  const handleSave = async () => {
    if (!address || !city) {
      toast.error('Veuillez remplir l\'adresse et la ville');
      return;
    }

    setIsSaving(true);
    try {
      const fullAddress = `${address}, ${city}`;
      
      updateEstablishment(activeEstablishment.id, {
        address: fullAddress,
        category: sector
      });

      localStorage.setItem(`nc_currency_${activeEstablishment.id}`, currency);
      
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isAgency && <AgencyLogoUpload />}
      <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-accent/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-bold">Identité de l'établissement</CardTitle>
          </div>
          <SectionHelp 
            title="Profil de l'établissement"
            description="Ces informations permettent au Copilote de contextualiser ses recommandations et de localiser précisément vos actions marketing."
            faqs={[
              { q: "Pourquoi le secteur est-il important ?", a: "Chaque secteur a des comportements clients différents. Le Copilote adapte ses algorithmes de prédiction en conséquence." },
              { q: "Puis-je changer la devise plus tard ?", a: "Oui, mais cela n'impactera pas les historiques de transactions déjà enregistrés." }
            ]}
          />
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Adresse complète
              </label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: 12 rue du Commerce"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Ville
              </label>
              <Input 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Bordeaux"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Secteur d'activité
              </label>
              <select 
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Devise
              </label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2 bg-primary hover:bg-primary/90 min-w-[140px]"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
