# Matrice de rétention — Kompilot

| Classe | Données | Durée | Action | Base |
|---|---|---:|---|---|
| `technical_logs` | observability_logs | 90 jours | Suppression | Limitation de conservation |
| `security_audit` | user_activity_logs | 365 jours | Anonymisation | Intérêt légitime / sécurité |
| `integration_audit` | ad_connection_events, ad_sync_runs, metric_sync_log | 365 jours | Suppression | Limitation de conservation |
| `product_notifications` | notifications_queue | 90 jours | Suppression | Limitation de conservation |
| `attribution` | attribution_touchpoints, conversion_events | 730 jours | Anonymisation/purge | Consentement et mesure |
| `rgpd_proof` | privacy_requests | 5 ans | Conservation minimale | Obligation légale |
| `billing_legal` | legal_signatures, compliance_consent_log, stripe_webhook_events | Selon obligation comptable et défense en justice | Conservation restreinte et minimisée | Obligation légale |
| `oauth_secrets` | tokens d’accès et de renouvellement | Jusqu’à déconnexion, révocation ou effacement | Suppression immédiate/chiffrement | Contrat et sécurité |

## Règles

1. Les dates sont évaluées en UTC côté backend.
2. Une donnée nécessaire à une obligation légale ne doit pas être supprimée avec les données produit.
3. L’effacement utilisateur supprime les données opérationnelles et conserve uniquement une preuve RGPD minimale, pseudonymisée si possible.
4. Toute purge produit un résumé dans `operations_reviews` sans contenu client.
5. Un échec de purge est marqué `failed` et doit être repris; il ne doit pas être masqué par un succès global.
