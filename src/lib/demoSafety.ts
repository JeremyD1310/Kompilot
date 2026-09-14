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
    'graph.facebook.com', 'facebook.com', 'instagram.com', 'linkedin.com',
    'twitter.com', 'x.com', 'googleapis.com', 'business.google.com',
    '.backend.blink.new', '/api/db/', '/api/functions/',
  ].some(marker => url.includes(marker));
}

export function createDemoBlockedResponse(): Response {
  return new Response(JSON.stringify({ blocked: true, simulated: true, message: DEMO_ACTION_MESSAGE }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'X-Kompilot-Demo-Blocked': 'true' },
  });
}
