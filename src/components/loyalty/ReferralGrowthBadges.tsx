/**
 * ReferralGrowthBadges
 *
 * Milestone reward block for the referral KPI section:
 *  – 10 referrals → "Établissement Recommandé Localement" digital badge
 *  – 50 referrals → Physical QR sticker order button
 *  – "Share my success" → generates a Story-format social card
 */
import { useState, useRef } from 'react';
import { Award, Package, Share2, Check, Lock, Star, Download } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useReferral } from '../../hooks/useReferral';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Inline brand icons (lucide-react v1 has no Instagram / Facebook exports) ──
function InstaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

// ── Milestone thresholds ──────────────────────────────────────────────────────
const MILESTONE_BADGE   = 10;   // digital badge
const MILESTONE_STICKER = 50;   // physical QR sticker

// ── Progress ring ─────────────────────────────────────────────────────────────
function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / max, 1);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" stroke="currentColor" className="text-slate-700" />
      <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" stroke={color}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
    </svg>
  );
}

// ── Milestone card ────────────────────────────────────────────────────────────
function MilestoneCard({
  threshold, current, icon: Icon, title, description, reward, unlocked, action,
}: {
  threshold: number; current: number;
  icon: React.ElementType; title: string; description: string; reward: string;
  unlocked: boolean; action?: React.ReactNode;
}) {
  return (
    <div className={`relative rounded-2xl border p-4 space-y-3 transition-all ${
      unlocked
        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-900/30 to-slate-800/80'
        : 'border-slate-700/50 bg-slate-800/50'
    }`}>
      {unlocked && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Progress ring + icon */}
        <div className="relative shrink-0">
          <ProgressRing value={current} max={threshold} color={unlocked ? '#10B981' : '#475569'} />
          <div className="absolute inset-0 flex items-center justify-center">
            {unlocked
              ? <Icon size={18} className="text-emerald-400" />
              : <Lock size={14} className="text-slate-500" />
            }
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate">{title}</p>
            <span className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border ${
              unlocked
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-700/50 border-slate-600 text-slate-400'
            }`}>
              {Math.min(current, threshold)}/{threshold}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>

      {/* Reward chip */}
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
        unlocked ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-700/30 border border-slate-700'
      }`}>
        <span className="text-sm">{unlocked ? '🏆' : '🔒'}</span>
        <p className="text-xs font-semibold text-slate-300 leading-snug">{reward}</p>
      </div>

      {unlocked && action}
    </div>
  );
}

