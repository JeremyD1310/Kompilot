/**
 * demoMockData.ts — Realistic mock data for every table the dashboard reads.
 *
 * Used by demoDbProxy.ts to return plausible data when blink.db is intercepted
 * on demo.kompilot.fr. All data is fictional but structurally valid.
 */

// ── Posts / Scheduled Posts ─────────────────────────────────────────────────

export const MOCK_POSTS = [
  { id: 'post-1', userId: 'demo-user-kompilot-test', title: '🍕 Plat du jour : Tajine d\'agneau confit', content: 'Notre chef vous propose un tajine d\'agneau confit aux abricots et amandes. Disponible ce midi et ce soir. Réservez au 04 XX XX XX XX.', status: 'published', scheduledAt: null, createdAt: '2026-07-15T10:00:00.000Z' },
  { id: 'post-2', userId: 'demo-user-kompilot-test', title: '🏡 Nouvelle propriété disponible à Bordeaux', content: 'Magnifique T3 de 85m² avec jardin privatif dans le quartier des Chartrons. Prix : 385 000€. Visite virtuelle disponible.', status: 'published', scheduledAt: null, createdAt: '2026-07-12T14:30:00.000Z' },
  { id: 'post-3', userId: 'demo-user-kompilot-test', title: '✨ Soldes printemps — jusqu\'à -40%', content: 'Profitez de nos soldes exceptionnelles sur toute la collection printemps-été. Offre valable du 15 juin au 15 juillet.', status: 'published', scheduledAt: null, createdAt: '2026-07-10T09:15:00.000Z' },
  { id: 'post-4', userId: 'demo-user-kompilot-test', title: '🎉 5ème anniversaire de notre établissement', content: 'Venez fêter avec nous ! Animation, surprises et offres exceptionnelles tout le week-end.', status: 'published', scheduledAt: null, createdAt: '2026-07-08T16:00:00.000Z' },
  { id: 'post-5', userId: 'demo-user-kompilot-test', title: '💬 Témoignage client de la semaine', content: '"Service impeccable et équipe très réactive !" — Thomas R., client fidèle depuis 2 ans.', status: 'published', scheduledAt: null, createdAt: '2026-07-05T11:45:00.000Z' },
  { id: 'post-6', userId: 'demo-user-kompilot-test', title: '📅 Atelier découverte ce samedi — Places limitées', content: 'Participez à notre atelier découverte gratuit. Inscription obligatoire places limitées à 20 participants.', status: 'draft', scheduledAt: '2026-07-26T10:00:00.000Z', createdAt: '2026-07-18T08:00:00.000Z' },
  { id: 'post-7', userId: 'demo-user-kompilot-test', title: '🌟 Offre partenaire exclusive — Été 2026', content: 'Nos partenaires bénéficient de -20% supplémentaires sur tous les services premium cet été.', status: 'draft', scheduledAt: '2026-08-01T09:00:00.000Z', createdAt: '2026-07-17T13:20:00.000Z' },
];

export const MOCK_SCHEDULED_POSTS = [
  { id: 'sp-1', userId: 'demo-user-kompilot-test', textContent: '📅 Atelier découverte ce samedi — Places limitées', imageUrl: '', scheduledAt: '2026-07-26T10:00:00.000Z', channels: '["instagram","facebook"]', status: 'scheduled', createdAt: '2026-07-18T08:00:00.000Z', impressions: 0, shares: 0, comments: 0, clicks: 0, reach: 0, engagementRate: 0, ctr: 0 },
  { id: 'sp-2', userId: 'demo-user-kompilot-test', textContent: '🌟 Offre partenaire exclusive — Été 2026', imageUrl: '', scheduledAt: '2026-08-01T09:00:00.000Z', channels: '["linkedin"]', status: 'scheduled', createdAt: '2026-07-17T13:20:00.000Z', impressions: 0, shares: 0, comments: 0, clicks: 0, reach: 0, engagementRate: 0, ctr: 0 },
];

// ── Messages / Inbox ───────────────────────────────────────────────────────

export const MOCK_MESSAGES = [
  { id: 'msg-1', userId: 'demo-user-kompilot-test', senderName: 'Sophie Marchand', senderEmail: 'sophie.m@example.com', subject: 'Demande de collaboration créative', body: 'Bonjour ! Je suis créatrice de contenu et j\'adorerais collaborer avec vous sur un projet photo/vidéo. Mon audience Instagram compte 15K followers dans le lifestyle. Seriez-vous intéressé ?', isRead: false, isArchived: false, isStarred: true, createdAt: '2026-07-19T09:14:00.000Z' },
  { id: 'msg-2', userId: 'demo-user-kompilot-test', senderName: 'Arnaud Petit', senderEmail: 'arnaud.p@startup.io', subject: 'Informations sur vos offres Pro', body: 'Bonjour, je gère une startup de 5 personnes et nous cherchons à centraliser notre présence en ligne. Pouvez-vous me donner plus d\'informations sur vos offres Pro et Agency ?', isRead: false, isArchived: false, isStarred: false, createdAt: '2026-07-19T11:32:00.000Z' },
  { id: 'msg-3', userId: 'demo-user-kompilot-test', senderName: 'Marie Lefebvre', senderEmail: 'marie.lefebvre@corp.fr', subject: 'Retour sur votre dernier post LinkedIn', body: 'Votre publication sur les tendances digitales était vraiment très pertinente ! J\'aimerais en discuter avec vous lors d\'un éventuel call.', isRead: true, isArchived: false, isStarred: false, createdAt: '2026-07-18T16:55:00.000Z' },
  { id: 'msg-4', userId: 'demo-user-kompilot-test', senderName: 'Pierre Durand', senderEmail: 'p.durand@gmail.com', subject: 'Réservation événement privé', body: 'Bonjour, je souhaiterais réserver votre espace pour un événement privé le 15 août pour environ 30 personnes. Merci de me recontacter.', isRead: true, isArchived: false, isStarred: false, createdAt: '2026-07-17T10:20:00.000Z' },
];

