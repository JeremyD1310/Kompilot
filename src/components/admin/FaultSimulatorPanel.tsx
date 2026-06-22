/**
 * FaultSimulatorPanel — Admin QA tool for triggering specific service failures.
 *
 * Each fault card now shows:
 *  • errorCode badge (SQLITE_BUSY, JWT_TOKEN_EXPIRED, …)
 *  • Activation timestamp ("Activée le 02/06/2026 à 10:32:15")
 *  • User ID + display name of the admin who activated it
 *  • Live intercept counter ("3 interceptions")
 *  • Last interception timestamp
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import {
  FAULT_DEFINITIONS,
  type FaultType,
  type FaultLog,
  type FaultActivation,
  activateFault,
  deactivateFault,
  isActiveFault,
  getActiveFaults,
  getFaultActivation,
  clearAllFaults,
  getFaultLog,
  clearFaultLog,
} from '../../lib/faultSimulator';
import { safeApiCall } from '../../lib/safeApiCall';
import { FaultCard } from './fault-simulator/FaultCard';
import { InterceptionLog } from './fault-simulator/InterceptionLog';

// ── Quick test helper ──────────────────────────────────────────────────────────

async function runQuickTest(faultId: FaultType): Promise<void> {
  const def = FAULT_DEFINITIONS.find(d => d.id === faultId)!;
  const result = await safeApiCall(
    async () => ({ ok: true }),
    {
      cacheKey: `fault_test_${faultId}`,
      fallback: { ok: false },
      timeoutMs: 3000,
      serviceLabel: def.service,
      fallbackMessage: `[Test] ${def.label} intercepté → Safe Mode actif (${def.errorCode}).`,
    },
  );
  if (result.status === 'fallback') {
    toast.success(`✅ Safe Mode activé — ${def.errorCode}`, {
      description: result.userMessage ?? 'Fallback déclenché correctement.',
    });
  } else {
    toast(`ℹ️ Aucune interception — vérifiez que la panne est activée.`);
  }
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</p>
      <span className="text-[9px] font-bold text-slate-600 bg-slate-700/40 rounded-full px-1.5 py-0.5">{count}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FaultSimulatorPanel() {
  const [activeIds, setActiveIds] = useState<Set<FaultType>>(() => new Set(getActiveFaults()));
  const [activations, setActivations] = useState<Map<FaultType, FaultActivation>>(() => {
    const map = new Map<FaultType, FaultActivation>();
    for (const id of getActiveFaults()) {
      const a = getFaultActivation(id);
      if (a) map.set(id, a);
    }
    return map;
  });
  const [logs, setLogs] = useState<FaultLog[]>(() => getFaultLog());
  const [testingId, setTestingId] = useState<FaultType | null>(null);

  // Poll every 2s to refresh intercept counters live
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    pollRef.current = setInterval(() => {
      const active = getActiveFaults();
      const newMap = new Map<FaultType, FaultActivation>();
      for (const id of active) {
        const a = getFaultActivation(id);
        if (a) newMap.set(id, a);
      }
      setActivations(newMap);
      setLogs(getFaultLog());
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const refreshState = useCallback(() => {
    const active = getActiveFaults();
    setActiveIds(new Set(active));
    const newMap = new Map<FaultType, FaultActivation>();
    for (const id of active) {
      const a = getFaultActivation(id);
      if (a) newMap.set(id, a);
    }
    setActivations(newMap);
    setLogs(getFaultLog());
  }, []);

  const handleToggle = (id: FaultType) => {
    const def = FAULT_DEFINITIONS.find(d => d.id === id)!;
    if (isActiveFault(id)) {
      deactivateFault(id);
      toast(`🔕 Panne désactivée : ${def.label}`);
    } else {
      activateFault(id);
      toast.error(`⚡ Panne activée : ${def.errorCode}`, {
        description: `Les appels API "${def.service}" vont maintenant échouer avec ${def.errorCode}.`,
      });
    }
    refreshState();
  };

  const handleTest = async (id: FaultType) => {
    setTestingId(id);
    await runQuickTest(id);
    setTestingId(null);
    refreshState();
  };

  const handleClearAll = () => {
    clearAllFaults();
    refreshState();
    toast('✅ Toutes les pannes désactivées.');
  };

  const handleClearLog = () => {
    clearFaultLog();
    setLogs([]);
  };

  const activeCount = activeIds.size;
  const dbFaults = FAULT_DEFINITIONS.filter(d => d.id.startsWith('db_'));
  const authFaults = FAULT_DEFINITIONS.filter(d => d.id.startsWith('auth_'));
  const externalFaults = FAULT_DEFINITIONS.filter(d => !d.id.startsWith('db_') && !d.id.startsWith('auth_'));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-orange-400" />
            <p className="text-sm font-bold text-slate-300">Simulateur de pannes granulaires</p>
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold bg-red-900/40 text-red-400 border border-red-700/50 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {activeCount} panne{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Activez des codes d'erreur spécifiques (SQLite, JWT, HTTP) pour tester le Safe Mode.
            Chaque carte affiche l'heure d'activation, l'ID utilisateur et le compteur d'interceptions en temps réel.
          </p>
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-700 text-xs font-semibold px-3 py-2 transition-colors"
          >
            <RotateCcw size={12} /> Tout réinitialiser
          </button>
        )}
      </div>

      {/* Database faults */}
      <div className="space-y-3">
        <SectionHeader label="🗄️ Base de données — SQLite" count={dbFaults.length} />
        {dbFaults.map(d => (
          <FaultCard
            key={d.id}
            faultId={d.id}
            isActive={activeIds.has(d.id)}
            testing={testingId === d.id}
            activation={activations.get(d.id)}
            onToggle={handleToggle}
            onTest={handleTest}
          />
        ))}
      </div>

      {/* Auth faults */}
      <div className="space-y-3">
        <SectionHeader label="🔐 Authentification — JWT / HTTP" count={authFaults.length} />
        {authFaults.map(d => (
          <FaultCard
            key={d.id}
            faultId={d.id}
            isActive={activeIds.has(d.id)}
            testing={testingId === d.id}
            activation={activations.get(d.id)}
            onToggle={handleToggle}
            onTest={handleTest}
          />
        ))}
      </div>

      {/* External API faults */}
      <div className="space-y-3">
        <SectionHeader label="🌐 APIs Externes" count={externalFaults.length} />
        {externalFaults.map(d => (
          <FaultCard
            key={d.id}
            faultId={d.id}
            isActive={activeIds.has(d.id)}
            testing={testingId === d.id}
            activation={activations.get(d.id)}
            onToggle={handleToggle}
            onTest={handleTest}
          />
        ))}
      </div>

      {/* Interception log */}
      <InterceptionLog logs={logs} onClear={handleClearLog} />
    </div>
  );
}
