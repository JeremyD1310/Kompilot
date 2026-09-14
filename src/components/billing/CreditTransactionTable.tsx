/**
 * CreditTransactionTable — Displays credit transaction history.
 * Columns: Date, Type (badge), Description, Crédits (delta), Solde restant.
 */

import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState, Skeleton } from '@blinkdotnew/ui';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingCart, Repeat } from 'lucide-react';

export interface Transaction {
  id: string;
  type: 'consumption' | 'refund' | 'purchase' | 'renewal';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  actionType?: string;
}

interface CreditTransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; className: string; icon: typeof ArrowDownRight }> = {
  consumption: {
    label: 'Consommation',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40',
    icon: ArrowDownRight,
  },
  refund: {
    label: 'Remboursement',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40',
    icon: RefreshCw,
  },
  purchase: {
    label: 'Achat',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40',
    icon: ShoppingCart,
  },
  renewal: {
    label: 'Renouvellement',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800/40',
    icon: Repeat,
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function AmountCell({ type, amount }: { type: string; amount: number }) {
  const isNegative = type === 'consumption';
  const prefix = isNegative ? '-' : '+';
  const colorClass = isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';

  return (
    <span className={`inline-flex items-center gap-1 font-bold text-sm ${colorClass}`}>
      {isNegative ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
      {prefix}{Math.abs(amount)}
    </span>
  );
}

export function CreditTransactionTable({ transactions, isLoading }: CreditTransactionTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History size={16} className="text-primary" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History size={16} className="text-primary" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<History />}
            title="Aucune transaction"
            description="Vos transactions de crédits apparaîtront ici."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History size={16} className="text-primary" />
          Historique des transactions
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-muted-foreground pb-2.5 pr-4">Date</th>
                <th className="text-left font-semibold text-muted-foreground pb-2.5 px-4">Type</th>
                <th className="text-left font-semibold text-muted-foreground pb-2.5 px-4">Description</th>
                <th className="text-right font-semibold text-muted-foreground pb-2.5 px-4">Crédits</th>
                <th className="text-right font-semibold text-muted-foreground pb-2.5 pl-4">Solde restant</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.consumption;
                const TypeIcon = config.icon;
                return (
                  <tr key={tx.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={config.className}>
                        <TypeIcon size={11} className="mr-1" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground max-w-xs truncate">
                      {tx.description || tx.actionType || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <AmountCell type={tx.type} amount={tx.amount} />
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-sm text-muted-foreground font-medium">
                      {tx.balance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {transactions.map((tx) => {
            const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.consumption;
            const TypeIcon = config.icon;
            return (
              <div key={tx.id} className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" className={config.className}>
                    <TypeIcon size={11} className="mr-1" />
                    {config.label}
                  </Badge>
                  <AmountCell type={tx.type} amount={tx.amount} />
                </div>
                <p className="text-sm text-foreground truncate">{tx.description || tx.actionType || '—'}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</span>
                  <span className="text-xs text-muted-foreground font-mono">Solde: {tx.balance}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