// ── Establishments ──────────────────────────────────────────────────────────

export const MOCK_ESTABLISHMENTS = [
  {
    id: 'est-1',
    userId: 'demo-user-kompilot-test',
    name: 'Le Petit Bistro',
    activity: 'Restaurant',
    city: 'La Rochelle',
    aiCreditsUsed: 12,
    aiCreditsLimit: 9999,
    logoUrl: '',
    description: 'Restaurant bistronomique au cœur de La Rochelle. Cuisine française traditionnelle revisitée avec des produits frais et locaux.',
    website: 'https://lepetitbistro-lr.fr',
    phone: '05 46 00 00 00',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2026-07-15T10:00:00.000Z',
    bookingUrl: 'https://lepetitbistro-lr.fr/reservation',
    siret: '12345678901234',
    googleMapsUrl: 'https://maps.google.com/?cid=123456789',
  },
];

// ── Reviews ─────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS_DATA = [
  { id: 'rev-1', author: 'Thomas R.', rating: 5, text: 'Service impeccable et équipe très réactive ! Je recommande vivement à toutes les petites entreprises qui veulent booster leur présence en ligne.', date: 'Il y a 2 jours', source: 'google', replied: false },
  { id: 'rev-2', author: 'Camille B.', rating: 4, text: 'Très bon outil dans l\'ensemble. L\'interface est intuitive et les résultats sont au rendez-vous.', date: 'Il y a 5 jours', source: 'google', replied: false },
  { id: 'rev-3', author: 'Julien M.', rating: 5, text: 'Grâce à Kompilot, notre fiche Google est passée de 3,8 à 4,6 étoiles en 3 mois. Incroyable !', date: 'Il y a 8 jours', source: 'google', replied: true },
  { id: 'rev-4', author: 'Sophie L.', rating: 3, text: 'Bon produit mais l\'onboarding pourrait être un peu plus guidé. L\'équipe support a été très réactive.', date: 'Il y a 12 jours', source: 'google', replied: true },
  { id: 'rev-5', author: 'Marc D.', rating: 5, text: 'Le meilleur investissement de l\'année pour notre restaurant. On gère tout depuis un seul tableau de bord.', date: 'Il y a 15 jours', source: 'google', replied: false },
];

// ── Daily Analytics ─────────────────────────────────────────────────────────

export const MOCK_DAILY_ANALYTICS = [
  { id: 'da-1', establishmentId: 'est-1', userId: 'demo-user-kompilot-test', snapshotDate: '2026-07-19', geoScore: 78, unhandledReviews: 2, postsPublished: 1, reviewsHandled: 3, smsSent: 0, localVisibility: 82, missingKeywords: '[]', noshowRevenueCents: 0, createdAt: '2026-07-19T00:00:00.000Z' },
  { id: 'da-2', establishmentId: 'est-1', userId: 'demo-user-kompilot-test', snapshotDate: '2026-07-18', geoScore: 76, unhandledReviews: 1, postsPublished: 2, reviewsHandled: 4, smsSent: 5, localVisibility: 80, missingKeywords: '[]', noshowRevenueCents: 1500, createdAt: '2026-07-18T00:00:00.000Z' },
  { id: 'da-3', establishmentId: 'est-1', userId: 'demo-user-kompilot-test', snapshotDate: '2026-07-17', geoScore: 74, unhandledReviews: 3, postsPublished: 0, reviewsHandled: 2, smsSent: 3, localVisibility: 78, missingKeywords: '["brunch","terrasse"]', noshowRevenueCents: 2500, createdAt: '2026-07-17T00:00:00.000Z' },
];

// ── Onboarding Profiles ─────────────────────────────────────────────────────

export const MOCK_ONBOARDING = [
  { id: 'ob-1', userId: 'demo-user-kompilot-test', sector: 'restauration', objective: 'visibility', createdAt: '2024-01-15T10:00:00.000Z' },
];

// ── User Activity Logs ──────────────────────────────────────────────────────

export const MOCK_ACTIVITY_LOGS = [
  { id: 'al-1', userId: 'demo-user-kompilot-test', actionType: 'auth_login', actionCategory: 'auth', description: 'Login via demo domain auto-login', metadata: '{}', createdAt: '2026-07-19T07:00:00.000Z' },
  { id: 'al-2', userId: 'demo-user-kompilot-test', actionType: 'dashboard_view', actionCategory: 'navigation', description: 'Dashboard loaded', metadata: '{}', createdAt: '2026-07-19T07:01:00.000Z' },
  { id: 'al-3', userId: 'demo-user-kompilot-test', actionType: 'post_published', actionCategory: 'content', description: 'Post published: Plat du jour', metadata: '{"platform":"instagram"}', createdAt: '2026-07-15T10:00:00.000Z' },
];

// ── Credit Transactions ─────────────────────────────────────────────────────

