import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Star, Sparkles, ShieldCheck,
  Zap, Ticket, CheckCircle2,
} from 'lucide-react';
import { Button, Card, Badge, Progress, Stat, StatGroup } from '@blinkdotnew/ui';
import { usePremiumWin } from '@/components/shared/PremiumWinEngine';
import { FeedItem, MiniStat } from './DemoShared';

/* ── Demo Coupon Validation Card ───────────────────────────── */
function CouponDemoCard() {
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'success'>('idle');
  const { triggerWin } = usePremiumWin();

  const handleDemoValidate = () => {
    setDemoState('loading');
    setTimeout(() => {
      setDemoState('success');
      triggerWin({ type: 'coupon', amount: 47 });
      setTimeout(() => setDemoState('idle'), 4000);
    }, 900);
  };

  return (
    <Card
      className="p-5 space-y-4 border"
      style={{
        background: 'linear-gradient(135deg, rgba(15,22,41,0.97) 0%, rgba(20,30,55,0.98) 100%)',
        borderColor: 'rgba(212,175,55,0.2)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
        >
          <Ticket size={16} style={{ color: '#D4AF37' }} />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Terminal Caissier</p>
          <p className="text-[10px] text-slate-400">Simulation validation coupon</p>
        </div>
        <Badge
          className="ml-auto text-[9px] px-2 py-0.5"
          style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}
        >
          DEMO LIVE
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        {demoState === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="text-center py-3 rounded-xl mb-3 font-mono text-lg text-slate-300 tracking-widest border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              FLASH-2024
            </div>
            <Button
              onClick={handleDemoValidate}
              className="w-full h-11 font-bold gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, #0D9488, #0B7A6F)', color: 'white' }}
            >
              <CheckCircle2 size={16} />
              Valider ce coupon
            </Button>
          </motion.div>
        )}

        {demoState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-6"
          >
            <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </motion.div>
        )}

        {demoState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-3 space-y-2"
          >
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: 'rgba(212,175,55,0.15)',
                border: '2px solid rgba(212,175,55,0.4)',
                boxShadow: '0 0 20px rgba(212,175,55,0.15)',
              }}
            >
              <CheckCircle2 size={24} style={{ color: '#D4AF37' }} />
            </div>
            <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>Privilège client honoré.</p>
            <p className="text-xs text-slate-300">Trésorerie augmentée de 47 €.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   VUE COMMERÇANT
══════════════════════════════════════════════════════════════ */
export function MerchantView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Le Café du Marché</h1>
          <p className="text-slate-500 text-sm">Tableau de bord commerçant</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 border-none dark:bg-emerald-900/30 dark:text-emerald-400">
          ✓ Bouclier no-show actif
        </Badge>
      </div>

      <StatGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Pertes évitées ce mois" value="520€" trend={18} trendLabel="anti no-show" icon={<ShieldCheck className="text-emerald-500" />} />
        <Stat label="Score G.E.O." value="87/100" icon={<TrendingUp className="text-emerald-500" />} />
        <Stat label="Avis à traiter" value="3" icon={<Star className="text-orange-500" />} />
      </StatGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-teal-500" /> Live Work Feed
          </h3>
          <FeedItem icon="🌧️" title="Pluie prévue demain à 14h" desc="Suggestion : Post 'Cosy à l'intérieur' + coupon café chaud -10%" />
          <FeedItem icon="⚽" title="Match PSG ce soir 20h45" desc="Menu Supporters suggéré par l'IA" />
          <FeedItem icon="🌸" title="Printemps : +23 % trafic local" desc="Post carte de saison auto-généré" />
        </Card>

        <div className="space-y-4">
          <Card className="p-6 flex flex-col justify-center space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Bouclier Stripe Anti No-Show</h3>
              <span className="text-2xl font-black text-emerald-500">520€</span>
            </div>
            <p className="text-slate-500 text-xs">520€ protégés ce mois (4 tentatives bloquées)</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Objectif mensuel</span>
                <span className="font-bold text-emerald-600">78%</span>
              </div>
              <Progress value={78} className="h-3 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="RDV protégés" value="12 / mois" />
              <MiniStat label="Taux récupération" value="85 %" />
            </div>
          </Card>

          <CouponDemoCard />
        </div>
      </div>
    </div>
  );
}
