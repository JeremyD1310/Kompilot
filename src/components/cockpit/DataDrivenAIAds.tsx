/**
 * DataDrivenAIAds — Creative Studio: Data-Driven AI Ads
 * ──────────────────────────────────────────────────────
 * Thin orchestrator. Logic lives here; UI in sub-modules:
 *   ads/IntelligenceHub.tsx   — Zone 1: source + script generation
 *   ads/ScriptConfigurator.tsx — Zone 2 left: script steps + actor gallery
 *   ads/ReelPreviewPanel.tsx  — Zone 2 right: 9:16 reel preview + subtitle picker
 *   ads/adsTypes.ts           — Shared types + static data
 *
 * Real API wiring:
 *   handleGenerateScript → POST /api/agents/sprint (Content Factory agent)
 *   Terminal logs        → GET  /api/agents/stream/:jobId (SSE real-time)
 *   The fake setTimeout is fully replaced by live backend responses.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Calendar, Check, Terminal, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { IntelligenceHub } from './ads/IntelligenceHub';
import { ScriptConfigurator } from './ads/ScriptConfigurator';
import { ReelPreviewPanel } from './ads/ReelPreviewPanel';
import {
  type CreativeSource, type SubtitleStyle, type ScriptStep,
  CREATIVE_SOURCES, ACTORS, DEFAULT_SCRIPT,
} from './ads/adsTypes';
import { blink } from '../../blink/client';

const BACKEND = 'https://gbrhsehk.backend.blink.new';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentMeta {
  provider: string;
  model: string;
  tokens: { input: number; output: number };
  cacheReadTokens: number;
  cacheHit: boolean;
  latencyMs: number;
}

interface FunctionCallResult {
  tool: string;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
}

// ── Log status colours ─────────────────────────────────────────────────────────

function getLogColor(line: string): string {
  if (line.includes('❌') || line.includes('Error') || line.includes('ERROR')) return '#f87171';
  if (line.includes('✅') || line.includes('Success') || line.includes('terminé')) return '#4ade80';
  if (line.includes('⚠️') || line.includes('partiel')) return '#fbbf24';
  if (line.includes('🎯 cache hit')) return '#a78bfa';
  if (line.includes('💾') || line.includes('write_to_calendar')) return '#38bdf8';
  if (line.includes('📡') || line.includes('read_aio')) return '#fb923c';
  if (line.includes('🤖') || line.includes('IA en cours')) return '#c084fc';
  return '#94a3b8';
}

// ── Live Terminal Component ────────────────────────────────────────────────────

interface LiveTerminalProps {
  logs: string[];
  isLoading: boolean;
  meta?: AgentMeta | null;
  functionCall?: FunctionCallResult | null;
  onClose: () => void;
}

function LiveTerminal({ logs, isLoading, meta, functionCall, onClose }: LiveTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showFc, setShowFc] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="rounded-2xl border border-border bg-[#0d1117] overflow-hidden mt-4">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[11px] text-[#58a6ff] font-mono ml-2 flex items-center gap-1.5">
            <Terminal size={11} />
            Kompilot Agent Console
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[#fbbf24]">
                <span className="animate-pulse">●</span> Running
              </span>
            )}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-white transition-colors p-1 rounded"
        >
          <X size={13} />
        </button>
      </div>

      {/* Log stream */}
      <div className="p-4 font-mono text-xs space-y-0.5 max-h-60 overflow-y-auto">
        {logs.length === 0 && isLoading && (
          <p className="text-[#58a6ff] animate-pulse">Initialisation...</p>
        )}
        {logs.map((line, i) => (
          <p key={i} style={{ color: getLogColor(line) }} className="leading-relaxed">
            {line}
          </p>
        ))}
        {isLoading && logs.length > 0 && (
          <p className="text-[#58a6ff] animate-pulse">▋</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Meta footer */}
      {meta && !isLoading && (
        <div className="border-t border-white/8 px-4 py-2.5 flex flex-wrap items-center gap-3 bg-[#161b22]">
          <span className="text-[10px] font-mono text-[#8b949e]">
            {meta.provider}/{meta.model}
          </span>
          <span className="text-[10px] font-mono text-[#8b949e]">
            {meta.tokens.input + meta.tokens.output} tokens
          </span>
          <span className="text-[10px] font-mono text-[#8b949e]">
            {meta.latencyMs}ms
          </span>
          {meta.cacheHit && (
            <span className="text-[10px] font-mono text-[#a78bfa] flex items-center gap-1">
              <Zap size={9} /> Cache hit ({meta.cacheReadTokens} tokens économisés)
            </span>
          )}
          {/* Function call accordion */}
          {functionCall?.result && (
            <button
              onClick={() => setShowFc(v => !v)}
              className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#58a6ff] hover:underline"
            >
              {showFc ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {functionCall.tool}
            </button>
          )}
        </div>
      )}
      {showFc && functionCall?.result && (
        <div className="px-4 pb-3 bg-[#0d1117] border-t border-white/5">
          <pre className="text-[10px] text-[#8b949e] font-mono whitespace-pre-wrap leading-relaxed pt-2 max-h-40 overflow-y-auto">
            {JSON.stringify(functionCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DataDrivenAIAds() {
  const [source, setSource]                   = useState<CreativeSource>('ad_spy');
  const [script, setScript]                   = useState<ScriptStep[]>(DEFAULT_SCRIPT);
  const [actor, setActor]                     = useState('a1');
  const [subtitleStyle, setSubtitleStyle]     = useState<SubtitleStyle>('bold_yellow');
  const [muted, setMuted]                     = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo]   = useState(false);
  const [scriptGenerated, setScriptGenerated] = useState(false);
  const [videoSynced, setVideoSynced]         = useState(false);

  // Terminal state
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalLogs, setTerminalLogs]       = useState<string[]>([]);
  const [agentMeta, setAgentMeta]             = useState<AgentMeta | null>(null);
  const [functionCall, setFunctionCall]       = useState<FunctionCallResult | null>(null);
  const [lastError, setLastError]             = useState<string | null>(null);

  const sseRef = useRef<EventSource | null>(null);

  // Close SSE on unmount
  useEffect(() => {
    return () => { sseRef.current?.close(); };
  }, []);

  function handleScriptChange(id: ScriptStep['id'], value: string) {
    setScript(prev => prev.map(s => s.id === id ? { ...s, value } : s));
  }

  // ── Real API call to Content Factory agent ───────────────────────────────────

  const handleGenerateScript = useCallback(async () => {
    setIsGeneratingScript(true);
    setScriptGenerated(false);
    setTerminalVisible(true);
    setTerminalLogs([]);
    setAgentMeta(null);
    setFunctionCall(null);
    setLastError(null);

    const sourceLabel = CREATIVE_SOURCES.find(s => s.id === source)?.label ?? '';

    // Build brief from source context
    const briefBySource: Record<CreativeSource, string> = {
      ad_spy:           'Génère des posts engageants basés sur les meilleures créatives publicitaires du secteur.',
      aio_trends:       'Génère des posts exploitant les tendances IA détectées par AIO Sync.',
      top_reels:        'Génère des posts inspirés des Reels les plus performants du secteur.',
      competitor_hooks: 'Génère des posts avec des hooks concurrentiels différenciants.',
    };

    try {
      const token = await blink.auth.getValidToken();

      // POST to Content Factory agent
      const res = await fetch(`${BACKEND}/api/agents/sprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          brief:           briefBySource[source],
          sector:          'restaurant',
          tone:            'dynamique',
          platforms:       ['Instagram', 'Facebook', 'TikTok'],
          postCount:       3,
          injectToCalendar: true,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Agent API ${res.status}: ${err}`);
      }

      const data = await res.json() as {
        success: boolean;
        jobId?: string;
        content: string;
        posts?: Array<{ platform: string; content: string; hashtags: string; bestTime: string }>;
        logs: string[];
        functionCall?: FunctionCallResult;
        meta: AgentMeta;
      };

      // Use logs from response (CF Workers synchronous — logs are returned in response)
      setTerminalLogs(data.logs ?? []);
      setAgentMeta(data.meta ?? null);
      setFunctionCall(data.functionCall ?? null);

      // If a jobId was returned, also open SSE stream for any remaining log lines
      if (data.jobId) {
        sseRef.current?.close();
        const sse = new EventSource(`${BACKEND}/api/agents/stream/${data.jobId}`);
        sseRef.current = sse;
        sse.onmessage = (e) => {
          try {
            const line = JSON.parse(e.data) as string;
            setTerminalLogs(prev => {
              if (prev.includes(line)) return prev;
              return [...prev, line];
            });
          } catch {}
        };
        sse.addEventListener('done', () => { sse.close(); });
        sse.onerror = () => { sse.close(); };
      }

      // Map API posts to script steps
      if (data.posts && data.posts.length > 0) {
        const firstPost = data.posts[0];
        setScript([
          {
            id: 'hook', label: 'Hook (0–3s)', placeholder: '',
            value: `Source : ${sourceLabel.split('—')[0].trim()} — ${firstPost.content.slice(0, 120)}`,
          },
          {
            id: 'body', label: 'Body (3–12s)', placeholder: '',
            value: data.posts[1]?.content?.slice(0, 200) ?? firstPost.content.slice(0, 200),
          },
          {
            id: 'cta', label: 'CTA (12–15s)', placeholder: '',
            value: data.posts[2]?.content?.slice(0, 120) ?? 'Essayez gratuitement sur kompilot.fr — lien en bio.',
          },
        ]);
      }

      setScriptGenerated(true);
    } catch (err: any) {
      const errMsg = err?.message ?? 'Erreur inconnue';
      setLastError(errMsg);
      setTerminalLogs(prev => [...prev,
        `[${new Date().toTimeString().slice(0, 8)}] [System] ❌ Erreur : ${errMsg}`,
      ]);
    } finally {
      setIsGeneratingScript(false);
    }
  }, [source]);

  async function handleGenerateVideo() {
    if (isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    // Video generation is still simulated (Kling/Sora integration coming)
    await new Promise(r => setTimeout(r, 2200));
    setIsGeneratingVideo(false);
  }

  async function handleSyncCalendar() {
    setVideoSynced(true);
    setTimeout(() => setVideoSynced(false), 3000);
  }

  const selectedActor  = ACTORS.find(a => a.id === actor);
  const selectedSource = CREATIVE_SOURCES.find(s => s.id === source);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes ddSpin { to { transform: rotate(360deg) } }
        @keyframes ddFadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        .dd-section { animation: ddFadeIn .3s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      {/* ── Zone 1: Intelligence Hub ─────────────────────────────────────── */}
      <div className="dd-section">
        <IntelligenceHub
          source={source}
          onSourceChange={setSource}
          onGenerateScript={handleGenerateScript}
          isGenerating={isGeneratingScript}
          scriptGenerated={scriptGenerated}
        />
      </div>

      {/* ── Live Terminal ─────────────────────────────────────────────────── */}
      {terminalVisible && (
        <div className="dd-section">
          <LiveTerminal
            logs={terminalLogs}
            isLoading={isGeneratingScript}
            meta={agentMeta}
            functionCall={functionCall}
            onClose={() => setTerminalVisible(false)}
          />
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {lastError && !terminalVisible && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
          <span>⚠️</span>
          <span>{lastError}</span>
          <button onClick={() => setLastError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ── Zone 2: Split Workspace ──────────────────────────────────────── */}
      <div className="dd-section" style={{
        display: 'grid',
        gridTemplateColumns: '1fr minmax(180px, 260px)',
        gap: 20, marginBottom: 20,
      }}>
        <ScriptConfigurator
          script={script}
          actor={actor}
          onScriptChange={handleScriptChange}
          onActorChange={setActor}
        />
        <ReelPreviewPanel
          script={script}
          actor={selectedActor}
          subtitleStyle={subtitleStyle}
          muted={muted}
          onSubtitleStyleChange={setSubtitleStyle}
          onMutedChange={setMuted}
          onGenerateVideo={handleGenerateVideo}
          isGeneratingVideo={isGeneratingVideo}
        />
      </div>

      {/* ── Zone 3: Sync bar ─────────────────────────────────────────────── */}
      <div className="dd-section" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        borderRadius: 14, padding: '14px 20px', marginBottom: 20,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Synchroniser avec le Calendrier de Campagnes
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
            {scriptGenerated && functionCall?.result
              ? `✅ Posts injectés dans le calendrier via write_to_calendar`
              : 'Les posts générés par l\'agent Content Factory sont auto-injectés dans le calendrier éditorial'}
          </p>
        </div>
        <button
          onClick={handleSyncCalendar}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: videoSynced ? '#16a34a' : 'hsl(var(--primary))',
            color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 16px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'background .2s',
          }}
        >
          {videoSynced ? <><Check size={13} /> Synchronisé !</> : <><Calendar size={13} /> Voir le calendrier</>}
        </button>
      </div>
    </div>
  );
}
