import { useState } from 'react'
import { Plus, X, Lightbulb, TrendingUp, Video } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { toast } from '@blinkdotnew/ui'
import { cn } from '../../lib/utils'
import { ReelGeneratorModal } from '../cockpit/ReelGeneratorModal'

type Platform = 'Instagram' | 'Facebook' | 'Google' | 'TikTok' | 'LinkedIn'
interface Competitor { name: string; platform: Platform }

const SLOT_GRADIENTS = [
  'from-violet-500 to-pink-500',
  'from-blue-500 to-sky-400',
  'from-amber-500 to-orange-400',
]
const COMPETITOR_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b']
const AXES = ['Portée', 'Engagement', 'Régularité', 'Réputation', 'Contenu']
const YOU_SCORES = [72, 85, 68, 90, 65]
const PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'Google', 'TikTok', 'LinkedIn']

function seededScores(name: string): number[] {
  const seed = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return AXES.map((_, i) => 40 + ((seed * (i + 3) * 7) % 55))
}

function avg(scores: number[]) {
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const colors: Record<Platform, string> = {
    Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Google: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    TikTok: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    LinkedIn: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', colors[platform])}>
      {platform}
    </span>
  )
}

function AddSlotCard({ slotIndex, onAdd }: { slotIndex: number; onAdd: (c: Competitor) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<Platform>('Instagram')

  function handleAdd() {
    if (!name.trim()) { toast.error('Entrez un nom de concurrent'); return }
    onAdd({ name: name.trim(), platform })
    setName(''); setPlatform('Instagram'); setOpen(false)
    toast.success(`${name.trim()} ajouté au radar !`)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center justify-center gap-2 w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary text-sm font-medium"
    >
      <Plus className="w-4 h-4" /> Ajouter un concurrent
    </button>
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Concurrent {slotIndex + 1}
      </p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder="Nom du concurrent"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <select
        value={platform}
        onChange={e => setPlatform(e.target.value as Platform)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={handleAdd} className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:opacity-90 transition-opacity">
          Ajouter
        </button>
        <button onClick={() => { setOpen(false); setName('') }} className="px-3 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function CompetitorCard({ competitor, slotIndex, onRemove }: { competitor: Competitor; slotIndex: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0', SLOT_GRADIENTS[slotIndex])}>
        {competitor.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{competitor.name}</p>
        <PlatformBadge platform={competitor.platform} />
      </div>
      <button onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive border border-border rounded-md px-2 py-1 hover:border-destructive/50 transition-colors">
        Retirer
      </button>
    </div>
  )
}

export function LocalRadarTab() {
  const [competitors, setCompetitors] = useState<(Competitor | null)[]>([null, null, null])
  const [reelModalOpen, setReelModalOpen] = useState(false)
  const [reelPrefill, setReelPrefill]     = useState('')

  function addCompetitor(index: number, c: Competitor) {
    setCompetitors(prev => { const n = [...prev]; n[index] = c; return n })
  }
  function removeCompetitor(index: number) {
    setCompetitors(prev => { const n = [...prev]; n[index] = null; return n })
  }

  const active = competitors.filter(Boolean) as Competitor[]

  const chartData = AXES.map((axis, i) => {
    const row: Record<string, string | number> = { axis, Vous: YOU_SCORES[i] }
    active.forEach(c => { row[c.name] = seededScores(c.name)[i] })
    return row
  })

  const topCompetitor = active.length
    ? active.reduce((best, c) => avg(seededScores(c.name)) > avg(seededScores(best.name)) ? c : best, active[0])
    : null
  const engagementGap = topCompetitor ? Math.round(seededScores(topCompetitor.name)[1] - YOU_SCORES[1]) : 0

  return (
    <div className="space-y-8 py-2">
      {/* Section 1 — Competitor input */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          Suivez jusqu'à 3 concurrents locaux
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {competitors.map((c, i) =>
            c
              ? <CompetitorCard key={i} competitor={c} slotIndex={i} onRemove={() => removeCompetitor(i)} />
              : <AddSlotCard key={i} slotIndex={i} onAdd={comp => addCompetitor(i, comp)} />
          )}
        </div>
      </section>

      {/* Section 2 — Radar chart */}
      {active.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Score de visibilité — Vous vs Vos Concurrents
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Radar name="Vous" dataKey="Vous" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
              {active.map((c, i) => (
                <Radar key={c.name} name={c.name} dataKey={c.name} stroke={COMPETITOR_COLORS[i]} fill={COMPETITOR_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Section 3 — AI tip */}
      {topCompetitor && (
        <section className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">Conseil Stratégique IA</h3>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            <strong>{topCompetitor.name}</strong> cartonne avec les formats Vidéo en ce moment.{' '}
            Leur score d'engagement {engagementGap > 0 ? `dépasse le vôtre de ${engagementGap} points` : 'est proche du vôtre'}.{' '}
            Générez un Reel IA en un clic pour combler cet écart et dépasser votre concurrent local.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setReelPrefill(`Reel pour surpasser ${topCompetitor.name} sur ${topCompetitor.platform}. Montrez le savoir-faire unique de votre commerce, ambiance authentique, format vertical Reel optimisé`);
                setReelModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white font-semibold text-sm px-4 py-2 transition-all shadow-md shadow-violet-500/20 active:scale-[0.98]"
            >
              <Video className="w-4 h-4" /> Générer un Reel IA maintenant ✨
            </button>
            <a
              href="/cockpit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-semibold text-sm px-4 py-2 transition-colors"
            >
              Cockpit IA →
            </a>
          </div>
        </section>
      )}

      {/* Reel Generator Modal */}
      <ReelGeneratorModal
        open={reelModalOpen}
        onClose={() => setReelModalOpen(false)}
        prefillContext={reelPrefill}
      />
    </div>
  )
}