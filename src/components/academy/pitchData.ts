/** Secteurs et logique de formatage des pitchs de prospection */

export interface Sector {
  id: string;
  label: string;
  emoji: string;
  blindSpot: string;
  solution: string;
  defaultPitch: string;
}

export const SECTORS: Sector[] = [
  {
    id: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    blindSpot: "perdre des dizaines de réservations chaque weekend parce que vos avis Google ne contiennent pas les mots-clés que l'IA de Google recherche",
    solution: "Kompilot a analysé vos 200 derniers avis, identifié les mots-clés manquants et les a injectés automatiquement dans vos réponses. Résultat : +34 réservations par weekend en 3 semaines.",
    defaultPitch: "J'ai réalisé aujourd'hui qu'on perdait des dizaines de réservations chaque weekend simplement parce que nos avis Google ne contenaient pas les mots-clés que l'IA de Google recherche. Kompilot a tout corrigé en pilote automatique. Plus jamais de siège vide le vendredi soir.",
  },
  {
    id: 'coiffure',
    label: 'Salon de Coiffure',
    emoji: '✂️',
    blindSpot: "croire que votre salon était invisible à cause de l'emplacement, alors qu'en réalité vous gériez votre fiche Google au hasard",
    solution: "Kompilot a automatisé les réponses aux avis et boosté le score GEO de 38 à 74/100 en 45 jours. Résultat : 2x plus de clics \"Itinéraire\" depuis Google Maps.",
    defaultPitch: "On pensait que notre salon était invisible sur les cartes à cause de l'emplacement, alors qu'on gérait juste notre fiche Google au hasard. Kompilot a automatisé nos réponses et boosté notre score GEO. Aujourd'hui on est dans le top 3 sur Google Maps dans notre quartier.",
  },
  {
    id: 'commerce',
    label: 'Commerce de Proximité',
    emoji: '🛒',
    blindSpot: "publier des photos de produits sans jamais utiliser les bons mots-clés locaux — résultat : vos concurrents apparaissent avant vous sur Google",
    solution: "Kompilot génère automatiquement 5 posts hebdomadaires optimisés pour votre zone géographique. +58% de vues en 30 jours.",
    defaultPitch: "J'ai découvert qu'on publiait des photos sans jamais utiliser les mots-clés que Google Maps attend pour notre secteur. Nos concurrents apparaissaient avant nous alors qu'on avait un meilleur produit. Kompilot a automatisé ça et on est maintenant en top 3 local.",
  },
  {
    id: 'beaute',
    label: 'Institut Beauté / Spa',
    emoji: '💆',
    blindSpot: "ne jamais répondre aux avis négatifs — ce qui signale à Google que vous n'êtes pas actif, réduisant votre visibilité locale de 40%",
    solution: "Kompilot surveille les avis 24h/24 et génère une réponse professionnelle en moins de 2h. Note Google passée de 3,8 à 4,6 étoiles en 60 jours.",
    defaultPitch: "On avait des avis négatifs qui restaient sans réponse depuis des semaines. On ne savait pas que ça signalait à Google qu'on n'était pas actif. Kompilot répond automatiquement en moins de 2h. Notre note est passée de 3,8 à 4,6 étoiles.",
  },
  {
    id: 'artisan',
    label: 'Artisan / BTP',
    emoji: '🔧',
    blindSpot: "ne pas avoir de stratégie digitale alors que 78% des clients cherchent un artisan local sur Google avant de téléphoner",
    solution: "Kompilot a optimisé la fiche Google, automatisé la demande d'avis après chaque chantier, et planifié 3 posts hebdomadaires. Résultat : 12 nouveaux devis par mois.",
    defaultPitch: "J'avais une fiche Google créée il y a 5 ans et jamais mise à jour. 78% de mes futurs clients me cherchaient sur Google mais ne me trouvaient pas. Kompilot a tout remis en ordre automatiquement. Maintenant je reçois 12 demandes de devis par mois en plus.",
  },
  {
    id: 'medical',
    label: 'Cabinet Médical',
    emoji: '🏥',
    blindSpot: "perdre des patients parce que votre fiche Google ne reflète pas vos disponibilités réelles",
    solution: "Kompilot centralise la présence sur Google et les annuaires santé, publie automatiquement les créneaux disponibles. Taux de remplissage agenda : +28% en 30 jours.",
    defaultPitch: "On perdait des patients parce que nos disponibilités sur Google et Doctolib n'étaient pas synchronisées. Les gens appellent, voient que c'est complet et ne rappellent pas. Kompilot a synchronisé tout ça automatiquement. Notre taux de remplissage a augmenté de 28%.",
  },
  {
    id: 'immobilier',
    label: 'Agence Immobilière',
    emoji: '🏠',
    blindSpot: "ne pas apparaître dans les réponses IA quand un client demande à ChatGPT ou Gemini \"quelle est la meilleure agence de ma ville\"",
    solution: "Kompilot optimise la présence dans les moteurs IA. L'agence est maintenant citée dans 78% des réponses IA locales sur son secteur.",
    defaultPitch: "J'ai testé ChatGPT : \"Quelle est la meilleure agence immobilière à Lyon 6e ?\" — on n'apparaissait même pas. Nos concurrents, si. Kompilot a corrigé notre visibilité IA en 45 jours. Maintenant on est cités dans les 3 premières réponses.",
  },
  {
    id: 'fitness',
    label: 'Salle de Sport',
    emoji: '💪',
    blindSpot: "perdre des abonnements chaque rentrée faute de campagne de communication automatisée pour convertir les prospects en membres",
    solution: "Kompilot a créé un tunnel complet : posts Instagram ciblés + campagne WhatsApp + demande d'avis. +47 nouveaux membres en septembre.",
    defaultPitch: "Chaque rentrée c'était la même galère : plein de prospects sur Instagram mais personne pour les convertir en abonnés. On n'avait pas de stratégie automatisée. Kompilot a tout mis en place. +47 membres en septembre.",
  },
];

// ── Format helpers ─────────────────────────────────────────────────────────────

export type ExportFormat = 'story' | 'sms' | 'email';

export function formatPitch(pitch: string, format: ExportFormat): string {
  if (format === 'sms') {
    const short = pitch.split('. ').slice(0, 2).join('. ') + '.';
    return short.length > 300 ? short.substring(0, 297) + '...' : short;
  }
  if (format === 'email') {
    return `Objet : Comment [Nom Commerce] a corrigé son angle mort digital en moins de 45 jours\n\nBonjour,\n\n${pitch}\n\nÇa m'a pris moins d'une heure à configurer avec Kompilot.\n\nVous voulez voir comment ça fonctionne pour votre activité ?\n\n👉 Répondez simplement "OUI" à ce message — je vous envoie une démo personnalisée gratuite.\n\nÀ bientôt,\n[Votre prénom]`;
  }
  return `${pitch}\n\n#Kompilot #VisibilitéLocale #GoogleMaps #GEO #PiloteAutomatique`;
}

export const PITCH_AI_SYSTEM = `Tu es un expert en copywriting de prospection commerciale pour les agences qui revendent Kompilot.
Ta formule est : "Découverte de l'angle mort (problème invisible) + Solution automatisée Kompilot = Fin du pilotage au hasard".
Le pitch doit sembler authentique, comme un témoignage réel d'un commerçant — en 3-4 phrases max.
Ton : direct, percutant, première personne, sans jargon technique.
N'utilise pas de hashtags. Ne mentionne pas les prix.`;
