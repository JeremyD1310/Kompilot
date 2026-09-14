# Master Prompt — Implémentation finale de la grille tarifaire Kompilot

> **Cible** : Vite React + Blink SDK + Stripe + Brevo + Tailwind CSS + `@blinkdotnew/ui`
> **Périmètre** : Stripe (IDs de prix), UI landing + page checkout, CGV, emails transactionnels, tests E2E
> **Durée estimée** : 5–7 jours-homme (full-stack solo)
> **Date** : 2026-07-31

---

## Tu es un architecte produit, développeur full-stack et expert juridique/marketing pour Kompilot.

Ton objectif est d'exécuter la mise en place technique et front-end de la grille tarifaire sur l'application et la landing page, dans le respect strict des règles de facturation et des CGV. Tu modifies UNIQUEMENT les fichiers nécessaires et tu ne casses aucune fonctionnalité existante. Tu testes chaque étape avant de passer à la suivante.

---

## Phase 1 — Paramétrage Financier & Stripe

### 1.1 Création des produits et prix dans le Dashboard Stripe

Avant d'écrire une seule ligne de code, connecte-toi au Dashboard Stripe et crée les produits suivants en mode **TEST** puis en mode **LIVE** :

| Produit | Prix mensuel HT | Prix annuel HT | Intervalle | Engagement |
|---|---|---|---|---|
| **Starter** | 69,00 € | 759,00 € (→ 63,25 €/mois effectif) | `month` / `year` | Annuel = 1 an ferme |
| **Agency** | 149,00 € | 1 639,00 € (→ 136,58 €/mois effectif) | `month` / `year` | Annuel = 1 an ferme |
| **Sur Mesure** | Devis | Devis | N/A | Défini par contrat |

**Règles Stripe à appliquer :**

- **Mensuel** → `recurring { interval: 'month', interval_count: 1 }` — prélèvement automatique chaque mois, résiliable à tout moment.
- **Annuel** → `recurring { interval: 'year', interval_count: 1 }` — prélèvement unique en début de cycle (pas de `payment_behavior: 'default_incomplete'`), engagement ferme de 12 mois.
- Ajouter les métadonnées suivantes à chaque prix :
  ```json
  {
    "plan_tier": "starter|agency|surmesure",
    "billing_cycle": "monthly|annual",
    "commitment_months": "1|12",
    "trial_days": "7"
  }
  ```
