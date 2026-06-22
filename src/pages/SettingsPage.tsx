import { useState } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardHeader, CardTitle, CardContent,
  Button, Tabs, TabsList, TabsTrigger, TabsContent, Separator, Badge,
} from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { useIsTeamRole } from '../context/UserRoleContext';
import { LogOut, User, Plug, CreditCard, CalendarClock, Bell, MessageSquare, Users, Lightbulb, Receipt, Cpu, Palette, KeyRound, ShieldCheck, Download } from 'lucide-react';
import { BrandPaletteSection } from '../components/settings/BrandPaletteSection';
import { PlatformCard } from '../components/settings/PlatformCard';
import { PLATFORMS } from '../components/settings/platformsConfig';
import { PricingCards } from '../components/subscription/PricingCards';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { useSubscription } from '../context/SubscriptionContext';
import { PublicationSlotsSection } from '../components/settings/PublicationSlotsSection';
import { NotificationPreferencesSection } from '../components/settings/NotificationPreferencesSection';
import { SMSAlertsSection } from '../components/settings/SMSAlertsSection';
import { BillingHistorySection } from '../components/subscription/BillingHistorySection';
import { TeamModeSection } from '../components/settings/TeamModeSection';
import { TeamInviteSection } from '../components/settings/TeamInviteSection';
import { ContentPillarsSection } from '../components/settings/ContentPillarsSection';
import { MetaConnectionPanel } from '../components/settings/MetaConnectionPanel';
import { WhatsAppConnectionPanel } from '../components/settings/WhatsAppConnectionPanel';
import { FlashTutorialButton } from '../components/shared/FlashTutorialButton';
import { APIStatusPanel } from '../components/settings/APIStatusPanel';
import { AdvancedAPIKeysPanel } from '../components/settings/AdvancedAPIKeysPanel';
import { GdprExportButton } from '../components/settings/GdprExportButton';
import { ROIFlashPushMockup } from '../components/dashboard/ROIFlashPushMockup';
import { AITrustBadgeWidget } from '../components/settings/AITrustBadgeWidget';
import { Smartphone } from 'lucide-react';
import { SocialChannelsPanel } from '../components/social/SocialChannelsPanel';
import { Share2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentPlan } = useSubscription();
  const isTeamRole = useIsTeamRole();
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const connectedCount = connected.size;

  const togglePlatform = (id: string) => {
    if (!connected.has(id)) {
      // Trying to connect a new network
      const wouldBeCount = connectedCount + 1;
      if (wouldBeCount > currentPlan.maxNetworks) {
        setUpgradeOpen(true);
        return;
      }
    }
    setConnected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex items-center gap-3">
          <PageTitle>Paramètres</PageTitle>
          <Badge variant={currentPlan.id === 'free' ? 'secondary' : currentPlan.id === 'pro' ? 'default' : 'outline'} className="rounded-full text-xs">
            {currentPlan.name}
          </Badge>
        </div>
        <PageDescription>
          Gérez votre compte, vos connexions et votre abonnement.
        </PageDescription>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="connexions" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="identite" className="gap-2">
              <Palette size={14} /> Identité Visuelle
            </TabsTrigger>
            <TabsTrigger value="connexions" className="gap-2">
              <Plug size={14} /> Connexions
            </TabsTrigger>
            <TabsTrigger value="canaux" className="gap-2">
              <Share2 size={14} /> Canaux
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="gap-2">
              <Cpu size={14} /> Centrale IA
            </TabsTrigger>
            <TabsTrigger value="creneaux" className="gap-2">
              <CalendarClock size={14} /> Créneaux
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users size={14} /> Équipe
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={14} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare size={14} /> SMS & Alertes
            </TabsTrigger>
            <TabsTrigger value="piliers" className="gap-2">
              <Lightbulb size={14} /> Piliers de Contenu
            </TabsTrigger>
            {!isTeamRole && (
              <TabsTrigger value="abonnement" className="gap-2">
                <CreditCard size={14} /> Mon Abonnement
              </TabsTrigger>
            )}
            {!isTeamRole && (
              <TabsTrigger value="facturation" className="gap-2">
                <Receipt size={14} /> Facturation
              </TabsTrigger>
            )}
            <TabsTrigger value="compte" className="gap-2">
              <User size={14} /> Mon compte
            </TabsTrigger>
            <TabsTrigger value="avance" className="gap-2">
              <KeyRound size={14} /> Clés API (BYOK)
            </TabsTrigger>
            <TabsTrigger value="rgpd" className="gap-2">
              <ShieldCheck size={14} /> Sécurité & Conformité
            </TabsTrigger>
          </TabsList>

          {/* ── Infrastructure / API Status tab ── */}
          <TabsContent value="identite" className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Palette size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">🎨 Identité Visuelle Automatique</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kompilot applique automatiquement votre bandeau de marque sur chaque image publiée. Fini Canva.
                </p>
              </div>
            </div>
            <BrandPaletteSection />
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6">
            <APIStatusPanel />
          </TabsContent>

          {/* ── Canaux sociaux tab ── */}
          <TabsContent value="canaux" className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Share2 size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">Publication Multicanal</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connectez vos comptes sociaux pour publier directement depuis Kompilot.
                </p>
              </div>
            </div>
            <SocialChannelsPanel />
          </TabsContent>

          {/* ── Connexions tab ── */}
          <TabsContent value="connexions" className="space-y-6">
            {/* Status banner */}
            <div className="flex items-center justify-between rounded-xl bg-secondary px-5 py-3 border border-border flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {connectedCount === 0
                    ? 'Aucune plateforme connectée'
                    : `${connectedCount} / ${currentPlan.unlimited ? '∞' : currentPlan.maxNetworks} plateforme${connectedCount > 1 ? 's' : ''} connectée${connectedCount > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentPlan.id === 'free'
                    ? `Offre gratuite : ${currentPlan.maxNetworks} réseau maximum. Passez à Pro pour en connecter plus.`
                    : 'Connectez vos comptes pour publier directement depuis Kompilot.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectedCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Actif
                  </span>
                )}
                {currentPlan.id === 'free' && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setUpgradeOpen(true)}>
                    Passer à Pro
                  </Button>
                )}
              </div>
            </div>

            {/* ── Meta OAuth panel ── */}
            <MetaConnectionPanel />

            {/* ── WhatsApp Business panel ── */}
            <FlashTutorialButton featureKey="whatsapp" className="mb-1" />
            <WhatsAppConnectionPanel />

            {/* ── Section divider ── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Autres plateformes</p>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {PLATFORMS.map(platform => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  connected={connected.has(platform.id)}
                  onToggle={togglePlatform}
                />
              ))}
            </div>

            {/* ── Badge de Confiance IA ── */}
            <AITrustBadgeWidget businessName={user?.displayName ?? ''} />
          </TabsContent>

          {/* ── Créneaux tab ── */}
          <TabsContent value="creneaux" className="space-y-4">
            <PublicationSlotsSection />
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4 text-sm text-foreground/80">
              <p className="font-semibold text-foreground mb-1">Comment fonctionne la file d'attente ?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lors de la création d'une publication, cliquez sur{' '}
                <span className="font-semibold text-foreground">"Ajouter à la file d'attente"</span>{' '}
                pour placer automatiquement votre contenu sur le prochain créneau libre défini ici.
                Si tous les créneaux de la semaine sont occupés, le système passe à la semaine suivante.
              </p>
            </div>
          </TabsContent>

          {/* ── Équipe tab ── */}
          <TabsContent value="equipe" className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">👥 Gestion de l'Équipe</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configurez le mode collaboratif, invitez vos membres et gérez leurs accès.
                </p>
              </div>
            </div>

            {/* Invite section */}
            <TeamInviteSection />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode collaboratif</p>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Existing team mode section */}
            <TeamModeSection />
          </TabsContent>

          {/* ── Notifications tab ── */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationPreferencesSection />

            {/* ROI FlashPush weekly report */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div
                className="flex items-center gap-3 px-5 py-4 border-b border-border"
                style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(5,150,105,0.05) 100%)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #059669)' }}
                >
                  <Smartphone size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">Rapport de Rentabilité Hebdomadaire FlashPush</p>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide dark:bg-emerald-900/30 dark:text-emerald-400">
                      Chaque lundi
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recevez chaque lundi à 9h00 un récapitulatif de ce que Kompilot vous a rapporté cette semaine.
                  </p>
                </div>
              </div>
              <div className="px-5 py-5 flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1 min-w-0 space-y-3">
                  <p className="text-sm font-medium text-foreground">Ce rapport contient :</p>
                  <ul className="space-y-3">
                    {[
                      { icon: '💰', title: 'CA sauvé — Bouclier Anti No-Show', desc: 'Montant estimé récupéré grâce aux empreintes bancaires et rappels automatiques.' },
                      { icon: '⭐', title: 'Avis Google traités cette semaine', desc: "Nombre d'avis auxquels l'IA a répondu cette semaine." },
                      { icon: '📈', title: 'Évolution du score G.E.O.', desc: 'Progression dans les recommandations de ChatGPT, Perplexity et Google AI.' },
                    ].map((item) => (
                      <li key={item.title} className="flex items-start gap-3">
                        <span className="text-lg leading-none shrink-0 mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Aperçu WhatsApp</p>
                  <ROIFlashPushMockup noShow={380} reviews={8} geoScore={72} geoChange={4} />
                </div>
              </div>
            </div>
          </TabsContent>


          {/* ── SMS & Alertes tab ── */}
          <TabsContent value="sms" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">⚙️ Alertes SMS & Rappels</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recevez des notifications intelligentes sur votre mobile même quand vous avez la tête dans le guidon.
                </p>
              </div>
            </div>
            <SMSAlertsSection />

            {/* ROI FlashPush weekly WhatsApp report */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div
                className="flex items-center gap-3 px-5 py-4 border-b border-border"
                style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.07) 0%, rgba(13,148,136,0.05) 100%)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #25d366, #0D9488)' }}
                >
                  <Smartphone size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">📊 ROI FlashPush — Rapport hebdo WhatsApp</p>
                    <span className="rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
                      style={{ background: 'rgba(37,211,102,0.15)', color: '#1a9e4a' }}>
                      WhatsApp · Lundi 9h00
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chaque lundi matin, recevez un message WhatsApp avec le bilan de la semaine : CA sauvé, avis traités, score G.E.O.
                  </p>
                </div>
              </div>
              <div className="px-5 py-5 flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 px-4 py-3">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      ✓ Sachez exactement ce que Kompilot vous rapporte chaque semaine.
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                      Assurez-vous d'avoir renseigné votre numéro de téléphone dans vos informations de compte.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      { icon: '💰', label: "CA sauvé par l'Anti No-Show" },
                      { icon: '⭐', label: 'Avis Google traités & répondus' },
                      { icon: '📈', label: 'Score G.E.O. & progression IA' },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm text-foreground">
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Aperçu du message</p>
                  <ROIFlashPushMockup noShow={380} reviews={8} geoScore={72} geoChange={4} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Piliers de Contenu tab ── */}
          <TabsContent value="piliers" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">💡 Piliers de Contenu</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Définissez vos 3 thèmes majeurs pour que l'IA génère chaque jour des idées de posts ciblées.
                </p>
              </div>
            </div>
            <ContentPillarsSection />
          </TabsContent>

          {/* ── Subscription tab — owner only ── */}
          {!isTeamRole && (
            <TabsContent value="abonnement" className="space-y-8">
              <PricingCards />
            </TabsContent>
          )}

          {/* ── Facturation tab — owner only ── */}
          {!isTeamRole && (
          <TabsContent value="facturation" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Receipt size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">🧾 Facturation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Retrouvez ici toutes vos factures générées automatiquement après chaque paiement.
                </p>
              </div>
            </div>
            <BillingHistorySection />
          </TabsContent>
          )}

          {/* ── Account tab ── */}
          <TabsContent value="compte" className="space-y-6">
            {/* Section 1: Informations personnelles */}
            <div>
              <h2 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
                <User size={16} className="text-primary" />
                Informations personnelles
              </h2>
              <Card className="max-w-xl">
                <CardContent className="pt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom d'affichage</p>
                      <p className="text-sm font-medium text-foreground">{user?.displayName || '—'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3 text-foreground flex items-center gap-2">
                      <span className="text-red-500">⚠️</span> Zone de danger
                    </p>
                    <Button variant="outline" onClick={logout} size="sm" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400">
                      <LogOut size={14} />
                      Se déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Gestion de l'équipe */}
            <div>
              <h2 className="text-base font-extrabold text-foreground mb-1 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Gestion de l'équipe
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Configurez le mode collaboratif pour que votre équipe prépare les posts et les valide avant publication.
              </p>
              <TeamModeSection />
            </div>
          </TabsContent>
          <TabsContent value="avance" className="space-y-6">
            <AdvancedAPIKeysPanel />
          </TabsContent>

          {/* ── Sécurité & Conformité RGPD tab ── */}
          <TabsContent value="rgpd" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">🔒 Sécurité & Conformité des Données</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gérez vos données personnelles, exportez votre historique et consultez nos engagements RGPD.
                </p>
              </div>
            </div>

            {/* Privacy commitment banner */}
            <div className="rounded-2xl border border-primary/20 overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(5,150,105,0.04) 100%)' }}>
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Votre vie privée est notre priorité absolue</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <strong className="text-foreground">Kompilot n'utilise pas les données de vos clients pour entraîner des modèles d'IA publics.</strong>{' '}
                    Vos données d'établissement restent privées et cloisonnées. Chaque compte dispose d'un espace
                    de données strictement isolé des autres comptes. Nous ne vendons jamais vos données à des tiers.
                  </p>
                </div>
              </div>
            </div>

            {/* Security points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🔐', title: 'Chiffrement TLS 1.3', desc: 'Toutes les données transitent via un tunnel chiffré. Au repos : chiffrement AES-256.' },
                { icon: '🛡️', title: 'Infrastructure Cloudflare', desc: 'Protection DDoS, WAF (pare-feu applicatif) et CDN sécurisé. Données EU.' },
                { icon: '💳', title: 'Paiements via Stripe', desc: 'Certifié PCI DSS niveau 1. Kompilot ne voit jamais vos numéros de carte.' },
                { icon: '🤖', title: 'IA via API Business', desc: 'OpenAI API Business : vos données ne servent pas à entraîner les modèles publics.' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Export RGPD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download size={16} className="text-primary" />
                  Export de mes données (RGPD — Droit à la portabilité)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conformément à l'article 20 du RGPD, vous avez le droit de recevoir vos données personnelles dans un format
                  structuré, couramment utilisé et lisible par machine. Cet export contient :<br />
                  <strong className="text-foreground">profil utilisateur · établissements · publications · messages inbox · paramètres</strong>
                </p>
                <GdprExportButton userId={user?.id || ''} userEmail={user?.email || ''} />
                <Separator />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  L'export est généré instantanément en format JSON. Pour une demande de suppression complète de vos données,
                  contactez <span className="text-primary font-medium">privacy@kompilot.app</span>.
                  Délai de traitement : 30 jours maximum (conformément au RGPD).
                </p>
              </CardContent>
            </Card>

            {/* Legal links */}
            <div className="rounded-xl border border-border bg-muted/10 px-5 py-4">
              <p className="text-xs font-bold text-foreground mb-3">📋 Documents légaux</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { href: '/privacy', label: '🔒 Politique de Confidentialité & RGPD' },
                  { href: '/cgv', label: '📄 CGV / CGU' },
                  { href: '/legal', label: '🏢 Mentions Légales' },
                ].map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Oups ! Limite atteinte 🚧"
        description={`Vous avez atteint la limite de ${currentPlan.maxNetworks} réseau${currentPlan.maxNetworks > 1 ? 'x' : ''} de l'offre gratuite. Passez à l'offre Pro pour connecter jusqu'à 3 réseaux sociaux.`}
        targetPlan="pro"
      />
    </Page>
  );
}
