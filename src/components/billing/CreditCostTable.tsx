/**
 * CreditCostTable — Static table showing credit costs per action type.
 * Displays action name, cost, estimation, and margin.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@blinkdotnew/ui';
import { Zap, FileText, Brain, Share2, Video } from 'lucide-react';

const COST_ROWS = [
  {
    icon: FileText,
    action: 'Génération texte / post',
    cost: '1 crédit',
    estimation: '~0,01 €',
    margin: '>85%',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: Brain,
    action: 'Analyse IA / Audit',
    cost: '3 crédits',
    estimation: '~0,05 €',
    margin: '~80%',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: Share2,
    action: 'Automatisation multi-canal',
    cost: '5 crédits',
    estimation: '~0,10 €',
    margin: '>90%',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    icon: Video,
    action: 'Génération vidéo (Tavus)',
    cost: '10 crédits',
    estimation: '~0,46 €',
    margin: '~42%',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
];

export function CreditCostTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          Coût par action
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-muted-foreground pb-2.5 pr-4">Action</th>
                <th className="text-center font-semibold text-muted-foreground pb-2.5 px-4">Coût</th>
                <th className="text-center font-semibold text-muted-foreground pb-2.5 px-4">Estimation</th>
                <th className="text-right font-semibold text-muted-foreground pb-2.5 pl-4">Marge</th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((row) => (
                <tr key={row.action} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${row.bgColor}`}>
                        <row.icon size={14} className={row.color} />
                      </div>
                      <span className="font-medium text-foreground">{row.action}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-primary">
                      <Zap size={12} />
                      {row.cost}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{row.estimation}</td>
                  <td className="py-3 pl-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      {row.margin}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {COST_ROWS.map((row) => (
            <div key={row.action} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${row.bgColor}`}>
                <row.icon size={16} className={row.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{row.action}</p>
                <p className="text-xs text-muted-foreground">{row.estimation} · Marge {row.margin}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary shrink-0">
                <Zap size={12} />
                {row.cost}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
