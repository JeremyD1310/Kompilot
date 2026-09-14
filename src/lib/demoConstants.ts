/**
 * demoConstants.ts — Single source of truth for demo account identifiers.
 *
 * The demo user ID 'demo-user-kompilot-test' was duplicated across 3 files:
 *   - src/lib/demoAccount.ts
 *   - src/lib/demoDomain.ts
 *   - index.html (inline script)
 *
 * This module centralizes it so changes propagate everywhere.
 */

/** Shared demo user ID — referenced by demoAccount, demoDomain, index.html, and main.tsx. */
export const DEMO_USER_ID = 'demo-user-kompilot-test';

/** Shared demo email */
export const DEMO_EMAIL = 'test@kompilot.com';

/** Shared demo display name */
export const DEMO_DISPLAY_NAME = 'Compte Démo Kompilot';
