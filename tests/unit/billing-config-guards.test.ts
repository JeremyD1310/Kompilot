import { describe, expect, test } from 'bun:test';

describe('commercial billing configuration guards', () => {
  test('never falls back to the retired Blink backend', async () => {
    const sourceFiles = Array.from(
      new Bun.Glob('src/**/*.{ts,tsx}').scanSync({ cwd: '.', absolute: false }),
    );
    const source = await Promise.all(
      sourceFiles.map(async (path) => ({ path, content: await Bun.file(path).text() })),
    );
    const legacyStripeService = await Bun.file('backend/lib/stripeService.ts').text();

    const legacyBackendReferences = source.filter(({ content }) =>
      content.includes('gbrhsehk.backend.blink.new') ||
      content.includes('presence-manager-saas-gbrhsehk'),
    );

    expect(legacyBackendReferences.map(({ path }) => path)).toEqual([]);
    expect(legacyStripeService).not.toContain('payment_method_types');
  });

  test('documents and enforces the missing configuration error', async () => {
    const backendConfig = await Bun.file('src/lib/backend.ts').text();
    expect(backendConfig).toContain("export const BACKEND_URL_CONFIG_MISSING = 'BACKEND_URL_CONFIG_MISSING'");
    expect(backendConfig).toContain('VITE_BACKEND_URL is required');
    expect(backendConfig).not.toMatch(/VITE_BACKEND_URL\s*(?:\|\||\?\?)/);
  });
});
