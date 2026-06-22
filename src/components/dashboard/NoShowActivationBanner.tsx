import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { Button, Card, cn } from '@blinkdotnew/ui';

interface NoShowActivationBannerProps {
  userId: string;
  onNavigate: () => void;
}

export const NoShowActivationBanner: React.FC<NoShowActivationBannerProps> = ({
  userId,
  onNavigate,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(`nosh_banner_dismissed_${userId}`);
    if (isDismissed) return;

    const showUntilKey = `nosh_show_until_${userId}`;
    let showUntilStr = localStorage.getItem(showUntilKey);

    if (!showUntilStr) {
      // First time seeing the banner, set the 7-day window
      const now = new Date();
      const showUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      showUntilStr = showUntil.toISOString();
      localStorage.setItem(showUntilKey, showUntilStr);
    }

    const showUntilDate = new Date(showUntilStr);
    if (new Date() < showUntilDate) {
      setIsVisible(true);
    }
  }, [userId]);

  const handleDismiss = () => {
    localStorage.setItem(`nosh_banner_dismissed_${userId}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="px-4 py-2 w-full animate-fade-in-down">
      <Card className="relative overflow-hidden border-none bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <div className="flex items-center gap-4 flex-1">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1 text-sm sm:text-base">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <span className="sm:hidden text-primary">🛡️</span>
              Sécurisez votre premier week-end
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Configurez votre bouclier anti-no-show en 2 clics pour bloquer les pertes financières.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onNavigate}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground group"
          >
            Configurer en 2 clics
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <button
            onClick={handleDismiss}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  );
};
