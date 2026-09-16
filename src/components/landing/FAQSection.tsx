import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../../lib/seoData';

export { FAQ_ITEMS };

export function FAQSection({ onCta }: { onCta: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return <section id="faq" className="landing-section landing-faq"><div className="landing-container faq-layout"><div className="landing-section-intro"><p className="nc-section-label">Questions fréquentes</p><h2>Questions fréquentes sur la visibilité locale et le GEO</h2><p>Des réponses directes sur les avis, les contenus, les moteurs de réponse et le rôle de Kompilot.</p><button type="button" onClick={onCta} className="nc-btn-outline faq-cta">Essayer Kompilot gratuitement pendant 14 jours <ArrowRight size={15} /></button><small className="content-meta">Contenu vérifié par l’équipe Kompilot · Mis à jour le 16 septembre 2026</small></div><div className="faq-list">{FAQ_ITEMS.map((item, index) => { const isOpen = openIndex === index; return <article key={item.question} className={isOpen ? 'faq-item is-open' : 'faq-item'}><button type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? null : index)}><span>{item.question}</span><ChevronDown size={17} /></button>{isOpen && <p>{item.answer}</p>}</article>; })}</div></div></section>;
}
