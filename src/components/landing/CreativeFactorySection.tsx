/**
 * CreativeFactorySection — Section landing page "Créas Flash"
 * Identité Studio Design Haut de Gamme — conteneurs sombres, boutons bleus vifs
 */
import { motion } from 'framer-motion';
import { Zap, Download, CalendarCheck, Sparkles, Clock, ArrowRight, Check } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const STEPS = [
  {
    num: '01',
    icon: Sparkles,
    title: 'Brief en 1 minute',
    desc: 'L\'IA analyse votre secteur et pré-remplit les objectifs du moment. Vous validez, c\'est tout.',
    highlight: 'Pré-rempli par l\'IA',
  },
  {
    num: '02',
    icon: Zap,
    title: 'Production instantanée',
    desc: '3 déclinaisons visuelles premium générées — format Carré (1:1) et Story (9:16) pour Instagram et Meta Ads.',
    highlight: '3 visuels en 30 sec',
  },
  {
    num: '03',
    icon: Download,
    title: 'Tu reçois, tu postes',
    desc: 'Téléchargez votre pack ou planifiez directement sur Instagram et Meta en un seul clic.',
    highlight: 'Zéro effort',
  },
];

const BENEFITS = [
  'Formats Carré et Story générés ensemble',
  'Optimisé pour les algorithmes Meta & Instagram',
  'Ton adapté à votre secteur automatiquement',
  'Compatible planification directe depuis l\'app',
];

export function CreativeFactorySection() {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Ambient light */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full">
            <Sparkles size={12} />
            🎨 Créas Flash — Style Kreative
          </div>
        </motion.div>

        {/* Headline principale */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="text-center mb-5"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Vos créas réseaux &amp; Meta{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              prêtes en 2 minutes
            </span>
            , pas en 48h.
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-center text-slate-400 text-lg max-w-2xl mx-auto mb-14"
        >
          Remplissez un micro-brief, l'IA produit vos visuels premium, vous n'avez plus qu'à publier.
        </motion.p>

        {/* Étapes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group"
              >
                {/* Numéro */}
                <div className="text-[42px] font-black text-slate-800 leading-none mb-4 group-hover:text-blue-600/20 transition-colors">
                  {step.num}
                </div>

                {/* Icône */}
                <div className="w-10 h-10 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={18} className="text-blue-400" />
                </div>

                <h3 className="font-extrabold text-white text-base mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{step.desc}</p>

                {/* Highlight badge */}
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                  <Zap size={8} />
                  {step.highlight}
                </span>

                {/* Connector arrow (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center">
                      <ArrowRight size={16} className="text-blue-500" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bloc central : before/after + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
        >
          {/* Left: Avant / Après */}
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-extrabold text-white">
              Avant Kompilot<br />
              <span className="text-slate-500 font-medium text-base">La création de contenu était un calvaire</span>
            </h3>
            <div className="space-y-2">
              {[
                '⏳ 48h d\'attente chez un graphiste',
                '💸 150€ minimum par visuel',
                '🔁 Allers-retours sans fin pour les retouches',
                '😩 Jamais prêt au bon moment',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-base font-extrabold text-white mb-3">
                Avec Créas Flash ⚡
              </h4>
              <div className="space-y-2">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-4 h-4 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                      <Check size={10} className="text-blue-400" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Mock preview + CTA */}
          <div className="flex-1 flex flex-col items-center gap-5">
            {/* Pseudo-preview de créas */}
            <div className="flex gap-3 w-full max-w-xs">
              {/* Square mock */}
              <div className="flex-1 aspect-square bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-blue-900/30">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-white font-extrabold text-[9px] leading-tight mb-1.5">Offre ce week-end</div>
                <div className="bg-white text-slate-900 text-[7px] font-bold px-2 py-0.5 rounded-full">Réserver</div>
                <div className="absolute top-1 right-1 text-[7px] bg-black/40 text-white px-1 rounded">1:1</div>
              </div>
              {/* Story mock */}
              <div className="w-20 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-xl flex flex-col items-center justify-center p-2 text-center shadow-lg" style={{ aspectRatio: '9/16' }}>
                <div className="text-xl mb-1">✨</div>
                <div className="text-white font-extrabold text-[7px] leading-tight mb-1">À ne pas manquer</div>
                <div className="bg-white text-slate-900 text-[6px] font-bold px-1.5 py-0.5 rounded-full">Voir</div>
                <div className="absolute top-1 right-1 text-[6px] bg-black/40 text-white px-1 rounded">9:16</div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock size={14} className="text-blue-400" />
              <span>Généré en <strong className="text-white">1 min 42s</strong></span>
            </div>

            {/* CTA principal */}
            <Link to="/creative-factory">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-150 w-full justify-center">
                <Sparkles size={16} />
                Lancer mes créas maintenant
                <ArrowRight size={16} />
              </button>
            </Link>

            <p className="text-[10px] text-slate-500 text-center">
              Inclus dans toutes les offres · Aucune compétence graphique requise
            </p>
          </div>
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col md:flex-row items-center justify-center gap-8 mt-10 pt-8 border-t border-slate-800"
        >
          {[
            { value: '< 2 min', label: 'Temps de génération' },
            { value: '3 visuels', label: 'Déclinaisons par brief' },
            { value: '2 formats', label: 'Carré + Story' },
            { value: '100%', label: 'Optimisé Meta Ads' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-extrabold text-blue-400">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
