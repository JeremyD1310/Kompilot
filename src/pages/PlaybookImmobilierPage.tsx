/**
 * Playbook Immobilier Page — 4-week interactive growth playbook
 * for real estate agencies using Kompilot.
 *
 * Each week: concrete actions with deep-links to Kompilot features.
 * Public page — no auth required. Acts as lead magnet + activation tool.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp,
  MapPin, Search, FileText, Star, Calendar, BarChart2, Zap, ArrowRight,
} from 'lucide-react';
import { blink } from '../blink/client';

// ── Data ─────────────────────────────────────────────────────────────────────

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
    title: 'Audit & Fondations',
    subtitle: 'Posez les bases de votre visibilité IA',
    icon: <Search size={18} />,
    steps: [
      {
        title: 'Scannez votre agence',
        action: 'Lancez le GeoScanner avec votre nom d\'agence et votre ville',
        kompilotFeature: 'GeoScanner Flash',
        featureLink: '/scan/fast',
        expectedResult: 'Score AIO de base visible — vous savez où vous en êtes',
      },
      {
        title: 'Connectez votre fiche Google',
        action: 'OAuth Google My Business en 1 clic depuis les paramètres',
        kompilotFeature: 'Connexion Google',
        featureLink: '/settings',
        expectedResult: 'Fiche GBP synchronisée avec Kompilot',
      },
      {
        title: 'Générez votre Schema immobilier',
        action: 'Utilisez le Générateur Schema LLM avec le type RealEstateAgent',
        kompilotFeature: 'AIOSchemaPanel',
        featureLink: '/aio',
        expectedResult: 'JSON-LD LocalBusiness + FAQPage prêt à injecter',
      },
    ],
  },
  {
    num: 2,
    title: 'Contenu IA Automatisé',
    subtitle: 'L\'IA rédige pendant que vous vendez',
    icon: <Calendar size={18} />,
    steps: [
      {
        title: 'Configurez votre calendrier',
        action: '4 posts/semaine : biens récents, quartiers, conseils achat',
        kompilotFeature: 'Campaign Calendar',
        featureLink: '/calendar',
        expectedResult: '8 posts planifiés pour le mois',
      },
      {
        title: 'Générez des descriptions de biens',
        action: 'Utilisez Claude Cowork pour 3 descriptions optimisées IA',
        kompilotFeature: 'Creative Studio',
        featureLink: '/cockpit',
        expectedResult: '3 textes de bien générés et prêts à poster',
      },
      {
        title: 'Lancez un coupon Flash',
        action: 'Créez un coupon "Estimation gratuite" pour capter des leads',
        kompilotFeature: 'Coupons Flash IA',
        featureLink: '/loyalty',
        expectedResult: '1 coupon actif avec lien de partage',
      },
    ],
  },
  {
    num: 3,
    title: 'Avis & Réputation',
    subtitle: 'Chaque avis est un argument de vente',
    icon: <Star size={18} />,
    steps: [
      {
        title: 'Activez les rappels SMS',
        action: 'Configurez un SMS automatique post-visite pour demander un avis',
        kompilotFeature: 'SMS Automation',
        featureLink: '/settings',
        expectedResult: 'Rappels SMS actifs après chaque visite',
      },
      {
        title: 'Répondez à vos avis',
        action: 'Utilisez l\'IA pour répondre à vos 5 derniers avis Google',
        kompilotFeature: 'AI Review Responder',
        featureLink: '/reviews',
        expectedResult: '+5 avis avec réponse personnalisée',
      },
      {
        title: 'Vérifiez votre score GEO',
        action: 'Objectif : +10 points sur votre score de visibilité locale',
        kompilotFeature: 'GEO Score',
        featureLink: '/performance',
        expectedResult: 'Score GEO cible : +10 points en 7 jours',
      },
    ],
  },
  {
    num: 4,
    title: 'Analyse & Rapport Client',
    subtitle: 'Présentez vos résultats comme un pro',
    icon: <BarChart2 size={18} />,
    steps: [
      {
        title: 'Générez votre rapport PDF',
        action: 'Un clic → rapport mensuel branded avec vos KPIs',
        kompilotFeature: 'Monthly Report Generator',
        featureLink: '/agency',
        expectedResult: 'Rapport PDF partageable avec votre client',
      },
      {
        title: 'Activez AIO Sync',
        action: 'Suivez "immobilier [votre ville]" et "agence immobilière [ville]"',
        kompilotFeature: 'AIOSyncPanel',
        featureLink: '/aio',
        expectedResult: 'Score AIO > 50% pour vos mots-clés',
      },
      {
        title: 'Exportez votre rapport AIO',
        action: 'Partagez votre score de visibilité IA sur votre page "À propos"',
        kompilotFeature: 'ShareCaseStudy',
        featureLink: '/aio',
        expectedResult: 'Lien public de votre rapport AIO partageable',
      },
    ],
  },
];

function WeekCard({ week, isOpen, onToggle }: { week: Week; isOpen: boolean; onToggle: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const progress = Math.round((completedSteps.size / week.steps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: week.num * 0.08 }}
      style={{
        background: isOpen ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.02)',
        border: `1px solid ${isOpen ? 'rgba(13,148,136,.3)' : 'rgba(255,255,255,.06)'}`,
        borderRadius: 18, overflow: 'hidden',
        transition: 'border-color .3s',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 24px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: completedSteps.size === week.steps.length
            ? 'rgba(16,185,129,.12)' : 'rgba(13,148,136,.08)',
          border: `1px solid ${completedSteps.size === week.steps.length ? 'rgba(16,185,129,.25)' : 'rgba(13,148,136,.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: completedSteps.size === week.steps.length ? '#10B981' : '#0D9488',
        }}>
          {completedSteps.size === week.steps.length ? <CheckCircle2 size={20} /> : week.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '1rem', margin: '0 0 2px' }}>
            Semaine {week.num} — {week.title}
          </p>
          <p style={{ color: '#64748B', fontSize: '.82rem', margin: 0 }}>{week.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{
            fontSize: '.72rem', fontWeight: 700,
            color: progress === 100 ? '#10B981' : '#64748B',
            background: progress === 100 ? 'rgba(16,185,129,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${progress === 100 ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.06)'}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            {progress}%
          </span>
          {isOpen ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {week.steps.map((step, i) => {
                const done = completedSteps.has(i);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', borderRadius: 14,
                      background: done ? 'rgba(16,185,129,.04)' : 'rgba(255,255,255,.02)',
                      border: `1px solid ${done ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.05)'}`,
                      transition: 'all .2s',
                    }}
                  >
                    <button
                      onClick={() => toggleStep(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, marginTop: 2 }}
                    >
                      {done
                        ? <CheckCircle2 size={18} color="#10B981" />
                        : <Circle size={18} color="#475569" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: done ? '#6EE7B7' : '#E2E8F0', fontWeight: 700, fontSize: '.88rem', margin: '0 0 4px', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
                        {step.title}
                      </p>
                      <p style={{ color: '#94A3B8', fontSize: '.78rem', margin: '0 0 6px', lineHeight: 1.5 }}>
                        {step.action}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          to={step.featureLink as any}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: '.72rem', fontWeight: 700, color: '#0D9488',
                            textDecoration: 'none',
                            background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)',
                            borderRadius: 6, padding: '3px 8px',
                          }}
                        >
                          <Zap size={10} /> {step.kompilotFeature}
                        </Link>
                        <span style={{ fontSize: '.7rem', color: '#64748B' }}>
                          → {step.expectedResult}
                        </span>
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlaybookImmobilierPage() {
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const cta = () => blink.auth.login(window.location.origin + '/dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(11,17,32,.95)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,.06)', padding: '12px 24px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '.82rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Retour
          </Link>
          <span style={{ fontWeight: 800, color: '#0D9488', fontSize: '.88rem' }}>Kompilot</span>
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)',
            borderRadius: 9999, padding: '5px 14px', fontSize: '.72rem', fontWeight: 700, color: '#0D9488',
            marginBottom: 16,
          }}>
            <MapPin size={12} /> Playbook Secteur
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: '0 0 12px', lineHeight: 1.15 }}>
            Playbook Growth<br />
            <span style={{ color: '#0D9488' }}>Immobilier</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            4 semaines pour dominer les recherches IA dans votre secteur.
            Chaque action est liée à une fonctionnalité Kompilot.
          </p>
        </div>

        {/* Weeks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WEEKS.map(week => (
            <WeekCard
              key={week.num}
              week={week}
              isOpen={openWeek === week.num}
              onToggle={() => setOpenWeek(prev => prev === week.num ? null : week.num)}
            />
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button
            onClick={cta}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #0D9488, #0f766e)',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              borderRadius: 9999, padding: '16px 36px', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 32px rgba(13,148,136,.35)',
            }}
          >
            <Zap size={16} /> Commencer le playbook — Essai gratuit
            <ArrowRight size={15} />
          </button>
          <p style={{ color: '#334155', fontSize: '.73rem', marginTop: 10 }}>
            14 jours gratuits · Sans CB · Accès immédiat
          </p>
        </div>
      </main>
    </div>
  );
}
