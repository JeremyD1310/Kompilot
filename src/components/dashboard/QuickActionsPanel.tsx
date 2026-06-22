import { useUserProfile } from '../../context/UserProfileContext';
import { useNavigate } from '@tanstack/react-router';
import { Button, Card } from '@blinkdotnew/ui';
import { 
  AlertTriangle, 
  Download, 
  Zap, 
  PlusCircle, 
  BarChart2, 
  FileText,
  MessageSquare,
  Calendar as CalendarIcon,
  Ticket,
  Users,
  LayoutDashboard,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { CreditsTopUpModal } from '../../components/subscription/CreditsTopUpModal';
import { useGoldenAction } from '../../hooks/useOptimisticAction';

type MasterProfile = 'flux' | 'chantier' | 'produits' | 'services_b2b' | 'agence' | null;

export function QuickActionsPanel() {
  const { masterProfile } = useUserProfile();
  const navigate = useNavigate();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  function exportCSV(profile: MasterProfile) {
    const headers = {
      flux: 'Nom,Email,Téléphone,Statut RDV,Montant protégé',
      chantier: 'Maître d\'ouvrage,Email,Téléphone,Zone,Statut devis,Montant',
      produits: 'Client,Email,Téléphone,Dernière commande,Panier moyen',
      services_b2b: 'Mandant,Email,Téléphone,Type contrat,Statut,Valeur',
      agence: 'Sous-compte,Secteur,Score GEO,Statut,CA généré',
    };
    const header = (profile && headers[profile as keyof typeof headers]) ? headers[profile as keyof typeof headers] : 'Nom,Email';
    const csvContent = `${header}\nDonnées exportées le ${new Date().toLocaleDateString('fr-FR')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${profile ?? 'clients'}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const renderActions = () => {
    switch (masterProfile) {
      case 'flux':
        return (
          <>
            <ActionButton 
              icon={<AlertTriangle className="text-red-500" />} 
              label="Mode SOS Crise" 
              variant="sos" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<PlusCircle className="text-white" />} 
              label="Créer un post flash" 
              variant="primary" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<MessageSquare />} 
              label="Répondre aux avis" 
              onClick={() => navigate({ to: '/inbox' })} 
            />
            <ActionButton 
              icon={<CalendarIcon />} 
              label="Voir le calendrier" 
              onClick={() => navigate({ to: '/calendar' })} 
            />
          </>
        );
      case 'chantier':
        return (
          <>
            <ActionButton 
              icon={<Zap className="text-white" />} 
              label="Qualifier un chantier IA" 
              variant="primary" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<AlertTriangle className="text-red-500" />} 
              label="Mode SOS Urgence" 
              variant="sos" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<Download />} 
              label="Exporter chantiers" 
              onClick={() => exportCSV('chantier')} 
            />
            <ActionButton 
              icon={<MessageSquare />} 
              label="Voir les messages" 
              onClick={() => navigate({ to: '/inbox' })} 
            />
          </>
        );
      case 'produits':
        return (
          <>
            <ActionButton 
              icon={<Ticket className="text-white" />} 
              label="Créer coupon flash" 
              variant="primary" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<BarChart2 />} 
              label="Voir mes stats" 
              onClick={() => navigate({ to: '/analytics' })} 
            />
            <ActionButton 
              icon={<Download />} 
              label="Exporter clients" 
              onClick={() => exportCSV('produits')} 
            />
            <ActionButton 
              icon={<MessageSquare />} 
              label="Gérer les avis" 
              onClick={() => navigate({ to: '/inbox' })} 
            />
          </>
        );
      case 'services_b2b':
        return (
          <>
            <ActionButton 
              icon={<FileText className="text-white" />} 
              label="Formulaire lead" 
              variant="primary" 
              onClick={() => navigate({ to: '/cockpit' })} 
            />
            <ActionButton 
              icon={<CalendarIcon />} 
              label="Relances contrats" 
              onClick={() => navigate({ to: '/calendar' })} 
            />
            <ActionButton 
              icon={<Download />} 
              label="Exporter contrats" 
              onClick={() => exportCSV('services_b2b')} 
            />
            <ActionButton 
              icon={<BarChart2 />} 
              label="Rapport performance" 
              onClick={() => navigate({ to: '/analytics' })} 
            />
          </>
        );
      case 'agence':
        return (
          <>
            <ActionButton 
              icon={<PlusCircle className="text-white" />} 
              label="Créer sous-compte" 
              variant="primary" 
              onClick={() => navigate({ to: '/establishments' })} 
            />
            <ActionButton 
              icon={<LayoutDashboard />} 
              label="Rapport G.E.O. global" 
              onClick={() => navigate({ to: '/analytics' })} 
            />
            <ActionButton 
              icon={<Download />} 
              label="Exporter données" 
              onClick={() => exportCSV('agence')} 
            />
            <ActionButton 
              icon={<Zap className="text-teal-500" />} 
              label="Recharger crédits" 
              onClick={() => setIsTopUpOpen(true)} 
            />
          </>
        );
      default:
        return (
          <>
            <ActionButton icon={<Plus />} label="Nouveau Post" onClick={() => navigate({ to: '/cockpit' })} />
            <ActionButton icon={<Download />} label="Exporter" onClick={() => exportCSV(null)} />
            <ActionButton icon={<BarChart2 />} label="Stats" onClick={() => navigate({ to: '/analytics' })} />
            <ActionButton icon={<MessageSquare />} label="Messages" onClick={() => navigate({ to: '/inbox' })} />
          </>
        );
    }
  };

  return (
    <Card data-tour="quick-actions" className="p-4 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-slate-100 font-semibold">
        <Zap className="h-5 w-5 text-teal-600 fill-teal-600/20" />
        <span>Actions Rapides</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {renderActions()}
      </div>
      <CreditsTopUpModal open={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </Card>
  );
}

function ActionButton({ 
  icon, 
  label, 
  onClick, 
  variant = 'default',
  asyncFn
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  variant?: 'default' | 'primary' | 'sos';
  asyncFn?: () => Promise<void>;
}) {
  const { status, trigger } = useGoldenAction(asyncFn ?? (() => Promise.resolve()), { successDuration: 1800 });

  const handleClick = () => {
    trigger();
    setTimeout(onClick, 350);
  };

  const getStyles = () => {
    if (status === 'success') {
      return 'border-amber-400/50 bg-amber-500/10 scale-[1.02] shadow-amber-500/20';
    }
    switch (variant) {
      case 'primary':
        return 'bg-teal-600 hover:bg-teal-700 text-white border-transparent';
      case 'sos':
        return 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10';
      default:
        return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={`h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-xl border shadow-none transition-all active:scale-95 duration-300 ${getStyles()}`}
    >
      <div className="shrink-0 transition-transform duration-300">
        {status === 'success' ? <CheckCircle2 className="text-amber-400 animate-in fade-in zoom-in duration-300" /> : icon}
      </div>
      <span className={`text-[10px] sm:text-xs font-medium text-center line-clamp-1 transition-colors duration-300 ${status === 'success' ? 'text-amber-200' : ''}`}>
        {label}
      </span>
    </Button>
  );
}
