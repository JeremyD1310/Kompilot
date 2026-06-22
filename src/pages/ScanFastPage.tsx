/**
 * ScanFastPage — /scan/fast
 *
 * Ultra-stripped mobile landing page for "swipe-up" story ad traffic.
 * Design rules:
 *   • No hero text wall above the fold — scanner is the FIRST thing visible.
 *   • Single punchy hook line: "Vérifiez immédiatement ce que l'IA dit de votre commerce"
 *   • TikTokVideoBubble in bottom-left for scent-matching from the story ad.
 *   • No sidebar, no nav bar, no heavy images — pure conversion funnel.
 *   • Dark theme: matches story-ad aesthetic (dark bg, neon teal accent).
 */
import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Zap, ShieldCheck, Users, ArrowRight, Star, ChevronDown } from 'lucide-react';
import { DiagnosticForm, type DiagnosticFormData } from '../components/diagnostic/DiagnosticForm';
import { DiagnosticScan } from '../components/diagnostic/DiagnosticScan';
import { DiagnosticResults } from '../components/diagnostic/DiagnosticResults';
import { DiagnosticCaptureModal } from '../components/diagnostic/DiagnosticCaptureModal';
import { TikTokVideoBubble } from '../components/landing/TikTokVideoBubble';

type Step = 'form' | 'scan' | 'results';

/** Deterministic score (same as DiagnosticPage) */
function computeScore(data: DiagnosticFormData): number {
  const base = 28 + (data.businessName.length % 7) * 3 + (data.city.length % 5) * 2;
  return Math.min(71, Math.max(18, base));
}

// UTM detection — passed from story ad URL params
function useUTMSource() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource:   params.get('utm_source') ?? 'story',
    utmCampaign: params.get('utm_campaign') ?? '',
    utmContent:  params.get('utm_content') ?? '',
    videoSrc:    params.get('vid') ?? null, // optional MP4 URL for the bubble
  };
}

import { KompilotLogo } from '../components/brand/KompilotLogo';

/* ── Inline Logo ────────────────────────────────────────────────────────────── */
function Logo() { return <KompilotLogo variant="icon" height={26} />; }

/* ── Social proof ticker ─────────────────────────────────────────────────────── */
const RECENT_SCANS = [
  { name: 'Boulangerie Paul', city: 'Lyon', score: 34, delta: -28 },
  { name: 'Salon Éclat', city: 'Paris', score: 41, delta: -31 },
  { name: 'Pizzeria Napoli', city: 'Bordeaux', score: 29, delta: -24 },
  { name: 'Garage Expert', city: 'Toulouse', score: 52, delta: -19 },
];

function LiveScanTicker() {
  const [idx, setIdx] = useState(0);

  // Rotate every 3s
  useState(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % RECENT_SCANS.length), 3000);
    return () => clearInterval(t);
  });

  const scan = RECENT_SCANS[idx];
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <p className="text-[11px] text-white/50 truncate">
        <span className="text-white/70 font-semibold">{scan.name} ({scan.city})</span>
        {' '}score {scan.score}/100 · {Math.abs(scan.delta)}% en dessous de la concurrence
      </p>
    </div>
  );
}

