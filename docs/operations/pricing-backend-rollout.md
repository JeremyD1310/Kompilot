# Pricing backend rollout

The new checkout catalog is server-authoritative. Configure these Stripe price IDs before enabling the frontend:

- `PRICE_PRO_MONTHLY_ID`, `PRICE_PRO_YEARLY_ID`
- `PRICE_MULTI_MONTHLY_ID`, `PRICE_MULTI_YEARLY_ID`
- `PRICE_AGENCY_MONTHLY_ID`, `PRICE_AGENCY_YEARLY_ID`
- `PRICE_PILOT_GUIDED_99_ID`
- `PRICE_ONBOARDING_199_ID`, `PRICE_LOCAL_AUDIT_390_ID`, `PRICE_ANALYTICS_SETUP_390_ID`
- `PRICE_TEAM_TRAINING_490_ID`, `PRICE_EDITORIAL_LAUNCH_490_ID`

The existing legacy price environment variables are deliberately not renamed or removed. The new subscription endpoint does not accept legacy plan IDs or aliases. Enterprise and custom quote are intentionally not checkout products.

`POST /api/billing/one-time-checkout` creates payment-mode sessions only. Pilot dates, credit eligibility, product type, and legal consent are copied into Stripe metadata; it has no subscription or renewal parameters.

No pilot-status/reminder table migration was added. The current schema has no confirmed canonical pilot lifecycle table, so webhook consumers can use the metadata/event hooks. A future migration should add an owner-scoped pilot record keyed by payment/session ID with start/end/status/reminder timestamps, then make webhook processing idempotently populate it.
