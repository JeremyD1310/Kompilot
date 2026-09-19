# Kompilot — recette externe avant commercialisation

Date : 19 septembre 2026  
Branche de correction : `codex/prelaunch-remediation-batch-1`  
Branche Blink synchronisée : `release/kompilot-commercial-launch`

Ce document distingue les contrôles de code déjà automatisables des preuves qui nécessitent Blink, Stripe Test, les comptes fournisseurs et une recette humaine. Aucun test ne doit utiliser Stripe Live.

## 1. Blink et nouveau backend

- Confirmer dans Blink que le projet cible est `kompilot-ai-suite-xxifv5sr` et non l'ancien projet `presence-manager-saas-gbrhsehk`.
- Confirmer le commit exact affiché pour `release/kompilot-commercial-launch` après intégration contrôlée du lot.
- Configurer explicitement `VITE_BACKEND_URL`, `BACKEND_URL`, `VITE_BLINK_PROJECT_ID`, `BLINK_PROJECT_ID` et les secrets requis dans le coffre Blink.
- Déployer le backend cible, puis vérifier `GET /health` et une route authentifiée.
- Appliquer `backend/migrations/002_dashboard_state.sql` sur la base cible et vérifier les tables et index créés.
- Tester avec deux utilisateurs et deux établissements distincts afin de prouver l'isolation des données.

## 2. Stripe Test uniquement

Préconditions : `LIVE_BILLING_ENABLED=false`, clés Test séparées, webhook Test pointant vers le nouveau backend, secret de signature stocké côté serveur et portail client Test configuré.

Scénarios obligatoires :

1. abonnement mensuel réussi ;
2. abonnement annuel réussi ;
3. paiement refusé ;
4. authentification 3DS ;
5. rejeu du même webhook sans double crédit ni double abonnement ;
6. renouvellement ;
7. facture échouée et reprise ;
8. changement d'offre ;
9. annulation via le portail ;
10. vérification `customer_id → subscription_id → user` ;
11. vérification du consentement légal transmis au checkout ;
12. vérification de la TVA avec une inscription Stripe Tax Test active. L'activation de `automatic_tax` seule ne prouve pas la collecte.

Ne jamais activer Stripe Live avant validation humaine distincte.

## 3. Connexions réelles

Pour Google Business, Meta/Facebook, Instagram, LinkedIn, TikTok et YouTube :

- démarrer depuis Kompilot ;
- vérifier la présence et l'expiration du paramètre OAuth `state` ;
- accepter puis revenir sur le callback du nouveau backend ;
- vérifier le statut connecté et le périmètre réellement accordé ;
- réaliser une lecture non destructive ;
- déconnecter et confirmer la révocation ;
- vérifier qu'aucun mot de passe n'est demandé, journalisé ou stocké ;
- vérifier que les jetons restent chiffrés côté serveur.

Pour GA4 et GSC : vérifier la propriété sélectionnée, les permissions minimales, une lecture réelle, la déconnexion et l'absence d'email, de nom ou d'identifiant personnel dans les événements GA4.

## 4. SEO et GA4

- Contrôler les fichiers HTML générés pour `/`, `/pricing`, `/signup`, `/features`, `/local`, `/faq` et chaque page sectorielle.
- Vérifier titre, description, canonical, H1, contenu visible sans JavaScript et JSON-LD propre à la route.
- Refuser `aggregateRating`, `SearchAction` et toute preuve ou métrique non vérifiable.
- Vérifier le tunnel GA4 de `landing_view` à `purchase` après consentement, puis vérifier qu'aucun événement ne part après refus.

## 5. Recette humaine commerciale et démo

Matrice : Chrome, Safari et Firefox sur ordinateur ; Safari iOS et Chrome Android sur mobile.

- landing, navigation, tarifs, inscription, connexion et récupération de mot de passe ;
- onboarding, dashboard, états vides, chargement et erreurs réseau ;
- parcours `/demo` vers `/demo/workspace`, tous les hubs, reset et CTA de sortie ;
- preuve que la démo ne contacte aucun fournisseur externe ;
- contraste, clavier, focus, fermeture des modales et zones tactiles ;
- aucune donnée fictive présentée comme réelle ;
- aucune publication, réponse, invitation, campagne ou email sans état `Validé`.

## 6. Checker TypeScript Blink

La suppression de `baseUrl` doit d'abord être intégrée dans la branche synchronisée après validation de la PR. Ensuite :

1. relever le SHA exact affiché par Blink ;
2. lancer le checker complet ;
3. exporter la sortie intégrale sans la résumer ;
4. comparer au contrôle GitHub sur le même SHA ;
5. classer les erreurs par code et fichier ;
6. conserver séparément l'exception documentée `strictNullChecks` ;
7. corriger uniquement les diagnostics reproductibles, par lots fonctionnels avec tests ciblés.
