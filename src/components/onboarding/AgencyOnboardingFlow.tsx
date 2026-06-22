/**
 * AgencyOnboardingFlow v2 — Flow d'onboarding dédié aux agences.
 * Étapes : ROI → Marque blanche → Premiers clients → Rapports PDF → Grille tarifaire → Pipeline → Objectif → Notifs.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import {
  Bell, BellOff, TrendingUp, Palette, Users,
  Target, Check, BarChart2, Package, Search
} from 'lucide-react';
import { StepAgencyROI } from './steps/StepAgencyROI';
import { StepAgencyWhiteLabel } from './steps/StepAgencyWhiteLabel';
import { StepAgencyClients } from './steps/StepAgencyClients';
import { StepAgencyReports } from './steps/StepAgencyReports';
import { StepAgencyPricing } from './steps/StepAgencyPricing';
import { StepAgencyPipeline } from './steps/StepAgencyPipeline';

interface Props {
  clientCount?: number;
  onComplete: () => void;
  onSkip: () => void;
}

type AgencyStep = 'roi' | 'whitelabel' | 'clients' | 'reports' | 'pricing' | 'pipeline' | 'objective' | 'notifs';

const AGENCY_OBJECTIVES = [
  {
    id: 'resell',
    title: '💰 Revente à mes clients',
    sub: 'Marque blanche — facturation à votre prix',
    icon: TrendingUp,
  },
  {
    id: 'manage',
    title: '🧑‍💼 Gestion multi-établissements',
    sub: 'Tableau de bord centralisé pour tous vos clients',
    icon: Users,
  },
  {
    id: 'audit',
    title: '🔍 Audits et rapports clients',
    sub: 'Génération de rapports PDF marque blanche',
    icon: Target,
  },
  {
    id: 'prospect',
    title: '🎯 Prospection IA automatique',
    sub: 'L\'IA trouve et contacte vos futurs clients',
    icon: Search,
  },
];

const STEP_ORDER: AgencyStep[] = ['roi', 'whitelabel', 'clients', 'reports', 'pricing', 'pipeline', 'objective', 'notifs'];

const STEP_META: Record<AgencyStep, { icon: React.ReactNode; shortLabel: string }> = {
  roi: { icon: <TrendingUp size={12} />, shortLabel: 'ROI' },
  whitelabel: { icon: <Palette size={12} />, shortLabel: 'Marque' },
  clients: { icon: <Users size={12} />, shortLabel: 'Clients' },
  reports: { icon: <BarChart2 size={12} />, shortLabel: 'Rapports' },
  pricing: { icon: <Package size={12} />, shortLabel: 'Tarifs' },
  pipeline: { icon: <Search size={12} />, shortLabel: 'Pipeline' },
  objective: { icon: <Target size={12} />, shortLabel: 'Objectif' },
  notifs: { icon: <Bell size={12} />, shortLabel: 'Alertes' },
};

function StepDots({ current }: { current: AgencyStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          title={STEP_META[s].shortLabel}
          className={`transition-all duration-300 rounded-full ${
            i === idx
              ? 'w-6 h-2 bg-violet-500'
              : i < idx
              ? 'w-2 h-2 bg-violet-500/60'
              : 'w-2 h-2 bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export function AgencyOnboardingFlow({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<AgencyStep>('roi');
  const [objective, setObjective] = useState('');
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepLabel = `Étape ${stepIndex + 1} sur ${STEP_ORDER.length}`;

  const handleNotifRequest = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifGranted(perm === 'granted');
      } catch {
        setNotifGranted(false);
      }
    } else {
      setNotifGranted(false);
    }
  };

  const next = (nextStep: AgencyStep) => () => setStep(nextStep);

  const wrapStep = (content: React.ReactNode, title: string, desc: string) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
          style={{ border: '1px solid rgba(79,70,229,0.3)' }}
        >
          {/* Purple top accent for agency */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <div className="flex items-center justify-between p-5 pb-2">
            <StepDots current={step} />
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">{stepLabel}</span>
              <button onClick={onSkip} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                Passer
              </button>
            </div>
          </div>

          <div className="px-6 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-wider mb-3">
              🏢 Onboarding Agence
            </div>
            <h2 className="text-xl font-black leading-tight">{title}</h2>
            <p className="text-sm text-slate-400 mt-1 mb-4">{desc}</p>
          </div>

          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (step === 'roi') {
    return wrapStep(
      <StepAgencyROI onComplete={next('whitelabel')} />,
      'Votre potentiel de revenus agence',
      'Simulez ce que vous pouvez facturer chaque mois avec Kompilot en marque blanche.'
    );
  }

  if (step === 'whitelabel') {
    return wrapStep(
      <StepAgencyWhiteLabel onComplete={next('clients')} />,
      'Configurez votre marque blanche',
      'Votre interface, votre logo, votre domaine. Kompilot reste invisible.'
    );
  }

  if (step === 'clients') {
    return wrapStep(
      <StepAgencyClients onComplete={next('reports')} />,
      'Ajoutez vos premiers clients',
      'Chaque client a son propre espace isolé avec son tableau de bord.'
    );
  }

  if (step === 'reports') {
    return wrapStep(
      <StepAgencyReports onComplete={next('pricing')} />,
      'Rapports PDF automatisés',
      'Configurez vos rapports marque blanche envoyés automatiquement chaque mois.'
    );
  }

  if (step === 'pricing') {
    return wrapStep(
      <StepAgencyPricing onComplete={next('pipeline')} />,
      'Votre grille tarifaire',
      'Créez 3 offres et Kompilot calcule votre marge nette en temps réel.'
    );
  }

  if (step === 'pipeline') {
    return wrapStep(
      <StepAgencyPipeline onComplete={next('objective')} />,
      'Pipeline de prospection IA',
      "L'IA scanne votre ville et identifie les commerces avec une visibilité faible — vos futurs clients."
    );
  }

  if (step === 'objective') {
    return wrapStep(
      <div className="space-y-3">
        {AGENCY_OBJECTIVES.map((obj) => (
          <button
            key={obj.id}
            onClick={() => { setObjective(obj.id); setTimeout(() => setStep('notifs'), 300); }}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              objective === obj.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className={`rounded-lg p-2 ${objective === obj.id ? 'bg-violet-500' : 'bg-slate-800'}`}>
              <obj.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{obj.title}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{obj.sub}</div>
            </div>
            {objective === obj.id && <Check className="ml-auto h-5 w-5 text-violet-500" />}
          </button>
        ))}
      </div>,
      'Quel est votre objectif principal ?',
      'Kompilot adaptera son interface selon votre usage.'
    );
  }

  if (step === 'notifs') {
    return wrapStep(
      <div className="space-y-5">
        <div className="space-y-2">
          {[
            { icon: '📊', title: 'Rapport mensuel prêt', desc: 'PDF client généré et envoyé' },
            { icon: '⚠️', title: 'Alerte client à risque', desc: 'Activité faible détectée chez un client' },
            { icon: '💰', title: 'Opportunité de revente', desc: 'Client prêt pour un upgrade de plan' },
            { icon: '🎯', title: 'Prospect qualifié détecté', desc: 'Commerce avec score GEO < 30 dans votre zone' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/8 p-3">
              <span className="text-lg shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {notifGranted === null ? (
          <div className="space-y-2">
            <Button
              onClick={async () => { await handleNotifRequest(); setTimeout(onComplete, 600); }}
              className="w-full py-5 text-base font-black bg-violet-600 hover:bg-violet-500"
            >
              <Bell className="h-4 w-4 mr-2" />
              Activer les alertes agence
            </Button>
            <button onClick={onComplete} className="w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors py-2">
              Plus tard — configurer dans Paramètres
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${notifGranted ? 'bg-violet-500/15 text-violet-400' : 'bg-slate-700/50 text-slate-400'}`}>
              {notifGranted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notifGranted ? 'Alertes agence activées ✓' : 'Configurable depuis Paramètres'}
            </div>
            <Button onClick={onComplete} className="w-full py-5 text-base font-black bg-violet-600 hover:bg-violet-500">
              Déployer mon dashboard agence 🚀
            </Button>
          </div>
        )}
      </div>,
      'Restez alerté sur vos clients',
      'Des alertes prioritaires pour piloter votre portefeuille sans effort.'
    );
  }

  return null;
}
