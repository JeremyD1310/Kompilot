import { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UTMTagInputProps {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  onChange: (field: 'utm_source' | 'utm_medium' | 'utm_campaign', value: string) => void;
}

const SOURCE_PRESETS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Newsletter', value: 'newsletter' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Google', value: 'google' },
];

const MEDIUM_PRESETS = [
  { label: 'Social', value: 'social' },
  { label: 'Email', value: 'email' },
  { label: 'CPC', value: 'cpc' },
  { label: 'Bio', value: 'bio' },
  { label: 'Story', value: 'story' },
  { label: 'Referral', value: 'referral' },
];

const CAMPAIGN_PRESETS = [
  { label: 'Printemps', value: 'spring_sale' },
  { label: 'Notoriété', value: 'brand_awareness' },
  { label: 'Lancement', value: 'product_launch' },
  { label: 'Promo', value: 'promo_week' },
  { label: 'Événement', value: 'event_local' },
  { label: 'Fidélité', value: 'loyalty_q1' },
];

function ToolTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-foreground text-background text-[10px] leading-snug px-3 py-2 shadow-lg z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
        </span>
      )}
    </span>
  );
}

export function UTMTagInput({ utmSource, utmMedium, utmCampaign, onChange }: UTMTagInputProps) {
  const [expanded, setExpanded] = useState(false);

  const hasValues = utmSource || utmMedium || utmCampaign;

  return (
    <div className={cn(
      'rounded-2xl border transition-all duration-200',
      expanded ? 'border-primary/30 bg-muted/20' : 'border-border bg-card',
    )}>
      {/* Header — always visible, acts as toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            expanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
          )}>
            <Tag size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              🏷️ UTM Campaign Tracking
              {hasValues && !expanded && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                  {utmSource || utmMedium || utmCampaign ? 'Actif' : ''}
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {hasValues && !expanded
                ? `${utmSource || '—'} / ${utmMedium || '—'} / ${utmCampaign || '—'}`
                : 'Suivez vos campagnes marketing avec des paramètres UTM'
              }
            </p>
          </div>
        </div>
        <div className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0 ml-3">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Divider */}
          <div className="border-t border-border" />

          {/* utm_source */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-foreground">utm_source</label>
              <ToolTip text="Identifie la source du trafic (ex: instagram, facebook, newsletter). Permet de savoir d'où viennent vos visiteurs." />
            </div>
            <input
              type="text"
              value={utmSource}
              onChange={e => onChange('utm_source', e.target.value)}
              placeholder="ex: instagram, facebook, newsletter"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange('utm_source', p.value)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150',
                    utmSource === p.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* utm_medium */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-foreground">utm_medium</label>
              <ToolTip text="Identifie le canal marketing (ex: social, email, cpc). Permet de catégoriser le type de trafic." />
            </div>
            <input
              type="text"
              value={utmMedium}
              onChange={e => onChange('utm_medium', e.target.value)}
              placeholder="ex: social, email, cpc"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
            <div className="flex flex-wrap gap-1.5">
              {MEDIUM_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange('utm_medium', p.value)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150',
                    utmMedium === p.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* utm_campaign */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-foreground">utm_campaign</label>
              <ToolTip text="Identifie la campagne spécifique (ex: spring_sale, product_launch). Permet de comparer les performances entre campagnes." />
            </div>
            <input
              type="text"
              value={utmCampaign}
              onChange={e => onChange('utm_campaign', e.target.value)}
              placeholder="ex: spring_sale, product_launch"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
            <div className="flex flex-wrap gap-1.5">
              {CAMPAIGN_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange('utm_campaign', p.value)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150',
                    utmCampaign === p.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview URL */}
          {(utmSource || utmMedium || utmCampaign) && (
            <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Aperçu de l'URL</p>
              <p className="text-[11px] text-foreground font-mono break-all leading-relaxed">
                <span className="text-muted-foreground">votre-site.fr?</span>
                {utmSource && <span className="text-primary font-semibold">utm_source={utmSource}</span>}
                {utmSource && utmMedium && <span className="text-muted-foreground">&amp;</span>}
                {utmMedium && <span className="text-primary font-semibold">utm_medium={utmMedium}</span>}
                {(utmSource || utmMedium) && utmCampaign && <span className="text-muted-foreground">&amp;</span>}
                {utmCampaign && <span className="text-primary font-semibold">utm_campaign={utmCampaign}</span>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
