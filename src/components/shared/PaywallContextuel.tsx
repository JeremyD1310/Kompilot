import React from 'react';
import { Button } from '@blinkdotnew/ui';
import { Lock, Rocket, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaywallContextuelProps {
  featureName: string;
  opportunityCount?: number;
  onUpgrade: () => void;
  children: React.ReactNode;
}

export function PaywallContextuel({ 
  featureName, 
  opportunityCount, 
  onUpgrade, 
  children 
}: PaywallContextuelProps) {
  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Background Content (Blurred) */}
      <div className="w-full h-full pointer-events-none select-none">
        {children}
      </div>

      {/* Premium Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-20 flex items-center justify-center p-6 backdrop-blur-[8px] bg-background/60"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20 }}
          className="max-w-md w-full bg-card border border-border shadow-2xl rounded-3xl p-8 text-center space-y-6 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center gap-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <Lock size={32} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Fonctionnalité Premium</h3>
              <p className="text-muted-foreground leading-relaxed">
                Votre Copilote a détecté <span className="text-emerald-500 font-bold">{opportunityCount ?? 'X'}</span> opportunités de croissance prêtes à être activées pour <span className="font-semibold text-foreground">{featureName}</span>.
              </p>
            </div>

            <Button 
              onClick={onUpgrade}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 gap-2 transition-transform active:scale-95 group"
            >
              <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Débloquer mon Copilote Pro 🚀
            </Button>

            <div className="grid grid-cols-1 gap-2 pt-2">
              {[
                "Sans engagement",
                "Accès immédiat",
                "Annulation en 1 clic"
              ].map((text, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
