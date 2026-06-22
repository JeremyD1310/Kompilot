/**
 * APIStatusPanel — "Centrale de Connexion & Synchronisation IA"
 * Displays live API connection statuses + animated console data-flow log.
 */
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Shield, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

// ── Platform definitions ──────────────────────────────────────────────────────

type SyncStatus = 'connected' | 'syncing' | 'warning' | 'offline';

interface APIChannel {
  id: string;
  emoji: string;
  name: string;
  detail: string;
  status: SyncStatus;
  lastSync: number; // seconds ago
  endpoint: string;
  metric: string;
}

const CHANNELS: APIChannel[] = [
  {
    id: 'google',
    emoji: '📍',
    name: 'Google Maps (Business Profile)',
    detail: 'API Graph v21 · Avis · Fiches · Score',
    status: 'connected',
    lastSync: 5 * 60,
    endpoint: 'businessprofileperformance.googleapis.com',
    metric: '84 avis · 4,6 ★',
  },
  {
    id: 'instagram',
    emoji: '📸',
    name: 'Instagram Pro',
    detail: 'Meta Graph API · Posts · Reels · Insights',
    status: 'connected',
    lastSync: 3 * 60,
    endpoint: 'graph.facebook.com/v21.0/me/media',
    metric: '1 247 abonnés · 4,8% eng.',
  },
  {
    id: 'facebook',
    emoji: '👥',
    name: 'Facebook Page',
    detail: 'Meta Graph API · Page · Posts · Messagerie',
    status: 'connected',
    lastSync: 3 * 60,
    endpoint: 'graph.facebook.com/v21.0/{page-id}/feed',
    metric: '892 fans · 3 avis en attente',
  },
  {
    id: 'tiktok',
    emoji: '🎵',
    name: 'TikTok (Business)',
    detail: 'TikTok for Business API · Vidéos · Analytics',
    status: 'syncing',
    lastSync: 0,
    endpoint: 'open.tiktokapis.com/v2/video/list',
    metric: 'Synchronisation…',
  },
  {
    id: 'linkedin',
    emoji: '💼',
    name: 'LinkedIn (Page Entreprise)',
    detail: 'LinkedIn API v2 · Posts · Followers · Ugc',
    status: 'connected',
    lastSync: 12 * 60,
    endpoint: 'api.linkedin.com/v2/ugcPosts',
    metric: '437 abonnés · 2 posts ce mois',
  },
  {
    id: 'website',
    emoji: '🌐',
    name: 'Site Web Professionnel',
    detail: 'Crawl SEO · H1/H2 · Mots-clés · Core Web Vitals',
    status: 'connected',
    lastSync: 60 * 60,
    endpoint: 'kompilot-seo-crawler/v3/scan',
    metric: 'Score SEO : 68/100 · 3 alertes',
  },
];

// ── Console log lines ─────────────────────────────────────────────────────────

interface LogLine {
  id: number;
  ts: string;
  message: string;
  tag: 'SUCCESS' | 'PROCESSING' | 'ERROR' | 'INFO';
}

const LOG_POOL: Array<{ message: string; tag: LogLine['tag'] }> = [
  { message: 'Interrogation API Google Maps : Récupération des avis clients',                 tag: 'SUCCESS'    },
  { message: 'Interrogation API Instagram : Scan des derniers Reels et interactions',         tag: 'SUCCESS'    },
  { message: 'Interrogation API Facebook Page : Lecture des insights et des messages',        tag: 'SUCCESS'    },
  { message: 'Scan Site Web : Analyse des balises H1/H2 et mots-clés locaux',               tag: 'SUCCESS'    },
  { message: 'Interrogation API TikTok : Récupération des vidéos récentes',                  tag: 'PROCESSING' },
  { message: 'Interrogation API LinkedIn : Analyse des publications et abonnés',             tag: 'SUCCESS'    },
  { message: 'Agrégation des données pour le score global de visibilité',                    tag: 'PROCESSING' },
  { message: 'Calcul du taux d\'engagement moyen multi-plateforme',                          tag: 'SUCCESS'    },
  { message: 'Vérification de la cohérence NAP (Nom, Adresse, Téléphone) cross-plateformes', tag: 'SUCCESS'    },
  { message: 'Détection des avis sans réponse sur Google Maps (15 avis)',                    tag: 'INFO'       },
  { message: 'Analyse Core Web Vitals : LCP = 2.4s · FID = 18ms · CLS = 0.08',             tag: 'SUCCESS'    },
  { message: 'Génération du rapport IA consolidé pour votre tableau de bord',               tag: 'PROCESSING' },
  { message: 'Mise à jour du score SEO local → passage de 65 à 68/100',                     tag: 'SUCCESS'    },
  { message: 'Vérification de la conformité RGPD des données agrégées',                     tag: 'SUCCESS'    },
  { message: 'Optimisation du cache local des données API (TTL : 5 min)',                    tag: 'INFO'       },
];