export const MOCK_CREDIT_TRANSACTIONS = [
  { id: 'ct-1', userId: 'demo-user-kompilot-test', type: 'consumption', actionType: 'text_generation', creditsDelta: -1, balanceAfter: 9987, description: 'AI post generation', createdAt: '2026-07-15T10:00:00.000Z' },
  { id: 'ct-2', userId: 'demo-user-kompilot-test', type: 'consumption', actionType: 'review_reply', creditsDelta: -1, balanceAfter: 9988, description: 'AI review reply', createdAt: '2026-07-14T14:00:00.000Z' },
  { id: 'ct-3', userId: 'demo-user-kompilot-test', type: 'consumption', actionType: 'image_generation', creditsDelta: -2, balanceAfter: 9989, description: 'AI image for post', createdAt: '2026-07-12T09:00:00.000Z' },
];

// ── Notifications ───────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS = [
  { id: 'notif-1', userId: 'demo-user-kompilot-test', title: 'Nouvel avis Google', body: 'Thomas R. a laissé un avis 5 étoiles sur votre fiche Google.', type: 'review', url: '/reviews', status: 'sent', createdAt: '2026-07-17T10:00:00.000Z' },
  { id: 'notif-2', userId: 'demo-user-kompilot-test', title: 'Publication réussie', body: 'Votre post "Plat du jour" a été publié sur Instagram avec succès.', type: 'post', url: '/calendrier', status: 'sent', createdAt: '2026-07-15T10:05:00.000Z' },
  { id: 'notif-3', userId: 'demo-user-kompilot-test', title: 'Score GEO en hausse', body: 'Votre score de visibilité locale est passé de 64 à 78 (+22%).', type: 'geo', url: '/geo', status: 'sent', createdAt: '2026-07-14T08:00:00.000Z' },
];

// ── Instant Form Configs (Calendly / HighLevel / HubSpot) ──────────────────

export const MOCK_INSTANT_FORM_CONFIGS = [
  { id: 'ifcfg-1', userId: 'demo-user-kompilot-test', formId: '1234567890123456', formName: 'RDV Gratuit — Restaurant', pageId: 'page-demo-001', schedulingProvider: 'calendly', schedulingUrl: 'https://calendly.com/le-petit-bistro/30min', schedulingApiKey: '', autoConfirm: 1, webhookVerifyToken: 'ifv_demo_token_1', isActive: 1, totalLeads: 34, totalAppointments: 21, lastSyncAt: '2026-07-19T14:30:00.000Z', createdAt: '2026-06-01T10:00:00.000Z', updatedAt: '2026-07-19T14:30:00.000Z' },
  { id: 'ifcfg-2', userId: 'demo-user-kompilot-test', formId: '9876543210123456', formName: 'Consultation Gratuite', pageId: 'page-demo-002', schedulingProvider: 'highlevel', schedulingUrl: 'https://app.gohiphlevel.com/widget/book/abc123', schedulingApiKey: '', autoConfirm: 0, webhookVerifyToken: 'ifv_demo_token_2', isActive: 1, totalLeads: 18, totalAppointments: 12, lastSyncAt: '2026-07-18T09:00:00.000Z', createdAt: '2026-05-15T10:00:00.000Z', updatedAt: '2026-07-18T09:00:00.000Z' },
  { id: 'ifcfg-3', userId: 'demo-user-kompilot-test', formId: '5555666677778888', formName: 'Prise de RDV Immobilier', pageId: 'page-demo-003', schedulingProvider: 'hubspot', schedulingUrl: 'https://meetings.hubspot.com/agent-demo', schedulingApiKey: '', autoConfirm: 1, webhookVerifyToken: 'ifv_demo_token_3', isActive: 1, totalLeads: 9, totalAppointments: 6, lastSyncAt: '2026-07-17T16:00:00.000Z', createdAt: '2026-04-20T10:00:00.000Z', updatedAt: '2026-07-17T16:00:00.000Z' },
];

// ── Instant Form Appointments (synced from Calendly / HighLevel / HubSpot) ──

