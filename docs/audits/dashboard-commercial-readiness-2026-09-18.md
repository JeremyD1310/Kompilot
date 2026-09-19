# Dashboard and commercial readiness audit — 2026-09-18

## Executive verdict

The release branch builds, passes TypeScript/ESLint, and passes the full browser matrix. The dashboard is usable, but commercial launch must remain gated until the Stripe Test contract and the new Blink backend endpoint are configured and proven end to end.

## Stripe findings

- The canonical Test and Live subscription catalogs match the application: Pro 69/690 EUR HT, Multi 129/1290 EUR HT, Agency 229/2290 EUR HT.
- All six catalog prices are active, EUR, recurring, and use exclusive tax behavior.
- The Test account has no webhook endpoint, no customer portal configuration, no Tax registration, and no prior Checkout Session.
- The Live account has the six expected prices and an enabled webhook, but that webhook still needs to be checked against the current `xxifv5sr.backend.blink.new` Blink backend.
- The Live account has no customer portal configuration and no Stripe Tax registration.
- The application enables `automatic_tax`; launch therefore requires an active, legally confirmed tax registration before billing is enabled.
- The frontend billing client previously called the retired backend directly. It now requires `VITE_BACKEND_URL` and fails closed when missing.
- An unused Stripe test panel containing obsolete Agency pricing and the retired webhook URL was removed.
- A legacy, currently unused Stripe service no longer hardcodes card-only payment methods.

## Cross-project frontend configuration risk

- The commercial billing path fixed in this change no longer contains the retired backend domain.
- A repository-wide scan still finds 86 occurrences of `legacy.backend.example.invalid` across 78 frontend source files.
- Those references cover non-billing API clients and are outside this focused Stripe correction; they must not be treated as harmless merely because the billing client is now fail-closed.
- Commercial cutover remains blocked until every runtime reference is classified, migrated to the centralized backend URL helper, tested, and the repository-wide runtime scan returns zero.
- The migration should be performed in bounded functional groups (authentication and onboarding, dashboard, content/social integrations, analytics, then administration), with targeted tests after each group. Do not replace URLs mechanically without checking each endpoint contract.

## Client dashboard findings

### Strengths

- The first screen is action-oriented and prioritizes human validation.
- Merchant, artisan, agency, and network profiles share one coherent cockpit model.
- Responsive controls and empty states are present.
- Demo actions are isolated from external providers and are clearly labelled as simulated.

### Priority improvements

1. Replace fixed production-looking values (`78`, `0`, and example milestones) with explicit unavailable/loading states or measured data.
2. Do not show `MilestoneCelebrationModal` on every eligible dashboard render; trigger it only from a persisted, verified milestone event.
3. Consolidate the three demo experiences (`/demo/dashboard`, `/demo/workspace`, and demo mode inside `/dashboard`) around one canonical data model and one navigation architecture.
4. Retire obsolete language such as `Plan Expert` and ensure every demo label comes from the canonical Pro/Multi/Agency catalog.
5. Add provenance and freshness labels to each KPI: source, establishment, and last synchronization time.
6. Persist snoozed/ignored actions server-side for authenticated users; current dismissals are local component state.
7. Replace generic action counts with outcome-oriented metrics: awaiting approval, overdue, failed publication, unanswered review, and qualified lead.
8. Add a commercial activation checklist for real clients: establishment, Google profile, social channel, billing state, first approved content, and first measurable result.

## Demo dashboard findings

- `/demo/workspace` is the strongest conversion-oriented experience because it exposes a realistic navigation tree and local-only workflows.
- `/demo/dashboard` contains obsolete commercial wording and duplicates large parts of the client dashboard.
- The demo should use one persistent banner, one reset action, one CTA to signup, and one consistent explanation that all data is fictitious.
- The demo should record local funnel events only: onboarding completed, section opened, simulated action completed, pricing opened, and signup CTA clicked.

## Launch gates

1. Remove or migrate all 86 remaining frontend references to the retired backend and prove a zero-result runtime scan.
2. Configure the new project's `VITE_BACKEND_URL` and backend `BACKEND_URL` explicitly.
3. Deploy the new backend and verify its health endpoint.
4. Configure a Test webhook against that exact deployed endpoint and validate signature handling plus replay idempotency.
5. Configure and validate the Stripe customer portal in Test.
6. Confirm the legal VAT/tax registration, then configure Stripe Tax; do not enable Live billing before this is complete.
7. Execute successful, declined, 3DS, cancellation, renewal, failed invoice, and portal scenarios in Test.
8. Update the Live webhook only during the controlled cutover, after the new backend is deployed and verified.
9. Keep `LIVE_BILLING_ENABLED=false` until all preceding gates are green.
