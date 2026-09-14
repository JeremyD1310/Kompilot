import { useCallback, useState } from 'react';
import { Card, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { BarChart3, CheckCircle2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { useWebsiteTraffic } from '../../hooks/useWebsiteTraffic';

export function GA4ConnectionPanel() {
  const [checking, setChecking] = useState(false);
  const { data, error, refetch } = useWebsiteTraffic();
  const configured = Boolean(data && !error);
  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await refetch();
      if (result.error) toast.error('GA4 est indisponible', { description: result.error.message });
      else toast.success('Connexion GA4 vérifiée');
    } finally { setChecking(false); }
  }, [refetch]);
  return <Card className="border-border/60 shadow-sm">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-foreground">Google Analytics 4</h2><Badge variant={configured ? 'default' : 'secondary'}>{configured ? 'Configuré' : 'À configurer'}</Badge></div>
          <p className="text-sm text-muted-foreground mt-1">Vérifiez l’accès aux données GA4 sans exposer de credentials dans le navigateur.</p></div>
      </div>
      <div className={configured ? 'rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-800' : 'rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-800'}>
        {configured ? <span className="flex gap-2 items-center"><CheckCircle2 className="h-4 w-4 shrink-0" /> Les données GA4 répondent correctement via le backend.</span> : <span className="flex gap-2 items-start"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error?.message ?? 'Aucune propriété GA4 accessible. Configurez la propriété côté backend puis réessayez.'}</span>}
      </div>
      <div className="flex flex-wrap gap-2"><Button onClick={check} disabled={checking} className="gap-2"><RefreshCw className={checking ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />{checking ? 'Vérification…' : 'Vérifier la connexion'}</Button><a className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href="https://analytics.google.com/" target="_blank" rel="noreferrer">Ouvrir GA4 <ExternalLink className="h-3.5 w-3.5" /></a></div>
    </CardContent>
  </Card>;
}
