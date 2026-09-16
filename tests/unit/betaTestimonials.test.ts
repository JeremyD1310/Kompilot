import { describe, expect, test } from 'bun:test';
import { BETA_TESTIMONIALS, getApprovedBetaTestimonials } from '../../src/data/betaTestimonials';
import { CREDITS_PROVIDER_ERROR, requireCreditsContext } from '../../src/context/CreditsContext';
import { canRequestProtectedApi, isProtectedApiPath, isPublicOrDemoRoute } from '../../src/config/api';

describe('beta testimonials publication rules', () => {
  test('keeps the four supplied entries in the requested order', () => {
    expect(BETA_TESTIMONIALS.map(testimonial => testimonial.id)).toEqual(['julien', 'camille', 'marc', 'elodie']);
    expect(BETA_TESTIMONIALS).toHaveLength(4);
    expect(BETA_TESTIMONIALS.every(testimonial => testimonial.betaTester)).toBe(true);
  });

  test('publishes exactly the approved testimonials in the same order', () => {
    expect(getApprovedBetaTestimonials().map(testimonial => testimonial.id)).toEqual(['julien', 'camille', 'marc', 'elodie']);
    expect(getApprovedBetaTestimonials()).toHaveLength(4);
    expect(getApprovedBetaTestimonials().every(testimonial => testimonial.betaTester)).toBe(true);
    expect(getApprovedBetaTestimonials().map(testimonial => testimonial.badge)).toEqual([
      'Bêta-testeur',
      'Bêta-testeuse',
      'Bêta-testeur',
      'Bêta-testeuse',
    ]);
  });

  test('returns every entry only when each entry is explicitly approved', () => {
    const approved = BETA_TESTIMONIALS.map(testimonial => ({ ...testimonial, publicationApproved: true }));
    expect(getApprovedBetaTestimonials(approved)).toHaveLength(4);
    expect(getApprovedBetaTestimonials(approved).map(testimonial => testimonial.initials)).toEqual(['JR', 'CM', 'MD', 'ET']);
  });

  test('keeps the credits provider regression guard stable', () => {
    expect(CREDITS_PROVIDER_ERROR).toBe('useCredits must be used within CreditsProvider');
    expect(() => requireCreditsContext(null)).toThrow(CREDITS_PROVIDER_ERROR);
  });

  test('blocks protected billing and credit APIs on every public or demo route', () => {
    const publicRoutes = ['/', '/signup', '/pricing', '/temoignages', '/demo', '/demo/workspace', '/secteurs/agences', '/local', '/features', '/faq', '/ressources/guide', '/cas-clients/example'];
    for (const path of publicRoutes) {
      expect(isPublicOrDemoRoute(path)).toBe(true);
      expect(canRequestProtectedApi({ authenticated: true, demo: false, path })).toBe(false);
      expect(isProtectedApiPath('/api/credits/balance')).toBe(true);
      expect(isProtectedApiPath('/api/billing/status')).toBe(true);
    }
    expect(canRequestProtectedApi({ authenticated: true, demo: false, path: '/dashboard' })).toBe(true);
    expect(canRequestProtectedApi({ authenticated: true, demo: false, path: '/subscription' })).toBe(true);
    expect(isPublicOrDemoRoute('/dashboard')).toBe(false);
    expect(isPublicOrDemoRoute('/subscription')).toBe(false);
    expect(isPublicOrDemoRoute('/demo/workspace?tab=reviews#latest')).toBe(true);
    expect(isPublicOrDemoRoute('/')).toBe(true);
  });
});
