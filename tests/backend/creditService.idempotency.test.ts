import { describe, expect, it } from 'bun:test';
import { consumeExecuteRefund } from '../../backend/lib/creditService';

type FakeDbState = {
  affectedRows: number;
  existingConsumption: boolean;
  /** Ledger rows already present for the reference, when the shape matters. */
  existingRows?: Array<{ type: string; balanceAfter: number }>;
  batches: Array<{ statements: unknown[]; mode: string }>;
  executorReads: number;
  refundWrites: number;
};

function createFakeBlink(state: FakeDbState) {
  const usersTable = {
    list: async () => [{ id: 'user-1', metadata: JSON.stringify({ plan_id: 'pro' }) }],
  };
  const transactionsTable = {
    get: async () => ({ balanceAfter: 499 }),
    list: async () => state.existingRows ?? (state.existingConsumption ? [{ balanceAfter: 499 }] : []),
  };

  return {
    db: {
      table: (name: string) => name === 'users' ? usersTable : transactionsTable,
      batch: async (statements: unknown[], mode: string) => {
        state.batches.push({ statements, mode });
        const sql = String((statements[0] as { sql?: string })?.sql ?? '');
        if (sql.includes("type = 'refund'")) state.refundWrites += 1;
        return { results: [{ affectedRows: state.affectedRows }] };
      },
    },
  } as any;
}

describe('consumeExecuteRefund idempotency contract', () => {
  it('consumes once and executes the provider once', async () => {
    const state: FakeDbState = { affectedRows: 1, existingConsumption: false, batches: [], executorReads: 0, refundWrites: 0 };
    const blink = createFakeBlink(state);
    let executions = 0;

    const result = await consumeExecuteRefund(
      blink,
      'user-1',
      'text_generation',
      'Test generation',
      'stable-reference-1',
      async () => {
        executions += 1;
        return { ok: true };
      },
    );

    expect(result.result).toEqual({ ok: true });
    expect(result.cost).toBe(1);
    expect(executions).toBe(1);
    expect(state.batches).toHaveLength(1);
    expect(state.refundWrites).toBe(0);
  });

  it('does not execute a provider again when the reference was already consumed', async () => {
    const state: FakeDbState = { affectedRows: 0, existingConsumption: true, batches: [], executorReads: 0, refundWrites: 0 };
    const blink = createFakeBlink(state);
    let executions = 0;

    await expect(consumeExecuteRefund(
      blink,
      'user-1',
      'text_generation',
      'Test generation',
      'stable-reference-2',
      async () => {
        executions += 1;
        return 'should-not-run';
      },
    )).rejects.toThrow('IDEMPOTENT_REPLAY_REQUIRES_DURABLE_RESULT');

    expect(executions).toBe(0);
    expect(state.refundWrites).toBe(0);
  });

  it('reports a replay whose charge was already refunded as terminal', async () => {
    const state: FakeDbState = {
      affectedRows: 0,
      existingConsumption: true,
      existingRows: [{ type: 'consumption', balanceAfter: 499 }, { type: 'refund', balanceAfter: 500 }],
      batches: [],
      executorReads: 0,
      refundWrites: 0,
    };
    const blink = createFakeBlink(state);
    let executions = 0;

    await expect(consumeExecuteRefund(
      blink,
      'user-1',
      'text_generation',
      'Test generation',
      'stable-reference-refunded',
      async () => {
        executions += 1;
        return 'should-not-run';
      },
    )).rejects.toThrow('IDEMPOTENT_REPLAY_ALREADY_REFUNDED');

    expect(executions).toBe(0);
    expect(state.refundWrites).toBe(0);
  });

  it('refunds exactly once when the provider throws', async () => {
    const state: FakeDbState = { affectedRows: 1, existingConsumption: false, batches: [], executorReads: 0, refundWrites: 0 };
    const blink = createFakeBlink(state);

    await expect(consumeExecuteRefund(
      blink,
      'user-1',
      'text_generation',
      'Test generation',
      'stable-reference-3',
      async () => { throw new Error('provider failed'); },
    )).rejects.toThrow('provider failed');

    expect(state.refundWrites).toBe(1);
    expect(state.batches).toHaveLength(2);
  });
});
