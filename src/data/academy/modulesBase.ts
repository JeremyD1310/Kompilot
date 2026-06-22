// Base (free + legacy premium) academy modules — existing catalogue
import type { AcademyModule } from './types';

export const MODULES_BASE: AcademyModule[] = [
  // ── FREE ────────────────────────────────────────────────────────────────
  {
    id: 'gm-001',
    title: 'Optimiser sa fiche Google Business en 5 étapes',
    subtitle: 'Les bases incontournables pour être trouvé localement',
    channel: 'google-maps',
    format: 'article',
    tier: 'free',
    duration: '45 sec',
    emoji: '📍',
    content: `
**🎯 Les 5 étapes pour une fiche Google Business parfaite**

**1. Photo de couverture percutante**
Choisissez une photo lumineuse de votre façade ou de votre produit star. Les fiches avec photos reçoivent 42% plus de demandes d'itinéraires.

**2. Horaires à jour (surtout les jours fériés)**
Mettez vos horaires spéciaux à l'avance. Google pénalise les fiches avec des horaires inexacts.

**3. Description courte et riche en mots-clés**
Rédigez 250 mots maximum avec vos services principaux et votre ville.

**4. Répondez à tous vos avis (même négatifs)**
Google favorise les établissements qui dialoguent avec leurs clients.

**5. Publiez 1 photo par semaine**
Les fiches actives apparaissent en premier dans les résultats locaux.

💡 *Astuce Kompilot : utilisez le Cockpit IA pour générer automatiquement vos posts Google Business.*
    `,
    tags: ['google', 'fiche', 'local', 'débutant'],
    createdAt: '2025-01-10',
  },
  {
    id: 'seo-001',
    title: 'Les horaires clés pour poster sur les réseaux',
    subtitle: 'Quand publier pour maximiser votre visibilité',
    channel: 'seo',
    format: 'checklist',
    tier: 'free',
    duration: '45 sec',
    emoji: '⏰',
    content: `
**📅 Meilleurs horaires de publication par plateforme**

**Google Business**
- Idéal : Mardi–Jeudi 10h–12h
- À éviter : week-end matin (moins de recherches)

**Instagram**
- Lundi, Mercredi, Vendredi : 11h–13h
- Jeudi–Vendredi : 19h–21h (pic d'engagement)

**Facebook**
- Mercredi 13h–15h : meilleur engagement de la semaine
- Dimanche soir : bonne portée organique

**TikTok**
- 19h–23h : c'est l'heure de grande audience
- Évitez les publications entre 10h et 16h en semaine

**WhatsApp Broadcast**
- Envoyez vos messages à 10h ou 18h pour un maximum d'ouvertures
- Évitez le lundi matin et le vendredi après 17h

✅ *Conseil : programmez vos posts la veille avec le Calendrier Kompilot.*
    `,
    tags: ['horaires', 'programmation', 'réseaux', 'débutant'],
    createdAt: '2025-01-12',
  },
  {
    id: 'wa-001',
    title: 'Créer votre premier message WhatsApp Business',
    subtitle: 'De zéro à votre premier broadcast en 3 minutes',
    channel: 'whatsapp',
    format: 'article',
    tier: 'free',
    duration: '3 min',
    emoji: '💬',
    content: `
**🚀 Votre premier broadcast WhatsApp Business**

**Étape 1 : Configurer votre profil business**
Ajoutez votre photo, description, horaires et adresse dans WhatsApp Business. Un profil complet inspire 3x plus confiance.

**Étape 2 : Créer une liste de diffusion**
Dans WhatsApp Business : Menu → Nouveau message → Nouvelle liste de diffusion. Ajoutez vos clients (ils doivent avoir votre numéro enregistré).

**Étape 3 : Rédiger votre premier message**
Structure gagnante :
- 🎯 Accroche courte (1 ligne max)
- 📝 Corps du message (3 lignes)
- 📞 Appel à l'action clair

**Exemple :**
*"🌸 Nouveauté printemps disponible ! Nos nouvelles robes d'été viennent d'arriver. Venez découvrir la collection jusqu'à 19h aujourd'hui. 👉 Réservez votre essayage : [lien]"*

**Étape 4 : Envoyer et analyser**
Vérifiez le taux de lecture (2 coches bleues) et répondez aux réponses rapidement.

💡 *Kompilot génère automatiquement vos messages WhatsApp depuis le Cockpit IA.*
    `,
    tags: ['whatsapp', 'broadcast', 'messaging', 'débutant'],
    createdAt: '2025-01-15',
  },
  {
    id: 'ig-001',
    title: 'Les 3 types de posts Instagram qui convertissent',
    subtitle: 'Maîtrisez les formats pour attirer plus de clients',
    channel: 'instagram',
    format: 'article',
    tier: 'free',
    duration: '1 min 30',
    emoji: '📸',
    content: `
**📱 Les 3 formats Instagram indispensables pour un commerce local**

**1. Le "Coulisses" (Behind-the-scenes)**
Montrez votre équipe, votre cuisine, votre atelier. L'authenticité bat la perfection. Ces posts génèrent 2x plus de commentaires.

**2. L'Avant/Après**
Transformation de cheveux, plat cuisiné, rénovation d'intérieur... Le contraste visuel stoppe le scroll automatiquement.

**3. La Preuve Sociale**
Partagez les avis clients avec leur photo (avec accord). C'est votre meilleure publicité : 88% des consommateurs font autant confiance aux avis qu'aux recommandations personnelles.

**📌 Format technique qui marche :**
- Format carré (1:1) pour les posts
- Story verticale (9:16) pour la mise en avant
- Reel de 15-30 secondes pour l'algorithme

**💬 Légendes :**
- 1 question = +40% de commentaires
- Limitez les hashtags à 5-8 ciblés (pas 30 génériques)
- Mentionnez la ville pour le référencement local
    `,
    tags: ['instagram', 'contenu', 'photos', 'débutant'],
    createdAt: '2025-01-20',
  },
  {
    id: 'fb-001',
    title: 'Créer une Page Facebook Professionnelle en 10 minutes',
    subtitle: 'Les bases pour une présence Facebook efficace pour votre commerce',
    channel: 'facebook',
    format: 'checklist',
    tier: 'free',
    duration: '45 sec',
    emoji: '👥',
    content: `
**📘 Checklist Page Facebook Professionnelle**

**1. Choisir la bonne catégorie**
Sélectionnez "Commerce local" ou "Entreprise" pour accéder aux outils spécifiques (bouton Réserver, carte, horaires).

**2. Photo de profil & couverture**
- Photo de profil : votre logo, 180×180px minimum
- Couverture : 820×312px, une image de votre vitrine ou produit star

**3. Remplir toutes les informations**
- Horaires d'ouverture (obligatoire)
- Adresse complète et numéro de téléphone
- Lien vers votre site web
- Description courte avec mots-clés locaux

**4. Activer le bouton d'action**
Choisissez "Réserver maintenant", "Envoyer un message" ou "Appeler maintenant" selon votre activité.

**5. Créer un premier post épinglé**
Rédigez un post de présentation (votre histoire, vos spécialités) et épinglez-le en haut de votre page.

✅ *Kompilot publie automatiquement sur votre Page Facebook depuis le Cockpit IA.*
    `,
    tags: ['facebook', 'page', 'local', 'débutant'],
    createdAt: '2025-03-01',
  },

  // ── PREMIUM LEGACY ────────────────────────────────────────────────────
  {
    id: 'tiktok-001',
    title: 'Script Reel 10K vues : La structure des 3 premières secondes',
    subtitle: "Masterclass : accrochez votre audience avant qu'elle ne passe",
    channel: 'tiktok-reels',
    format: 'video',
    tier: 'premium',
    duration: '2 min',
    emoji: '🎬',
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['tiktok', 'reels', 'script', 'viral', 'masterclass'],
    createdAt: '2025-01-25',
    contextTrigger: 'cockpit_tiktok_script',
  },
  {
    id: 'tiktok-002',
    title: 'Structurer un script Reel pour faire 10 000 vues',
    subtitle: 'La méthode HOOK-CONFLICT-RESOLVE utilisée par les créateurs viraux',
    channel: 'tiktok-reels',
    format: 'article',
    tier: 'premium',
    duration: '1 min 30',
    emoji: '🚀',
    content: `
**🎯 La structure HOOK-CONFLICT-RESOLVE**

Cette méthode est utilisée par 90% des créateurs qui font régulièrement 10K+ vues.

**HOOK (0-3 secondes) — L'accroche**
Commencez par une phrase qui crée un vide d'information :
- "Vous perdez des clients à cause de ça..."
- "Le secret que ma concurrente ne veut pas que vous sachiez"
- "Je vais vous montrer pourquoi votre fiche Google vous coûte de l'argent"

**CONFLICT (3-15 secondes) — Le problème**
Amplifiez le problème que ressent votre cible. Utilisez des données, des exemples concrets, des émotions.

**RESOLVE (15-30 secondes) — La solution**
Présentez VOTRE solution (votre produit/service) comme la réponse évidente au problème.

**📌 Règles d'or :**
- Parlez directement à la caméra (eye-contact = confiance)
- Sous-titres toujours (85% regardent sans son)
- Plan large + plan serré + plan large pour dynamiser
- Terminez par un CTA clair : "Lien en bio", "Venez voir", "Réservez"
    `,
    tags: ['tiktok', 'reels', 'script', 'viral', 'masterclass'],
    createdAt: '2025-01-28',
    contextTrigger: 'cockpit_tiktok_script',
  },
  {
    id: 'seo-002',
    title: 'Le nouvel algorithme GEO de Perplexity (2025)',
    subtitle: 'Comment être référencé dans les résultats IA générative',
    channel: 'seo',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '🌐',
    content: `
**🤖 GEO (Generative Engine Optimization) : Le SEO de demain**

Depuis 2024, Perplexity AI, ChatGPT Search et Google AI Overviews changent radicalement la façon dont les clients trouvent les commerces locaux.

**Qu'est-ce que le GEO ?**
Le GEO c'est l'optimisation de votre présence pour que les IA (Perplexity, ChatGPT, Gemini) vous recommandent quand un utilisateur pose une question type : *"Quel est le meilleur restaurant japonais à Lyon ?"*

**Les 5 signaux GEO les plus importants pour 2025 :**

**1. Citations d'autorité**
Les IA citent les sources qui ont elles-mêmes des citations. Publiez sur des annuaires locaux (Yelp, TripAdvisor, PagesJaunes) et des blogs régionaux.

**2. Données structurées (Schema.org)**
Implémentez le balisage LocalBusiness sur votre site. Les IA lisent directement les métadonnées.

**3. Avis Google récents**
Les IA privilégient les établissements avec des avis récents (<3 mois). Objectif : minimum 5 nouveaux avis par mois.

**4. FAQ sur votre fiche Google**
Répondez aux questions dans la section Q&A de Google Business. Ces réponses sont indexées par les IA.

**5. Contenu E-E-A-T local**
Publiez des articles de blog sur votre expertise locale. *"Les meilleures pizzas de [votre ville] : notre sélection"* vous positionne comme référence locale.

📈 *Les commerces optimisés GEO voient en moyenne +35% de mentions dans les résultats IA d'ici 6 mois.*
    `,
    tags: ['seo', 'geo', 'ia', 'perplexity', 'masterclass'],
    createdAt: '2025-02-01',
  },
  {
    id: 'gm-002',
    title: 'Technique avancée : Dominer les résultats Google Maps locaux',
    subtitle: 'Les leviers cachés que peu de commerçants utilisent',
    channel: 'google-maps',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '🗺️',
    content: `
**🏆 Dominer le Pack Local Google Maps**

Le "Pack Local" (les 3 résultats qui apparaissent sur la carte) capte 44% des clics. Voici comment y entrer.

**Facteur #1 : La proximité dynamique**
Google adapte les résultats en temps réel selon la position de l'utilisateur. Mais il y a un levier : vos catégories secondaires. Ajoutez jusqu'à 9 catégories pertinentes dans Google Business.

**Facteur #2 : Les produits et services**
Beaucoup de commerçants oublient la section "Produits". Chaque produit avec photo = une page indexée supplémentaire. Visez 10+ produits.

**Facteur #3 : Les posts Google (Publications)**
Publiez 1 post par semaine avec votre mot-clé local dans le texte. *"Notre restaurant japonais à Lyon vous accueille..."* — répétez le nom de la ville naturellement.

**Facteur #4 : Messages Google Business**
Activez la messagerie directe. Les fiches avec messagerie active reçoivent un boost de visibilité de Google.

**Facteur #5 : Les événements**
Créez des événements dans Google Business (promotions, ouvertures spéciales). Ils apparaissent dans les résultats Knowledge Panel et Discover.

**Stratégie hebdomadaire gagnante :**
- Lundi : publier 1 photo produit
- Mercredi : répondre à tous les nouveaux avis
- Vendredi : créer un post "offre du week-end"
- Dimanche : mettre à jour les horaires si besoin
    `,
    tags: ['google', 'maps', 'local', 'avancé', 'masterclass'],
    createdAt: '2025-02-05',
  },
  {
    id: 'wa-002',
    title: 'Les 7 secrets de conversion WhatsApp Business',
    subtitle: 'Transformez vos contacts WhatsApp en clients réguliers',
    channel: 'whatsapp',
    format: 'article',
    tier: 'premium',
    duration: '1 min 30',
    emoji: '🔑',
    content: `
**💚 Les 7 secrets de conversion WhatsApp Business**

**Secret #1 : Le message de bienvenue automatique**
Configurez un message de bienvenue qui se déclenche dès qu'un prospect vous contacte pour la première fois. Il doit contenir votre offre principale et un lien.

**Secret #2 : L'horaire de broadcast magique**
Les messages envoyés entre 10h-11h le mardi et 18h-19h le jeudi ont les meilleurs taux d'ouverture (>85%).

**Secret #3 : Les listes de diffusion segmentées**
Créez des listes séparées : Clients VIP / Nouveaux clients / Clients inactifs. Chaque segment reçoit un message personnalisé → +40% de conversions vs liste unique.

**Secret #4 : L'emoji stratégique**
Utilisez 1-3 emojis en début de message. Les messages avec emojis ont 27% de taux de réponse en plus. Mais pas plus de 3 (spam).

**Secret #5 : La question de fin**
Terminez TOUJOURS votre message par une question fermée simple : *"Vous préférez mardi ou jeudi ?"* → Le client répond au lieu d'ignorer.

**Secret #6 : Le catalog WhatsApp**
Activez le catalogue de produits/services directement dans WhatsApp Business. 60% des utilisateurs consultent les catalogues avant d'acheter.

**Secret #7 : Le follow-up à J+3**
Si un prospect ne répond pas, relancez avec : *"Bonjour [Prénom], j'espère que vous avez eu ma proposition. Une question ?"* → 35% de taux de réponse.
    `,
    tags: ['whatsapp', 'conversion', 'broadcast', 'avancé', 'masterclass'],
    createdAt: '2025-02-10',
  },
  {
    id: 'email-001',
    title: "L'objet d'email qui fait +40% d'ouvertures",
    subtitle: "La psychologie des lignes d'objet qui convertissent",
    channel: 'email',
    format: 'article',
    tier: 'premium',
    duration: '1 min',
    emoji: '📧',
    content: `
**✉️ La science des objets d'email**

**Les 5 formules qui marchent systématiquement :**

**1. La curiosité avec vide d'information**
*"La raison pour laquelle vos clients ne reviennent pas"*
→ On ne peut pas NE PAS l'ouvrir.

**2. La personnalisation prénom**
*"[Prénom], votre offre expire ce soir"*
→ +22% d'ouvertures vs sans prénom.

**3. L'urgence authentique**
*"Plus que 3 places disponibles pour demain"*
→ Fonctionne si l'urgence est réelle (ne pas mentir).

**4. La preuve sociale**
*"127 clients ont déjà réservé — rejoignez-les"*
→ La preuve sociale réduit l'anxiété d'achat.

**5. La question directe**
*"Êtes-vous disponible samedi à 14h ?"*
→ Le cerveau répond automatiquement aux questions.

**📌 Règles techniques :**
- 40-60 caractères maximum (mobile-friendly)
- Pas de mots spam : GRATUIT, URGENT, PROMO en majuscules
- Emoji en début d'objet : +10% d'ouvertures
- A/B testez toujours 2 versions
    `,
    tags: ['email', 'objet', 'conversion', 'copywriting', 'masterclass'],
    createdAt: '2025-02-15',
  },
  {
    id: 'ig-002',
    title: "L'algorithme Instagram 2025 décodé",
    subtitle: 'Comprendre le fonctionnement pour atteindre +10K personnes sans pub',
    channel: 'instagram',
    format: 'article',
    tier: 'premium',
    duration: '2 min 30',
    emoji: '🔍',
    content: `
**🤖 L'algorithme Instagram 2025 : Ce qui a changé**

**Ce qui est MORT en 2025 :**
- Les hashtags génériques (#love, #food) → portée nulle
- Les images statiques sans texte → favorisées uniquement en Feed
- Les stories postées à n'importe quelle heure → pénalisées

**Ce qui EXPLOSE en 2025 :**

**1. Le "Send Rate" (partages en DM)**
L'algorithme mesure combien de fois votre post est partagé en message privé. 1 partage DM = 10 likes pour l'algo.
*Stratégie : créez du contenu "je dois envoyer ça à..."*

**2. Les saves (enregistrements)**
Un post enregistré = signal fort d'utilité. Créez des "checklists" et "guides" à enregistrer.

**3. Les Collaborations**
Invitez un partenaire local en collaboration (collab post). Son audience = votre portée x2 gratuitement.

**4. La consistance des horaires**
Publiez TOUJOURS aux mêmes créneaux. L'algo apprend vos patterns et notifie vos abonnés.

**5. Les Reels de 15-30 secondes**
L'algo pousse activement les Reels courts en dehors de votre audience actuelle. C'est le meilleur levier de croissance gratuite.
    `,
    tags: ['instagram', 'algorithme', 'reels', 'avancé', 'masterclass'],
    createdAt: '2025-02-20',
  },
  {
    id: 'fb-002',
    title: "L'algorithme Facebook 2025 : maximiser la portée organique",
    subtitle: 'Les leviers cachés pour atteindre 10x plus de personnes sans publicité',
    channel: 'facebook',
    format: 'article',
    tier: 'premium',
    duration: '2 min',
    emoji: '📘',
    content: `
**📘 Algorithme Facebook 2025 : Ce qui a vraiment changé**

**Les 4 signaux les plus importants en 2025 :**

**1. Le "Meaningful Interaction Score"**
Facebook mesure les interactions qui demandent de l'effort : commentaires longs, partages en message privé, réactions autres que "J'aime". Un commentaire = 10 "J'aime" pour l'algorithme.
Stratégie : Terminez chaque post par une vraie question ouverte.

**2. Les Reels sur Facebook**
Contre-intuitif : les Reels Instagram publiés simultanément sur Facebook ont une portée organique 3x supérieure aux Reels Facebook natifs. Activez la publication croisée dans vos paramètres.

**3. Les posts natifs > les liens externes**
Facebook réduit la portée des posts avec des liens vers YouTube, TikTok ou des sites externes. Publiez vos vidéos directement sur Facebook Video.

**4. La fréquence optimale**
1 post/jour maximum. Les pages qui publient plus de 2x/jour subissent une pénalité de portée de 40%.

**Formats qui explosent en 2025 :**
- Carrousels (format natif) : portée +58%
- Vidéo native < 3 minutes : portée +44%
- Posts texte avec forte émotion : partages organiques x3
    `,
    tags: ['facebook', 'algorithme', 'portée', 'organique', 'masterclass'],
    createdAt: '2025-03-10',
  },
];
