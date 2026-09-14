/**
 * AuditTrailTab — Displays admin activity logs from the admin_logs table.
 * Filters by action type, admin email, and date range.
 */

import { useState, useEffect } from 'react';
import { Shield, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { blink } from '../../blink/client';

interface AdminLog {
  id: string;
  admin_email: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string;
  target_email: string;
  description: string;
  metadata: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  role_change:        { label: 'Changement de rôle',    color: 'text-violet-400 bg-violet-500/10' },
  trial_extension:    { label: 'Prolongation essai',    color: 'text-blue-400 bg-blue-500/10' },
  account_block:      { label: 'Blocage compte',        color: 'text-red-400 bg-red-500/10' },
  plan_change:        { label: 'Changement de plan',    color: 'text-emerald-400 bg-emerald-500/10' },
  credit_grant:       { label: 'Crédits offerts',       color: 'text-amber-400 bg-amber-500/10' },
  impersonation:      { label: 'Impersonation',         color: 'text-orange-400 bg-orange-500/10' },
  general:            { label: 'Action générale',       color: 'text-slate-400 bg-slate-500/10' },
};

function getActionMeta(actionType: string) {
  return ACTION_LABELS[actionType] || ACTION_LABELS.general;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export function AuditTrailTab() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const rows = await blink.db.table<AdminLog>('admin_logs').list({
        orderBy: { created_at: 'desc' },
        limit: 200,
      });
      setLogs(rows);
    } catch (err) {
      console.warn('[AuditTrailTab] Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.action_type === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Journal d'audit</h3>
          <p className="text-xs text-slate-500 mt-0.5">Toutes les actions critiques des administrateurs</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Rafraîchir
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', ...Object.keys(ACTION_LABELS)].map(key => {
          const meta = key === 'all'
            ? { label: 'Tous', color: 'text-slate-300 bg-slate-700' }
            : getActionMeta(key);
          const count = key === 'all' ? logs.length : logs.filter(l => l.action_type === key).length;
          if (count === 0 && key !== 'all') return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                filter === key
                  ? `${meta.color} border-current`
                  : 'text-slate-500 bg-slate-800/50 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Log list */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <AlertTriangle size={24} className="mb-3 text-slate-600" />
          <p className="text-sm font-medium">Aucune action enregistrée</p>
          <p className="text-xs mt-1">Les actions critiques apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => {
            const meta = getActionMeta(log.action_type);
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield size={14} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{log.admin_email}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{log.description}</p>
                  {log.target_email && (
                    <p className="text-[11px] text-slate-500 mt-1">Cible : {log.target_email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 shrink-0">
                  <Clock size={10} />
                  {formatTimestamp(log.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
