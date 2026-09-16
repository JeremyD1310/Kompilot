import { Link } from '@tanstack/react-router';
import { usePageSeo } from '../hooks/usePageSeo';
import { pageSchema } from '../lib/structuredData';
import { PublicPageShell } from '../components/public/PublicPageShell';

const drafts = [{ slug: 'agence-growth', label: 'Agence Growth', status: 'Brouillon à valider' }, { slug: 'startup-marketing', label: 'Start-up marketing', status: 'Brouillon à valider' }, { slug: 'consultant-seo', label: 'Consultant SEO', status: 'Brouillon à valider' }, { slug: 'ecommerce', label: 'E-commerce', status: 'Brouillon à valider' }];

export default function CaseStudiesPage() {
  const title = 'Retours d’expérience et cas d’usage Kompilot';
  const description = 'Modèles de cas d’usage Kompilot issus de bêta-tests, publiés uniquement après validation des informations détaillées.';
  usePageSeo(title, description, '/cas-clients', { structuredData: pageSchema('/cas-clients', title, description) });
  return <PublicPageShell title={title} eyebrow="Cas d’usage"><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Les premiers contenus sont issus de bêta-tests. Les modèles ci-dessous restent des brouillons tant que le contexte, la méthode, les résultats et la citation ne sont pas validés pour publication.</p><div className="mt-10 grid gap-5 md:grid-cols-2">{drafts.map(item => <article key={item.slug} className="rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-6"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">{item.status}</p><h2 className="mt-3 text-2xl font-bold text-white">{item.label}</h2><p className="mt-3 text-sm leading-7 text-slate-300">Modèle comprenant contexte, situation initiale, outils cités, objectif, fonctionnalités testées, durée, méthodologie, résultat observé, citation autorisée, limites et validation de publication.</p><Link to={`/cas-clients/${item.slug}`} className="mt-5 inline-flex min-h-11 items-center font-bold text-teal-300 hover:underline">Voir le modèle noindex →</Link></article>)}</div></PublicPageShell>;
}
