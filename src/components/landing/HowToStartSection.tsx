import React, { useEffect, useRef } from 'react';
import { Building2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface HowToStartSectionProps {
  onCta: () => void;
}

const steps = [
  {
    number: "1",
    icon: Building2,
    title: "Connectez votre établissement",
    desc: "En 30 secondes, l'IA analyse votre fiche Google et votre secteur."
  },
  {
    number: "2",
    icon: Sparkles,
    title: "Laissez le Copilote IA rédiger",
    desc: "Posts, réponses aux avis, planning hebdomadaire — générés automatiquement."
  },
  {
    number: "3",
    icon: ShieldCheck,
    title: "Activez le bouclier Stripe",
    desc: "Sécurisez vos créneaux et encaissez sereinement, même le week-end."
  }
];

export function HowToStartSection({ onCta }: HowToStartSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how-to-start"
      ref={sectionRef}
      className="relative pt-10 pb-16 px-6 overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.05) 0%, transparent 70%)' }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="reveal text-3xl md:text-4xl font-black text-slate-50 mb-4 opacity-0 translate-y-8 transition-all duration-700 ease-out">
            Pilotez votre marketing en 3 clics
          </h2>
          <p className="reveal text-slate-400 text-lg md:text-xl max-w-2xl mx-auto opacity-0 translate-y-8 transition-all duration-700 ease-out delay-100">
            De la création à la publication, Kompilot gère tout à votre place.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row gap-12 md:gap-8 items-start justify-between">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-px border-t-2 border-dashed border-teal-900/50 -z-10" />

          {steps.map((step, idx) => (
            <div 
              key={idx}
              data-step={step.number}
              className={`reveal flex-1 flex flex-col items-center text-center group opacity-0 translate-y-8 transition-all duration-700 ease-out`}
              style={{ transitionDelay: `${(idx + 2) * 150}ms` }}
            >
              <div className="relative mb-6">
                {/* Number Circle */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-[0_0_20px_rgba(13,148,136,0.4)] group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>
                {/* Icon Badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-900 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xl">
                  <step.icon size={20} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="reveal mt-12 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out delay-700">
          <button 
            onClick={onCta}
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(13,148,136,0.3)] transition-all active:scale-95 group"
          >
            Démarrer en 30 secondes
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}} />
    </section>
  );
}
