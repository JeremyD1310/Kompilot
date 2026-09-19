import { describe, expect, test } from 'bun:test';

describe('website audit integration guards', () => {
  test('mounts the authenticated routes and never applies migrations automatically', async () => {
    const backend = await Bun.file('backend/index.ts').text();
    const route = await Bun.file('backend/routes/websiteVisibilityAudit.ts').text();
    const migration = await Bun.file('backend/migrations/003_website_visibility_audits.sql').text();
    expect(backend).toContain("from './routes/websiteVisibilityAudit'");
    expect(backend).toContain("app.route('/', websiteVisibilityAuditRouter)");
    expect(route).toContain("verifyToken");
    expect(route).toContain("authorizationConfirmed !== true");
    expect(route).toContain("WHERE user_id = ?");
    expect(migration).toContain('website_visibility_audits');
    expect(backend).not.toContain('003_website_visibility_audits.sql');
  });

  test('does not use client-side scraping or localStorage for the professional audit', async () => {
    const page = await Bun.file('src/pages/WebsiteScanPage.tsx').text();
    expect(page).toContain('/api/geo/website-audit');
    expect(page).not.toContain('blink.data.scrape');
    expect(page).not.toContain('localStorage');
    expect(page).toContain('authorizationConfirmed');
  });
});
