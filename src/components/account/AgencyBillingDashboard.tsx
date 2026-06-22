/**
 * AgencyBillingDashboard — Billing management for agency / agency_owner roles.
 * ⚠️ White-label rule: Kompilot name NEVER shown on client-facing documents.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Badge, Button, Skeleton, toast } from '@blinkdotnew/ui';
import { Building2, Layers, PlugZap, Check, Loader2 } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { WhiteLabelBanner } from './agency/WhiteLabelBanner';
import { SubAccountsTable } from './agency/SubAccountsTable';
import { InvoicePreview } from './agency/InvoicePreview';
import { VATNumberSection } from './VATNumberSection';

// ── Types ─────────────────────────────────────────────────────────────────────

type BillingMode = 'centralized' | 'connected';

interface SubAccount {
  // backend returns establishmentId, not id
  id?: string;
  establishmentId?: string;
  clientName: string;
  sector: string;
  creditsUsed: number;
  creditsLimit?: number;   // backend field
  creditsTotal?: number;   // UI alias (may be missing)
  status: 'active' | 'inactive' | 'trial' | 'quota_reached';
  lastActivity?: string | null;
}

// ── Mode card ─────────────────────────────────────────────────────────────────

interface ModeCardProps {
  mode: BillingMode;
  selected: boolean;
  disabled?: boolean;
  onSelect: (m: BillingMode) => void;
}

const MODE_CONFIG: Record<BillingMode, {
  icon: React.ReactNode; title: string; badge: React.ReactNode;
  description: string; benefits: string[]; disabledBadge: React.ReactNode;
}> = {
  centralized: {
    icon: <Building2 size={16} />, title: 'Mode Centralisé',
    badge: <Badge className="text-[10px] bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20 shrink-0">Par défaut</Badge>,
    description: 'Vous payez via votre carte Stripe globale. Kompilot vous émet une facture unique incluant tous vos sous-comptes actifs. Vous refacturez ensuite vos clients à votre propre tarif.',
    benefits: ['Maîtrise totale de votre marge', 'Vos clients ne voient jamais Kompilot', '1 seul prélèvement mensuel'],
    disabledBadge: null,
  },
  connected: {
    icon: <PlugZap size={16} />, title: 'Mode Connecté', badge: null,
    description: 'Vos clients sont prélevés directement en votre nom via Stripe Connect. Kompilot prélève sa licence technique et vous verse la commission.',
    benefits: ['Paiements automatisés client-à-client', 'Votre logo sur les paiements', 'Commission versée automatiquement'],
    disabledBadge: <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">En cours de déploiement</Badge>,
  },
};

function ModeCard({ mode, selected, disabled, onSelect }: ModeCardProps) {
  const cfg = MODE_CONFIG[mode];
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(mode)}
      disabled={disabled}
      className={[
        'relative text-left rounded-2xl border p-5 transition-all flex flex-col gap-3 w-full',
        disabled ? 'opacity-60 cursor-not-allowed bg-muted/20 border-border' :
          selected
            ? 'border-[#0D9488] bg-[#0D9488]/5 shadow-sm ring-1 ring-[#0D9488]/20'
            : 'border-border hover:border-[#0D9488]/40 bg-card',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selected && !disabled ? 'bg-[#0D9488] text-white' : 'bg-muted text-muted-foreground'}`}>
          {cfg.icon}
        </div>
        <span className="text-sm font-bold text-foreground">{cfg.title}</span>
        {cfg.badge}
        {disabled && cfg.disabledBadge}
        {selected && !disabled && (
          <span className="ml-auto w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center shrink-0">
            <Check size={11} className="text-white" strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
      <ul className="space-y-1">
        {cfg.benefits.map(b => (
          <li key={b} className="flex items-center gap-1.5 text-xs text-foreground/70">
            <Check size={11} className="text-[#0D9488] shrink-0" strokeWidth={2.5} />{b}
          </li>
        ))}
      </ul>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AgencyBillingDashboard() {
  const { user } = useAuth();
  const agencyName = user?.displayName ?? 'Votre agence';

  const [billingMode, setBillingMode] = useState<BillingMode>('centralized');
  const [statusLoading, setStatusLoading] = useState(true);
  const [modeUpdating, setModeUpdating] = useState(false);

  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [subLoading, setSubLoading] = useState(true);

  // Load billing status
  useEffect(() => {
    (async () => {
      try {
        const token = await blink.auth.getValidToken();
        const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/agency/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.billingMode) setBillingMode(data.billingMode);
        }
      } catch { /* silent */ } finally {
        setStatusLoading(false);
      }
    })();
  }, []);

  // Load sub-accounts
  useEffect(() => {
    (async () => {
      try {
        const token = await blink.auth.getValidToken();
        const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/agency/sub-accounts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubAccounts(Array.isArray(data) ? data : (data.subAccounts ?? []));
        }
      } catch { /* silent */ } finally {
        setSubLoading(false);
      }
    })();
  }, []);

  const handleModeChange = async (mode: BillingMode) => {
    if (mode === billingMode || modeUpdating) return;
    setModeUpdating(true);
    const prev = billingMode;
    setBillingMode(mode);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/agency/mode', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMode: mode }),
      });
      if (!res.ok) throw new Error();
      toast.success('Mode de facturation mis à jour ✓');
    } catch {
      setBillingMode(prev);
      toast.error('Impossible de mettre à jour le mode. Réessayez.');
    } finally {
      setModeUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Section 4 — White-label banner (top) */}
      <WhiteLabelBanner />

      {/* Section 1 — Billing mode selector */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#0D9488] to-teal-300" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 flex items-center justify-center shrink-0">
              <Layers size={14} className="text-[#0D9488]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Mode de facturation agence</h3>
            {(statusLoading || modeUpdating) && (
              <Loader2 size={13} className="animate-spin text-muted-foreground ml-auto" />
            )}
          </div>

          {statusLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard mode="centralized" selected={billingMode === 'centralized'} onSelect={handleModeChange} />
              <ModeCard mode="connected" selected={billingMode === 'connected'} disabled onSelect={handleModeChange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 — Sub-accounts table */}
      <SubAccountsTable accounts={subAccounts} isLoading={subLoading} />

      {/* Section 3 — Invoice preview */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-5">
          <InvoicePreview agencyName={agencyName} />
        </CardContent>
      </Card>

      {/* Section 4b — VAT / Tax ID for agency (B2B EU compliance) */}
      <VATNumberSection />

    </div>
  );
}
