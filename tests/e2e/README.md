# Tests E2E Playwright — Kompilot

## Installation

```bash
bun add -D @playwright/test
bunx playwright install chromium
```

## Exécution

```bash
# Tous les tests (headless)
bunx playwright test --config=tests/e2e/playwright.config.ts

# Interface graphique (debug)
bunx playwright test --config=tests/e2e/playwright.config.ts --ui

# Un seul fichier
bunx playwright test tests/e2e/specs/auth.spec.ts --config=tests/e2e/playwright.config.ts

# Avec rapport HTML
bunx playwright test --config=tests/e2e/playwright.config.ts --reporter=html
open playwright-report/index.html
```

## Variables d'environnement (optionnel)

```bash
E2E_TEST_EMAIL=votre-email@test.com
E2E_TEST_PASSWORD=VotreMotDePasse
PLAYWRIGHT_BASE_URL=https://votre-app.blinkpowered.com
```

## Structure des tests

| Fichier | Description |
|---|---|
| `auth.spec.ts` | Tunnel critique : Landing → Login → Dashboard → Logout |
| `dashboard-robustness.spec.ts` | Empty states, clics frénétiques, navigation rapide |
| `subscription-edge-cases.spec.ts` | Crédits épuisés, mode démo, validation formulaires |

## Chemins critiques testés

1. ✅ Landing Page accessible
2. ✅ /login et /signup se chargent sans crash
3. ✅ Connexion Demo → Dashboard visible
4. ✅ Connexion invalide → message d'erreur (pas de crash)
5. ✅ /dashboard sans session → redirect /login
6. ✅ Session expirée simulée → redirect propre
7. ✅ Route 404 → page 404 visible
8. ✅ Logout → localStorage nettoyé + redirect /login
9. ✅ Clics multiples sur "Créer un post" → un seul modal
10. ✅ Refresh rapide × 3 → dashboard se recharge
11. ✅ Navigation rapide entre routes → pas de crash
12. ✅ Panne API backend simulée → toast + UI non bloquée
13. ✅ Mode démo → données isolées
