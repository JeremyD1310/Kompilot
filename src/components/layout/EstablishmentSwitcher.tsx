import React, { useState } from 'react';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  Button, 
  Separator, 
  Badge,
  cn,
} from '@blinkdotnew/ui';
import { ChevronDown, Check, Lock, Plus, Loader2, Zap } from 'lucide-react';
import { useEstablishment, Establishment } from '../../context/EstablishmentContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { EstablishmentPaywall } from './EstablishmentPaywall';
import { EstablishmentModal } from '../establishments/EstablishmentModal';
import { useEstablishments } from '../../hooks/useEstablishments';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { blink } from '../../blink/client';

export const EstablishmentSwitcher: React.FC = () => {
  const { 
    establishments, 
    activeEstablishment, 
    setActiveEstablishment, 
    isSwitching,
    isUnlocked,
    isLoadingFromDB,
  } = useEstablishment() as any;
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const { createEstablishment } = useEstablishments(user?.id ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch AI credits for the active establishment
  const { data: creditsData } = useQuery({
    queryKey: ['est-credits', activeEstablishment?.id],
    queryFn: async () => {
      if (!activeEstablishment?.id || activeEstablishment.id.startsWith('est-')) return null;
      try {
        const rows = await blink.db.establishments.list({
          where: { id: activeEstablishment.id },
          limit: 1,
        });
        const row = rows[0] as any;
        if (!row) return null;
        return {
          used: Number(row.aiCreditsUsed ?? 0),
          limit: Number(row.aiCreditsLimit ?? 50),
        };
      } catch { return null; }
    },
    enabled: !!activeEstablishment?.id && !activeEstablishment.id.startsWith('est-'),
    staleTime: 60_000,
  });
  const creditsLeft = creditsData ? creditsData.limit - creditsData.used : null;
  const creditsPercent = creditsData ? Math.round((creditsData.used / creditsData.limit) * 100) : 0;

  const handleSelect = (est: Establishment) => {
    if (!isUnlocked(est.id)) {
      setPaywallOpen(true);
      return;
    }
    setActiveEstablishment(est.id);
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (currentPlan.id !== 'expert') {
      setPaywallOpen(true);
    } else {
      setAddModalOpen(true);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent/50 transition-colors group">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br shrink-0",
              activeEstablishment.color
            )}>
              {isSwitching
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : activeEstablishment.avatar
              }
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {activeEstablishment.shortName}
                {isLoadingFromDB && (
                  <Loader2 className="inline-block w-3 h-3 ml-1.5 animate-spin text-muted-foreground align-middle" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="text-[10px] text-muted-foreground truncate leading-none">
                  {activeEstablishment.category}
                </div>
                {creditsLeft !== null && (
                  <span className={cn(
                    "inline-flex items-center gap-0.5 text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none shrink-0",
                    creditsPercent >= 80
                      ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      : creditsPercent >= 60
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-primary/10 text-primary"
                  )}>
                    <Zap className="w-2 h-2" />
                    {creditsLeft}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all",
              isOpen && "rotate-180"
            )} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 rounded-2xl shadow-xl overflow-hidden border-border z-50" align="start">
          <div className="p-3">
            <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Mes établissements
            </div>
            
            <div className="mt-1 space-y-1">
              {establishments.map((est) => {
                const isActive = activeEstablishment.id === est.id;
                const unlocked = isUnlocked(est.id);
                
                return (
                  <button
                    key={est.id}
                    onClick={() => handleSelect(est)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                      isActive ? "bg-primary/5 border border-primary/10" : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-gradient-to-br shadow-sm",
                      est.color,
                      !unlocked && "grayscale opacity-50"
                    )}>
                      {est.avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium truncate leading-tight",
                        isActive ? "text-primary" : "text-foreground",
                        !unlocked && "text-muted-foreground"
                      )}>
                        {est.shortName}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {est.address}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isActive ? (
                        isSwitching ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-primary" />
                        )
                      ) : !unlocked ? (
                        <div className="flex flex-col items-end gap-1">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-[9px] px-1 h-4 border-muted text-muted-foreground">Expert</Badge>
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="p-1">
            <button
              onClick={handleAdd}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-accent-foreground" />
              </div>
              <span>Ajouter un établissement</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <EstablishmentPaywall 
        open={paywallOpen} 
        onClose={() => setPaywallOpen(false)} 
      />

      <EstablishmentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (data) => {
          await createEstablishment.mutateAsync(data);
          setAddModalOpen(false);
        }}
        isSubmitting={createEstablishment.isPending}
      />
    </>
  );
};