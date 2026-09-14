/**
 * MetaQuickConnectWidget — Connexion directe Meta depuis le dashboard.
 * Affiche Facebook + Instagram avec boutons OAuth réels.
 */

import { Loader2, Check, ExternalLink, Unlink, Link2Off } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import {
  useFacebookOAuthConnect, useFacebookStatus, useFacebookDisconnect,
  useInstagramOAuthConnect, useInstagramStatus, useInstagramDisconnect,
} from '../../hooks/useSocialPublish';
import { cn } from '../../lib/utils';

// ── Icons ───────────────────────────────────────────────────────────────────

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="url(#igMeta)">
      <defs>
        <linearGradient id="igMeta" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  );
}

// ── Platform Row ─────────────────────────────────────────────────────────────

interface PlatformRowProps {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  loading: boolean;
  accountLabel?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

function PlatformRow({ icon, name, connected, loading, accountLabel, onConnect, onDisconnect }: PlatformRowProps) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg px-3 py-2.5 border transition-all',
      connected ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-muted/30'
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md flex items-center justify-center bg-background border border-border shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground leading-none">{name}</p>
          {connected && accountLabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{accountLabel}</p>
          )}
        </div>
        {connected && (
          <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-100 rounded-full px-1.5 py-0.5 shrink-0">
            <Check size={9} /> Connecté
          </span>
        )}
      </div>
      <div className="shrink-0 ml-2">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : connected ? (
          <button
            onClick={onDisconnect}
            className="text-[10px] text-red-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
            title="Déconnecter"
          >
            <Unlink size={11} />
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 bg-primary/10 hover:bg-primary/15 rounded-md px-2 py-1 transition-all"
          >
            Connecter <ExternalLink size={9} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function MetaQuickConnectWidget() {
  const { data: fbStatus, isLoading: fbLoading } = useFacebookStatus();
  const fbConnect = useFacebookOAuthConnect();
  const fbDisconnect = useFacebookDisconnect();

  const { data: igStatus, isLoading: igLoading } = useInstagramStatus();
  const igConnect = useInstagramOAuthConnect();
  const igDisconnect = useInstagramDisconnect();

  const connectedCount = [fbStatus?.connected, igStatus?.connected].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
            <FacebookIcon size={13} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Comptes Meta</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {connectedCount === 0
                ? 'Aucun compte connecté'
                : `${connectedCount}/2 connecté${connectedCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Link to="/settings">
          <span className="text-[10px] font-medium text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
            Tout gérer <ExternalLink size={9} />
          </span>
        </Link>
      </div>

      {/* Platforms */}
      <div className="p-3 space-y-2">
        <PlatformRow
          icon={<FacebookIcon size={14} />}
          name="Facebook"
          connected={!!fbStatus?.connected}
          loading={fbLoading || fbConnect.isPending || fbDisconnect.isPending}
          accountLabel={fbStatus?.pages?.length ? `${fbStatus.pages.length} page(s) · ${fbStatus.pages[0]?.name}` : undefined}
          onConnect={() => fbConnect.mutate()}
          onDisconnect={() => fbDisconnect.mutate()}
        />
        <PlatformRow
          icon={<InstagramIcon size={14} />}
          name="Instagram"
          connected={!!igStatus?.connected}
          loading={igLoading || igConnect.isPending || igDisconnect.isPending}
          accountLabel={igStatus?.primaryAccount ? `@${igStatus.primaryAccount.igUsername}` : igStatus?.accounts?.length ? `${igStatus.accounts.length} compte(s)` : undefined}
          onConnect={() => igConnect.mutate()}
          onDisconnect={() => igDisconnect.mutate()}
        />
      </div>

      {/* CTA if nothing connected */}
      {connectedCount === 0 && !fbLoading && !igLoading && (
        <div className="px-3 pb-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Connectez vos comptes Meta pour publier directement depuis Kompilot
          </p>
        </div>
      )}

      {/* Footer note */}
      {connectedCount > 0 && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2Off size={10} className="text-emerald-500" />
            Tokens chiffrés AES-256-GCM
          </div>
        </div>
      )}
    </div>
  );
}
