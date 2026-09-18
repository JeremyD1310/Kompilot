import { BarChart3 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

export function B2BExecutiveDashboard({ establishmentName }: { establishmentName: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="executive-dashboard-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><BarChart3 size={14} /> Pilotage B2B</div>
          <h2 id="executive-dashboard-title" className="mt-2 text-xl font-black tracking-tight text-foreground">Mesures d’acquisition</h2>
          <p className="mt-1 text-sm text-muted-foreground">{establishmentName} · aucune série n’est affichée tant qu’une source mesurée n’est pas synchronisée.</p>
        </div>
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('kompilot:open-attribution'))}>Configurer les sources</Button>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Connectez Google Business, Analytics ou vos campagnes pour afficher ici des visites, prospects, conversions et valeurs attribuées vérifiables.
      </div>
    </section>
  );
}
