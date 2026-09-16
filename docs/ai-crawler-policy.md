# Politique des robots et moteurs IA

Ce document distingue la recherche web, la citation dans les moteurs de réponse et l’utilisation éventuelle des pages pour l’entraînement. Kompilot n’effectue aucune décision automatique pour les robots d’entraînement.

## Robots de recherche et de citation

- **Googlebot** : robot principal de recherche Google. Les pages publiques sont autorisées.
- **Bingbot** : robot de recherche Bing. Les pages publiques sont autorisées.
- **OAI-SearchBot** : robot utilisé pour la recherche et la citation dans les expériences de recherche OpenAI. Les pages publiques sont autorisées.
- **ChatGPT-User** : agent qui peut accéder à une page à la demande d’un utilisateur. Les pages publiques sont autorisées.

## Robots liés à l’entraînement

- **Google-Extended** : contrôle distinct pour certains usages d’entraînement et d’amélioration des modèles Google. La configuration actuelle ne prend pas de décision implicite : toute modification doit être validée par Jérémy.
- **GPTBot** : robot associé à la collecte potentielle de données d’entraînement OpenAI. Son accès doit faire l’objet d’une décision commerciale explicite.
- **ClaudeBot** : robot associé aux usages d’Anthropic qui peuvent inclure la collecte de contenu. Son accès doit également être décidé explicitement.

Autoriser l’entraînement peut augmenter la disponibilité du contenu dans des corpus futurs, mais signifie accepter une réutilisation du contenu au-delà de la simple citation. Le refuser limite cette réutilisation sans empêcher nécessairement les accès de recherche ou à la demande lorsque les règles du robot les distinguent. Aucune modification ne doit être faite sans validation humaine.
