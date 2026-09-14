# Registre RGPD — Kompilot

Le registre opérationnel canonique est stocké dans `gdpr_processing_register`.

| Traitement | Finalité | Base légale | Catégories | Destinataires | Conservation |
|---|---|---|---|---|---|
| Gestion du compte et authentification | Création, accès et sécurité du compte | Contrat | Identité, email, authentification | Blink et sous-traitants d’authentification | Durée du compte puis suppression/anonymisation |
| Connexions publicitaires | Synchronisation des campagnes et performances | Contrat | Tokens chiffrés, IDs externes, métriques | Meta, Google Ads | Tokens jusqu’à déconnexion; métriques techniques 365 jours |
| Attribution et conversion | Mesure des sources et conversions | Consentement | UTM, touchpoints, événements, revenus | Kompilot | 730 jours puis anonymisation/purge |
| Support et observabilité | Détection et résolution des incidents | Intérêt légitime | Route, statut, erreur, corrélation, user-agent tronqué | Kompilot | Logs techniques 90 jours; audit sécurité 365 jours |
| Demandes de droits | Preuve du traitement des exports/effacements | Obligation légale | Type, statut, dates, preuve minimale | Kompilot/DPO | 5 ans, sans contenu métier |

## Principes d’exécution

- Minimisation : jamais de tokens, codes OAuth, messages complets ou prospects dans les logs.
- Isolation : toutes les données produit sont filtrées par `userId`; les données publicitaires partagées utilisent `organizationId + userId`.
- Transparence : l’utilisateur peut exporter ses données et demander leur effacement depuis son espace.
- Réversibilité : les consentements marketing peuvent être retirés; le retrait stoppe les finalités concernées.
- Traçabilité : chaque demande de droit reçoit un identifiant et un `correlationId`.
