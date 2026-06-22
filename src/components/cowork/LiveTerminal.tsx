/**
 * LiveTerminal — fake/real scrolling terminal for agent supervision.
 */
import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '@blinkdotnew/ui';
import { LIVE_LOGS } from './agentsTypes';

interface Props {
  externalLogs?: string[];
}

export function LiveTerminal({ externalLogs }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [logIdx, setLogIdx] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLines([`[${ts}] ${LIVE_LOGS[0]}`]);
    setLogIdx(1);
  }, []);

  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) {
      setLines(externalLogs.slice(-30));
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLogIdx(prev => {
        const idx = prev % LIVE_LOGS.length;
        setLines(prevLines => [...prevLines.slice(-30), `[${ts}] ${LIVE_LOGS[idx]}`]);
        return prev + 1;
      });
    }, 3200 + Math.random() * 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [externalLogs]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 ml-1">
          <Terminal size={12} className="text-slate-500" />
          <span className="text-[11px] font-mono text-slate-500">claude-cowork — supervision live</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Body */}
      <div
        ref={terminalRef}
        className="bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-48 overflow-y-auto space-y-0.5 scroll-smooth"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'leading-relaxed',
              i === lines.length - 1 && 'text-emerald-300',
              line.includes('[System]') && 'text-sky-400',
              line.includes('[Agent Reporter]') && 'text-violet-400',
              line.includes('[Agent Ad Spy]') && 'text-blue-400',
              line.includes('✅') && 'text-emerald-400',
            )}
          >
            {line}
            {i === lines.length - 1 && (
              <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
