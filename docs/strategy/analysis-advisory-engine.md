# Analysis & Advisory Engine — Kompilot

## Architecture & data flow

1. **Verified profile**: `establishments` is the canonical company context. The engine uses name, sector, city, legal address, postal code, NAF code/label, legal form, website, description and SIRET. Verification provenance is explicit: `pappers` means Pappers confirmed the registry record; `luhn` means checksum-only fallback and is not presented as Pappers verification.
2. **Metrics aggregation**: the backend aggregates `daily_analytics`, `post_engagement_metrics`, `campaign_performance`, `llm_trackers`, `llm_visibility_history`, `scheduled_posts` and `creative_reports` for the authenticated user.
3. **Contextual prompt**: `backend/lib/advisoryPrompts.ts` receives a compact, recent snapshot rather than raw tables. This keeps the prompt explainable and prevents stale or unrelated data from influencing advice.
4. **Structured AI output**: Gemini returns five normalized pillars: Social Media, SEO, GEO, SEA and GEA. The backend clamps scores, limits action count and persists the report in `advisory_reports`.
5. **UI**: `/advisory-engine` renders one priority score and five vertical accordions. The demo mode uses the same UI contract with a deterministic dataset, so sales teams can present the complete experience without external connections.

The first version is on-demand with a latest-report cache. The queue handler can refresh reports on a recurring schedule without changing the UI contract.

## Prompt templates

The engine prompt is domain-specific and includes these rules:

- **Social Media**: compare engagement by platform and format, identify cadence gaps, recommend content formats, editorial slots and moderation actions.
- **SEO**: inspect organic visibility, missing service/location coverage and internal-link gaps; recommend pages, semantic clusters and schema improvements.
- **GEO**: compare AI visibility trackers, citations, mentions and URL citations; recommend verifiable local proof, FAQ content and relevant authority mentions.
- **SEA**: evaluate campaign performance, CTR/CPA/ROAS signals when available, budget waste and conversion tracking; recommend reallocations and tests.
- **GEA**: evaluate AI creative reports, conversion tracking and acquisition loops; recommend UGC/creative experiments and measurement fixes.

The exact system-style prompt is implemented in `backend/lib/advisoryPrompts.ts`. It contains separate operating instructions for Social Media, SEO, GEO, SEA and GEA, and the JSON schema intentionally requires exactly five pillar objects with 1–3 actionable recommendations each.

## UI guidelines

- White background, `@blinkdotnew/ui` cards and Kompilot teal as the only accent.
- One executive summary above the fold: business context, freshness, overall score, critical count and data sources.
- One vertical accordion per pillar. Each item exposes signals first, then actions sorted by impact and effort.
- Only critical recommendations are visually emphasized; healthy pillars remain compact.
- Every action has a completion control and, when a matching product surface exists, a direct route link.
- The same component receives real or demo data; no duplicated demo-only layout.
