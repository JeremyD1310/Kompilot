# Kompilot — état directeur avant commercialisation

Date de contrôle : 18 septembre 2026  
Branche contrôlée : `release/kompilot-commercial-launch`  
Commit contrôlé : `b16c07ab813fd7b19941879c0395f9c0c43f2241`

## Verdict

La base applicative est testable et la démonstration a été simplifiée, mais la commercialisation ne doit pas encore être déclarée totalement ouverte. Les derniers contrôles automatisés sont verts sur GitHub, tandis que les preuves d'intégration réelles Blink/Stripe et plusieurs points de sécurité/configuration restent à fermer.

Règles de conduite maintenues :

- aucune fusion ni mise en production sans validation humaine ;
- `LIVE_BILLING_ENABLED=false` jusqu'à validation de tous les jalons de paiement ;
- aucune publication, réponse, invitation, email ou action externe sans validation humaine ;
- aucune correction TypeScript mécanique : diagnostic puis correction ciblée ;
- les données de démonstration restent fictives, isolées et explicitement signalées.

## État des phases 1 à 4

| Phase | État | Acquis | Reste à fermer |
| --- | --- | --- | --- |
| 1 — Comprendre Kompilot | Avancée | Offre, positionnement B2B hybride, cibles, personas, arguments et objectifs déjà structurés | Réconcilier définitivement les promesses commerciales avec les fonctionnalités réellement prouvées et les trois offres Pro/Multi/Agency |
| 2 — Acquisition | Avancée | Base SEO/GA4 fusionnée, pages sectorielles et maillage engagés, stratégie GEO et réseaux sociaux documentée | Vérifier le rendu SEO par route en production, supprimer les données structurées non prouvées, valider indexation/GSC et construire les preuves GEO/clients |
| 3 — Prospection | Réalisée côté méthode | Pipeline 34 champs, scoring, sourcing, messages, relances, qualification et suivi RDV | Alimenter davantage le fichier avec PME/commerces à signaux clairs et contrôler les premiers taux de conversion réels |
| 4 — Automatisation | Encadrée | Agents, reporting et scénarios d'automatisation définis ; fonctionnement en brouillons et validation humaine | Prouver les connexions Gmail/Sheets/Calendar en environnement réel, surveiller les erreurs et conserver les validations obligatoires |

## Preuves techniques obtenues

- Le dépôt GitHub `JeremyD1310/Kompilot` est accessible et la branche de release est synchronisée.
- Le dernier pipeline GitHub du commit contrôlé est vert, y compris la matrice Playwright.
- Tests backend/unitaires locaux : 71 réussis, 0 échec.
- Build de production local : réussi.
- ESLint : 0 erreur bloquante, mais de nombreux avertissements, dont plusieurs règles React Hooks à traiter comme risques fonctionnels potentiels.
- TypeScript : uniquement l'exception documentée liée à `strictNullChecks`; cette dette doit être planifiée après le lancement, sans correction aveugle.
- L'exécution Playwright locale n'est pas une preuve exploitable faute de binaire Chromium local ; la preuve retenue est le pipeline GitHub vert.

## Blocages P0 avant facturation réelle

1. Appliquer puis vérifier la migration Blink `backend/migrations/002_dashboard_state.sql` sur le bon projet.
2. Configurer explicitement `VITE_BACKEND_URL` et `BACKEND_URL`, déployer le nouveau backend et vérifier son endpoint de santé.
3. Retirer l'ultime référence d'exécution à l'ancien backend dans `public/kompilot-tracker.js` et confirmer un scan runtime à zéro.
4. Configurer un webhook Stripe **Test** sur le nouveau backend et prouver signature, rejeu et idempotence.
5. Configurer le portail client Stripe en Test.
6. Exécuter les scénarios Stripe Test : paiement réussi, refusé, 3DS, renouvellement, facture échouée, annulation et portail.
7. Confirmer juridiquement le traitement TVA/Stripe Tax avant toute activation Live.
8. Garder `LIVE_BILLING_ENABLED=false` jusqu'à validation humaine des points précédents.

## Risques P1 produit, sécurité et expérience

- Des clés Mailchimp et SendGrid sont encore écrites dans `localStorage` par `EmailMarketingPage`; elles doivent être révoquées si elles ont été utilisées puis remplacées par une connexion serveur/OAuth ou un secret chiffré côté serveur.
- Plusieurs avertissements ESLint indiquent des Hooks appelés conditionnellement ou dans un callback. Ils peuvent produire des erreurs de rendu selon le parcours et doivent être corrigés avec tests ciblés.
- Le bundle principal produit approche 2,94 Mo minifié (environ 793 Ko gzip) : impact possible sur le chargement mobile et la conversion.
- Les KPI du tableau de bord doivent toujours afficher leur source, leur établissement et leur date de dernière synchronisation.
- Les dismissals/snoozes du tableau de bord doivent être persistés côté serveur pour les utilisateurs authentifiés.
- Les identifiants et mots de passe des réseaux sociaux ne doivent jamais être demandés ni stockés par Kompilot. Les connexions doivent utiliser OAuth et des jetons révocables stockés côté serveur de manière chiffrée.

## SEO, GEO et GA4

### Priorités déjà engagées

- consentement GA4 et conversions ;
- pages sectorielles ;
- sitemap, robots et liens internes ;
- suivi séparé depuis le 7 septembre 2026 ;
- visibilité ChatGPT, Gemini et Perplexity dans le périmètre GEO.

### Contrôles restants

1. Vérifier que `/`, `/pricing`, `/signup`, les pages sectorielles et comparatives possèdent un rendu HTML distinct côté serveur ou au build, pas uniquement des métadonnées injectées dans le navigateur.
2. Supprimer toute note, `aggregateRating`, preuve ou résultat chiffré non vérifiable.
3. Confirmer dans GSC les cinq pages non indexées, leur cause et leur état après correction.
4. Valider les événements du tunnel : `landing_view`, `primary_cta_click`, `signup_start`, `sign_up`, `onboarding_start`, `source_connected`, `first_value_created`, `first_value_approved`, `trial_start`, `checkout_start`, `purchase`.
5. Tester que les événements GA4 ne contiennent ni email, ni nom, ni donnée personnelle.
6. Ajouter à l'analyse GEO du site client : audit technique, contenu, entités, preuves, citations, données structurées, accessibilité aux robots IA, recommandations priorisées et suivi avant/après.

## Version démo

Le parcours canonique est `/demo` vers `/demo/workspace`. Les anciennes routes doivent uniquement rediriger vers ce parcours. La démo doit conserver :

- quatre profils compréhensibles ;
- des données fictives clairement signalées ;
- aucune connexion ni action vers un service externe ;
- un bouton de réinitialisation ;
- un CTA unique vers la création d'un espace réel ;
- uniquement des événements de tunnel locaux et anonymes.

## Ordre d'exécution recommandé

1. Fermer la configuration backend et l'ancienne URL runtime.
2. Appliquer/contrôler la migration Blink et tester deux comptes distincts.
3. Réaliser la recette Stripe Test complète sans toucher au Live.
4. Corriger les risques React Hooks puis rejouer les tests ciblés et la matrice CI.
5. Vérifier le rendu SEO de chaque route et les événements GA4 sans données personnelles.
6. Tester les connexions Google Business, Meta, Instagram, LinkedIn, TikTok, YouTube, GA4 et GSC avec révocation/déconnexion.
7. Effectuer une recette humaine mobile/desktop de la landing, de la démo, de l'inscription, de l'onboarding et du tableau de bord.
8. Obtenir la validation humaine finale avant fusion de la branche de release ou activation de la facturation.
