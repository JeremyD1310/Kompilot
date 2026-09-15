import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

export const FAQ_ITEMS = [
  { q: "Qu'est-ce qu'un logiciel de visibilité locale ?", a: "Un logiciel de visibilité locale centralise les actions qui aident une entreprise à être trouvée près de ses clients : informations locales, contenus, avis, réseaux sociaux et suivi des performances." },
  { q: "Comment fonctionne la validation humaine des réponses aux avis ?", a: "Kompilot rassemble vos avis et prépare une réponse adaptée au message et au ton de votre établissement. Une personne de votre équipe relit et valide chaque proposition avant son envoi." },
  { q: "Comment améliorer la visibilité d'un commerce sur Google ?", a: "Commencez par maintenir des informations cohérentes, répondre aux avis, publier des contenus utiles et suivre les recherches qui génèrent des visites. Kompilot regroupe ces signaux et aide à prioriser les prochaines actions." },
  { q: "Qu'est-ce que le GEO ?", a: "Le GEO, ou Generative Engine Optimization, vise à rendre une organisation et ses contenus plus faciles à comprendre, sélectionner et citer par les moteurs de réponse comme ChatGPT, Gemini ou Perplexity." },
  { q: "Comment apparaître dans ChatGPT ou Gemini ?", a: "Aucune plateforme ne peut garantir une citation. Kompilot aide toutefois à vérifier la cohérence des informations locales, les contenus et les signaux qui rendent votre activité plus compréhensible." },
  { q: "Qui valide les contenus et les réponses ?", a: "Vous gardez le contrôle : Kompilot prépare des suggestions, puis une validation humaine de votre équipe est requise avant toute publication ou réponse envoyée." },
  { q: "Kompilot convient-il aux entreprises multi-établissements ?", a: "Oui. L'offre Agency est conçue pour piloter plusieurs établissements ou clients, personnaliser les rapports et centraliser les actions depuis une seule interface." },
  { q: "Quelle différence entre Kompilot et ChatGPT ?", a: "ChatGPT est un assistant généraliste. Kompilot est un cockpit métier qui organise les données, canaux, validations et indicateurs nécessaires au pilotage continu de la visibilité locale." },
];

export function FAQSection({ onCta }: { onCta: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return <section id="faq" className="landing-section landing-faq"><div className="landing-container faq-layout"><div className="landing-section-intro"><p className="nc-section-label">Questions fréquentes</p><h2>Comprendre la visibilité locale et le GEO.</h2><p>Des réponses directes sur les avis, Google, les moteurs IA et le rôle de Kompilot.</p><button type="button" onClick={onCta} className="nc-btn-outline faq-cta">Commencer gratuitement <ArrowRight size={15} /></button><small className="content-meta">Contenu vérifié par l’équipe Kompilot · Mis à jour le 14 septembre 2026</small></div><div className="faq-list">{FAQ_ITEMS.map((item, index) => { const isOpen = openIndex === index; return <article key={item.q} className={isOpen ? 'faq-item is-open' : 'faq-item'}><button type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? null : index)}><span>{item.q}</span><ChevronDown size={17} /></button>{isOpen && <p>{item.a}</p>}</article>; })}</div></div></section>;
}
