import { GeoScanDemo } from '@/components/demo/GeoScanDemo';
import { LiveSocialFeed } from './LiveSocialFeed';

/* ══════════════════════════════════════════════════════════════
   GEO SCAN SECTION
   2-col layout: GeoScanDemo (left) + animated Live Social Feed (right)
══════════════════════════════════════════════════════════════ */
export function GeoScanSection() {
  return (
    <section className="space-y-8">

      {/* Section header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 text-xs font-semibold text-[#0D9488]">
          🔍 Nouvelles fonctionnalités
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
          Scan G.E.O. & G.E.A. — Testez votre visibilité dans les IA
        </h2>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto">
          Découvrez comment Kompilot optimise votre présence dans ChatGPT, Gemini et Perplexity,
          tout en publiant automatiquement sur vos réseaux sociaux.
        </p>
      </div>

      {/* 2-column layout: stacks on mobile, side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Left — GeoScanDemo interactive widget */}
        <div>
          <GeoScanDemo />
        </div>

        {/* Right — Live social feed panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {/* Panel header bar */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Publication Automatique</h3>
                <p className="text-white/65 text-xs mt-0.5">
                  Kompilot publie sur tous vos réseaux en temps réel
                </p>
              </div>
            </div>
          </div>

          {/* Feed content */}
          <div className="p-5 min-h-[520px] flex flex-col">
            <LiveSocialFeed />
          </div>
        </div>
      </div>
    </section>
  );
}
