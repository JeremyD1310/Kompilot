import { useState, useEffect } from 'react';
import { X, Zap, CheckCircle2 } from 'lucide-react';
import { Button, Badge, cn } from '@blinkdotnew/ui';

interface OpportunityAlertProps {
  city: string;
}

export function OpportunityAlert({ city }: OpportunityAlertProps) {
  const STORAGE_KEY = `opportunity_alert_dismissed_${new Date().toISOString().split('T')[0]}`;
  const [isDismissed, setIsDismissed] = useState(true);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, [STORAGE_KEY]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleGenerate = () => {
    setIsGenerated(true);
  };

  if (isDismissed) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-amber-300/60 p-5 shadow-sm transition-all duration-300",
      "bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20"
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-amber-600 transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col gap-3 max-w-[90%]">
        <Badge className="w-fit bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 flex items-center gap-1.5 py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider">
          <Zap size={10} fill="currentColor" />
          Opportunité Contextuelle
        </Badge>

        <div>
          <h4 className="text-sm font-black text-amber-900 dark:text-amber-100">
            Un grand soleil prévu ce weekend à {city}
          </h4>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/70 mt-1 leading-relaxed">
            Vos concurrents n'ont rien publié pour attirer les clients. L'IA a préparé un post Google Maps <strong>'Offre Spéciale Beau Temps'</strong> optimisé G.E.O. — prêt en 1 clic.
          </p>
        </div>

        <div className="mt-2">
          {isGenerated ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs animate-in fade-in slide-in-from-left-2 duration-500">
              <CheckCircle2 size={16} />
              Post planifié pour samedi 10h
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-600/20 px-5 py-5 h-auto text-sm font-bold gap-2"
            >
              Générer en 1 clic 🚀
            </Button>
          )}
        </div>
      </div>
      
      {/* Decorative background flare */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
