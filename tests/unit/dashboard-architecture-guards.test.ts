import { describe, expect, test } from 'bun:test';

describe('dashboard architecture guards', () => {
  test('keeps one canonical demo workspace with a legacy redirect', async () => {
    const routes = await Bun.file('src/router/publicRoutes.tsx').text();
    const sourceFiles = Array.from(
      new Bun.Glob('src/**/*.{ts,tsx}').scanSync({ cwd: '.', absolute: false }),
    );
    const legacyLinks: string[] = [];

    for (const path of sourceFiles) {
      if (path === 'src/router/publicRoutes.tsx') continue;
      const content = await Bun.file(path).text();
      if (content.includes('/demo/dashboard')) legacyLinks.push(path);
    }

    expect(routes).toContain("path: '/demo/workspace'");
    expect(routes).toContain("redirect({ to: '/demo/workspace' })");
    expect(legacyLinks).toEqual([]);
  });

  test('persists dashboard actions and gates celebrations on recorded events', async () => {
    const dashboard = await Bun.file('src/pages/DashboardPage.tsx').text();
    const celebration = await Bun.file('src/components/dashboard/MilestoneCelebrationModal.tsx').text();
    const backendRoute = await Bun.file('backend/routes/dashboardState.ts').text();
    const migration = await Bun.file('backend/migrations/002_dashboard_state.sql').text();

    expect(dashboard).toContain('saveDashboardActionPreference');
    expect(dashboard).toContain('recordedMilestone');
    expect(celebration).toContain('recordedEventId');
    expect(celebration).toContain('acknowledgeDashboardMilestone');
    expect(backendRoute).toContain("'/api/dashboard/actions/:actionId'");
    expect(migration).toContain('dashboard_action_preferences');
    expect(migration).toContain('dashboard_milestone_events');
  });

  test('does not present the former synthetic dashboard score as measured data', async () => {
    const dashboard = await Bun.file('src/pages/DashboardPage.tsx').text();
    const executiveDashboard = await Bun.file('src/components/dashboard/B2BExecutiveDashboard.tsx').text();

    expect(dashboard).not.toMatch(/(?:score|value|current)\s*[:=]\s*78\b/i);
    expect(executiveDashboard).toContain('aucune série n’est affichée');
    expect(executiveDashboard).not.toMatch(/const SERIES|Visites qualifiées|Valeur attribuée/);
  });
});
