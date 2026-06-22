import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@blinkdotnew/ui';

interface SubAccount {
  id?: string;
  establishmentId?: string;
  clientName: string;
  sector: string;
  creditsUsed: number;
  creditsTotal?: number;   // UI alias
  creditsLimit?: number;   // backend field name
  status: 'active' | 'inactive' | 'trial' | 'quota_reached';
  lastActivity?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  active:        { label: 'Actif',          classes: 'bg-green-500/10 text-green-600 border-green-500/20' },
  inactive:      { label: 'Inactif',        classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  trial:         { label: 'Essai',          classes: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  quota_reached: { label: 'Quota atteint',  classes: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

function CreditsBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-[#0D9488]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{used.toLocaleString('fr-FR')}</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-border last:border-0">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </>
  );
}

interface Props {
  accounts: SubAccount[];
  isLoading: boolean;
}

export function SubAccountsTable({ accounts, isLoading }: Props) {
  const totalCredits = accounts.reduce((s, a) => s + a.creditsUsed, 0);

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 flex items-center justify-center shrink-0">
              <Users size={14} className="text-[#0D9488]" />
            </div>
            Sous-comptes clients
          </CardTitle>
          {!isLoading && accounts.length > 0 && (
            <span className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-full px-3 py-1">
              {accounts.length} sous-compte{accounts.length > 1 ? 's' : ''} · {totalCredits.toLocaleString('fr-FR')} crédits IA consommés ce mois
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-4 gap-4 px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div>Client</div>
          <div>Secteur</div>
          <div>Crédits IA utilisés</div>
          <div>Statut</div>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
            <Users size={28} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun sous-compte client actif pour le moment.</p>
            <p className="text-xs text-muted-foreground/60">Les sous-comptes apparaîtront ici dès leur activation.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((acc, idx) => {
              const key = acc.id ?? acc.establishmentId ?? String(idx);
              const st = STATUS_LABELS[acc.status] ?? STATUS_LABELS.active;
              return (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <p className="text-sm font-semibold text-foreground truncate">{acc.clientName}</p>
                  <p className="text-xs text-muted-foreground">{acc.sector}</p>
                  <CreditsBar used={acc.creditsUsed} total={acc.creditsTotal ?? acc.creditsLimit ?? 50} />
                  <Badge className={`w-fit text-[10px] border ${st.classes}`}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {!isLoading && accounts.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
            <p className="text-[11px] text-muted-foreground/70 text-center">
              Votre licence agence · Plan agence consolidé · Aucune mention Kompilot transmise aux clients
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
