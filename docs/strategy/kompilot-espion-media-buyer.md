# Kompilot Espion — spécification media buyer

## Contrat de vérité

- `active_ads` : la source de veille a répondu avec au moins une publicité active.
- `no_active_ads` : la source a répondu correctement avec zéro publicité active. Ce n'est pas un scan raté.
- `scan_inconclusive` : token manquant, timeout, réponse API invalide, plateforme non connectée ou pays/compte non couvert. Ne jamais afficher « marque sans pub active ».
- La confiance source provient de la réponse de la source, pas d'une supposition IA.

## Rapport standard

Chaque rapport expose les 8 axes : bénéfices, preuves, problème ciblé, USP, pricing/offre, fonctionnement produit, arguments et marque. Les champs media buyer complémentaires sont : format, evergreen, framework copywriting, hook 3 secondes, audio, funnel, scaling, saturation, itérations, maturité et recommandations.

## Formats et créas

Les catégories disponibles sont UGC, motion design, démo produit, avant/après, témoignage, carousel, image et vidéo. Une créa n'est pas déclarée « gagnante » sur le seul score IA : la longévité, la présence active et les variantes doivent être observables ou déclarées « non détectées ».

## Historique et benchmark

- Historique d'itérations par `advertiserName`, trié par date.
- Benchmark par plateforme dans la bibliothèque de rapports de l'utilisateur.
- Le percentile est un repère interne, jamais une moyenne de marché présentée comme vérité externe.

## Workflow

1. Saisir marque, plateforme, URL et texte disponible.
2. Interroger la source native quand elle est connectée.
3. Enrichir le prompt IA avec les données source et leur niveau de confiance.
4. Générer le rapport structuré.
5. Sauvegarder dans la bibliothèque et proposer export CSV / Swipe File.
6. Reprendre les scans bloqués via heartbeat + bouton de reprise.

## Limites à afficher

Les snapshots et assets externes sont ouverts dans un nouvel onglet si l'URL source les autorise. Kompilot ne doit pas promettre le téléchargement d'un asset quand la plateforme ne fournit qu'une URL de prévisualisation. La transcription audio nécessite un fichier ou une URL audio/vidéo effectivement accessible ; sinon afficher « non détecté ».
