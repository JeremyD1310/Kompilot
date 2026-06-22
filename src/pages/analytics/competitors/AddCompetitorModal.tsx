/**
 * AddCompetitorModal — input form with animated platform scan.
 */
import { useState, useEffect, useRef } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  PLATFORM_CONFIG, type PlatformId, type Competitor,
  generateMetrics, avatarGradient, trendFromSeed,
} from './types';

const ALL_PLATFORMS: PlatformId[] = ['instagram', 'facebook', 'tiktok', 'linkedin', 'google'];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (c: Competitor) => void;
}

type Phase = 'form' | 'scanning' | 'done';

export function AddCompetitorModal({ open, onClose, onAdd }: Props) {
  const [name, setName]       = useState('');
  const [handle, setHandle]   = useState('');
  const [platforms, setPlatforms] = useState<PlatformId[]>(['instagram', 'facebook']);
  const [phase, setPhase]     = useState<Phase>('form');
  const [scanStep, setScanStep] = useState(0);
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setName(''); setHandle(''); setPlatforms(['instagram', 'facebook']);
      setPhase('form'); setScanStep(0);
      setTimeout(() => nameRef.current?.focus(), 80);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open]);

  const togglePlatform = (p: PlatformId) => {
    setPlatforms(prev => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(x => x !== p);
      }
      return [...prev, p];
    });
  };

  const startScan = () => {
    if (!name.trim() || platforms.length === 0) return;
    const steps = [
      ...platforms.map(p => `Analyse du profil ${PLATFORM_CONFIG[p].label}…`),
      'Calcul des métriques de performance…',
      'Génération du rapport comparatif…',
    ];
    setScanSteps(steps);
    setScanStep(0);
    setPhase('scanning');

    let i = 0;
    const tick = () => {
      i++;
      if (i < steps.length) {
        setScanStep(i);
        timerRef.current = setTimeout(tick, 700);
      } else {
        // Build competitor object
        const metrics = generateMetrics(name, platforms);
        const competitor: Competitor = {
          id: `comp-${Date.now()}`,
          name: name.trim(),
          handle: handle.trim() || undefined,
          platforms,
          metrics,
          trend: trendFromSeed(name),
          addedAt: new Date().toISOString(),
        };
        setPhase('done');
        timerRef.current = setTimeout(() => onAdd(competitor), 600);
      }
    };
    timerRef.current = setTimeout(tick, 700);
  };

  if (!open) return null;

  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  const gradient = avatarGradient(name);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm" onClick={() => phase === 'form' && onClose()} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus size={16} className="text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground flex-1">Ajouter un concurrent</p>
            {phase === 'form' && (
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* ── FORM ── */}
            {phase === 'form' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Nom du commerce *</label>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="Ex: Boulangerie du Marché"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && name.trim() && startScan()}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Identifiant / @handle (optionnel)</label>
                  <input
                    type="text"
                    placeholder="@nom_du_commerce"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Plateformes à surveiller</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PLATFORMS.map(p => {
                      const cfg = PLATFORM_CONFIG[p];
                      const active = platforms.includes(p);
                      return (
                        <label key={p} className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all select-none',
                          active ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/70'
                        )}>
                          <input type="checkbox" checked={active} onChange={() => togglePlatform(p)} className="w-4 h-4 accent-primary shrink-0" />
                          <span className="text-sm">{cfg.emoji}</span>
                          <span className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{cfg.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={startScan}
                  disabled={!name.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold py-3 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyser ce concurrent 🔍
                </button>
              </>
            )}

            {/* ── SCANNING ── */}
            {(phase === 'scanning' || phase === 'done') && (
              <div className="space-y-4 py-2">
                {/* Preview card */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0', gradient)}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{name}</p>
                    {handle && <p className="text-[11px] text-muted-foreground">{handle}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {platforms.map(p => (
                        <span key={p} className={cn('text-[9px] font-bold rounded-full px-1.5 py-0.5 border', PLATFORM_CONFIG[p].textClass, PLATFORM_CONFIG[p].bgClass, PLATFORM_CONFIG[p].borderClass)}>
                          {PLATFORM_CONFIG[p].emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="divide-y divide-border">
                    {scanSteps.map((step, i) => {
                      const done = i < scanStep || phase === 'done';
                      const active = i === scanStep && phase === 'scanning';
                      return (
                        <div key={i} className={cn('flex items-center gap-3 px-4 py-2.5 transition-colors', active && 'bg-primary/5')}>
                          <div className="shrink-0">
                            {done || phase === 'done'
                              ? <CheckCircle2 size={14} className="text-emerald-500" />
                              : active
                                ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                : <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 bg-muted/30 inline-block" />
                            }
                          </div>
                          <p className={cn('text-xs', (done || phase === 'done') ? 'text-foreground font-medium' : active ? 'text-foreground font-semibold' : 'text-muted-foreground/50')}>
                            {step}
                          </p>
                          {(done || phase === 'done') && (
                            <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">OK</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {phase === 'done' && (
                  <div className="text-center text-xs text-emerald-700 font-semibold animate-in fade-in duration-300">
                    ✅ Concurrent ajouté — rapport comparatif disponible !
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
