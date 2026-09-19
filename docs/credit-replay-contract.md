# Idempotent replays on paid AI routes

`consumeExecuteRefund` (`backend/lib/creditService.ts`) charges the ledger before provider
work and refunds exactly once when the provider throws. It never runs the provider twice
for the same reference id: a replay throws instead.

Two sentinels, both defined in `backend/lib/idempotentReplay.ts`:

| Sentinel | Meaning | Correct route answer |
|---|---|---|
| `IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT` | The charge stands and the first attempt ran. | Reload and return the durable row, else 409. |
| `IDEMPOTENT_REPLAY_ALREADY_REFUNDED` | The first attempt failed and the charge was reversed. | 409 — the reference is spent. |

Neither may surface as a 5xx. A 5xx tells the client to retry, and retrying the same
idempotency key can only produce the same replay, so the client loops.

## Why a refunded reference is terminal

The ledger row id is derived from the reference (`ctx:{creditType}:{referenceId}`), so a
second charge under the same reference cannot be inserted. Allowing one would also break
the refund path, which matches a single `consumption` row per reference and refuses to
write a second `refund` for it — a retry could be charged but never reversed.

Terminal is therefore the safe semantics. Clients must retry under a **new**
`Idempotency-Key` / `X-Request-Id`. Responses carry `retryWithNewIdempotencyKey: true`.

## Route coverage

Routes that persist their output reload it on replay:

| Route | Durable row |
|---|---|
| `routes/runwayVideo.ts` | `runway_generations` |
| `routes/tavusVideo.ts` | `video_generations` |
| `routes/urlToVideo.ts` (generate) | `luma_generations` |
| `routes/ugcVideoAd.ts` (analyze) | `ugc_video_projects` |
| `routes/geo.ts` | `scheduled_posts` (`status='geo_scan'`) |
| `routes/creativeStudio.ts` | `creative_reports` — the row id is derived from the ledger reference so it stays reachable on replay |

Routes that return their result inline and store nothing answer 409 with
`IDEMPOTENT_REPLAY_NO_DURABLE_RESULT`: `routes/ai.ts`, `routes/voiceover.ts`,
`routes/ugcScript.ts`, `routes/aioAudit.ts`, `routes/aioSync.ts`,
`routes/seoGapAnalysis.ts`, `routes/predictiveScoring.ts`, `routes/urlToVideo.ts` (scrape),
`routes/ugcVideoAd.ts` (generate).

## Open decision for a human

Making those results replayable is a product change, not a bug fix: it means persisting the
generated payload (AI text, TTS audio, audit rows, lead scores) so a repeated key can be
answered from storage. That adds storage cost and retention questions — GDPR retention on
generated content in particular — so it is deliberately not done here.

Until then, a client that loses a response also loses the credits for that call. The
mitigation already in place: these routes only derive a reference from a client-supplied
`Idempotency-Key` / `X-Request-Id`; without one they generate a fresh UUID per request, so a
plain network retry is a new billable call rather than a poisoned replay.
