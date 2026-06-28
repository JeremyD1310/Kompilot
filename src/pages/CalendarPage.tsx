import { useState, useMemo, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Button, toast } from '@blinkdotnew/ui';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, ShieldCheck, Recycle, Sparkles } from 'lucide-react';
import { VacationModeModal, type VacationConfig } from '../components/dashboard/VacationModeModal';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { WeekView } from '../components/calendar/WeekView';
import { CreatePostModal } from '../components/calendar/CreatePostModal';
import type { ScheduledPost } from '../components/calendar/CreatePostModal';
import { AIInspirations } from '../components/calendar/AIInspirations';
import { CalendarAIDraftSidebar } from '../components/calendar/CalendarAIDraftSidebar';
import { PermanentContentSection } from '../components/calendar/PermanentContentSection';
import { CalendarEmptyState } from '../components/calendar/CalendarEmptyState';
import { PostPerformancePanel } from '../components/calendar/PostPerformancePanel';
import { MetaCampaignExportPanel } from '../components/calendar/MetaCampaignExportPanel';
import { BulkCalendarModal, type BulkCalendarConfig } from '../components/calendar/BulkCalendarModal';
import { BulkCalendarResultView } from '../components/calendar/BulkCalendarResultView';
import { FlashTutorialButton } from '../components/shared/FlashTutorialButton';
import { CalendarAIBanner } from '../components/calendar/CalendarAIBanner';
import { useEstablishment } from '../context/EstablishmentContext';
import { useUserRole } from '../context/UserRoleContext';
import { useTeamMode } from '../context/TeamModeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { AICopilotPanel } from '../components/shared/AICopilotPanel';
import { SocialTrendsPanel } from '../components/calendar/SocialTrendsPanel';
import { VisualAutoGenerator } from '../components/calendar/VisualAutoGenerator';
import { MobileValidationWidget } from '../components/calendar/MobileValidationWidget';
import { CityCalendarTab } from '../components/calendar/CityCalendarTab';
import { AIContentGeneratorModal } from '../components/ai/AIContentGeneratorModal';
import { GA4CalendarInsights } from '../components/calendar/GA4CalendarInsights';

// Safe date helper — always returns a valid ISO date string "yyyy-MM-DD"
// Using format() with 'yyyy-MM' then appending the day is safe, but we add a try/catch
// to prevent CalendarPage from crashing if date-fns ever throws on an invalid Date
function currentMonthDay(day: string): string {
  try {
    return format(new Date(), 'yyyy-MM-') + day;
  } catch {
    // Fallback to a static date if format() fails
    return `${new Date().getFullYear()}-01-${day}`;
  }
}

