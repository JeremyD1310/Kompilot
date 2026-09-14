# Kompilot — plan acquisition social & lancement

**Date de lancement : 7 septembre 2026**  
**Offres : Starter (indépendants/TPE) · Agence (multi-comptes)**

## 1. Qualification des signaux sociaux

### Arbre DM/commentaire

1. **Curieux** — question générale, like, commentaire court. Réponse semi-automatique : répondre publiquement en 2 h, puis DM avec une seule question : « Vous cherchez surtout à gagner du temps ou à piloter plusieurs comptes ? » Tag `curieux`.
2. **Prospect chaud Starter** — indépendant/TPE, douleur opérationnelle, demande de prix ou de démo. Réponse : « Starter centralise vos posts, avis et réseaux dans un cockpit simple. L’accès prend moins de 5 minutes. Je vous envoie l’accès prioritaire ? » Tag `starter_hot`, score 60.
3. **Prospect chaud Agence** — agence, plusieurs clients, reporting ou ROI. Réponse : « L’offre Agence est conçue pour le multi-compte, les rapports client et l’automatisation à l’échelle. Combien de comptes gérez-vous aujourd’hui ? » Tag `agency_hot`, score 75.
4. **Objection** — prix, sécurité, intégrations, IA. Ne pas argumenter en bloc : répondre à l’objection, envoyer une preuve vérifiable ou proposer 15 minutes. Tag `objection_[type]`.
5. **Spam / demande hors cible** — réponse courte, aucun enrichissement CRM. Tag `not_qualified`.

SLA : commentaire < 2 h ouvrées, DM < 4 h, lead natif < 15 min en heures ouvrées. Aucun bot ne promet un résultat chiffré non prouvé.

### Social listening

Surveiller LinkedIn, Meta et X : `outil social media agence`, `reporting client agence`, `gérer plusieurs comptes`, `automatiser réseaux sociaux`, `community manager débordé`, `calendrier éditorial IA`, `répondre aux avis Google`, `alternative [outil concurrent]`, `pilotage multi-comptes`, `ROI social media`, `publications sans inspiration`, `AIO visibilité IA`, `product-to-video`, `netlinking IA`.

Règles : recherche en français + anglais, exclusion des offres d’emploi et contenus sponsorisés, validation humaine avant DM, capture de l’URL et du contexte dans le CRM.

### Réseaux → CRM Kompilot

Chaque événement doit conserver : `platform`, `external_event_id`, `campaign`, `content_id`, `profile_url`, `email`, `consent_at`, `persona`, `lead_score`, `source_status`. Déduplication par `platform + external_event_id`, UTM obligatoires sur tous les liens, attribution `organic`, `paid`, `native_lead_form`, `dm` ou `comment`.

Pipeline : `new_signal → qualified → demo_or_trial → activated → paid → lost`. Synchroniser les formulaires natifs LinkedIn/Meta via webhook backend, journaliser les erreurs, relancer les événements échoués sans doublon.

## 2. Messaging Matrix

| Cible | Promesse | Preuve à produire | CTA |
|---|---|---|---|
| Starter | Reprendre le contrôle de son marketing sans ajouter un outil compliqué | capture produit, tutoriel <5 min, démonstration produit vérifiée | Rejoindre l’accès prioritaire |
| Agence | Piloter plusieurs comptes, automatiser le reporting et rendre le ROI lisible | démo multi-comptes, rapport anonymisé, cas client validé | Demander la démo Agence |

### Angles de contenu

**Starter — LinkedIn**
1. « Votre marketing ne manque pas d’idées, il manque d’un cockpit. » Démontrer une semaine de posts/avis en une vue.
2. « 5 minutes pour préparer sa présence locale. » Capture écran étape par étape.
3. « Ce que l’IA doit faire — et ce qu’elle ne doit jamais décider seule. » Transparence et contrôle humain.

**Starter — TikTok/Meta**
1. Avant/après : tableau dispersé → calendrier Kompilot.
2. POV : « Quand un avis client arrive pendant le rush » → réponse préparée, validation humaine.
3. Démo product-to-video : une fiche produit devient un format court, sans promesse de performance inventée.

