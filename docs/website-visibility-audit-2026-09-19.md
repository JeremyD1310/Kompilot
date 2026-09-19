# Audit de visibilité Web & IA

## Périmètre livré

- analyse backend authentifiée de pages publiques uniquement ;
- URL, port, identifiants intégrés, IP et réseaux privés refusés ;
- résolution DNS A/AAAA préalable et refus d'une réponse privée ;
- redirections manuelles, limitées et restreintes à l'origine validée ;
- `robots.txt`, huit pages maximum, profondeur un, 750 Ko et dix secondes par page ;
- scores déterministes : technique, contenu, local, confiance et GEO/IA ;
- constat, preuve, impact, recommandation, priorité et effort pour chaque anomalie ;
- persistance isolée par `user_id` après application manuelle de la migration 003 ;
- aucune publication ou modification automatique du site analysé.

## Routes

- `POST /api/geo/website-audit`
- `GET /api/geo/website-audits`
- `PATCH /api/geo/website-audits/:auditId/findings/:findingId`

Le POST exige un jeton Blink valide et `authorizationConfirmed: true`.

## Migration

`backend/migrations/003_website_visibility_audits.sql` ne doit pas être exécutée
automatiquement. Sauvegarder la base, contrôler `sqlite_master`, appliquer le
fichier dans « Kompilot - Commercial Release », puis vérifier les trois tables
et leurs index. Sans migration, l'audit ponctuel fonctionne avec
`persisted: false`, mais l'historique et les statuts restent indisponibles.

## Limites explicites

- aucune mesure Core Web Vitals de laboratoire ou de terrain ;
- aucun contournement d'authentification, formulaire ou espace privé ;
- aucun classement Google, trafic, revenu ou citation par une IA estimé ;
- la validation DNS réduit le risque SSRF mais ne constitue pas une garantie
  absolue contre un changement DNS entre validation et connexion ;
- les recommandations restent soumises à validation humaine.

## Recette Blink requise

1. confirmer le workspace, la branche et le SHA synchronisé ;
2. appliquer la migration 003 après sauvegarde et validation humaine ;
3. tester un domaine autorisé et un domaine bloqué ;
4. vérifier l'isolation avec deux comptes approuvés ;
5. vérifier les formats desktop, 768, 390 et 375 px ;
6. confirmer qu'aucune donnée d'audit n'est envoyée à GA4 ;
7. conserver `LIVE_BILLING_ENABLED=false`.
