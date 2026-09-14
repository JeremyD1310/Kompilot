import { useState } from 'react';
import { AlertCircle, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { BACKEND_URL } from '../../lib/backend';

export function DataRightsCard() {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const response = await fetch(`${BACKEND_URL}/api/user/data/export`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Export indisponible');
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kompilot-data-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé', { description: 'Vos données disponibles ont été exportées au format JSON.' });
    } catch (error) {
      toast.error('Export impossible', { description: error instanceof Error ? error.message : 'Réessayez plus tard.' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    setDeleteLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const response = await fetch(`${BACKEND_URL}/api/user/data`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('La demande de suppression a échoué');
      setDeleteRequested(true);
      setDeleteConfirm(false);
      toast.success('Suppression enregistrée', { description: 'Vos données ont été supprimées ou anonymisées conformément au RGPD.' });
    } catch (error) {
      toast.error('Demande impossible', { description: error instanceof Error ? error.message : 'Réessayez plus tard.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"><ShieldCheck size={14} className="text-primary" /></div>Mes droits RGPD — données personnelles</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">Accédez à vos données, exportez-les ou demandez leur suppression. Les documents légaux sont disponibles depuis le footer public.</p>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3"><div><p className="text-sm font-semibold text-foreground">Exporter mes données</p><p className="mt-0.5 text-xs text-muted-foreground">Compte, activité, leads et événements d’attribution — JSON</p></div><Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading} className="shrink-0 gap-1.5">{exportLoading ? 'Export…' : <><Download size={13} /> Exporter</>}</Button></div>
        {deleteRequested ? <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><AlertCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-800">Demande traitée</p><p className="mt-0.5 text-xs text-emerald-700">Vos données personnelles ont été supprimées ou anonymisées.</p></div></div> : <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"><div><p className="text-sm font-semibold text-red-800">Supprimer mes données</p><p className="mt-0.5 text-xs text-red-700">Cette action est irréversible pour les données personnelles opérationnelles.</p></div>{!deleteConfirm ? <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(true)} className="gap-1.5 border-red-300 text-red-700"><Trash2 size={13} /> Demander la suppression</Button> : <div className="flex flex-wrap gap-2"><Button size="sm" onClick={handleDeleteRequest} disabled={deleteLoading} className="bg-red-600 text-white hover:bg-red-700">{deleteLoading ? 'Traitement…' : 'Confirmer la suppression'}</Button><Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Annuler</Button></div>}</div>}
        <p className="text-[10px] text-muted-foreground">Articles 15, 17 et 20 du RGPD · Contact : privacy@kompilot.app</p>
      </CardContent>
    </Card>
  );
}
