/**
 * SMSFlashWidget — 4-phase SMS campaign tool.
 * Phase 0: Teaser   Phase 1: Composer   Phase 2: Sent confirm   Phase 3: Analytics
 */
import { useState, useMemo } from 'react';
import { Zap, MessageSquare, Users, Check, ArrowLeft, Send, BarChart2, Info } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';
import { SMSCampaignAnalytics, type SMSCampaign } from './SMSCampaignAnalytics';
import { useTrial } from '../../context/TrialContext';
import { SMSBalanceWidget } from './SMSBalanceWidget';
import { useSmsCredits } from '../../hooks/useSmsCredits';

/** Banner shown during trial to clarify that SMS are simulated (not sent to real numbers). */
function SMSTrialBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-3 py-2.5 mb-3">
      <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
          📱 Mode simulation — Essai gratuit
        </p>
        <p className="text-[10px] text-amber-600/80 dark:text-amber-500 mt-0.5 leading-relaxed">
          Pendant l'essai, les envois SMS/WhatsApp sont simulés à l'écran. Aucun message réel n'est envoyé.{' '}
          <button onClick={onUpgrade} className="font-bold underline hover:no-underline">
            Passer Pro
          </button>
          {' '}pour envoyer de vrais SMS.
        </p>
      </div>
    </div>
  );
}

type Phase = 0 | 1 | 2 | 3;
type Segment = 'vip' | 'inactive' | 'new';
type Discount = '-10%' | '-15%' | '-20%' | '-25%' | '-30%';
type Channel = 'sms' | 'whatsapp';

const SEGMENTS: { id: Segment; icon: string; label: string; sub: string; count: number }[] = [
  { id: 'vip',      icon: '👑', label: 'Clients VIP',      sub: 'tous les clients fidèles',    count: 247 },
  { id: 'inactive', icon: '🔄', label: 'Clients inactifs', sub: '+3 mois sans visite',         count: 89  },
  { id: 'new',      icon: '🌟', label: 'Nouveaux clients', sub: '1ère visite',                 count: 134 },
];

const DISCOUNTS: Discount[] = ['-10%', '-15%', '-20%', '-25%', '-30%'];

function buildSmsText(code: string, discount: string): string {
  return `[ÉTABLISSEMENT] 🔥 Offre Flash !\n${discount} sur toutes les prestations\naujourd'hui et demain uniquement.\nCode : ${code} → Réserver : [lien]`;
}

function buildWhatsAppText(code: string, discount: string, bookingUrl?: string): string {
  const link = bookingUrl || 'planity.com/votre-commerce';
  return `🔥 *Offre Flash Exclusive !*\n\n${discount} sur toutes nos prestations aujourd'hui et demain seulement !\n\n💸 Code promo : *${code}*\n📅 Réservez en un clic 👉 ${link}\n\n_Offre limitée — premier arrivé, premier servi !_ 😊`;
}

