import { describe, expect, test } from 'bun:test';
import { BETA_TESTIMONIALS, getApprovedBetaTestimonials } from '../../src/data/betaTestimonials';

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
});
