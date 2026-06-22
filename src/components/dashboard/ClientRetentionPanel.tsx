/**
 * ClientRetentionPanel — "Relance Client SMS IA"
 * AI-powered SMS retention campaigns for Kompilot SaaS.
 */
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Switch, toast } from '@blinkdotnew/ui';
import {
  MessageSquare, Zap, Users, Settings, Shield,
  ChevronDown, Send, Sparkles,
} from 'lucide-react';
import { blink } from '@/blink/client';

// ── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  trigger: string;
  message: string;
  type: string;
  noShowBadge?: boolean;
  audience: number;
}

interface GeneratedSms {
  sms: string;
  variables: string[];
}

// ── Static data ──────────────────────────────────────────────────────────────

const CAMPAIGNS: Campaign[] = [
  {
    id: 'absent',
    name: 'Clients absents +30 jours',
    trigger: 'Absence > 30j',
    message: 'Vous nous manquez ! Revenez découvrir nos nouveautés 😊',
    type: 'client_absence_30_days',
    audience: 47,
  },
  {
    id: 'birthday',
    name: 'Anniversaire client',
    trigger: 'Date anniversaire',
    message: 'Joyeux anniversaire ! Un cadeau vous attend 🎁',
    type: 'client_birthday',
    audience: 23,
  },
  {
    id: 'abandoned',
    name: 'Panier abandonné',
    trigger: 'Réservation non finalisée',
    message: 'Votre réservation vous attend encore 📅',
    type: 'abandoned_booking',
    noShowBadge: true,
    audience: 31,
  },
];

const PROVIDERS = ['Twilio', 'Brevo', 'OVH SMS'];

// ── Sub-components ───────────────────────────────────────────────────────────

function VariableChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
      {label}
    </span>
  );
}

function CampaignCard({
  campaign,
  enabled,
  onToggle,
}: {
  campaign: Campaign;
  enabled: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedSms | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Generate a compelling SMS retention campaign in French for a local business. Campaign type: ${campaign.type}. Max 160 chars. Include a booking link placeholder [LIEN_RESERVATION]. Return sms text and list of personalization variables used.`,
        schema: {
          type: 'object',
          properties: {
            sms: { type: 'string', description: 'Generated SMS text' },
            variables: { type: 'array', items: { type: 'string' }, description: 'Personalization variables used' },
          },
          required: ['sms', 'variables'],
        },
      });
      setGenerated(object as GeneratedSms);
      toast.success('SMS personnalisé généré ✨');
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 401) { blink.auth.login(); return; }
      toast.error('Erreur de génération IA');
    } finally {
      setLoading(false);
    }
  }, [campaign.type]);

  const charCount = generated?.sms?.length ?? campaign.message.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Card header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
          <MessageSquare className="h-4 w-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{campaign.name}</span>
            {campaign.noShowBadge && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Shield className="h-2.5 w-2.5" /> No-Show Shield
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] text-slate-500">{campaign.trigger}</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 italic">"{campaign.message}"</p>
        </div>
        {/* Right column */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-teal-600"
          />
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="h-3 w-3" />
            <span className="font-semibold text-teal-700">{campaign.audience}</span>
          </div>
        </div>
      </div>

      {/* Personalise button */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => { setExpanded(v => !v); if (!expanded && !generated) generate(); }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all"
        >
          <Sparkles className="h-3 w-3" />
          Personnaliser avec IA
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Inline AI expansion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-4 py-3 space-y-3 bg-slate-50">
              {loading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="h-4 w-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
                  <span className="text-xs text-slate-500">Génération IA en cours…</span>
                </div>
              ) : generated ? (
                <>
                  {/* SMS preview */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Message SMS</span>
                      <span className={`text-[10px] font-mono ${charCount > 140 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {charCount}/160
                      </span>
                    </div>
                    <textarea
                      defaultValue={generated.sms}
                      maxLength={160}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {/* Variables */}
                  {generated.variables.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Variables détectées</span>
                      <div className="flex flex-wrap gap-1">
                        {generated.variables.map(v => (
                          <VariableChip key={v} label={v.startsWith('[') ? v : `[${v.toUpperCase()}]`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Launch */}
                  <button
                    onClick={() => { toast.success(`🚀 Campagne "${campaign.name}" lancée !`); setExpanded(false); }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all w-full justify-center"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Lancer la campagne ({campaign.audience} clients)
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function ClientRetentionPanel() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CAMPAIGNS.map(c => [c.id, true]))
  );
  const [apiOpen, setApiOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('');

  const totalAudience = useMemo(
    () => CAMPAIGNS.filter(c => toggles[c.id]).reduce((sum, c) => sum + c.audience, 0),
    [toggles]
  );

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">📱 Relance Client SMS</h2>
            <Badge className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full">Pro</Badge>
          </div>
          <p className="text-xs text-slate-500">Campagnes de fidélisation automatiques basées sur l\'activité client</p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="rounded-xl bg-teal-600 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {[
          { icon: <Users className="h-3.5 w-3.5" />, text: '847 clients actifs' },
          { icon: <Send className="h-3.5 w-3.5" />, text: '23 campagnes envoyées ce mois' },
          { icon: <Zap className="h-3.5 w-3.5" />, text: '12% taux de retour' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
            {icon}
            {text}
          </div>
        ))}
      </div>

      {/* ── Campaign cards ── */}
      <div className="space-y-3">
        {CAMPAIGNS.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
          >
            <CampaignCard
              campaign={campaign}
              enabled={toggles[campaign.id]}
              onToggle={() => setToggles(prev => ({ ...prev, [campaign.id]: !prev[campaign.id] }))}
            />
          </motion.div>
        ))}
      </div>

      {/* Active audience summary */}
      <p className="text-[11px] text-center text-slate-500">
        <span className="font-bold text-teal-700">{totalAudience}</span> clients dans les campagnes actives
      </p>

      {/* ── API Config (collapsible) ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setApiOpen(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-xs font-semibold text-slate-700">Configuration API SMS</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${apiOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {apiOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="px-4 py-4 space-y-4 bg-slate-50">
                <p className="text-xs text-slate-500">Connectez votre fournisseur SMS</p>
                {/* Provider chips */}
                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border border-teal-200 bg-teal-50 text-teal-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {/* Fields */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Clé API</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="sk_live_••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sender ID</label>
                    <input
                      type="text"
                      value={senderId}
                      onChange={e => setSenderId(e.target.value)}
                      placeholder="MonBusiness"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!apiKey.trim()) { toast.error('Clé API requise'); return; }
                    toast.success('✅ Fournisseur SMS connecté !');
                    setApiOpen(false);
                  }}
                  className="w-full rounded-lg px-4 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all"
                >
                  Connecter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
