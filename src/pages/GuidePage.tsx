import { useState, useMemo } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody } from '@blinkdotnew/ui';
import { toast } from '@blinkdotnew/ui';
import { Search, BookOpen, MessageCircle, ExternalLink, ChevronDown, Zap, Link2, Video, X, Sparkles, XCircle, Wifi, WifiOff, RefreshCw, MapPin, Phone, Send, AlertCircle, Loader2 } from 'lucide-react';

// ── Helpdesk FAQ (les 3 demandées en premier + les anciennes) ─────────────────

const HELPDESK_FAQS = [
  {
    id: 'connect-social',
    icon: Link2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    question: 'Comment connecter mes comptes LinkedIn et Instagram ?',
    answer: 'Depuis votre Tableau de bord, cliquez sur le bouton "Connecter un compte" en haut à droite. Une fenêtre s\'ouvre avec la liste des réseaux disponibles (LinkedIn, Instagram Pro, TikTok, Google Business). Cliquez sur le réseau voulu pour déplier le formulaire, saisissez votre identifiant (email ou nom d\'utilisateur) ET votre mot de passe — les deux champs sont obligatoires. Le bouton "Lier le compte" s\'active automatiquement dès que les deux champs sont remplis. Une vérification de 2 secondes s\'effectue, puis vos statistiques s\'affichent immédiatement sur le Dashboard.',
    tags: ['connexion', 'linkedin', 'instagram', 'identifiant'],
  },
  {
    id: 'video-ia',
    icon: Video,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    question: 'Comment fonctionne le système de génération de vidéos IA ?',
    answer: 'Le générateur de vidéos IA crée automatiquement des clips verticaux (format 9:16) adaptés à TikTok et Instagram Reels. Pour y accéder : ouvrez l\'éditeur de post via "+ Créer un post", puis cliquez sur l\'onglet "Vidéos IA" sous la zone de texte. Vous verrez des clips générés par thème (tutoriel, témoignage, produit, ambiance). Sélectionnez-en un — il s\'affiche en boucle dans l\'aperçu smartphone à droite. Cette fonctionnalité est réservée aux plans Pro (19€/mois) et Expert (39€/mois). Si vous êtes sur le plan Gratuit, un message vous invutera à mettre à niveau.',
    tags: ['vidéo', 'ia', 'tiktok', 'reels', 'pro'],
  },
  {
    id: 'credits-zero',
    icon: Zap,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    question: 'Que se passe-t-il si je tombe à 0 crédit de publication ?',
    answer: 'Quand votre solde atteint 0, le bouton "Planifier" dans l\'éditeur de post se grise et se désactive. Un pop-up "Solde insuffisant" apparaît avec deux options : acheter un pack de crédits ponctuels (5, 20 ou 50 crédits) depuis Mon Abonnement, ou souscrire à l\'offre Pro pour obtenir 30 crédits automatiquement renouvelés chaque mois. Votre solde est toujours visible dans le menu latéral gauche, juste sous le bouton "+ Créer un post". Les membres Expert ne sont jamais bloqués — leur compteur affiche "Illimité".',
    tags: ['crédit', 'solde', 'payer', 'bloqué'],
  },
  {
    id: 'cancellation',
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    question: 'Comment résilier mon abonnement Kompilot ?',
    answer: 'Les offres Starter Pro et Business sont sans engagement — vous pouvez les résilier à tout moment depuis Mon Compte → onglet "Résiliation". Un tunnel de confirmation vous rappelle les fonctionnalités que vous perdrez, puis votre accès reste actif jusqu\'à la fin de la période de facturation en cours. Un email de confirmation vous est envoyé automatiquement. Pour les offres Franchise & Réseau (contrats annuels sur-mesure), un conseiller dédié traite votre demande sous 48h : utilisez le bouton "Contacter le service client" dans le même onglet. Dans tous les cas, conformément au RGPD, vous disposez de 30 jours après la coupure de votre accès pour exporter votre historique de performances et vos données clients avant suppression définitive.',
    tags: ['résiliation', 'annuler', 'abonnement', 'fin de contrat', 'données'],
  },
  {
    id: 'how-many-networks',
    icon: Link2,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    question: 'Combien de réseaux sociaux puis-je connecter ?',
    answer: 'Avec le plan Gratuit : 1 réseau connecté. Plan Pro : jusqu\'à 3 réseaux. Plan Expert : connexions illimitées. Vous pouvez changer d\'offre à tout moment dans l\'onglet "Mon Abonnement".',
    tags: ['réseau', 'abonnement', 'gratuit'],
  },
  {
    id: 'auto-publish',
    icon: Sparkles,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    question: 'Mes publications sont-elles vraiment publiées automatiquement ?',
    answer: 'Oui, à l\'heure exacte choisie dans le calendrier. Une fois planifiée, aucune action manuelle n\'est requise. Vous recevrez une notification de confirmation quand la publication sera diffusée.',
    tags: ['calendrier', 'automatique', 'planifier'],
  },
  {
    id: 'smart-queue',
    icon: Zap,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    question: 'Comment fonctionne la Smart Queue ?',
    answer: 'La Smart Queue analyse vos meilleurs créneaux de publication passés (horaires, jours, canaux) et planifie automatiquement vos posts aux moments où votre audience est la plus active. Pour en bénéficier, configurez vos créneaux préférés dans Paramètres → Créneaux de publication, puis utilisez "Ajouter à la file d\'attente" dans l\'éditeur de post.',
    tags: ['queue', 'smart', 'automatique', 'créneau'],
  },
];

