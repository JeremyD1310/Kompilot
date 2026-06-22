/**
 * LoyaltyReferralPanel — orchestrateur du module Fidélisation & Parrainage
 * Compose: header KPI dark + config + créateur de lien + liste liens
 */
import { useState } from 'react';
import { Gift, Send, Share2, Users, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useReferral } from '../../hooks/useReferral';
import { useEstablishment } from '../../context/EstablishmentContext';
import { ReferralCampaignConfig } from './ReferralCampaignConfig';
import { ReferralLinkCreator } from './ReferralLinkCreator';
import { ReferralLinkList } from './ReferralLinkList';

// ── Sector display map ─────────────────────────────────────────────────────────

const SECTOR_MAP: Record<string, { label: string; emoji: string }> = {
  restauration: { label: 'Restauration', emoji: '🍽️' },
  coiffure:     { label: 'Coiffure',     emoji: '✂️' },
  beaute:       { label: 'Beauté',       emoji: '💅' },
  sante:        { label: 'Santé',        emoji: '🏥' },
  commerce:     { label: 'Commerce',     emoji: '🛍️' },
  general:      { label: 'Autre',        emoji: '🏪' },
};

function StatPill({ icon: Icon, label, value, cls }: {
  icon: React.ElementType; label: string; value: string | number; cls: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${cls}`}>
      <Icon size={15} className="shrink-0" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-base font-extrabold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LoyaltyReferralPanel() {
  const { activeEstablishment } = useEstablishment();
  const {
    campaign, links, stats, isLoading,
    saveCampaign, isSaving,
    createLink, markThankYouSent,
    getReferralUrl, getSectorTemplate,
    SECTOR_TEMPLATES,
  } = useReferral();

  const sector = activeEstablishment?.category?.toLowerCase() || 'general';
  const sectorKey = Object.keys(SECTOR_TEMPLATES).find(k => sector.includes(k)) || 'general';
  const sectorCfg = SECTOR_MAP[sectorKey] || SECTOR_MAP.general;
  const isActive = campaign?.isActive ?? false;

  // Config state (initialised from campaign, editable locally)
  const [discountPercent, setDiscountPercent] = useState(campaign?.discountPercent ?? 10);
  const [sponsorDiscount, setSponsorDiscount] = useState(campaign?.sponsorDiscountPercent ?? 10);
  const [avgBasket, setAvgBasket] = useState(campaign?.avgBasketAmount ?? 50);
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>(campaign?.channel ?? 'whatsapp');
  const [customTemplate, setCustomTemplate] = useState(campaign?.messageTemplate ?? '');

  const handleToggle = async () => {
    try {
      await saveCampaign({
        isActive: !isActive,
        discountPercent, sponsorDiscountPercent: sponsorDiscount,
        avgBasketAmount: avgBasket,
        messageTemplate: customTemplate || getSectorTemplate(sector),
        channel,
      });
      toast.success(isActive ? 'Boucle désactivée' : 'Boucle de parrainage activée ! 🚀');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  };

  const handleSaveConfig = async () => {
    await saveCampaign({
      isActive: isActive ? 1 : 0,
      discountPercent, sponsorDiscountPercent: sponsorDiscount,
      avgBasketAmount: avgBasket,
      messageTemplate: customTemplate || getSectorTemplate(sector),
      channel,
    });
    toast.success('Configuration sauvegardée');
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3 animate-pulse">
        {[56, 40, 40, 40].map((h, i) => (
          <div key={i} style={{ height: h }} className="rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 text-white shadow-lg shadow-emerald-900/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Gift size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Fidélisation & Parrainage</h3>
                <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
                  {sectorCfg.emoji} {sectorCfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Transformez vos meilleurs avis en moteur de croissance automatique
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle} disabled={isSaving}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              isActive
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-slate-900 dark:text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {isActive ? 'Actif' : 'Inactif'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <StatPill icon={Send}       label="Remerciements"   value={stats.thankYousSent}                        cls="border-emerald-500/20 text-emerald-300" />
          <StatPill icon={Share2}     label="Liens partagés"  value={stats.linksShared}                          cls="border-blue-500/20 text-blue-300" />
          <StatPill icon={Users}      label="Nouveaux clients" value={stats.newClientsGenerated}                  cls="border-violet-500/20 text-violet-300" />
          <StatPill icon={TrendingUp} label="CA additionnel"  value={`${stats.additionalRevenue.toFixed(0)}€`}   cls="border-amber-500/20 text-amber-300" />
        </div>
      </div>

      {/* ── Config ──────────────────────────────────────────────── */}
      <ReferralCampaignConfig
        discountPercent={discountPercent}       setDiscountPercent={setDiscountPercent}
        sponsorDiscount={sponsorDiscount}       setSponsorDiscount={setSponsorDiscount}
        avgBasket={avgBasket}                   setAvgBasket={setAvgBasket}
        channel={channel}                       setChannel={setChannel}
        customTemplate={customTemplate}         setCustomTemplate={setCustomTemplate}
        sector={sector}
        getSectorTemplate={getSectorTemplate}
        onSave={handleSaveConfig}
        isSaving={isSaving}
      />

      {/* ── Créateur de lien ─────────────────────────────────────── */}
      <ReferralLinkCreator
        campaign={campaign}
        discountPercent={discountPercent}
        sponsorDiscountPercent={sponsorDiscount}
        sector={sector}
        sectorLabel={sectorCfg.label}
        getSectorTemplate={getSectorTemplate}
        getReferralUrl={getReferralUrl}
        createLink={createLink}
        markThankYouSent={markThankYouSent}
        saveCampaign={saveCampaign}
        isSaving={isSaving}
      />

      {/* ── Liste des liens ──────────────────────────────────────── */}
      <ReferralLinkList links={links} getReferralUrl={getReferralUrl} />
    </div>
  );
}
