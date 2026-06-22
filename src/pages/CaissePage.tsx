import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Slider } from '@blinkdotnew/ui';
import { Ticket, Coins, Settings, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumWin } from '../components/shared/PremiumWinEngine';

export default function CaissePage() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfig, setShowConfig] = useState(false);
  const [basketAmount, setBasketAmount] = useState(47);
  const [conversionRate, setConversionRate] = useState(65);
  const { triggerWin } = usePremiumWin();

  useEffect(() => {
    const saved = localStorage.getItem('caisse_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setBasketAmount(config.basketAmount);
        setConversionRate(config.conversionRate);
      } catch (e) {
        console.error('Failed to parse caisse_config');
      }
    }
  }, []);

  const saveConfig = (newBasket: number, newRate: number) => {
    localStorage.setItem('caisse_config', JSON.stringify({
      basketAmount: newBasket,
      conversionRate: newRate
    }));
  };

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    const normalized = inputValue.toUpperCase();
    if (normalized.includes('KOMPILOT') || normalized.includes('FLASH')) {
      setResult('success');
      // Golden Win — premium celebration
      triggerWin({ type: 'coupon', amount: basketAmount });
    } else {
      setResult('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1629] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-2">
            <Ticket size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Validateur de Coupon</h1>
          <p className="text-slate-400">Scanner ou entrez le code client</p>
        </div>

        <form onSubmit={handleValidate} className="space-y-4">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (result !== 'idle') setResult('idle');
              }}
              placeholder="Ex: FLASH-2024 ou KOMPILOT"
              className="h-16 text-2xl text-center bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-emerald-500 focus:border-emerald-500 rounded-2xl"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-900/20 gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={24} />
            Valider le coupon
          </Button>
        </form>

        <AnimatePresence mode="wait">
          {result === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card
                className="border p-6 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 100%)',
                  borderColor: 'rgba(212,175,55,0.3)',
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  {/* Gold ring icon */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.08) 100%)',
                      border: '2px solid rgba(212,175,55,0.4)',
                      boxShadow: '0 0 20px rgba(212,175,55,0.15)',
                    }}
                  >
                    <CheckCircle2 size={28} style={{ color: '#D4AF37' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#D4AF37' }}>
                      Privilège client honoré.
                    </h3>
                    <p className="text-slate-300 mt-1">Trésorerie augmentée de {basketAmount} €.</p>
                  </div>
                  <Badge
                    className="gap-1.5 py-1 px-3"
                    style={{
                      background: 'rgba(212,175,55,0.12)',
                      borderColor: 'rgba(212,175,55,0.25)',
                      color: '#D4AF37',
                    }}
                  >
                    <Coins size={14} /> CA Copilote mis à jour
                  </Badge>
                </div>
              </Card>
            </motion.div>
          )}

          {result === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-red-500/10 border-red-500/20 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <XCircle size={40} className="text-red-500" />
                  <h3 className="text-lg font-bold text-red-400">Code invalide</h3>
                  <p className="text-slate-400 text-sm">Ce coupon n'existe pas ou a déjà été utilisé.</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 border-t border-slate-800">
          {!showConfig ? (
            <button
              onClick={() => setShowConfig(true)}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm py-2"
            >
              <Settings size={14} />
              ⚙️ Configurer le panier moyen
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-800/30 rounded-2xl p-5 space-y-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Configuration Caisse</span>
                <button onClick={() => setShowConfig(false)} className="text-xs text-slate-500 hover:text-white">Fermer</button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Panier Moyen (€)</label>
                  <span className="text-lg font-mono text-emerald-400">{basketAmount}€</span>
                </div>
                <Input
                  type="number"
                  value={basketAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBasketAmount(val);
                    saveConfig(val, conversionRate);
                  }}
                  className="bg-slate-900 border-slate-700 h-10"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Conversion Estimée</label>
                  <span className="text-lg font-mono text-blue-400">{conversionRate}%</span>
                </div>
                <Slider
                  value={[conversionRate]}
                  onValueChange={(vals) => {
                    setConversionRate(vals[0]);
                    saveConfig(basketAmount, vals[0]);
                  }}
                  max={100}
                  min={1}
                  step={1}
                />
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <TrendingUp size={10} />
                  <span>Basé sur vos performances mensuelles actuelles</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <p className="mt-auto text-[10px] text-slate-600 uppercase tracking-[0.2em]">Kompilot Terminal v1.4.3</p>
    </div>
  );
}
