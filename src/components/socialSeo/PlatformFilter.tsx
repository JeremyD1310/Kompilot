/**
 * Platform filter badges — fluid toggle between All / Instagram / TikTok / LinkedIn / YouTube
 *
 * These badges let users filter the dashboard by social network.
 * "Non connecté" means the user hasn't linked that platform yet.
 */

import { Globe } from 'lucide-react'
import type { Platform } from '@/data/socialSeo/mockData'

interface PlatformFilterProps {
  activePlatform: Platform
  onChange: (p: Platform) => void
  connectedPlatforms: string[]
}

/** Platform icon components — inline SVGs for reliability */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.53V6.95a4.84 4.84 0 01-1-.26z" />
    </svg>
  )
}

const PLATFORMS: { key: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'Tous', icon: <Globe className="w-4 h-4" />, color: 'bg-slate-600' },
  { key: 'instagram', label: 'Instagram', icon: <InstagramIcon className="w-4 h-4" />, color: 'bg-pink-600' },
  { key: 'tiktok', label: 'TikTok', icon: <TikTokIcon className="w-4 h-4" />, color: 'bg-slate-900' },
  { key: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon className="w-4 h-4" />, color: 'bg-blue-700' },
  { key: 'youtube', label: 'YouTube', icon: <YouTubeIcon className="w-4 h-4" />, color: 'bg-red-600' },
]

export function PlatformFilter({ activePlatform, onChange, connectedPlatforms }: PlatformFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PLATFORMS.map(p => {
        const isActive = activePlatform === p.key
        const isConnected = p.key === 'all' || connectedPlatforms.includes(p.key)

        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            disabled={!isConnected}
            title={!isConnected && p.key !== 'all' ? `Connectez ${p.label} dans les paramètres pour voir ses données` : undefined}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${isActive
                ? `${p.color} text-white shadow-lg shadow-slate-900/30 scale-105`
                : isConnected
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
              }
            `}
          >
            {p.icon}
            {p.label}
            {!isConnected && p.key !== 'all' && (
              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                Non connecté
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
