import React from 'react';
import {
  Bell, MapPin, Calendar, Users, Palette, Star, TrendingUp, Sparkles,
  BarChart2, MessageSquare, Compass, Search, Package,
} from 'lucide-react';
import { StepProStripe } from './steps/StepProStripe';
import { StepProGEO } from './steps/StepProGEO';
import { StepProSMS } from './steps/StepProSMS';
import { StepProAIO } from './steps/StepProAIO';
import { StepProRecommendation } from './steps/StepProRecommendation';
import { StepAgencyROI } from './steps/StepAgencyROI';
import { StepAgencyWhiteLabel } from './steps/StepAgencyWhiteLabel';
import { StepAgencyClients } from './steps/StepAgencyClients';
import { StepAgencyReports } from './steps/StepAgencyReports';
import { StepAgencyPricing } from './steps/StepAgencyPricing';
import { StepAgencyPipeline } from './steps/StepAgencyPipeline';
import { Step1CockpitIA } from './steps/Step1CockpitIA';
import { Step2Multiposting } from './steps/Step2Multiposting';
import { Step4Reviews } from './steps/Step4Reviews';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GuideStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  xp: number;
  category: 'pro' | 'agency' | 'universal';
  keywords?: string[];
  interactive?: React.ComponentType<{ onComplete: () => void; sector?: string }>;
  content?: string;
  action?: string;
  tips?: string[];
}

// ── Universal steps ────────────────────────────────────────────────────────────

export const UNIVERSAL_STEPS: GuideStep[] = [
  {
    id: 'cockpit-ia',
    title: 'Cockpit IA — Votre premiere idee en contenu',
    subtitle: "Dictez une idee, l'IA redige un post percutant en 10 secondes",
    icon: React.createElement(Sparkles, { size: 16 }),
    xp: 50,
    category: 'universal',
    interactive: Step1CockpitIA,
    keywords: ['cockpit', 'ia', 'post', 'contenu', 'redaction'],
    tips: [
      "Utilisez des verbes d'action dans votre idee",
      'Mentionnez votre ville pour un ciblage local',
      "L'IA adapte automatiquement le ton a votre secteur",
    ],
  },
  {
    id: 'multiposting',
    title: "Multi-posting — Publiez partout d'un clic",
    subtitle: 'Un seul texte, adapte et diffuse sur tous vos reseaux',
    icon: React.createElement(MessageSquare, { size: 16 }),
    xp: 50,
    category: 'universal',
    interactive: Step2Multiposting,
    keywords: ['multiposting', 'reseaux', 'publication', 'gmb', 'instagram', 'facebook'],
    tips: [
      'Chaque plateforme recoit une version optimisee',
      'GMB, Instagram, Facebook et WhatsApp en une action',
      "Programmez a l'avance pour la meilleure visibilite",
    ],
  },
  {
    id: 'reviews',
    title: "Avis clients — Repondez en 1 clic avec l'IA",
    subtitle: 'Centralisez Google Maps, TripAdvisor, Booking dans un seul inbox',
    icon: React.createElement(Star, { size: 16 }),
    xp: 40,
    category: 'universal',
    interactive: Step4Reviews as unknown as React.ComponentType<{ onComplete: () => void; sector?: string }>,
    keywords: ['avis', 'google', 'reputation', 'reponse', 'inbox'],
    tips: [
      'Repondre aux avis ameliore votre score GEO',
      "L'IA propose 3 variantes de reponse",
      'Les avis negatifs = opportunite de fidelisation',
    ],
  },
  {
    id: 'notifications',
    title: 'Alertes financieres — Activez votre radar de tresorerie',
    subtitle: "Uniquement des alertes a valeur financiere directe — aucun spam",
    icon: React.createElement(Bell, { size: 16 }),
    xp: 30,
    category: 'universal',
    keywords: ['alertes', 'notifications', 'tresorerie', 'finances'],
    content: "Autorisez Kompilot a vous alerter des qu'une opportunite de CA est detectee : no-show imminent, relance CRM due, lead social capture. Aucune notification publicitaire — uniquement des alertes financieres concretes avec impact en euros.",
    action: 'Autoriser les alertes -> Configurer dans Parametres -> Notifications',
    tips: [
      'Alertes No-Show : 2-3 heures avant le RDV',
      'Alertes CRM : client inactif > 30 jours',
      'Alertes Leads : coordonnee capturee en direct',
    ],
  },
];

