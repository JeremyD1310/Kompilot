// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type BlinkQueuesRow = {
  name: string
  parallelism: number | string | null
  createdAt: string
}

export type BlinkSchedulesRow = {
  name: string
  scheduleId: string | null
  cron: string
  timezone: string | null
  taskName: string
  payload: string | null
  isPaused: number | string | null
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
}

export type BlinkTasksRow = {
  id: string
  taskName: string
  payload: string | null
  status: string
  queue: string | null
  messageId: string | null
  dlqId: string | null
  maxRetries: number | string | null
  attempt: number | string | null
  result: string | null
  error: string | null
  createdAt: string
  completedAt: string | null
  failedAt: string | null
}

export type AbEmailTestsRow = {
  id: string
  userId: string
  name: string
  testType: string
  fromEmail: string
  fromName: string
  baseHtmlContent: string
  variantALabel: string
  variantBLabel: string
  variantASubject: string
  variantBSubject: string
  variantAFromName: string
  variantBFromName: string
  variantAHtml: string
  variantBHtml: string
  recipientsA: string
  recipientsB: string
  totalRecipients: number | string
  status: string
  sentAt: string | null
  winnerVariant: string | null
  createdAt: string | null
}

export type AdAccountsRow = {
  id: string
  userId: string
  organizationId: string
  connectionId: string
  provider: string
  externalId: string
  name: string
  currency: string
  status: string
  isSelected: number | string
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
  externalStatus: string
}

export type AdAlertPreferencesRow = {
  id: string
  userId: string
  organizationId: string
  provider: string
  inAppEnabled: number | string
  slackEnabled: number | string
  slackWebhookUrlEncrypted: string
  createdAt: string
  updatedAt: string
}

export type AdCampaignsRow = {
  id: string
  userId: string
  name: string
  platform: string
  objective: string
  audience: string
  budgetCents: number | string
  dailyBudgetCents: number | string
  startDate: string
  endDate: string
  creativeText: string
  imageUrl: string
  status: string
  providerCampaignId: string
  providerStatus: string
  createdAt: string
  updatedAt: string
}

export type AdConnectionEventsRow = {
  id: string
  userId: string
  organizationId: string
  provider: string
  eventType: string
  message: string
  createdAt: string
  correlationId: string
  errorCode: string
  metadataJson: string
}

export type AdConnectionsRow = {
  id: string
  userId: string
  organizationId: string
  provider: string
  encryptedAccessToken: string
  encryptedRefreshToken: string
  tokenExpiresAt: string
  scopes: string
  status: string
  accountCount: number | string
  lastSyncAt: string | null
  lastError: string
  createdAt: string
  updatedAt: string
  revokedAt: string | null
  disconnectedAt: string | null
  lastErrorCode: string
  disconnectReason: string
}

export type AdMetricsRow = {
  id: string
  userId: string
  organizationId: string
  adAccountId: string
  provider: string
  campaignId: string
  campaignName: string
  metricDate: string
  spendCents: number | string
  impressions: number | string
  clicks: number | string
  conversions: number | string
  revenueCents: number | string
  currency: string
  rawJson: string
  createdAt: string
}

export type AdOauthStatesRow = {
  id: string
  stateHash: string
  userId: string
  organizationId: string
  provider: string
  returnTo: string
  correlationId: string
  expiresAt: string
  consumedAt: string | null
  createdAt: string
}

export type AdOrganizationMembersRow = {
  id: string
  userId: string
  organizationId: string
  role: string
  status: string
  createdAt: string
}

export type AdOrganizationsRow = {
  id: string
  userId: string
  ownerUserId: string
  name: string
  organizationType: string
  createdAt: string
  updatedAt: string
}

export type AdSyncRunsRow = {
  id: string
  userId: string
  organizationId: string
  provider: string
  status: string
  startedAt: string
  completedAt: string | null
  rowsSynced: number | string
  error: string
  requestedDays: number | string
  finishedAt: string | null
  rowsRead: number | string
  rowsWritten: number | string
  pagesRead: number | string
  accountsProcessed: number | string
  attemptCount: number | string
  correlationId: string
  errorCode: string
  updatedAt: string
  errorMessage: string
}

export type AdminLogsRow = {
  id: string
  adminEmail: string
  adminUserId: string
  actionType: string
  targetUserId: string | null
  targetEmail: string | null
  description: string
  metadata: string
  createdAt: string
}

export type AdvisoryReportsRow = {
  id: string
  userId: string
  scope: string
  reportJson: string
  dataFingerprint: string
  createdAt: string
}

export type AffiliateClicksRow = {
  id: string
  affiliateId: string
  ipAddress: string | null
  userAgent: string | null
  converted: number | string
  createdAt: string
}

export type AffiliatesRow = {
  id: string
  userId: string
  referralCode: string
  commissionPercent: number | string
  totalReferrals: number | string
  totalConversions: number | string
  totalCommissionCents: number | string
  isActive: number | string
  createdAt: string
  updatedAt: string
}

export type AgencyApprovalRequestsRow = {
  id: string
  userId: string
  title: string
  clientName: string
  postIds: string
  status: string
  secureToken: string
  expiresAt: string
  feedback: string
  createdAt: string
  updatedAt: string
}

export type AgencyApprovalsRow = {
  id: string
  workspaceId: string
  contentItemId: string
  versionId: string
  status: string
  requestedBy: string
  reviewedBy: string | null
  feedback: string
  createdAt: string
  reviewedAt: string | null
}

export type AgencyAssetsRow = {
  id: string
  workspaceId: string
  name: string
  fileUrl: string
  fileType: string
  fileSize: number | string
  tags: string
  createdBy: string
  createdAt: string
}

export type AgencyBrandKitsRow = {
  id: string
  userId: string
  name: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  headingFont: string
  bodyFont: string
  createdAt: string
  updatedAt: string
}

