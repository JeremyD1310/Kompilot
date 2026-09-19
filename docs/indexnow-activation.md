# Activation IndexNow

L’intégration technique est volontairement désactivée par défaut. Aucun appel externe n’est effectué tant que `INDEXNOW_ENABLED` n’est pas `true` et qu’une clé valide n’est pas installée.

## Étapes humaines restantes

1. Décider si IndexNow correspond à la stratégie de diffusion de Kompilot.
2. Créer la clé dans le portail du moteur concerné. Kompilot ne crée pas cette clé automatiquement.
3. Stocker la clé dans le coffre de secrets sous `INDEXNOW_KEY` ou dans la variable publique attendue par l’environnement d’exécution.
4. Activer explicitement `INDEXNOW_ENABLED=true` après vérification du domaine `www.kompilot.fr`.
5. Tester une URL publique non sensible avec l’équipe responsable.
6. Vérifier les journaux : seule la quantité d’URLs est journalisée, jamais la clé.

La allowlist exclut les paramètres, les routes privées, les brouillons et les URLs qui ne sont pas sous le domaine officiel.
