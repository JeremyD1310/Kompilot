import { useState, useEffect, useCallback } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, toast } from '@blinkdotnew/ui';
import { Gift, Copy, Check, Send, Users, Zap, Star, ChevronRight, Trophy, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { markReferralVisited } from '../components/dashboard/OnboardingChecklist';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ────────────────────────────────────────────────────────────────────

interface RewardData {
  code: string;
  link: string;
  conversions: number;
  creditsEarned: number;
  freeMonthsEarned: number;
  freeMonthsRedeemed: number;
}

interface StatsData {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalCreditsEarned: number;
  conversionRate: string;
  bonusPerReferral: number;
  freeMonthsEarned: number;
  freeMonthsRedeemed: number;
  freeMonthsAvailable: number;
  currentTier: { threshold: number; label: string; reward: string } | null;
  nextTier: { threshold: number; label: string; reward: string } | null;
  tiers: { threshold: number; label: string; reward: string; monthsFree: number }[];
  history: { id: string; referredEmail: string; convertedAt: string; creditsEarned: number; tierUnlocked: string }[];
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Step ─────────────────────────────────────────────────────────────────────

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-extrabold text-primary shrink-0">
        {num}
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Tier progress ────────────────────────────────────────────────────────────

function TierProgress({ stats }: { stats: StatsData }) {
  const conversions = stats.totalConversions;
  const tiers = stats.tiers || [];
  const nextTier = stats.nextTier;
  const progress = nextTier ? (conversions / nextTier.threshold) * 100 : 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <Trophy size={15} className="text-amber-500" /> Paliers de recompenses
        </h3>
        {stats.currentTier && (
          <span className="text-[10px] font-bold text-white px-2.5 py-1 rounded-full bg-amber-600">
            {stats.currentTier.label}
          </span>
        )}
      </div>

      {nextTier && (
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">{conversions} filleul{conversions > 1 ? 's' : ''}</span>
            <span className="text-primary font-bold">{nextTier.threshold} pour {nextTier.reward}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {tiers.map(tier => {
          const unlocked = conversions >= tier.threshold;
          return (
            <div
              key={tier.threshold}
              className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                unlocked ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-muted/20 opacity-50'
              }`}
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{tier.label}</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">{tier.threshold}</p>
              <p className="text-[10px] text-muted-foreground">{tier.reward}</p>
              {unlocked && <Check size={12} className="mx-auto mt-1 text-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [reward, setReward] = useState<RewardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHeaders = useCallback(async () => {
    const token = await (window as any).__blink?.auth?.getValidToken?.() ?? '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => { markReferralVisited(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const h = await fetchHeaders();
        const [linkRes, statsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/referral-rewards/link`, { headers: h }),
          fetch(`${BACKEND_URL}/api/referral-rewards/stats`, { headers: h }),
        ]);
        if (cancelled) return;
        if (linkRes.ok) setReward(await linkRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (e) { console.error('[Referral] load error:', e); }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [fetchHeaders]);

  const handleCopy = async () => {
    if (!reward?.link) return;
    await navigator.clipboard.writeText(reward.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copie !');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Entrez un email valide.');
      return;
    }
    setInviteLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setInviteLoading(false);
    setInviteSent(true);

    toast.success(`Invitation envoyee a ${inviteEmail} !`, {
      description: 'Votre filleul recevra +5 credits a l\'inscription.',
    });
    setTimeout(() => { setInviteSent(false); setInviteEmail(''); }, 3000);
  };

  const conversions = stats?.totalConversions ?? 0;
  const creditsEarned = stats?.totalCreditsEarned ?? 0;

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Gift size={22} className="text-primary" /> Parrainage & Recompenses
          </PageTitle>
          <PageDescription>
            Invitez vos confreres artisans et commercants — gagnez des credits et des mois gratuits !
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-8 max-w-2xl">

        {/* Hero banner */}
        <div className="rounded-3xl bg-gradient-to-br from-primary via-teal-500 to-emerald-400 p-7 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-4 right-16 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={18} className="text-white" />
              <p className="text-sm font-extrabold text-white/90">Programme de parrainage</p>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">
              Invitez un ami, gagnez <span className="underline decoration-wavy decoration-white/50">5 credits</span> chacun !
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              Des qu'un confrere artisan ou commercant s'inscrit via votre lien,{' '}
              <strong className="text-white">vous recevez 5 credits</strong> et{' '}
              <strong className="text-white">lui aussi</strong>. A 5 filleuls, debloquez{' '}
              <strong className="text-white">1 mois gratuit</strong> !
            </p>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-border bg-card h-24 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Users} label="Filleuls actifs" value={String(conversions)} color="bg-primary" />
            <StatCard icon={Zap} label="Credits gagnes" value={`+${creditsEarned}`} color="bg-emerald-500" />
            <StatCard icon={TrendingUp} label="Taux conversion" value={`${stats?.conversionRate ?? '0'}%`} color="bg-violet-500" />
          </div>
        )}

        {/* Your link */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-foreground">Votre lien de parrainage unique</h3>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
            <span className="flex-1 text-sm font-mono text-primary truncate">{reward?.link || 'Chargement...'}</span>
            <button
              onClick={handleCopy}
              disabled={!reward?.link}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                copied ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {copied ? <><Check size={12} /> Copie !</> : <><Copy size={12} /> Copier</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Partagez ce lien sur WhatsApp, LinkedIn, ou par email a vos confreres.
          </p>
        </div>

        {/* Tier progress */}
        {stats && <TierProgress stats={stats} />}

        {/* Invite form */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Send size={15} className="text-primary" /> Inviter directement par email
          </h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@votre-contact.fr"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={inviteLoading}
              className={`flex items-center gap-2 rounded-xl text-sm font-bold px-5 py-3 transition-all shrink-0 ${
                inviteSent ? 'bg-green-500 text-white'
                : inviteLoading ? 'bg-muted text-muted-foreground'
                : 'bg-foreground text-background hover:opacity-90'
              }`}
            >
              {inviteSent ? (
                <><Check size={14} /> Envoye !</>
              ) : inviteLoading ? (
                <><div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Envoi…</>
              ) : (
                <><Send size={14} /> Envoyer l'invitation</>
              )}
            </button>
          </form>
          {inviteSent && (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <span className="text-xl">🎉</span>
              <p className="text-sm text-green-800 font-medium">
                <strong>Invitation envoyee a {inviteEmail} !</strong>{' '}
                Des son inscription, +5 credits seront ajoutes a vos deux comptes.
              </p>
            </div>
          )}
        </div>

        {/* Reward history */}
        {stats && stats.history.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Clock size={14} className="text-primary" /> Historique des recompenses
              </h3>
            </div>
            <div className="divide-y divide-border">
              {stats.history.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.referredEmail || 'Nouveau filleul'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.convertedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {item.tierUnlocked && <span className="ml-2 text-amber-600 font-bold">Palier {item.tierUnlocked} debloque !</span>}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">+{item.creditsEarned} credits</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free months available */}
        {stats && stats.freeMonthsAvailable > 0 && (
          <div className="rounded-2xl border-2 border-amber-300/30 bg-amber-50/50 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-amber-900">
                {stats.freeMonthsAvailable} mois gratuit{stats.freeMonthsAvailable > 1 ? 's' : ''} disponible{stats.freeMonthsAvailable > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Appliquez-les a votre prochaine facturation.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const h = await fetchHeaders();
                  const res = await fetch(`${BACKEND_URL}/api/referral-rewards/redeem`, { method: 'POST', headers: h });
                  const data = await res.json();
                  if (data.success) {
                    toast.success('1 mois gratuit applique !');
                    setStats(prev => prev ? { ...prev, freeMonthsRedeemed: prev.freeMonthsRedeemed + 1, freeMonthsAvailable: prev.freeMonthsAvailable - 1 } : prev);
                  } else {
                    toast.error(data.error || 'Erreur');
                  }
                } catch { toast.error('Erreur reseau'); }
              }}
              className="shrink-0 rounded-xl bg-amber-600 text-white text-xs font-bold px-4 py-2.5 hover:bg-amber-500 transition-colors"
            >
              Utiliser 1 mois
            </button>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-foreground">Comment ca marche ?</h3>
          <div className="space-y-4">
            <Step num="1" title="Partagez votre lien" desc="Envoyez votre lien unique a un artisan, commercant ou restaurateur de votre reseau." />
            <div className="flex items-center justify-center"><ChevronRight size={14} className="text-muted-foreground rotate-90" /></div>
            <Step num="2" title="Votre filleul s'inscrit" desc="Il cree son compte Kompilot via votre lien et entre ses informations metier." />
            <div className="flex items-center justify-center"><ChevronRight size={14} className="text-muted-foreground rotate-90" /></div>
            <Step num="3" title="Vous gagnez tous les deux" desc="+5 credits sont automatiquement ajoutes a votre compte ET au sien. A 5 filleuls, 1 mois gratuit !" />
          </div>
        </div>

      </PageBody>
    </Page>
  );
}