export const MOCK_INSTANT_FORM_APPOINTMENTS = [
  { id: 'appt-001', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-1', leadName: 'Sophie Martin', leadEmail: 'sophie.m@gmail.com', leadPhone: '+33612345678', formData: '{}', appointmentStatus: 'confirmed', schedulingUrl: 'https://calendly.com/le-petit-bistro/30min', provider: 'calendly', providerEventId: 'cal_evt_001', metaLeadId: 'ml_001', syncedAt: '2026-07-19T10:00:00.000Z', createdAt: '2026-07-19T10:00:00.000Z' },
  { id: 'appt-002', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-1', leadName: 'Thomas Dubois', leadEmail: 'thomas.d@outlook.fr', leadPhone: '+33698765432', formData: '{}', appointmentStatus: 'completed', schedulingUrl: 'https://calendly.com/le-petit-bistro/30min', provider: 'calendly', providerEventId: 'cal_evt_002', metaLeadId: 'ml_002', syncedAt: '2026-07-18T14:00:00.000Z', createdAt: '2026-07-18T14:00:00.000Z' },
  { id: 'appt-003', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-1', leadName: 'Camille Laurent', leadEmail: 'camille.l@yahoo.fr', leadPhone: '+33645678901', formData: '{}', appointmentStatus: 'pending', schedulingUrl: '', provider: 'calendly', providerEventId: '', metaLeadId: 'ml_003', syncedAt: '2026-07-17T09:00:00.000Z', createdAt: '2026-07-17T09:00:00.000Z' },
  { id: 'appt-004', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-2', leadName: 'Julien Moreau', leadEmail: 'julien.m@proton.me', leadPhone: '+33656789012', formData: '{}', appointmentStatus: 'confirmed', schedulingUrl: 'https://app.gohiphlevel.com/widget/book/abc123', provider: 'highlevel', providerEventId: 'hl_evt_001', metaLeadId: 'ml_004', syncedAt: '2026-07-18T11:00:00.000Z', createdAt: '2026-07-18T11:00:00.000Z' },
  { id: 'appt-005', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-2', leadName: 'Amélie Bernard', leadEmail: 'amelie.b@gmail.com', leadPhone: '+33667890123', formData: '{}', appointmentStatus: 'confirmed', schedulingUrl: 'https://app.gohiphlevel.com/widget/book/abc123', provider: 'highlevel', providerEventId: 'hl_evt_002', metaLeadId: 'ml_005', syncedAt: '2026-07-16T15:00:00.000Z', createdAt: '2026-07-16T15:00:00.000Z' },
  { id: 'appt-006', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-3', leadName: 'Pierre Lefevre', leadEmail: 'pierre.l@entreprise.fr', leadPhone: '+33678901234', formData: '{}', appointmentStatus: 'cancelled', schedulingUrl: 'https://meetings.hubspot.com/agent-demo', provider: 'hubspot', providerEventId: 'hs_evt_001', metaLeadId: 'ml_006', syncedAt: '2026-07-15T10:00:00.000Z', createdAt: '2026-07-15T10:00:00.000Z' },
  { id: 'appt-007', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-1', leadName: 'Marie Dupont', leadEmail: 'marie.d@live.fr', leadPhone: '+33689012345', formData: '{}', appointmentStatus: 'confirmed', schedulingUrl: 'https://calendly.com/le-petit-bistro/30min', provider: 'calendly', providerEventId: 'cal_evt_003', metaLeadId: 'ml_007', syncedAt: '2026-07-14T13:00:00.000Z', createdAt: '2026-07-14T13:00:00.000Z' },
  { id: 'appt-008', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-3', leadName: 'Lucas Petit', leadEmail: 'lucas.p@gmail.com', leadPhone: '+33690123456', formData: '{}', appointmentStatus: 'completed', schedulingUrl: 'https://meetings.hubspot.com/agent-demo', provider: 'hubspot', providerEventId: 'hs_evt_002', metaLeadId: 'ml_008', syncedAt: '2026-07-13T09:00:00.000Z', createdAt: '2026-07-13T09:00:00.000Z' },
  { id: 'appt-009', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-2', leadName: 'Léa Roux', leadEmail: 'lea.r@orange.fr', leadPhone: '+33601234567', formData: '{}', appointmentStatus: 'confirmed', schedulingUrl: 'https://app.gohiphlevel.com/widget/book/abc123', provider: 'highlevel', providerEventId: 'hl_evt_003', metaLeadId: 'ml_009', syncedAt: '2026-07-12T16:00:00.000Z', createdAt: '2026-07-12T16:00:00.000Z' },
  { id: 'appt-010', userId: 'demo-user-kompilot-test', formConfigId: 'ifcfg-1', leadName: 'Nicolas Garnier', leadEmail: 'nicolas.g@free.fr', leadPhone: '+33611223344', formData: '{}', appointmentStatus: 'pending', schedulingUrl: '', provider: 'calendly', providerEventId: '', metaLeadId: 'ml_010', syncedAt: '2026-07-11T10:00:00.000Z', createdAt: '2026-07-11T10:00:00.000Z' },
];

// ── GEO Visibility Trackers ─────────────────────────────────────────────────
export const MOCK_GEO_VISIBILITY_TRACKERS = [
  {
    id: 'geo-tracker-1',
    userId: 'demo-user-kompilot-test',
    establishmentId: 'est-1',
    brandName: 'Le Petit Bistro',
    domainUrl: 'lepetitbistro-lr.fr',
    naturalQueries: '["meilleur restaurant La Rochelle","où manger à La Rochelle","bistronomique La Rochelle","restaurant terrasse La Rochelle","restaurant familial La Rochelle"]',
    enginesToCheck: '["openai","claude","perplexity","gemini"]',
    checkFrequency: 'weekly',
    isActive: 1,
    lastCheckAt: '2026-07-18T08:00:00.000Z',
    overallVisibilityScore: 62,
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-07-18T08:00:00.000Z',
  },
];

export const MOCK_GEO_LLM_RESULTS = [
  { id: 'geo-r-1', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'meilleur restaurant La Rochelle', engine: 'openai', responseText: 'Parmi les restaurants les plus recommandés à La Rochelle, on trouve Le Petit Bistro, connu pour sa cuisine bistronomique...', brandMentioned: 1, brandPosition: 2, urlCited: 1, urlCitedText: 'lepetitbistro-lr.fr', sentiment: 'positive', tokensUsed: 342, responseTimeMs: 1200, checkedAt: '2026-07-18T08:00:00.000Z' },
  { id: 'geo-r-2', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'où manger à La Rochelle', engine: 'claude', responseText: 'Pour un repas à La Rochelle, je recommande plusieurs options dont Le Petit Bistro pour la cuisine bistronomique...', brandMentioned: 1, brandPosition: 1, urlCited: 1, urlCitedText: 'lepetitbistro-lr.fr', sentiment: 'positive', tokensUsed: 289, responseTimeMs: 890, checkedAt: '2026-07-18T08:01:00.000Z' },
  { id: 'geo-r-3', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'bistronomique La Rochelle', engine: 'perplexity', responseText: 'La scène bistronomique de La Rochelle comprend Le Petit Bistro, qui propose une cuisine française traditionnelle revisitée...', brandMentioned: 1, brandPosition: 3, urlCited: 0, urlCitedText: '', sentiment: 'positive', tokensUsed: 456, responseTimeMs: 2100, checkedAt: '2026-07-18T08:02:00.000Z' },
  { id: 'geo-r-4', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'restaurant terrasse La Rochelle', engine: 'gemini', responseText: 'Voici les restaurants avec terrasse à La Rochelle recommandés...', brandMentioned: 0, brandPosition: null, urlCited: 0, urlCitedText: '', sentiment: 'neutral', tokensUsed: 198, responseTimeMs: 650, checkedAt: '2026-07-18T08:03:00.000Z' },
  { id: 'geo-r-5', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'restaurant familial La Rochelle', engine: 'openai', responseText: 'Les restaurants familiaux de La Rochelle incluent...', brandMentioned: 0, brandPosition: null, urlCited: 0, urlCitedText: '', sentiment: 'neutral', tokensUsed: 267, responseTimeMs: 1100, checkedAt: '2026-07-18T08:04:00.000Z' },
  { id: 'geo-r-6', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'meilleur restaurant La Rochelle', engine: 'claude', responseText: 'Le Petit Bistro se distingue par son ambiance chaleureuse et sa cuisine de qualité...', brandMentioned: 1, brandPosition: 1, urlCited: 1, urlCitedText: 'lepetitbistro-lr.fr', sentiment: 'positive', tokensUsed: 312, responseTimeMs: 920, checkedAt: '2026-07-11T08:00:00.000Z' },
  { id: 'geo-r-7', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'où manger à La Rochelle', engine: 'perplexity', responseText: 'Pour manger à La Rochelle, plusieurs établissements se distinguent...', brandMentioned: 1, brandPosition: 4, urlCited: 0, urlCitedText: '', sentiment: 'positive', tokensUsed: 380, responseTimeMs: 1800, checkedAt: '2026-07-11T08:01:00.000Z' },
  { id: 'geo-r-8', trackerId: 'geo-tracker-1', userId: 'demo-user-kompilot-test', queryText: 'bistronomique La Rochelle', engine: 'gemini', responseText: 'La Rochelle offre une scène bistronomique diversifiée avec des restaurants comme...', brandMentioned: 1, brandPosition: 2, urlCited: 1, urlCitedText: 'lepetitbistro-lr.fr', sentiment: 'positive', tokensUsed: 245, responseTimeMs: 720, checkedAt: '2026-07-11T08:02:00.000Z' },
];

// ── AI Directories ──────────────────────────────────────────────────────────
export const MOCK_AI_DIRECTORIES = [
  { id: 'dir-1', name: 'Google Business Profile', description: 'Fiche officielle Google — source primaire pour les réponses locales des IA.', domainAuthority: 98, category: 'Annuaires Généraux', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — Restaurant bistronomique au cœur de La Rochelle. Cuisine française traditionnelle revisitée avec des produits frais et locaux. Terrasse ouverte, parking privé. Réservation en ligne.', actionUrl: 'https://business.google.com' },
  { id: 'dir-2', name: 'TripAdvisor', description: 'Référence mondiale pour les avis restaurants — cité par tous les LLM.', domainAuthority: 93, category: 'Annuaires Généraux', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — Restaurant bistronomique à La Rochelle. Cuisine française créative avec produits locaux. Ambiance chaleureuse, service impeccable. Note moyenne 4.5/5.', actionUrl: 'https://tripadvisor.com' },
  { id: 'dir-3', name: 'Pages Jaunes', description: 'Annuaire historique français — source de référence pour les LLM sur le marché local.', domainAuthority: 85, category: 'Annuaires Généraux', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro - Restaurant à La Rochelle (17000). Cuisine bistronomique française. Terrasse, parking, carte végétarienne disponible.', actionUrl: 'https://pagesjaunes.fr' },
  { id: 'dir-4', name: 'LaFourchette / TheFork', description: 'Plateforme de réservation restaurant majeure — données structurées exploitées par les IA.', domainAuthority: 82, category: 'Annuaires Sectoriels', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro La Rochelle — Réservez votre table. Cuisine bistronomique française, menu du midi à 19€. Terrasse privée, idéal couples et familles.', actionUrl: 'https://lafourchette.com' },
  { id: 'dir-5', name: 'Yelp', description: 'Plateforme de recommandations citée par ChatGPT et Perplexity.', domainAuthority: 88, category: 'Annuaires Généraux', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro - Bistronomique - La Rochelle, Charente-Maritime. Reviews: 4.5 stars. $$ - French cuisine, locally sourced, terrace available.', actionUrl: 'https://yelp.com' },
  { id: 'dir-6', name: 'OpenStreetMap / OSM', description: 'Base de données géospatiale open-source utilisée par de nombreux services IA pour la géolocalisation.', domainAuthority: 75, category: 'Bases de Données IA', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — Restaurant, cuisine française bistronomique, terrasse, 12 Rue du Port, La Rochelle.', actionUrl: 'https://openstreetmap.org' },
  { id: 'dir-7', name: 'Wikidata', description: 'Base de connaissances structurée — source directe pour les entités nommées dans les réponses IA.', domainAuthority: 96, category: 'Bases de Données IA', submissionStatus: 'not_submitted', optimizedDescription: 'Le Petit Bistro (Q000001) — restaurant bistronomique français situé à La Rochelle, Charente-Maritime, Nouvelle-Aquitaine. Spécialité: cuisine française traditionnelle revisitée.', actionUrl: 'https://wikidata.org' },
  { id: 'dir-8', name: 'Foursquare / Swarm', description: 'Données de lieu citées par Siri, Snapchat et certains moteurs IA.', domainAuthority: 72, category: 'Annuaires Généraux', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — French Bistro in La Rochelle. Known for: terrine de campagne, crème brûlée, local wines.', actionUrl: 'https://foursquare.com' },
  { id: 'dir-9', name: 'Waze / Google Maps POI', description: 'Points d\'intérêt dans les systèmes de navigation — données exploitées par les assistants vocaux IA.', domainAuthority: 95, category: 'Bases de Données IA', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — Restaurant bistronomique, La Rochelle. Horaires: Mar-Sam 12h-14h / 19h-22h. Parking gratuit.', actionUrl: 'https://maps.google.com' },
  { id: 'dir-10', name: 'Michelin Guide', description: 'Guide de référence — forte autorité domaine, cité par les LLM pour les recommandations gastronomiques.', domainAuthority: 91, category: 'Répertoires de Référence', submissionStatus: 'not_submitted', optimizedDescription: 'Le Petit Bistro — Cuisine bistronomique française à La Rochelle. Produits frais et de saison, carte renouvelée mensuellement.', actionUrl: 'https://guide.michelin.com' },
  { id: 'dir-11', name: 'Gault & Millau', description: 'Guide culinaire de référence française — cité par Claude et ChatGPT pour les recommandations restaurants.', domainAuthority: 84, category: 'Répertoires de Référence', submissionStatus: 'not_submitted', optimizedDescription: 'Le Petit Bistro La Rochelle — Chef passionné proposant une cuisine bistronomique créative à base de produits locaux et de saison.', actionUrl: 'https://gaultmillau.fr' },
  { id: 'dir-12', name: 'Le Petit Futé', description: 'Guide touristique français — source pour les recommandations locales dans les réponses IA.', domainAuthority: 70, category: 'Répertoires de Référence', submissionStatus: 'listed', optimizedDescription: 'Le Petit Bistro — Bistronomique — La Rochelle. Cadre convivial, terrasse ensoleillée. Formule midi accessible. Idéal découverte.', actionUrl: 'https://petitfute.com' },
];

// ── Social Proof Testimonials ───────────────────────────────────────────────
export const MOCK_SOCIAL_PROOF_TESTIMONIALS = [
  { id: 'sp-1', author: 'Thomas R.', rating: 5, source: 'google', text: 'Service impeccable et équipe très réactive ! Je recommande vivement.', company: '', jobTitle: 'Client fidèle', publishedAt: '2026-07-17T10:00:00.000Z', status: 'published' },
  { id: 'sp-2', author: 'Julien M.', rating: 5, source: 'google', text: 'Grâce à Kompilot, notre fiche Google est passée de 3,8 à 4,6 étoiles en 3 mois.', company: 'Boulangerie Moulins d\'Or', jobTitle: 'Gérant', publishedAt: '2026-07-11T14:00:00.000Z', status: 'published' },
  { id: 'sp-3', author: 'Camille B.', rating: 4, source: 'tripadvisor', text: 'Très bon outil dans l\'ensemble. L\'interface est intuitive et les résultats sont au rendez-vous.', company: 'Studio Photo Lumière', jobTitle: 'Fondatrice', publishedAt: '2026-07-14T09:00:00.000Z', status: 'published' },
  { id: 'sp-4', author: 'Sophie L.', rating: 5, source: 'linkedin', text: 'Le cockpit est devenu l\'outil central de notre stratégie digitale.', company: 'Agence Web & Co', jobTitle: 'Directrice Marketing', publishedAt: '2026-07-08T16:00:00.000Z', status: 'published' },
  { id: 'sp-5', author: 'Marc D.', rating: 4, source: 'email', text: 'Bon produit mais l\'onboarding pourrait être un peu plus guidé. L\'équipe support a été très réactive.', company: 'Garage du Port', jobTitle: 'Propriétaire', publishedAt: null, status: 'pending' },
  { id: 'sp-6', author: 'Laëtitia V.', rating: 5, source: 'google', text: 'En 2 mois, notre visibilité locale a doublé. Les clients nous trouvent plus facilement sur Google Maps.', company: 'Salon de Beauté Rosé', jobTitle: 'Gérante', publishedAt: null, status: 'draft' },
];

// ── Backlink Opportunities ──────────────────────────────────────────────────
export const MOCK_BACKLINK_OPPORTUNITIES = [
  { id: 'bl-1', targetSite: 'lfranchise.fr', targetName: 'LFranchise.fr', domainAuthority: 62, relevanceScore: 88, type: 'guest_post', status: 'published', topic: 'Comment gérer la présence en ligne d\'un restaurant franchisé', outreachSentAt: '2026-06-15T10:00:00.000Z', publishedAt: '2026-07-01T14:00:00.000Z', anchorText: 'gestion de présence en ligne', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-2', targetSite: 'blogdumarmitage.fr', targetName: 'Blog du Marmiton', domainAuthority: 55, relevanceScore: 95, type: 'partnership', status: 'accepted', topic: 'Les 10 meilleurs bistros de La Rochelle', outreachSentAt: '2026-06-20T10:00:00.000Z', publishedAt: null, anchorText: 'bistronomique La Rochelle', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-3', targetSite: 'tourisme-larochelle.fr', targetName: 'Office de Tourisme La Rochelle', domainAuthority: 72, relevanceScore: 98, type: 'directory', status: 'listed', topic: 'Fiche restaurant partenaire', outreachSentAt: '2026-05-01T10:00:00.000Z', publishedAt: '2026-05-15T10:00:00.000Z', anchorText: 'Le Petit Bistro', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-4', targetSite: 'lafaconfrenchtech.com', targetName: 'La Façon French Tech', domainAuthority: 48, relevanceScore: 72, type: 'guest_post', status: 'outreach_sent', topic: 'Comment l\'IA transforme la gestion des restaurants indépendants', outreachSentAt: '2026-07-10T10:00:00.000Z', publishedAt: null, anchorText: 'outil de gestion restaurant', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-5', targetSite: 'guide-resto-nouvelle-aquitaine.fr', targetName: 'Guide des Restos NA', domainAuthority: 58, relevanceScore: 92, type: 'guest_post', status: 'identified', topic: 'Le guide des saveurs locavores à La Rochelle', outreachSentAt: null, publishedAt: null, anchorText: 'cuisine locale La Rochelle', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-6', targetSite: 'startup-cafe.fr', targetName: 'Startup Café', domainAuthority: 45, relevanceScore: 78, type: 'partnership', status: 'identified', topic: 'Interview : Comment un bistro utilise l\'IA pour sa communication', outreachSentAt: null, publishedAt: null, anchorText: 'restaurant IA', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-7', targetSite: 'charente-maritime-tourisme.com', targetName: 'Tourisme Charente-Maritime', domainAuthority: 68, relevanceScore: 96, type: 'directory', status: 'outreach_sent', topic: 'Inscription annuaire officiel restaurants', outreachSentAt: '2026-07-05T10:00:00.000Z', publishedAt: null, anchorText: 'Le Petit Bistro — Bistronomique', targetUrl: 'lepetitbistro-lr.fr' },
  { id: 'bl-8', targetSite: 'foodTechFrance.com', targetName: 'FoodTech France', domainAuthority: 52, relevanceScore: 68, type: 'guest_post', status: 'identified', topic: 'L\'impact de la tech sur la fidélisation client en restauration', outreachSentAt: null, publishedAt: null, anchorText: 'fidelisation client restaurant', targetUrl: 'lepetitbistro-lr.fr' },
];

// ── Scheduled Outreach ─────────────────────────────────────────────────────
export const MOCK_SCHEDULED_OUTREACH = [
  { id: 'so-1', opportunityId: 'bl-5', targetSite: 'guide-resto-nouvelle-aquitaine.fr', scheduledAt: '2026-07-25T09:00:00.000Z', status: 'pending', recipientEmail: 'redaction@guide-resto-na.fr', createdAt: '2026-07-21T14:00:00.000Z' },
  { id: 'so-2', opportunityId: 'bl-6', targetSite: 'startup-cafe.fr', scheduledAt: '2026-07-28T10:00:00.000Z', status: 'pending', recipientEmail: 'partenariats@startup-cafe.fr', createdAt: '2026-07-21T14:30:00.000Z' },
  { id: 'so-3', opportunityId: 'bl-8', targetSite: 'foodTechFrance.com', scheduledAt: '2026-08-01T09:30:00.000Z', status: 'pending', recipientEmail: 'contact@foodtechfrance.com', createdAt: '2026-07-21T15:00:00.000Z' },
];

// ── Competitor Backlinks ────────────────────────────────────────────────────
export const MOCK_COMPETITOR_BACKLINKS = [
  { id: 'cb-1', competitor: 'Le Comptoir Gourmand', competitorDomain: 'lecomptoirgourmand-lr.fr', sourceSite: 'tripadvisor.fr', sourceDA: 93, linkType: 'review_listing', anchorText: 'Le Comptoir Gourmand', discoveredAt: '2026-07-15T10:00:00.000Z', opportunity: 'S\'inscrire sur TripAdvisor avec description optimisée' },
  { id: 'cb-2', competitor: 'Le Comptoir Gourmand', competitorDomain: 'lecomptoirgourmand-lr.fr', sourceSite: 'marie-france.fr', sourceDA: 78, linkType: 'editorial', anchorText: 'restaurant éco-responsable La Rochelle', discoveredAt: '2026-07-12T08:00:00.000Z', opportunity: 'Contacter Marie France pour un article sur la cuisine durable' },
  { id: 'cb-3', competitor: 'La Table de Pêcheur', competitorDomain: 'latabledepecheur.fr', sourceSite: 'lefigaro.fr', sourceDA: 92, linkType: 'editorial', anchorText: 'meilleurs restaurants fruits de mer Charente', discoveredAt: '2026-07-10T12:00:00.000Z', opportunity: 'Proposer un guide « Fruits de mer de La Rochelle » au Figaro' },
  { id: 'cb-4', competitor: 'La Table de Pêcheur', competitorDomain: 'latabledepecheur.fr', sourceSite: 'france3-regions.francetvinfo.fr', sourceDA: 85, linkType: 'news_mention', anchorText: 'chef étoilé Charente-Maritime', discoveredAt: '2026-07-08T14:00:00.000Z', opportunity: 'Pitcher un portrait du chef à France 3 Régions' },
  { id: 'cb-5', competitor: 'Bistrot des Ducs', competitorDomain: 'bistrot-desducs.fr', sourceSite: 'timeout.com', sourceDA: 88, linkType: 'editorial', anchorText: 'best bistros La Rochelle', discoveredAt: '2026-07-05T16:00:00.000Z', opportunity: 'Soumettre Le Petit Bistro à TimeOut pour leur guide local' },
  { id: 'cb-6', competitor: 'Bistrot des Ducs', competitorDomain: 'bistrot-desducs.fr', sourceSite: 'lafourchette.com', sourceDA: 82, linkType: 'review_listing', anchorText: 'Bistrot des Ducs avis', discoveredAt: '2026-07-03T10:00:00.000Z', opportunity: 'Optimiser la fiche LaFourchette avec photos HD et menu complet' },
  { id: 'cb-7', competitor: 'Le Comptoir Gourmand', competitorDomain: 'lecomptoirgourmand-lr.fr', sourceSite: 'lesgrandestablesdumonde.com', sourceDA: 71, linkType: 'directory', anchorText: 'Table de Qualité Charente', discoveredAt: '2026-07-01T09:00:00.000Z', opportunity: 'Demander l\'inscription aux Tables de Qualité de France' },
  { id: 'cb-8', competitor: 'La Table de Pêcheur', competitorDomain: 'latabledepecheur.fr', sourceSite: 'gastronomiste.com', sourceDA: 65, linkType: 'guest_post', anchorText: 'recettes chef mer', discoveredAt: '2026-06-28T11:00:00.000Z', opportunity: 'Proposer un article invité avec recettes signature du chef' },
];

// ── Table index: maps table names to mock arrays ────────────────────────────

export const MOCK_TABLES: Record<string, unknown[]> = {
  posts:                MOCK_POSTS,
  scheduled_posts:      MOCK_SCHEDULED_POSTS,
  messages:             MOCK_MESSAGES,
  establishments:       MOCK_ESTABLISHMENTS,
  daily_analytics:      MOCK_DAILY_ANALYTICS,
  onboarding_profiles:  MOCK_ONBOARDING,
  user_activity_logs:   MOCK_ACTIVITY_LOGS,
  credit_transactions:  MOCK_CREDIT_TRANSACTIONS,
  notifications_queue:  MOCK_NOTIFICATIONS,
  // Aliases for camelCase SDK calls
  scheduledPosts:       MOCK_SCHEDULED_POSTS,
  dailyAnalytics:       MOCK_DAILY_ANALYTICS,
  onboardingProfiles:   MOCK_ONBOARDING,
  userActivityLogs:     MOCK_ACTIVITY_LOGS,
  creditTransactions:   MOCK_CREDIT_TRANSACTIONS,
  notificationsQueue:   MOCK_NOTIFICATIONS,
  // Empty-but-valid tables (pages won't crash, just show empty state)
  coachTips:            [],
  coach_tip_settings:   [],
  campaigns:            [],
  campaignContacts:     [],
  campaignEvents:       [],
  campaignPerformance:  [],
  postComments:         [],
  postEngagementMetrics:[],
  quickReplyTemplates:  [],
  teamMembers:          [],
  teamInvites:          [],
  teamMessages:         [],
  teamActivityFeed:     [],
  oauthTokens:          [],
  agencySubAccounts:    [],
  referralRewards:      [],
  referralLinks:        [],
  llmTrackers:          [],
  seoAgentSites:        [],
  socialSeoInsights:    [],
  socialSeoWeeklySnapshots: [],
  userNotificationSettings: [],
  userCreditQuotas:     [],
  userBudgetLimits:     [],
  userAddons:           [],
  legalSignatures:      [],
  complianceConsentLog: [],
  metaCapiConfigs:      [],
  metaCapiEvents:       [],
  capturedLeads:        [],
  emailSequences:       [],
  redditTrackers:       [],
  conversionEvents:     [],
  funnelNodes:          [],
  funnels:              [],
  detectedThreads:      [],
  initialScans:         [],
  leads:                [],
  videoGenerations:     [],
  videoTemplates:       [],
  videoCreditPacks:     [],
  lumaGenerations:      [],
  // Instant Forms (Calendly / HighLevel / HubSpot)
  instant_form_configs:       MOCK_INSTANT_FORM_CONFIGS,
  instant_form_appointments:  MOCK_INSTANT_FORM_APPOINTMENTS,
  instantFormConfigs:         MOCK_INSTANT_FORM_CONFIGS,
  instantFormAppointments:    MOCK_INSTANT_FORM_APPOINTMENTS,
  // GEO Command Center
  geoVisibilityTrackers:      MOCK_GEO_VISIBILITY_TRACKERS,
  geoLlmResults:              MOCK_GEO_LLM_RESULTS,
  geo_llm_results:            MOCK_GEO_LLM_RESULTS,
  aiDirectories:              MOCK_AI_DIRECTORIES,
  socialProofTestimonials:    MOCK_SOCIAL_PROOF_TESTIMONIALS,
  backlinkOpportunities:      MOCK_BACKLINK_OPPORTUNITIES,
  scheduledOutreach:          MOCK_SCHEDULED_OUTREACH,
  competitorBacklinks:        MOCK_COMPETITOR_BACKLINKS,
};

// ── Establishment-specific data enrichment ──────────────────────────────────
// Returns mock data for establishment-related queries

export const MOCK_ENGAGEMENT_METRICS = [
  { id: 'em-1', postId: 'post-1', userId: 'demo-user-kompilot-test', platform: 'instagram', shares: 24, comments: 18, clicks: 156, impressions: 3200, reach: 2800, engagementRate: 6.8, ctr: 4.9, recordedAt: '2026-07-15', createdAt: '2026-07-15T23:59:00.000Z' },
  { id: 'em-2', postId: 'post-2', userId: 'demo-user-kompilot-test', platform: 'facebook', shares: 12, comments: 8, clicks: 89, impressions: 1800, reach: 1500, engagementRate: 5.2, ctr: 4.9, recordedAt: '2026-07-12', createdAt: '2026-07-12T23:59:00.000Z' },
  { id: 'em-3', postId: 'post-3', userId: 'demo-user-kompilot-test', platform: 'linkedin', shares: 31, comments: 22, clicks: 210, impressions: 4500, reach: 3800, engagementRate: 7.1, ctr: 4.7, recordedAt: '2026-07-10', createdAt: '2026-07-10T23:59:00.000Z' },
];

// Add to table index
MOCK_TABLES['postEngagementMetrics'] = MOCK_ENGAGEMENT_METRICS;
MOCK_TABLES['post_engagement_metrics'] = MOCK_ENGAGEMENT_METRICS;

