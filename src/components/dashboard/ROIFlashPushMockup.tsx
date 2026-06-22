import { useState } from 'react'

interface ROIFlashPushMockupProps {
  noShow?: number
  reviews?: number
  geoScore?: number
  geoChange?: number
}

export function ROIFlashPushMockup({
  noShow = 380,
  reviews = 8,
  geoScore = 72,
  geoChange = 4,
}: ROIFlashPushMockupProps) {
  const [enabled, setEnabled] = useState(true)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative w-64 rounded-[2rem] bg-[#1a1a2e] p-3 shadow-2xl ring-4 ring-[#0f0f1e]">
        {/* Notch */}
        <div className="mx-auto mb-3 h-5 w-20 rounded-full bg-[#0f0f1e]" />

        {/* Screen area */}
        <div className="min-h-[280px] rounded-[1.25rem] bg-[#0b141a] px-3 py-3">
          {/* WhatsApp header bar */}
          <div className="mb-3 flex items-center gap-2 border-b border-[#ffffff14] pb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25d366] text-xs font-bold text-white">
              N
            </div>
            <div>
              <p className="text-[11px] font-semibold leading-none text-white">Kompilot</p>
              <p className="text-[9px] text-[#8696a0]">en ligne</p>
            </div>
          </div>

          {/* Message bubble */}
          <div className="relative max-w-[90%] rounded-t-2xl rounded-br-2xl rounded-bl-sm bg-[#005c4b] px-3 py-2.5 shadow-md">
            {/* Bubble tail */}
            <div className="absolute -left-1.5 bottom-0 h-3 w-3 overflow-hidden">
              <div className="h-full w-full bg-[#005c4b]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
            </div>

            <p className="mb-1.5 text-[11px] font-bold text-[#25d366]">📊 Votre rapport hebdomadaire</p>

            <p className="font-mono text-[10px] leading-relaxed text-[#e9edef]">
              💰 CA sauvé (Anti No-Show)
            </p>
            <p className="mb-1 font-mono text-[10px] font-semibold text-[#25d366]">
              &nbsp;&nbsp;&nbsp;+{noShow}€
            </p>

            <p className="font-mono text-[10px] leading-relaxed text-[#e9edef]">
              ⭐ Avis traités cette semaine
            </p>
            <p className="mb-1 font-mono text-[10px] font-semibold text-[#25d366]">
              &nbsp;&nbsp;&nbsp;{reviews}
            </p>

            <p className="font-mono text-[10px] leading-relaxed text-[#e9edef]">
              📈 Score G.E.O.
            </p>
            <p className="mb-2 font-mono text-[10px] font-semibold text-[#25d366]">
              &nbsp;&nbsp;&nbsp;{geoScore}% (+{geoChange}pts)
            </p>

            <p className="text-[10px] font-medium text-[#53bdeb] underline">
              Voir le rapport complet →
            </p>

            <p className="mt-1 text-right text-[8px] text-[#8696a0]">09:00 ✓✓</p>
          </div>
        </div>

        {/* Home bar */}
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#ffffff30]" />
      </div>

      {/* Toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <span className="text-xs font-medium text-foreground/70">Recevoir chaque lundi à 9h00</span>
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div
            className={`h-5 w-9 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#25d366]' : 'bg-foreground/20'}`}
          />
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </div>
      </label>
    </div>
  )
}
