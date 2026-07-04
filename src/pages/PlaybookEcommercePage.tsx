/**
 * Playbook E-commerce Page — 4-week interactive growth playbook
 * for online stores using Kompilot.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ShoppingCart, Search, FileText, Star, Calendar, BarChart2, Zap, ArrowRight,
} from 'lucide-react';
import { blink } from '../blink/client';

interface WeekStep {
  title: string;
  action: string;
  kompilotFeature: string;
  featureLink: string;
  expectedResult: string;
}

interface Week {
  num: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  steps: WeekStep[];
}

const WEEKS: Week[] = [
  {
    num: 1,
    title: 'Audit Produit & Visibilité IA',
    subtitle: 'Vos produits sont-ils cités par ChatGPT ?',
    icon: <Search size={18} />,
    steps: [
      { title: 'Scannez votre site e-commerce', action: 'Utilisez l\'URLIngestionBar avec l\'URL de votre site', kompilotFeature: 'URL Ingestion', featureLink: '/creative-studio', expectedResult: 'Données produit extraites automatiquement' },
      { title: 'Générez vos Schema Produit', action: 'Créez les Schema Product + Offer pour vos 10 best-sellers via AIOSchemaPanel', kompilotFeature: 'AIOSchemaPanel', featureLink: '/aio', expectedResult: '10 Schema JSON-LD prêts à injecter' },
      { title: 'Testez votre visibilité IA', action: 'Vérifiez "Où acheter [produit] à [ville] ?" sur ChatGPT — êtes-vous cité ?', kompilotFeature: 'AIO Audit', featureLink: '/aio', expectedResult: 'Score AIO de base pour vos produits' },
    ],
  },
  {
    num: 2,
    title: 'Contenu Multi-Canal',
    subtitle: 'Générez un mois de contenu en 20 minutes',
    icon: <Calendar size={18} />,
    steps: [
      { title: 'Générez 12 posts Instagram/Facebook', action: '4 posts/semaine via Creative Studio — visuels + légendes optimisées', kompilotFeature: 'Creative Studio', featureLink: '/creative-studio', expectedResult: '12 posts générés et planifiés' },
      { title: 'Créez 3 scripts UGC', action: 'Scripts vidéo courts pour vos 3 best-sellers via UGCScriptPanel', kompilotFeature: 'UGC Script', featureLink: '/creative-studio', expectedResult: '3 scripts vidéo prêts à tourner' },
      { title: 'Programmez vos publications', action: 'Planifiez tout le mois sur le Calendar en une session', kompilotFeature: 'Campaign Calendar', featureLink: '/calendar', expectedResult: 'Calendrier mensuel complet' },
    ],
  },
  {
    num: 3,
    title: 'Avis & Preuve Sociale',
    subtitle: 'Les avis 5★ sont votre meilleur argument de vente',
    icon: <Star size={18} />,
    steps: [
      { title: 'Automatisez les demandes d\'avis', action: 'SMS rappel automatique post-commande pour chaque client', kompilotFeature: 'SMS Automation', featureLink: '/settings', expectedResult: 'Demandes SMS actives après chaque vente' },
      { title: 'Créez un Coupon Flash avis', action: '10% de réduction pour chaque avis 5★ laissé', kompilotFeature: 'Coupons Flash', featureLink: '/loyalty', expectedResult: '1 coupon actif avec lien de partage' },
      { title: 'Intégrez vos avis dans vos posts', action: 'Utilisez vos meilleurs avis comme preuve sociale dans vos publications', kompilotFeature: 'AI Post Generator', featureLink: '/cockpit', expectedResult: '3 posts avec avis intégrés' },
    ],
  },
  {
    num: 4,
    title: 'Growth Loop & Rapport',
    subtitle: 'Mesurez et amplifiez votre croissance',
    icon: <BarChart2 size={18} />,
    steps: [
      { title: 'Lancez une campagne de parrainage', action: '10% de réduction parrain/filleul via LoyaltyReferralPanel', kompilotFeature: 'Referral Panel', featureLink: '/loyalty', expectedResult: 'Campagne de parrainage active' },
      { title: 'Activez le Radar Concurrentiel', action: 'Surveillez vos 3 concurrents directs sur ChatGPT et Gemini', kompilotFeature: 'Radar Concurrentiel', featureLink: '/aio', expectedResult: 'Alertes concurrentielles actives' },
      { title: 'Exportez votre rapport mensuel', action: 'PDF branded avec vos KPIs e-commerce (avis, trafic IA, conversions)', kompilotFeature: 'Monthly Report', featureLink: '/agency', expectedResult: 'Rapport PDF partageable' },
    ],
  },
];

function WeekCard({ week, isOpen, onToggle }: { week: Week; isOpen: boolean; onToggle: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };
  const progress = Math.round((completedSteps.size / week.steps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: week.num * 0.08 }}
      style={{ background: isOpen ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.02)', border: `1px solid ${isOpen ? 'rgba(129,140,248,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius: 18, overflow: 'hidden', transition: 'border-color .3s' }}
    >
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: completedSteps.size === week.steps.length ? 'rgba(16,185,129,.12)' : 'rgba(129,140,248,.08)', border: `1px solid ${completedSteps.size === week.steps.length ? 'rgba(16,185,129,.25)' : 'rgba(129,140,248,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: completedSteps.size === week.steps.length ? '#10B981' : '#818CF8' }}>
          {completedSteps.size === week.steps.length ? <CheckCircle2 size={20} /> : week.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '1rem', margin: '0 0 2px' }}>Semaine {week.num} — {week.title}</p>
          <p style={{ color: '#64748B', fontSize: '.82rem', margin: 0 }}>{week.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: progress === 100 ? '#10B981' : '#64748B', background: progress === 100 ? 'rgba(16,185,129,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${progress === 100 ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.06)'}`, borderRadius: 20, padding: '3px 10px' }}>{progress}%</span>
          {isOpen ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {week.steps.map((step, i) => {
                const done = completedSteps.has(i);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: done ? 'rgba(16,185,129,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${done ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.05)'}`, transition: 'all .2s' }}>
                    <button onClick={() => toggleStep(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, marginTop: 2 }}>
                      {done ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color="#475569" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: done ? '#6EE7B7' : '#E2E8F0', fontWeight: 700, fontSize: '.88rem', margin: '0 0 4px', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>{step.title}</p>
                      <p style={{ color: '#94A3B8', fontSize: '.78rem', margin: '0 0 6px', lineHeight: 1.5 }}>{step.action}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Link to={step.featureLink as any} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.72rem', fontWeight: 700, color: '#818CF8', textDecoration: 'none', background: 'rgba(129,140,248,.08)', border: '1px solid rgba(129,140,248,.2)', borderRadius: 6, padding: '3px 8px' }}>
                          <Zap size={10} /> {step.kompilotFeature}
                        </Link>
                        <span style={{ fontSize: '.7rem', color: '#64748B' }}>→ {step.expectedResult}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PlaybookEcommercePage() {
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const cta = () => blink.auth.login(window.location.origin + '/dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(11,17,32,.95)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '.82rem', textDecoration: 'none' }}><ArrowLeft size={14} /> Retour</Link>
          <span style={{ fontWeight: 800, color: '#818CF8', fontSize: '.88rem' }}>Kompilot</span>
        </div>
      </nav>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(129,140,248,.1)', border: '1px solid rgba(129,140,248,.25)', borderRadius: 9999, padding: '5px 14px', fontSize: '.72rem', fontWeight: 700, color: '#818CF8', marginBottom: 16 }}>
            <ShoppingCart size={12} /> Playbook Secteur
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: '0 0 12px', lineHeight: 1.15 }}>
            Playbook Growth<br /><span style={{ color: '#818CF8' }}>E-commerce</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>4 semaines pour rendre vos produits visibles dans les réponses IA et doubler votre trafic organique.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WEEKS.map(week => <WeekCard key={week.num} week={week} isOpen={openWeek === week.num} onToggle={() => setOpenWeek(prev => prev === week.num ? null : week.num)} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button onClick={cta} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #818CF8, #6366F1)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: 9999, padding: '16px 36px', border: 'none', cursor: 'pointer', boxShadow: '0 0 32px rgba(129,140,248,.35)' }}>
            <Zap size={16} /> Commencer le playbook — Essai gratuit <ArrowRight size={15} />
          </button>
          <p style={{ color: '#334155', fontSize: '.73rem', marginTop: 10 }}>14 jours gratuits · Sans CB · Accès immédiat</p>
        </div>
      </main>
    </div>
  );
}
