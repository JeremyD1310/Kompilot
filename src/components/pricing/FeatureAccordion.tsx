import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface FeatureAccordionProps {
  features: string[];
  tone: 'teal' | 'indigo';
}

const toneClasses = {
  teal: {
    icon: 'bg-teal-500/10 text-teal-300',
    button: 'border-teal-500/30 text-teal-300 hover:bg-teal-500/10',
  },
  indigo: {
    icon: 'bg-indigo-500/15 text-indigo-300',
    button: 'border-indigo-400/30 text-indigo-300 hover:bg-indigo-400/10',
  },
} as const;

export function FeatureAccordion({ features, tone }: FeatureAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = expanded ? features : features.slice(0, 4);
  const styles = toneClasses[tone];

  return (
    <div className="space-y-3">
      <ul className="flex flex-col gap-3">
        {visibleFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className="text-[13px] leading-relaxed text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>
      {features.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${styles.button}`}
        >
          {expanded ? 'Réduire les fonctionnalités' : `Voir les ${features.length - 4} fonctionnalités restantes`}
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
