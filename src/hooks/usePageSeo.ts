import { useEffect } from 'react';

export const KOMPILOT_ORIGIN = 'https://www.kompilot.fr';

type SeoOptions = {
  robots?: string;
  structuredData?: unknown;
  image?: string;
};

const OG_IMAGE = `${KOMPILOT_ORIGIN}/og-image.png`;

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeManagedStructuredData() {
  document.head.querySelectorAll('script[data-kompilot-seo="true"]').forEach(node => node.remove());
}

export function usePageSeo(title: string, description: string, path: string, options: SeoOptions = {}) {
  const robots = options.robots ?? 'index, follow';
  const image = options.image ?? OG_IMAGE;
  const cleanPath = path.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const canonical = cleanPath === '/' ? `${KOMPILOT_ORIGIN}/` : `${KOMPILOT_ORIGIN}${cleanPath}`;
  const structuredData = options.structuredData;
  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'Kompilot');
    upsertMeta('property', 'og:locale', 'fr_FR');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:image:type', 'image/png');
    upsertMeta('property', 'og:image:alt', 'Kompilot — cockpit marketing B2B pour la visibilité locale');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'twitter:image:alt', 'Kompilot — cockpit marketing B2B pour la visibilité locale');
    upsertLink('canonical', canonical);

    removeManagedStructuredData();
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.kompilotSeo = 'true';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return removeManagedStructuredData;
  }, [canonical, description, image, robots, structuredData, title]);
}
