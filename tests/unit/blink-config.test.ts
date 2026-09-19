import { describe, expect, it } from 'bun:test';
import type { BlinkClient, BlinkClientConfig } from '@blinkdotnew/sdk';
import { createBlinkClient, resolveBlinkProjectId } from '../../src/blink/config';

const fakeClient = {} as BlinkClient;

describe('Blink project configuration', () => {
  it('fails closed without calling the Blink client factory when the project is absent', () => {
    let calls = 0;
    const clientFactory = (config: BlinkClientConfig): BlinkClient => {
      calls += 1;
      return fakeClient;
    };

    expect(() => createBlinkClient({}, clientFactory)).toThrow('VITE_BLINK_PROJECT_ID');
    expect(calls).toBe(0);
  });

  it('uses the preview project when VITE_BLINK_PROJECT_ID is provided', () => {
    let receivedProjectId = '';
    const clientFactory = (config: BlinkClientConfig): BlinkClient => {
      receivedProjectId = config.projectId;
      return fakeClient;
    };

    createBlinkClient({ VITE_BLINK_PROJECT_ID: ' kompilot-ai-suite-xxifv5sr ' }, clientFactory);

    expect(resolveBlinkProjectId({ VITE_BLINK_PROJECT_ID: ' kompilot-ai-suite-xxifv5sr ' })).toBe('kompilot-ai-suite-xxifv5sr');
    expect(receivedProjectId).toBe('kompilot-ai-suite-xxifv5sr');
  });
});
