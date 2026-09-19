// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type DashboardActionPreferencesRow = {
  id: string
  userId: string
  actionId: string
  resolution: string
  snoozedUntil: string | null
  createdAt: string
  updatedAt: string
}

export type DashboardMilestoneEventsRow = {
  id: string
  userId: string
  establishmentId: string | null
  milestoneType: string
  payload: string
  recordedAt: string
  acknowledgedAt: string | null
}

export type EstablishmentsRow = {
  id: string
  userId: string
  name: string
  activity: string
  city: string
  aiCreditsUsed: number | string
  aiCreditsLimit: number | string
  logoUrl: string | null
  description: string | null
  website: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
  bookingUrl: string | null
  siret: string | null
  googleMapsUrl: string | null
  legalAddress: string | null
  postalCode: string | null
  activityCode: string | null
  activityLabel: string | null
  legalForm: string | null
  verificationSource: string | null
  verifiedAt: string | null
  pappersDataJson: string | null
}

export type OnboardingProfilesRow = {
  id: string
  userId: string
  sector: string
  objective: string
  createdAt: string
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
