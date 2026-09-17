# Migrations Blink

Ces migrations ciblent SQLite 3.47.0 via Turso/Blink. Blink ne fournit pas de runner automatique dans ce dépôt : elles sont appliquees manuellement avec l'outil SQL Blink, apres validation humaine.

## Procedure avant application

1. Effectuer une sauvegarde de la base avant toute execution.
2. Inspecter `sqlite_master` pour confirmer l'absence des tables et index attendus.
3. Verifier les colonnes existantes avec `pragma_table_info('establishments')` et `pragma_table_info('onboarding_profiles')`.
4. Verifier les index avec `pragma_index_list('establishments')` et `pragma_index_list('onboarding_profiles')`.
5. Creer les tables avant leurs index.
6. Executer uniquement la migration correspondant au schema audite.

La migration `001_create_establishments_and_onboarding_profiles.sql` utilise `CREATE TABLE IF NOT EXISTS` et `CREATE INDEX IF NOT EXISTS`. Elle cree les tables uniquement lorsqu'elles sont absentes et ne reconcilie pas automatiquement une table deja existante mais partiellement definie. Aucune suppression de table ou de colonne n'est effectuee.

Le backend n'execute pas automatiquement ces migrations. Cette migration n'a pas ete executee depuis Codespaces.

## Verification apres application

Relancer `sqlite_master`, `pragma_table_info` et `pragma_index_list`, puis comparer les noms, types, valeurs par defaut et index avec le fichier SQL. Verifier aussi qu'aucune table ou colonne existante n'a ete supprimee.

Le rollback est limite a la suppression des index nouvellement crees, apres verification de leur origine. La suppression d'une table ou d'une colonne n'est pas un rollback autorise par cette procedure.