// ── Pro steps ──────────────────────────────────────────────────────────────────

export const PRO_STEPS: GuideStep[] = [
  {
    id: 'pro-geo',
    title: 'Radar GEO IA — Scannez votre visibilite locale',
    subtitle: 'Decouvrez si ChatGPT, Gemini et Google IA recommandent votre commerce',
    icon: React.createElement(MapPin, { size: 16 }),
    xp: 80,
    category: 'pro',
    interactive: StepProGEO,
    keywords: ['geo', 'visibilite', 'local', 'chatgpt', 'gemini', 'score'],
    tips: [
      'Un score > 60 = vous apparaissez dans les reponses IA',
      'Chaque citation = +2 points de score GEO',
      'Optimisez votre fiche Google en priorite',
    ],
  },
  {
    id: 'pro-stripe',
    title: 'Bouclier No-Show — Protegez votre tresorerie',
    subtitle: 'Chaque RDV annule = penalite encaissee automatiquement via Stripe',
    icon: React.createElement(Star, { size: 16 }),
    xp: 100,
    category: 'pro',
    interactive: StepProStripe,
    keywords: ['stripe', 'noshow', 'rdv', 'paiement', 'tresorerie'],
    tips: [
      'Taux recommande : 25% du prix de la prestation',
      "Le client voit l'empreinte au moment de la reservation",
      'Kompilot encaisse automatiquement en cas d\'absence',
    ],
  },
  {
    id: 'pro-calendar',
    title: "Calendrier IA — Planifiez 4 semaines de contenu",
    subtitle: "L'IA genere un planning optimal selon votre secteur",
    icon: React.createElement(Calendar, { size: 16 }),
    xp: 60,
    category: 'pro',
    keywords: ['calendrier', 'planning', 'contenu', 'posts', 'semaine'],
    content: "Dans Calendrier -> cliquez \"Generer avec l'IA\" -> selectionnez votre secteur et vos 3 mots-cles prioritaires -> l'IA cree 4 semaines de posts optimises. Modifiez les textes directement, puis cliquez \"Planifier tout\" pour programmer l'ensemble en 1 clic.",
    action: "Calendrier -> Generer avec IA -> Planifier 4 semaines",
    tips: [
      "Publiez a 9h ou 19h pour le meilleur engagement",
      'Variez les formats : texte, image, video',
      "L'IA suit les evenements locaux automatiquement",
    ],
  },
  {
    id: 'pro-sms',
    title: 'Campagne SMS — Reactivez vos clients silencieux',
    subtitle: "95% de taux de lecture — 3x plus efficace que l'email",
    icon: React.createElement(MessageSquare, { size: 16 }),
    xp: 70,
    category: 'pro',
    interactive: StepProSMS,
    keywords: ['sms', 'campagne', 'clients', 'reactiver', 'message'],
    tips: [
      'Envoyez entre 10h-12h ou 18h-20h',
      'Personnalisez avec le prenom du client',
      'Un SMS = 160 caracteres = 0,05 credit',
    ],
  },
  {
    id: 'pro-aio',
    title: 'AIO Sync — Apparaissez dans les reponses IA',
    subtitle: 'Configurez 12 mots-cles pour que ChatGPT et Perplexity vous recommandent',
    icon: React.createElement(Compass, { size: 16 }),
    xp: 90,
    category: 'pro',
    interactive: StepProAIO,
    keywords: ['aio', 'sync', 'mots-cles', 'chatgpt', 'perplexity', 'ia'],
    tips: [
      'Combinez ville + service + qualificatif',
      'Exemple: "meilleure boulangerie [ville]"',
      'Les syncs se font tous les lundis a 9h',
    ],
  },
  {
    id: 'pro-recommendation',
    title: "Plan d'action IA — Vos 3 priorites personnalisees",
    subtitle: "L'IA analyse votre profil et identifie les actions a impact maximal",
    icon: React.createElement(Sparkles, { size: 16 }),
    xp: 60,
    category: 'pro',
    interactive: StepProRecommendation,
    keywords: ['plan', 'action', 'recommandation', 'priorites', 'ia'],
    tips: [
      'Actions triees par impact ROI',
      'Chaque action est trackee automatiquement',
      'Le plan se met a jour chaque semaine',
    ],
  },
];

