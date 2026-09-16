# Credit migration notes

- `shared/pricingCatalog.ts` is the canonical commercial and AI-action catalog. Starter is intentionally absent; Enterprise remains quote-only.
- Luma generation is a Kompilot AI action and retains its existing one-credit commercial rule under `luma_video_generation`.
- SerpApi is an external search/provider-cost counter, not an AI-credit charge; it is intentionally not added to `AI_CREDIT_COSTS`.
- Legacy establishment counters such as `establishments.aiCreditsUsed` are not authoritative for migrated flows. Existing historical values remain readable for compatibility, but new charges/refunds must use `credit_transactions` with stable references.
- Existing AIO/Luma/SerpApi sub-ledgers were not merged blindly because their provider-specific metadata and reconciliation semantics differ. Consolidation requires a data migration mapping each row to a canonical action and reference before deletion.
