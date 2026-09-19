# Simplification produit et fiabilisation — audit ciblé

Date : 2026-09-19  
Branche auditée : `feat/website-visibility-audit` (empilée sur la release commerciale)

## 1. Campagnes Meta et TikTok

### État vérifié

- `src/pages/LocalAdsCenterPage.tsx` et `src/components/ads/LocalAdsModal.tsx` exposent un parcours local largement simulé (objectif, budget, rayon, résultats estimés).
- `src/components/ads/TargetedAdCampaignForm.tsx` expose le ciblage avancé et crée des brouillons via `/api/ad-campaigns`; le composant n'a aucun import actif détecté.
- `backend/routes/adCampaigns.ts` conserve les brouillons mais refuse le lancement fournisseur (`PROVIDER_API_NOT_CONFIGURED`).
- `backend/routes/metaCampaignExport.ts` et `backend/lib/metaMarketingService.ts` savent réellement créer une campagne Meta et un ad set en pause.
- `backend/routes/tikTokAds.ts` et `src/components/ads/TikTokAdsPanel.tsx` sont essentiellement en lecture; aucun lancement TikTok complet n'est implémenté.
- Aucun couplage direct avec le catalogue Stripe, les Price IDs ou les routes de facturation n'a été trouvé dans ces fichiers.

### Proposition — arbitrage requis avant code métier

Créer un flux partagé `BoostPostFlow` avec seulement : publication existante, budget, durée et zone issue de l'établissement. L'objectif serait dérivé côté serveur (`engagement` par défaut, `traffic` si le post porte une URL). Conserver séparément les connexions fournisseur et les écrans de résultats.

Ampleur : moyenne à élevée. Il faut un contrat backend canonique, un adaptateur Meta, un adaptateur TikTok réellement capable de lancer, la persistance de l'identifiant du post et des tests de permissions/quotas. Le retrait des écrans avancés ne doit intervenir qu'après validation du nouveau flux. Stripe n'est pas un bloqueur direct, mais les éventuels crédits/quotas publicitaires doivent être explicitement décidés avant lancement.

## 2. Équipe et RBAC

### État vérifié

- `TeamPage` contient membres, rôles, invitations, `TeamChat` et activité, mais n'est reliée à aucune route active.
- `/mon-equipe` ouvre `MonEquipePage`, qui représente les agents IA et non les membres humains.
- La navigation `/mon-equipe` affiche pourtant « Membres · Chat · Activité » : incohérence confirmée.
- `team_members` encode les rôles d'espace (`owner`, `admin`, `editor`, `member`, `guest`, `viewer`) mais pas le palier commercial.
- Le backend équipe contrôle le rôle du membre, pas une entitlement Agency. Un masquage frontend via `SubscriptionContext.currentPlan` ne suffirait pas à sécuriser l'accès.
- `TeamPage` transmet actuellement `canManage=true` aux cartes; le backend reste protecteur, mais l'interface est trompeuse.

### Arbitrages requis

1. Choisir une route canonique pour l'équipe humaine (`/equipe` conseillé) ou remplacer la sémantique actuelle de `/mon-equipe`.
2. Ajouter une vérification serveur du palier Agency depuis la source de facturation canonique avant d'activer route et API.
3. Après ce choix : retirer `TeamChat`, filtrer le fil sur `member_joined`, `member_removed`, `role_changed` et `plan_changed`, puis corriger le sous-titre.

## 3. GEO/AIO et avis Google

- L'audit réel `GEOCitationAudit` dispose déjà des réponses, citations, URLs, profils de sources et d'une méthodologie. La justification du taux de citation est donc disponible et affichée.
- `AIOPage`, `GeoCitationScoreWidget` et plusieurs cartes historiques contiennent encore des scores ou réponses simulés. Ils ne doivent pas être présentés comme des mesures réelles hors démo.
- Un endpoint et un bouton de signalement humain ont été ajoutés pour le rapport réel. La migration `004_geo_score_feedback.sql` reste volontairement non appliquée.
- La synchronisation Google Business est manuelle : `POST /api/gbp/reviews-sync`. Aucun webhook ni ordonnanceur de polling n'est présent.
- Passer en quasi-temps réel nécessite un ordonnanceur sécurisé, un curseur/idempotence par établissement, une table canonique d'avis (note, réponse, identifiants location/review, dates), alertes et observabilité. L'API Google Business utilisée ici ne fournit pas dans ce dépôt un webhook d'avis prêt à brancher; ne pas annoncer une migration « webhook » sans valider le fournisseur et l'infrastructure.
- Le stockage actuel dans `messages` surcharge `is_starred` pour plusieurs sens et ne conserve pas proprement tous les champs nécessaires. Une priorité fiable des avis négatifs non répondus doit attendre la table canonique; les écrans de démonstration ont déjà des marqueurs visuels mais ne constituent pas une preuve de production.

