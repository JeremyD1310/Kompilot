# Revue de securite de la base Blink

Etat observe pour les tables Blink utilisees par l'onboarding :

```text
db.require_auth=false
row-level mode=none
owner field=user_id
raw SQL client=false
aucune FK
aucune RLS active
```

La separation entre utilisateurs repose actuellement sur le code applicatif et les filtres `userId`. Il n'existe pas de garantie SQL/RLS demontrée dans ce depot.

## Blocages commerciaux

- Une lecture inter-utilisateurs est potentiellement possible si une route oublie le filtre `userId`.
- Une ecriture inter-utilisateurs est potentiellement possible si une route accepte un identifiant non verifie.
- L'absence de garantie serveur/RLS rend l'isolation dependante de chaque route.
- Les tables d'onboarding et d'etablissements n'ont pas de relation SQL formelle demontree avec `users.id`.

## Etape suivante Blink

Depuis l'outil Blink, avec sauvegarde et validation humaine :

1. Activer l'authentification DB.
2. Activer une protection par proprietaire `user_id` si elle est compatible avec Blink.
3. Auditer toutes les routes qui lisent ou ecrivent ces tables.
4. Tester les acces croises entre deux utilisateurs synthetiques.
5. Confirmer que les operations administrateur utilisent une autorite serveur, jamais des metadonnees client.

Aucune configuration Blink n'a ete modifiee depuis Codespaces et aucune migration n'a ete executee sur la base distante dans cette intervention.
