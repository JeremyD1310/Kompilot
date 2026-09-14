import { useEffect } from 'react';

export const KOMPILOT_ORIGIN = 'https://www.kompilot.fr';

type SeoOptions = {
  robots?: string;
  structuredData?: unknown;
  image?: string;
};

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
  const image = options.image ?? `${KOMPILOT_ORIGIN}/og-image.png`;
  const canonical = `${KOMPILOT_ORIGIN}${path === '/' ? '/' : path}`;
  const structuredData = options.structuredData;

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
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
