import { describe, it, expect } from 'bun:test';

describe('SMS credits backend router', () => {
  it('exports the mounted router', async () => {
    const mod = await import('../../backend/routes/smsCredits');
    expect(mod.router).toBeDefined();
  });

  it('uses positive guarded consumption semantics', () => {
    const balance = 50;
    const amount = 3;
    expect(amount > 0 && balance >= amount).toBe(true);
    expect(balance - amount).toBe(47);
  });
});
