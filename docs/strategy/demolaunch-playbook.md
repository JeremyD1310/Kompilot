# KOMPilot — Arsenale Demo Lancement 7 Septembre 2026

**Document de travail — Conversion, Conformité & Validation**
**Auteur :** CPO / Growth Hacking / Copywriting Senior
**Version :** 1.0 — 16 juillet 2026

---

# PARTIE 1 : CAHIER DE TEST QA (ASSURANCE QUALITÉ)

## 1.1 — Connexion initiale & Interface globale

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Connexion | Entrer `test@kompilot.com` + `123Netcopilot` sur `/login` → cliquer "Se connecter" | Connexion réussie du 1er coup. Aucune erreur technique (console propre). Redirection immédiate vers `/dashboard`. | Aucun appel API Blink Auth intercepte les identifiants. Le bypass demo (`isDemoCredentials`) s'exécute avant. |
| Bandeau demo | Observer la barre en haut du dashboard | Bandeau violet gradient visible : "Mode Démo Sandbox — Données fictives, réinitialisées à chaque visite". Bouton "Créer mon compte →" visible. | Le composant `DemoBanner` se monte car `isDemoActive === true` (sessionStorage). |
| Compteur global | Vérifier le header du dashboard | Affichage du plan "Expert", 500 crédits total, 347 utilisés (ou affichage cohérent selon `DEMO_CREDITS` dans `demoAccount.ts`). | Les données viennent de `demoAccount.ts` L168-173. Aucune donnée réelle n'est requête. |
| Badge mode démo | Rechercher dans le header sticky | Le badge "Mode Démo" a été supprimé au profit du DemoBanner. | Écran sans double signalisation (correction A3 appliquée). |

---

## 1.2 — Switcher Pro/Agence

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Bouton switcher | Cliquer sur le toggle Pro/Agence dans le sidebar | Basculer vers `/agence/dashboard` instantanément, sans rechargement de page. | `toggleDemoView()` bascule `demoViewRole` dans `DemoViewContext`. `localStorage('kompilot_demo_view_role')` = `'agency'`. |
| Vue Agence | Observer `/agence/dashboard` | Grid de 6 clients démo (Le Petit Bistro, Studio Beauté Léa, Garage Martin, etc.) avec scores GEO, tendances, statuts alert/ok. | Données provenant de `DEMO_AGENCY_CLIENTS` dans `demoAccount.ts` L150-157. |
| Retour Pro | Cliquer à nouveau sur le switcher | Retour vers `/dashboard` (Pro). Tous les KPIs Pro réaffichés. | `navigate({ to: '/dashboard' })` — `isAgencyView` repasse à `false`. |
| Rafraîchissement | Appuyer F5 | La vue choisie persiste (Pro ou Agence). Pas de reset. | `localStorage('kompilot_demo_view_role')` persiste entre les sessions. |
| Aucune restriction | Naviguer dans toutes les routes Agence | Accès complet : `/agence/dashboard`, `/agence/lead-search`, `/agence/cowork`. Aucun blocage RBAC. | `DEMO_USER.role = 'admin'` + `metadata.agencyMode = true`. |

---

