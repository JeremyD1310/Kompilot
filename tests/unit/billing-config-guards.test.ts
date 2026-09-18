import { describe, expect, test } from 'bun:test';

describe('commercial billing configuration guards', () => {
  test('never falls back to the retired Blink backend', async () => {
    const billingClient = await Bun.file('src/lib/billingClient.ts').text();
    const backendConfig = await Bun.file('src/lib/backend.ts').text();
    const legacyStripeService = await Bun.file('backend/lib/stripeService.ts').text();

    expect(billingClient).not.toContain('gbrhsehk.backend.blink.new');
    expect(backendConfig).not.toContain('gbrhsehk.backend.blink.new');
    expect(legacyStripeService).not.toContain('payment_method_types');
  });

  test('documents and enforces the missing configuration error', async () => {
    const backendConfig = await Bun.file('src/lib/backend.ts').text();
    expect(backendConfig).toContain("export const BACKEND_URL_CONFIG_MISSING = 'BACKEND_URL_CONFIG_MISSING'");
    expect(backendConfig).toContain('VITE_BACKEND_URL is required');
    expect(backendConfig).not.toMatch(/VITE_BACKEND_URL\s*(?:\|\||\?\?)/);
  });
});