// ── Agency steps ───────────────────────────────────────────────────────────────

export const AGENCY_STEPS: GuideStep[] = [
  {
    id: 'agency-roi',
    title: 'Simulateur ROI — Calculez vos revenus agence',
    subtitle: 'Voyez exactement ce que votre agence peut facturer avec Kompilot',
    icon: React.createElement(TrendingUp, { size: 16 }),
    xp: 60,
    category: 'agency',
    interactive: StepAgencyROI,
    keywords: ['roi', 'revenus', 'agence', 'marge', 'mrr'],
    tips: [
      'Marge moyenne des agences : 68%',
      'Avec 10 clients a 99e = 893e/mois de profit net',
      'Le plan Agency est a 97e/mois, clients illimites',
    ],
  },
  {
    id: 'agency-whitelabel',
    title: 'Marque Blanche — Votre interface, vos couleurs',
    subtitle: 'Vos clients voient votre nom et domaine, Kompilot reste invisible',
    icon: React.createElement(Palette, { size: 16 }),
    xp: 100,
    category: 'agency',
    interactive: StepAgencyWhiteLabel,
    keywords: ['marque', 'blanche', 'logo', 'domaine', 'interface'],
    tips: [
      'Configurez votre CNAME en 5 minutes',
      'Importez votre logo (SVG/PNG, fond transparent)',
      'Vos clients pensent utiliser votre outil interne',
    ],
  },
  {
    id: 'agency-clients',
    title: 'Multi-clients — Ajoutez vos premiers comptes',
    subtitle: 'Tableau de bord unifie, alertes centralisees, facturation automatique',
    icon: React.createElement(Users, { size: 16 }),
    xp: 80,
    category: 'agency',
    interactive: StepAgencyClients,
    keywords: ['clients', 'multi', 'dashboard', 'gestion', 'comptes'],
    tips: [
      'Chaque client a son espace isole et securise',
      'Importez depuis CSV ou ajoutez manuellement',
      'Les alertes remontent dans votre vue agregee',
    ],
  },
  {
    id: 'agency-reports',
    title: 'Rapports PDF — Automatisez vos bilans clients',
    subtitle: 'PDF brande envoye chaque mois a vos clients sans effort',
    icon: React.createElement(BarChart2, { size: 16 }),
    xp: 70,
    category: 'agency',
    interactive: StepAgencyReports,
    keywords: ['rapports', 'pdf', 'bilan', 'mensuel', 'automatique'],
    tips: [
      "Programmez l'envoi automatique le 1er du mois",
      'Incluez toujours les KPIs CA recupere et avis',
      'Le client pergoit un service professionnel complet',
    ],
  },
  {
    id: 'agency-pricing',
    title: 'Grille tarifaire — Configurez vos offres',
    subtitle: 'Creez 2-3 plans et Kompilot calcule automatiquement la marge',
    icon: React.createElement(Package, { size: 16 }),
    xp: 50,
    category: 'agency',
    interactive: StepAgencyPricing,
    keywords: ['tarifs', 'grille', 'offres', 'plans', 'prix'],
    tips: [
      'Plan recommande : 3 offres avec upsell naturel',
      'Starter 49e / Growth 99e / Premium 199e',
      'Facturez annuellement pour +25% de MRR',
    ],
  },
  {
    id: 'agency-pipeline',
    title: 'Pipeline IA — Prospectez des clients automatiquement',
    subtitle: "L'IA detecte les commerces locaux avec visibilite faible — vos futurs clients",
    icon: React.createElement(Search, { size: 16 }),
    xp: 90,
    category: 'agency',
    interactive: StepAgencyPipeline,
    keywords: ['pipeline', 'prospection', 'leads', 'commerces', 'ia'],
    tips: [
      'Ciblez les commerces avec score GEO < 30',
      'Email de prospection personnalise en 1 clic',
      'Suivi automatique dans le CRM agence',
    ],
  },
];