## 1.3 — Génération IA & Jauge de crédits

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Indicateur initial | Ouvrir le cockpit IA | Jauge affiche "50 crédits IA démo". Widget `CreditsQuotaWidget` visible. | `demoCreditTotal = 50` dans `DemoModeContext.tsx` L170. |
| Consommation | Cliquer "Générer" (post IA, réponse avis, ou suggestion) | 1 crédit consommé. Compteur passe à 49. Animation de mise à jour. | `consumeDemoCredits(1)` retourne `true`. `localStorage('kompilot_demo_credits_v1')` = `'1'`. |
| Répétition | Consommer 40 crédits supplémentaires (41 actions) | Compteur descend à 9. | Chaque appel `consumeDemoCredits(n)` persiste dans localStorage. |
| Alerte basse (< 10) | Observer les 9 crédits restants | Alerte visuelle : badge orange/rouge dans le widget crédits. Possibilité d'un bandeau d'alerte. | `isDemoCreditsExhausted` passe à `true` quand `demoCreditsUsed >= 50`. |
| Crédits épuisés | Consommer les 9 derniers crédits | Boutons IA désactivés. Message : "Crédits épuisés — Passez au plan complet". CTA vers `/pricing`. | `demoCreditsRemaining = 0`. CTA visible dans `CreditsQuotaWidget`. |
| Non-recharge | Ne rien faire pendant 2 minutes, puis tenter une action | Les crédits restent à 0. Pas de rechargement automatique. | Aucun mécanisme de rechargement en mode démo (les crédits ne se régénèrent qu'à `activateDemo()`). |

---

## 1.4 — Persistance & Réinitialisation

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Non-écriture DB | Pendant la session, vérifier le Network tab | Aucun appel vers `blink.db.*` pour les données démo. Tous les appels DB échouent silencieusement (pas de JWT). | Le login demo ne génère aucun token JWT Blink. |
| Sauvegarde locale | Créer un post IA + consommer des crédits + changer la vue | Toutes les données dans localStorage/sessionStorage : `kompilot_demo_session_v1`, `kompilot_demo_credits_v1`, `kompilot_demo_view_role`. | Vérifiable via DevTools > Application > Storage. |
| Fermeture onglet | Fermer l'onglet, rouvrir dans un nouvel onglet | sessionStorage vidé. `isDemoActive` repasse à `false`. L'utilisateur voit la landing page. | sessionStorage se vide automatiquement à la fermeture. |
| Réouverture après 12h | Simuler (modifier `savedAt` dans localStorage) | Session expirée. `clearDemoSession()` supprime les données. Redirection vers `/login`. | `readDemoSession()` vérifie `Date.now() - parsed.savedAt > 12 * 60 * 60 * 1000`. |
| Reset crédits | Se reconnecter après expiration | Les 50 crédits IA sont rechargés à 0. `activateDemo()` réinitialise. | `activateDemo()` L301-302 : `setDemoCreditsUsed(0)` + `saveDemoCreditsUsed(0)`. |

---

## 1.5 — Tunnel de Conversion & CTA

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| CTA bandeau demo | Cliquer "Créer mon compte →" dans le DemoBanner | Redirection vers `/signup` (correction A4 appliquée). | `handleExitDemo()` → `deactivateDemo()` + `navigate({ to: '/signup' })`. |
| CTA credits épuisés | Cliquer "Voir les offres" quand crédits = 0 | Accès à `/pricing` ou ouverture du modal `PricingCards`. | `navigate({ to: '/pricing' })` dans `CreditsQuotaWidget.tsx` L107. |
| Page pricing | Vérifier l'affichage des 3 offres | Starter : 69€ HT/mois. Agence : 149€ HT/mois. Enterprise : sur devis. | `PricingCards` intégré dans `SettingsPage.tsx` L410. |
| Checkout Stripe | Cliquer sur un CTA d'achat | Ouverture du tunnel Stripe (nouvel onglet ou modal). | Le composant `SubscriptionCheckoutPanel` gère le flow. |
| Chat IA - Tarifs | Cliquer "Tarifs & plans" dans le widget IA | Réponse IA avec les 3 offres. | Prompt prédéfini dans `AIChatWidget.tsx` L214. |
| TrialEndModal | Simuler la fin d'essai (données) | Modal avec CTA d'upgrade visible. | `TrialEndModal` dans `DashboardLayout.tsx` L361. |

---

## 1.6 — Feedback & Support

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Crisp Chat | Vérifier la présence du widget Crisp | Icône chat visible en bas à droite (utilisateur authentifié). | `useCrispChat` injecte le script Crisp (website ID: `6489e565...`). |
| BugReportButton | Cliquer "Rapporter un problème 🛠️" | Modal avec snapshot technique (URL, user agent, console logs). | `BugReportButton.tsx` capture et sauvegarde dans localStorage. |
| AI Chat Widget | Cliquer sur la bulle IA (bas gauche) | 5 options rapides dont "Tarifs & plans". Chat IA fonctionnel. | `AIChatWidget.tsx` L213-218. |
| Soumission feedback | Remplir et envoyer un bug report | Le rapport est sauvegardé dans localStorage (`kompilot_bug_reports`). Envoi mailto: vers support. | `saveBugReport()` dans `BugReportButton.tsx` L48. |

---

## 1.7 — Déconnexion automatique (à implémenter)

| Élément | Test | Résultat attendu | Critère de passage |
|---------|------|-------------------|--------------------|
| Inactivité 20 min | Laisser l'onglet ouvert sans interaction pendant 20 minutes | Déconnexion automatique. Redirection vers `/login`. Message : "Session expirée — Connectez-vous à nouveau". | **NON IMPLÉMENTÉ** — Nécessite ajout d'un idle timer dans `DemoModeContext`. |

**Recommandation :** Ajouter un `useEffect` avec un idle timer (écouteurs `mousemove`, `keydown`, `click`) dans `DemoModeContext.tsx`. Après 20 min sans activité → `deactivateDemo()` + `clearDemoSession()` + `navigate({ to: '/login', search: { reason: 'expired' } })`.

---

## RÉSUMÉ QA

| Phase | Statut | Couverture |
|-------|--------|------------|
| 1.1 — Connexion & Interface | ✅ Testable | Login bypass, bandeau, compteur |
| 1.2 — Switcher Pro/Agence | ✅ Testable | Bascul, persistance, accès complet |
| 1.3 — IA & Crédits | ✅ Testable | 50 crédits, consommation, épuisement |
| 1.4 — Persistance & Reset | ✅ Testable | Zéro DB, localStorage, expiration 12h |
| 1.5 — Conversion & CTA | ✅ Testable | Bandeau → signup, pricing, Stripe |
| 1.6 — Feedback & Support | ✅ Testable | Crisp, BugReport, AI Chat |
| 1.7 — Déconnexion 20 min | ⚠️ À implémenter | Idle timer manquant |

---

---

# PARTIE 2 : TEXTES D'INTERFACE & MICRO-COPYWRITING (CONVERSION)

## 2.1 — Bandeau de FOMO (haut du dashboard)

**Emplacement :** Sous le `DemoBanner`, avant les KPI cards. Fond gradient doré/ambre. Icône ⏳ ou 🔥.

### Variante A — Urgence temporelle
**Titre :** 1 mois offert — offre limitée au 7 septembre
**Sous-texte :** Passez à l'annuel Starter (69 €/mois) ou Agence (149 €/mois) et votre premier mois est offert. Plus que [X] jours.
**CTA :** `Activer mon offre`

### Variante B — Preuve sociale + urgence
**Titre :** 120+ pros ont déjà adopté Kompilot — 1 mois offert pour vous lancer
**Sous-texte :** Rejoignez les commerces et agences qui gèrent leur visibilité IA depuis un seul cockpit. Offre annuelle valable jusqu'au 7 septembre.
**CTA :** `Rejoindre maintenant`

### Variante C — Rareté + valeur
**Titre :** Offre de lancement : économisez 69 € à 149 € sur votre première année
**Sous-texte :** Premier mois offert sur tout abonnement annuel. Starter comme Agence. Offre non cumulable, réservée aux 500 premiers inscrits.
**CTA :** `Voir mon éligibilité`

---

## 2.2 — Pop-up de sauvegarde (post-action clé)

**Déclencheur :** Après la 3ème action significative (génération de contenu, réponse à un avis, planification d'un post). Affichée une seule fois par session.

**Emplacement :** Modal centré, overlay sombre.

---

**Titre :** Vous venez de créer quelque chose d'utile

**Corps :**
En 3 minutes de démo, vous avez déjà généré du contenu, répondu à un avis et planifié une publication. Tout ce travail mérite d'être sauvegardé — et c'est exactement ce que fait Kompilot chaque jour pour plus de 120 professionnels.

**Mention RGPD :**
☑ En cochant cette case, j'accepte de recevoir des conseils d'optimisation marketing et des communications produit de la part de Kompilot. Je peux me désinscrire à tout moment en cliquant sur le lien en pied de chaque email. [Politique de confidentialité →]

**Bouton primaire :** `Sauvegarder mon travail → Créer mon compte`
→ Redirige vers `/signup` avec les données de session en mémoire.

**Bouton secondaire :** `Continuer la démo`
→ Ferme le modal, persiste un flag pour ne plus l'afficher cette session.

---

## 2.3 — Notification de fin de crédits (< 10 restants)

**Emplacement :** Toast notification persistante en bas à droite. Ne se ferme pas automatiquement. Bouton X pour masquer.

### Variante A — Bilan + encouragement
**Titre :** 🚀 Belle session ! Il vous reste [N] crédits IA.
**Corps :**
Vous avez généré [X] contenus, répondu [Y] avis et analysé [Z] métriques en [durée] minutes. Pour continuer à utiliser le Copilote IA sans interruption, passez au plan Starter (69 €/mois) ou Agence (149 €/mois).
**CTA :** `Débloquer l'IA illimitée`

### Variante B — Urgence douce + valeur
**Titre :** ⚡ Plus que [N] crédits — et après, c'est à vous de jouer
**Corps :**
Le Copilote IA a fait ses preuves pendant votre démo. Pour garder cette productivité chaque semaine — posts automatiques, réponses aux avis, audits GEO — passez au plan complet. Offre de lancement : 1 mois offert sur l'annuel.
**CTA :** `Voir les formules`

---

---

# PARTIE 3 : VIRALITÉ & PREUVE SOCIALE (GROWTH)

## 3.1 — Bouton "Quick Share" (partage en un clic)

**Emplacement :** Après chaque résultat IA réussi (génération de post, audit GEO, réponse avis), un bouton `Partager mon résultat` apparaît à côté du CTA principal.

### Texte pré-rempli LinkedIn :
```
Je viens de tester la démo de @Kompilot et le résultat est bluffant.

En moins de 5 minutes, j'ai :
✅ Généré un post optimisé pour mes réseaux sociaux
✅ Obtenu un score de visibilité locale détaillé
✅ Planifié ma semaine de contenu

Kompilot, c'est un cockpit IA pour les commerces et agences qui veulent booster leur présence en ligne — sans y passer des heures.

Lancement officiel le 7 septembre. Démo gratuite ici 👇
https://kompilot.blinkpowered.com

#MarketingLocal #IntelligenceArtificielle #PME #Visibilité
```

### Texte pré-rempli Twitter/X :
```
Je viens de tester @Kompilot en démo et c'est bluffant 🚀

Un cockpit IA pour gérer :
→ Posts réseaux sociaux (générés par IA)
→ Avis Google (réponses auto)
→ Visibilité locale (score GEO)

Lancement le 7 sept. Essai gratuit 👇
https://kompilot.blinkpowered.com

#MarketingLocal #IA
```

**Emplacement technique :** Le bouton `QuickShareButton` doit être ajouté :
- Dans `CopilotCoach.tsx` après `handleCTA` (post IA généré)
- Dans `AuditFlashModal.tsx` après le rendu du score GEO
- Dans `ReviewsManager.tsx` après une réponse IA à un avis

**Mécanisme :** `navigator.share()` (mobile) ou `navigator.clipboard.writeText()` (desktop) avec fallback modal de sélection de plateforme.

---

## 3.2 — Encart de Preuve Sociale (Social Proof Widget)

**Emplacement :** Coin inférieur gauche du dashboard, au-dessus du widget Crisp. Petit encart rotatif, discret mais visible.

**Fréquence :** Rotation toutes les 12 secondes, animation fade-in/out.

### Message 1 — Commerçant (plan Starter) :
> 🍕 **Le Petit Bistro** — La Rochelle
> +47 followers cette semaine grâce aux 5 posts IA générés automatiquement.
> *Il y a 3 heures*

### Message 2 — Agence (plan Agence) :
> 🏢 **Romain, gérant de l'agence WebBoost** — Bordeaux
> A économisé 12h cette semaine en gérant ses 8 clients depuis le cockpit Agence.
> *Il y a 47 minutes*

### Message 3 — Score GEO :
> 📍 **Cabinet Dentaire Moreau** — Paris 11e
> Score GEO passé de 58 à 77/100 en 30 jours. +34% de visibilité locale.
> *Hier*

### Message 4 — Avis Google :
> ⭐ **Studio Beauté Léa** — Bordeaux
> 12 avis Google répondus automatiquement cette semaine. Note moyenne : 4.8/5.
> *Il y a 2 heures*

**Règles d'affichage :**
- Visible uniquement en mode démo
- Dismissible (X) — ne réapparaît pas pendant la session
- Masqué sur mobile (< 768px) pour économiser l'espace
- Animations respectant `prefers-reduced-motion`

---

---

# PARTIE 4 : STRATÉGIE DE RETARGETING & PRIVACY

## 4.1 — Campagne de reciblage (Meta & LinkedIn Ads)

### Ciblage

| Critère | Meta Ads | LinkedIn Ads |
|---------|----------|-------------|
| Audience | Visiteurs kompilot.blinkpowered.com (pixel) — 30 derniers jours, excluant /signup | Visiteurs site (Insight Tag) — 30j, titre : gérant, directeur, freelance, agence |
| Exclusion | Utilisateurs ayant visité /subscription ou complété /signup | Idem |
| Géographie | France, Belgique, Suisse (francophone) | France |
| Fréquence max | 3 impressions / semaine / personne | 2 impressions / semaine |

---

### Concept 1 — "La valeur que vous avez créée"

**Visuel :** Capture d'écran du dashboard mode démo montrant les 4 KPI cards + un post IA généré. Superposition : "Vous avez créé tout ça en 5 minutes de démo."

**Texte Meta :**
```
Vous avez testé Kompilot. Vous avez vu ce que votre copilote IA peut faire.

En 5 minutes de démo, vous avez :
→ Génération de contenu IA pour vos réseaux
→ Analyse de votre visibilité locale
→ Planification de vos publications

Maintenant, imaginez ça chaque semaine.

🚀 Offre de lancement : 1er mois offert sur l'abonnement annuel.
Starter : 69 €/mois | Agence : 149 €/mois

Offre valable jusqu'au 7 septembre.
```

**Texte LinkedIn :**
```
Vous avez exploré la démo Kompilot. Vous savez déjà ce que l'IA peut faire pour votre visibilité locale.

Passer à l'action, c'est maintenant :

→ Starter (69 €/mois) : posts IA, gestion des avis, inbox, calendrier
→ Agence (149 €/mois) : tout ça × plusieurs clients + tableau de bord agence

🎁 Offre de lancement : 1er mois offert sur l'abonnement annuel (jusqu'au 7 sept.)

https://kompilot.blinkpowered.com/pricing
```

**CTA :** "Profiter de l'offre" → `https://kompilot.blinkpowered.com/pricing`

---

### Concept 2 — "Le compte à rebours"

**Visuel :** Fond sombre (#0B1120). Gros chiffre "7 SEPTEMBRE" en typographie blanche/grasse. En dessous : "L'offre de lancement expire." Logo Kompilot en bas. Pastille "1 MOIS OFFERT" en vert émeraude.

**Texte Meta :**
```
⏳ L'offre de lancement Kompilot expire le 7 septembre.

1 mois offert sur l'abonnement annuel.
Starter : 69 €/mois | Agence : 149 €/mois

Vous avez testé la démo. Vous avez vu les résultats.
Ne laissez pas passer cette offre.

👉 Réclamez votre mois offert maintenant
```

**Texte LinkedIn :**
```
7 septembre 2026 — c'est la date limite.

L'offre de lancement Kompilot : 1er mois offert sur tout abonnement annuel.

Ce que vous avez vu en démo :
✅ Posts IA générés en 10 secondes
✅ Réponses automatiques aux avis Google
✅ Score de visibilité locale en temps réel

Ce que vous obtenez avec un vrai plan :
✅ Tout ça, chaque semaine, sans limite
✅ Support prioritaire
✅ Évolutions continues

Starter : 69 €/mois | Agence : 149 €/mois

https://kompilot.blinkpowered.com/pricing
```

**CTA :** "Réclamer mon offre" → `https://kompilot.blinkpowered.com/pricing`

---

## 4.2 — Bandeau de consentement cookies (RGPD)

### Architecture technique

**Composant :** `CookieConsentBanner.tsx`
**Emplacement :** Fixé en bas de page, toutes pages publiques (/login, /, /pricing, /legal)
**Stockage :** `localStorage('kompilot_cookie_consent_v2')` avec timestamp pour expiration à 13 mois

### Catégories de cookies

| Catégorie | Cookies | Obligatoire | Consentement |
|-----------|---------|-------------|-------------|
| **Nécessaires** | Session demo, auth tokens, CSRF, préférences langue | ✅ Oui | Pas requis |
| **Analytiques** | Google Analytics 4, mesure d'audience, pages vues | ❌ Non | Opt-in explicite |
| **Marketing** | Meta Pixel, LinkedIn Insight Tag, reciblage publicitaire | ❌ Non | Opt-in explicite |

### Texte du bandeau

**Titre :** 🍪 Nous respectons votre vie privée

**Corps :**
Kompilot utilise des cookies pour améliorer votre expérience. Les cookies nécessaires sont indispensables au fonctionnement du site. Les cookies analytiques et marketing nous aident à améliorer nos services et à vous proposer des contenus pertinents — mais ils ne sont activés qu'avec votre accord.

**Boutons :**
| Bouton | Action | Style |
|--------|--------|-------|
| `Tout accepter` | Active nécessaires + analytiques + marketing. Charge GA4, Meta Pixel, LinkedIn Tag. | Primaire (bg-primary) |
| `Personnaliser` | Ouvre un panneau de choix granulaire (3 toggles) | Texte souligné |
| `Tout refuser` | Active uniquement les nécessaires. Aucun pixel tiers chargé. | Secondaire (outline, même taille que "Tout accepter") |

### Texte du panneau de personnalisation

```
[🔒 Nécessaires] Toujours actifs — session, sécurité, préférences
    (interrupteur désactivé, gris, non modifiable)

[📊 Analytiques] Google Analytics — comprendre comment vous utilisez Kompilot
    (interrupteur activable, OFF par défaut)

[📢 Marketing] Meta Pixel & LinkedIn — publicité personnalisée et reciblage
    (interrupteur activable, OFF par défaut)

[Enregistrer mes préférences]  (bouton primaire)
```

### Mentions légales (pied de page de la bannière)

> En cliquant sur "Tout accepter", vous consentez à l'utilisation de cookies pour les finalités décrites ci-dessus. Vous pouvez modifier vos choix à tout moment via le lien "Gérer mes cookies" présent dans le pied de page. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant privacy@kompilot.app.
>
> [Politique de confidentialité →] [Politique de cookies →] [Mentions légales →]

### Implémentation recommandée

```typescript
// Script de chargement conditionnel
const consent = JSON.parse(localStorage.getItem('kompilot_cookie_consent_v2') || '{}');

if (consent.analytics) {
  // Charger GA4
  loadScript('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX');
}

if (consent.marketing) {
  // Charger Meta Pixel
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  // Charger LinkedIn Insight Tag
  loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
}
```

---

---

# PARTIE 5 : ROADMAP D'IMPLÉMENTATION

## Priorisation recommandée

| Priorité | Élément | Effort estimé | Impact conversion |
|----------|---------|---------------|-------------------|
| **P0** | Bandeau FOMO (Partie 2.1) | 0.5j | Élevé — visible dès le 1er chargement |
| **P0** | Pop-up de sauvegarde (Partie 2.2) | 1j | Élevé — capte l'email au moment de pic d'engagement |
| **P0** | Notification fin de crédits (Partie 2.3) | 0.5j | Élevé — dernier point de contact avant abandon |
| **P0** | Idle timer 20 min (Partie 1.7) | 0.5j | Moyen — sécurité, crédibilité du mode démo |
| **P1** | Bandeau cookies RGPD (Partie 4.2) | 1j | Critique — obligatoire avant lancement public |
| **P1** | Quick Share (Partie 3.1) | 1j | Élevé — viralité organique |
| **P1** | Social Proof Widget (Partie 3.2) | 0.5j | Moyen — preuve sociale en continu |
| **P2** | Campagnes Meta/LinkedIn (Partie 4.1) | 2j | Élevé — reciblage visiteurs démo |
| **P2** | A/B test des 3 variantes FOMO | 1j | Optimisation continue |

**Total estimé :** ~8 jours de développement + 2 jours de setup publicitaire

---

## Checklist pré-lancement (7 septembre)

- [ ] Tous les tests QA (Partie 1) passent à 100%
- [ ] Bandeau FOMO actif et mesurable (UTM tracking)
- [ ] Pop-up de sauvegarde testée (email capturé → /signup)
- [ ] Notification fin de crédits testée (10 crédits → toast)
- [ ] Idle timer 20 min testé et fonctionnel
- [ ] Bandeau cookies RGPD actif (consentement avant tout pixel)
- [ ] Meta Pixel configuré (audience visiteurs démo)
- [ ] LinkedIn Insight Tag configuré
- [ ] Campagne Meta Ads créée (2 concepts, budget quotidien)
- [ ] Campagne LinkedIn Ads créée
- [ ] Pages légales (/cookies, /privacy, /legal) rédigées et publiées
- [ ] Quick Share fonctionnel (LinkedIn + Twitter/X)
- [ ] Social Proof Widget testé et dismissible
- [ ] Tunnel Stripe testé (Starter + Agence)
- [ ] Pages de remerciement post-souscription configurées
- [ ] Tracking de conversion activé (GA4 events + Meta conversion API)
- [ ] Emails de bienvenue séquence J0 configurés
- [ ] Documentation interne des identifiants démo mise à jour

---

*Document généré le 16 juillet 2026 — Version 1.0*
*À mettre à jour après chaque sprint d'implémentation.*
