/**
 * LeadGenPage — /lead-gen
 *
 * Pro Lead Gen widget:
 * 1. Live preview of the embeddable capture form
 * 2. Generated embed script (JS widget) for the merchant's website
 * 3. Dedicated landing page URL for the merchant to share
 * 4. List of captured leads with SMS status
 */
import { useState, useCallback } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Badge, Card, toast,
} from '@blinkdotnew/ui';
import {
  Users, Phone, Copy, Check, MessageSquare, Sparkles,
  RefreshCw, Code2, Link2, ChevronRight, User, Mail,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useEstablishment } from '../context/EstablishmentContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CapturedLead {
  id:          string;
  firstName:   string;
  lastName:    string;
  phone:       string;
  email?:      string;
  offerLabel?: string;
  smsSent:     number;
  smsSentAt?:  string;
  source:      string;
  createdAt:   string;
}

// ── Inline capture form (live preview) ───────────────────────────────────────

function CaptureFormPreview({
  offerLabel,
  onCapture,
  loading,
}: {
  offerLabel: string;
  onCapture: (data: { firstName: string; lastName: string; phone: string; email: string }) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast.error('Prénom, Nom et Mobile sont requis');
      return;
    }
    onCapture(form);
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-background p-6 shadow-sm max-w-sm w-full">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {offerLabel || 'Recevez votre offre exclusive'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Remplissez le formulaire et recevez votre coupon par SMS
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Prénom *</label>
            <input
              type="text"
              placeholder="Marie"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Nom *</label>
            <input
              type="text"
              placeholder="Dupont"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Mobile *</label>
          <input
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Email (optionnel)</label>
          <input
            type="email"
            placeholder="marie@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <Button type="submit" className="w-full gap-2 mt-1" disabled={loading}>
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Envoi...</>
            : <><MessageSquare size={14} /> Recevoir mon offre par SMS</>}
        </Button>
      </form>

      <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
        En soumettant ce formulaire, vous acceptez de recevoir un SMS. Propulsé par Kompilot.
      </p>
    </div>
  );
}

// ── Embed script generator ────────────────────────────────────────────────────

function EmbedScriptCard({ userId, establishmentId, offerLabel }: {
  userId: string;
  establishmentId: string;
  offerLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const script = `<!-- Widget Kompilot Lead Gen -->
<div id="nc-leadgen-widget"></div>
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://kompilot.blinkpowered.com/widget/leadgen.js';
    s.dataset.userId = '${userId}';
    s.dataset.estId = '${establishmentId || 'default'}';
    s.dataset.offer = '${(offerLabel || 'Offre exclusive').replace(/'/g, "\\'")}';
    s.dataset.backend = '${BACKEND_URL}';
    s.async = true;
    document.getElementById('nc-leadgen-widget').appendChild(s);
  })();
</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success('Script copié dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Script d'intégration</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={handleCopy}>
          {copied ? <><Check size={12} className="text-green-600" /> Copié !</> : <><Copy size={12} /> Copier</>}
        </Button>
      </div>
      <pre className="text-[11px] text-muted-foreground bg-muted/30 rounded-xl p-3 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
        {script}
      </pre>
      <p className="text-xs text-muted-foreground mt-2">
        Collez ce code dans la section <code className="bg-muted px-1 rounded">&lt;body&gt;</code> de votre site web pour afficher le formulaire de capture.
      </p>
    </Card>
  );
}

// ── Landing page URL card ─────────────────────────────────────────────────────

function LandingPageCard({ userId, establishmentId, offerLabel }: {
  userId: string;
  establishmentId: string;
  offerLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const params = new URLSearchParams({
    uid: userId,
    eid: establishmentId || 'default',
    offer: offerLabel || 'Offre exclusive',
  });
  const url = `https://kompilot.blinkpowered.com/capture?${params}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link2 size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">Landing Page partageable</h3>
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 h-9 rounded-xl border border-border bg-muted/30 px-3 text-xs font-mono text-muted-foreground focus:outline-none"
        />
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9 shrink-0" onClick={handleCopy}>
          {copied ? <><Check size={12} className="text-green-600" /> Copié !</> : <><Copy size={12} /> Copier</>}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Partagez ce lien sur vos réseaux sociaux, WhatsApp ou SMS pour capturer des contacts.
      </p>
    </Card>
  );
}

// ── Captured leads table ──────────────────────────────────────────────────────