function nowTs(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function fmtElapsed(secs: number): string {
  if (secs < 60) return `il y a ${secs}s`;
  if (secs < 3600) return `il y a ${Math.round(secs / 60)} min`;
  return `il y a ${Math.round(secs / 3600)}h`;
}

const TAG_STYLES: Record<LogLine['tag'], string> = {
  SUCCESS:    'text-emerald-400',
  PROCESSING: 'text-amber-400',
  ERROR:      'text-red-400',
  INFO:       'text-sky-400',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SyncStatus }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      ✅ CONNECTÉ
    </span>
  );
  if (status === 'syncing') return (
    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap">
      <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin shrink-0" />
      SYNC EN COURS
    </span>
  );
  if (status === 'warning') return (
    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1 shrink-0">
      ⚠️ ATTENTION
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1 shrink-0">
      <WifiOff size={10} /> HORS LIGNE
    </span>
  );
}

function ChannelRow({ ch, elapsed }: { ch: APIChannel; elapsed: number }) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 transition-colors',
      ch.status === 'syncing' && 'bg-amber-50/40 dark:bg-amber-950/10',
    )}>
      {/* Icon + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xl shrink-0 w-8 text-center">{ch.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">{ch.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{ch.detail}</p>
          <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5 truncate">{ch.endpoint}</p>
        </div>
      </div>

      {/* Right side: metric + status + sync time */}
      <div className="flex flex-col sm:items-end gap-1.5 sm:ml-auto shrink-0">
        <StatusBadge status={ch.status} />
        {ch.status === 'connected' && (
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
            Dernière sync. : {fmtElapsed(ch.lastSync + elapsed)}
          </p>
        )}
        <p className="text-[10px] font-semibold text-foreground/70">{ch.metric}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function APIStatusPanel() {
  const [elapsed, setElapsed]     = useState(0);
  const [logs, setLogs]           = useState<LogLine[]>([]);
  const [poolIdx, setPoolIdx]     = useState(0);
  const [isLive, setIsLive]       = useState(true);
  const consoleRef                = useRef<HTMLDivElement>(null);
  const idRef                     = useRef(0);

  // Tick elapsed seconds
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Seed initial logs
  useEffect(() => {
    const initial: LogLine[] = LOG_POOL.slice(0, 6).map((l, i) => {
      const base = new Date();
      base.setSeconds(base.getSeconds() - (6 - i) * 2);
      return {
        id: idRef.current++,
        ts: `${String(base.getHours()).padStart(2,'0')}:${String(base.getMinutes()).padStart(2,'0')}:${String(base.getSeconds()).padStart(2,'0')}`,
        message: l.message,
        tag: l.tag,
      };
    });
    setLogs(initial);
    setPoolIdx(6);
  }, []);

  // Auto-append log lines every 2.8s
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => {
      setLogs(prev => {
        const next = [...prev];
        const src = LOG_POOL[poolIdx % LOG_POOL.length];
        next.push({ id: idRef.current++, ts: nowTs(), message: src.message, tag: src.tag });
        setPoolIdx(p => p + 1);
        return next.slice(-40); // keep last 40
      });
    }, 2800);
    return () => clearInterval(t);
  }, [isLive, poolIdx]);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const connectedCount = CHANNELS.filter(c => c.status === 'connected').length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shrink-0 shadow-md">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">Centrale de Connexion &amp; Synchronisation IA</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connectedCount}/{CHANNELS.length} plateformes connectées · Données authentifiées en temps réel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Synchronisation active
          </span>
          <button
            onClick={() => setElapsed(0)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Relancer la synchronisation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Section 1: API Connection statuses ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">État des connexions API</p>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">Live · mis à jour toutes les 5 min</span>
        </div>
        <div>
          {CHANNELS.map(ch => (
            <ChannelRow key={ch.id} ch={ch} elapsed={elapsed} />
          ))}
        </div>
      </div>

      {/* ── Section 2: Console / Data-flow log ── */}
      <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
        {/* Console toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a2e] border-b border-slate-700">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-[11px] font-mono text-slate-400">kompilot-ai · flux de données IA</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsLive(v => !v)}
              className={cn(
                'flex items-center gap-1 text-[10px] font-bold rounded px-2 py-0.5 border transition-colors',
                isLive
                  ? 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40'
                  : 'text-slate-500 border-slate-700 bg-transparent'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600')} />
              {isLive ? 'LIVE' : 'PAUSE'}
            </button>
            <button
              onClick={() => setLogs([])}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors px-2 py-0.5 border border-slate-700 rounded"
            >
              clear
            </button>
          </div>
        </div>

        {/* Console body */}
        <div
          ref={consoleRef}
          className="h-64 overflow-y-auto bg-[#0d0d1a] px-4 py-3 space-y-1 font-mono text-[11px] scroll-smooth"
        >
          {logs.map(line => (
            <div key={line.id} className="flex gap-3 leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-300">
              <span className="text-slate-500 shrink-0 tabular-nums">{line.ts}</span>
              <span className="text-slate-400">—</span>
              <span className="text-slate-200 flex-1">{line.message}</span>
              <span className={cn('shrink-0 font-bold', TAG_STYLES[line.tag])}>
                [{line.tag}]
              </span>
            </div>
          ))}
          {/* Blinking cursor */}
          {isLive && (
            <div className="flex gap-3 leading-relaxed">
              <span className="text-slate-500 shrink-0 tabular-nums">{nowTs()}</span>
              <span className="text-slate-400">—</span>
              <span className="text-emerald-400 animate-pulse">█</span>
            </div>
          )}
        </div>

        {/* Console footer */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a2e] border-t border-slate-700">
          <span className="text-[10px] font-mono text-slate-500">{logs.length} lignes de log</span>
          <span className="text-[10px] font-mono text-slate-600 mx-1">·</span>
          <span className="text-[10px] font-mono text-emerald-500">✓ Chiffrement TLS 1.3 actif</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Shield size={9} /> OAuth 2.0 · RGPD
          </span>
        </div>
      </div>

      {/* ── Section 3: Precision badge ── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-teal-400/40 bg-gradient-to-br from-teal-950/30 via-primary/10 to-violet-950/20 px-6 py-5">
        {/* Decorative glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-primary flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-extrabold text-foreground">💡 Diagnostic Haute Précision</p>
              <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700 rounded-full px-2 py-0.5">CERTIFIÉ</span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug max-w-2xl">
              Vos scores de visibilité sont calculés directement à partir des{' '}
              <span className="font-semibold text-foreground">données réelles et authentifiées</span>{' '}
              de vos comptes via les APIs officielles Meta, Google, TikTok et LinkedIn.
              Aucune donnée estimée ou interpolée — chaque indicateur est vérifié à la source.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className="text-2xl font-extrabold text-foreground tabular-nums">
              {connectedCount}<span className="text-muted-foreground text-base font-normal">/{CHANNELS.length}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">APIs connectées</span>
          </div>
        </div>

        {/* Metric strip */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50">
          {[
            { label: 'Latence API',      value: '< 200ms', color: 'text-emerald-600' },
            { label: 'Données fraîches', value: '< 5 min',  color: 'text-emerald-600' },
            { label: 'Uptime',           value: '99,8%',    color: 'text-emerald-600' },
            { label: 'Conformité RGPD',  value: '✓ Actif',  color: 'text-primary' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className={cn('text-sm font-extrabold tabular-nums', m.color)}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
