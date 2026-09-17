import { describe, expect, it } from 'bun:test';
import app from '../../backend/index';

describe('backend Blink configuration boundary', () => {
  it('keeps the independent health endpoint available without Blink configuration', async () => {
    const response = await app.fetch(new Request('https://example.test/health'), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  it('returns a stable 503 before a dependent API route can call Blink', async () => {
    const response = await app.fetch(new Request('https://example.test/api/ai/models'), {});
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Blink dependency unavailable',
      code: 'BLINK_PROJECT_CONFIG_MISSING',
    });
  });
});
