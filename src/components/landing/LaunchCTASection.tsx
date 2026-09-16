import { motion } from 'framer-motion';
import { ArrowRight, Rocket, ShieldCheck } from 'lucide-react';

export function LaunchCTASection() {
  return (
    <section className="relative overflow-hidden border-y border-teal-400/10 bg-[#080E1C] px-4 py-16 sm:px-6 md:py-24" aria-labelledby="launch-cta-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,148,136,.16),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45 }}>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200"><Rocket size={13} aria-hidden="true" /> Kompilot est disponible</span>
          <h2 id="launch-cta-title" className="text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">Votre présence locale mérite son cockpit.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">Créez votre espace, connectez vos canaux et commencez à piloter vos contenus, vos avis et votre visibilité dès aujourd’hui.</p>
          <a href="/signup" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-400 px-6 py-3 text-sm font-extrabold text-slate-950 no-underline shadow-[0_12px_32px_-12px_rgba(45,212,191,.7)] transition-all hover:-translate-y-0.5 hover:bg-teal-300 hover:shadow-[0_16px_38px_-12px_rgba(45,212,191,.8)] active:scale-[0.98]">Commencer l'essai gratuit <ArrowRight size={16} /></a>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} className="text-teal-300" /> Essai gratuit 14 jours · sans carte bancaire · accès immédiat</p>
        </motion.div>
      </div>
    </section>
  );
}
