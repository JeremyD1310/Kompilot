const PUBLIC_ORIGIN = 'https://www.kompilot.fr';

export function setPageSeo({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  document.title = title;

  let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!descriptionTag) {
    descriptionTag = document.createElement('meta');
    descriptionTag.name = 'description';
    document.head.appendChild(descriptionTag);
  }
  descriptionTag.content = description;

  const socialTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (socialTitle) socialTitle.content = title;
  const socialDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (socialDescription) socialDescription.content = description;
  const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = title;
  const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
  if (twitterDescription) twitterDescription.content = description;

  const canonicalPath = path.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const canonicalHref = `${PUBLIC_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalHref;
}