// ── Guide cards (collapsible) ─────────────────────────────────────────────────

const GUIDE_CARDS = [
  {
    id: 'start',
    emoji: '🚀',
    title: 'Débuter en 2 minutes',
    badge: 'Mise en route',
    badgeColor: 'bg-violet-100 text-violet-700',
    headerGradient: 'from-violet-600 to-violet-400',
    glowColor: 'shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)]',
    tipBg: 'bg-violet-50',
    tipColor: 'text-violet-700',
    description: 'Connectez vos réseaux, créez votre premier post et planifiez-le en moins de 2 minutes.',
    steps: [
      { num: '1', title: 'Connectez un réseau social', text: 'Depuis le Tableau de bord, cliquez sur "Connecter un compte" et saisissez vos identifiants (LinkedIn, Instagram, TikTok ou Google Business).' },
      { num: '2', title: 'Créez votre premier post', text: 'Utilisez le bouton "+ Créer un post" dans le menu latéral. Rédigez votre message ou laissez l\'IA le générer à votre place.' },
      { num: '3', title: 'Planifiez ou publiez', text: 'Choisissez "Publier maintenant" ou "Ajouter à la file d\'attente" pour planifier automatiquement sur vos meilleurs créneaux.' },
    ],
    tip: 'Astuce : l\'IA adapte automatiquement le texte selon les codes de chaque réseau sélectionné.',
  },
  {
    id: 'video',
    emoji: '🎥',
    title: 'Générer des vidéos IA verticales',
    badge: 'Fonctionnalité Pro',
    badgeColor: 'bg-rose-100 text-rose-700',
    headerGradient: 'from-rose-600 to-orange-400',
    glowColor: 'shadow-[0_8px_32px_-8px_rgba(244,63,94,0.3)]',
    tipBg: 'bg-rose-50',
    tipColor: 'text-rose-700',
    description: 'Créez des clips vidéo verticaux générés par IA, parfaits pour TikTok, Instagram Reels et YouTube Shorts.',
    steps: [
      { num: '1', title: 'Passez en Pro', text: 'L\'onglet "Vidéos IA" est réservé aux membres Pro et Expert. Accédez à "Mon Abonnement" pour débloquer cette fonctionnalité.' },
      { num: '2', title: 'Choisissez votre style vidéo', text: 'Dans l\'éditeur de post, sélectionnez l\'onglet "Vidéos IA". Parcourez les clips générés (tutoriel, témoignage, produit, ambiance).' },
      { num: '3', title: 'Prévisualisez et publiez', text: 'La vidéo se joue en boucle dans l\'aperçu smartphone. Sélectionnez-la et planifiez-la directement sur TikTok ou Instagram Reels.' },
    ],
    tip: 'Astuce : les vidéos au format 9:16 (vertical) obtiennent 3x plus d\'engagement sur TikTok et Reels.',
  },
  {
    id: 'seo',
    emoji: '📍',
    title: 'Optimiser son référencement Google',
    badge: 'Réputation locale',
    badgeColor: 'bg-amber-100 text-amber-700',
    headerGradient: 'from-amber-500 to-yellow-400',
    glowColor: 'shadow-[0_8px_32px_-8px_rgba(245,158,11,0.3)]',
    tipBg: 'bg-amber-50',
    tipColor: 'text-amber-700',
    description: 'Améliorez votre positionnement sur Google Maps et dans les recherches locales.',
    steps: [
      { num: '1', title: 'Connectez Google Business Profile', text: 'Liez votre fiche Google depuis "Connecter un compte" pour recevoir vos avis et publier directement.' },
      { num: '2', title: 'Répondez à tous vos avis', text: 'Dans la Boîte de réception → onglet "Avis Google", utilisez "Répondre avec l\'IA" pour générer des réponses en 1 clic.' },
      { num: '3', title: 'Publiez régulièrement', text: 'Planifiez au minimum 2 posts par semaine sur Google Business via le Calendrier de publication.' },
    ],
    tip: 'Astuce : répondre aux avis négatifs sous 24h améliore votre score Google Maps de 30 % en moyenne.',
  },
];

