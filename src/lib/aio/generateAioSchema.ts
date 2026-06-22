/**
 * generateAioSchema — Generates Schema.org JSON-LD for LLM-optimised indexing.
 *
 * LLMs (ChatGPT, Gemini, Perplexity…) prioritise clear data structures and
 * direct FAQ blocks when deciding which brands to cite in their answers.
 * Injecting this JSON-LD in a page's <head> or via a structured data API
 * significantly improves the chance of being cited.
 *
 * Usage:
 *   const schema = generateAioSchema({ name, description, price, faqs });
 *   // Inject as: <script type="application/ld+json">{JSON.stringify(schema)}</script>
 */

export interface AioFaq {
  question: string;
  answer: string;
}

export interface AioProductData {
  name: string;
  description: string;
  price: number | string;
  faqs: AioFaq[];
  /** Optional: currency ISO code, defaults to EUR */
  currency?: string;
  /** Optional: URL of the product page */
  url?: string;
  /** Optional: brand / publisher name */
  brand?: string;
}

export interface AioSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url?: string;
  brand?: { '@type': string; name: string };
  offers: {
    '@type': string;
    priceCurrency: string;
    price: number | string;
  };
  /** FAQ items mapped as Question → Answer for LLM extraction */
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

export function generateAioSchema(productData: AioProductData): AioSchema {
  // LLMs scan clear data structures and direct FAQs first
  const schema: AioSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    description: productData.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: productData.currency ?? 'EUR',
      price: productData.price,
    },
    // FAQ structure forces extraction by AI bots
    mainEntity: productData.faqs.map(faq => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    })),
  };

  if (productData.url) schema.url = productData.url;
  if (productData.brand) schema.brand = { '@type': 'Brand', name: productData.brand };

  return schema;
}

/** Serialise to a ready-to-inject <script> tag string */
export function generateAioSchemaTag(productData: AioProductData): string {
  const schema = generateAioSchema(productData);
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}