function LeadsTable({ leads }: { leads: CapturedLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={36} className="mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm font-semibold text-foreground">Aucun contact capturé pour l'instant</p>
        <p className="text-xs text-muted-foreground mt-1">
          Les contacts soumis via votre widget ou landing page apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Mobile</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Offre</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">SMS</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map(lead => (
            <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {lead.firstName.charAt(0).toUpperCase()}{lead.lastName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    {lead.firstName} {lead.lastName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary text-xs hover:underline">
                  <Phone size={11} /> {lead.phone}
                </a>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {lead.email
                  ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={11} /> {lead.email}</span>
                  : <span className="text-muted-foreground/40 text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-muted-foreground">{lead.offerLabel || '—'}</span>
              </td>
              <td className="px-4 py-3">
                {Number(lead.smsSent) > 0
                  ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] gap-1"><MessageSquare size={9} /> Envoyé</Badge>
                  : <Badge className="bg-muted text-muted-foreground border-border text-[10px]">En attente</Badge>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadGenPage() {
  const { user } = useEstablishment ? useEstablishment() as any : { user: null };
  const [offerLabel,  setOfferLabel]  = useState('');
  const [couponCode,  setCouponCode]  = useState('');
  const [activeTab,  setActiveTab]    = useState<'widget' | 'leads'>('widget');
  const queryClient = useQueryClient();

  // Get auth user id
  const [userId, setUserId] = useState('');
  useState(() => {
    blink.auth.me().then(u => { if (u?.id) setUserId(u.id); }).catch(() => {});
  });

  const establishmentId = (user as any)?.id ?? '';

  // Fetch captured leads
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['captured-leads', userId],
    enabled: !!userId && activeTab === 'leads',
    staleTime: 30_000,
    queryFn: async () => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/leads/captured`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { leads: [] };
      return res.json() as Promise<{ leads: CapturedLead[] }>;
    },
  });

  // Capture mutation
  const captureMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string; email: string }) => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/leads/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          offerLabel:      offerLabel || 'Offre exclusive',
          couponCode:      couponCode.trim() || undefined,
          establishmentId: establishmentId || undefined,
          source:          'widget_preview',
        }),
      });
      const result = await res.json() as { success: boolean; smsSent: boolean; message: string; leadId?: string };
      if (!res.ok) throw new Error((result as any).error ?? 'Erreur');
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.smsSent ? '✅ Contact capturé + SMS envoyé !' : '✅ Contact capturé !', {
        description: result.message,
      });
      // Mark SMS campaign sent for StartupChecklist progress
      if (result.smsSent && userId) {
        try { localStorage.setItem(`sms_campaign_sent_${userId}`, '1'); } catch { /* noop */ }
      }
      queryClient.invalidateQueries({ queryKey: ['captured-leads'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const leads = leadsData?.leads ?? [];

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <PageTitle>📈 Capturer des clients (Lead Gen)</PageTitle>
            <PageDescription>Collectez des numéros de téléphone et envoyez des coupons par SMS automatiquement</PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit mb-6">
          {([
            { id: 'widget', label: '🎛️ Configurer le widget' },
            { id: 'leads',  label: `👥 Contacts capturés${leads.length > 0 ? ` (${leads.length})` : ''}` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'widget' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: config + code */}
            <div className="space-y-5">
              {/* Offer label config */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Configuration de l'offre</h3>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Texte de l'offre (affiché sur le formulaire)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: -20% sur votre première visite • Café offert • Livraison gratuite"
                    value={offerLabel}
                    onChange={e => setOfferLabel(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Ce texte apparaît en titre du formulaire et est inclus dans le SMS automatique.
                  </p>
                </div>

                {/* Coupon code */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Code coupon à inclure dans le SMS (optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: BIENVENUE20 • ETE10 • VIP2026"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                      maxLength={20}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    {couponCode && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        COUPON ACTIF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Le code sera inséré dans le SMS : <em>"Votre code : <strong>{couponCode || 'BIENVENUE20'}</strong>"</em>
                  </p>
                </div>

                {/* SMS preview */}
                {(offerLabel || couponCode) && (
                  <div className="mt-4 rounded-xl bg-muted/40 border border-border px-4 py-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Aperçu du SMS</p>
                    <p className="text-xs text-foreground leading-relaxed font-mono bg-background rounded-lg px-3 py-2 border border-border">
                      Bonjour [Prénom] 👋 {offerLabel || 'Offre exclusive'}
                      {couponCode && <><br/>🎟️ Votre code : <strong>{couponCode}</strong></>}
                      <br/>— Propulsé par Kompilot.
                    </p>
                  </div>
                )}

                {/* SMS info */}
                <div className="mt-4 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-start gap-3">
                  <MessageSquare size={15} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">SMS automatique inclus</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Dès qu'un client remplit le formulaire, un SMS contenant son offre est envoyé instantanément.
                      Requiert <code className="bg-muted px-1 rounded">TWILIO_*</code> dans vos secrets.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Embed script */}
              {userId && (
                <EmbedScriptCard
                  userId={userId}
                  establishmentId={establishmentId}
                  offerLabel={offerLabel}
                />
              )}

              {/* Landing page URL */}
              {userId && (
                <LandingPageCard
                  userId={userId}
                  establishmentId={establishmentId}
                  offerLabel={offerLabel}
                />
              )}
            </div>

            {/* Right: live preview */}
            <div>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Aperçu en direct</h3>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 ml-auto">Live Preview</Badge>
                </div>
                <div className="flex justify-center">
                  <CaptureFormPreview
                    offerLabel={offerLabel}
                    onCapture={data => captureMutation.mutate(data)}
                    loading={captureMutation.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Ce formulaire est fonctionnel — testez la capture en direct ci-dessus.
                </p>
              </Card>

              {/* How it works */}
              <Card className="p-5 mt-5">
                <h3 className="text-sm font-semibold mb-4">Comment ça fonctionne</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', label: 'Le client scanne votre QR Code ou visite votre landing page', icon: '📱' },
                    { step: '2', label: 'Il remplit le formulaire (Prénom, Nom, Mobile)', icon: '📝' },
                    { step: '3', label: 'Il reçoit son coupon / confirmation par SMS instantanément', icon: '💬' },
                    { step: '4', label: 'Son contact est enregistré dans votre base de données Kompilot', icon: '💾' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {item.step}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="mr-1">{item.icon}</span>{item.label}
                      </p>
                      {parseInt(item.step) < 4 && (
                        <ChevronRight size={12} className="text-muted-foreground/30 shrink-0 mt-0.5 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Contacts capturés</h3>
                {leads.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{leads.length}</Badge>
                )}
              </div>
            </div>
            {leadsLoading
              ? <div className="p-8 text-center"><RefreshCw size={20} className="animate-spin text-muted-foreground mx-auto" /></div>
              : <LeadsTable leads={leads} />}
          </Card>
        )}
      </PageBody>
    </Page>
  );
}