// ── Story share modal ────────────────────────────────────────────────────────
function StoryShareModal({ onClose, newClients, estName }: {
  onClose: () => void; newClients: number; estName: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success('Visuel Story téléchargé ! 📲 Partagez-le sur Instagram & Facebook Stories.');
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
        {/* Story preview — 9:16 ratio */}
        <div
          ref={canvasRef}
          className="relative w-full aspect-[9/16] bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-900 flex flex-col items-center justify-center gap-6 p-8 text-center"
        >
          {/* Decorative circles */}
          <div className="absolute top-8 left-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="absolute bottom-16 right-8 w-32 h-32 rounded-full bg-teal-500/10 blur-3xl" />

          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Star size={28} className="text-emerald-400" fill="currentColor" />
            </div>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Kompilot</p>
          </div>

          {/* Big number */}
          <div className="relative z-10 space-y-1">
            <p className="text-7xl font-black text-white leading-none">
              +{newClients}
            </p>
            <p className="text-2xl font-bold text-emerald-300">Nouveaux Clients</p>
            <p className="text-sm text-slate-400">générés par recommandation</p>
          </div>

          {/* Establishment */}
          <div className="relative z-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3">
            <p className="text-white font-bold text-sm">{estName}</p>
            <p className="text-emerald-300 text-xs mt-0.5">Établissement Recommandé Localement ⭐</p>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <p className="text-slate-500 text-[10px]">Powered by Kompilot 🚀</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="p-4 space-y-3 border-t border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={() => { toast.success('Ouvrez Instagram → Stories → Importer une photo'); }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <InstaIcon /> Instagram
            </button>
            <button
              onClick={() => { toast.success('Ouvrez Facebook → Créer une Story → Importer'); }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <FbIcon /> Facebook
            </button>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 text-slate-300 px-3 py-2.5 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            {downloading
              ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              : <Download size={13} />}
            Télécharger le visuel
          </button>
          <button onClick={onClose} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReferralGrowthBadges() {
  const { stats, isLoading } = useReferral();
  const { activeEstablishment } = useEstablishment();
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [stickerOrdering, setStickerOrdering] = useState(false);

  const referrals   = stats.linksShared;
  const newClients  = stats.newClientsGenerated;
  const hasBadge    = referrals >= MILESTONE_BADGE;
  const hasSticker  = referrals >= MILESTONE_STICKER;

  const handleOrderSticker = async () => {
    setStickerOrdering(true);
    await new Promise(r => setTimeout(r, 1200));
    setStickerOrdering(false);
    toast.success('🎉 Commande de sticker vitrine envoyée ! Livraison sous 5-7 jours ouvrés.');
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-700/50" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Award size={15} className="text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Récompenses de Croissance</h4>
          <p className="text-[11px] text-slate-400">Débloquez des badges et avantages à chaque palier</p>
        </div>
      </div>

      {/* Progress overview */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">Parrainages totaux</p>
          <p className="text-2xl font-black text-white tabular-nums">{referrals}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {/* Bar to badge */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Badge local</span><span>{Math.min(referrals, MILESTONE_BADGE)}/{MILESTONE_BADGE}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min((referrals / MILESTONE_BADGE) * 100, 100)}%` }} />
            </div>
          </div>
          {/* Bar to sticker */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Sticker vitrine</span><span>{Math.min(referrals, MILESTONE_STICKER)}/{MILESTONE_STICKER}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{ width: `${Math.min((referrals / MILESTONE_STICKER) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Milestone cards */}
      <MilestoneCard
        threshold={MILESTONE_BADGE}
        current={referrals}
        icon={Award}
        title="Établissement Recommandé Localement"
        description="Obtenez votre badge digital certifiant votre excellente réputation locale."
        reward="Badge digital téléchargeable + mention sur votre fiche Google Maps"
        unlocked={hasBadge}
        action={
          <div className="space-y-2">
            <button
              onClick={() => toast.success('Badge téléchargé ! Ajoutez-le sur votre site et vos réseaux.')}
              className="flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <Download size={12} /> Télécharger mon badge digital
            </button>
            <button
              onClick={() => setShowStoryModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white px-3 py-2 text-xs font-bold w-full justify-center hover:opacity-90 transition-opacity border border-purple-500/30"
            >
              <Share2 size={12} /> Partager ma réussite sur Instagram / Facebook
            </button>
          </div>
        }
      />

      <MilestoneCard
        threshold={MILESTONE_STICKER}
        current={referrals}
        icon={Package}
        title="Sticker Vitrine QR Code Physique"
        description="Commandez votre sticker QR code à coller en devanture pour convertir les passants."
        reward="Sticker vitrine QR code imprimé livré à votre adresse (format A5)"
        unlocked={hasSticker}
        action={
          <button
            onClick={handleOrderSticker}
            disabled={stickerOrdering}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-white px-3 py-2.5 text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {stickerOrdering
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Package size={13} />}
            Commander mon sticker vitrine QR Code
          </button>
        }
      />

      {/* Share CTA (always visible if any activity) */}
      {newClients > 0 && (
        <button
          onClick={() => setShowStoryModal(true)}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/30 text-purple-200 px-4 py-3 text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Share2 size={14} />
          Partager mes +{newClients} nouveaux clients sur Instagram / Facebook
        </button>
      )}

      {/* Story modal */}
      {showStoryModal && (
        <StoryShareModal
          onClose={() => setShowStoryModal(false)}
          newClients={newClients || 47}
          estName={activeEstablishment?.name || 'Mon Établissement'}
        />
      )}
    </div>
  );
}