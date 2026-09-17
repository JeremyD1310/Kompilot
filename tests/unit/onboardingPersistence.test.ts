import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { persistOnboarding, type OnboardingPersistenceOperations } from '../../src/lib/onboardingPersistence';

function operations(overrides: Partial<OnboardingPersistenceOperations> = {}): OnboardingPersistenceOperations {
  return {
    listEstablishments: async () => [],
    createEstablishment: async () => undefined,
    updateEstablishment: async () => undefined,
    listProfiles: async () => [],
    createProfile: async () => undefined,
    updateProfile: async () => undefined,
    ...overrides,
  };
}

const input = {
  userId: 'user-a',
  businessName: 'Cafe Test',
  city: 'Nantes',
  sector: 'restauration',
  objective: 'visibility',
  establishmentId: 'est-a',
  profileId: 'onb_user-a',
};

describe('onboarding database persistence contract', () => {
  it('creates separated establishment and profile payloads', async () => {
    const createdEstablishments: unknown[] = [];
    const createdProfiles: unknown[] = [];
    await persistOnboarding(operations({
      createEstablishment: async payload => { createdEstablishments.push(payload); },
      createProfile: async payload => { createdProfiles.push(payload); },
    }), input);

    expect(createdEstablishments).toEqual([{
      id: 'est-a', userId: 'user-a', name: 'Cafe Test', activity: 'restauration', city: 'Nantes',
    }]);
    expect(createdProfiles).toEqual([{
      id: 'onb_user-a', userId: 'user-a', sector: 'restauration', objective: 'visibility',
    }]);
    expect(JSON.stringify(createdProfiles)).not.toContain('companyName');
    expect(JSON.stringify(createdProfiles)).not.toContain('city');
  });

  it('replays without creating duplicates and updates the newest profile deterministically', async () => {
    const createdEstablishments: unknown[] = [];
    const createdProfiles: unknown[] = [];
    const updatedEstablishments: unknown[] = [];
    const updatedProfiles: unknown[] = [];
    const ops = operations({
      listEstablishments: async () => [{ id: 'est-a', userId: 'user-a', name: 'Cafe Test', activity: 'old', city: 'Nantes', createdAt: '2026-01-01' }],
      createEstablishment: async payload => { createdEstablishments.push(payload); },
      updateEstablishment: async (id, payload) => { updatedEstablishments.push({ id, payload }); },
      listProfiles: async () => [
        { id: 'old', userId: 'user-a', sector: 'old', objective: 'old', createdAt: '2026-01-01' },
        { id: 'new', userId: 'user-a', sector: 'new', objective: 'new', createdAt: '2026-02-01' },
      ],
      createProfile: async payload => { createdProfiles.push(payload); },
      updateProfile: async (id, payload) => { updatedProfiles.push({ id, payload }); },
    });

    await persistOnboarding(ops, input);

    expect(createdEstablishments).toHaveLength(0);
    expect(createdProfiles).toHaveLength(0);
    expect(updatedEstablishments).toEqual([{ id: 'est-a', payload: { name: 'Cafe Test', activity: 'restauration', city: 'Nantes' } }]);
    expect(updatedProfiles).toEqual([{ id: 'new', payload: { userId: 'user-a', sector: 'restauration', objective: 'visibility' } }]);
  });

  it('propagates database failures so the UI can show a retryable error', async () => {
    const failure = new Error('synthetic database failure');
    await expect(persistOnboarding(operations({
      listEstablishments: async () => { throw failure; },
    }), input)).rejects.toBe(failure);
  });

  it('keeps operations isolated by the user supplied to each call', async () => {
    const payloads: unknown[] = [];
    await persistOnboarding(operations({ createEstablishment: async payload => { payloads.push(payload); } }), input);
    await persistOnboarding(operations({ createEstablishment: async payload => { payloads.push(payload); } }), { ...input, userId: 'user-b', establishmentId: 'est-b', profileId: 'onb_user-b' });
    expect(payloads).toEqual([
      { id: 'est-a', userId: 'user-a', name: 'Cafe Test', activity: 'restauration', city: 'Nantes' },
      { id: 'est-b', userId: 'user-b', name: 'Cafe Test', activity: 'restauration', city: 'Nantes' },
    ]);
  });

  it('does not bypass the onboarding schema with any or forbidden profile fields', () => {
    const source = readFileSync(new URL('../../src/components/onboarding/UnifiedOnboardingFlow.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('as any');
    expect(source).not.toContain('companyName:');
    expect(source).toContain("table<OnboardingProfileRecord>('onboarding_profiles')");
  });
});
