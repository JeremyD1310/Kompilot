/**
 * DiagnosticResults — Step 3: geo map + score + blurred technical details.
 * The blurred section is unblocked by DiagnosticCaptureModal.
 */
import { AlertTriangle, TrendingDown, Eye, Bot, Star, Lock } from 'lucide-react';
import { DiagnosticGeoMap } from './DiagnosticGeoMap';
import type { DiagnosticFormData } from './DiagnosticForm';

function scoreColor(score: number): string {
  if (score < 40) return 'text-red-600';
  if (score < 65) return 'text-amber-500';
  return 'text-emerald-600';
}
function scoreRing(score: number): string {
  if (score < 40) return 'border-red-300';
  if (score < 65) return 'border-amber-300';
  return 'border-emerald-300';
}
function scoreBg(score: number): string {
  if (score < 40) return 'from-red-50 to-rose-50';
  if (score < 65) return 'from-amber-50 to-orange-50';
  return 'from-emerald-50 to-teal-50';
}

interface Props {
  formData: DiagnosticFormData;
  score: number;
  onUnlock: () => void;
}

export function DiagnosticResults({ formData, score, onUnlock }: Props) {
  const { businessName, city } = formData;

  const axes = [
    { icon: Eye,          label: 'Présence Google Maps', value: `${Math.round(score * 0.9)}/100`,  note: score < 50 ? 'Non présent dans le top 3 local' : 'Présence partielle' },
    { icon: Bot,          label: 'IA Générative (ChatGPT · Perplexity)', value: `${Math.round(score * 0.7)}/100`, note: 'Non référencé — vos concurrents y sont' },
    { icon: Star,         label: 'Réputation & Avis clients', value: `${Math.round(score * 1.1)}/100`, note: score < 60 ? 'Score insuffisant' : 'Bonne base à amplifier' },
    { icon: TrendingDown, label: 'Visibilité locale concurrentielle', value: `${score}/100`, note: `3 concurrents devant vous à ${city}` },
  ];

  return (
    <div className="space-y-5">
      {/* Score hero */}
      <div className={`rounded-2xl bg-gradient-to-br ${scoreBg(score)} border p-5 text-center ${scoreRing(score)}`}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Score de Visibilité Kompilot
        </p>
        <div className={`text-6xl font-extrabold ${scoreColor(score)} leading-none mb-1`}>
          {score}
          <span className="text-2xl text-muted-foreground font-bold">/100</span>
        </div>
        <p className="text-sm font-semibold text-foreground mt-2">{businessName}</p>
        <p className="text-xs text-muted-foreground">{city || 'Analyse locale'}</p>
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-red-700">Alerte prioritaire</p>
          <p className="text-[11px] text-red-600/90 mt-0.5 leading-relaxed">
            Vos concurrents directs apparaissent avant vous dans <strong>3 quartiers stratégiques</strong> de {city || 'votre ville'}. Chaque jour sans action = des clients perdus.
          </p>
        </div>
      </div>

      {/* Geo map */}
      <DiagnosticGeoMap score={score} businessName={businessName} city={city} />

      {/* Axes — blurred behind paywall */}
      <div className="relative">
        <div className="space-y-2 select-none" style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
          {axes.map(({ icon: Icon, label, value, note }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{note}</p>
              </div>
              <span className="text-sm font-extrabold text-foreground tabular-nums shrink-0">{value}</span>
            </div>
          ))}
        </div>

        {/* Unlock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent rounded-xl">
          <button
            onClick={onUnlock}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-bold shadow-xl shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Lock size={14} />
            Débloquer le rapport complet
          </button>
        </div>
      </div>
    </div>
  );
}