## 4. Contexts React

Le pilote `ObsidianThemeContext` + `DarkModeContext` est déjà fusionné dans la PR de simplification. Les candidats naturels à un store Zustand, car non dépendants d'un scope React particulier, sont : préférences de notification, notifications locales, statut d'intégration, file de garde-fous, réglages d'alertes, mode éco, rôles UI et préférences de marque. À conserver comme contexts pour l'instant : établissement actif, abonnement/crédits, données de démo, profil utilisateur et providers dépendant explicitement d'un parent.

Migration recommandée par petits lots : préférences persistées, puis états transverses sans I/O, puis états synchronisés serveur. Mesurer les re-renders avant/après; ne pas fusionner des domaines métier seulement pour réduire le nombre brut de providers.

## 5. Affiliation et parrainage — inventaire uniquement

Deux systèmes se chevauchent actuellement :

### Affiliation agence

- Backend : `backend/routes/affiliates.ts`
- UI : `src/pages/AffiliateDashboardPage.tsx`, `src/components/agency/AgencyAffiliateDashboard.tsx`
- Landing : `src/pages/AgencyAffiliateLandingPage.tsx`
- Tables référencées : `affiliates`, `affiliate_clicks`
- API : `/api/affiliates/register`, `/stats`, `/history`, `/resolve/:code`, `/track-click`, `/convert`

### Parrainage client / fidélité

- Backend : `backend/routes/referralRewards.ts`
- UI : `src/pages/ReferralPage.tsx`, `src/pages/ReferralLandingPage.tsx`
- Hooks : `src/hooks/useReferral.ts`, `src/hooks/useReferralRewards.ts`
- Composants : `src/components/loyalty/ReferralLinkCreator.tsx`, `ReferralLinkList.tsx`, `ReferralCampaignConfig.tsx`, `ReferralStatsCard.tsx`, `ReferralGrowthBadges.tsx`, `AgencyGrowthLoopPanel.tsx`, `LoyaltyReferralPanel.tsx`
- Routes : `/referral` (protégée), `/ref/$code` (publique)
- Tables référencées : `referral_rewards`, `referral_links`, `referral_campaigns`
- API : `/api/referral-rewards/*` et `/api/referral/*`

Aucun code d'affiliation/parrainage n'a été modifié. Une migration Rewardful/Tolt doit décider si elle remplace seulement l'affiliation agence ou également les récompenses client, qui sont deux cas métier différents.

## 6. Polling et minuteries

- `RealTimeStatusBar` utilise déjà `refetchInterval` pour ses deux vraies requêtes.
- `GrowthAttributionWidget`, `AttributionOverviewWidget` et la requête de publications de `KPICards` ont été alignés sur `refetchInterval`.
- `SMSCampaignAnalytics` repose sur Blink Realtime.
- `LiveActivityFeed`, `MetricsCockpit` et `APIStatusPanel` simulent ou animent des valeurs; `CampaignStats` anime des nombres statiques. Ils ne possèdent pas de source HTTP canonique à migrer et doivent être traités comme dette de données simulées, pas comme polling réseau.

## 7. CI et variable backend

- Aucun `.github/workflows/claude.yml` n'existe dans les branches disponibles du dépôt; aucun `--allowedTools` n'est donc modifiable sans inventer un workflow.
- Le workflow réel `.github/workflows/audit-validation.yml` installe déjà Chromium avec `npx playwright install --with-deps chromium` avant les shards E2E.
- `VITE_BACKEND_URL` n'est défini dans aucun workflow versionné ni documenté avec une valeur de production. Les documents d'opérations demandent précisément de le configurer dans le coffre Blink. Sa présence réelle dans les secrets Blink/GitHub ne peut pas être déduite du dépôt.

## Découpage recommandé des prochaines sessions

1. **E2E isolé** : rendre le workflow déclenchable sur la branche de release, fournir uniquement les variables de test nécessaires, puis exécuter desktop/375/390/768 et capturer les erreurs `/api/billing/status`.
2. **Équipe + RBAC** : arbitrer la route, implémenter l'entitlement Agency serveur, retirer chat et filtrer l'activité.
3. **Publicité + connexions** : valider le contrat « Booster », implémenter les adaptateurs fournisseur et tester les comptes sandbox.
4. **Allègement mécanique** : découper les quatre gros composants un par un, puis centraliser `localStorage` et nettoyer les `console.log` par lots contrôlés avec snapshots/tests de rendu.
