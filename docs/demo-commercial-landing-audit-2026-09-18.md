# Audit démo, produit commercial et landing — 18 septembre 2026

## Périmètre

Audit du parcours public, de la démonstration et des principales destinations du tableau de bord commercial. Les changements de ce lot ne déploient pas l'application et ne modifient ni Stripe, ni la base Blink, ni le domaine.

## Démonstration

### Décisions appliquées

- un seul point d'entrée : `/demo` ;
- un seul espace interactif : `/demo/workspace` ;
- redirection de l'ancien `/demo/onboarding` vers `/demo/workspace` ;
- redirection de l'ancien `/showcase` vers `/demo` ;
- choix de profil limité à quatre cas compréhensibles ;
- suppression de la longue vitrine historique et de ses métriques non mesurées ;
- séparation explicite entre données de démonstration et données client ;
- CTA de sortie unique vers la création d'un espace réel.

### Résultat attendu

Le visiteur comprend qu'il explore des données fictives, choisit un contexte, puis accède directement au cockpit de démonstration sans doublon ni étape concurrente.

## Version commercialisable

### Corrections appliquées

- les niveaux `pro`, `multi` et `agency` utilisent leurs libellés fonctionnels réels dans la facturation ;
- aucune facture locale fictive n'est affichée ;
- aucun faux numéro de facture, SIRET ou numéro de TVA n'est présenté ;
- aucune carte bancaire 4242 n'est affichée comme moyen de paiement actif ;
- aucun formulaire local ne prétend mettre à jour Stripe ;
- moyens de paiement, factures et annulation restent gérés par le portail Stripe sécurisé ;
- l'intervalle mensuel/annuel choisi sur la landing est conservé jusqu'au parcours d'inscription.

### Points restant à prouver avant lancement

1. appliquer et vérifier la migration Blink `backend/migrations/002_dashboard_state.sql` ;
2. exécuter une recette Stripe Test réelle : mensuel, annuel, webhook, portail, facture et annulation ;
3. valider les parcours authentifiés avec deux comptes distincts ;
4. conserver la décision documentée concernant `strictNullChecks`, puis planifier son activation après lancement.

## Landing page et navigation

### Contrôles ajoutés

- rendu de 23 routes publiques ;
- présence des ancres de navigation de la landing ;
- CTA principal vers `/signup` ;
- CTA de démonstration vers `/demo`, puis `/demo/workspace` ;
- conservation du plan et de l'intervalle annuel jusqu'à l'inscription ;
- rendu des 29 destinations actives de la barre latérale commerciale ;
- détection des écrans d'erreur globaux et des retours involontaires au login.

### Limite de validation

Le navigateur Chromium local n'était pas téléchargeable depuis l'environnement de travail. La campagne Playwright GitHub Actions, qui installe Chromium, est donc la preuve finale de navigation de ce lot.

## Critères de lancement

| Domaine | Critère |
| --- | --- |
| Démo | parcours unique, données signalées comme fictives, aucune promesse non mesurée |
| Landing | routes, ancres, CTA et redirections vérifiés par E2E |
| Commercial | aucune donnée de facturation simulée présentée comme réelle |
| Base Blink | migration distante appliquée et contrôlée |
| Stripe | recette Test complète validée |
| CI | TypeScript selon exception documentée, ESLint, tests, E2E et build verts |