**Agence — LinkedIn**
1. « Le reporting ne devrait pas être une production mensuelle. » Montrer le rapport client automatisé.
2. « 3 comptes, 3 marques, un seul cockpit. » Démonstration multi-comptes.
3. « Le vrai coût du multi-compte est la coordination. » Angle ROI : temps économisé, à mesurer chez le client.

**Agence — TikTok/Meta**
1. Écran partagé : brief client → variantes → validation.
2. Coulisses d’un rapport client en 30 secondes.
3. Objection prix : comparer coût d’un workflow manuel, uniquement avec données documentées.

## 3. Profils et tunnel

### Bios avec CTA unique

- **LinkedIn :** « Kompilot — cockpit IA pour posts, avis Google, visibilité locale et pilotage multi-comptes. Accès prioritaire au lancement du 7 septembre 2026 : kompilot.fr »
- **Meta :** « Le cockpit IA des commerçants et agences. Posts, avis, réseaux et visibilité locale au même endroit. Rejoindre l’accès prioritaire ↓ »
- **TikTok :** « Moins d’onglets. Plus de marketing maîtrisé. Starter + Agence. Accès prioritaire ↓ »

Un seul lien tracké par profil, page mobile avec deux choix visibles : `Je suis indépendant/TPE` ou `Je gère une agence`.

### Retargeting J-30 → J-1

1. J-30 à J-15 : audience vidéo 25 %, visiteurs et interactions 30 jours. Contenu preuve produit, fréquence 2–3/semaine.
2. J-14 à J-7 : audience 50 % vidéo + clics sans inscription. Message accès VIP, limitation réelle seulement si la capacité est réellement limitée.
3. J-6 à J-1 : visiteurs pricing, formulaires commencés, DM non convertis. Une objection par créa : prise en main, multi-comptes, sécurité, prix.
4. Exclure les inscrits, clients et personnes ayant demandé à ne plus être contactées. Plafond 2–3 impressions/semaine/utilisateur.

## 4. Calendrier éditorial

| Période | Rythme | Livrables |
|---|---:|---|
| J-30 → J-15 | LinkedIn 3, Meta 3, TikTok 3/semaine | build in public, intégrations Meta/LinkedIn/TikTok, interface minimaliste, sondages douleurs |
| J-14 → J-1 | 1 contenu/jour + retargeting | accès VIP, démos courtes IA, FAQ, comparatif Starter/Agence, live de pré-lancement |
| J0 — 7 sept. | 3 temps forts | annonce officielle, démonstration, ouverture Starter/Agence |
| J+1 → J+7 | 1 contenu/jour + 2 lives | cas express, objections, onboarding public, Q/R, rappel des limites et support |

### Séquence quotidienne de compte à rebours

- J-30 : pourquoi Kompilot existe.
- J-27 : douleur Starter.
- J-24 : douleur Agence.
- J-21 : première capture produit.
- J-18 : intégration Meta.
- J-16 : intégration LinkedIn.
- J-15 : intégration TikTok.
- J-14 : ouverture liste VIP.
- J-12 : démonstration calendrier.
- J-10 : démonstration avis Google.
- J-8 : product-to-video.
- J-7 : comparaison Starter/Agence.
- J-5 : objection sécurité et données.
- J-3 : coulisses onboarding.
- J-2 : rappel accès prioritaire.
- J-1 : « demain » + horaires du live.
- J0 : lancement + CTA unique.
- J+1 : onboarding des premiers comptes.
- J+3 : première objection répondue en public.
- J+5 : étude de cas express avec métriques validées.
- J+7 : bilan de lancement et prochaine Q/R.

## 5. Pilotage hebdomadaire

Dashboard minimal : portée, vues 3 secondes, taux de complétion, clics, CTR, DM qualifiés, leads natifs, taux de qualification, activation à 24 h, conversion Starter/Agence, coût par lead et délai de réponse.

Décisions : doubler un angle seulement après deux semaines de signal convergent ; arrêter une créa après fatigue documentée ; ne jamais confondre portée et demande qualifiée. Les témoignages, chiffres de ROI et logos restent `[À VALIDER]` jusqu’à preuve écrite.
