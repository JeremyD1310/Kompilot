# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Tunnel critique : Landing → Connexion → Dashboard >> 1.2 — La page /login se charge sans crash
- Location: tests/e2e/specs/auth.spec.ts:76:3

# Error details

```
Test timeout of 45000ms exceeded.
```

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]') to be visible

```

```
Test timeout of 45000ms exceeded.
```

```
Fixture "trace recording" timeout of 45000ms exceeded during teardown.
```