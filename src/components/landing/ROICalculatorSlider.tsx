import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

export function ROICalculatorSlider() {
  const [basket, setBasket] = useState(85);
  const [noShows, setNoShows] = useState(12);
  const [savings, setSavings] = useState(basket * noShows);
  const [displaySavings, setDisplaySavings] = useState(basket * noShows);

  useEffect(() => {
    const target = basket * noShows;
    setSavings(target);
    
    // Simple count up animation
    const duration = 400;
    const steps = 20;
    const increment = (target - displaySavings) / steps;
    let current = displaySavings;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplaySavings(target);
        clearInterval(timer);
      } else {
        setDisplaySavings(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [basket, noShows]);

  const yearlySavings = savings * 12;
  const netCopilotPrice = 49; // Estimated monthly price
  const monthsOffered = Math.round(yearlySavings / netCopilotPrice);

  return (
    <div className="max-w-2xl mx-auto px-6 mb-12">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Calculateur d'impact ROI</h3>
            <p className="text-slate-500 text-sm">Estimez vos gains avec le bouclier anti-no-show</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basket Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">Panier moyen</label>
              <span className="text-2xl font-black text-teal-400">{basket}€</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="500" 
              value={basket} 
              onChange={(e) => setBasket(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* No-shows Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">No-shows évités par mois</label>
              <span className="text-2xl font-black text-teal-400">{noShows}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={noShows} 
              onChange={(e) => setNoShows(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* Result Display */}
          <div className="mt-10 p-6 bg-teal-500/5 rounded-2xl border border-teal-500/10 text-center">
            <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-bold">💰 Économie mensuelle estimée</div>
            <div className="text-5xl md:text-6xl font-black text-white mb-4">
              {displaySavings}€
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 text-teal-400 font-bold bg-teal-400/10 px-3 py-1 rounded-full text-sm">
                <TrendingUp size={14} />
                +{yearlySavings.toLocaleString()}€ / an
              </span>
              <span className="text-sm">
                soit <span className="text-white font-bold">{monthsOffered} mois</span> de Kompilot offerts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
