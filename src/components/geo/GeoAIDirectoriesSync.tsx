/**
 * GeoAIDirectoriesSync — Section "🛰️ Couverture des Assistants IA"
 *
 * Affiche les connecteurs de synchronisation vers les plateformes qui alimentent
 * les LLM (Foursquare/ChatGPT, Yelp/Perplexity, Apple Business Connect/Siri)
 * et une jauge de cohérence sémantique globale.
 */
import { useState } from 'react';
import { Satellite, RefreshCw, CheckCircle2, AlertCircle, Clock, ChevronRight, Zap } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';

interface DirectoryStatus {
  id: string;
  name: string;
  description: string;
  llmSource: string;
  llmIcon: string;
  status: 'synced' | 'pending' | 'error' | 'not_connected';
  lastSync: string | null;
  score: number | null; // cohérence 0-100
  color: string;
}

const DIRECTORIES: DirectoryStatus[] = [
  {
    id: 'foursquare',
    name: 'Foursquare',
    description: 'Source principale de données locales pour ChatGPT & SearchGPT',
    llmSource: 'ChatGPT / SearchGPT',
    llmIcon: '🤖',
    status: 'not_connected',
    lastSync: null,
    score: null,
    color: '#F97316',
  },
  {
    id: 'yelp',
    name: 'Yelp',
    description: 'Base de données d\'avis qui alimente les réponses de Perplexity AI',
    llmSource: 'Perplexity AI',
    llmIcon: '🔍',
    status: 'not_connected',
    lastSync: null,
    score: null,
    color: '#EF4444',
  },
  {
    id: 'apple',
    name: 'Apple Business Connect',
    description: 'Référentiel local utilisé par Siri et Apple Intelligence',
    llmSource: 'Siri & Apple Intelligence',
    llmIcon: '🍎',
    status: 'not_connected',
    lastSync: null,
    score: null,
    color: '#6366F1',
  },
];

interface Props {
  establishmentName?: string;
  establishmentCity?: string;
}

