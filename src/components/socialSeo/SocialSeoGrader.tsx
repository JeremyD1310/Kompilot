/**
 * Social & AI SEO Grader — Lead Magnet Widget
 * 
 * Standalone component for the landing page.
 * Invites users to connect their Search Console for a free scan.
 * After animation, displays partial results with blur effect.
 */

import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, Globe, TrendingUp, Eye, Zap, ArrowRight, Lock, CheckCircle2 } from 'lucide-react'

interface GraderResult {
  domain: string
  score: number
  grade: string
  partialResults: {
    impressions: number
    platformsDetected: string[]
    estimatedClicks: number
    topQueryCount: number
    opportunitiesDetected: number
  }
  isPartial: boolean
  message: string
}

type ScanState = 'idle' | 'scanning' | 'results'

const SCAN_STEPS = [
  { label: 'Connexion à votre domaine...', duration: 800 },
  { label: 'Analyse de la visibilité Google...', duration: 1200 },
  { label: 'Détection des plateformes sociales...', duration: 1000 },
  { label: 'Calcul du score de visibilité IA...', duration: 1500 },
  { label: 'Génération du rapport...', duration: 800 },
]

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function SocialSeoGrader() {
  const [domain, setDomain] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<GraderResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = async () => {
    if (!domain.trim()) return
    setError(null)
    setScanState('scanning')
    setCurrentStep(0)

    // Simulate scan steps with delays
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(resolve => setTimeout(resolve, SCAN_STEPS[i].duration))
    }

    // Fetch actual grader result from API
    try {
      const API_BASE = 'https://gbrhsehk.backend.blink.new'
      const res = await fetch(`${API_BASE}/api/social-seo/grader?domain=${encodeURIComponent(domain.trim())}`)
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      setResult(data)
      setScanState('results')
    } catch (e) {
      setError('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.')
      setScanState('idle')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scanState === 'idle') {
      handleScan()
    }
  }

  const resetScan = () => {
    setScanState('idle')
    setResult(null)
    setCurrentStep(0)
    setError(null)
    setDomain('')
    inputRef.current?.focus()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full translate-y-24 -translate-x-24 blur-3xl" />

        <div className="relative z-10 p-8">
          {/* Header */}
          {scanState === 'idle' && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                GRATUIT — Analyse instantanée
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Social & AI SEO Grader
              </h2>
              <p className="text-slate-400 text-sm">
                Découvrez votre score de visibilité sur Google ET dans les moteurs de réponse IA (ChatGPT, Perplexity)
              </p>
            </div>
          )}

          {/* Input Section */}
          {scanState === 'idle' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="votre-domaine.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  />
                </div>
                <button
                  onClick={handleScan}
                  disabled={!domain.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <Search className="w-4 h-4" />
                  Scanner
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {/* Features preview */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                {[
                  { icon: Eye, label: 'Visibilité Google', color: 'text-teal-400' },
                  { icon: Zap, label: 'Score IA / AIO', color: 'text-purple-400' },
                  { icon: TrendingUp, label: 'Opportunités', color: 'text-amber-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {scanState === 'scanning' && (
            <div className="py-8">
              <div className="flex flex-col items-center gap-6">
                {/* Spinning scanner icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-700 border-t-teal-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-8 h-8 text-teal-400" />
                  </div>
                </div>

                {/* Progress steps */}
                <div className="w-full max-w-sm space-y-3">
                  {SCAN_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-300 ${
                        i < currentStep ? 'opacity-100' : i === currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {i < currentStep ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : i === currentStep ? (
                        <div className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${i <= currentStep ? 'text-white' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-500 text-xs">
                  Analyse en cours... Cela prend quelques secondes
                </p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {scanState === 'results' && result && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Score de visibilité pour</p>
                <p className="text-lg font-semibold text-white mb-4">{result.domain}</p>

                {/* Circular score */}
                <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-700"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${result.score * 2.51} ${251 - result.score * 2.51}`}
                      className={result.score >= 70 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-red-400'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{result.score}</span>
                    <span className="text-xs text-slate-400">{result.grade}</span>
                  </div>
                </div>
              </div>

              {/* Partial Results (Blurred) */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Impressions Google', value: formatNum(result.partialResults.impressions), icon: Eye, color: 'text-teal-400' },
                  { label: 'Clics estimés', value: formatNum(result.partialResults.estimatedClicks), icon: TrendingUp, color: 'text-blue-400' },
                  { label: 'Requêtes détectées', value: result.partialResults.topQueryCount.toString(), icon: Search, color: 'text-purple-400' },
                  { label: 'Opportunités', value: result.partialResults.opportunitiesDetected.toString(), icon: Zap, color: 'text-amber-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="relative p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                    <div className="relative">
                      <p className="text-xl font-bold text-white blur-sm select-none">{value}</p>
                      {/* Lock overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Platforms detected */}
              {result.partialResults.platformsDetected.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-400">Plateformes détectées :</span>
                  {result.partialResults.platformsDetected.map(p => (
                    <span key={p} className="px-2 py-1 rounded-full bg-slate-700/50 text-xs text-slate-300 capitalize">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="space-y-3 pt-2">
                <a
                  href="/signup"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
                >
                  Débloquer l'analyse complète
                  <ArrowRight className="w-4 h-4" />
                </a>
                <p className="text-center text-xs text-slate-500">
                  {result.message}
                </p>
              </div>

              {/* Reset */}
              <div className="text-center">
                <button
                  onClick={resetScan}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
                >
                  Scanner un autre domaine
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SocialSeoGrader
