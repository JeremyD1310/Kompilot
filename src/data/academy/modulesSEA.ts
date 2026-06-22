// SEA (Publicité Payante Locale) academy modules — Google Ads + Meta Ads
// All premium-tier, channel: 'sea'
import type { AcademyModule } from './types';

export const MODULES_SEA: AcademyModule[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // PARCOURS 1 : CAMPAGNES GOOGLE ADS LOCALES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sea-gads-001',
    title: 'Google Ads : Configurer son compte et lier Google Business en 5 min',
    subtitle: 'De zéro à votre première campagne locale active en moins de 10 minutes',
    channel: 'sea',
    format: 'checklist',
    tier: 'premium',
    duration: '2 min',
    emoji: '🎯',
    content: `
**🎯 Checklist : Compte Google Ads + Google Business en 5 minutes**

**Étape 1 : Créer votre compte Google Ads**
- Rendez-vous sur ads.google.com avec votre compte Google professionnel
- Choisissez "Mode Expert" (pas le mode guidé — il crée des campagnes automatiques coûteuses)
- Sélectionnez l'objectif **"Prospects"** ou **"Visites en magasin"**

**Étape 2 : Lier votre fiche Google Business Profile**
- Dans Google Ads → Outils → Paramètres du compte → Comptes liés
- Cliquez sur **Google Business Profile** → Associer votre fiche
- ✅ Ceci active automatiquement les **extensions de lieu** (adresse + horaires sous vos annonces)

**Étape 3 : Configurer les extensions essentielles**
- **Extension d'appel** : ajoutez votre numéro de téléphone → les clients appellent directement depuis l'annonce
- **Extension d'itinéraire** : affiche votre adresse et un lien Google Maps
- **Extension de liens annexes** : ajoutez "Menu", "Réserver", "Nous trouver"

**Étape 4 : Paramétrer votre fuseau horaire et devise**
- Fuseau : Europe/Paris
- Devise : EUR
- ⚠️ Ces paramètres ne sont pas modifiables après création

**Étape 5 : Activer la conversion "Appel téléphonique"**
- Outils → Conversions → + Nouvelle conversion → Appels téléphoniques
- Durée minimale : 60 secondes (filtre les faux clics)

✅ **Votre compte est prêt.** Passez au module suivant : le ciblage par rayon géographique.

💡 *Conseil Kompilot : Les scripts vidéo générés par le Cockpit IA peuvent être réutilisés comme texte d'annonce Google Ads.*
    `,
    tags: ['google-ads', 'sea', 'local', 'débutant', 'configuration'],
    createdAt: '2025-04-01',
    contextTrigger: 'sea_google_ads',
  },

  {
    id: 'sea-gads-002',
    title: 'Le ciblage par rayon : ne dépenser que pour votre zone de chalandise',
    subtitle: 'Cibler uniquement les clients dans 5 km autour de votre commerce',
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '📍',
    content: `
**📍 Le Ciblage Géographique par Rayon — L'arme secrète des commerces locaux**

La plupart des petits budgets Google Ads sont gaspillés en diffusant des annonces dans des zones trop larges. Voici comment cibler chirurgicalement.

**Pourquoi le ciblage par rayon est indispensable**
Un restaurant à Bordeaux n'a aucun intérêt à apparaître pour un utilisateur à Paris. Sans ciblage précis, vous payez pour des clics qui ne viendront jamais vous voir.

---

**Comment configurer votre rayon dans Google Ads :**

**1. Accédez aux paramètres de ciblage de votre campagne**
Campagnes → Votre campagne → Paramètres → Zones géographiques → Modifier

**2. Choisissez "Rayon autour d'un point"**
- Entrez votre adresse exacte (ou les coordonnées GPS)
- Définissez le rayon selon votre activité :

| Type d'activité | Rayon recommandé |
|---|---|
| Restaurant, café, salon | 3–5 km |
| Garage, plombier, électricien | 10–20 km |
| Commerce de centre-ville | 2–3 km |
| Institut de beauté, spa | 5–10 km |

**3. Exclure les zones non pertinentes**
Ajoutez des exclusions géographiques : si vous êtes à Paris 11ème, excluez les arrondissements éloignés.

**4. Activer l'option "Présence physique" (pas "Intérêt")**
Dans les paramètres de zone → Sélectionnez : **"Personnes qui se trouvent dans ou se rendent régulièrement dans vos zones ciblées"**
⚠️ Désactivez "Personnes qui s'intéressent à vos zones" (cela inclut des utilisateurs à l'autre bout du pays).

---

**Astuce avancée : Multiplier les couches de ciblage**
Combinez le ciblage géographique avec :
- **Horaires de diffusion** : uniquement quand vous êtes ouvert (+15% de pertinence)
- **Appareils mobiles** en priorité (72% des recherches locales = mobile)
- **Ajustements d'enchère** : +20% sur les utilisateurs à moins de 2 km

📊 *Résultat typique : -40% de coût par clic, +65% de taux de conversion locale.*
    `,
    tags: ['google-ads', 'ciblage', 'géographique', 'rayon', 'local', 'sea'],
    createdAt: '2025-04-05',
    contextTrigger: 'sea_google_ads',
  },

  {
    id: 'sea-gads-003',
    title: "Mots-clés d'intention locale : captez les clients qui cherchent maintenant",
    subtitle: '"Coiffeur La Rochelle", "urgence plomberie proche" — la méthode complète',
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min 30',
    emoji: '🔍',
    content: `
**🔍 La Stratégie des Mots-Clés d'Intention Locale**

Les mots-clés locaux convertissent 3x mieux que les mots-clés génériques, car ils captent des utilisateurs avec une **intention immédiate**.

---

**Les 3 types de mots-clés locaux**

**Type 1 : Intention géographique explicite**
Le client mentionne la ville ou le quartier.
- ✅ "coiffeur coloration Lyon 6ème"
- ✅ "restaurant japonais Bordeaux Chartrons"
- ✅ "plombier urgence Marseille 13013"

**Type 2 : Intention de proximité implicite**
Le client utilise des termes de proximité — Google les géolocalise automatiquement.
- ✅ "coiffeur proche de moi"
- ✅ "restaurant ouvert maintenant"
- ✅ "pharmacie de garde ce soir"

**Type 3 : Intention urgente / émotionnelle**
Fort signal d'achat immédiat.
- ✅ "urgence plomberie fuite eau"
- ✅ "dépannage serrure 24h"
- ✅ "table disponible ce soir restaurant"

---

**Outil gratuit pour trouver vos mots-clés : Google Keyword Planner**
1. Accédez via votre compte Google Ads → Outils → Planificateur de mots clés
2. Entrez votre activité + votre ville
3. Filtrez par "Volume de recherche mensuel" > 10 (les petits volumes locaux sont précieux)
4. Exportez les suggestions

**Mots-clés à exclure obligatoirement (liste négative)**
Ajoutez ces mots en liste négative pour éviter les clics non pertinents :
- "gratuit", "formation", "DIY", "comment faire", "prix", "avis" (sauf si vous voulez les gérer)

---

**Structure de groupe d'annonces recommandée**

| Groupe | Mots-clés |
|---|---|
| Géo-ville | "[service] [ville]", "[service] [quartier]" |
| Proximité | "[service] près de moi", "[service] proche" |
| Urgence | "[service] urgence", "[service] 24h", "[service] ouvert maintenant" |
| Marque | "[votre nom]", "[variantes de votre nom]" |

💡 *Astuce : exportez vos mots-clés les plus performants dans Kompilot pour générer du contenu SEO complémentaire.*
    `,
    tags: ['google-ads', 'mots-clés', 'intention', 'local', 'sea', 'avancé'],
    createdAt: '2025-04-10',
    contextTrigger: 'sea_google_ads',
  },

  {
    id: 'sea-gads-004',
    title: 'Piloter son budget Google Ads : commencer à 5€/jour et analyser le ROI',
    subtitle: 'Coût par appel, coût par itinéraire : les métriques qui comptent vraiment',
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '📊',
    content: `
**📊 Piloter son Budget Google Ads — Du 5€/jour au ROI réel**

La plupart des commerçants abandonnent Google Ads car ils mesurent les mauvais indicateurs. Voici les métriques qui révèlent la vraie valeur de vos campagnes locales.

---

**Les métriques locales à suivre (pas les métriques génériques)**

| Métrique globale ❌ | Métrique locale ✅ |
|---|---|
| Taux de clics (CTR) | Coût par appel téléphonique |
| Impressions | Demandes d'itinéraire Google Maps |
| CPC moyen | Coût par réservation |
| Score de qualité | Taux de conversion locale |

---

**Démarrer avec 5€/jour — La stratégie progressive**

**Phase 1 (semaine 1-2) : 5€/jour — Collecte de données**
- Lancez avec des enchères manuelles (CPC manuel)
- Activez uniquement 2-3 groupes d'annonces maximum
- Objectif : collecter 20-30 clics pour avoir des données

**Phase 2 (semaine 3-4) : 10€/jour — Optimisation**
- Supprimez les mots-clés avec 0 conversion après 15 clics
- Augmentez les enchères sur les mots-clés qui génèrent des appels
- Ajoutez les termes de recherche performants comme mots-clés

**Phase 3 (mois 2+) : Budget variable — Maximisation du ROI**
- Passez aux "Conversions maximales" (smart bidding)
- Budget basé sur le ROI : si 1€ investi génère 5€ de CA, augmentez

---

**Calculer votre coût par acquisition (CPA) cible**

Formule simple :
> CPA cible = Valeur moyenne d'un client × Taux de marge

*Exemple pour un restaurant :*
- Panier moyen : 35€
- Marge nette : 30%
- Valeur client = 35 × 0,30 = 10,50€
- ✅ Vous pouvez vous permettre de payer jusqu'à 10€ par nouveau client via Google Ads

---

**Tableau de bord mensuel (30 minutes/mois)**

✅ Coût total investi
✅ Nombre d'appels reçus via Google Ads (dans l'onglet Conversions)
✅ Nombre de demandes d'itinéraire
✅ Coût par appel = Budget ÷ Appels
✅ Décision : augmenter, maintenir ou réduire le budget

💡 *Un commerce local bien configuré obtient en moyenne un coût par appel de 2€–8€ sur Google Ads.*
    `,
    tags: ['google-ads', 'budget', 'roi', 'métriques', 'sea', 'avancé'],
    createdAt: '2025-04-15',
    contextTrigger: 'sea_google_ads',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PARCOURS 2 : CAMPAGNES META ADS EFFECTIVES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sea-meta-001',
    title: 'Meta Business Suite : configurer et lier Facebook + Instagram sans blocage',
    subtitle: 'Le guide pas-à-pas pour éviter les suspensions de compte dès le départ',
    channel: 'sea',
    format: 'checklist',
    tier: 'premium',
    duration: '2 min',
    emoji: '⚙️',
    content: `
**⚙️ Checklist : Meta Business Suite Sans Blocage**

Les blocages de compte Meta sont la hantise n°1 des commerçants. Cette checklist vous permet d'éviter 95% des problèmes.

---

**Étape 1 : Créer votre Business Manager (Meta Business Suite)**
- Rendez-vous sur business.facebook.com
- ⚠️ Utilisez votre VRAI nom et prénom (même si vous représentez une entreprise)
- Connectez votre compte Facebook personnel existant (pas un faux compte)
- Ajoutez votre numéro de téléphone professionnel ET personnel

**Étape 2 : Vérifier votre identité commerciale**
- Paramètres → Informations sur l'entreprise → Commencer la vérification
- Fournissez : Kbis ou extrait SIREN/SIRET + facture récente à votre nom
- ✅ La vérification débloque des limites de dépense plus élevées

**Étape 3 : Lier votre Page Facebook**
- Business Manager → Pages → Ajouter → "Ajouter une page"
- Si vous n'avez pas encore de page : créez-la depuis le Business Manager (pas depuis Facebook personnel)
- Assignez-vous le rôle **Administrateur**

**Étape 4 : Connecter votre compte Instagram**
- Business Manager → Comptes Instagram → Ajouter compte Instagram
- Entrez vos identifiants Instagram professionnels
- ✅ Les deux comptes sont maintenant gérés depuis un seul endroit

**Étape 5 : Créer votre compte publicitaire**
- Business Manager → Comptes publicitaires → Créer un compte
- Nom : "[Votre commerce] - Pub"
- Fuseau : Europe/Paris, Devise : EUR
- Ajoutez un moyen de paiement immédiatement (carte bancaire ou PayPal)

**Étape 6 : Installer le Pixel Meta sur votre site**
- Business Manager → Sources de données → Pixels → Créer un pixel
- Suivez le guide d'installation pour votre CMS (Shopify, WordPress, etc.)

**🛡️ Anti-blocage : les règles à respecter dès le départ**
- Ne créez JAMAIS plus d'un compte publicitaire au départ
- Ne changez pas votre moyen de paiement les 7 premiers jours
- Commencez avec des budgets bas (5€-10€/jour)
- Évitez les mots interdits dans vos annonces : "maigrir", "gagner de l'argent", "garantie"
    `,
    tags: ['meta-ads', 'facebook', 'instagram', 'business-manager', 'sea', 'configuration'],
    createdAt: '2025-04-20',
    contextTrigger: 'sea_meta_ads',
  },

  {
    id: 'sea-meta-002',
    title: 'Boost de post vs Gestionnaire de pub : quand utiliser quoi',
    subtitle: "La décision stratégique qui peut tripler l'efficacité de votre budget",
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '⚖️',
    content: `
**⚖️ Boost de Post vs Gestionnaire de Publicités — Le Guide de Décision**

C'est LA question que posent 90% des commerçants. La réponse dépend de votre objectif. Voici le cadre de décision clair.

---

**Le Boost de Post ("Booster la publication")**

✅ **Utilisez-le quand :**
- Vous voulez augmenter la portée d'un post qui performe déjà organiquement (likes, partages)
- Vous avez moins de 15 minutes à consacrer à la publicité
- Objectif : notoriété locale, événement ponctuel, promotion flash
- Budget : 10€–50€ sur 3-5 jours

❌ **N'utilisez PAS le Boost pour :**
- Générer des leads ou des réservations (mauvais objectif)
- Des campagnes longues (coût plus élevé que le Gestionnaire)
- Cibler précisément un comportement ou un intérêt spécifique

**Exemple parfait pour le Boost :**
*"Notre terrasse estivale est ouverte ce week-end 🌞 — Réservez votre table !"*
→ Budget : 20€ sur 3 jours, ciblage : rayon 5km, audience : 25-55 ans

---

**Le Gestionnaire de Publicités (Ads Manager)**

✅ **Utilisez-le quand :**
- Vous voulez des résultats mesurables (messages WhatsApp, formulaires, appels)
- Vous avez un budget régulier (même 5€/jour en continu)
- Vous souhaitez A/B tester plusieurs visuels ou textes
- Vous ciblez un comportement précis (parents d'enfants 0-6 ans, propriétaires de voitures)

**Avantages vs Boost :**
- Accès à 40+ objectifs publicitaires (vs 3 pour le Boost)
- Ciblage démographique et comportemental avancé
- Optimisation automatique de l'algorithme Meta
- Coût par résultat généralement 30-50% inférieur au Boost

---

**Matrice de décision rapide**

| Situation | Outil recommandé |
|---|---|
| Post qui buzz déjà → amplifier | Boost |
| Annoncer un événement cette semaine | Boost |
| Générer des messages WhatsApp | Ads Manager |
| Remplir un calendrier de réservation | Ads Manager |
| Tester 3 visuels différents | Ads Manager |
| Budget < 20€ total | Boost |
| Budget mensuel régulier | Ads Manager |

💡 *Conseil : utilisez le Boost pour l'image de marque, le Gestionnaire pour les conversions directes.*
    `,
    tags: ['meta-ads', 'boost', 'gestionnaire', 'facebook', 'sea', 'stratégie'],
    createdAt: '2025-04-25',
    contextTrigger: 'sea_meta_ads',
  },

  {
    id: 'sea-meta-003',
    title: 'Créer une pub vidéo locale à forte conversion avec vos Reels IA',
    subtitle: 'Recyclez vos scripts Kompilot en publicités Meta qui vendent',
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min 30',
    emoji: '🎥',
    content: `
**🎥 Transformer vos Scripts Reels en Publicités Meta Vidéo**

Vos scripts vidéo générés par le Cockpit IA de Kompilot sont déjà structurés pour capter l'attention. Voici comment les transformer en publicités à forte conversion.

---

**Pourquoi la vidéo domine Meta Ads en 2025**
- Coût par résultat 60% inférieur aux images statiques
- Les publicités vidéo génèrent 3x plus de clics vers WhatsApp
- Meta favorise les Reels dans le fil publicitaire (prime de distribution)

---

**Structure d'une pub vidéo locale qui convertit**

**Secondes 0–3 : Le "Pattern Interrupt"**
Cassez les habitudes de l'utilisateur en scrollant. Techniques :
- Texte en grand format : *"Si vous habitez [Ville]..."*
- Question directe à caméra : *"Vous cherchez un coiffeur disponible cette semaine ?"*
- Chiffre surprenant : *"92% des gens ne savent pas ça..."*

**Secondes 3–10 : Le problème local**
Parlez du problème de votre cible locale de manière spécifique.
*"Trouver une table de restaurant à [Ville] un samedi soir, c'est souvent un calvaire..."*

**Secondes 10–20 : Votre solution**
Présentez votre établissement comme la réponse. Montrez des images réelles (pas de stock photos).
*"Chez [Votre Restaurant], nous gardons toujours 5 tables disponibles en réservation de dernière minute..."*

**Secondes 20–30 : Le CTA local**
Un seul appel à l'action clair et urgent :
- "Réservez maintenant — lien en bio"
- "Envoyez 'RDV' en message pour vérifier nos disponibilités"
- "Appelez-nous au [numéro]"

---

**Format technique pour Meta Ads**
- Format : 9:16 vertical (Reels/Stories)
- Durée : 15-30 secondes (idéal), max 60 secondes
- Résolution : 1080×1920px minimum
- Sous-titres : **OBLIGATOIRES** (80% regardent sans son)
- Fichier : MP4, H.264, max 4Go

---

**Utiliser vos scripts Kompilot**
1. Générez un script Reel dans le Cockpit IA
2. Enregistrez-vous avec votre téléphone (format vertical)
3. Ajoutez les sous-titres automatiques (CapCut, DaVinci, InShot)
4. Importez dans le Gestionnaire de Publicités Meta
5. Objectif : **Vues vidéo** pour la notoriété, **Messages** pour les conversions directes

💡 *Les publicités vidéo tournées avec un iPhone en bonne lumière naturelle surpassent souvent les productions professionnelles — l'authenticité rassure.*
    `,
    tags: ['meta-ads', 'vidéo', 'reels', 'conversion', 'sea', 'avancé'],
    createdAt: '2025-05-01',
    contextTrigger: 'cockpit_tiktok_script',
  },

  {
    id: 'sea-meta-004',
    title: 'Objectif "Messages" : pub Meta qui ouvre WhatsApp ou Instagram Direct',
    subtitle: "Synchronisé avec l'Inbox Unique Kompilot pour 0 réponse manquée",
    channel: 'sea',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '💬',
    content: `
**💬 Objectif "Messages" Meta Ads — La Pub qui Remplit Votre Inbox Kompilot**

L'objectif "Messages" de Meta Ads est le plus puissant pour les commerces locaux qui veulent des contacts qualifiés directement dans leur boîte de messages — parfaitement synchronisé avec l'Inbox Unique de Kompilot.

---

**Pourquoi "Messages" est l'objectif n°1 pour les locaux**
- Le prospect contacte directement sur WhatsApp ou Instagram Direct
- Aucune friction : pas de formulaire, pas de landing page
- Coût par message : généralement 0,50€–3€ (selon le secteur)
- Taux de réponse : 3-5x supérieur à un formulaire classique

---

**Configurer une campagne "Messages" étape par étape**

**1. Objectif de campagne**
Gestionnaire de Pub → Créer → **Messages**
Choisissez la destination :
- **WhatsApp Business** (recommandé pour les commerces locaux)
- **Instagram Direct**
- **Messenger**

**2. La configuration WhatsApp**
- Dans l'ensemble de publicités → Destination : WhatsApp
- Configurez votre **Message d'accueil automatique** (ce que verra le prospect avant d'envoyer)
- Exemple : *"Bonjour ! Je suis intéressé(e) par [votre service]. Quelles sont vos disponibilités ?"*

**3. La pub "Click-to-WhatsApp" parfaite**
Structure visuelle :
- Image ou vidéo de votre établissement (authentique)
- Texte : problème → solution → CTA
- Bouton : **"Envoyer un message"**

**Exemple de texte d'annonce :**
> *🌸 Besoin d'un rendez-vous rapidement chez [Salon] ?*
> *Nous avons des créneaux disponibles cette semaine.*
> *Envoyez-nous un message et on vous répond en moins de 5 minutes !*
> *👇 Cliquez pour nous écrire sur WhatsApp*

**4. Questions fréquentes automatiques (Meta FAQ)**
Ajoutez 3 questions pré-remplies que le client peut envoyer en 1 clic :
- "Quelles sont vos disponibilités ?"
- "Quels sont vos tarifs ?"
- "Comment vous trouver ?"

---

**L'intégration avec Kompilot Inbox**
Une fois votre compte WhatsApp Business connecté à Kompilot :
- Tous les messages générés par vos publicités arrivent dans l'**Inbox Unifiée**
- L'IA génère des suggestions de réponse instantanées
- Vous ne manquez plus aucun prospect, même hors horaires

---

**Ciblage recommandé pour l'objectif "Messages"**
- Rayon : 5-10 km autour de votre établissement
- Âge : 25-55 ans (ajustez selon votre clientèle réelle)
- Appareils : Mobile uniquement (les messages PC se convertissent moins)
- Horaires : uniquement quand vous pouvez répondre (évitez la nuit)

📊 *Résultat type : 15-40 nouveaux contacts WhatsApp par mois pour 50€ de budget.*
    `,
    tags: ['meta-ads', 'whatsapp', 'messages', 'inbox', 'sea', 'avancé'],
    createdAt: '2025-05-05',
    contextTrigger: 'sea_meta_ads',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CAS PRATIQUES MÉTIERS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sea-metier-restaurant',
    title: 'Restaurants : Le guide Meta Ads pour remplir ses tables le jeudi soir',
    subtitle: 'Stratégie complète pour transformer les soirs creux en soirées pleines',
    channel: 'sea',
    format: 'checklist',
    tier: 'premium',
    duration: '2 min',
    emoji: '🍽️',
    content: `
**🍽️ Cas Pratique Restauration : Remplir Ses Tables le Jeudi Soir avec Meta Ads**

Le jeudi soir est le créneau sous-utilisé des restaurants. Voici la stratégie exacte pour le rentabiliser avec 50€/semaine de publicité Meta.

---

**Le problème : les créneaux vides en semaine**
Les restaurants sont pleins le vendredi et samedi mais perdent en moyenne 40% de leur CA potentiel en semaine. La publicité ciblée permet de lisser ce déséquilibre.

---

**La Stratégie "Jeudi Vivant" — Template Complet**

**Lundi :** Programmez votre campagne Meta pour démarrer mardi soir
**Mardi :** La pub commence à tourner
**Mercredi :** Surveillez les messages entrants, répondez dans l'heure
**Jeudi :** Profitez de vos tables remplies !

---

**Configuration de la campagne**

**Objectif :** Messages (WhatsApp) ou Trafic (réservations en ligne)

**Ciblage :**
- Rayon : 5 km autour du restaurant
- Âge : 28-55 ans
- Intérêts : "Gastronomie", "Restaurants", "Sorties en famille"
- Diffusion : Mardi 19h → Jeudi 21h UNIQUEMENT

**Budget :** 10€/jour les 2 jours de diffusion = 20€/semaine
→ ROI : si 3 tables de 2 réservées = 3 × 2 × 35€ = 210€ de CA pour 20€ investis

---

**Script d'annonce qui remplit les tables**

> 🍷 *[Nom du restaurant] — Mardi & Jeudi soir*
> *Nos meilleures tables sont disponibles cette semaine !*
> *Menu du jeudi : [votre plat signature] + dessert maison = 28€/pers*
> *📞 Réservez en 30 secondes — On vous répond immédiatement*
> *[Bouton : Réserver via WhatsApp]*

**Visual recommandé :**
- Photo du plat signature bien éclairé (lumière naturelle)
- OU courte vidéo "coulisses" de la préparation (30 secondes)
- Texte en overlay : "Tables disponibles jeudi soir 🍷"

---

**Checklist hebdomadaire (30 minutes/semaine)**

☐ Lundi 18h : Vérifier le budget disponible sur Meta
☐ Lundi 18h30 : Créer/dupliquer la campagne de la semaine précédente
☐ Lundi 19h : Publier un post organique "À table jeudi ?" pour le renforcer
☐ Mardi 9h : Vérifier que la campagne est active
☐ Jeudi soir : Compter les couverts + noter le ROI

💡 *Intégrez cet outil avec l'Inbox Kompilot pour ne jamais manquer une demande de réservation par WhatsApp.*
    `,
    tags: ['meta-ads', 'restaurant', 'cas-pratique', 'sea', 'jeudi', 'tables'],
    createdAt: '2025-05-10',
    metier: 'restaurant',
    contextTrigger: 'sea_meta_ads',
  },

  {
    id: 'sea-metier-salon',
    title: 'Salons & Instituts : Google Ads pour boucher les trous dans son agenda',
    subtitle: 'Générer des appels qualifiés en 48h pour remplir les créneaux disponibles',
    channel: 'sea',
    format: 'checklist',
    tier: 'premium',
    duration: '2 min',
    emoji: '💇',
    content: `
**💇 Cas Pratique Beauté : Remplir Son Agenda avec Google Ads en 48h**

Un créneau vide dans un salon = revenu perdu définitivement. Google Ads est la solution la plus rapide pour générer des appels qualifiés dans les 48h.

---

**Pourquoi Google Ads plutôt que Meta pour les salons**
Un client qui cherche *"coiffeur disponible aujourd'hui [Ville]"* sur Google a une **intention immédiate** — il veut un rendez-vous maintenant. Sur Meta, vous créez une envie. Sur Google, vous captez une intention.

---

**La Campagne "Agenda d'Urgence" — Template Prêt à l'Emploi**

**Objectif de campagne :** Appels téléphoniques + Formulaire de contact

**Mots-clés prioritaires :**

    "coiffeur disponible [ville]"
    "salon disponible ce week-end [ville]"
    "coiffeur dernière minute [ville]"
    "coloration cheveux [ville]"
    "brushing [ville]"
    "coupe homme [ville]"

**Annonce type (texte responsive) :**

*Titre 1 :* Coiffeur Disponible à [Ville]
*Titre 2 :* RDV Dispo Cette Semaine
*Titre 3 :* Appelez-Nous Maintenant

*Description 1 :* Créneaux disponibles aujourd'hui et demain. Couleur, coupe, soin — prenez votre rendez-vous en 2 minutes.
*Description 2 :* Salon [Nom] à [Quartier] · Tarifs clairs · Sans surprise · Appelez directement

---

**Configuration budget pour un petit salon**

| Phase | Budget/jour | Durée | Objectif |
|---|---|---|---|
| Test | 5€ | 7 jours | Identifier les mots-clés qui appellent |
| Optimisation | 8€ | 14 jours | Couper les mots-clés sans conversion |
| Croissance | 12€ | En continu | Maximiser les appels dans votre rayon |

**ROI attendu :**
- Coût moyen par appel dans les salons : 3€–7€
- Panier moyen coiffeur : 45€–80€
- Pour 30€ investis : 5-10 appels → 3-6 nouveaux clients → 135€–480€ de CA

---

**Checklist de la campagne "Agenda d'Urgence"**

☐ Activez l'extension d'appel (bouton "Appeler" directement dans l'annonce)
☐ Configurez l'heure de diffusion : uniquement pendant vos heures d'ouverture
☐ Ajoutez une liste négative : "formation", "école", "youtube", "comment"
☐ Activez les annonces d'appel uniquement sur mobile (inutile sur desktop)
☐ Répondez à TOUS les appels dans la journée (sinon Google dévalue votre annonce)
☐ Ajoutez le mot "disponible" dans 2 titres minimum — c'est le mot qui déclenche les clics urgents

---

**Astuce avancée : Lier Google Ads + Google Business**
Si un client appelle depuis votre fiche Google Maps ET depuis une pub, Google attribue la conversion aux deux canaux. Vérifiez votre attribution mensuelle pour éviter de vous croire plus performant que vous n'êtes.

💡 *Combinez cette campagne avec le système de notification SMS de Kompilot pour rappeler automatiquement vos clients des créneaux disponibles.*
    `,
    tags: ['google-ads', 'salon', 'coiffeur', 'beauté', 'agenda', 'cas-pratique', 'sea'],
    createdAt: '2025-05-15',
    metier: 'salon',
    contextTrigger: 'sea_google_ads',
  },
];
