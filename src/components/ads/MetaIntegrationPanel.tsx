/**
 * MetaIntegrationPanel — Panneau d'intégration API Marketing Meta
 * Permet de tester la connexion, lister les comptes pub et consulter les métriques.
 */

import { useState } from 'react';
import { blink } from '@/blink/client';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Skeleton,
} from '@blinkdotnew/ui';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Zap, BarChart2, Megaphone, ChevronRight,
} from 'lucide-react';

interface MetaConnectionStatus {
  connected: boolean;
  userId?: string;
  name?: string;
  scopes?: string[];
  adAccountIds?: string[];
  error?: string;
  errorCode?: number;
  checkedAt: string;
}

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  amount_spent: string;
  balance: string;
}

interface MetaInsight {
  campaign_name?: string;
  impressions: string;
  clicks: string;
  spend: string;
  cpc: string;
  ctr: string;
  date_start: string;
  date_stop: string;
}

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

async function backendGet<T>(path: string): Promise<T> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const json = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json;
}

function formatSpend(amount: string, currency = 'EUR'): string {
  const num = parseFloat(amount) / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(num);
}

function accountStatusBadge(status: number): { label: string; variant: 'default' | 'destructive' | 'secondary' } {
  if (status === 1) return { label: 'Actif', variant: 'default' };
  if (status === 2) return { label: 'Désactivé', variant: 'destructive' };
  return { label: `Statut ${status}`, variant: 'secondary' };
}

export function MetaIntegrationPanel() {
  const [status, setStatus] = useState<MetaConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [insights, setInsights] = useState<MetaInsight[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckConnection() {
    setLoading(true);
    setError(null);
    setAccounts([]);
    setInsights([]);
    setSelectedAccount(null);
    try {
      const result = await backendGet<MetaConnectionStatus>('/api/meta/check');
      setStatus(result);
      if (result.connected) {
        setLoadingAccounts(true);
        try {
          const res = await backendGet<{ data: MetaAdAccount[] }>('/api/meta/ad-accounts');
          setAccounts(res.data ?? []);
        } catch (e) { console.warn('Erreur comptes:', e); }
        finally { setLoadingAccounts(false); }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus({ connected: false, error: msg, checkedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }

  async function loadInsights(accountId: string) {
    setSelectedAccount(accountId);
    setLoadingInsights(true);
    setInsights([]);
    try {
      const res = await backendGet<{ data: MetaInsight[] }>(
        `/api/meta/insights?objectId=${accountId}&datePreset=last_30d`,
      );
      setInsights(res.data ?? []);
    } catch (e) { console.warn('Erreur insights:', e); }
    finally { setLoadingInsights(false); }
  }

  return (
    <div className="space-y-4">
      {/* En-tête + bouton test */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">API Marketing Meta</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Connexion via System User Token — v20.0</p>
              </div>
            </div>
            <Button onClick={handleCheckConnection} disabled={loading} size="sm" className="gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Vérification…' : 'Tester la connexion'}
            </Button>
          </div>
        </CardHeader>

        {/* Résultat */}
        {status && (
          <CardContent className="pt-0">
            <div className={`rounded-lg p-3 flex items-start gap-3 text-sm ${
              status.connected
                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              {status.connected
                ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              }
              <div className="min-w-0 flex-1">
                {status.connected ? (
                  <>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Connexion établie</p>
                    <div className="mt-1.5 space-y-1 text-emerald-800 dark:text-emerald-300 text-sm">
                      <p><span className="font-medium">Compte :</span> {status.name} ({status.userId})</p>
                      {(status.adAccountIds?.length ?? 0) > 0 && (
                        <p><span className="font-medium">Comptes pub :</span> {status.adAccountIds!.length} accessible(s)</p>
                      )}
                      {(status.scopes?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {status.scopes!.slice(0, 6).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                          ))}
                          {status.scopes!.length > 6 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">+{status.scopes!.length - 6}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      Connexion échouée
                      {status.errorCode && <span className="ml-1 font-normal opacity-70">(code {status.errorCode})</span>}
                    </p>
                    <p className="mt-0.5 text-red-600 dark:text-red-300">{status.error || error}</p>
                    {status.errorCode === 190 && (
                      <div className="mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs">
                          Token expiré. Régénérez un System User Token dans{' '}
                          <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">
                            Meta Business Suite
                          </a>
                          , puis mettez à jour le secret <code className="font-mono">META_SYSTEM_USER_TOKEN</code>.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <p className="mt-1.5 text-xs opacity-50">
                  Vérifié le {new Date(status.checkedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Comptes publicitaires */}
      {(loadingAccounts || accounts.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Comptes publicitaires accessibles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingAccounts ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-border rounded-lg border overflow-hidden">
                {accounts.map((acc) => {
                  const { label, variant } = accountStatusBadge(acc.account_status);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => loadInsights(acc.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors ${selectedAccount === acc.id ? 'bg-primary/5' : ''}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{acc.name}</span>
                          <Badge variant={variant} className="text-xs shrink-0">{label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {acc.id} · {acc.currency} · Dépensé : {formatSpend(acc.amount_spent, acc.currency)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {(loadingInsights || insights.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Performances — 30 derniers jours
              {selectedAccount && <span className="ml-2 font-normal text-muted-foreground text-xs">{selectedAccount}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingInsights ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : insights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée de performance disponible pour cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left pb-2 pr-4">Campagne</th>
                      <th className="text-right pb-2 pr-4">Impressions</th>
                      <th className="text-right pb-2 pr-4">Clics</th>
                      <th className="text-right pb-2 pr-4">CTR</th>
                      <th className="text-right pb-2 pr-4">CPC</th>
                      <th className="text-right pb-2">Dépense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {insights.map((ins, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium truncate max-w-[200px]">{ins.campaign_name ?? '—'}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{parseInt(ins.impressions).toLocaleString('fr-FR')}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{parseInt(ins.clicks).toLocaleString('fr-FR')}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{parseFloat(ins.ctr).toFixed(2)}%</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{parseFloat(ins.cpc).toFixed(2)} €</td>
                        <td className="py-2 text-right tabular-nums font-medium">{parseFloat(ins.spend).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guide de configuration */}
      {!status && (
        <Card className="border-dashed">
          <CardContent className="py-5">
            <p className="text-sm font-medium mb-3">Configuration requise</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                Créez un <strong>System User</strong> dans{' '}
                <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Meta Business Suite
                </a>
              </li>
              <li>
                Générez un token longue durée avec les scopes :{' '}
                <code className="text-xs bg-muted px-1 rounded">ads_management</code>,{' '}
                <code className="text-xs bg-muted px-1 rounded">ads_read</code>,{' '}
                <code className="text-xs bg-muted px-1 rounded">business_management</code>
              </li>
              <li>
                Ajoutez le secret <code className="text-xs bg-muted px-1 rounded">META_SYSTEM_USER_TOKEN</code> dans les variables Cloudflare Workers
              </li>
              <li>Cliquez sur <strong>Tester la connexion</strong> ci-dessus</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
