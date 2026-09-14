import { useState, useEffect, useCallback } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, toast, Badge } from '@blinkdotnew/ui';
import { Users, Euro, Link, Copy, Check, Share2, TrendingUp, ArrowRight, UserPlus, Percent, Clock, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../context/DemoModeContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';

// ── Demo seed data ────────────────────────────────────────────────────────────

const DEMO_AFFILIATE_STATS: AffiliateStats = {
  affiliate: {
    id: 'demo-aff-1',
    referralCode: 'KOMDEMO123',
    commissionPercent: 20,
    totalReferrals: 14,
    totalConversions: 5,
    totalCommissionCents: 34500,
    isActive: 1,
  },
  totalCommissionEuros: 345.0,
  clicks: 142,
  referralLink: 'https://www.kompilot.fr/ref/KOMDEMO123',
};

const DEMO_HISTORY: HistoryData = {
  history: [
    { id: 'dc1', referralCode: 'KOMDEMO123', clickCount: 8, converted: 1, createdAt: '2026-07-25T09:15:00Z' },
    { id: 'dc2', referralCode: 'KOMDEMO123', clickCount: 22, converted: 1, createdAt: '2026-07-22T14:30:00Z' },
    { id: 'dc3', referralCode: 'KOMDEMO123', clickCount: 5, converted: 1, createdAt: '2026-07-18T11:00:00Z' },
    { id: 'dc4', referralCode: 'KOMDEMO123', clickCount: 12, converted: 1, createdAt: '2026-07-10T16:45:00Z' },
    { id: 'dc5', referralCode: 'KOMDEMO123', clickCount: 3, converted: 1, createdAt: '2026-07-03T08:20:00Z' },
  ],
  totalConversions: 5,
  totalCommissionEuros: 345.0,
  avgCommissionEuros: 69.0,
  estimatedMRR: 345.0,
};

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateStats {
  affiliate: { id: string; referralCode: string; commissionPercent: number; totalReferrals: number; totalConversions: number; totalCommissionCents: number; isActive: number } | null;
  totalCommissionEuros: number;
  clicks: number;
  referralLink: string;
}

interface ConversionEvent {
  id: string;
  referralCode: string;
  clickCount: number;
  converted: number;
  createdAt: string;
}

interface HistoryData {
  history: ConversionEvent[];
  totalConversions: number;
  totalCommissionEuros: number;
  avgCommissionEuros: number;
  estimatedMRR: number;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, suffix, color }: {
  icon: React.ElementType; label: string; value: string; suffix?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground">{value}{suffix && <span className="text-sm font-semibold text-muted-foreground ml-0.5">{suffix}</span>}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-muted animate-pulse shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-6 w-20 rounded bg-muted animate-pulse" />
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { icon: Link, title: 'Partagez votre lien', desc: 'Diffusez votre lien affilié sur vos réseaux, newsletters et recommandations clients.' },
    { icon: UserPlus, title: 'Un commerçant s\'inscrit', desc: 'Le commerçant clique sur votre lien et souscrit à un abonnement Kompilot.' },
    { icon: Euro, title: 'Gagnez 20% de commission', desc: 'Vous touchez 20% du montant HT de chaque abonnement généré, chaque mois.' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
        <Gift size={15} className="text-primary" /> Comment ca marche ?
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <step.icon size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={16} className="text-muted-foreground/30 hidden md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHeaders = useCallback(async () => {
    const token = await (window as any).__blink?.auth?.getValidToken?.() ?? '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo mode: use seed data without API calls
    if (isDemoActive) {
      setStats(DEMO_AFFILIATE_STATS);
      setHistory(DEMO_HISTORY);
      setLoading(false);
      return;
    }
    try {
      const h = await fetchHeaders();
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/affiliates/stats`, { headers: h }),
        fetch(`${BACKEND_URL}/api/affiliates/history`, { headers: h }),
      ]);

      if (statsRes.status === 404) {
        // Not yet an affiliate — show registration CTA
        setStats(null);
        setHistory(null);
        setLoading(false);
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      else if (statsRes.status !== 404) throw new Error(`Erreur stats: ${statsRes.status}`);

      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (e: any) {
      console.error('[Affiliate] load error:', e);
      setError(e?.message || 'Erreur de chargement');
    }
    setLoading(false);
  }, [fetchHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const h = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/affiliates/register`, {
        method: 'POST',
        headers: h,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.error || `Erreur ${res.status}`);
      }
      toast.success('Vous etes maintenant affilie !');
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de l\'inscription');
    }
    setRegistering(false);
  };

  const handleCopy = async () => {
    if (!stats?.referralLink) return;
    await navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copie !');
  };

  const handleShare = (platform: 'linkedin' | 'twitter' | 'whatsapp') => {
    const url = encodeURIComponent(stats?.referralLink || '');
    const text = encodeURIComponent('Decouvrez Kompilot, le cockpit IA pour booster votre visibilite locale !');
    const links: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    window.open(links[platform], '_blank', 'noopener');
  };

  const formatEur = (cents: number) => `${(cents / 100).toFixed(2)} €`;

  // ── Not yet an affiliate —─
  if (!loading && !stats?.affiliate) {
    return (
      <Page>
        <PageHeader>
          <div>
            <PageTitle className="flex items-center gap-2">
              <Percent size={22} className="text-primary" /> Programme Affilies
            </PageTitle>
            <PageDescription>
              Recommandez Kompilot a votre reseau et gagnez 20% de commission sur chaque abonnement genere.
            </PageDescription>
          </div>
        </PageHeader>
        <PageBody className="space-y-8 max-w-2xl">
          <HowItWorks />
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <UserPlus size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Devenez affilie Kompilot</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Activez votre lien d'affiliation en un clic et commencez a gagner des commissions des aujourd'hui.
              </p>
            </div>
            <Button onClick={handleRegister} disabled={registering} className="gap-2">
              {registering ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
              {registering ? 'Activation...' : 'Devenir Affilie'}
            </Button>
          </div>
        </PageBody>
      </Page>
    );
  }

  // ── Error ──
  if (error && !stats) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Programme Affilies</PageTitle>
        </PageHeader>
        <PageBody>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>Reessayer</Button>
          </div>
        </PageBody>
      </Page>
    );
  }

  const commission = stats?.totalCommissionEuros ?? 0;
  const conversions = stats?.affiliate?.totalConversions ?? 0;
  const referrals = stats?.affiliate?.totalReferrals ?? 0;
  const clicks = stats?.clicks ?? 0;
  const estimatedMRR = history?.estimatedMRR ?? 0;

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Percent size={22} className="text-primary" /> Programme Affilies
          </PageTitle>
          <PageDescription>
            Recommandez Kompilot et gagnez {stats?.affiliate?.commissionPercent ?? 20}% de commission recurrente.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-8 max-w-2xl">
        {/* ── Stats cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Filleuls" value={String(referrals)} color="bg-primary" />
            <StatCard icon={Check} label="Conversions" value={String(conversions)} color="bg-emerald-600" />
            <StatCard icon={Euro} label="Commissions" value={commission.toFixed(0)} suffix="€" color="bg-amber-600" />
            <StatCard icon={TrendingUp} label="Clics" value={String(clicks)} color="bg-indigo-600" />
          </div>
        )}

        {/* ── Referral link ── */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Link size={15} className="text-primary" /> Votre lien d'affiliation
          </h3>
          {stats?.referralLink && (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-xs text-foreground font-mono break-all select-all border border-border">
                  {stats.referralLink}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copie' : 'Copier'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Partager :</span>
                <button onClick={() => handleShare('linkedin')} className="text-[#0A66C2] hover:opacity-80 transition-opacity" title="LinkedIn">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </button>
                <button onClick={() => handleShare('twitter')} className="text-[#1DA1F2] hover:opacity-80 transition-opacity" title="X / Twitter">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="text-[#25D366] hover:opacity-80 transition-opacity" title="WhatsApp">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Commission overview ── */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp size={15} className="text-primary" /> Recapitulatif des gains
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Taux de commission</p>
              <p className="text-xl font-extrabold text-primary mt-1">{stats?.affiliate?.commissionPercent ?? 20}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total commissions</p>
              <p className="text-xl font-extrabold text-foreground mt-1">{commission.toFixed(0)} €</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">MRR estime</p>
              <p className="text-xl font-extrabold text-foreground mt-1">{estimatedMRR.toFixed(0)} €</p>
            </div>
          </div>
        </div>

        {/* ── Conversion history ── */}
        {history && history.history.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Clock size={15} className="text-primary" /> Historique des conversions
            </h3>
            <div className="space-y-2">
              {history.history.slice(0, 10).map((evt) => (
                <div key={evt.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${evt.converted ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                      {evt.converted ? <Check size={14} /> : <Clock size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {evt.converted ? 'Conversion' : 'Clic'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(evt.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {evt.converted && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Euro size={10} /> +{formatEur(0)} commission
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty history ── */}
        {history && history.history.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <Share2 size={28} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucune conversion pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">Partagez votre lien pour commencer a generer des commissions.</p>
          </div>
        )}

        {/* ── How it works ── */}
        <HowItWorks />
      </PageBody>
    </Page>
  );
}
