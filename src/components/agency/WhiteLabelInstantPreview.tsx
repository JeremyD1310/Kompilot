import React, { useState, useEffect } from 'react';
import { Upload, Globe, ArrowRight, Monitor, Smartphone, Check, Lock, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  Badge,
  cn,
  toast,
} from '@blinkdotnew/ui';
import { useTracking } from '@/hooks/useTracking';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/blink/client';

interface WhiteLabelInstantPreviewProps {
  onUpgrade: () => void;
}

const WHITE_LABEL_KEY = 'kompilot_white_label';

export const WhiteLabelInstantPreview: React.FC<WhiteLabelInstantPreviewProps> = ({
  onUpgrade
}) => {
  const { user } = useAuth();
  const [agencyName, setAgencyName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { trackAudienceSignal } = useTracking();

  // ── Load persisted settings on mount ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    // Load from localStorage first (instant)
    try {
      const stored = localStorage.getItem(`${WHITE_LABEL_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as { agencyName?: string; logo?: string };
        if (parsed.agencyName) setAgencyName(parsed.agencyName);
        if (parsed.logo) setLogo(parsed.logo);
      }
    } catch { /* noop */ }
    // Also load from DB (authoritative)
    blink.db.establishments.list({ where: { userId: user.id }, limit: 1 })
      .then(rows => {
        const row = rows[0];
        if (row?.name && !agencyName) setAgencyName(row.name);
      })
      .catch(() => {});
  }, [user?.id]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── File size guard: 5 MB max for logos ──────────────────────────────────
    const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_LOGO_SIZE) {
      alert('Le logo ne doit pas dépasser 5 Mo. Veuillez utiliser une image plus légère.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
      if (agencyName.trim() && user?.id) {
        trackAudienceSignal('White_Label_Activated').catch(() => {});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!agencyName.trim()) {
      toast.error('Renseignez le nom de votre agence avant de sauvegarder.');
      return;
    }
    setSaving(true);
    try {
      // Persist in localStorage (instant, offline-safe)
      if (user?.id) {
        localStorage.setItem(`${WHITE_LABEL_KEY}_${user.id}`, JSON.stringify({ agencyName, logo }));
      }
      // Also update user metadata via auth
      await blink.auth.updateMe({ displayName: agencyName });
      setSaved(true);
      toast.success('Configuration marque blanche sauvegardée', {
        description: `Les paramètres de "${agencyName}" sont enregistrés.`,
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde', { description: 'Vos paramètres sont conservés localement.' });
    } finally {
      setSaving(false);
    }
  };

  const agencySlug = agencyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const previewUrl = agencySlug ? `https://${agencySlug}.kompilot.ai` : 'https://votre-agence.kompilot.ai';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-indigo-500/20 shadow-xl shadow-indigo-500/5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Marque Blanche instantanée</h3>
              <p className="text-indigo-100 text-sm">Prévualisez votre plateforme aux couleurs de votre agence</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  Nom de votre Agence
                </label>
                <Input 
                  placeholder="ex: Zenith Marketing" 
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="focus:ring-indigo-500 border-indigo-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  Logo de l'Agence
                </label>
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleLogoUpload}
                    accept="image/*"
                  />
                  <div className={cn(
                    "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all",
                    logo ? "border-indigo-400 bg-indigo-50/50" : "border-muted-foreground/20 hover:border-indigo-400 hover:bg-indigo-50/30"
                  )}>
                    {logo ? (
                      <div className="relative h-16 w-full flex items-center justify-center">
                        <img src={logo} alt="Agency Logo" className="max-h-full max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Upload className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                        <span className="text-xs text-muted-foreground text-center">
                          Glissez votre logo ou cliquez pour parcourir<br/>
                          (PNG, JPG, SVG conseillés)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center border border-dashed border-muted-foreground/20">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                <Globe className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">Lien d'accès client</p>
                <code className="text-sm px-3 py-1 bg-white rounded-lg border border-indigo-100 text-indigo-600 block">
                  {previewUrl}
                </code>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                onClick={() => setIsPreviewOpen(true)}
              >
                Voir l'aperçu <Monitor className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-50 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
              onClick={handleSave}
              disabled={saving || !agencyName.trim()}
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sauvegardé !</>
              ) : saving ? (
                <><span className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
              ) : (
                <><Save className="h-4 w-4" /> Sauvegarder les paramètres</>
              )}
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Activer mon domaine <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-50">
          <div className="bg-white border-b px-6 h-16 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              {logo ? (
                <img src={logo} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold italic">
                  NC
                </div>
              )}
              <span className="font-bold text-lg">{agencyName || 'Kompilot Agency'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" /> https://{agencySlug || 'agence'}.app.io
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Smartphone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-indigo-50 text-indigo-600"><Monitor className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Sidebar Mockup */}
            <div className="w-64 bg-slate-900 text-slate-300 p-4 space-y-4 shrink-0 hidden md:block">
              <div className="space-y-1">
                <div className="h-8 bg-indigo-500/20 rounded-lg flex items-center px-3 text-indigo-400 text-sm font-medium">
                  Tableau de bord
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-8 rounded-lg flex items-center px-3 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                    Menu Item {i}
                  </div>
                ))}
              </div>
              <div className="pt-4 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 pb-2 tracking-wider">Clients</div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2 px-3 h-8">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="h-2 w-24 bg-slate-700 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content Mockup */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Bienvenue sur votre espace Agence</h1>
                  <p className="text-slate-500">Gérez l'ensemble de vos comptes clients Kompilot.</p>
                </div>
                <Button className="bg-indigo-600 text-white">Nouveau Client</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 border-none shadow-sm space-y-3">
                    <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Globe className="h-10 w-10 text-slate-300" />
                    </div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <CustomDomainUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={onUpgrade}
      />
    </div>
  );
};

interface CustomDomainUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const CustomDomainUpgradeModal: React.FC<CustomDomainUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner">
            <ShieldCheck className="h-10 w-10 text-indigo-600" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold">Passez au plan Growth ou Scale</DialogTitle>
            <DialogDescription className="text-base">
              Liez votre propre nom de domaine et lancez vos clients sous votre propre marque.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {[
            "Nom de domaine personnalisé (SSL inclus)",
            "Suppression du logo Kompilot",
            "Emails transactionnels personnalisés",
            "Dashboard clients multi-marques"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-1/2 order-2 sm:order-1">
            Fermer
          </Button>
          <Button 
            className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white order-1 sm:order-2"
            onClick={() => {
              onUpgrade();
              onClose();
            }}
          >
            Voir les offres <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
