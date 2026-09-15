import { describe, expect, test } from 'bun:test';
import { BETA_TESTIMONIALS, getApprovedBetaTestimonials } from '../../src/data/betaTestimonials';

describe('beta testimonials publication rules', () => {
  test('keeps the four supplied entries in the requested order', () => {
    expect(BETA_TESTIMONIALS.map(testimonial => testimonial.id)).toEqual(['julien', 'camille', 'marc', 'elodie']);
    expect(BETA_TESTIMONIALS).toHaveLength(4);
    expect(BETA_TESTIMONIALS.every(testimonial => testimonial.betaTester)).toBe(true);
  });

  test('does not expose unapproved testimonials to the public selector', () => {
    expect(getApprovedBetaTestimonials()).toEqual([]);
  });

  test('returns every entry only when each entry is explicitly approved', () => {
    const approved = BETA_TESTIMONIALS.map(testimonial => ({ ...testimonial, publicationApproved: true }));
    expect(getApprovedBetaTestimonials(approved)).toHaveLength(4);
    expect(getApprovedBetaTestimonials(approved).map(testimonial => testimonial.initials)).toEqual(['JR', 'CM', 'MD', 'ET']);
  });
});
