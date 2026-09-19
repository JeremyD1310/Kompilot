export interface EstablishmentRecord {
  id: string;
  userId: string;
  name: string;
  activity: string;
  city: string;
  createdAt?: string;
}

export interface OnboardingProfileRecord {
  id: string;
  userId: string;
  sector: string;
  objective: string;
  createdAt?: string;
}

export interface EstablishmentPayload {
  id: string;
  userId: string;
  name: string;
  activity: string;
  city: string;
}

export interface OnboardingProfilePayload {
  id: string;
  userId: string;
  sector: string;
  objective: string;
}

export interface OnboardingPersistenceOperations {
  listEstablishments: () => Promise<EstablishmentRecord[]>;
  createEstablishment: (payload: EstablishmentPayload) => Promise<unknown>;
  updateEstablishment: (id: string, payload: Omit<EstablishmentPayload, 'id' | 'userId'>) => Promise<unknown>;
  listProfiles: () => Promise<OnboardingProfileRecord[]>;
  createProfile: (payload: OnboardingProfilePayload) => Promise<unknown>;
  updateProfile: (id: string, payload: Omit<OnboardingProfilePayload, 'id'>) => Promise<unknown>;
}

export interface OnboardingPersistenceInput {
  userId: string;
  businessName: string;
  city: string;
  sector: string;
  objective: string;
  establishmentId: string;
  profileId: string;
}

function byCreatedAtDescending<T extends { createdAt?: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''));
}

export async function persistOnboarding(
  operations: OnboardingPersistenceOperations,
  input: OnboardingPersistenceInput,
): Promise<void> {
  const establishments = await operations.listEstablishments();
  const existingEstablishment = establishments
    .filter(row => row.name === input.businessName && row.city === input.city)
    .sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? ''))[0];

  if (existingEstablishment) {
    await operations.updateEstablishment(existingEstablishment.id, {
      name: input.businessName,
      activity: input.sector,
      city: input.city,
    });
  } else {
    await operations.createEstablishment({
      id: input.establishmentId,
      userId: input.userId,
      name: input.businessName,
      activity: input.sector,
      city: input.city,
    });
  }

  const profiles = byCreatedAtDescending(await operations.listProfiles());
  const existingProfile = profiles[0];
  if (existingProfile) {
    await operations.updateProfile(existingProfile.id, {
      userId: input.userId,
      sector: input.sector,
      objective: input.objective,
    });
  } else {
    await operations.createProfile({
      id: input.profileId,
      userId: input.userId,
      sector: input.sector,
      objective: input.objective,
    });
  }
}
