/**
 * AgencyAffiliateDashboard — Tableau de bord d'affiliation pour agences.
 * Affiche : code de parrainage, lien, KPIs, historique des conversions,
 * commissions calculées (20% du montant du plan), MRR estimé.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Copy, Check, TrendingUp, Users, MousePointerClick,
  Link2, DollarSign, Loader2, Share2, Clock, BarChart3, Wallet,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface AffiliateStats {
  registered: boolean;
  affiliate?: {
    id: string;
    code: string;
    commissionPercent: number;
    totalReferrals: number;
    totalConversions: number;
    totalCommissionEuros: number;
    totalClicks: number;
    convertedClicks: number;
    referralLink: string;
  };
}

interface AffiliateHistory {
  registered: boolean;
  history: Array<{
    id: string;
    convertedAt: string;
    estimatedCommissionEuros: number;
  }>;
  summary?: {
    totalConversions: number;
    totalCommissionEuros: number;
    avgCommissionEuros: number;
    estimatedMRR: number;
  };
}

export function AgencyAffiliateDashboard() {
  const { user } = useAuth();
  const [stats, setStats]         = useState<AffiliateStats | null>(null);
  const [history, setHistory]      = useState<AffiliateHistory | null>(null);
  const [loading, setLoading]      = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied]        = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, histRes] = await Promise.all([
        blink.functions.invoke<AffiliateStats>('api/affiliates/stats', { method: 'GET' }),
        blink.functions.invoke<AffiliateHistory>('api/affiliates/history', { method: 'GET' }),
      ]);
      const statsData = (statsRes as any)?.data ?? statsRes;
      const histData  = (histRes as any)?.data ?? histRes;
      setStats(statsData as AffiliateStats);
      setHistory(histData as AffiliateHistory);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await blink.functions.invoke<AffiliateStats>('api/affiliates/register', { method: 'POST' });
      const data = (res as any)?.data ?? res;
      setStats(data as AffiliateStats);
      toast.success("Programme d'affiliation activé !");
    } catch { toast.error("Erreur lors de l'activation"); }
    finally { setRegistering(false); }
  };

  const copyLink = () => {
    if (!stats?.affiliate?.referralLink) return;
    navigator.clipboard.writeText(stats.affiliate.referralLink);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ── Not registered yet ──────────────────────────────────────────────────────
  if (!stats?.registered) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/60 to-violet-50/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Gift size={16} className="text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">🎁 Programme d'Affiliation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gagnez 20% de commission sur chaque client parrainé via votre lien unique
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 flex items-center justify-center">
            <Share2 size={24} className="text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Activez votre lien de parrainage</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Recevez votre code unique, partagez-le, et gagnez <strong>20%</strong> de commission
              sur chaque client qui souscrit.
            </p>
          </div>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold text-sm
                       px-6 py-2.5 rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all
                       disabled:opacity-50 shadow-sm"
          >
            {registering ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
            {registering ? 'Activation...' : "Activer mon programme d'affiliation"}
          </button>
        </div>
      </div>
    );
  }

  // ── Registered — show dashboard ─────────────────────────────────────────────
  const a  = stats.affiliate!;
  const h  = history?.summary;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/60 to-violet-50/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Gift size={16} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">🎁 Programme d'Affiliation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {a.commissionPercent}% de commission · {a.totalConversions} conversions
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Referral link ──────────────────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Votre lien de parrainage
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
              <Link2 size={13} className="text-primary shrink-0" />
              <span className="text-xs text-foreground truncate">{a.referralLink}</span>
            </div>
            <button
              onClick={copyLink}
              className={`shrink-0 p-2 rounded-xl transition-colors ${
                copied ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* ── KPI Grid ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              label: 'Clics', value: a.totalClicks,
              icon: <MousePointerClick size={14} className="text-blue-500" />,
              bg: 'bg-blue-50', border: 'border-blue-200',
            },
            {
              label: 'Conversions', value: a.totalConversions,
              icon: <Users size={14} className="text-emerald-500" />,
              bg: 'bg-emerald-50', border: 'border-emerald-200',
            },
            {
              label: 'Commissions', value: `${Math.round(a.totalCommissionEuros)}€`,
              icon: <DollarSign size={14} className="text-amber-500" />,
              bg: 'bg-amber-50', border: 'border-amber-200',
            },
            {
              label: 'Taux conv.',
              value: a.totalClicks > 0
                ? `${Math.round((a.convertedClicks / a.totalClicks) * 100)}%`
                : '—',
              icon: <TrendingUp size={14} className="text-violet-500" />,
              bg: 'bg-violet-50', border: 'border-violet-200',
            },
          ].map(({ label, value, icon, bg, border }) => (
            <div key={label} className={`rounded-xl ${bg} ${border} border p-3 text-center`}>
              <div className="mx-auto mb-1">{icon}</div>
              <p className="text-lg font-extrabold text-foreground">{value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── MRR & Commission Summary (second row) ──────────────────────── */}
        {h && h.totalConversions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              {
                label: 'Commission totale',
                value: `${Math.round(h.totalCommissionEuros)}€`,
                icon: <Wallet size={14} className="text-emerald-500" />,
                bg: 'bg-emerald-50/60', border: 'border-emerald-200/60',
              },
              {
                label: 'Comm. moyenne',
                value: `${Math.round(h.avgCommissionEuros)}€`,
                icon: <BarChart3 size={14} className="text-sky-500" />,
                bg: 'bg-sky-50', border: 'border-sky-200',
              },
              {
                label: 'MRR estimé',
                value: `${h.estimatedMRR}€/mois`,
                icon: <TrendingUp size={14} className="text-teal-500" />,
                bg: 'bg-teal-50', border: 'border-teal-200',
              },
              {
                label: 'Plan moyen',
                value: `${h.totalConversions > 0 ? Math.round(h.avgCommissionEuros / (a.commissionPercent / 100)) : 69}€`,
                icon: <DollarSign size={14} className="text-amber-500" />,
                bg: 'bg-amber-50/60', border: 'border-amber-200/60',
              },
            ].map(({ label, value, icon, bg, border }) => (
              <div key={label} className={`rounded-xl ${bg} ${border} border p-3 text-center`}>
                <div className="mx-auto mb-1">{icon}</div>
                <p className="text-lg font-extrabold text-foreground">{value}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Conversion history ─────────────────────────────────────────── */}
        {history?.history && history.history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Historique des conversions
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {history.history.length}
              </span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border max-h-[160px] overflow-y-auto">
                {history.history.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(entry.convertedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </span>
                      <span className="text-[11px] font-medium text-foreground">
                        Conversion #{history.history.length - i}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">
                      +{Math.round(entry.estimatedCommissionEuros)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Commission details ─────────────────────────────────────────── */}
        <div className="rounded-xl bg-muted/30 border border-border p-3 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Comment ça marche :</p>
          <ol className="list-decimal list-inside space-y-1 text-[10px]">
            <li>Partagez votre lien unique avec vos prospects</li>
            <li>
              Quand ils cliquent et souscrivent à un plan payant, la conversion est trackée automatiquement
            </li>
            <li>
              Vous gagnez <strong className="text-foreground">{a.commissionPercent}%</strong>{' '}
              du montant de leur abonnement en commission
            </li>
            <li>
              Les commissions sont cumulées et versées mensuellement
              {h && h.totalCommissionEuros > 0 &&
                ` (solde actuel : ${Math.round(h.totalCommissionEuros)}€)`}
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