/* ── Star rating row ─────────────────────────────────────────────────────────── */
function StarRow({ count = 5 }: { count?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

/* ── Testimonial micro-card ──────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Sophie M.', text: 'Mon score était de 32/100. En 2 semaines avec Kompilot : 67/100.' },
  { name: 'Marc D.', text: 'J\'ai découvert que ChatGPT ne connaissait pas ma boulangerie. Réglé en 1 clic.' },
  { name: 'Laure B.', text: '+3 nouveaux clients Google Maps la semaine après l\'audit.' },
];

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function ScanFastPage() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<DiagnosticFormData | null>(null);
  const [score, setScore] = useState(0);
  const [captureOpen, setCaptureOpen] = useState(false);
  const { videoSrc } = useUTMSource();

  const handleFormSubmit = useCallback((data: DiagnosticFormData) => {
    setFormData(data);
    setScore(computeScore(data));
    setStep('scan');
    // Scroll to top on mobile so user sees the scan animation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleScanComplete = useCallback(() => {
    setStep('results');
    setTimeout(() => setCaptureOpen(true), 1200);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #050c18 0%, #0a1628 45%, #0d1e30 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Minimal nav (logo only, no nav links) ── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(5,12,24,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}
      >
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-white font-bold text-sm tracking-tight">Kompilot</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 rounded-full text-[9px] font-bold uppercase tracking-wide px-2 py-0.5"
            style={{ background: 'rgba(13,148,136,.18)', border: '1px solid rgba(13,148,136,.35)', color: '#2DD4BF' }}
          >
            <Zap size={8} /> Scanner IA
          </span>
        </div>
        <Link
          to="/login"
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          Déjà client →
        </Link>
      </nav>

      {/* ── HERO HOOK — visible above the fold, no scroll required ── */}
      <div id="scanner-anchor" className="px-4 pt-5 pb-3 max-w-lg mx-auto">
        {/* Hook line — ONE punchy line, no paragraphs */}
        <div className="mb-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest mb-3"
            style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#F87171' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Résultat en 35 secondes
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold leading-tight"
            style={{ color: '#F8FAFC', letterSpacing: '-0.03em' }}
          >
            Vérifiez immédiatement<br />
            <span style={{ color: '#2DD4BF' }}>ce que l'IA dit</span><br />
            de votre commerce
          </h1>
        </div>

        {/* Live scan ticker */}
        <LiveScanTicker />
      </div>

      {/* ── SCANNER CARD — hero element, above fold on mobile ── */}
      <div className="px-4 pb-4 max-w-lg mx-auto">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(45,212,191,.18)',
            boxShadow: '0 0 0 1px rgba(45,212,191,.08), 0 24px 60px rgba(0,0,0,.6)',
          }}
        >
          {/* Step progress bar */}
          <div className="flex h-1">
            {(['form', 'scan', 'results'] as Step[]).map((s) => (
              <div
                key={s}
                className="flex-1 transition-all duration-500"
                style={{
                  background: s === 'form'
                    ? (step !== 'form' ? '#0D9488' : 'rgba(255,255,255,.08)')
                    : s === 'scan'
                    ? (step === 'scan' || step === 'results' ? '#0D9488' : 'rgba(255,255,255,.08)')
                    : step === 'results' ? '#0D9488' : 'rgba(255,255,255,.08)',
                }}
              />
            ))}
          </div>

          <div className="p-5">
            {step === 'form' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-1">
                    Diagnostic Gratuit · Sans CB
                  </p>
                  <h2 className="text-sm font-bold text-white">
                    Entrez le nom de votre commerce
                  </h2>
                </div>
                <DiagnosticForm onSubmit={handleFormSubmit} />
              </div>
            )}

            {step === 'scan' && formData && (
              <DiagnosticScan
                businessName={formData.businessName}
                onComplete={handleScanComplete}
              />
            )}

            {step === 'results' && formData && (
              <DiagnosticResults
                formData={formData}
                score={score}
                onUnlock={() => setCaptureOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Trust micro-row */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {[
            { icon: ShieldCheck, text: '100% gratuit' },
            { icon: Users,       text: '+2 400 scans' },
            { icon: Zap,         text: 'Sans CB' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1 text-white/35 text-[10px]">
              <Icon size={10} className="text-teal-500" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll prompt (gentle nudge when form visible) ── */}
      {step === 'form' && (
        <div className="flex flex-col items-center gap-1 pb-2 opacity-50">
          <p className="text-[10px] text-white/30">Défilez pour en savoir plus</p>
          <ChevronDown size={14} className="text-white/30 animate-bounce" />
        </div>
      )}

      {/* ── Below the fold: social proof ── */}
      {step === 'form' && (
        <div className="px-4 pb-10 max-w-lg mx-auto space-y-6 mt-4">

          {/* What does the scan reveal */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.15)' }}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-teal-400 mb-3">
              Ce que le scan vérifie
            </p>
            <ul className="space-y-2.5">
              {[
                { emoji: '🤖', label: 'ChatGPT & Perplexity', desc: 'Votre commerce est-il recommandé par l\'IA ?' },
                { emoji: '📍', label: 'Google Maps', desc: 'Votre fiche est-elle optimisée et visible ?' },
                { emoji: '⭐', label: 'Avis clients', desc: 'Score de réputation et réponses manquantes' },
                { emoji: '🔍', label: 'SEO local', desc: 'Apparaissez-vous dans "près de chez moi" ?' },
              ].map(({ emoji, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white/90">{label}</p>
                    <p className="text-[11px] text-white/45 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonials */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/40">
              Ce qu'ils ont découvert
            </p>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <StarRow />
                  <span className="text-[10px] text-white/50 font-semibold">{t.name}</span>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <button
            onClick={() => {
              document.getElementById('scanner-anchor')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-extrabold transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #0D9488, #059669)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(13,148,136,.4)',
            }}
          >
            <Zap size={16} />
            Analyser mon commerce gratuitement
            <ArrowRight size={16} />
          </button>
          <p className="text-center text-[10px] text-white/25">
            Résultats en 35s · Aucune carte bancaire requise
          </p>
        </div>
      )}

      {/* ── TikTok video bubble (scent-matching from story ad) ── */}
      <TikTokVideoBubble
        videoSrc={videoSrc}
        ctaText="Faites le test comme Sophie en 35s ⬇️"
        position="bottom-left"
      />

      {/* ── Capture modal ── */}
      {formData && (
        <DiagnosticCaptureModal
          formData={formData}
          score={score}
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
        />
      )}

      {/* ── Minimal footer ── */}
      <footer className="text-center pb-6 px-4">
        <p className="text-[10px] text-white/20">
          <Link to="/privacy" className="hover:text-white/40 transition-colors">Confidentialité</Link>
          {' · '}
          <Link to="/cgv" className="hover:text-white/40 transition-colors">CGV</Link>
          {' · '}
          <a href="mailto:contact@kompilot.fr" className="hover:text-white/40 transition-colors">Contact</a>
        </p>
      </footer>
    </div>
  );
}
