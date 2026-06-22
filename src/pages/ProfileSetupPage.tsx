import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Card, CardContent, Separator
} from '@blinkdotnew/ui';
import { 
  Building2, Clock, Share2, ArrowRight, ArrowLeft, 
  CheckCircle2, PartyPopper, AlertTriangle 
} from 'lucide-react';
import { EstablishmentContextSettings } from '../components/settings/EstablishmentContextSettings';
import { BusinessHoursPanel } from '../components/settings/BusinessHoursPanel';
import { APIConnectionStatus, useAPIConnections } from '../components/settings/APIConnectionStatus';

const STEPS = [
  { id: 1, label: 'Profil', icon: Building2 },
  { id: 2, label: 'Horaires', icon: Clock },
  { id: 3, label: 'Connexions', icon: Share2 },
];

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { hasGBP, hasStripe } = useAPIConnections();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    navigate({ to: '/cockpit' });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <EstablishmentContextSettings />;
      case 2:
        return <BusinessHoursPanel />;
      case 3:
        return <APIConnectionStatus />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === 3;
  const allConnected = hasGBP && hasStripe;

  return (
    <Page className="bg-accent/5 min-h-screen">
      <PageHeader className="max-w-4xl mx-auto pt-12 pb-8 px-6 text-center">
        <PageTitle className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
          <span className="text-4xl">⚙️</span> Configuration de l'Établissement
        </PageTitle>
        <PageDescription className="text-lg text-muted-foreground">
          Étape par étape pour que le Copilote soit prêt à 100%
        </PageDescription>
      </PageHeader>

      <PageBody className="max-w-4xl mx-auto px-6 pb-24 space-y-8">
        {/* Premium Stepper */}
        <div className="flex items-center justify-between px-2 md:px-12 relative mb-12">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
          
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 group">
                <button
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg' : 
                      isCompleted ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 shadow-md' : 
                      'bg-background border-2 border-muted text-muted-foreground'}
                  `}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </button>
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderStepContent()}
        </div>

        {/* Congratulations Card on Step 3 */}
        {isLastStep && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
            <Card className={`border-none shadow-xl ${allConnected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                    {allConnected ? <PartyPopper className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-1">
                      {allConnected ? 'Tout est prêt !' : 'Presque terminé...'}
                    </h3>
                    <p className="text-white/90 leading-relaxed">
                      {allConnected 
                        ? 'Toutes les connexions sont actives. Votre Copilote est désormais en pleine possession de ses moyens pour booster votre visibilité.'
                        : 'Certaines connexions manquent encore. Vous pourrez les finaliser plus tard depuis les paramètres, mais certaines automatisations seront limitées.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2 px-6 h-12 text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <Button
            onClick={handleNext}
            className={`gap-2 px-10 h-12 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
              isLastStep && allConnected ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLastStep ? 'Terminer ✓' : 'Suivant'}
            {!isLastStep && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </PageBody>
    </Page>
  );
}
