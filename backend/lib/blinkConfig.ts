import { createClient, type BlinkClient, type BlinkClientConfig } from '@blinkdotnew/sdk';

export const BLINK_PROJECT_CONFIG_MISSING = 'BLINK_PROJECT_CONFIG_MISSING';

export class BlinkProjectConfigError extends Error {
  readonly code = BLINK_PROJECT_CONFIG_MISSING;

  constructor() {
    super(`${BLINK_PROJECT_CONFIG_MISSING}: Blink project configuration is required.`);
    this.name = 'BlinkProjectConfigError';
  }
}

export function requireBlinkProjectId(environment: { BLINK_PROJECT_ID?: string }): string {
  const projectId = environment.BLINK_PROJECT_ID?.trim();
  if (!projectId) throw new BlinkProjectConfigError();
  return projectId;
}

export const BACKEND_URL_CONFIG_MISSING = 'BACKEND_URL_CONFIG_MISSING';

export class BackendUrlConfigError extends Error {
  readonly code = BACKEND_URL_CONFIG_MISSING;

  constructor() {
    super(`${BACKEND_URL_CONFIG_MISSING}: BACKEND_URL configuration is required.`);
    this.name = 'BackendUrlConfigError';
  }
}

// BACKEND_URL must always be configured independently — never derived from BLINK_PROJECT_ID.
export function requireBackendUrl(environment: { BACKEND_URL?: string }): string {
  const backendUrl = environment.BACKEND_URL?.trim();
  if (!backendUrl) throw new BackendUrlConfigError();
  return backendUrl.replace(/\/+$/, '');
}

export const APP_URL_CONFIG_MISSING = 'APP_URL_CONFIG_MISSING';

export class AppUrlConfigError extends Error {
  readonly code = APP_URL_CONFIG_MISSING;

  constructor() {
    super(`${APP_URL_CONFIG_MISSING}: APP_URL configuration is required.`);
    this.name = 'AppUrlConfigError';
  }
}

export function requireAppUrl(environment: { APP_URL?: string }): string {
  const appUrl = environment.APP_URL?.trim();
  if (!appUrl) throw new AppUrlConfigError();
  return appUrl.replace(/\/+$/, '');
}

export type BackendDependencyConfigError = BlinkProjectConfigError | BackendUrlConfigError | AppUrlConfigError;

export function isBackendDependencyConfigError(error: unknown): error is BackendDependencyConfigError {
  return error instanceof BlinkProjectConfigError || error instanceof BackendUrlConfigError || error instanceof AppUrlConfigError;
}

// Normalized, secret-free 503 payload for any missing mandatory backend dependency.
export function backendDependencyUnavailable(error: BackendDependencyConfigError) {
  return { error: 'Backend dependency unavailable', code: error.code };
}

export function createBlinkClient(
  environment: { BLINK_PROJECT_ID?: string; BLINK_SECRET_KEY?: string },
  clientFactory: (config: BlinkClientConfig) => BlinkClient = createClient,
): BlinkClient {
  return clientFactory({
    projectId: requireBlinkProjectId(environment),
    secretKey: environment.BLINK_SECRET_KEY,
  });
}