export function SMSFlashWidget() {
  const { isTrialActive, openPaywall } = useTrial();
  const { grantWelcomePack, consume } = useSmsCredits();
  const [phase,    setPhase]    = useState<Phase>(0);
  const [code,     setCode]     = useState('FLASH');
  const [discount, setDiscount] = useState<Discount>('-20%');
  const [segment,  setSegment]  = useState<Segment>('vip');
  const [sending,  setSending]  = useState(false);
  const [campaign, setCampaign] = useState<SMSCampaign | null>(null);
  const [channel,  setChannel]  = useState<Channel>('whatsapp');

  const smsText         = useMemo(() => channel === 'whatsapp' ? buildWhatsAppText(code || 'FLASH', discount) : buildSmsText(code || 'FLASH', discount), [code, discount, channel]);
  const charCount       = smsText.length;
  const selectedSegment = SEGMENTS.find(s => s.id === segment)!;

  // Grant welcome pack on first render (idempotent)
  useMemo(() => { grantWelcomePack(); }, [grantWelcomePack]);

  function handleSend() {
    // Consume 1 credit per send (non-blocking — simulation still proceeds if credits empty)
    consume(1).catch(() => {});
    setSending(true);
    setTimeout(() => {
      setSending(false);
      const newCampaign: SMSCampaign = {
        id:           `sms-${Date.now()}`,
        sentAt:       new Date(),
        code:         code || 'FLASH',
        discount,
        segmentLabel: selectedSegment.label,
        sent:         selectedSegment.count,
      };
      setCampaign(newCampaign);
      setPhase(2);
      toast.success(`Campagne ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Flash envoyée !`, {
        description: `${selectedSegment.count} contacts notifiés. Résultats disponibles dans 2h.`,
      });
    }, 1500);
  }

  function handleReset() {
    setPhase(0);
    setCode('FLASH');
    setDiscount('-20%');
    setSegment('vip');
    setCampaign(null);
  }

  // ── Phase 3 — Full analytics ─────────────────────────────────────────────
  if (phase === 3 && campaign) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <SMSCampaignAnalytics campaign={campaign} onNewCampaign={handleReset} />
      </div>
    );
  }

  // ── Phase 2 — Sent confirmation ──────────────────────────────────────────
  if (phase === 2 && campaign) return (
    <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-800/40 p-5 space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
          <Check className="w-7 h-7 text-white stroke-[2.5]" />
        </div>
        <h3 className="font-bold text-lg text-foreground">
          {isTrialActive ? '📱 Simulation envoyée ! 🎉' : 'Campagne envoyée ! 🎉'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isTrialActive ? (
            <>Simulation : <strong>{campaign.sent} contacts</strong> ({campaign.segmentLabel}) auraient reçu votre campagne. <button onClick={openPaywall} className="text-primary font-semibold underline">Passer Pro</button> pour envoyer de vrais messages.</>
          ) : (
            <><strong>{campaign.sent} contacts</strong> ({campaign.segmentLabel}) ont reçu votre campagne Flash. Les analytics arrivent en temps réel.</>
          )}
        </p>
      </div>

      {/* Live metrics preview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'SMS envoyés', value: campaign.sent.toLocaleString('fr-FR'), icon: '📨' },
          { label: 'Taux ouverture', value: '~96%',   icon: '👁️' },
          { label: 'ROI estimé',     value: '+900€',   icon: '💰' },
        ].map(m => (
          <div key={m.label} className="rounded-xl bg-white/60 dark:bg-white/5 border border-emerald-200/60 px-3 py-2.5 text-center">
            <p className="text-base">{m.icon}</p>
            <p className="text-sm font-extrabold text-foreground tabular-nums">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar — data incoming */}
      <div className="rounded-xl border border-emerald-200 bg-white/40 dark:bg-white/5 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Collecte des données en cours…
          </span>
          <span className="text-muted-foreground">Résultats complets sous 2h</span>
        </div>
        <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPhase(3)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white/50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold py-2.5 transition-colors"
        >
          <BarChart2 size={14} /> Voir les analytics
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-white text-sm font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
        >
          <Zap size={14} /> Nouvelle campagne
        </button>
      </div>
    </div>
  );

  // ── Phase 0 — Teaser ─────────────────────────────────────────────────────
  if (phase === 0) return (
    <div className="space-y-3">
      {/* SMS Balance counter — always visible */}
      <SMSBalanceWidget />

      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40 p-5 space-y-4">
      {isTrialActive && <SMSTrialBanner onUpgrade={openPaywall} />}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">Un trou dans votre agenda cette semaine ?</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Remplissez vos heures creuses avec une campagne Flash en 60 secondes.</p>
        </div>
      </div>
      {/* Channel selector in teaser */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setChannel('whatsapp'); setPhase(1); }}
          className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 py-3 px-2 hover:bg-emerald-100 transition-colors"
        >
          <span className="text-2xl">💬</span>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">WhatsApp</span>
          <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-500">Recommandé · 98% ouverture</span>
        </button>
        <button
          onClick={() => { setChannel('sms'); setPhase(1); }}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/30 py-3 px-2 hover:bg-muted/60 transition-colors"
        >
          <span className="text-2xl">📱</span>
          <span className="text-xs font-extrabold text-foreground">SMS</span>
          <span className="text-[10px] font-semibold text-muted-foreground">Classique · 160 car.</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['📨 Taux ouverture WhatsApp : 98%', '⚡ Envoi en 2 clics', '🎯 Ciblage client IA'].map(pill => (
          <span key={pill} className="text-xs px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-amber-200/80 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 font-medium">
            {pill}
          </span>
        ))}
      </div>
      </div>{/* end inner amber card */}
    </div>
  );

  // ── Phase 1 — Composer ───────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Channel indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {channel === 'whatsapp' ? (
            <span className="text-base">💬</span>
          ) : (
            <MessageSquare className="w-4 h-4 text-primary" />
          )}
          <span className="font-semibold text-sm text-foreground">
            Campagne {channel === 'whatsapp' ? 'WhatsApp Business' : 'SMS'} Flash
          </span>
          {channel === 'whatsapp' && (
            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5">98% ouverture</span>
          )}
        </div>
        <button
          onClick={() => setPhase(0)}
          className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
        >
          Changer de canal
        </button>
      </div>

      {/* Message preview */}
      <div className="rounded-xl overflow-hidden" style={{ background: channel === 'whatsapp' ? '#0b1d12' : '#1a1a2e' }}>
        <div className="px-3 py-2 border-b border-white/10 text-xs font-medium" style={{ color: channel === 'whatsapp' ? '#4ade80' : '#94a3b8' }}>
          {channel === 'whatsapp' ? '💬 Aperçu WhatsApp Business' : '📱 Aperçu SMS — 160 caractères'}
        </div>
        {channel === 'whatsapp' ? (
          <div className="px-3 py-3">
            <div className="inline-block max-w-[85%] bg-[#1a3326] rounded-2xl rounded-tl-none px-3 py-2">
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: '#e2f4ec' }}>
                {smsText}
              </pre>
            </div>
          </div>
        ) : (
          <pre className="px-3 py-3 text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#4ade80' }}>
            {`━━━━━━━━━━━━━━━━━━━━━━\n${smsText}\n━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
        )}
        <div className={cn('px-3 py-2 border-t border-white/10 text-xs font-medium', charCount > 160 && channel === 'sms' ? 'text-red-400' : 'text-slate-400')}>
          {channel === 'whatsapp' ? `✓ ${charCount} caractères · Emojis inclus ✨` : `✓ ${charCount} / 160 caractères · 1 SMS`}
        </div>
      </div>

      {/* Offer inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Code promo</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={12}
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Réduction</label>
          <select value={discount} onChange={e => setDiscount(e.target.value as Discount)}
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer">
            {DISCOUNTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Segment selector */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="w-3.5 h-3.5" /> Segment cible
        </div>
        <div className="space-y-1.5">
          {SEGMENTS.map(seg => (
            <label key={seg.id} className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
              segment === seg.id ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/40'
            )}>
              <input type="radio" name="segment" value={seg.id} checked={segment === seg.id} onChange={() => setSegment(seg.id)} className="sr-only" />
              <span className="text-base leading-none">{seg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{seg.label}</div>
                <div className="text-xs text-muted-foreground truncate">{seg.sub}</div>
              </div>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', segment === seg.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                {seg.count}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button onClick={handleSend} disabled={sending}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:opacity-70 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          {sending
            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <Send className="w-4 h-4" />
          }
          {sending ? 'Envoi en cours…' : `Envoyer la campagne Flash → ${selectedSegment.count} contacts`}
        </button>
        <button onClick={() => setPhase(0)} className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Annuler
        </button>
      </div>
    </div>
  );
}
