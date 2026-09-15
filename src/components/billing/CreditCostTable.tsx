/** Customer-facing AI action prices. Provider costs and margins stay server-side. */
import { Card, CardHeader, CardTitle, CardContent } from '@blinkdotnew/ui';
import { Zap, FileText, Brain, Share2, Video } from 'lucide-react';
import { AI_CREDIT_COSTS, CREDIT_ACTION_LABELS, type CreditActionId } from '../../../shared/pricingCatalog';

const ACTION_ICONS: Record<CreditActionId, typeof FileText> = {
  short_text: FileText, review_reply: FileText, message_reply: FileText, full_post: Share2,
  email_sequence: FileText, long_article: FileText, image_generation: Brain, local_seo_analysis: Brain,
  geo_visibility_scan: Brain, short_video: Video, full_ai_report: Brain,
};
const ACTION_COLORS = ['text-emerald-600', 'text-sky-600', 'text-violet-600', 'text-amber-600'];
const ACTION_BACKGROUNDS = ['bg-emerald-50 dark:bg-emerald-950/30', 'bg-sky-50 dark:bg-sky-950/30', 'bg-violet-50 dark:bg-violet-950/30', 'bg-amber-50 dark:bg-amber-950/30'];
const COST_ROWS = (Object.keys(AI_CREDIT_COSTS) as CreditActionId[]).map((action, index) => ({
  icon: ACTION_ICONS[action], action: CREDIT_ACTION_LABELS[action], cost: `${AI_CREDIT_COSTS[action]} crédit${AI_CREDIT_COSTS[action] > 1 ? 's' : ''}`,
  color: ACTION_COLORS[index % ACTION_COLORS.length], bgColor: ACTION_BACKGROUNDS[index % ACTION_BACKGROUNDS.length],
}));

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
                <th className="text-right font-semibold text-muted-foreground pb-2.5 pl-4">Unité</th>
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
                  <td className="py-3 pl-4 text-right text-muted-foreground">IA</td>
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
                <p className="text-xs text-muted-foreground">Crédits IA · estimation affichée avant validation</p>
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
