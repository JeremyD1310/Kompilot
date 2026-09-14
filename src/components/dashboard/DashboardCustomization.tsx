import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@blinkdotnew/ui';
import { Check, LayoutGrid, RotateCcw, SlidersHorizontal } from 'lucide-react';

export type DashboardWidgetKey = 'kpiGrid' | 'websiteTraffic' | 'aiInsights' | 'growthAttribution' | 'contentQuota' | 'quickPost' | 'recentInbox' | 'inboxOverview' | 'campaignHealth' | 'quickActions' | 'upcomingPosts' | 'metaConnect' | 'socialConnections' | 'inviteTeam' | 'performance';

export const DASHBOARD_WIDGETS: Array<{ key: DashboardWidgetKey; label: string; description: string }> = [
  { key: 'kpiGrid', label: 'Indicateurs clés', description: 'Un aperçu des publications, messages et avis.' },
  { key: 'websiteTraffic', label: 'Trafic du site', description: 'Les visites et tendances de votre site.' },
  { key: 'aiInsights', label: 'Insights IA', description: 'Les recommandations générées par Kompilot.' },
  { key: 'growthAttribution', label: 'Attribution de croissance', description: 'Les canaux qui contribuent à vos résultats.' },
  { key: 'contentQuota', label: 'Quota de contenu', description: 'Votre consommation et vos limites du mois.' },
  { key: 'quickPost', label: 'Créer rapidement', description: 'Le raccourci pour préparer une publication.' },
  { key: 'recentInbox', label: 'Interactions récentes', description: 'Les conversations récentes.' },
  { key: 'inboxOverview', label: 'Boîte de réception', description: 'La vue détaillée de vos messages.' },
  { key: 'campaignHealth', label: 'Santé des campagnes', description: 'Les alertes et tendances de campagne.' },
  { key: 'quickActions', label: 'Actions rapides', description: 'Les raccourcis vers vos tâches fréquentes.' },
  { key: 'upcomingPosts', label: 'Prochains posts', description: 'Vos publications planifiées.' },
  { key: 'metaConnect', label: 'Connexion Meta', description: 'Le raccourci pour connecter Facebook et Instagram.' },
  { key: 'socialConnections', label: 'Comptes sociaux', description: 'L’état de vos comptes connectés.' },
  { key: 'inviteTeam', label: 'Inviter votre équipe', description: 'Collaborez avec vos membres.' },
  { key: 'performance', label: 'Performances', description: 'Statistiques et engagement.' },
];

const STORAGE_KEY = 'kompilot_dashboard_widgets';
const DEFAULT_WIDGETS: Record<DashboardWidgetKey, boolean> = Object.fromEntries(DASHBOARD_WIDGETS.map(({ key }) => [key, true])) as Record<DashboardWidgetKey, boolean>;

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<Record<DashboardWidgetKey, boolean>>(DEFAULT_WIDGETS);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setWidgets({ ...DEFAULT_WIDGETS, ...saved });
    } catch { /* Demo mode and private browsing can reject storage. */ }
  }, []);
  const update = (next: Record<DashboardWidgetKey, boolean>) => {
    setWidgets(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Preferences remain in memory. */ }
  };
  return { widgets, update };
}

export function DashboardCustomization({ widgets, onChange }: { widgets: Record<DashboardWidgetKey, boolean>; onChange: (widgets: Record<DashboardWidgetKey, boolean>) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(widgets);
  const openDialog = () => { setDraft(widgets); setOpen(true); };
  const save = () => { onChange(draft); setOpen(false); };
  return (
    <>
      <Button variant="outline" size="sm" className="h-9 gap-2" onClick={openDialog} aria-label="Personnaliser les widgets du tableau de bord">
        <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Personnaliser</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><LayoutGrid size={18} className="text-primary" /> Personnaliser votre tableau de bord</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Choisissez les informations utiles à votre quotidien. Vos préférences sont enregistrées sur cet appareil.</p>
          <div className="grid gap-2 py-2 sm:grid-cols-2">
            {DASHBOARD_WIDGETS.map(widget => {
              const selected = draft[widget.key];
              return <button type="button" key={widget.key} aria-pressed={selected} onClick={() => setDraft({ ...draft, [widget.key]: !selected })} className={`flex min-h-[76px] items-start gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/60'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{selected && <Check size={13} />}</span><span><span className="block text-sm font-semibold text-foreground">{widget.label}</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{widget.description}</span></span></button>;
            })}
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between"><Button variant="ghost" size="sm" onClick={() => setDraft(DEFAULT_WIDGETS)} className="gap-2"><RotateCcw size={13} /> Réinitialiser</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardWidget({ visible, children }: { visible: boolean; children: React.ReactNode }) { return visible ? <>{children}</> : null; }
