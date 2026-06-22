/**
 * ReferralCampaignConfig — collapsible campaign configuration panel
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, MessageSquare, Phone } from 'lucide-react';

interface Props {
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  sponsorDiscount: number;
  setSponsorDiscount: (v: number) => void;
  avgBasket: number;
  setAvgBasket: (v: number) => void;
  channel: 'whatsapp' | 'sms';
  setChannel: (v: 'whatsapp' | 'sms') => void;
  customTemplate: string;
  setCustomTemplate: (v: string) => void;
  sector: string;
  getSectorTemplate: (sector: string) => string;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function ReferralCampaignConfig({
  discountPercent, setDiscountPercent,
  sponsorDiscount, setSponsorDiscount,
  avgBasket, setAvgBasket,
  channel, setChannel,
  customTemplate, setCustomTemplate,
  sector, getSectorTemplate,
  onSave, isSaving,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">⚙️ Configuration de la campagne</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Remise filleul (%)</label>
              <input type="number" min="5" max="50" step="5" value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Offert au client recommandé sur sa 1ère visite</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Avantage parrain (%)</label>
              <input type="number" min="5" max="50" step="5" value={sponsorDiscount}
                onChange={e => setSponsorDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Reçu par le parrain quand son filleul convertit</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Panier moyen (€)</label>
              <input type="number" min="10" step="5" value={avgBasket}
                onChange={e => setAvgBasket(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Sert à calculer le CA additionnel estimé</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Canal d'envoi</label>
              <div className="flex gap-2">
                {(['whatsapp', 'sms'] as const).map(ch => (
                  <button key={ch} onClick={() => setChannel(ch)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      channel === ch ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {ch === 'whatsapp' ? <MessageSquare size={13} /> : <Phone size={13} />}
                    {ch === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Template message (variables: {'{client.name}'}, {'{link}'}, {'{discount}'}, {'{sponsorDiscount}'})
            </label>
            <textarea rows={4}
              value={customTemplate || getSectorTemplate(sector)}
              onChange={e => setCustomTemplate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button onClick={onSave} disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check size={14} />}
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}