const INITIAL_POSTS: ScheduledPost[] = [
  // Semaine 1
  { id: '1', text: '🌸 Lancement de notre offre Printemps — jusqu\'à -30% sur toute la gamme !', channels: ['linkedin', 'instagram', 'facebook'], date: currentMonthDay('02'), time: '09:00', status: 'approved' },
  { id: '2', text: '5 astuces pour augmenter votre chiffre d\'affaires grâce au digital 💡', channels: ['linkedin'], date: currentMonthDay('03'), time: '11:00', status: 'approved' },
  { id: '3', text: 'Nos clients parlent de nous ⭐⭐⭐⭐⭐ — Découvrez les témoignages', channels: ['instagram', 'facebook'], date: currentMonthDay('05'), time: '14:30', status: 'approved' },
  { id: '4', text: 'Comment optimiser votre fiche Google My Business en 2024 🗺️', channels: ['linkedin', 'website'], date: currentMonthDay('07'), time: '10:00', status: 'approved' },
  // Semaine 2
  { id: '5', text: 'Derrière les coulisses de notre atelier — une journée avec notre équipe 📸', channels: ['instagram'], date: currentMonthDay('09'), time: '08:30', status: 'approved' },
  { id: '6', text: 'Webinaire GRATUIT : Digitaliser votre TPE sans budget 🎓 → Inscrivez-vous', channels: ['linkedin', 'facebook', 'website'], date: currentMonthDay('11'), time: '11:00', status: 'approved' },
  { id: '7', text: 'Votre présence en ligne mérite mieux — voici comment on peut vous aider 🚀', channels: ['linkedin'], date: currentMonthDay('12'), time: '16:00', status: 'approved' },
  { id: '8', text: 'Recette du jour : notre secret pour fidéliser vos clients locaux 🤝', channels: ['instagram', 'facebook'], date: currentMonthDay('14'), time: '12:00', status: 'approved' },
  // Semaine 3
  { id: '9', text: 'Nouvelle fonctionnalité disponible — gestion multi-établissements simplifiée ✨', channels: ['linkedin', 'website'], date: currentMonthDay('16'), time: '10:00', status: 'pending' },
  { id: '10', text: 'Les 3 erreurs fatales sur les réseaux sociaux (et comment les éviter) ❌', channels: ['linkedin', 'instagram'], date: currentMonthDay('18'), time: '09:00', status: 'pending' },
  { id: '11', text: 'Flash-promo ce week-end uniquement ! Profitez-en avant lundi 🎁', channels: ['instagram', 'facebook'], date: currentMonthDay('20'), time: '18:00', status: 'approved' },
  { id: '12', text: 'Podcast 🎙️ — Interview : comment ce restaurant a doublé ses réservations en ligne', channels: ['linkedin', 'website'], date: currentMonthDay('21'), time: '11:00', status: 'draft' },
  // Semaine 4
  { id: '13', text: 'Zoom sur notre service phare du mois — et pourquoi vos clients l\'adorent 💬', channels: ['linkedin', 'instagram', 'facebook'], date: currentMonthDay('23'), time: '10:00', status: 'draft' },
  { id: '14', text: 'Bilan mensuel : +42% de portée sur LinkedIn ce mois-ci 📈 → Comment ?', channels: ['linkedin'], date: currentMonthDay('24'), time: '14:00', status: 'draft' },
  { id: '15', text: 'Retour sur notre événement local — merci à tous les participants ! 🙏', channels: ['instagram', 'facebook'], date: currentMonthDay('26'), time: '17:00', status: 'draft' },
  { id: '16', text: 'Conseil du jeudi : pensez à mettre à jour vos horaires sur Google avant les fêtes 📅', channels: ['website', 'linkedin'], date: currentMonthDay('28'), time: '10:00', status: 'draft' },
];

