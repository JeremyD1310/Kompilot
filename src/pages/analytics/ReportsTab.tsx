import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Switch,
  toast
} from '@blinkdotnew/ui';
import {
  Lock,
  Download,
  Mail,
  Users,
  MessageSquare,
} from 'lucide-react';
import { LinkedinIcon, InstagramIcon } from '../../components/icons/SocialIcons';
import { useSubscription } from '../../context/SubscriptionContext';

export function ReportsTab() {
  const { currentPlan } = useSubscription();
  const isExpert = currentPlan?.id === 'expert';

  if (!isExpert) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
        <CardContent className="py-12 flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 relative">
            <Lock className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-20" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Fonctionnalité Expert</h3>
          <p className="text-muted-foreground max-w-[500px] mb-8">
            Débloquez les rapports PDF hebdomadaires automatisés pour obtenir un récapitulatif complet de vos performances et celles de vos concurrents directement par email.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
            <div className="flex items-center gap-2 text-sm text-left px-4 py-2 bg-white/50 rounded-lg">
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">✓</Badge>
              Rapports PDF personnalisés
            </div>
            <div className="flex items-center gap-2 text-sm text-left px-4 py-2 bg-white/50 rounded-lg">
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">✓</Badge>
              Analyse concurrentielle poussée
            </div>
            <div className="flex items-center gap-2 text-sm text-left px-4 py-2 bg-white/50 rounded-lg">
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">✓</Badge>
              Envoi automatique par email
            </div>
            <div className="flex items-center gap-2 text-sm text-left px-4 py-2 bg-white/50 rounded-lg">
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">✓</Badge>
              Conseils d'IA sur mesure
            </div>
          </div>
          <Button className="w-full max-w-xs h-12 text-lg font-bold" onClick={() => toast.info('Redirection vers la page d\'abonnement')}>
            Passer à Expert — 39€/mois
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Rapport de Performance - Mai 2026</CardTitle>
            <CardDescription>Récapitulatif mensuel de votre activité et engagement.</CardDescription>
          </div>
          <Button onClick={() => toast.promise(new Promise(r => setTimeout(r, 2000)), {
            loading: 'Génération du rapport...',
            success: 'Rapport généré et téléchargé !',
            error: 'Erreur lors de la génération.',
          })}>
            <Download className="h-4 w-4 mr-2" /> Télécharger (PDF)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="p-8 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Mois écoulé</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">48.2k</p>
                  <p className="text-xs text-muted-foreground">Portée totale (+22%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">6.4%</p>
                  <p className="text-xs text-muted-foreground">Engagement (+1.2pt)</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Canal Top</p>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
                  <LinkedinIcon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-lg font-bold">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">45% de votre audience</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-[#ec4899]/10 rounded-lg flex items-center justify-center">
                  <InstagramIcon className="w-6 h-6 text-[#ec4899]" />
                </div>
                <div>
                  <p className="text-lg font-bold">Instagram</p>
                  <p className="text-xs text-muted-foreground">Croissance de +15%</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l pl-8">
              <div className="h-20 w-20 rounded-full border-4 border-primary border-t-transparent animate-spin-slow mb-4" />
              <p className="text-sm font-semibold">Analyse IA en cours...</p>
              <p className="text-[10px] text-muted-foreground">Génération de conseils personnalisés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Rapport automatique hebdomadaire</p>
                <p className="text-sm text-muted-foreground">Recevez vos statistiques chaque lundi matin à 8h00.</p>
              </div>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.success(checked ? 'Rapports automatiques activés' : 'Rapports automatiques désactivés')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
