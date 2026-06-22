import React, { useState } from 'react';
import { NoShowActivationBanner } from '@/components/dashboard/NoShowActivationBanner';
import { InteractiveOnboardingWizard } from '@/components/onboarding/InteractiveOnboardingWizard';
import { WhiteLabelInstantPreview } from '@/components/agency/WhiteLabelInstantPreview';
import { AgencyDemoDataBanner } from '@/components/agency/AgencyDemoDataBanner';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Tabs, TabsList, TabsTrigger, TabsContent, cn } from '@blinkdotnew/ui';
import { Sparkles, Shield, Building2, LayoutDashboard } from 'lucide-react';

export default function FeaturesShowcasePage() {
  const [showWizard, setShowWizard] = useState(false);
  const userId = "demo-user-123";

  return (
    <Page>
      <PageHeader>
        <PageTitle>Showcase des nouvelles fonctionnalités</PageTitle>
        <PageDescription>
          Aperçu des composants Kompilot développés pour le SaaS.
        </PageDescription>
      </PageHeader>
      
      <PageBody className="space-y-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="agency" className="gap-2">
              <Building2 className="h-4 w-4" /> Agence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 pt-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Bannière Anti-No-Show
              </h3>
              <NoShowActivationBanner 
                userId={userId} 
                onNavigate={() => alert("Navigation vers les paramètres Anti-No-Show")} 
              />
              <p className="text-xs text-muted-foreground italic">
                * Note: Si vous ne la voyez pas, vérifiez localStorage `nosh_banner_dismissed_{userId}`.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Onboarding Interactif
              </h3>
              <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Relancer l'expérience d'onboarding</p>
                  <p className="text-sm text-muted-foreground">Testez le wizard à 3 étapes avec l'IA et le simulateur.</p>
                </div>
                <Button onClick={() => setShowWizard(true)}>
                  Lancer l'Onboarding Pro
                </Button>
              </Card>
              {showWizard && (
                <InteractiveOnboardingWizard 
                  userId={userId} 
                  userSector="Restauration"
                  onComplete={() => {
                    alert("Onboarding complété !");
                    setShowWizard(false);
                  }} 
                />
              )}
            </section>
          </TabsContent>

          <TabsContent value="agency" className="space-y-8 pt-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" /> Bannière Données Démo
              </h3>
              <AgencyDemoDataBanner 
                userId={userId} 
                onExplore={() => alert("Exploration des comptes démo...")} 
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" /> Marque Blanche & Preview
              </h3>
              <WhiteLabelInstantPreview 
                onUpgrade={() => alert("Redirection vers la page des tarifs Growth/Scale")} 
              />
            </section>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card text-card-foreground rounded-xl border shadow-sm", className)}>
    {children}
  </div>
);