export type AgencyBrandKitsV2Row = {
  id: string
  workspaceId: string
  name: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  headingFont: string
  bodyFont: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type AgencyBrandSettingsRow = {
  id: string
  userId: string
  agencyName: string
  logoUrl: string | null
  primaryColor: string | null
  customDomain: string | null
  domainStatus: string | null
  domainSslStatus: string | null
  domainCheckedAt: string | null
  cnameTarget: string | null
  isActive: number | string
  createdAt: string
  updatedAt: string
}

export type AgencyCalendarEventsRow = {
  id: string
  workspaceId: string
  contentItemId: string | null
  title: string
  startsAt: string
  endsAt: string | null
  channel: string
  status: string
  createdBy: string
  createdAt: string
}

export type AgencyCarouselDraftsRow = {
  id: string
  userId: string
  title: string
  platform: string
  canvasWidth: number | string
  canvasHeight: number | string
  slidesJson: string
  hook: string
  status: string
  brandKitId: string
  createdAt: string
  updatedAt: string
}

export type AgencyCommentsRow = {
  id: string
  workspaceId: string
  contentItemId: string
  versionId: string | null
  authorId: string
  body: string
  createdAt: string
}

export type AgencyContentItemsRow = {
  id: string
  workspaceId: string
  title: string
  contentType: string
  status: string
  currentVersionId: string | null
  createdBy: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

export type AgencyContentVersionsRow = {
  id: string
  workspaceId: string
  contentItemId: string
  versionNumber: number | string
  body: string
  metadata: string
  createdBy: string
  createdAt: string
}

export type AgencyInvitesRow = {
  id: string
  agencyUserId: string
  clientEmail: string
  clientName: string
  token: string
  status: string
  createdAt: string
  expiresAt: string | null
  subAccountId: string | null
}

export type AgencyMediaAssetsRow = {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileType: string
  fileSize: number | string
  tags: string
  folder: string
  createdAt: string
}

export type AgencySectorTemplatesRow = {
  id: string
  userId: string
  sector: string
  name: string
  platform: string
  hook: string
  body: string
  cta: string
  createdAt: string
}

export type AgencySubAccountsRow = {
  id: string
  agencyUserId: string
  clientUserId: string
  clientName: string
  planId: string | null
  isActive: number | string
  createdAt: string
  updatedAt: string
  inviteId: string | null
  status: string
}

export type AgencyWorkspaceMembersRow = {
  id: string
  workspaceId: string
  userId: string
  role: string
  status: string
  createdAt: string
}

export type AgencyWorkspacesRow = {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type AiUsageLogsRow = {
  id: string
  userId: string
  establishmentId: string | null
  actionType: string
  model: string
  tokensIn: number | string
  tokensOut: number | string
  creditsCost: number | string
  status: string
  errorMessage: string | null
  metadata: string
  createdAt: string
}

export type AttributionTouchpointsRow = {
  id: string
  userId: string
  leadId: string
  anonymousId: string
  sessionId: string
  channel: string
  source: string
  medium: string
  campaign: string
  content: string
  clickId: string
  occurredAt: string
  consentStatus: string
  metadata: string
}

export type AuditFlashLogsRow = {
  id: string
  userId: string
  businessName: string
  city: string
  sector: string
  createdAt: string
}

export type BillingOrdersRow = {
  id: string
  userId: string
  organizationId: string
  workspaceId: string
  businessKey: string
  stripeEventId: string
  stripeSessionId: string
  status: string
  createdAt: string
  updatedAt: string
  metadata: string
}

export type CampaignContactsRow = {
  id: string
  campaignId: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  company: string | null
  tags: string | null
  customFields: string | null
  status: string
  brevoContactId: string | null
  source: string
  createdAt: string
}

export type CampaignEventsRow = {
  id: string
  campaignId: string
  contactEmail: string
  eventType: string
  eventData: string | null
  ipAddress: string | null
  userAgent: string | null
  brevoEventId: string | null
  createdAt: string
}

export type CampaignPerformanceRow = {
  id: string
  userId: string
  campaignName: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  totalPosts: number | string
  totalImpressions: number | string
  totalReach: number | string
  totalClicks: number | string
  totalShares: number | string
  totalComments: number | string
  avgEngagementRate: number | string
  avgCtr: number | string
  periodStart: string
  periodEnd: string
  createdAt: string
  updatedAt: string
}

export type CampaignsRow = {
  id: string
  userId: string
  establishmentId: string | null
  name: string
  subject: string
  fromName: string
  fromEmail: string
  templateId: string | null
  templateName: string | null
  htmlContent: string | null
  status: string
  planType: string
  recipientCount: number | string
  sentCount: number | string
  openCount: number | string
  clickCount: number | string
  bounceCount: number | string
  unsubscribeCount: number | string
  brevoCampaignId: string | null
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
}

export type CapturedLeadsRow = {
  id: string
  userId: string
  establishmentId: string | null
  campaignId: string | null
  firstName: string
  lastName: string
  phone: string
  email: string | null
  source: string
  offerLabel: string | null
  smsSent: number | string
  smsSentAt: string | null
  smsMessage: string | null
  createdAt: string | null
}

export type ClientApprovalTokensRow = {
  id: string
  userId: string
  token: string
  clientName: string
  agencyName: string
  agencyLogoUrl: string | null
  whiteLabelDomain: string | null
  postIds: string
  aiSummary: string | null
  status: string
  expiresAt: string
  approvedAt: string | null
  modificationRequest: string | null
  createdAt: string | null
}

export type ClientExportReportsRow = {
  id: string
  userId: string
  funnelId: string
  reportToken: string
  agencyName: string | null
  agencyLogoUrl: string | null
  title: string
  summaryData: string
  expiresAt: string | null
  viewCount: number | string
  createdAt: string | null
}

export type CoachTipInteractionsRow = {
  id: string
  tipId: string
  userId: string
  interactionType: string
  createdAt: string
}

export type CoachTipSettingsRow = {
  id: string
  userId: string
  enabledCategories: string
  frequencySeconds: number | string
  isEnabled: number | string
  createdAt: string
  updatedAt: string
}

export type CoachTipsRow = {
  id: string
  category: string
  title: string
  content: string
  platform: string | null
  priority: number | string
  status: string
  submittedBy: string | null
  submittedByName: string | null
  views: number | string
  likes: number | string
  clicks: number | string
  isSystem: number | string
  createdAt: string
  updatedAt: string
}

export type CompaniesRow = {
  id: string
  siret: string
  companyName: string
  legalAddress: string
  city: string
  postalCode: string
  activityCode: string
  activityLabel: string
  legalForm: string
  adminUid: string
  subscriptionPlan: string
  members: string
  isActive: number | string
  createdAt: string
  updatedAt: string
}

export type CompetitorAlertSnapshotsRow = {
  id: string
  userId: string
  competitorId: string
  metricsJson: string
  source: string
  capturedAt: string
  createdAt: string
}

export type CompetitorAlertsRow = {
  id: string
  userId: string
  competitorId: string
  competitorName: string
  metric: string
  operator: string
  threshold: number | string
  cadence: string
  channels: string
  enabled: number | string
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

export type CompetitorsRow = {
  id: string
  userId: string
  name: string
  handle: string | null
  platforms: string
  createdAt: string
  updatedAt: string
}

export type ComplianceConsentLogRow = {
  id: string
  userId: string
  cgvVersion: string
  cgvAccepted: number | string
  retractionWaived: number | string
  acceptedAt: string
  serverTimestamp: string
  ip: string
  userAgent: string | null
  planId: string | null
  checkoutType: string
  createdAt: string | null
  renouncedTrial: number | string
  trialRenouncedAt: string | null
}

export type ContentSuggestionsRow = {
  id: string
  userId: string
  title: string
  suggestion: string
  rationale: string
  platform: string
  sourceMetric: string
  sourceValue: string
  status: string
  createdAt: string
}

export type ConversionEventsRow = {
  id: string
  userId: string
  eventType: string
  funnelStep: string
  source: string
  medium: string
  campaign: string
  planId: string | null
  amountCents: number | string
  establishmentId: string | null
  metadata: string
  createdAt: string
}

export type CouponsRow = {
  id: string
  userId: string
  code: string
  discountType: string
  discountValue: number | string
  description: string
  validUntil: string | null
  maxUses: number | string | null
  currentUses: number | string
  isActive: number | string
  establishmentId: string | null
  createdAt: string
}

export type CreativeReportsRow = {
  id: string
  userId: string
  orgId: string
  adAccountId: string
  adsAnalyzed: number | string
  budgetWasteDetected: number | string
  winners: string
  losers: string
  nextActions: string
  rawMetaData: string
  createdAt: string | null
}

export type CreditAccountsRow = {
  id: string
  userId: string
  planId: string
  periodKey: string
  periodEndsAt: string
  aiIncluded: number | string
  aiRemaining: number | string
  aiUsed: number | string
  aiPurchasedRemaining: number | string
  smsIncluded: number | string
  smsRemaining: number | string
  smsUsed: number | string
  smsPurchasedRemaining: number | string
  createdAt: string
  updatedAt: string
}

export type CreditPurchasesRow = {
  id: string
  userId: string
  creditType: string
  credits: number | string
  remaining: number | string
  expiresAt: string
  stripeSessionId: string
  productId: string
  createdAt: string
  updatedAt: string
}

export type CreditTransactionsRow = {
  id: string
  userId: string
  type: string
  actionType: string
  creditsDelta: number | string
  balanceAfter: number | string
  description: string
  referenceId: string | null
  metadata: string
  createdAt: string
  creditType: string
  sourceType: string
  expiresAt: string | null
  periodKey: string
}

export type CrmContactsRow = {
  id: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  company: string | null
  tags: string | null
  customFields: string | null
  source: string | null
  status: string | null
  notes: string | null
  lastContactedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CrmEmailTemplatesRow = {
  id: string
  userId: string
  name: string
  subject: string | null
  htmlContent: string | null
  jsonBlocks: string | null
  thumbnailUrl: string | null
  category: string | null
  isFavorite: number | string | null
  lastUsedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CrmSegmentContactsRow = {
  id: string
  segmentId: string
  contactId: string
  addedAt: string | null
}

export type CrmSegmentsRow = {
  id: string
  userId: string
  name: string
  description: string | null
  filterRules: string | null
  contactCount: number | string | null
  isDynamic: number | string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CrmUploadedFilesRow = {
  id: string
  userId: string
  filename: string
  fileType: string
  fileSize: number | string | null
  fileUrl: string | null
  parsedRows: number | string | null
  status: string | null
  metadata: string | null
  createdAt: string | null
}

export type CustomActivityReportsRow = {
  id: string
  userId: string
  name: string
  description: string
  dateRange: string
  startDate: string | null
  endDate: string | null
  metricsJson: string
  channelsJson: string
  includeActivity: number | string
  schedule: string
  createdAt: string
  updatedAt: string
}

export type CustomerPersonasRow = {
  id: string
  userId: string
  name: string
  age: number | string | null
  jobTitle: string | null
  painPoints: string
  goals: string
  buyingTriggers: string
  description: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type DailyAnalyticsRow = {
  id: string
  establishmentId: string
  userId: string
  snapshotDate: string
  geoScore: number | string
  unhandledReviews: number | string
  postsPublished: number | string
  reviewsHandled: number | string
  smsSent: number | string
  localVisibility: number | string
  missingKeywords: string
  noshowRevenueCents: number | string
  extendedData: string
  createdAt: string
}

export type DetectedThreadsRow = {
  id: string
  trackerId: string
  userId: string
  title: string
  url: string
  subreddit: string
  author: string
  content: string
  keywordMatched: string | null
  competitorMatched: string | null
  intentType: string
  geoScore: number | string
  status: string
  calendarEventId: string | null
  exportedToStudio: number | string
  isIndexedByAi: number | string
  aiDraft: string | null
  aiVerificationDate: string | null
  createdAt: string | null
  updatedAt: string | null
  confidence: number | string
  keySignals: string
  reasoning: string
  recommendedAction: string
  scoringVersion: string
  scoringProvider: string
}

export type DraftApprovalRequestsRow = {
  id: string
  userId: string
  postId: string
  title: string
  collaboratorEmail: string
  collaboratorName: string
  token: string
  status: string
  feedback: string
  expiresAt: string
  decidedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EmailNotificationLogRow = {
  id: string
  userId: string | null
  recipientEmail: string
  notificationType: string
  subject: string
  status: string
  messageId: string | null
  errorMessage: string | null
  metadata: string
  createdAt: string
}

export type EmailSequenceEnrollmentsRow = {
  id: string
  sequenceId: string
  userId: string
  contactEmail: string
  contactName: string
  enrolledAt: string
  currentStep: number | string
  status: string
  lastSentAt: string | null
  completedAt: string | null
}

export type EmailSequenceStepsRow = {
  id: string
  sequenceId: string
  userId: string
  stepOrder: number | string
  delayDays: number | string
  delayHours: number | string
  subject: string
  htmlContent: string
  sendTime: string
  status: string
  createdAt: string | null
}

export type EmailSequencesRow = {
  id: string
  userId: string
  name: string
  triggerType: string
  triggerConfig: string
  status: string
  fromEmail: string
  fromName: string
  sendgridKey: string
  totalEnrolled: number | string
  totalSent: number | string
  createdAt: string | null
  updatedAt: string | null
}

export type EspionAnalysesRow = {
  id: string
  userId: string
  scanId: string
  platform: string
  advertiserName: string
  adName: string
  sourceUrl: string
  creativeType: string
  description: string
  overallScore: number | string
  maturityScore: number | string
  analysisJson: string
  createdAt: string
  updatedAt: string
}

export type EspionAnalysisFeedbackRow = {
  id: string
  analysisId: string
  scanId: string
  userId: string
  actualAdStatus: string
  isFalsePositive: number | string
  reviewOutcome: string
  reviewReason: string
  scoringVersion: string
  reviewedAt: string | null
  createdAt: string
}

export type EspionBenchmarksRow = {
  id: string
  userId: string
  name: string
  platform: string
  vertical: string
  region: string
  sampleSize: number | string
  metricsJson: string
  source: string
  createdAt: string
  updatedAt: string
}

export type EspionCommentsRow = {
  id: string
  userId: string
  analysisId: string
  authorUserId: string
  authorEmail: string
  body: string
  mentions: string
  createdAt: string
  updatedAt: string
}

export type EspionFoldersRow = {
  id: string
  userId: string
  name: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
}

export type EspionScansRow = {
  id: string
  userId: string
  platform: string
  targetUrl: string
  advertiserName: string
  adName: string
  countryCode: string
  locale: string
  status: string
  progress: number | string
  attemptCount: number | string
  maxAttempts: number | string
  retryable: number | string
  sourceStatuses: string
  errorCode: string | null
  errorMessage: string | null
  inputPayload: string
  resultJson: string | null
  startedAt: string | null
  heartbeatAt: string | null
  completedAt: string | null
  nextRetryAt: string | null
  createdAt: string
  updatedAt: string
}

export type EspionSharesRow = {
  id: string
  userId: string
  analysisId: string
  sharedWithUserId: string
  sharedWithEmail: string
  permission: string
  createdAt: string
}

export type EspionSwipesRow = {
  id: string
  userId: string
  analysisId: string
  folderId: string | null
  title: string
  notes: string
  tags: string
  isFavorite: number | string
  createdAt: string
  updatedAt: string
}

export type EstablishmentsRow = {
  id: string
  userId: string
  name: string
  activity: string
  city: string
  aiCreditsUsed: number | string | null
  aiCreditsLimit: number | string | null
  logoUrl: string | null
  description: string | null
  website: string | null
  phone: string | null
  createdAt: string | null
  updatedAt: string | null
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

export type FunnelAnalysisCacheRow = {
  id: string
  domainUrl: string
  competitorName: string
  analysisData: string
  expiresAt: string
  createdAt: string | null
  updatedAt: string | null
}

export type FunnelGhostEmailsRow = {
  id: string
  funnelId: string
  userId: string
  trackingEmail: string
  senderName: string | null
  senderEmail: string | null
  subject: string | null
  body: string | null
  receivedAt: string | null
  createdAt: string | null
}

export type FunnelNodesRow = {
  id: string
  funnelId: string
  userId: string
  type: string
  title: string
  url: string | null
  metadata: string
  positionOrder: number | string
  createdAt: string
}

export type FunnelOrganicDataRow = {
  id: string
  funnelId: string
  userId: string
  domain: string
  topKeywords: string
  topReferringDomains: string
  estimatedOrganicTraffic: number | string | null
  lastRefreshedAt: string | null
  createdAt: string | null
}

export type FunnelsRow = {
  id: string
  userId: string
  creatorName: string
  domainUrl: string
  estimatedSpend: number | string
  performanceScore: number | string
  platform: string
  isSample: number | string
  createdAt: string
  isWatched: number | string
}

export type GdprProcessingRegisterRow = {
  id: string
  processingName: string
  purpose: string
  legalBasis: string
  dataCategories: string
  dataSubjects: string
  recipients: string
  internationalTransfer: string
  retentionRule: string
  securityMeasures: string
  owner: string
  status: string
  updatedAt: string
}

export type GhostEmailAnalyticsRow = {
  id: string
  funnelId: string
  userId: string
  ghostEmailId: string | null
  eventType: string
  eventUrl: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string | null
}

export type InboxRepliesRow = {
  id: string
  messageId: string
  userId: string
  fromType: string
  textContent: string
  createdAt: string | null
}

export type InitialScansRow = {
  id: string
  establishmentId: string
  userId: string
  geoScore: number | string
  unhandledReviews: number | string
  missingKeywords: string
  rawScanData: string
  scannedAt: string
  createdAt: string
}

export type InstantFormAppointmentsRow = {
  id: string
  userId: string
  formConfigId: string
  leadName: string
  leadEmail: string
  leadPhone: string
  formData: string
  appointmentStatus: string
  schedulingUrl: string
  provider: string
  providerEventId: string
  metaLeadId: string
  syncedAt: string
  createdAt: string
}

export type InstantFormConfigsRow = {
  id: string
  userId: string
  formId: string
  formName: string
  pageId: string
  schedulingProvider: string
  schedulingUrl: string
  schedulingApiKey: string
  autoConfirm: number | string
  webhookVerifyToken: string
  isActive: number | string
  totalLeads: number | string
  totalAppointments: number | string
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export type JoinRequestsRow = {
  id: string
  targetSiret: string
  targetCompanyName: string
  requesterUid: string
  requesterEmail: string
  requesterName: string
  status: string
  message: string
  reviewedBy: string
  reviewedAt: string | null
  createdAt: string
}

export type LeadMagnetSimulationsRow = {
  id: string
  userId: string | null
  name: string
  email: string
  tools: string
  savingsReport: string
  sentToBrevo: number | string
  createdAt: string
}

export type LeadScoreEventsRow = {
  id: string
  threadId: string
  userId: string
  scoringVersion: string
  promptVersion: string
  modelProvider: string
  model: string
  inputSnapshot: string
  score: number | string
  confidence: number | string
  intentType: string
  keySignals: string
  reasoning: string
  recommendedAction: string
  createdAt: string
}

export type LeadScoreOutcomesRow = {
  id: string
  threadId: string
  scoreEventId: string | null
  userId: string
  outcome: string
  notes: string
  reviewedBy: string | null
  reviewedAt: string | null
  conversionEventId: string | null
  createdAt: string
}

export type LeadsRow = {
  id: string
  businessName: string
  email: string
  phone: string | null
  city: string | null
  address: string | null
  visibilityScore: number | string | null
  scanData: string | null
  status: string
  createdAt: string | null
}

export type LegalSignaturesRow = {
  id: string
  userId: string
  ipAddress: string
  signedAt: string
  cgvVersionAccepted: string
  retractionWaiver: number | string
  planId: string | null
  checkoutType: string
  userAgent: string | null
  signatureMetadata: string
  createdAt: string
}

export type LlmTrackerResultsRow = {
  id: string
  trackerId: string
  userId: string
  queryText: string
  engine: string
  responseText: string
  brandMentioned: number | string
  brandPosition: number | string | null
  urlCited: number | string
  urlCitedText: string | null
  sourcesExtracted: string
  sentiment: string | null
  tokensUsed: number | string
  responseTimeMs: number | string
  checkedAt: string
}

export type LlmTrackersRow = {
  id: string
  userId: string
  establishmentId: string
  brandName: string
  domainUrl: string
  naturalQueries: string
  enginesToCheck: string
  checkFrequency: string
  isActive: number | string
  lastCheckAt: string | null
  overallVisibilityScore: number | string
  createdAt: string
  updatedAt: string | null
}

export type LlmVisibilityHistoryRow = {
  id: string
  trackerId: string
  userId: string
  score: number | string
  queriesChecked: number | string
  brandMentions: number | string
  urlCitations: number | string
  snapshotDate: string
  createdAt: string
}

export type LumaGenerationsRow = {
  id: string
  userId: string
  prompt: string
  optimizedPrompt: string | null
  imageUrl: string
  videoUrl: string | null
  thumbnailUrl: string | null
  status: string
  isExtraCredit: number | string
  createdAt: string
  updatedAt: string | null
  aspectRatio: string
  isAiGenerated: number | string
  compressionStatus: string
  rawVideoUrl: string | null
}

export type MarketingAdSpendRow = {
  id: string
  userId: string
  platform: string
  accountId: string
  accountName: string
  campaignId: string
  campaignName: string
  spendCents: number | string
  impressions: number | string
  clicks: number | string
  conversions: number | string
  revenueCents: number | string
  currency: string
  periodStart: string
  periodEnd: string
  source: string
  syncedAt: string
  organizationId: string
  adAccountId: string
  syncRunId: string
  correlationId: string
}

export type MessagesRow = {
  id: string
  userId: string
  senderName: string
  senderEmail: string
  subject: string
  body: string
  isRead: boolean | null
  createdAt: string | null
  isArchived: number | string
  isStarred: number | string
  channel: string
  senderHandle: string
  socialAccountId: string | null
  socialThreadId: string | null
}

export type MetaCapiConfigsRow = {
  id: string
  userId: string
  pixelId: string
  accessTokenEncrypted: string
  testEventCode: string | null
  isActive: number | string
  eventsSent: number | string
  eventsFailed: number | string
  lastEventAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type MetaCapiEventsRow = {
  id: string
  userId: string
  configId: string
  eventName: string
  eventTime: number | string
  leadId: string | null
  leadEmail: string | null
  leadStatus: string | null
  matchKeysUsed: string
  responseStatus: number | string | null
  responseBody: string | null
  success: number | string
  testEventCode: string | null
  createdAt: string
}

export type MetaConnectionsRow = {
  id: string
  userId: string
  provider: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenExpiresAt: string
  scopes: string
  status: string
  lastError: string
  createdAt: string
  updatedAt: string
}

export type MetaSocialAccountsRow = {
  id: string
  userId: string
  connectionId: string
  network: string
  externalId: string
  name: string
  username: string
  profilePictureUrl: string
  parentPageId: string
  parentPageName: string
  accessTokenEncrypted: string
  isSelected: number | string
  status: string
  lastError: string
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

export type MetricSyncLogRow = {
  id: string
  userId: string
  syncedAt: string
  platforms: string | null
  metricsCount: number | string | null
  correlationId: string
}

export type NotificationsQueueRow = {
  id: string
  userId: string
  title: string
  body: string
  type: string
  url: string
  icon: string
  status: string
  createdAt: string | null
}

export type OauthTokensRow = {
  id: string
  userId: string
  provider: string
  accessToken: string
  refreshToken: string | null
  expiresAt: string
  scopes: string | null
  status: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ObservabilityLogsRow = {
  id: string
  userId: string | null
  userPlan: string | null
  action: string
  provider: string | null
  errorCode: string | null
  errorMessage: string
  metadata: string | null
  severity: string
  createdAt: string | null
}

export type OnboardingEmailEventsRow = {
  id: string
  userId: string
  emailType: string
  sentAt: string
  createdAt: string
}

export type OnboardingProfilesRow = {
  id: string
  userId: string
  sector: string
  objective: string
  createdAt: string | null
}

export type OperationsReviewsRow = {
  id: string
  reviewType: string
  status: string
  correlationId: string
  periodStart: string
  periodEnd: string
  summaryJson: string
  createdAt: string
}

export type PartnerApiKeysRow = {
  id: string
  userId: string
  keyName: string
  apiKeyHash: string
  apiKeyPrefix: string
  scopes: string
  rateLimitPerMinute: number | string
  totalRequests: number | string
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: number | string
  createdAt: string
  updatedAt: string
}

export type PersonaAdSimulationsRow = {
  id: string
  userId: string
  personaId: string
  funnelId: string | null
  competitorAd: string
  userAd: string
  competitorScore: number | string
  userScore: number | string
  analysis: string
  createdAt: string | null
}

export type PilotCouponAuditsRow = {
  id: string
  userId: string
  organizationId: string
  couponLookupKey: string
  checkoutSessionId: string
  eligible: boolean
  reason: string
  createdAt: string
  applied: boolean
}

export type PostCommentsRow = {
  id: string
  postId: string
  workspaceOwnerId: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  isResolved: number | string
  createdAt: string | null
  updatedAt: string | null
}

export type PostEngagementMetricsRow = {
  id: string
  postId: string
  userId: string
  platform: string
  shares: number | string
  comments: number | string
  clicks: number | string
  impressions: number | string
  reach: number | string
  engagementRate: number | string
  ctr: number | string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export type PostTemplatesRow = {
  id: string
  userId: string
  name: string
  description: string
  platform: string
  category: string
  hook: string
  body: string
  callToAction: string
  hashtags: string
  usageCount: number | string
  createdAt: string
  updatedAt: string
}

export type PostsRow = {
  id: string
  userId: string
  title: string
  content: string | null
  status: string | null
  scheduledAt: string | null
  createdAt: string | null
}

export type PresencesRow = {
  id: string
  userId: string
  type: string
  timestamp: string
  date: string
  notes: string | null
  durationMinutes: number | string | null
  createdAt: string | null
}

export type PricingAbandonEventsRow = {
  id: string
  userId: string | null
  email: string | null
  planId: string
  billing: string
  pageUrl: string
  abandonedAt: string
  reminderSent: number | string
}

export type PrivacyRequestsRow = {
  id: string
  userId: string
  requestType: string
  status: string
  requestedAt: string
  startedAt: string | null
  completedAt: string | null
  requestedBy: string
  correlationId: string
  errorMessage: string
  resultJson: string
  createdAt: string
  updatedAt: string
}

export type PublishingCampaignsRow = {
  id: string
  userId: string
  name: string
  textTemplate: string
  channels: string
  platformVariants: string
  imageUrl: string
  recurrence: string
  timezone: string
  startsAt: string
  endsAt: string | null
  maxOccurrences: number | string | null
  occurrenceCount: number | string
  status: string
  nextRunAt: string
  createdAt: string
  updatedAt: string
}

export type QuickReplyTemplatesRow = {
  id: string
  userId: string
  label: string
  content: string
  createdAt: string | null
}

export type RedditCalendarEventsRow = {
  id: string
  userId: string
  threadId: string
  trackerId: string
  title: string
  description: string
  subreddit: string
  geoScore: number | string
  redditUrl: string
  status: string
  createdAt: string | null
}

export type RedditStudioExportsRow = {
  id: string
  userId: string
  threadId: string
  sourceType: string
  generatedContent: string
  contentType: string
  status: string
  createdAt: string | null
}

export type RedditTrackersRow = {
  id: string
  userId: string
  orgName: string
  brandName: string
  keywords: string
  competitors: string
  subreddits: string
  geoVisibilityScore: number | string
  isActive: number | string
  createdAt: string | null
  updatedAt: string | null
}

export type ReferralCampaignsRow = {
  id: string
  userId: string
  establishmentId: string
  isActive: number | string
  discountPercent: number | string
  sponsorDiscountPercent: number | string
  avgBasketAmount: number | string
  messageTemplate: string
  channel: string
  sector: string
  createdAt: string | null
  updatedAt: string | null
}

export type ReferralConversionsRow = {
  id: string
  referralLinkId: string
  userId: string
  newClientName: string | null
  newClientPhone: string | null
  revenueGenerated: number | string | null
  convertedAt: string | null
}

export type ReferralLinksRow = {
  id: string
  userId: string
  campaignId: string
  establishmentId: string
  sponsorName: string
  sponsorReviewRating: number | string | null
  shortCode: string
  clickCount: number | string
  conversionCount: number | string
  thankYouSent: number | string
  createdAt: string | null
}

export type ReferralRewardEventsRow = {
  id: string
  referrerUserId: string
  referredUserId: string | null
  referredEmail: string | null
  referralCode: string
  creditsAwardedReferrer: number | string
  creditsAwardedReferred: number | string
  tierUnlocked: string | null
  status: string
  createdAt: string
}

export type ReferralRewardsRow = {
  id: string
  userId: string
  referralCode: string
  totalConversions: number | string
  totalCreditsEarned: number | string
  totalFreeMonthsEarned: number | string
  totalFreeMonthsRedeemed: number | string
  lastConversionAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type RepurposingApprovalsRow = {
  id: string
  userId: string
  jobId: string
  token: string
  status: string
  feedback: string
  slackSent: boolean
  expiresAt: string
  decidedAt: string | null
  createdAt: string
  approvedBy: string | null
  approvalSource: string
  slackMessageTs: string | null
  slackChannelId: string | null
  scheduleStartAt: string | null
  scheduleTimezone: string
  autoSchedule: boolean
  scheduleStatus: string
}

export type RepurposingJobsRow = {
  id: string
  userId: string
  sourceType: string
  sourceLabel: string
  sourceUrl: string
  sourceText: string
  tone: string
  selectedChannels: string
  outputsJson: string
  status: string
  createdAt: string
  updatedAt: string
  sourceRecommendationId: string | null
  sourceRecommendationType: string | null
  sourceRecommendationTitle: string | null
  autoSchedule: boolean
  scheduleStartAt: string | null
  scheduleTimezone: string
}

export type RepurposingScheduledPostsRow = {
  id: string
  userId: string
  jobId: string
  approvalId: string
  scheduledPostId: string
  outputIndex: number | string
  outputChannel: string
  scheduledAt: string
  createdAt: string
}

export type RetentionPoliciesRow = {
  id: string
  tableName: string
  retentionClass: string
  retentionDays: number | string
  action: string
  legalBasis: string
  enabled: number | string
  updatedAt: string
}

export type RunwayGenerationsRow = {
  id: string
  userId: string
  taskId: string
  prompt: string
  model: string
  ratio: string
  duration: number | string
  videoUrl: string
  status: string
  errorMessage: string
  creditsCharged: number | string
  creditsRefunded: number | string
  createdAt: string
  updatedAt: string
}

export type ScheduledPostClaimsRow = {
  postId: string
  claimedAt: string
  claimToken: string
}

export type ScheduledPostsRow = {
  id: string
  userId: string
  establishmentId: string | null
  textContent: string
  imageUrl: string | null
  scheduledAt: string | null
  channels: string
  status: string
  platformVariants: string | null
  createdAt: string | null
  updatedAt: string | null
  utmSource: string
  utmMedium: string
  utmCampaign: string
  impressions: number | string
  shares: number | string
  comments: number | string
  clicks: number | string
  reach: number | string
  engagementRate: number | string
  ctr: number | string
  campaignId: string | null
}

export type SearchPreferencesRow = {
  id: string
  userId: string
  name: string
  activeCategories: string
  highlightStyle: string
  createdAt: string
  updatedAt: string
}

export type SeoAgentPageAnalysesRow = {
  id: string
  siteId: string
  userId: string
  pageUrl: string
  pageType: string
  currentTitle: string | null
  currentMetaDesc: string | null
  currentH1: string | null
  currentImagesMissingAlt: number | string
  currentSchemaMarkup: string | null
  currentInternalLinks: number | string
  optimizedTitle: string | null
  optimizedMetaDesc: string | null
  suggestedSchema: string
  suggestedAltTexts: string
  suggestedInternalLinks: string
  titleScore: number | string | null
  metaDescScore: number | string | null
  schemaScore: number | string | null
  imageAltScore: number | string | null
  internalLinkScore: number | string | null
  pageScore: number | string | null
  status: string
  analyzedAt: string
}

export type SeoAgentSitesRow = {
  id: string
  userId: string
  establishmentId: string
  siteUrl: string
  sitemapUrl: string
  lastCrawlAt: string | null
  crawlStatus: string
  pagesCrawled: number | string
  totalPages: number | string
  overallSeoScore: number | string
  createdAt: string
  updatedAt: string | null
}

export type SeoAgentTasksRow = {
  id: string
  siteId: string
  userId: string
  taskType: string
  pageUrl: string
  inputData: string
  outputData: string
  status: string
  aiModel: string
  tokensUsed: number | string
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export type SmsBlacklistRow = {
  id: string
  phoneNumber: string
  unsubscribedAt: string
  createdAt: string
}

export type SmsCreditsRow = {
  id: string
  userId: string
  balance: number | string
  totalUsed: number | string
  totalGiven: number | string
  planMonthlyQuota: number | string
  welcomePackGranted: number | string
  lastRechargeAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type SocialSeoCacheRow = {
  id: string
  userId: string
  establishmentId: string
  cacheKey: string
  cacheData: string
  expiresAt: string
  createdAt: string
}

export type SocialSeoInsightsRow = {
  id: string
  userId: string
  insightType: string
  severity: string
  sourcePlatform: string
  targetPlatform: string
  title: string
  description: string
  recommendation: string
  estimatedImpact: string
  relatedQuery: string | null
  relatedPostId: string | null
  isDismissed: number | string
  isActedUpon: number | string
  detectedAt: string
  createdAt: string
}

export type SocialSeoOnboardingRow = {
  id: string
  userId: string
  hasCompletedOnboarding: number | string
  currentStep: number | string
  connectedPlatforms: string
  gscConnected: number | string
  firstSyncAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SocialSeoWeeklySnapshotsRow = {
  id: string
  userId: string
  establishmentId: string
  weekStart: string
  weekEnd: string
  totalImpressions: number | string
  totalClicks: number | string
  globalCtr: number | string
  impressionsEvolution: number | string
  topPostData: string
  platformBreakdown: string
  createdAt: string
}

export type StripeCreditGrantsRow = {
  id: string
  userId: string
  creditType: string
  credits: number | string
  status: string
  balanceAfter: number | string
  errorMessage: string
  createdAt: string
  updatedAt: string
}

export type StripeWebhookEventsRow = {
  id: string
  eventType: string
  status: string
  errorMessage: string
  receivedAt: string
  processedAt: string | null
  livemode: boolean
}

export type TeamActivityFeedRow = {
  id: string
  workspaceOwnerId: string
  actorId: string
  actorName: string
  actorAvatar: string
  actionType: string
  entityType: string
  entityId: string
  entityLabel: string
  metadata: string
  createdAt: string | null
}

export type TeamInvitesRow = {
  id: string
  workspaceOwnerId: string
  email: string
  role: string
  token: string
  expiresAt: string
  accepted: number | string
  createdAt: string | null
}

export type TeamMembersRow = {
  id: string
  workspaceOwnerId: string
  memberUserId: string | null
  memberEmail: string
  displayName: string
  avatarUrl: string
  role: string
  status: string
  invitedBy: string
  inviteToken: string
  joinedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type TeamMessagesRow = {
  id: string
  workspaceOwnerId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  messageType: string
  replyToId: string
  attachments: string
  reactions: string
  isEdited: number | string
  isDeleted: number | string
  createdAt: string | null
  updatedAt: string | null
}

export type TiktokDmAccountsRow = {
  id: string
  userId: string
  openId: string
  createdAt: string | null
  updatedAt: string | null
}

export type UgcVideoProjectsRow = {
  id: string
  userId: string
  productImageUrl: string
  productDescription: string
  productName: string
  status: string
  scripts: string
  videoVariants: string
  creditsCost: number | string
  createdAt: string
  updatedAt: string
}

export type UserActivityLogsRow = {
  id: string
  userId: string
  email: string | null
  actionType: string
  actionCategory: string
  resourceType: string | null
  resourceId: string | null
  description: string
  metadata: string
  ipAddress: string | null
  userAgent: string | null
  sessionId: string | null
  severity: string
  createdAt: string
}

export type UserAddonsRow = {
  id: string
  userId: string
  addonId: string
  stripeItemId: string
  stripePriceId: string
  status: string
  activatedAt: string
  cancelledAt: string | null
  currentPeriodEnd: string | null
  metadata: string
  createdAt: string
  updatedAt: string
}

export type UserBudgetLimitsRow = {
  id: string
  userId: string
  planType: string
  spentCentsThisMonth: number | string
  limitCentsMonthly: number | string
  isBlocked: number | string
  blockedReason: string | null
  blockedAt: string | null
  lastAlertSentAt: string | null
  currentMonth: string
  createdAt: string | null
  updatedAt: string | null
}

export type UserCreditQuotasRow = {
  id: string
  userId: string
  planType: string
  smsUsedThisMonth: number | string
  smsLimitMonthly: number | string
  emailUsedThisMonth: number | string
  emailLimitMonthly: number | string
  isBlocked: number | string
  blockedReason: string | null
  blockedAt: string | null
  lastSmsSentAt: string | null
  lastEmailSentAt: string | null
  currentMonth: string
  createdAt: string | null
  updatedAt: string | null
}

export type UserCreditsRow = {
  id: string
  userId: string
  monthlyLimit: number | string
  additionalCredits: number | string
  currentUsage: number | string
  usageMonth: string
  createdAt: string
  updatedAt: string
  contentAddonActive: number | string
}

export type UserNotificationSettingsRow = {
  id: string
  userId: string
  showGeoAlerts: number | string
  showStripeAlerts: number | string
  showSmsAlerts: number | string
  showRaidAlerts: number | string
  showLeadAlerts: number | string
  applyToSubAccounts: number | string
  createdAt: string
  updatedAt: string
  weeklyReportEnabled: number | string
}

export type UserOnboardingV2Row = {
  id: string
  userId: string
  businessName: string | null
  businessUrl: string | null
  industry: string | null
  competitor1Name: string | null
  competitor1Url: string | null
  competitor2Name: string | null
  competitor2Url: string | null
  hasCompletedOnboarding: number | string
  checklistViewedTunnels: number | string
  checklistWatchedFunnel: number | string
  checklistGeneratedSwipe: number | string
  createdAt: string | null
  updatedAt: string | null
}

export type UserPushTokensRow = {
  id: string
  userId: string
  fcmToken: string
  platform: string
  updatedAt: string
  createdAt: string | null
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
  isDemoAccount: number | string
  trialStart: string | null
  trialEnd: string | null
  isBlocked: number | string
}

export type VideoCreditPacksRow = {
  id: string
  userId: string
  creditsGranted: number | string
  creditsUsed: number | string
  stripePaymentId: string | null
  createdAt: string
}

export type VideoEditSessionsRow = {
  id: string
  userId: string
  sourceVideoUrl: string
  sourceGenerationId: string | null
  editType: string
  editConfig: string
  resultVideoUrl: string | null
  status: string
  createdAt: string
  updatedAt: string | null
}

export type VideoGenerationsRow = {
  id: string
  userId: string
  tavusVideoId: string | null
  replicaId: string
  script: string
  videoUrl: string | null
  thumbnailUrl: string | null
  status: string
  creditsCharged: number | string
  creditsRefunded: number | string
  errorMessage: string | null
  callbackReceivedAt: string | null
  createdAt: string
  updatedAt: string | null
  callbackToken: string
}

export type VideoTemplatesRow = {
  id: string
  name: string
  description: string
  category: string
  aspectRatio: string
  durationSeconds: number | string
  thumbnailUrl: string | null
  templateConfig: string
  promptTemplate: string
  isActive: number | string
  sortOrder: number | string
  createdAt: string
}

export type WeeklyActivityReportsRow = {
  id: string
  userId: string
  periodStart: string
  periodEnd: string
  reportJson: string
  idempotencyKey: string
  deliveredAt: string | null
  createdAt: string
  status: string
  attemptCount: number | string
  lastError: string
  lastAttemptAt: string | null
}