- Pour les prix annuels, le checkout doit collecter le paiement **immédiatement** (`mode: 'subscription'`, pas de `trial_period_days` si l'essai est déjà consommé).

### 1.2 Configuration des variables d'environnement

```bash
# .env.local (NE JAMAIS committer)
VITE_STRIPE_PK_TEST=pk_test_...
VITE_STRIPE_PK_LIVE=pk_live_...

# Secrets (ajoutés via add_secrets dans Blink)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_MONTHLY_ID=price_xxx
STRIPE_STARTER_ANNUAL_ID=price_xxx
STRIPE_AGENCY_MONTHLY_ID=price_xxx
STRIPE_AGENCY_ANNUAL_ID=price_xxx
BREVO_API_KEY=xkeysib-...
BREVO_TEMPLATE_WELCOME=3  # ID du template Brevo "Bienvenue + confirmation"
BREVO_TEMPLATE_INVOICE=7  # ID du template Brevo "Facture acquittée"
```

### 1.3 Mise à jour de `backend/lib/stripePriceConfig.ts`

Étendre la config existante avec les 4 nouveaux price IDs :

```typescript
export const STRIPE_PRICES = {
  starter: {
    monthly: env.STRIPE_STARTER_MONTHLY_ID,
    annual:  env.STRIPE_STARTER_ANNUAL_ID,
  },
  agency: {
    monthly: env.STRIPE_AGENCY_MONTHLY_ID,
    annual:  env.STRIPE_AGENCY_ANNUAL_ID,
  },
  surmesure: {
    monthly: 'contact',
    annual:  'contact',
  },
} as const;
```

### 1.4 Mise à jour de `backend/routes/billing/checkout.ts`

Adapter la route `POST /api/billing/create-checkout-session` pour accepter les nouveaux paramètres :

```typescript
// Body attendu
interface CheckoutBody {
  planId: 'starter' | 'agency' | 'surmesure';
  billingCycle: 'monthly' | 'annual';
  customerId?: string;    // si déjà client Stripe
  successUrl: string;
  cancelUrl: string;
}
```

Logique métier :
1. Résoudre le `priceId` depuis `STRIPE_PRICES[planId][billingCycle]`.
2. Si `planId === 'surmesure'` → rediriger vers `/contact?plan=surmesure` (pas de checkout Stripe).
3. Créer la session avec `payment_behavior: 'default_incomplete'` et `trial_period_days: 7` uniquement si l'utilisateur n'a pas déjà consommé son essai (vérifier `user.trial_end` dans la DB).
4. Injecter les métadonnées du plan dans `subscription_data.metadata`.
5. Retourner `{ url: session.url }`.

### 1.5 Webhook Stripe — `backend/routes/webhooks.ts`

Ajouter les handlers pour les événements suivants (si pas déjà présents) :

| Événement | Action |
|---|---|
| `checkout.session.completed` | Activer le compte (`is_blocked: 0`), enregistrer l'abonnement, déclencher l'email de bienvenue via Brevo |
| `invoice.paid` | Enregistrer le paiement, déclencher l'email de facture acquittée (Brevo template 7), mettre à jour `user_budget_limits` |
| `invoice.payment_failed` | Envoyer une notification d'échec, bloquer le compte après 3 tentatives (`is_blocked: 1`) |
| `customer.subscription.deleted` | Désactiver le compte à la fin du cycle courant, envoyer email de confirmation de résiliation |
| `customer.subscription.trial_will_end` | Envoyer un rappel 3 jours avant la fin d'essai |

---

## Phase 2 — Intégration Front-End & Landing Page

### 2.1 Composant `PricingSection.tsx` — Refonte complète

**Emplacement** : `src/components/landing/PricingSection.tsx`

Spécifications :

```tsx
interface PricingPlan {
  id: 'starter' | 'agency' | 'surmesure';
  name: string;
  monthlyPrice: number;   // HT
  annualPrice: number;     // HT
  effectiveMonthly: number; // annuel / 12, affiché en petit
  features: string[];
  highlight?: boolean;     // badge "Populaire"
  ctaLabel: string;
}
```

**Toggle Annuel / Mensuel** :
- Composant `ToggleGroup` ou deux boutons radio stylisés.
- Par défaut : **Annuel** (pour maximiser le panier moyen).
- Badge "🔥 1 mois offert" visible sur le toggle annuel.
- Transition fluide des prix via `motion.div` (framer-motion) ou CSS `transition`.

**Cartes** :
- 3 colonnes sur desktop (`grid-cols-3`), 1 colonne sur mobile.
- Carte Agency légèrement mise en avant : ombre plus prononcée, bordure primaire, badge "⭐ Le plus populaire".
- Prix HT affiché en grand (48px), avec le prix TTC en dessous en plus petit (TVA 20%).
- Pour l'annuel : afficher le prix mensuel effectif barré (`~~69 €~~ → 63,25 €/mois`).
- Chaque carte liste ses features avec des checkmarks (`Check` de Lucide).

**CTA** :
- Starter / Agency : bouton `Démarrer l'essai gratuit` → POST `/api/billing/create-checkout-session`.
- Sur Mesure : bouton `Nous contacter` → ouvre Calendly ou envoie vers `/contact`.

**Mentions légales sous les cartes** :
```
Engagement d'un an ferme à compter de la date de souscription pour l'offre annuelle.
Tous les prix sont affichés hors taxes (HT). TVA applicable au taux en vigueur (20%).
Essai gratuit de 7 jours sans engagement pour les offres mensuelles uniquement.
```

### 2.2 Mise à jour des landing pages existantes

- `src/pages/LandingPage.tsx` — vérifier que la section pricing est bien servie par le nouveau `PricingSection`.
- `src/pages/PricingPage.tsx` — idem, page dédiée `/pricing`.
- Toute page contenant un `<PricingSection>` doit refléter les nouveaux prix.

### 2.3 Page checkout (`src/pages/CheckoutPage.tsx`)

Créer ou mettre à jour une page de récapitulatif avant paiement :

```
┌───────────────────────────────────────┐
│  Récapitulatif de votre commande      │
│                                       │
│  Plan : Starter Annuel                │
│  Prix HT : 759,00 €                   │
│  TVA 20% : 151,80 €                   │
│  Total TTC : 910,80 €                 │
│                                       │
│  Engagement : 1 an ferme             │
│  Renouvellement : tacite à échéance  │
│                                       │
│  [ ] J'accepte les CGV                │
│  [ ] Je reconnais avoir pris          │
│      connaissance du droit de         │
│      rétractation                     │
│                                       │
│  [Payer 910,80 € → Stripe Checkout]   │
└───────────────────────────────────────┘
```

- Les CGV sont accessibles via un lien `/cgv`.
- Le consentement est enregistré dans `legal_signatures` ET `compliance_consent_log`.
- La checkbox CGV est obligatoire pour activer le bouton de paiement.

---

## Phase 3 — Mise à Jour Juridique (CGV)

### 3.1 Injection des clauses dans les CGV existantes

Modifier `src/pages/CGVsPage.tsx` et `src/pages/LegalPage.tsx` pour ajouter les clauses suivantes :

#### Article X — Modalités de facturation

> **X.1 Périodicité.** Les Offres sont proposées selon deux rythmes de facturation :
> - **Mensuel (« Sans engagement »)** : le prix est prélevé chaque mois, pour une durée indéterminée. Le Client peut résilier à tout moment depuis son espace Kompilot ou par email à support@kompilot.fr. La résiliation prend effet à la fin du mois en cours.
> - **Annuel (« Engagement 12 mois »)** : le prix est prélevé en une seule fois pour une durée ferme de douze (12) mois à compter de la date de souscription. L'intégralité de l'abonnement est due dès le premier jour.

> **X.2 Exigibilité immédiate.** Pour l'Offre Annuelle, la totalité du prix (759 € HT ou 1 639 € HT selon le plan choisi) est exigible au moment de la souscription. Le prélèment est effectué en un seul bloc.

> **X.3 Absence de remboursement en cas de résiliation anticipée.** En cas de résiliation avant le terme de la période d'engagement de douze (12) mois pour l'Offre Annuelle, aucun remboursement — même partiel ou au prorata temporis — ne sera accordé. Le Client reste redevable de l'intégralité de l'abonnement souscrit.

> **X.4 Renouvellement tacite.** À l'issue de la période d'engagement, l'Abonnement est reconduit tacitement pour une durée identique, sauf dénonciation par le Client au moins trente (30) jours avant la date d'échéance. Kompilot s'engage à notifier le Client par email au moins soixante (60) jours avant l'échéance.

> **X.5 Droit de rétractation.** Conformément à l'article L.221-28 du Code de la consommation, le Client reconnaît que la fourniture de services numériques pleinement exécutés avant la fin du délai de rétractation emporte renonciation expresse à ce droit. En cochant la case prévue à cet effet lors du paiement, le Client renonce expressément à son droit de rétractation de 14 jours pour bénéficier d'un accès immédiat au service.

### 3.2 Versionnage

- Chaque modification des CGV doit incrémenter un numéro de version visible dans le document (ex : `CGV Kompilot — v2.1 — 31 juillet 2026`).
- Le `compliance_consent_log.cgv_version` doit correspondre à cette version.

---

## Phase 4 — Emails Transactionnels (Brevo)

### 4.1 Templates à créer ou mettre à jour dans Brevo

| Template ID | Nom | Déclencheur | Contenu |
|---|---|---|---|
| 3 | `welcome` | `checkout.session.completed` | Confirmation de création de compte + récap commande + lien dashboard |
| 7 | `invoice_paid` | `invoice.paid` | Facture acquittée en PJ HTML + mention TVA + période couverte |
| 8 | `trial_ending` | `trial_will_end` (J-3) | Rappel fin d'essai + CTA upgrade |
| 9 | `subscription_cancelled` | `subscription.deleted` | Confirmation résiliation + offre de réactivation |

### 4.2 Variables dynamiques disponibles dans les templates

```
{{ contact.FIRSTNAME }}
{{ contact.EMAIL }}
{{ params.plan_name }}
{{ params.billing_cycle }}
{{ params.amount_ht }}
{{ params.amount_ttc }}
{{ params.invoice_number }}
{{ params.invoice_url }}
{{ params.dashboard_url }}
{{ params.next_billing_date }}
```

---

## Phase 5 — Recette et Validation Technique

### 5.1 Checklist de recette manuelle

- [ ] **Toggle Annuel/Mensuel** : basculement fluide sur desktop ET mobile (375px).
- [ ] **Prix** : les 4 prix (Starter M, Starter A, Agency M, Agency A) sont corrects et reflètent les IDs Stripe configurés.
- [ ] **Badge "1 mois offert"** : visible en mode Annuel, invisible en mode Mensuel.
- [ ] **Checkout Stripe test** : depuis la landing, clic sur "Démarrer l'essai" → redirection Stripe → saisie CB test `4242 4242 4242 4242` → retour succès.
- [ ] **Webhook** : `checkout.session.completed` déclenche bien l'email Brevo (vérifier dans les logs Brevo).
- [ ] **Webhook** : `invoice.paid` déclenche bien l'email de facture acquittée.
- [ ] **CGV** : les cases à cocher sont obligatoires, le consentement est persisté en base.
- [ ] **Rétractation** : la renonciation au droit de rétractation est enregistrée dans `compliance_consent_log.retraction_waived = 1`.
- [ ] **Aucune régression** : les pages `/`, `/pricing`, `/signup`, `/login`, `/cgv`, `/legal` fonctionnent normalement.
- [ ] **Mobile** : pas de scroll horizontal, cartes empilées, CTA accessible sans zoom.
- [ ] **Dark mode** : le dégradé de fond de la section pricing est lisible, les couleurs des cartes sont cohérentes avec le thème clair.

### 5.2 Tests E2E Playwright (si applicable)

```typescript
// tests/e2e/specs/pricing.spec.ts
test('pricing toggle switches between monthly and annual', async ({ page }) => {
  await page.goto('/');
  // Par défaut : annuel
  await expect(page.locator('[data-testid="pricing-toggle"]')).toHaveText('Annuel');
  await expect(page.locator('[data-testid="price-starter"]')).toHaveText('759');
  // Basculer en mensuel
  await page.locator('[data-testid="pricing-toggle-monthly"]').click();
  await expect(page.locator('[data-testid="price-starter"]')).toHaveText('69');
});

test('checkout redirects to Stripe with correct price ID', async ({ page }) => {
  await page.goto('/pricing');
  await page.locator('[data-testid="cta-starter-annual"]').click();
  await page.waitForURL('**/checkout**');  // page de résumé
  await page.locator('[data-testid="accept-cgv"]').check();
  await page.locator('[data-testid="accept-retraction"]').check();
  const [stripePage] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('[data-testid="pay-button"]').click(),
  ]);
  await expect(stripePage.url()).toContain('checkout.stripe.com');
});
```

---

## Phase 6 — Déploiement

1. `bun run build` → zéro erreur.
2. `blink_backend_deploy` → confirmer que le webhook Stripe est actif.
3. Tester le checkout en mode **TEST** avec la carte `4242 4242 4242 4242`.
4. Une fois validé, basculer les clés Stripe en **LIVE** dans les secrets Blink.
5. Déployer en production via `Publish` dans l'interface Blink.
6. Vérifier que le site live reflète les nouveaux prix et que le checkout fonctionne.

---

## Fichiers à modifier (ordre d'exécution)

| # | Fichier | Action |
|---|---|---|
| 1 | Dashboard Stripe | Créer les 4 produits/prix |
| 2 | `add_secrets` (Blink) | Ajouter STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, les 4 IDs de prix, BREVO_API_KEY |
| 3 | `backend/lib/stripePriceConfig.ts` | Ajouter les constantes de prix |
| 4 | `backend/routes/billing/checkout.ts` | Adapter la route checkout |
| 5 | `backend/routes/webhooks.ts` | Ajouter les handlers webhook |
| 6 | `src/components/landing/PricingSection.tsx` | Refonte complète (toggle + cartes + mentions) |
| 7 | `src/pages/CheckoutPage.tsx` | Créer la page récapitulatif |
| 8 | `src/pages/CGVsPage.tsx` | Ajouter les clauses de facturation |
| 9 | `src/components/pricing/` | Séparer les atomes (PricingCard, PricingToggle, PricingFeatures) |
| 10 | Brevo | Créer/mettre à jour les templates 3, 7, 8, 9 |
| 11 | `tests/e2e/specs/pricing.spec.ts` | Ajouter les tests E2E |
| 12 | `blink_backend_deploy` | Déployer le backend |
| 13 | `bun run build` + `Publish` | Déploiement frontend production |
