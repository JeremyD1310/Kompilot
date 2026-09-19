import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLINK_PROJECT_CONFIG_MISSING, BlinkProjectConfigError, createBlinkClient, requireBlinkProjectId } from '../../backend/lib/blinkConfig';
import type { BlinkClient, BlinkClientConfig } from '@blinkdotnew/sdk';

const fakeClient = {} as BlinkClient;

function backendSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? backendSources(path) : path.endsWith('.ts') ? [path] : [];
  });
}

function captureClientConfig(environment: { BLINK_PROJECT_ID?: string; BLINK_SECRET_KEY?: string }) {
  let received: BlinkClientConfig | undefined;
  const client = createBlinkClient(environment, (config) => {
    received = config;
    return fakeClient;
  });
  return { client, received };
}

describe('backend Blink project configuration', () => {
  it('uses the explicitly configured project', () => {
    const result = captureClientConfig({ BLINK_PROJECT_ID: ' kompilot-ai-suite-xxifv5sr ', BLINK_SECRET_KEY: 'synthetic' });
    expect(result.client).toBe(fakeClient);
    expect(result.received?.projectId).toBe('kompilot-ai-suite-xxifv5sr');
  });

  it('accepts the explicitly configured production fixture without making it a default', () => {
    expect(requireBlinkProjectId({ BLINK_PROJECT_ID: 'kompilot-ai-suite-xxifv5sr' })).toBe('kompilot-ai-suite-xxifv5sr');
  });

  it('rejects missing and whitespace-only configuration with a stable error', () => {
    for (const environment of [{}, { BLINK_PROJECT_ID: '' }, { BLINK_PROJECT_ID: '   ' }]) {
      expect(() => requireBlinkProjectId(environment)).toThrow(BLINK_PROJECT_CONFIG_MISSING);
      try {
        requireBlinkProjectId(environment);
      } catch (error) {
        expect(error).toBeInstanceOf(BlinkProjectConfigError);
        expect((error as Error).message).not.toContain('kompilot-ai-suite-xxifv5sr');
      }
    }
  });

  it('does not call the client factory when configuration is absent', () => {
    let calls = 0;
    expect(() => createBlinkClient({}, () => {
      calls += 1;
      return fakeClient;
    })).toThrow(BLINK_PROJECT_CONFIG_MISSING);
    expect(calls).toBe(0);
  });

  it('contains no hardcoded Blink project fallback in backend source', () => {
    const backend = backendSources(join(import.meta.dir, '../../backend'))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n');
    expect(backend).not.toMatch(/presence-manager-saas|gbrhsehk/);
    expect(backend).not.toMatch(/BLINK_PROJECT_ID\s*(\|\||\?\?)\s*['"`][^'"`]+['"`]/);
  });
});
