/**
 * KompilotShowcasePage — Interactive public demo for Kompilot v2.6
 * Route: /showcase (no auth required)
 * Orchestrates all showcase sub-components.
 */
import React, { useState, useEffect } from 'react';

import ShowcaseLogin from './ShowcaseLogin';
import ShowcaseSidebar from './ShowcaseSidebar';
import ShowcaseHeader from './ShowcaseHeader';
import CreativeFactoryTab from './tabs/CreativeFactoryTab';
import CalendarIATab from './tabs/CalendarIATab';
import DashboardTab from './tabs/DashboardTab';
import LeadProspectingTab from './tabs/LeadProspectingTab';
import ClaudeCoworkTab from './tabs/ClaudeCoworkTab';
import SettingsTab from './tabs/SettingsTab';
import AntiChurnModal from './tabs/AntiChurnModal';

import {
  SECTOR_DATA,
  DEFAULT_CALENDAR_EVENTS,
  DEFAULT_CHECKLIST,
  type Sector,
  type Role,
  type ActiveTab,
  type ImageStyle,
  type PreviewPlatform,
  type CalendarEvent,
  type ChecklistItem,
} from './showcaseData';

export default function KompilotShowcasePage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Global context ────────────────────────────────────────────────────────
  const [sector, setSector] = useState<Sector>('beauty');
  const [role, setRole] = useState<Role>('pro');
  const [activeTab, setActiveTab] = useState<ActiveTab>('creative');

  // ── Creative Factory ──────────────────────────────────────────────────────
  const [imagePrompt, setImagePrompt] = useState('Une photo de détails minimaliste, vue du dessus, tons neutres et épurés');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('flatlay');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [customWatermarkText, setCustomWatermarkText] = useState('KOMPILOT PRO');
  const [generatedPostText, setGeneratedPostText] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('maps');

  // ── Calendar ──────────────────────────────────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(DEFAULT_CALENDAR_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent & { budget: number }>({
    ...DEFAULT_CALENDAR_EVENTS[2],
    budget: 150,
    chat: [
      { sender: 'user', text: 'Génère-moi une campagne ultra-visuelle pour booster les réservations de la Fête des Mères.' },
      { sender: 'claude', text: "Parfait ! J'ai rédigé l'accroche et programmé un visuel d'ambiance premium adapté à votre secteur. Ajustez le budget ci-dessous." },
    ],
  });
  const [assistantDrawerOpen, setAssistantDrawerOpen] = useState(true);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [analyticsView, setAnalyticsView] = useState<'with' | 'without'>('with');

  // ── Lead Prospecting ──────────────────────────────────────────────────────
  const [leadCategory, setLeadCategory] = useState('Coiffeur');
  const [leadCity, setLeadCity] = useState('Paris');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [searchResults, setSearchResults] = useState<{ name: string; phone: string; badge: string }[]>([]);

  // ── Cowork ────────────────────────────────────────────────────────────────
  const [selectedAgent, setSelectedAgent] = useState('copywriter');
  const [sharedCanvas, setSharedCanvas] = useState('👉 [Cliquez sur une tâche ou discutez avec Claude à gauche pour rédiger votre stratégie marketing...]');
  const [coworkMessages] = useState([
    { sender: 'claude' as const, text: 'Bonjour ! Je suis Claude, votre coéquipier de croissance. Quel chantier sémantique lançons-nous aujourd\'hui ?', time: '11:00' },
  ]);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [dashboardAlerts, setDashboardAlerts] = useState({ raidAlert: true, noshowSecured: true, metaAudit: true, newLead: true, apiMaintenance: false });
  const [kycStatus, setKycStatus] = useState('pending');
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignStep, setResignStep] = useState(1);

  // ── Sector sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    const sd = SECTOR_DATA[sector];
    setGeneratedPostText(`✨ ${sd.mamanPromo}\n\n📍 Planifié et optimisé avec l'IA de Kompilot.`);
    setGeneratedImageUrl(sd.defaultImage);
  }, [sector]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleChecklistStep = (id: number) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: true } : item)));
  };

  const handleCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.innerText = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch { /* ignore */ }
  };

  const handleGenerateImage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsGeneratingImage(true);
    setImageError('');
    // Simulate generation delay; use fallback image
    await new Promise((r) => setTimeout(r, 1800));
    setGeneratedImageUrl(SECTOR_DATA[sector].defaultImage);
    setImageError('Modèle d\'ambiance optimisé G.E.O. appliqué');
    setIsGeneratingImage(false);
    toggleChecklistStep(5);
  };

  const handleEventClick = (ev: CalendarEvent) => {
    setSelectedEvent({
      ...ev,
      budget: selectedEvent.id === ev.id ? selectedEvent.budget : 120,
      chat: [
        { sender: 'user', text: `Brief de l'événement : ${ev.title}.` },
        { sender: 'claude', text: `J'ai synchronisé les paramètres de ${SECTOR_DATA[sector].name}. L'accroche marketing et l'image d'ambiance sont prêtes.` },
      ],
    });
    setAssistantDrawerOpen(true);
  };

  const handleValidateCampaign = () => {
    setCalendarEvents((prev) => prev.map((ev) => ev.id === selectedEvent.id ? { ...ev, status: 'confirmed' } : ev));
    setSelectedEvent((prev) => ({ ...prev, status: 'confirmed' }));
    toggleChecklistStep(4);
  };

  const handleLeadSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    setScrapeProgress(10);
    setSearchResults([]);
    const interval = setInterval(() => {
      setScrapeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScraping(false);
          setSearchResults([
            { name: `${leadCategory} Élite ${leadCity}`, phone: '01 42 84 90 12', badge: '⚠️ Avis non répondus' },
            { name: `Maison ${leadCategory} & Co`, phone: '06 12 94 85 01', badge: '❌ Invisible sur ChatGPT' },
            { name: `Atelier ${leadCategory} ${leadCity}`, phone: '01 53 40 12 99', badge: '⚠️ 15 avis ignorés' },
          ]);
          toggleChecklistStep(2);
          toggleChecklistStep(7); // AIO Sync step auto-validated on prospection
          return 100;
        }
        return prev + 30;
      });
    }, 600);
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <ShowcaseLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  // ── Main app shell ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white flex flex-col md:flex-row">
      <ShowcaseSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsLoggedIn(false)} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <ShowcaseHeader sector={sector} setSector={setSector} role={role} setRole={setRole} />

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'creative' && (
            <CreativeFactoryTab
              sector={sector}
              role={role}
              imagePrompt={imagePrompt}
              setImagePrompt={setImagePrompt}
              imageStyle={imageStyle}
              setImageStyle={setImageStyle}
              isGeneratingImage={isGeneratingImage}
              generatedImageUrl={generatedImageUrl}
              imageError={imageError}
              applyWatermark={applyWatermark}
              setApplyWatermark={setApplyWatermark}
              customWatermarkText={customWatermarkText}
              setCustomWatermarkText={setCustomWatermarkText}
              generatedPostText={generatedPostText}
              setGeneratedPostText={setGeneratedPostText}
              previewPlatform={previewPlatform}
              setPreviewPlatform={setPreviewPlatform}
              copySuccess={copySuccess}
              onGenerateImage={handleGenerateImage}
              onCopy={handleCopy}
              onSchedule={() => {
            const isStory = previewPlatform === 'instagram-story' || previewPlatform === 'facebook-story';
            if (isStory) {
              alert(`Story ${previewPlatform === 'instagram-story' ? 'Instagram' : 'Facebook'} publiée avec succès !`);
              toggleChecklistStep(6);
            } else {
              alert('Post planifié sur votre calendrier !');
            }
            toggleChecklistStep(5);
          }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarIATab
              sector={sector}
              calendarEvents={calendarEvents}
              selectedEvent={selectedEvent}
              assistantDrawerOpen={assistantDrawerOpen}
              setAssistantDrawerOpen={setAssistantDrawerOpen}
              onEventClick={handleEventClick}
              onValidate={handleValidateCampaign}
              onBudgetChange={(budget) => setSelectedEvent((prev) => ({ ...prev, budget }))}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              role={role}
              checklist={checklist}
              analyticsView={analyticsView}
              setAnalyticsView={setAnalyticsView}
              onChecklistToggle={(id) => setChecklist((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item))}
            />
          )}

          {activeTab === 'leads' && (
            <LeadProspectingTab
              leadCategory={leadCategory}
              setLeadCategory={setLeadCategory}
              leadCity={leadCity}
              setLeadCity={setLeadCity}
              isScraping={isScraping}
              scrapeProgress={scrapeProgress}
              searchResults={searchResults}
              onSearch={handleLeadSearch}
            />
          )}

          {activeTab === 'cowork' && (
            <ClaudeCoworkTab
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              coworkMessages={coworkMessages}
              sharedCanvas={sharedCanvas}
              setSharedCanvas={setSharedCanvas}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              dashboardAlerts={dashboardAlerts}
              setDashboardAlerts={setDashboardAlerts}
              kycStatus={kycStatus}
              setKycStatus={setKycStatus}
              onOpenResignModal={() => { setResignStep(1); setShowResignModal(true); }}
            />
          )}
        </div>
      </main>

      {showResignModal && (
        <AntiChurnModal
          resignStep={resignStep}
          setResignStep={setResignStep}
          onClose={() => setShowResignModal(false)}
        />
      )}
    </div>
  );
}
