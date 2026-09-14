# Rapport de stabilité — Kompilot

**Date :** 4 septembre 2026  
**Version :** release-2026.09.04-ops  
**Périmètre :** RGPD, rétention, connexions publicitaires, synchronisations, queues, attribution et observabilité.

## Résumé

Le socle opérationnel a été renforcé autour de quatre principes : cloisonnement par utilisateur et organisation, traçabilité corrélée, minimisation des données, et reprise contrôlée des erreurs fournisseur.

## État des contrôles

| Domaine | État | Note |
|---|---|---|
| Registre des traitements RGPD | Finalisé | Compte, publicité, attribution, support et demandes de droits sont décrits dans `gdpr_processing_register`. |
| Matrice de rétention | Finalisée | Logs techniques 90 jours, audit sécurité 365 jours, attribution 730 jours, preuve RGPD 5 ans. |
| Effacement | Renforcé | Les connexions publicitaires, métriques et données opérationnelles sont incluses dans le périmètre d’effacement auditable. |
| Isolation publicitaire | Renforcée | Les connexions sont recherchées avec `organizationId + userId + provider`. |
| Synchronisations | Traçables | Chaque exécution utilise `ad_sync_runs`, un statut et une corrélation. |
| Pagination | Contrôlée | Meta et Google suivent les pages avec un plafond explicite et un statut partiel en cas de troncature. |
| Retry / dead-letter | Actif | Les erreurs transitoires sont rejouées avec backoff; les erreurs permanentes restent identifiables. |
| Données non attribuées | Analysées | Le revenu sans touchpoint exploitable est présenté séparément, jamais redistribué artificiellement. |
| Logs | Corrélés | `correlationId`, `runId`, `taskId`, fournisseur et organisation sont propagés sans secrets. |

## Google Ads

Le flux utilise le Customer ID et le Developer Token côté backend. Le secret `GADS_DEVELOPER_TOKEN` doit être présent avant toute synchronisation réelle. Les erreurs d’authentification et de quota sont distinguées des erreurs de données.

## Revues récurrentes

- **Quotidienne :** tâches `failed/dead`, erreurs de sync, tokens expirés/révoqués, 429 fournisseur, échecs RGPD et latence des queues.
- **Hebdomadaire :** demandes RGPD, taux d’effacement terminé, rétention appliquée, volume non attribué, fraîcheur des données et comptes déconnectés.
- **À chaque release :** vérifier que les tâches planifiées ont un `taskName` correspondant exactement à un handler.

## Limites connues

- Les appels réels Meta/Google ne peuvent pas être validés sans compte publicitaire autorisé et secret développeur actif.
- La rétention automatique doit être déclenchée par un schedule dédié après déploiement du handler correspondant.
- Les historiques légaux et de facturation restent soumis aux obligations de conservation et ne doivent pas être supprimés comme des données produit ordinaires.

## Changelog

### release-2026.09.04-ops

- Ajout du registre RGPD structuré.
- Ajout de la matrice de rétention versionnée.
- Ajout du registre des demandes de droits.
- Ajout de `ad_oauth_states` pour empêcher la réutilisation d’un state OAuth.
- Ajout des champs de corrélation et d’erreur sur les synchronisations et événements publicitaires.
- Ajout d’un client provider avec retry, backoff, jitter et support `Retry-After`.
- Ajout de l’analyse explicite des revenus non attribués.
