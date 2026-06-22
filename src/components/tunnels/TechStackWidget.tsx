/**
 * TechStackWidget — Displays detected tech tools used in a funnel.
 * Shows icons/badges categorized by function (payment, email, builder, etc.)
 */
import { cn } from '@blinkdotnew/ui';
import { Cpu, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { TechStackTool } from './types';

// ── Tool icon map (emoji fallbacks for all major tools) ────────────────────
const TOOL_ICONS: Record<string, string> = {
  'Stripe': '💳',
  'PayPal': '🅿️',
  'Kajabi': '🟣',
  'ClickFunnels': '🔶',
  'Systeme.io': '⚙️',
  'Teachable': '📚',
  'Webflow': '🌊',
  'WordPress': '🔵',
  'ActiveCampaign': '📧',
  'Mailchimp': '🐒',
  'ConvertKit': '✉️',
  'Actionetics': '📩',
  'Lemlist': '🎯',
  'Brevo': '📨',
  'Meta Pixel': '📘',
  'Google Ads Tag': '🔍',
  'Google Analytics 4': '📊',
  'Hotjar': '🔥',
  'Typeform': '📋',
  'Intercom': '💬',
  'Calendly': '📅',
};

const CATEGORY_CONFIG: Record<TechStackTool['category'], {
  label: string;
  color: string;
  bg: string;
  dot: string;
}> = {
  payment: { label: 'Paiement', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500' },
  email: { label: 'Email / CRM', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', dot: 'bg-blue-500' },
  builder: { label: 'Builder / Page', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', dot: 'bg-purple-500' },
  analytics: { label: 'Analytics', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', dot: 'bg-orange-500' },
  ads: { label: 'Tracking Pub', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500' },
  crm: { label: 'CRM', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', dot: 'bg-teal-500' },
  support: { label: 'Support', color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', dot: 'bg-sky-500' },
  other: { label: 'Autre', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/30', dot: 'bg-slate-400' },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-green-500' : value >= 65 ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground font-mono">{value}%</span>
    </div>
  );
}

interface TechStackWidgetProps {
  tools: TechStackTool[];
  className?: string;
}

export function TechStackWidget({ tools, className }: TechStackWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  if (!tools || tools.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border p-3.5 bg-card', className)}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Cpu size={13} className="text-muted-foreground" />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</p>
        </div>
        <p className="text-xs text-muted-foreground">Aucun outil détecté pour ce tunnel.</p>
      </div>
    );
  }

  // Group by category
  const grouped = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, TechStackTool[]>);

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const order = ['payment', 'builder', 'email', 'ads', 'analytics', 'crm', 'support', 'other'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const displayedTools = expanded ? tools : tools.slice(0, 4);
  const hasMore = tools.length > 4;

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cpu size={13} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tech Stack Détecté</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-green-500" />
          <span className="text-[10px] text-muted-foreground font-medium">{tools.length} outils</span>
        </div>
      </div>

      {/* Tools list */}
      <div className="px-3.5 pb-1 space-y-1">
        {(expanded ? tools : tools.slice(0, 4)).map(tool => {
          const cat = CATEGORY_CONFIG[tool.category] ?? CATEGORY_CONFIG.other;
          const icon = TOOL_ICONS[tool.name] ?? '🔧';
          return (
            <div
              key={tool.name}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <span className="text-base leading-none shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-foreground truncate">{tool.name}</span>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', cat.bg, cat.color)}>
                    {cat.label}
                  </span>
                </div>
              </div>
              <ConfidenceBar value={tool.confidence} />
            </div>
          );
        })}
      </div>

      {/* Expand / collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border/60 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-b-xl"
        >
          {expanded ? (
            <><ChevronUp size={12} /> Réduire</>
          ) : (
            <><ChevronDown size={12} /> Voir {tools.length - 4} autres outils</>
          )}
        </button>
      )}

      {/* Category breakdown — when expanded */}
      {expanded && sortedCategories.length > 1 && (
        <div className="px-3.5 pt-2 pb-3.5 border-t border-border/60 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Répartition par catégorie</p>
          {sortedCategories.map(cat => {
            const config = CATEGORY_CONFIG[cat as TechStackTool['category']] ?? CATEGORY_CONFIG.other;
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
                <span className="text-[11px] text-foreground font-medium flex-1">{config.label}</span>
                <span className="text-[11px] font-bold text-muted-foreground">{grouped[cat].length}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
