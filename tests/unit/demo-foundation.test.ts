import { describe, expect, test } from 'bun:test';
import { createDemoData, DEMO_PERSONAS } from '../../src/data/demoData';
import { DEMO_ACTION_MESSAGE, createDemoBlockedResponse, isDemoAllowedUrl, isDemoExternalUrl } from '../../src/lib/demoSafety';

describe('demo data foundation', () => {
  test('loads all four fictional personas', () => {
    expect(DEMO_PERSONAS).toEqual(['merchant', 'artisan', 'agency', 'multi_location']);
    for (const persona of DEMO_PERSONAS) {
      const data = createDemoData(persona);
      expect(data.isFictional).toBe(true);
      expect(data.company.id.startsWith('demo-')).toBe(true);
      expect(data.establishments.length).toBeGreaterThan(0);
      expect(data.publications.length).toBeGreaterThan(0);
    }
  });

  test('keeps demo data isolated from real identifiers', () => {
    const serialized = JSON.stringify(createDemoData('merchant'));
    expect(serialized.includes('test@kompilot.com')).toBe(false);
    expect(serialized.includes('blink_user_id')).toBe(false);
    expect(serialized.includes('sk_live_')).toBe(false);
    expect(serialized.includes('demo-')).toBe(true);
  });

  test('supports local immutable seed modifications', () => {
    const original = createDemoData('artisan');
    const changed = { ...original, publications: [{ ...original.publications[0], status: 'draft' as const }] };
    expect(original.publications[0].status).toBe('published');
    expect(changed.publications[0].status).toBe('draft');
  });

  test('blocks sensitive integrations in demo mode', () => {
    expect(isDemoExternalUrl('https://api.stripe.com/v1/checkout/sessions')).toBe(true);
    expect(isDemoExternalUrl('https://graph.facebook.com/v20.0/me')).toBe(true);
    expect(isDemoExternalUrl('https://gbrhsehk.backend.blink.new/api/posts')).toBe(true);
    expect(DEMO_ACTION_MESSAGE).toBe('Mode démo : action simulée, aucun envoi réel.');
  });

  test('allows only same-origin non-API navigation and assets', async () => {
    expect(isDemoAllowedUrl('/demo/workspace', 'https://demo.kompilot.fr')).toBe(true);
    expect(isDemoAllowedUrl('https://demo.kompilot.fr/assets/app.js', 'https://demo.kompilot.fr')).toBe(true);
    expect(isDemoAllowedUrl('https://demo.kompilot.fr/api/billing/status', 'https://demo.kompilot.fr')).toBe(false);
    expect(isDemoAllowedUrl('https://gbrhsehk.backend.blink.new/health', 'https://demo.kompilot.fr')).toBe(false);
    const response = createDemoBlockedResponse();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ blocked: true, simulated: true, message: DEMO_ACTION_MESSAGE });
  });
});
