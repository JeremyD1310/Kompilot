
// ── SplitViewBeforeAfter — Before/After AI response comparison ────────────────

function SplitViewBeforeAfter({
  query,
  businessName,
}: {
  query: GeoQuery;
  businessName: string;
}) {
  const competitor = query.competitors[0] ?? 'concurrent';

  // Truncate to ~300 chars for display
  const truncate = (text: string, max = 300) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const beforeText = truncate(query.rawResponse.replace(/\*\*/g, ''));

  // Build "after" text: replace competitor mentions with business name
  const afterText = truncate(
    query.rawResponse
      .replace(/\[CONCURRENT\]/g, '')
      .replace(new RegExp(competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), businessName)
      .replace(/\*\*/g, '') +
      `\n\n★ 4,9/5 — Recommandé par l'IA locale ✅`
  );

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide text-center">
        ⚡ Simulation visuelle — Effet Conquête GEA
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Before */}
        <div className="rounded-xl border border-red-800/50 bg-red-950/25 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-800/30 bg-red-950/40">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-wide">
              AVANT — ChatGPT aujourd'hui 🔴
            </p>
          </div>
          <div className="px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed font-mono whitespace-pre-wrap">
              {beforeText}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[9px] text-red-400 font-bold bg-red-950/60 border border-red-700/50 rounded px-1.5 py-0.5">
                ⚠ {competitor} est cité — pas vous
              </span>
            </div>
          </div>
        </div>

        {/* After */}
        <div
          className="rounded-xl border border-emerald-700/60 bg-emerald-950/20 overflow-hidden"
          style={{ animation: 'shimmer-glow 2s ease-in-out infinite' }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-800/30 bg-emerald-950/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
              APRÈS — Avec Kompilot ✨
            </p>
          </div>
          <div className="px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed font-mono whitespace-pre-wrap">
              {afterText}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-700/50 rounded px-1.5 py-0.5">
                ✅ {businessName} prend la 1ère place
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Shimmer glow keyframe injected via style tag */}
      <style>{`
        @keyframes shimmer-glow {
          0%, 100% { box-shadow: 0 0 16px rgba(16,185,129,0.15); }
          50% { box-shadow: 0 0 32px rgba(16,185,129,0.45), 0 0 50px rgba(251,191,36,0.15); }
        }
      `}</style>
    </div>
  );
}

