import { useState, useEffect } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, toast } from '@blinkdotnew/ui';
import { Gift, Copy, Check, Send, Users, Zap, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../context/CreditsContext';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { markReferralVisited } from '../components/dashboard/OnboardingChecklist';

// ── Referral link builder ────────────────────────────────────────────────────

function buildRefLink(email?: string | null, company?: string): string {
  const slug = (company || email?.split('@')[0] || 'utilisateur')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${window.location.origin}/ref/${slug}`;
}

// ── Stat badge ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Gift; label: string; value: string; color: string;
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

// ── How it works step ─────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { user } = useAuth();
  const profile = useOnboardingProfile();
  const { credits, addCredits } = useCredits();

  const refLink = buildRefLink(user?.email, profile?.companyName);

  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);

  // Mark onboarding step 3 as visited when user lands here
  useEffect(() => { markReferralVisited(); }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://${refLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copié !');
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

    // Simulate successful referral — add 5 credits
    addCredits(5);
    setReferralCount(p => p + 1);
    setCreditsEarned(p => p + 5);

    toast.success(`Invitation envoyée à ${inviteEmail} !`, {
      description: '+5 crédits ajoutés à votre solde 🎉',
    });
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail('');
    }, 3000);
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'vous';

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Gift size={22} className="text-primary" /> Parrainage & Crédits
          </PageTitle>
          <PageDescription>
            Invitez vos confrères artisans et commerçants — gagnez des crédits ensemble !
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
              Invitez un ami, gagnez <span className="underline decoration-wavy decoration-white/50">5 crédits</span> chacun !
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              Dès qu'un confrère artisan ou commerçant s'inscrit via votre lien,{' '}
              <strong className="text-white">vous recevez 5 crédits</strong> de publication et{' '}
              <strong className="text-white">lui aussi</strong>. Tout le monde y gagne !
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Users}   label="Filleuls actifs" value={referralCount.toString()}                  color="bg-primary" />
          <StatCard icon={Zap}     label="Crédits gagnés"  value={`+${creditsEarned}`}                       color="bg-emerald-500" />
          <StatCard icon={Star}    label="Solde actuel"    value={credits === 'unlimited' ? '∞' : String(credits)} color="bg-violet-500" />
        </div>

        {/* Your link */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-foreground">🔗 Votre lien de parrainage unique</h3>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
            <span className="flex-1 text-sm font-mono text-primary truncate">{refLink}</span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                copied ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {copied ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Partagez ce lien sur WhatsApp, LinkedIn, ou par email à vos confrères.
          </p>
        </div>

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
                inviteSent
                  ? 'bg-green-500 text-white'
                  : inviteLoading
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-foreground text-background hover:opacity-90'
              }`}
            >
              {inviteSent ? (
                <><Check size={14} /> Envoyé ! +5 cr.</>
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
                <strong>Invitation envoyée à {inviteEmail} !</strong>{' '}
                Dès son inscription, +5 crédits seront ajoutés à vos deux comptes.
              </p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-foreground">📋 Comment ça marche ?</h3>
          <div className="space-y-4">
            <Step num="1" title="Partagez votre lien" desc="Envoyez votre lien unique à un artisan, commerçant ou restaurateur de votre réseau." />
            <div className="flex items-center justify-center">
              <ChevronRight size={14} className="text-muted-foreground rotate-90" />
            </div>
            <Step num="2" title="Votre filleul s'inscrit" desc="Il crée son compte Kompilot via votre lien et entre ses informations métier." />
            <div className="flex items-center justify-center">
              <ChevronRight size={14} className="text-muted-foreground rotate-90" />
            </div>
            <Step num="3" title="Vous gagnez tous les deux" desc="+5 crédits sont automatiquement ajoutés à votre compte ET au sien. Aucune action requise !" />
          </div>
        </div>

      </PageBody>
    </Page>
  );
}
