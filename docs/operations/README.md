# Opérations Kompilot

- `gdpr-processing-register.md` — registre RGPD des traitements.
- `retention-matrix.md` — durées, bases légales et actions de conservation.
- `stability-report-2026-09-04.md` — état de stabilité et changelog de la release opérations.

## Revues

Les revues quotidiennes et hebdomadaires sont générées via `GET /api/operations/overview` (accès administration). Elles couvrent :

- erreurs et dead-letter Blink Queue ;
- échecs et tokens publicitaires déconnectés ;
- demandes RGPD en échec ;
- volume de données non attribuées ;
- logs critiques corrélés ;
- fraîcheur des synchronisations.

Le rapport est enregistré dans `operations_reviews` avec un identifiant de corrélation. Aucun contenu de prospect, message, token ou payload fournisseur complet n’est inclus.
