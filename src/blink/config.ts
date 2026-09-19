import type { BlinkClient, BlinkClientConfig } from '@blinkdotnew/sdk';

export interface BlinkEnvironment {
  VITE_BLINK_PROJECT_ID?: string;
  VITE_BLINK_PUBLISHABLE_KEY?: string;
}

export function resolveBlinkProjectId(environment: BlinkEnvironment): string {
  const projectId = environment.VITE_BLINK_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error('Blink project configuration is missing: set VITE_BLINK_PROJECT_ID.');
  }
  return projectId;
}

export function createBlinkClient(
  environment: BlinkEnvironment,
  clientFactory: (config: BlinkClientConfig) => BlinkClient,
): BlinkClient {
  return clientFactory({
    projectId: resolveBlinkProjectId(environment),
    publishableKey: environment.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_UXEcAOsOxa0mvkLHGpkoeneimgL-M8AK',
    auth: { mode: 'headless' },
  });
}
