/**
 * WebhookRow — single configured webhook entry with
 * toggle, test, and delete actions.
 */
import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { EVENT_LABELS } from './WebhookTypes';
import type { WebhookConfig } from './WebhookTypes';

// ── Props ─────────────────────────────────────────────────────────────────────

interface WebhookRowProps {
  wh:       WebhookConfig;
  onDelete: () => void;
  onToggle: () => void;
  onTest:   () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WebhookRow({ wh, onDelete, onToggle, onTest }: WebhookRowProps) {
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      onTest();
    }, 1200);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card flex-wrap">
      {/* Active indicator */}
      <div
        className="w-2 h-2 rounded-full shrink-0 cursor-pointer"
        style={{ background: wh.active ? '#22C55E' : '#94a3b8' }}
        onClick={onToggle}
        title={wh.active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
      />

      {/* Label + URL */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{wh.label}</p>
        <p className="text-[10px] text-muted-foreground truncate font-mono">{wh.url}</p>
      </div>

      {/* Event badges */}
      <div className="flex flex-wrap gap-1 shrink-0">
        {wh.events.slice(0, 2).map(ev => (
          <span
            key={ev}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
            style={{
              background:  `${EVENT_LABELS[ev].color}15`,
              borderColor: `${EVENT_LABELS[ev].color}30`,
              color:        EVENT_LABELS[ev].color,
            }}
          >
            {EVENT_LABELS[ev].label}
          </span>
        ))}
        {wh.events.length > 2 && (
          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">
            +{wh.events.length - 2}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleTest}
          disabled={testing}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
        >
          {testing ? <Loader2 size={11} className="animate-spin" /> : 'Test'}
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
