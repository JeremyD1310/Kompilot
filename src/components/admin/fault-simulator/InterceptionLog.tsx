import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { FAULT_DEFINITIONS, type FaultLog } from '../../../lib/faultSimulator';

// ── Helpers (duplicated from FaultCard to keep this module self-contained) ─────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5)  return 'à l\'instant';
  if (secs < 60) return `il y a ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `il y a ${hrs}h`;
}

// ── Interception log ──────────────────────────────────────────────────────────

export function InterceptionLog({ logs, onClear }: { logs: FaultLog[]; onClear: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
          <p className="text-sm font-bold text-slate-300">Journal d'interceptions</p>
          {logs.length > 0 && (
            <span className="text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-700/50 rounded-full px-2 py-0.5">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onClear(); }}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 size={10} /> Vider
            </button>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700">
          {logs.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle2 size={20} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Aucune interception — activez une panne et testez.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/50">
              {logs.map(log => {
                const def = FAULT_DEFINITIONS.find(d => d.id === log.faultId);
                const code = log.errorCode ?? def?.errorCode ?? log.faultId;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-base shrink-0 mt-0.5">{def?.emoji ?? '⚡'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-200 leading-tight">
                          {def?.label ?? log.faultId}
                        </p>
                        <span className="font-mono text-[9px] font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 rounded px-1.5 py-0.5">
                          {code}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Service : {log.service}
                        {log.callerCacheKey && <> · Cache key : <span className="text-slate-400">{log.callerCacheKey}</span></>}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={9} />
                        {fmtTime(log.interceptedAt)}
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {relativeTime(log.interceptedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
