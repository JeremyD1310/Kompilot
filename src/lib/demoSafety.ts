import { isDemoRuntime } from './demoDomain';

export const DEMO_ACTION_MESSAGE = 'Mode démo : action simulée, aucun envoi réel.';

export type DemoExternalService =
  | 'stripe'
  | 'gmail'
  | 'resend'
  | 'sendgrid'
  | 'twilio'
  | 'meta'
  | 'google-business'
  | 'google-apis'
  | 'google-analytics'
  | 'linkedin'
  | 'tiktok'
  | 'openai'
  | 'anthropic'
  | 'claude'
  | 'perplexity'
  | 'luma'
  | 'dataforseo'
  | 'bing'
  | 'firebase'
  | 'brevo'
  | 'tavus'
  | 'social'
  | 'publishing'
  | 'review-reply'
  | 'production-db';

export interface DemoActionResult<T = unknown> {
  blocked: boolean;
  simulated: boolean;
  message: string;
  data?: T;
}

/** Central guard for all sensitive integrations. It never calls a service in demo runtime. */
export function protectDemoAction<T>(_service: DemoExternalService, simulation?: T): DemoActionResult<T> {
  if (!isDemoRuntime()) return { blocked: false, simulated: false, message: 'Action autorisée.', data: simulation };
  return { blocked: true, simulated: true, message: DEMO_ACTION_MESSAGE, data: simulation };
}

export function assertDemoSafe(service: DemoExternalService): void {
  const result = protectDemoAction(service);
  if (result.blocked) throw new Error(`${DEMO_ACTION_MESSAGE} Service bloqué : ${service}.`);
}

export function isDemoExternalUrl(input: string | URL): boolean {
  const url = String(input).toLowerCase();
  return [
    'stripe.com', 'gmail.com', 'resend.com', 'sendgrid.com', 'twilio.com',
    'brevo.com', 'mailinblue.com', 'graph.facebook.com', 'facebook.com',
    'instagram.com', 'linkedin.com', 'tiktok.com', 'ads.tiktok.com',
    'twitter.com', 'x.com', 'googleapis.com', 'google-analytics.com',
    'googletagmanager.com', 'business.google.com', 'firebaseio.com',
    'firebase.google.com', 'api.openai.com', 'api.anthropic.com',
    'anthropic.com', 'claude.ai', 'api.perplexity.ai', 'api.lumalabs.ai',
    'dataforseo.com', 'bing.com', 'tavus.io', 'youtube.com', 'youtu.be',
    '.backend.blink.new', '/api/db/', '/api/functions/',
  ].some(marker => url.includes(marker));
}

export function isDemoAllowedUrl(input: string | URL, origin: string): boolean {
  const url = String(input);
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin && !parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function createDemoBlockedResponse(): Response {
  return new Response(JSON.stringify({ blocked: true, simulated: true, message: DEMO_ACTION_MESSAGE }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'X-Kompilot-Demo-Blocked': 'true' },
  });
}