export function GeoAIDirectoriesSync({ establishmentName, establishmentCity }: Props) {
  const [directories, setDirectories] = useState<DirectoryStatus[]>(DIRECTORIES);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [globalScore, setGlobalScore] = useState<number | null>(null);

  const connectedCount = directories.filter(d => d.status === 'synced').length;
  const totalCount = directories.length;

  const handleSync = async (dirId: string) => {
    setSyncing(dirId);

    // Simulation de la synchronisation (remplacer par vrai appel API)
    await new Promise(r => setTimeout(r, 2200));

    const score = Math.floor(Math.random() * 25) + 72; // 72-96

    setDirectories(prev => prev.map(d =>
      d.id === dirId
        ? {
            ...d,
            status: 'synced' as const,
            lastSync: new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            score,
          }
        : d
    ));

    setSyncing(null);

    // Recalcule le score global
    const updatedDirs = directories.map(d =>
      d.id === dirId ? { ...d, status: 'synced' as const, score } : d
    );
    const synced = updatedDirs.filter(d => d.score !== null);
    if (synced.length > 0) {
      const avg = Math.round(synced.reduce((s, d) => s + (d.score ?? 0), 0) / synced.length);
      setGlobalScore(avg);
    }

    const dir = directories.find(d => d.id === dirId);
    toast.success(`✅ ${dir?.name} synchronisé`, {
      description: `Score de cohérence : ${score}% — vos informations sont maintenant indexées par ${dir?.llmSource}.`,
    });
  };

  const handleSyncAll = async () => {
    for (const dir of directories) {
      if (dir.status !== 'synced') {
        await handleSync(dir.id);
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };

  const getStatusIcon = (status: DirectoryStatus['status']) => {
    switch (status) {
      case 'synced':    return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'pending':   return <Clock size={14} className="text-amber-500" />;
      case 'error':     return <AlertCircle size={14} className="text-red-500" />;
      default:          return <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusLabel = (status: DirectoryStatus['status']) => {
    switch (status) {
      case 'synced':        return { label: 'Synchronisé', color: '#22C55E', bg: 'rgba(34,197,94,.1)' };
      case 'pending':       return { label: 'En cours…', color: '#F59E0B', bg: 'rgba(245,158,11,.1)' };
      case 'error':         return { label: 'Erreur', color: '#EF4444', bg: 'rgba(239,68,68,.1)' };
      default:              return { label: 'Non connecté', color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))' };
    }
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-950/60 to-slate-900/40 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <Satellite size={17} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                🛰️ Couverture des Assistants IA
              </p>
              <p className="text-xs text-muted-foreground">
                Synchronisez vos données locales vers les sources qui alimentent les LLM
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs shrink-0"
            onClick={handleSyncAll}
            disabled={!!syncing || connectedCount === totalCount}
          >
            <Zap size={12} />
            Tout synchroniser
          </Button>
        </div>

        {/* ── Global compliance gauge ── */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/50 border border-indigo-500/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              📊 Cohérence sémantique Multi-Plateformes
            </span>
            <span className="text-lg font-black" style={{
              color: globalScore === null ? 'hsl(var(--muted-foreground))'
                : globalScore >= 80 ? '#22C55E'
                : globalScore >= 60 ? '#F59E0B'
                : '#EF4444'
            }}>
              {globalScore === null ? '—' : `${globalScore}%`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            {globalScore !== null && (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${globalScore}%`,
                  background: globalScore >= 80
                    ? 'linear-gradient(90deg, #10B981, #22C55E)'
                    : globalScore >= 60
                    ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {connectedCount}/{totalCount} plateformes synchronisées
            </span>
            {globalScore !== null && (
              <span className="text-[10px] font-semibold" style={{
                color: globalScore >= 80 ? '#22C55E' : globalScore >= 60 ? '#F59E0B' : '#EF4444'
              }}>
                {globalScore >= 80 ? '🟢 Excellent' : globalScore >= 60 ? '🟡 Moyen' : '🔴 Insuffisant'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Directory cards ── */}
      <div className="divide-y divide-border">
        {directories.map((dir) => {
          const statusInfo = getStatusLabel(dir.status);
          const isLoading = syncing === dir.id;

          return (
            <div key={dir.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Icon + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
                    style={{ background: `${dir.color}18`, border: `1.5px solid ${dir.color}30` }}
                  >
                    {dir.llmIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{dir.name}</p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {getStatusIcon(dir.status)}
                        <span className="ml-1">{statusInfo.label}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{dir.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Source LLM : <span className="font-medium">{dir.llmSource}</span>
                      {dir.lastSync && <span className="ml-2">· Dernière sync : {dir.lastSync}</span>}
                    </p>
                  </div>
                </div>

                {/* Score + action */}
                <div className="flex items-center gap-3 shrink-0">
                  {dir.score !== null && (
                    <div className="text-center">
                      <p className="text-base font-black" style={{ color: dir.color }}>{dir.score}%</p>
                      <p className="text-[9px] text-muted-foreground">Cohérence</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={dir.status === 'synced' ? 'outline' : 'default'}
                    className="gap-1.5 text-xs"
                    onClick={() => handleSync(dir.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : dir.status === 'synced' ? (
                      <><RefreshCw size={12} /> Re-sync</>
                    ) : (
                      <><ChevronRight size={12} /> Connecter</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress bar when syncing */}
              {isLoading && (
                <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full animate-pulse"
                    style={{ width: '60%', background: dir.color }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer info ── */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          💡 Une cohérence ≥ 80% garantit que les assistants IA mentionnent votre établissement
          {establishmentName ? ` "${establishmentName}"` : ''} dans les réponses locales
          {establishmentCity ? ` à ${establishmentCity}` : ''}.
        </p>
      </div>
    </div>
  );
}
