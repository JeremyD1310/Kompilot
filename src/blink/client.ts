import { createClient } from '@blinkdotnew/sdk';

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_UXEcAOsOxa0mvkLHGpkoeneimgL-M8AK',
  auth: { mode: 'headless' },
});
