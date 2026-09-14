import { ArrowUpRight } from 'lucide-react';

const links = [
  {
    href: '/fonctionnalites/avis-google',
    label: 'Découvrez l’automatisation des avis Google après chaque prestation',
  },
  {
    href: '/fonctionnalites/no-shows',
    label: 'Réduisez les rendez-vous manqués grâce aux rappels automatisés',
  },
  {
    href: '/fonctionnalites/social',
    label: 'Centralisez vos réseaux sociaux et votre boîte de réception',
  },
  {
    href: '/local',
    label: 'Explorez notre ancrage pour les commerçants locaux en Charente',
  },
];

export default function InternalLinkingSection() {
  return (
    <nav aria-label="Fonctionnalités commerciales de Kompilot" className="mt-12 border-t border-[hsl(var(--landing-border))] pt-8">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--landing-muted))]">
        Explorer les fonctionnalités de Kompilot
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] p-4 text-sm font-medium text-[hsl(var(--landing-body))] transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--landing-primary-bright)/.55)] hover:bg-[hsl(var(--landing-primary)/.12)] hover:text-[hsl(var(--landing-primary-bright))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--landing-primary-bright))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--landing-bg-alt))]"
          >
            <span>{link.label}</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>
    </nav>
  );
}
