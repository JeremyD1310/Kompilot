/**
 * Shared handling for idempotent replays raised by `consumeExecuteRefund`.
 *
 * A replay means the ledger already holds a charge for the caller's reference id,
 * so the provider must not run again. Two outcomes are possible and they are not
 * interchangeable for the client:
 *
 * - `IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT`: the charge stands. If the route
 *   persists its output, it must reload and return it; otherwise the result is
 *   unrecoverable and the client has to start a new request under a new key.
 * - `IDEMPOTENT_REPLAY_ALREADY_REFUNDED`: the first attempt failed and the charge
 *   was reversed. The reference id is spent — a deterministic ledger id cannot be
 *   charged twice — so a retry is only possible under a new key.
 *
 * Both are terminal for the reference and must surface as 409, never as a 5xx:
 * a 5xx invites the client to retry the same key, which can only loop.
 */

export const IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT = 'IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT';
export const IDEMPOTENT_REPLAY_ALREADY_REFUNDED = 'IDEMPOTENT_REPLAY_ALREADY_REFUNDED';

/** True for either replay sentinel thrown by `consumeExecuteRefund`. */
export function isIdempotentReplayError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message === IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT
    || message === IDEMPOTENT_REPLAY_ALREADY_REFUNDED;
}

/** True only when the earlier charge for this reference was already refunded. */
export function isRefundedReplayError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message === IDEMPOTENT_REPLAY_ALREADY_REFUNDED;
}

export interface ReplayConflictBody {
  error: string;
  code: string;
  message: string;
  replayed: true;
  retryWithNewIdempotencyKey: true;
}

/**
 * Response body for a replay a route cannot answer with a durable result.
 * `operation` is the user-facing name of the action, used in the message only.
 */
export function replayConflictBody(error: unknown, operation: string): ReplayConflictBody {
  if (isRefundedReplayError(error)) {
    return {
      error: 'IDEMPOTENT_REPLAY_ALREADY_REFUNDED',
      code: 'IDEMPOTENT_REPLAY_ALREADY_REFUNDED',
      message: `Cette requête (${operation}) a déjà échoué et les crédits ont été remboursés. Relancez avec une nouvelle clé d'idempotence.`,
      replayed: true,
      retryWithNewIdempotencyKey: true,
    };
  }
  return {
    error: 'IDEMPOTENT_REPLAY_NO_DURABLE_RESULT',
    code: 'IDEMPOTENT_REPLAY_NO_DURABLE_RESULT',
    message: `Cette requête (${operation}) a déjà été traitée et facturée, et son résultat n'est pas rejouable. Relancez avec une nouvelle clé d'idempotence.`,
    replayed: true,
    retryWithNewIdempotencyKey: true,
  };
}
