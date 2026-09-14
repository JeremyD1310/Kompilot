/**
 * Standalone Facebook Publishing Service
 *
 * Re-exports token exchange and publishing functions from the shared
 * metaPublishingService for use by the standalone Facebook OAuth route.
 *
 * Uses the same Meta Graph API under the hood but stores tokens separately
 * as provider 'facebook' for independent channel control.
 */

export {
  exchangeForLongLivedToken,
  getUserPages,
  publishToFacebookPage,
  validateToken,
  MetaApiError,
} from './metaPublishingService';

export type {
  MetaPage,
  PublishResult,
  PublishPayload,
} from './metaPublishingService';
