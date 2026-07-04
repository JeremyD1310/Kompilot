import { useUserProfile } from '../../context/UserProfileContext';
import { useCredits } from '../../context/CreditsContext';
import { Card, Badge, Button, Progress } from '@blinkdotnew/ui';
import { BarChart2, AlertTriangle, Zap, XCircle, ArrowUpRight } from 'lucide-react';
import { CreditsTopUpModal } from '../../components/subscription/CreditsTopUpModal';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function CreditsQuotaWidget() {
  const { masterProfile } = useUserProfile();
  const { usage: creditsUsed, limit: maxCredits, isEmpty } = useCredits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // CRITICAL: hide completely for non-agencies
  if (masterProfile !== 'agence') return null;
  
  const usagePercent = maxCredits > 0 ? Math.round((creditsUsed / maxCredits) * 100) : 0;
  const remaining = Math.max(0, maxCredits - creditsUsed);
  const isWarning = usagePercent >= 80 && usagePercent < 90;
  const isCritical = usagePercent >= 90;
  // P1-1: Upsell threshold at 80%+ (when user is actively consuming)
  const showUpsell = usagePercent >= 20;
  
  const getProgressColor = () => {
    if (usagePercent >= 90) return 'bg-red-500';
    if (usagePercent >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (creditsUsed >= maxCredits && maxCredits > 0) {
    return (
      <Card className="p-4 rounded-xl border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
        <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-semibold">
          <XCircle className="h-5 w-5" />
          <span>Crédits épuisés</span>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4 leading-relaxed">
          🚫 Les requêtes lourdes (génération visuels, scans G.E.O.) sont en pause. Les fonctions critiques restent actives.
        </p>
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Zap className="h-4 w-4" />
          Réactiver mes services
        </Button>
        <CreditsTopUpModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </Card>
    );
  }

  return (
    <Card className="p-4 rounded-xl shadow-sm border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
          <BarChart2 className="h-5 w-5 text-teal-600" />
          <span>Consommation API du réseau</span>
        </div>
        {isCritical && <Badge variant="destructive">Critique</Badge>}
        {isWarning && <Badge variant="outline" className="border-amber-500 text-amber-600">Alerte</Badge>}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
          <span>Usage global</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, usagePercent)}%` }}
          />
        </div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {creditsUsed} / {maxCredits} <span className="text-slate-400 font-normal">Crédits</span>
        </div>
      </div>

      {isCritical && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mb-4">
          <div className="flex gap-2 text-amber-800 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium leading-snug">
                ⚠️ Votre réserve de jetons IA est presque épuisée...
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 h-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                ⚡ Recharger mes crédits
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* P1-1: Contextual upsell — appears when user is actively consuming credits */}
      {showUpsell && !isCritical && !isWarning && (
        <button
          onClick={() => navigate({ to: '/pricing' as any })}
          className="w-full mt-3 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
          style={{
            background: 'rgba(99,102,241,.06)',
            border: '1px solid rgba(99,102,241,.15)',
            color: '#818CF8',
          }}
        >
          <span>Il vous reste {remaining} crédits — passez à Agency pour des générations illimitées</span>
          <ArrowUpRight size={13} className="shrink-0 opacity-70" />
        </button>
      )}

      <CreditsTopUpModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Card>
  );
}
