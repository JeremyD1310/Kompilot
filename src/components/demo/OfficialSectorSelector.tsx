import { Building2, Scissors, ShoppingBag, Stethoscope, UtensilsCrossed, Wrench } from 'lucide-react'
import { OFFICIAL_SECTORS, type OfficialSector } from '../../data/sectors/sectorCatalog'

const icons = { restaurant: UtensilsCrossed, artisan: Wrench, beaute: Scissors, sante: Stethoscope, immobilier: Building2, commerce: ShoppingBag }

export function OfficialSectorSelector({ value, onChange, surface = 'dark' }: { value: OfficialSector; onChange: (value: OfficialSector) => void; surface?: 'dark' | 'light' }) {
  const isLight = surface === 'light'
  return <div data-testid="official-sector-selector" role="group" aria-label="Secteur d’activité" className="grid grid-cols-2 gap-2 sm:grid-cols-3">{OFFICIAL_SECTORS.map(profile => { const Icon = icons[profile.id]; const active = value === profile.id; return <button key={profile.id} id={`sector-${profile.id}`} type="button" aria-label={`Secteur ${profile.shortLabel}`} aria-pressed={active} data-testid={`sector-option-${profile.id}`} data-sector={profile.id} onClick={() => onChange(profile.id)} className={`flex min-h-16 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${active ? (isLight ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-teal-400 bg-teal-400/15 text-teal-200') : (isLight ? 'border-slate-200 bg-background text-slate-600 hover:border-teal-300 hover:text-teal-700' : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200')}`}><Icon className="h-4 w-4 shrink-0" /><span>{profile.shortLabel}<small className="mt-0.5 block text-[9px] font-normal opacity-70">{profile.label}</small></span></button> })}</div>
}
