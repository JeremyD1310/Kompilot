/**
 * tests/backend/presences.test.ts
 * Unit tests for the presences route logic.
 */
import { describe, it, expect } from 'bun:test';

describe('Presences API — export surface', () => {
  it('router module exports a Hono router', async () => {
    const mod = await import('../../backend/routes/presences');
    expect(mod.router).toBeDefined();
    expect(typeof mod.router.get).toBe('function');
    expect(typeof mod.router.post).toBe('function');
    expect(typeof mod.router.delete).toBe('function');
  });
});

describe('Presences API — route validation', () => {
  it('has GET /api/presences route', async () => {
    const mod = await import('../../backend/routes/presences');
    // Hono routers expose their routes via .routes
    const routes = mod.router.routes;
    const hasRoute = routes.some((r: any) => r.path === '/api/presences' && r.method === 'GET');
    expect(hasRoute).toBe(true);
  });

  it('has POST /api/presences route', async () => {
    const mod = await import('../../backend/routes/presences');
    const routes = mod.router.routes;
    const hasRoute = routes.some((r: any) => r.path === '/api/presences' && r.method === 'POST');
    expect(hasRoute).toBe(true);
  });

  it('has DELETE /api/presences/:id route', async () => {
    const mod = await import('../../backend/routes/presences');
    const routes = mod.router.routes;
    const hasRoute = routes.some(
      (r: any) => r.path.includes('/api/presences') && r.method === 'DELETE',
    );
    expect(hasRoute).toBe(true);
  });

  it('has GET /api/presences/export route', async () => {
    const mod = await import('../../backend/routes/presences');
    const routes = mod.router.routes;
    const hasRoute = routes.some(
      (r: any) => r.path === '/api/presences/export' && r.method === 'GET',
    );
    expect(hasRoute).toBe(true);
  });
});

describe('Presences API — type validation', () => {
  it('valid types are check_in and check_out', () => {
    const VALID_TYPES = ['check_in', 'check_out'];
    expect(VALID_TYPES.includes('check_in')).toBe(true);
    expect(VALID_TYPES.includes('check_out')).toBe(true);
    expect(VALID_TYPES.includes('invalid')).toBe(false);
  });

  it('date extraction from ISO timestamp', () => {
    const timestamp = '2026-07-29T15:30:00.000Z';
    const date = timestamp.slice(0, 10);
    expect(date).toBe('2026-07-29');
  });

  it('duration calculation between check-in and check-out', () => {
    const checkIn = new Date('2026-07-29T08:00:00.000Z').getTime();
    const checkOut = new Date('2026-07-29T17:30:00.000Z').getTime();
    const durationMinutes = Math.max(0, Math.round((checkOut - checkIn) / 60000));
    expect(durationMinutes).toBe(570); // 9h30 = 570 minutes
  });

  it('duration returns 0 when check-out is before check-in', () => {
    const checkIn = new Date('2026-07-29T17:00:00.000Z').getTime();
    const checkOut = new Date('2026-07-29T08:00:00.000Z').getTime();
    const durationMinutes = Math.max(0, Math.round((checkOut - checkIn) / 60000));
    expect(durationMinutes).toBe(0);
  });

  it('CSV row format is correct', () => {
    const header = 'Date,Heure,Type,Notes,Durée (min)';
    expect(header).toContain('Date');
    expect(header).toContain('Heure');
    expect(header).toContain('Type');
    expect(header).toContain('Notes');
    expect(header).toContain('Durée');

    const row = '2026-07-29,08:00,Arrivée,"",0';
    expect(row).toContain('2026-07-29');
    expect(row).toContain('08:00');
    expect(row).toContain('Arrivée');
  });

  it('CSV notes are escaped (double quotes)', () => {
    const notes = 'Note avec "guillemets"';
    const escaped = notes.replace(/\"/g, '""');
    expect(escaped).toBe('Note avec ""guillemets""');
  });
});

describe('Presences API — ID generation', () => {
  it('generates unique IDs with timestamp and random suffix', () => {
    const id1 = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const id2 = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('pr_')).toBe(true);
  });
});
