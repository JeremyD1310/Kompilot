/**
 * Shared type definitions for the Kompilot backend.
 * Only include secrets that are REQUIRED (set in Project Secrets).
 * Optional third-party secrets (Stripe, Meta) are accessed via (c.env as any).KEY.
 */

export type Env = {
  BLINK_PROJECT_ID:  string;
  BLINK_SECRET_KEY:  string;
  OPENAI_API_KEY:    string;
  ANTHROPIC_API_KEY: string;
  /** SerpApi key — utilisée par aioSyncService pour les requêtes SERP IA */
  SERP_API_KEY:      string;
  /** Google Analytics 4 — Compte de service IAM */
  GA4_PROPERTY_ID:  string;
  GA4_CLIENT_EMAIL: string;
  /** Clé privée RSA PKCS#8 PEM du compte de service GA4 */
  GA4_PRIVATE_KEY:  string;
};
