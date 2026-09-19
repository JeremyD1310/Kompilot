import { useParams } from '@tanstack/react-router';
import { usePageSeo } from '../hooks/usePageSeo';
import { pageSchema } from '../lib/structuredData';
import { PublicPageShell } from '../components/public/PublicPageShell';

const labels: Record<string, string> = { 'agence-growth': 'Agence Growth', 'startup-marketing': 'Start-up marketing', 'consultant-seo': 'Consultant SEO', ecommerce: 'E-commerce' };
const fields = ['Contexte', 'Situation initiale', 'Outils utilisés', 'Objectif', 'Fonctionnalités testées', 'Durée du test', 'Méthodologie', 'Résultat observé', 'Citation autorisée', 'Limites', 'Date', 'Validation de publication'];

export default function CaseStudyDraftPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const label = labels[slug] ?? 'Cas d’usage';
  const title = `${label} — modèle de cas d’usage Kompilot`;
  usePageSeo(title, 'Brouillon de cas d’usage Kompilot non indexé jusqu’à validation des informations.', `/cas-clients/${slug}`, { robots: 'noindex, nofollow', structuredData: pageSchema(`/cas-clients/${slug}`, title, 'Brouillon non indexé') });
  return <PublicPageShell title={title} eyebrow="Brouillon non indexé"><div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-6"><p className="font-bold text-amber-200">Ce modèle n’est pas un résultat client publié.</p><p className="mt-3 leading-7 text-slate-300">Aucune entreprise, métrique, durée, capture ou citation supplémentaire n’est ajoutée sans validation documentaire.</p></div><dl className="mt-10 grid gap-4 md:grid-cols-2">{fields.map(field => <div key={field} className="rounded-xl border border-white/10 bg-white/[.04] p-5"><dt className="text-sm font-bold text-white">{field}</dt><dd className="mt-2 text-sm text-slate-500">À compléter et valider avant publication.</dd></div>)}</dl></PublicPageShell>;
}
