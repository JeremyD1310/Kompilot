import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, toast } from '@blinkdotnew/ui';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Plus } from 'lucide-react';
import { useContentQuota } from '../../hooks/useContentQuota';
import { createContentPackCheckout } from '../../lib/billingClient';

export function ContentQuotaWidget() {
  const quota = useContentQuota();
  const [showPacks, setShowPacks] = useState(false);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const percent = quota.totalLimit > 0 ? Math.min(100, Math.round((quota.currentUsage / quota.totalLimit) * 100)) : 0;
  const warning = percent >= 80;

  const buyPack = async (packId: 'small' | 'medium' | 'large') => {
    if (loadingPack) return;
    setLoadingPack(packId);
    try {
      const result = await createContentPackCheckout(packId);
      if (!result.url) {
        toast.error('Paiement indisponible', { description: result.error || 'Réessayez dans un instant.' });
        return;
      }
      const paymentWindow = window.open(result.url, '_blank', 'noopener,noreferrer');
      if (!paymentWindow) {
        toast.error('Fenêtre de paiement bloquée', { description: 'Autorisez les pop-ups puis réessayez.' });
        return;
      }
      toast.success('Redirection vers Stripe…', { description: 'Votre solde sera crédité après confirmation du paiement.' });
    } catch (error) {
      toast.error('Paiement indisponible', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><FileText size={15} className="text-primary" /></span>Machine à Contenu</CardTitle>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">30 / mois inclus</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {quota.isLoading ? <div className="h-14 animate-pulse rounded-xl bg-muted" /> : <>
          <div className="flex items-end justify-between gap-3"><div><p className="text-2xl font-black tabular-nums text-foreground">{quota.currentUsage}<span className="text-sm font-semibold text-muted-foreground"> / {quota.totalLimit}</span></p><p className="text-[11px] text-muted-foreground">générations ou publications utilisées ce mois</p></div><div className="text-right"><p className="text-sm font-bold text-primary">{quota.remaining}</p><p className="text-[10px] text-muted-foreground">restantes</p></div></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${quota.blocked ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${percent}%` }} /></div>
          {quota.blocked ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span><strong>Plafond atteint.</strong> Les nouvelles générations sont bloquées jusqu’à l’ajout de crédits.</span></div> : warning ? <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>Vous avez consommé {percent}% de votre réserve de contenu.</span></div> : <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 size={14} className="text-primary" /> Votre réserve de contenu est disponible.</div>}
          <Button variant="outline" size="sm" onClick={() => setShowPacks(value => !value)} className="w-full gap-1.5"><Plus size={13} /> Ajouter des crédits</Button>
          {showPacks && <div className="grid gap-2 sm:grid-cols-3">{(quota.packs ?? [{ id: 'small', label: 'Small', credits: 15, priceHt: 4.99 }, { id: 'medium', label: 'Medium', credits: 30, priceHt: 7.99 }, { id: 'large', label: 'Large', credits: 80, priceHt: 14.99 }]).map(pack => <div key={pack.id} className="rounded-xl border border-border bg-muted/20 p-3"><p className="text-xs font-bold text-foreground">{pack.label}</p><p className="mt-1 text-lg font-black text-primary">{pack.credits}</p><p className="text-[10px] text-muted-foreground">générations · {pack.priceHt.toFixed(2).replace('.', ',')} € HT</p><Button size="sm" className="mt-2 w-full gap-1 text-[11px]" disabled={loadingPack !== null} onClick={() => buyPack(pack.id as 'small' | 'medium' | 'large')}>{loadingPack === pack.id ? <Loader2 size={12} className="animate-spin" /> : 'Acheter'}</Button></div>)}</div>}
        </>}
      </CardContent>
    </Card>
  );
}
