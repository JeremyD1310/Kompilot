/**
 * techDetector.ts — Scans a public URL's HTML for known tech stack signatures.
 *
 * Cloudflare Workers runtime: uses native `fetch()` instead of axios
 * (Workers don't have Node.js `http` / `https` modules).
 *
 * Usage:
 *   import { detectTechStack } from '../lib/techDetector'
 *   const tools = await detectTechStack('https://example.com')
 *   // → ['Stripe', 'Meta Pixel', 'WordPress']
 */

export type TechCategory = 'payment' | 'funnel' | 'marketing' | 'analytics';

export interface TechDetector {
  name: string;
  category: TechCategory;
  regex: RegExp;
}

// ── 1. Technology signature registry ─────────────────────────────────────────
export const TECH_SIGNATURES: TechDetector[] = [
  // Payment
  { name: 'Stripe',        category: 'payment',   regex: /js\.stripe\.com|v3\.stripe\.com/i },
  { name: 'PayPal',        category: 'payment',   regex: /www\.paypalobjects\.com|api\.paypal\.com/i },
  { name: 'Gumroad',       category: 'payment',   regex: /assets\.gumroad\.com|gumroad\.com\/overlay/i },
  { name: 'Mollie',        category: 'payment',   regex: /js\.mollie\.com/i },
  { name: 'Braintree',     category: 'payment',   regex: /js\.braintreegateway\.com/i },

  // Funnel builders
  { name: 'ClickFunnels',  category: 'funnel',    regex: /clickfunnels\.com|cf-assets|cfcdn/i },
  { name: 'Systeme.io',    category: 'funnel',    regex: /systeme\.io|systeme-io/i },
  { name: 'WordPress',     category: 'funnel',    regex: /wp-content|wp-includes/i },
  { name: 'Kajabi',        category: 'funnel',    regex: /kajabi\.com|kajabi-static/i },
  { name: 'Teachable',     category: 'funnel',    regex: /teachable\.com|teachable-static/i },
  { name: 'Webflow',       category: 'funnel',    regex: /webflow\.com|assets-global\.website-files\.com/i },
  { name: 'Shopify',       category: 'funnel',    regex: /cdn\.shopify\.com|shopifycloud\.com/i },
  { name: 'Leadpages',     category: 'funnel',    regex: /leadpages\.net|lp-cdn\.com/i },

  // Marketing / CRM / Email
  { name: 'Typeform',          category: 'marketing', regex: /embed\.typeform\.com/i },
  { name: 'ActiveCampaign',    category: 'marketing', regex: /activecampaign\.com|\.acprop\.com/i },
  { name: 'Mailchimp',         category: 'marketing', regex: /chimpstatic\.com|mailchimp\.com/i },
  { name: 'ConvertKit',        category: 'marketing', regex: /convertkit\.com|ck\.page/i },
  { name: 'Drip',              category: 'marketing', regex: /getdrip\.com|tag\.getdrip\.com/i },
  { name: 'Lemlist',           category: 'marketing', regex: /lemlist\.com/i },
  { name: 'Brevo',             category: 'marketing', regex: /sibforms\.com|brevo\.com/i },
  { name: 'HubSpot',           category: 'marketing', regex: /js\.hs-scripts\.com|hubspot\.com/i },
  { name: 'Intercom',          category: 'marketing', regex: /widget\.intercom\.io|intercomcdn\.com/i },
  { name: 'Crisp',             category: 'marketing', regex: /client\.crisp\.chat/i },
  { name: 'Calendly',          category: 'marketing', regex: /assets\.calendly\.com|calendly\.com\/inline-widget/i },
  { name: 'Tally',             category: 'marketing', regex: /tally\.so|cdn\.tally\.so/i },

  // Analytics / Tracking
  { name: 'Meta Pixel',        category: 'analytics', regex: /connect\.facebook\.net\/en_US\/fbevents\.js/i },
  { name: 'Google Analytics',  category: 'analytics', regex: /googletagmanager\.com|google-analytics\.com|gtag\(/i },
  { name: 'Hotjar',            category: 'analytics', regex: /static\.hotjar\.com|insights\.hotjar\.com/i },
  { name: 'Clarity',           category: 'analytics', regex: /clarity\.ms/i },
  { name: 'TikTok Pixel',      category: 'analytics', regex: /analytics\.tiktok\.com/i },
  { name: 'LinkedIn Insight',  category: 'analytics', regex: /snap\.licdn\.com/i },
  { name: 'PostHog',           category: 'analytics', regex: /posthog\.com\/static\/array\.js/i },
];

// ── 2. Scanner — native fetch(), works in Cloudflare Workers ─────────────────
export async function detectTechStack(url: string): Promise<string[]> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Fetch HTML with a standard browser User-Agent (5 s timeout via AbortSignal)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      // Follow redirects (default behaviour for fetch)
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[techDetector] HTTP ${response.status} for ${normalizedUrl}`);
      return [];
    }

    // ── Stream-read strategy: read chunks until we have 200 KB or the
    // response body ends — avoids loading the entire page into memory
    // before slicing (critical for large pages in CF Workers).
    const MAX_BYTES = 200_000;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let html = '';
    let totalRead = 0;

    if (reader) {
      while (totalRead < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done || !value) break;

        const remaining = MAX_BYTES - totalRead;
        const chunk = value.byteLength <= remaining ? value : value.slice(0, remaining);
        html += decoder.decode(chunk, { stream: !done });
        totalRead += chunk.byteLength;
      }
      // Release the reader so the underlying TCP connection can be reused
      reader.cancel().catch(() => {});
    } else {
      // Fallback if ReadableStream is unavailable (older runtime)
      const buffer = await response.arrayBuffer();
      html = decoder.decode(
        buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer,
      );
    }

    const detected: string[] = [];

    for (const tech of TECH_SIGNATURES) {
      if (tech.regex.test(html)) {
        detected.push(tech.name);
      }
    }

    return detected;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[techDetector] Scan failed for ${url}: ${msg}`);
    // Return empty array — do NOT throw; the caller should degrade gracefully.
    return [];
  }
}

// ── 3. Helper: map detected names → TechStackTool[] (for FunnelSidebar) ──────
export interface TechStackTool {
  name: string;
  category: 'payment' | 'crm' | 'email' | 'analytics' | 'builder' | 'ads' | 'support' | 'other';
  confidence: number;
}

const CATEGORY_MAP: Record<TechCategory, TechStackTool['category']> = {
  payment:   'payment',
  funnel:    'builder',
  marketing: 'email',
  analytics: 'analytics',
};

export function toTechStackTools(detectedNames: string[]): TechStackTool[] {
  return detectedNames.map(name => {
    const sig = TECH_SIGNATURES.find(s => s.name === name);
    return {
      name,
      category: sig ? CATEGORY_MAP[sig.category] : 'other',
      confidence: 90, // regex-based detection = high confidence
    };
  });
}
