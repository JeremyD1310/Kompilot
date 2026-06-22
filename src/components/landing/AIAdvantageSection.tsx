/**
 * AIAdvantageSection — Section comparative "Pendant que les autres font du SEO à l'ancienne"
 * Landing page section showcasing Kompilot's advantage in AI-era brand protection.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const OLD_SEO = [
  { label: 'Optimisation de mots-clés statiques', bad: true },
  { label: 'Backlinks et netlinking manuel', bad: true },
  { label: 'Résultats en 6-12 mois', bad: true },
  { label: 'Invisible sur ChatGPT et Gemini', bad: true },
  { label: 'Aucune protection contre les hallucinations', bad: true },
  { label: 'Pas de suivi des réponses IA', bad: true },
];

const KOMPILOT = [
  { label: 'Score G.E.O. en temps réel sur 5 IA', good: true },
  { label: 'Bouclier Anti-Hallucination actif 24h/24', good: true },
  { label: 'Fragments A.E.O. injectés automatiquement', good: true },
  { label: 'Votre marque au cœur des réponses ChatGPT', good: true },
  { label: 'Micro-agents IA autonomes', good: true },
  { label: 'Résultats mesurables sous 7 jours', good: true },
];

const STATS = [
  { value: '+340%', label: 'de visibilité sur les IA', icon: <TrendingUp size={18} className="text-emerald-400" /> },
  { value: '< 48h', label: 'pour corriger une hallucination', icon: <Shield size={18} className="text-primary" /> },
  { value: '10×', label: 'plus rapide que le SEO classique', icon: <Zap size={18} className="text-amber-400" /> },
  { value: '5 IA', label: 'surveillées en continu', icon: <Brain size={18} className="text-violet-400" /> },
];

export function AIAdvantageSection({ onCta }: { onCta?: () => void }) {
  const [hovered, setHovered] = useState<'old' | 'new' | null>(null);

  return (
    <section
      id="avantage-ia"
      style={{
        padding: '72px 24px 80px',
        background: 'linear-gradient(180deg, transparent, rgba(13,148,136,.04) 30%, rgba(13,148,136,.07) 60%, transparent)',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>

        {/* Section label */}
        <div className="text-center" style={{ marginBottom: 48 }}>
          <p className="sr nc-section-label" style={{ marginBottom: 14 }}>L'ère de l'IA</p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#F1F5F9',
              marginBottom: 20,
            }}
          >
            Pendant que les autres font du SEO à l'ancienne,{' '}
            <span style={{
              background: 'linear-gradient(90deg, #0D9488, #2DD4BF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Kompilot vous positionne au cœur des réponses de ChatGPT.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ color: '#64748B', fontSize: '1.02rem', maxWidth: 640, margin: '0 auto' }}
          >
            Kompilot protège votre marque contre les hallucinations des IA et structure vos données
            pour être lu en priorité par les moteurs de recherche de demain.
          </motion.p>
        </div>

        {/* Marketing insight block — Sources IA 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.12 }}
          style={{
            margin: '0 auto 40px',
            maxWidth: 760,
            borderRadius: 16,
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(13,148,136,.10), rgba(6,182,212,.06))',
            border: '1px solid rgba(13,148,136,.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow top-right */}
          <div style={{
            position: 'absolute',
            width: 180, height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,.15), transparent)',
            top: -40, right: -40,
            pointerEvents: 'none',
          }} />

          {/* Badge */}
          <span style={{
            display: 'inline-flex',
            background: 'rgba(13,148,136,.12)',
            border: '1px solid rgba(45,212,191,.25)',
            color: '#2DD4BF',
            borderRadius: 9999,
            padding: '4px 12px',
            fontSize: '.68rem',
            fontWeight: 800,
            letterSpacing: '.06em',
            marginBottom: 14,
          }}>
            🌐 Sources IA 2025 — Insights Semrush
          </span>

          {/* Grand titre */}
          <p style={{
            fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)',
            fontWeight: 900,
            color: '#F1F5F9',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: 12,
          }}>
            Le SEO a changé.<br />
            <span style={{
              background: 'linear-gradient(90deg, #0D9488, #2DD4BF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Les IA ne lisent plus seulement votre site web.
            </span>
          </p>

          {/* Corps */}
          <p style={{
            fontSize: '.88rem',
            color: '#64748B',
            lineHeight: 1.8,
            marginBottom: 0,
          }}>
            Elles extraient leurs réponses des avis Google, des discussions LinkedIn et des fils Reddit.
            Kompilot s'assure que vous êtes visible partout où l'IA va chercher ses sources — pas uniquement sur votre site.
          </p>

          {/* Ligne de preuves */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔎</span>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#2DD4BF' }}>Avis Google</span>
              <span style={{ fontSize: '.7rem', color: '#475569' }}>Indexés en priorité par ChatGPT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💼</span>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#818CF8' }}>LinkedIn & Reddit</span>
              <span style={{ fontSize: '.7rem', color: '#475569' }}>Sources UGC analysées par Gemini</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📰</span>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#C084FC' }}>Presse locale</span>
              <span style={{ fontSize: '.7rem', color: '#475569' }}>Citations vérifiées par Perplexity</span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginBottom: 52,
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.07 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 16,
                padding: '20px 16px',
              }}
            >
              {stat.icon}
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F1F5F9', lineHeight: 1 }}>{stat.value}</span>
              <span style={{ fontSize: '.75rem', color: '#64748B', textAlign: 'center', lineHeight: 1.3 }}>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>

          {/* Old SEO column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            onMouseEnter={() => setHovered('old')}
            onMouseLeave={() => setHovered(null)}
            style={{
              borderRadius: 20,
              border: '1px solid rgba(239,68,68,.25)',
              background: hovered === 'old' ? 'rgba(239,68,68,.07)' : 'rgba(239,68,68,.04)',
              padding: '24px 24px 28px',
              transition: 'background .25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(239,68,68,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={17} color="#EF4444" />
              </div>
              <div>
                <p style={{ color: '#F87171', fontWeight: 800, fontSize: '.9rem', lineHeight: 1 }}>SEO à l'ancienne</p>
                <p style={{ color: '#64748B', fontSize: '.72rem', marginTop: 3 }}>Agences traditionnelles</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {OLD_SEO.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(239,68,68,.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.65rem', color: '#EF4444', flexShrink: 0,
                  }}>✕</span>
                  <span style={{ color: '#64748B', fontSize: '.83rem' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Kompilot column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            onMouseEnter={() => setHovered('new')}
            onMouseLeave={() => setHovered(null)}
            style={{
              borderRadius: 20,
              border: '1px solid rgba(13,148,136,.40)',
              background: hovered === 'new'
                ? 'rgba(13,148,136,.10)'
                : 'linear-gradient(135deg, rgba(13,148,136,.07), rgba(45,212,191,.04))',
              padding: '24px 24px 28px',
              transition: 'background .25s',
              boxShadow: '0 0 40px rgba(13,148,136,.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow top-right */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(13,148,136,.18), transparent)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(13,148,136,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={17} color="#0D9488" />
              </div>
              <div>
                <p style={{ color: '#2DD4BF', fontWeight: 800, fontSize: '.9rem', lineHeight: 1 }}>Kompilot</p>
                <p style={{ color: '#475569', fontSize: '.72rem', marginTop: 3 }}>Protection IA · A.E.O. · G.E.O.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KOMPILOT.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#CBD5E1', fontSize: '.83rem', fontWeight: 500 }}>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA bottom */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 48 }}
        >
          <p style={{ color: '#475569', fontSize: '.88rem', textAlign: 'center' }}>
            Rejoignez les commerçants qui protègent déjà leur marque avec Kompilot
          </p>
          <button
            onClick={onCta}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #0D9488, #0f766e)',
              color: '#fff', fontWeight: 800, fontSize: '.9rem',
              borderRadius: 14, padding: '13px 28px', border: 'none',
              cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
              boxShadow: '0 6px 24px rgba(13,148,136,.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(13,148,136,.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(13,148,136,.35)';
            }}
          >
            <Shield size={16} />
            Activer mon Bouclier IA maintenant
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
