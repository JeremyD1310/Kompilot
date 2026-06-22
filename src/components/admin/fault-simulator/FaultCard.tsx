import { Calendar, Clock, Code2, User, Zap, Shield, ShieldOff, Play } from 'lucide-react';
import {
  FAULT_DEFINITIONS,
  type FaultType,
  type FaultActivation,
} from '../../../lib/faultSimulator';

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Relative time label, e.g. "il y a 3 min" */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5)  return 'à l\'instant';
  if (secs < 60) return `il y a ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `il y a ${hrs}h`;
}

// ── Severity styles ────────────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<string, string> = {
  low:      'bg-slate-700 text-slate-300 border-slate-600',
  medium:   'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  high:     'bg-orange-900/40 text-orange-300 border-orange-700',
  critical: 'bg-red-900/40 text-red-300 border-red-700',
};

const SEVERITY_DOT: Record<string, string> = {
  low:      'bg-slate-400',
  medium:   'bg-yellow-400',
  high:     'bg-orange-400',
  critical: 'bg-red-500 animate-pulse',
};

const COLOR_RING: Record<string, string> = {
  orange: 'border-orange-500/50 bg-orange-950/20',
  red:    'border-red-500/50 bg-red-950/20',
  violet: 'border-violet-500/50 bg-violet-950/20',
  yellow: 'border-yellow-500/50 bg-yellow-950/20',
  blue:   'border-blue-500/50 bg-blue-950/20',
  green:  'border-green-500/50 bg-green-950/20',
  slate:  'border-slate-500/50 bg-slate-800/60',
};

// ── Activation metadata strip ──────────────────────────────────────────────────

function ActivationMeta({ activation }: { activation: FaultActivation }) {
  return (
    <div className="mt-3 rounded-xl bg-slate-900/70 border border-slate-700/80 divide-y divide-slate-700/60">
      {/* Row 1 — Activation time + user */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Calendar size={11} className="text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Activée le</p>
          <p className="text-[11px] font-semibold text-slate-200 font-mono">
            {fmtDateTime(activation.activatedAt)}
          </p>
        </div>
        <div className="text-right min-w-0 shrink-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Par</p>
          <div className="flex items-center gap-1 justify-end">
            <User size={10} className="text-slate-400" />
            <p className="text-[11px] font-semibold text-slate-200 truncate max-w-[120px]">
              {activation.activatedBy}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2 — User ID */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Code2 size={11} className="text-violet-400 shrink-0" />
        <p className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">User ID</p>
        <p className="text-[10px] font-mono text-violet-300 truncate flex-1 text-right">
          {activation.userId}
        </p>
      </div>

      {/* Row 3 — Intercept counter + last hit */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Zap size={11} className={`shrink-0 ${activation.interceptCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Interceptions</p>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-extrabold tabular-nums ${
              activation.interceptCount === 0 ? 'text-slate-500'
              : activation.interceptCount < 5 ? 'text-amber-400'
              : 'text-red-400'
            }`}>
              {activation.interceptCount}
            </span>
            {activation.interceptCount > 0 && (
              <span className="text-[9px] text-slate-500">
                depuis activation
              </span>
            )}
          </div>
        </div>
        {activation.lastInterceptAt ? (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dernier hit</p>
            <div className="flex items-center gap-1 justify-end">
              <Clock size={9} className="text-slate-500" />
              <p className="text-[10px] font-mono text-slate-300">
                {fmtTime(activation.lastInterceptAt)}
              </p>
              <span className="text-[9px] text-slate-500">
                ({relativeTime(activation.lastInterceptAt)})
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-600 italic shrink-0">aucun hit</p>
        )}
      </div>
    </div>
  );
}

// ── Fault card ─────────────────────────────────────────────────────────────────

export function FaultCard({
  faultId,
  onToggle,
  onTest,
  isActive,
  testing,
  activation,
}: {
  faultId: FaultType;
  onToggle: (id: FaultType) => void;
  onTest: (id: FaultType) => void;
  isActive: boolean;
  testing: boolean;
  activation?: FaultActivation;
}) {
  const def = FAULT_DEFINITIONS.find(d => d.id === faultId)!;
  const ringClass = COLOR_RING[def.color] ?? 'border-slate-600 bg-slate-800/40';

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
      isActive ? ringClass : 'border-slate-700 bg-slate-800/40'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
          isActive ? 'bg-slate-700' : 'bg-slate-700/50'
        }`}>
          {def.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-100 leading-tight">{def.label}</p>
            <span className={`text-[9px] font-extrabold uppercase tracking-widest border rounded-full px-2 py-0.5 ${SEVERITY_STYLE[def.severity]}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${SEVERITY_DOT[def.severity]}`} />
              {def.severity}
            </span>
            {def.httpStatus && (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-700/60 rounded-full px-1.5 py-0.5">
                HTTP {def.httpStatus}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{def.description}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(faultId)}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
            isActive
              ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50'
              : 'bg-emerald-900/20 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40'
          }`}
        >
          {isActive ? <ShieldOff size={12} /> : <Shield size={12} />}
          {isActive ? 'Désactiver' : 'Activer'}
        </button>
      </div>

      {/* Error code + error message */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Code2 size={10} className="text-slate-500 shrink-0" />
          <span className="font-mono text-[10px] font-bold tracking-wide text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 rounded px-2 py-0.5">
            {def.errorCode}
          </span>
        </div>
        <div className="rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2">
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed break-all">{def.errorMessage}</p>
        </div>
      </div>

      {/* Activation metadata — only when fault is active */}
      {isActive && activation && (
        <ActivationMeta activation={activation} />
      )}

      {/* Test button — only when active */}
      {isActive && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onTest(faultId)}
            disabled={testing}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600/20 border border-amber-600/50 text-amber-400 font-bold text-xs px-3 py-2 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <><span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> Test en cours…</>
            ) : (
              <><Play size={11} /> Tester le fallback</>
            )}
          </button>
          <span className="text-[10px] text-slate-500">
            Déclenche un <code className="bg-slate-700/50 px-1 rounded text-[9px]">safeApiCall</code> immédiat → vérifie le Safe Mode
          </span>
        </div>
      )}
    </div>
  );
}