type ViewMode = 'month' | 'week';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>(INITIAL_POSTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [vacationOpen, setVacationOpen] = useState(false);
  const [vacationConfig, setVacationConfig] = useState<VacationConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [prefillText, setPrefillText] = useState<string | undefined>(undefined);
  const { isAdmin, setIsAdmin } = useUserRole();
  const { teamModeEnabled, pendingPosts, creatorName } = useTeamMode();
  const { currentPlan } = useSubscription();
  const { activeEstablishment } = useEstablishment();
  const [aiBannerDismissed, setAiBannerDismissed] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const teamPendingCount = pendingPosts.filter(p => p.status === 'pending').length;
  const isNetwork = currentPlan.hasMultiUser;

  // Bulk calendar state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState<BulkCalendarConfig | null>(null);
  const [bulkResultOpen, setBulkResultOpen] = useState(false);

  const handleBulkGenerate = (config: BulkCalendarConfig) => {
    setBulkConfig(config);
    setBulkResultOpen(true);
  };

  const handleBulkValidateAll = (bulkPosts: ScheduledPost[]) => {
    setPosts(prev => [...prev, ...bulkPosts]);
    toast.success(`🚀 ${bulkPosts.length} posts planifiés sur votre calendrier !`);
    setBulkResultOpen(false);
    setBulkConfig(null);
  };

  const handleBulkPushNetwork = (bulkPosts: ScheduledPost[]) => {
    toast.success(`🏢 Calendrier envoyé en brouillon sur ${3} établissements du réseau !`);
    setBulkResultOpen(false);
    setBulkConfig(null);
  };
  const [smartRepost, setSmartRepost] = useState(() => {
    try { return localStorage.getItem('kompilot_smart_repost') === 'true'; } catch { return false; }
  });
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  // AICopilotPanel is always mounted — it manages its own open/close FAB internally

  // Read URL search params for prefill from UGC scripts or other sources
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill');
    const source = params.get('source');
    if (prefill) {
      setPrefillText(prefill);
      setModalOpen(true);
      // Clear URL params without reload to avoid re-triggering on refresh
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      if (source === 'ugc_script') {
        toast.success('Script UGC chargé !', { description: 'Le script a été pré-rempli dans l\'éditeur.' });
      } else if (source === 'url_to_video') {
        toast.success('Script vidéo chargé !', { description: 'Le script généré depuis l\'URL a été pré-rempli.' });
      }
    }
  }, []);

  const handleSmartRepostToggle = (v: boolean) => {
    setSmartRepost(v);
    try { localStorage.setItem('kompilot_smart_repost', String(v)); } catch { /* noop */ }
    if (v) toast.success('♻️ Recyclage Intelligent activé !', { description: 'L\'IA republiera vos meilleurs contenus intemporels automatiquement.' });
    else toast('♻️ Recyclage Intelligent désactivé.');
  };

  const handlePrev = () => setCurrentDate(prev => viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  const handleNext = () => setCurrentDate(prev => viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // AI Sidebar: track the date focused for AI suggestions (without opening modal)
  const [aiSidebarDate, setAiSidebarDate] = useState<string | null>(null);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setAiSidebarDate(date);
    setPrefillText(undefined);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedDate(undefined);
    setPrefillText(undefined);
    setModalOpen(true);
  };

  const handleUseIdea = (text: string) => {
    setPrefillText(text);
    setSelectedDate(undefined);
    setModalOpen(true);
  };

  // ── Inline / full edit state ───────────────────────────────────────────────
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  const handleEditPost = (updated: ScheduledPost) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleOpenFullEditor = (post: ScheduledPost) => {
    setEditingPost(post);
    setSelectedDate(post.date);
    setPrefillText(post.text);
    setModalOpen(true);
  };

  // When the modal saves, update in-place if editing existing post, else add new
  const handlePostCreated = (post: ScheduledPost) => {
    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...post, id: editingPost.id } : p));
      setEditingPost(null);
    } else {
      setPosts(prev => [...prev, post]);
    }
  };

  const handleApprovePost = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'approved' as const } : p));
  };

  const handleMovePost = (postId: string, newDate: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, date: newDate } : p));
    toast.success('📅 Post déplacé !', { description: `Reprogrammé au ${newDate}` });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // over.id is a date string (yyyy-MM-dd), active.id is a post id
    const newDate = String(over.id);
    // Validate it looks like a date (basic guard)
    if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      handleMovePost(String(active.id), newDate);
    }
  };

  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: fr });
    const start = format(currentDate, 'd MMM', { locale: fr });
    const end = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 6), 'd MMM yyyy', { locale: fr });
    return `${start} – ${end}`;
  };

  const pendingCount = posts.filter(p => p.status === 'pending').length;
  const isEmpty = posts.length === 0;

  // Ref to scroll to first pending post in the calendar grid
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleScrollToPending = () => {
    // Switch to month view so pending posts are visible
    setViewMode('month');
    setCurrentDate(new Date());
    // After render, scroll to first orange (pending) post dot in the calendar
    setTimeout(() => {
      const pendingEl = document.querySelector('[data-status="pending"]') as HTMLElement | null;
      if (pendingEl) {
        pendingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pendingEl.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2');
        setTimeout(() => pendingEl.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2'), 2000);
      } else if (calendarRef.current) {
        calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Keys used for queue slot detection
  const existingPostDates = useMemo(
    () => posts.map(p => `${p.date}@${p.time}`),
    [posts]
  );

  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Calendrier de Publication</PageTitle>
          <PageDescription>Planifiez et gérez vos publications sur tous vos canaux.</PageDescription>
          <FlashTutorialButton featureKey="calendar-bulk" />
        </div>
        <PageActions className="flex flex-wrap items-center gap-2">
          {/* Admin toggle (demo) — hidden on mobile to save space */}
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              isAdmin
                ? 'bg-violet-100 text-violet-700 border-violet-300'
                : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
            }`}
            title="Simuler le rôle administrateur"
          >
            <ShieldCheck size={13} />
            {isAdmin ? 'Admin (actif)' : 'Mode Admin'}
          </button>

          {vacationConfig ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                🌴 Fermeture du {vacationConfig.startDate} au {vacationConfig.endDate}
              </span>
              <Button variant="outline" size="sm" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setVacationConfig(null)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVacationOpen(true)}
              className="hidden sm:flex gap-1.5 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              🏖️ Planifier une fermeture
            </Button>
          )}

          {/* ✨ Bulk calendar hero CTA */}
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white font-extrabold text-sm px-4 py-2.5 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all border-0 animate-pulse hover:animate-none"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">✨ Générer 30 jours en 1 clic</span>
            <span className="sm:hidden">✨ 30 jours IA</span>
          </button>

          <button
            onClick={() => setAiGeneratorOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-card border-2 border-primary/40 text-primary font-bold text-sm px-3 py-2 hover:bg-primary/5 active:scale-[0.98] transition-all"
            title="Générer du contenu avec l'IA"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Générer un post IA</span>
          </button>

          {/* ── Performances Meta globales ── */}
          <MetaCampaignExportPanel
            post={{ id: 'global', text: '', date: new Date().toISOString().slice(0, 10), channels: ['facebook'] }}
            trigger={
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4" /></svg>
                <span className="hidden sm:inline">Meta Ads</span>
              </button>
            }
          />

          <Button onClick={handleCreateNew} className="gap-2 shadow-sm">
            <Plus size={16} /> <span className="hidden sm:inline">Créer une publication</span><span className="sm:hidden">Créer</span>
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-4">
        {/* ── AI Suggestion Banner ── */}
        {!aiBannerDismissed && (
          <CalendarAIBanner
            sector={activeEstablishment?.activity ?? activeEstablishment?.category}
            onCreatePost={(content) => { setPrefillText(content); setModalOpen(true); }}
            onDismiss={() => setAiBannerDismissed(true)}
          />
        )}

        {/* Team mode pending validation banner — admin only */}
        {teamModeEnabled && isAdmin && teamPendingCount > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">🔔</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                {creatorName} a préparé {teamPendingCount} publication{teamPendingCount > 1 ? 's' : ''} — validez-les pour planifier leur diffusion
              </p>
              <p className="text-xs text-amber-700">Cliquez sur un post orange dans le calendrier pour valider ou demander une modification.</p>
            </div>
            <button
              onClick={handleScrollToPending}
              className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600 transition-colors shrink-0 cursor-pointer"
            >
              Voir les posts
            </button>
          </div>
        )}

        {/* Fallback admin banner (team mode off) */}
        {!teamModeEnabled && isAdmin && pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              <strong>{pendingCount} publication{pendingCount > 1 ? 's' : ''}</strong> en attente de validation.
              Cliquez sur "Approuver" directement dans le calendrier.
            </p>
          </div>
        )}

        {/* ── Smart Re-post toggle ── */}
        <div className={`flex items-start gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 ${
          smartRepost
            ? 'border-emerald-300/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/60'
            : 'border-border bg-card'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            smartRepost ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            <Recycle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-foreground">
                Recyclage Intelligent (Smart Re-post) ♻️
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={smartRepost}
                onClick={() => handleSmartRepostToggle(!smartRepost)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                  smartRepost ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${smartRepost ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {smartRepost
                ? <span className="text-emerald-700 font-medium">✅ Actif — L'IA republie automatiquement vos meilleurs contenus intemporels pendant vos semaines chargées pour maintenir votre visibilité au top.</span>
                : "L'IA republie automatiquement vos meilleurs contenus intemporels pendant vos semaines chargées pour maintenir votre visibilité au top."
              }
            </p>
            {smartRepost && (
              <div className="flex flex-wrap gap-2 mt-3">
                {['🌸 Offre Printemps 2024', '💡 5 astuces digitales', '⭐ Témoignage client'].map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1">
                    ♻️ {tag}
                  </span>
                ))}
                <span className="text-[10px] text-emerald-600/70 self-center">→ Planifiés pour republication</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 📲 Déléguer la validation au Copilote (Mode SMS/Push) ── */}
        <MobileValidationWidget />

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>Aujourd'hui</Button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9 rounded-none border-r border-border">
                <ChevronLeft size={16} />
              </Button>
              <span className="px-4 text-sm font-semibold min-w-[180px] text-center capitalize">{getTitle()}</span>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9 rounded-none border-l border-border">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('month')} className="rounded-none gap-1.5 h-9">
              <CalendarDays size={15} /> Mois
            </Button>
            <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')} className="rounded-none gap-1.5 h-9 border-l border-border">
              <CalendarRange size={15} /> Semaine
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="font-medium">Canaux :</span>
          {[
            { color: 'bg-primary/80', label: 'Blog' },
            { color: 'bg-blue-600',   label: 'LinkedIn' },
            { color: 'bg-pink-500',   label: 'Instagram' },
            { color: 'bg-foreground', label: 'TikTok' },
            { color: 'bg-blue-500',   label: 'Facebook' },
            { color: 'bg-orange-500', label: 'Google' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />{label}
            </span>
          ))}
          <span className="ml-2 font-medium">Statuts :</span>
          {[
            { color: 'bg-muted-foreground/30', label: 'Brouillon' },
            { color: 'bg-orange-400',           label: 'En attente' },
            { color: 'bg-green-500',            label: 'Approuvé' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />{label}
            </span>
          ))}
        </div>

        {/* Main layout: calendar + AI sidebar — stacks vertically on mobile */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            {isEmpty && !isCreating ? (
              <CalendarEmptyState onCreatePost={() => { setIsCreating(true); handleCreateNew(); }} />
            ) : (
              viewMode === 'month' ? (
                <DndContext onDragEnd={handleDragEnd}>
                  <CalendarGrid
                    currentMonth={currentDate}
                    posts={posts}
                    onDayClick={handleDayClick}
                    onApprovePost={handleApprovePost}
                    onMovePost={handleMovePost}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onOpenFullEditor={handleOpenFullEditor}
                  />
                </DndContext>
              ) : (
                <WeekView
                  currentDate={currentDate}
                  posts={posts}
                  onDayClick={handleDayClick}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  onOpenFullEditor={handleOpenFullEditor}
                />
              )
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{posts.length} publication(s) planifiée(s)</span>
              <span className="text-xs flex items-center gap-1">
                <Sparkles size={11} className="text-primary/60" />
                Cliquez sur un jour pour planifier + suggestions IA
              </span>
            </div>
            <PermanentContentSection />
          </div>

          {/* AI sidebar — date-aware drafting + sector inspirations */}
          <div className="w-full lg:w-72 lg:shrink-0 flex flex-col gap-4">
            <CalendarAIDraftSidebar
              selectedDate={aiSidebarDate}
              existingPosts={posts}
              onSchedule={(text, date) => {
                setPrefillText(text);
                setSelectedDate(date);
                setModalOpen(true);
              }}
            />
            {/* 📊 Google Analytics 4 — Trafic & conversions Meta (Agency) */}
            <GA4CalendarInsights
              dateRange="30d"
              isAgency={currentPlan.unlimited}
            />

            {/* 🔥 Tendances du Moment — AI Social Trends widget */}
            <SocialTrendsPanel
              onCreatePost={(text) => { setPrefillText(text); setModalOpen(true); }}
              sector={activeEstablishment?.activity ?? activeEstablishment?.category}
            />
            <AIInspirations onUseIdea={handleUseIdea} />
            {/* ✨ Visuels IA automatiques — Canva-style generator */}
            <VisualAutoGenerator
              angles={posts.slice(0, 3).map(p => p.text)}
              brandColor="#0D9488"
              businessName={activeEstablishment?.name}
              onSelectVisual={(_url) => {
                setPrefillText(prefillText ?? '');
                toast.success('Visuel sélectionné !', { description: 'Ouvrez "Créer une publication" pour l\'utiliser.' });
              }}
            />
            {/* 🗓️ Calendrier de la Ville — micro-événements + opportunités IA */}
            <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(135deg, rgba(99,89,248,.08) 0%, transparent 100%)' }}>
                <p style={{ fontWeight: 800, fontSize: '.88rem', color: 'hsl(var(--foreground))', margin: 0 }}>
                  🗓️ Calendrier de la Ville
                </p>
                <p style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  Événements locaux → opportunités de posts
                </p>
              </div>
              <div style={{ padding: '14px 14px', maxHeight: 480, overflowY: 'auto' }}>
                <CityCalendarTab
                  city={activeEstablishment?.city ?? 'Votre ville'}
                  onUsePost={(text) => { setPrefillText(text); setModalOpen(true); }}
                />
              </div>
            </div>
          </div>
        </div>
      </PageBody>

      <CreatePostModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefillText(undefined); setEditingPost(null); }}
        defaultDate={selectedDate}
        defaultText={prefillText}
        existingPostDates={existingPostDates}
        onCreated={handlePostCreated}
        editingPost={editingPost}
      />

      <VacationModeModal
        open={vacationOpen}
        onClose={() => setVacationOpen(false)}
        onActivate={cfg => { setVacationConfig(cfg); setVacationOpen(false); }}
      />

      {/* ── Bulk Calendar Wizard ── */}
      <BulkCalendarModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onGenerate={handleBulkGenerate}
      />

      {/* ── Bulk Calendar Result View (full-screen) ── */}
      {bulkResultOpen && bulkConfig && (
        <BulkCalendarResultView
          config={bulkConfig}
          onValidateAll={handleBulkValidateAll}
          onPushToNetwork={handleBulkPushNetwork}
          onClose={() => { setBulkResultOpen(false); setBulkConfig(null); }}
          isNetwork={isNetwork}
        />
      )}

      {/* AI Copilot — manages its own FAB + chat panel */}
      <AICopilotPanel context="calendar" />

      {/* AI Content Generator modal */}
      <AIContentGeneratorModal
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onUseText={text => {
          setPrefillText(text);
          setModalOpen(true);
        }}
      />
    </Page>
  );
}