// ── FAQ accordion item ────────────────────────────────────────────────────────

function FaqItem({ faq, defaultOpen = false }: {
  faq: typeof HELPDESK_FAQS[0]; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const IconComp = faq.icon;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      open ? 'border-primary/30 shadow-sm' : 'border-border hover:border-primary/20'
    }`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left bg-card hover:bg-muted/30 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${faq.iconBg}`}>
          <IconComp size={16} className={faq.iconColor} />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground leading-snug pr-2">
          {faq.question}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-card border-t border-border/50">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Guide card (collapsible) ──────────────────────────────────────────────────

function GuideCard({ card }: { card: typeof GUIDE_CARDS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-3xl border border-border bg-card overflow-hidden transition-all duration-200 ${card.glowColor} hover:-translate-y-0.5`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full bg-gradient-to-br ${card.headerGradient} p-6 relative overflow-hidden text-left`}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-4 right-4 w-12 h-12 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 mb-2 ${card.badgeColor}`}>
              {card.badge}
            </span>
            <h2 className="text-lg font-extrabold text-white leading-tight">{card.title}</h2>
            <p className="text-sm text-white/80 mt-1 leading-snug">{card.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-3xl">{card.emoji}</span>
            <div className={`w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className="text-white" />
            </div>
          </div>
        </div>
      </button>
      {open && (
        <div className="p-6 space-y-4">
          {card.steps.map(step => (
            <div key={step.num} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-[11px] font-bold shrink-0 mt-0.5">
                {step.num}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.text}</p>
              </div>
            </div>
          ))}
          <div className={`flex items-start gap-2.5 rounded-xl ${card.tipBg} border border-border/40 px-4 py-3`}>
            <span className="text-base shrink-0">💡</span>
            <p className={`text-xs font-medium leading-snug ${card.tipColor}`}>{card.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Diagnostic Panel ─────────────────────────────────────────────────────────

type ServiceStatus = 'idle' | 'checking' | 'ok' | 'error';

interface DiagnosticService {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: ServiceStatus;
}

function DiagnosticPanel() {
  const [services, setServices] = useState<DiagnosticService[]>([
    { id: 'maps',      name: 'Google Maps API',            icon: <MapPin size={16} className="text-blue-500" />,  status: 'idle' },
    { id: 'whatsapp',  name: 'WhatsApp Business API',      icon: <Phone size={16} className="text-green-500" />,  status: 'idle' },
    { id: 'meta',      name: 'Meta (Facebook / Instagram)', icon: <MessageCircle size={16} className="text-indigo-500" />, status: 'idle' },
  ]);

  const isTesting = services.some(s => s.status === 'checking');

  const runDiagnostic = () => {
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' })));
    setTimeout(() => {
      setServices(prev => prev.map(s => ({
        ...s,
        status: Math.random() > 0.35 ? 'ok' : 'error',
      })));
    }, 1500);
  };

  const statusIcon = (status: ServiceStatus) => {
    if (status === 'checking') return <Loader2 size={16} className="text-muted-foreground animate-spin" />;
    if (status === 'ok')       return <span className="text-base">✅</span>;
    if (status === 'error')    return <span className="text-base">❌</span>;
    return <span className="w-4 h-4 rounded-full border-2 border-border inline-block" />;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Wifi size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">🔌 Diagnostic de Connexion — 1 Clic</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Testez instantanément vos intégrations actives</p>
        </div>
      </div>

      <div className="space-y-2">
        {services.map(svc => (
          <div
            key={svc.id}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-colors ${
              svc.status === 'ok'    ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10' :
              svc.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10' :
              'border-border bg-muted/30'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
              {svc.icon}
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">{svc.name}</span>
            <div className="flex items-center gap-2">
              {statusIcon(svc.status)}
              {svc.status === 'error' && (
                <a
                  href="#"
                  className="text-[11px] font-bold text-primary hover:underline ml-1 flex items-center gap-1"
                  onClick={e => e.preventDefault()}
                >
                  <RefreshCw size={11} /> Reconnecter
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={runDiagnostic}
        disabled={isTesting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-3 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isTesting ? (
          <><Loader2 size={15} className="animate-spin" /> Analyse en cours...</>
        ) : (
          <><Wifi size={15} /> Tester mes connexions</>
        )}
      </button>
    </div>
  );
}

// ── Support Ticket Form ───────────────────────────────────────────────────────

function SupportTicketForm() {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const device  = typeof navigator !== 'undefined'
    ? navigator.userAgent.includes('iPhone') ? 'iPhone'
    : navigator.userAgent.includes('Android') ? 'Android'
    : 'Desktop'
    : 'Desktop';

  const browser = typeof navigator !== 'undefined'
    ? navigator.userAgent.includes('Chrome')  ? 'Chrome'
    : navigator.userAgent.includes('Firefox') ? 'Firefox'
    : 'Safari'
    : 'Chrome';

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const suggestedFaqs = wordCount >= 3
    ? HELPDESK_FAQS.filter(faq => {
        const q = description.toLowerCase();
        return faq.tags.some(t => q.includes(t)) || faq.question.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w));
      }).slice(0, 3)
    : [];

  const handleSubmit = () => {
    if (!description.trim()) return;
    toast.success('✅ Ticket envoyé. Notre équipe vous répond sous 24h.', {
      description: 'Un email de confirmation vous a été envoyé.',
    });
    setDescription('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const Chip = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground px-3 py-1">
      {label}
    </span>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Send size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">📬 Soumettre un Ticket</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Décrivez votre problème — l'IA suggère des réponses</p>
        </div>
      </div>

      {/* Auto-filled context */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Contexte détecté automatiquement</p>
        <div className="flex flex-wrap gap-2">
          <Chip label={`📱 ${device}`} />
          <Chip label={`🌐 ${browser}`} />
          <Chip label="💼 Plan Business" />
        </div>
      </div>

      {/* Description textarea */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Décrivez votre problème</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Ex: Ma connexion Instagram ne fonctionne plus depuis hier…"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
        />
      </div>

      {/* AI suggestions */}
      {suggestedFaqs.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-primary" />
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Réponses suggérées par l'IA</p>
          </div>
          {suggestedFaqs.map(faq => {
            const Icon = faq.icon;
            return (
              <div
                key={faq.id}
                className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${faq.iconBg}`}>
                  <Icon size={13} className={faq.iconColor} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-snug">{faq.question}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{faq.answer.substring(0, 100)}…</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!description.trim() || submitted}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {submitted ? '✅ Ticket envoyé !' : <><Send size={14} /> Envoyer le ticket</>}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [query, setQuery] = useState('');
  const [userPlan, setUserPlan] = useState<'Starter' | 'Business' | 'Franchise'>('Business');

  const filteredFaqs = useMemo(() => {
    if (!query.trim()) return HELPDESK_FAQS;
    const q = query.toLowerCase();
    return HELPDESK_FAQS.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.tags.some(t => t.includes(q))
    );
  }, [query]);

  const hasResults = filteredFaqs.length > 0;
  const isFiltering = query.trim().length > 0;

  const whatsappLink = userPlan === 'Starter'
    ? 'https://wa.me/33698765432'
    : 'https://wa.me/33612345678';

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <BookOpen size={22} className="text-primary" /> Guide & Aide
          </PageTitle>
          <PageDescription>
            Tout ce qu'il faut savoir pour tirer le meilleur de Kompilot.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-10">

        {/* ── Hero search bar ── */}
        <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 px-8 py-10 flex flex-col items-center text-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Sparkles size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Comment pouvons-nous vous aider aujourd'hui ?</h2>
            <p className="text-sm text-muted-foreground mt-1.5">Parcourez les guides ou cherchez une réponse rapide.</p>
          </div>
          <div className="w-full max-w-lg relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Ex : connexion LinkedIn, crédits, vidéo IA…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background pl-11 pr-10 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {/* Quick topic chips */}
          {!isFiltering && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Connexion LinkedIn', 'Crédits épuisés', 'Vidéos IA', 'Smart Queue', 'Avis Google'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setQuery(chip)}
                  className="text-xs font-medium rounded-full border border-border bg-background hover:bg-muted hover:border-primary/40 px-3 py-1.5 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Centre d'Aide & Support ── */}
        {!isFiltering && (
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Centre d'Aide & Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DiagnosticPanel />
              <SupportTicketForm />
            </div>
          </section>
        )}

        {/* ── FAQ accordions ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isFiltering
                ? `${filteredFaqs.length} résultat${filteredFaqs.length !== 1 ? 's' : ''} pour "${query}"`
                : 'Questions fréquentes'
              }
            </h2>
            {isFiltering && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-primary hover:underline"
              >
                Voir toutes les questions
              </button>
            )}
          </div>

          {hasResults ? (
            <div className="space-y-2">
              {filteredFaqs.map((faq, i) => (
                <FaqItem key={faq.id} faq={faq} defaultOpen={i === 0 && isFiltering} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Search size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">Aucun résultat pour "{query}"</p>
              <p className="text-xs text-muted-foreground">
                Essayez avec d'autres mots-clés ou posez votre question à l'assistant IA.
              </p>
              <button
                onClick={() => setQuery('')}
                className="text-xs text-primary hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
        </section>

        {/* ── Guide cards (only shown without active search) ── */}
        {!isFiltering && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Guides pratiques — cliquez pour déplier
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {GUIDE_CARDS.map(card => <GuideCard key={card.id} card={card} />)}
            </div>
          </section>
        )}

        {/* ── Support banner ── */}
        <section className="space-y-4">
          {/* Plan selector for demo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Simuler mon plan :</span>
            {(['Starter', 'Business', 'Franchise'] as const).map(plan => (
              <button
                key={plan}
                onClick={() => setUserPlan(plan)}
                className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-all ${
                  userPlan === plan
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {plan}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 px-7 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Besoin d'aide supplémentaire ?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Notre équipe (Marine & Joan) répond en moins de 24h — ou utilisez l'assistant IA en bas à droite.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Conditional WhatsApp button */}
              <div className="flex flex-col items-end gap-1">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 transition-colors shrink-0"
                >
                  💬 {userPlan === 'Starter' ? 'Assistance automatisée WhatsApp' : 'Être aidé en direct sur WhatsApp'}
                  <ExternalLink size={14} />
                </a>
                {userPlan === 'Starter' && (
                  <span className="text-[11px] text-muted-foreground">🤖 Bot d'aide instantané</span>
                )}
              </div>
              <a
                href="mailto:support@kompilot.fr"
                className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity shrink-0"
              >
                Contacter le support <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>

      </PageBody>
    </Page>
  );
}
