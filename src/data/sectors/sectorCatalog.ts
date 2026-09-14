export type OfficialSector = 'restaurant' | 'artisan' | 'beaute' | 'sante' | 'immobilier' | 'commerce'

export interface DemoReview {
  author: string
  rating: 4 | 5
  text: string
  response: string
  age: string
}

export interface DemoPost {
  title: string
  text: string
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Google Business'
  format: string
}

export interface SectorProfile {
  id: OfficialSector
  label: string
  shortLabel: string
  emoji: string
  businessName: string
  city: string
  description: string
  hook: string
  imageTheme: string
  defaultImage: string
  googleRating: number
  googleViewsChange: number
  hoursSaved: number
  alert: string
  alertDetail: string
  geoScore: number
  geoQueries: string[]
  reviewSources: string[]
  reviewTopics: string[]
  reviews: DemoReview[]
  posts: DemoPost[]
  kpis: Array<{ label: string; value: string; change: string }>
  ctas: string[]
  contentPillars: string[]
  sensitiveTopics: string[]
}

const profiles: Record<OfficialSector, SectorProfile> = {
  restaurant: {
    id: 'restaurant', label: 'Restaurants, Cafés & Bars', shortLabel: 'Restaurant', emoji: '🍽️', businessName: 'La Table des Halles', city: 'Lyon 2e',
    description: 'Un restaurant de quartier reconnu pour sa cuisine de saison et son accueil chaleureux.', hook: 'Une table généreuse, juste au cœur de Lyon.', imageTheme: 'linear-gradient(135deg, #3b2117 0%, #8a4b2d 55%, #d89b61 100%)', defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85', googleRating: 4.8, googleViewsChange: 52, hoursSaved: 6, alert: 'Nouvel avis 5 étoiles détecté sur votre fiche Google', alertDetail: 'La réponse IA est prête à valider · mentionne votre menu de saison et Lyon 2e.', geoScore: 86, geoQueries: ['meilleur restaurant à Lyon 2e', 'brunch près de moi', 'restaurant ouvert ce soir à Lyon'], reviewSources: ['Google Business Profile', 'TheFork', 'Tripadvisor'], reviewTopics: ['plats', 'service', 'ambiance', 'réservation'],
    reviews: [
      { author: 'Élodie M.', rating: 5, age: 'il y a 2 jours', text: 'Une très belle découverte. Les produits sont frais, les assiettes généreuses et le service vraiment attentionné.', response: 'Merci beaucoup Élodie pour ce retour chaleureux ! Toute l’équipe de La Table des Halles est ravie que nos produits de saison et notre accueil vous aient plu. Au plaisir de vous recevoir à nouveau à Lyon 2e.', },
      { author: 'Nicolas P.', rating: 4, age: 'il y a 5 jours', text: 'Très bon repas et cadre agréable. Un peu d’attente entre les plats, mais une équipe souriante.', response: 'Merci Nicolas pour votre retour précis. Nous sommes heureux que la cuisine et l’ambiance vous aient plu. Nous travaillons à fluidifier le service aux heures de pointe et espérons vous revoir bientôt à Lyon 2e.', },
      { author: 'Sarah T.', rating: 5, age: 'il y a 8 jours', text: 'Le menu du marché était excellent, avec une vraie attention aux produits locaux.', response: 'Merci Sarah ! Le menu du marché est imaginé chaque semaine avec nos producteurs locaux. Votre recommandation compte beaucoup pour toute l’équipe.', },
    ],
    posts: [{ title: 'Le plat du marché', text: 'Cette semaine, notre chef compose une assiette autour des légumes du marché lyonnais. Réservez votre table pour découvrir le menu de saison.', platform: 'Instagram', format: 'Photo du plat' }, { title: 'Une adresse pour ce soir', text: 'Envie d’un dîner chaleureux à Lyon 2e ? La Table des Halles vous accueille ce soir avec une carte courte et des produits frais.', platform: 'Google Business', format: 'Actualité locale' }],
    kpis: [{ label: 'Réservations générées', value: '184', change: '+31%' }, { label: 'Clics itinéraire', value: '692', change: '+48%' }, { label: 'Taux de réponse', value: '100%', change: '0 avis en attente' }], ctas: ['Réserver une table', 'Voir la carte'], contentPillars: ['Menu de saison', 'Coulisses du chef', 'Producteurs locaux'], sensitiveTopics: ['allergie', 'hygiène', 'intoxication'],
  },
  artisan: {
    id: 'artisan', label: 'Artisans & BTP', shortLabel: 'Artisan', emoji: '🔧', businessName: 'Atelier Durand Rénovation', city: 'Nantes', description: 'Une entreprise de rénovation locale qui transforme les projets en chantiers sereins.', hook: 'Des travaux bien faits, du premier devis à la dernière finition.', imageTheme: 'linear-gradient(135deg, #17212b 0%, #29566a 55%, #c88a42 100%)', defaultImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=85', googleRating: 4.9, googleViewsChange: 44, hoursSaved: 7, alert: 'Pic de demandes de devis détecté dans votre zone', alertDetail: 'Nantes et Saint-Herblain recherchent actuellement votre spécialité.', geoScore: 82, geoQueries: ['entreprise de rénovation à Nantes', 'artisan rénovation près de moi', 'plombier recommandé Nantes'], reviewSources: ['Google Business Profile', 'PagesJaunes', 'Houzz'], reviewTopics: ['devis', 'délais', 'chantier', 'propreté'],
    reviews: [{ author: 'Thomas R.', rating: 5, age: 'il y a 1 jour', text: 'Devis clair, équipe ponctuelle et chantier laissé parfaitement propre. Le résultat dépasse nos attentes.', response: 'Merci Thomas pour votre confiance ! Atelier Durand Rénovation accorde une grande importance à la clarté des devis, au respect des délais et à la propreté du chantier. Nous sommes heureux de vous accompagner à Nantes.', }, { author: 'Claire B.', rating: 4, age: 'il y a 6 jours', text: 'Très bon travail sur la salle de bain. Le chantier a pris deux jours de plus que prévu.', response: 'Merci Claire pour votre retour. Nous sommes ravis de la qualité finale de votre rénovation de salle de bain et entendons votre remarque sur le délai. Nous continuons d’améliorer le suivi de chantier pour nos clients nantais.', }],
    posts: [{ title: 'Avant / après rénovation', text: 'D’une salle de bain datée à un espace lumineux et fonctionnel. Découvrez les étapes de cette rénovation réalisée à Nantes.', platform: 'Instagram', format: 'Carrousel avant/après' }, { title: 'Le conseil de l’artisan', text: 'Avant de lancer vos travaux, demandez toujours un devis détaillé : matériaux, étapes, délais et garanties doivent être clairement indiqués.', platform: 'LinkedIn', format: 'Conseil expert' }],
    kpis: [{ label: 'Demandes de devis', value: '38', change: '+42%' }, { label: 'Appels qualifiés', value: '71', change: '+36%' }, { label: 'Délai moyen de réponse', value: '18 min', change: '-24%' }], ctas: ['Demander un devis', 'Être rappelé'], contentPillars: ['Avant / après', 'Conseils travaux', 'Chantiers locaux'], sensitiveTopics: ['malfaçon', 'sécurité', 'facture'],
  },
  beaute: {
    id: 'beaute', label: 'Coiffeurs, Instituts & Bien-être', shortLabel: 'Beauté', emoji: '💇', businessName: 'Maison Éclat', city: 'Bordeaux', description: 'Un salon de beauté chaleureux où chaque rendez-vous devient un moment pour soi.', hook: 'Révélez votre éclat, naturellement.', imageTheme: 'linear-gradient(135deg, #3b1f2b 0%, #8f4d63 55%, #e5b3a6 100%)', defaultImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85', googleRating: 4.9, googleViewsChange: 58, hoursSaved: 5, alert: 'Votre meilleur créneau vient de se libérer aujourd’hui', alertDetail: 'L’IA suggère une publication locale pour remplir ce rendez-vous.', geoScore: 89, geoQueries: ['meilleur coiffeur à Bordeaux', 'institut de beauté près de moi', 'balayage Bordeaux'], reviewSources: ['Google Business Profile', 'Planity', 'Treatwell'], reviewTopics: ['prestation', 'accueil', 'résultat', 'ponctualité'],
    reviews: [{ author: 'Camille D.', rating: 5, age: 'il y a 3 jours', text: 'Un diagnostic couleur très professionnel et un résultat exactement comme je l’espérais. Merci pour l’écoute !', response: 'Merci Camille pour ce joli retour ! Chez Maison Éclat à Bordeaux, nous prenons le temps d’écouter chaque envie avant de créer une couleur personnalisée. À très bientôt pour votre prochain rendez-vous.', }, { author: 'Manon L.', rating: 4, age: 'il y a 6 jours', text: 'Très belle prestation et équipe adorable. J’ai attendu quelques minutes, mais le résultat est superbe.', response: 'Merci Manon pour votre confiance et votre indulgence. Nous sommes ravis que votre prestation vous plaise et veillons à réduire l’attente pour rendre chaque visite chez Maison Éclat encore plus agréable.', }],
    posts: [{ title: 'Transformation couleur', text: 'Un balayage lumineux pensé pour accompagner le mouvement naturel des cheveux. Diagnostic personnalisé sur rendez-vous à Bordeaux.', platform: 'Instagram', format: 'Avant / après' }, { title: 'Une place s’est libérée', text: 'Une disponibilité de dernière minute est ouverte aujourd’hui chez Maison Éclat. Réservez votre créneau en ligne.', platform: 'Google Business', format: 'Disponibilité locale' }],
    kpis: [{ label: 'Rendez-vous générés', value: '126', change: '+39%' }, { label: 'Clics réservation', value: '418', change: '+57%' }, { label: 'Taux de remplissage', value: '91%', change: '+12%' }], ctas: ['Réserver en ligne', 'Voir les disponibilités'], contentPillars: ['Transformations', 'Conseils beauté', 'Coulisses du salon'], sensitiveTopics: ['allergie', 'hygiène', 'résultat'],
  },
  sante: {
    id: 'sante', label: 'Professions de Santé & Cabinets', shortLabel: 'Santé', emoji: '🩺', businessName: 'Cabinet Rivière Santé', city: 'Lille', description: 'Un cabinet pluridisciplinaire qui facilite l’accès à une information claire et rassurante.', hook: 'Des informations fiables pour préparer votre rendez-vous.', imageTheme: 'linear-gradient(135deg, #123b44 0%, #2b7775 55%, #b2d9c5 100%)', defaultImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85', googleRating: 4.8, googleViewsChange: 37, hoursSaved: 6, alert: 'Un nouvel avis Google mentionne la qualité de votre accueil', alertDetail: 'La réponse proposée reste générale et protège la confidentialité du patient.', geoScore: 84, geoQueries: ['cabinet de santé à Lille', 'kinésithérapeute près de moi', 'prendre rendez-vous santé Lille'], reviewSources: ['Google Business Profile', 'Doctolib', 'Maiia'], reviewTopics: ['accueil', 'attente', 'accessibilité', 'rendez-vous'],
    reviews: [{ author: 'Nathalie G.', rating: 5, age: 'il y a 2 jours', text: 'Cabinet très bien organisé, accueil attentif et informations claires avant le rendez-vous.', response: 'Merci Nathalie pour votre retour. Toute l’équipe du Cabinet Rivière Santé est heureuse que l’accueil et les informations pratiques vous aient aidée. Pour toute question concernant votre suivi, notre secrétariat reste à votre écoute.', }, { author: 'Marc A.', rating: 4, age: 'il y a 7 jours', text: 'Professionnel très à l’écoute. Le rendez-vous a commencé avec un peu de retard.', response: 'Merci Marc pour votre confiance et votre retour. Nous sommes heureux que l’écoute et l’accompagnement vous aient satisfait. Nous faisons notre possible pour respecter les horaires tout en prenant le temps nécessaire pour chaque rendez-vous.', }],
    posts: [{ title: 'Préparer son rendez-vous', text: 'Pour faciliter votre consultation, pensez à noter vos questions et à apporter les documents utiles. Notre secrétariat vous guide avant votre rendez-vous.', platform: 'LinkedIn', format: 'Information pratique' }, { title: 'Horaires du cabinet', text: 'Le Cabinet Rivière Santé vous accueille à Lille sur rendez-vous. Consultez nos horaires et préparez votre venue en toute sérénité.', platform: 'Google Business', format: 'Information locale' }],
    kpis: [{ label: 'Clics rendez-vous', value: '94', change: '+35%' }, { label: 'Appels cabinet', value: '142', change: '+41%' }, { label: 'Réponses conformes', value: '100%', change: 'confidentialité préservée' }], ctas: ['Prendre rendez-vous', 'Appeler le cabinet'], contentPillars: ['Information pratique', 'Cabinet & équipe', 'Parcours rendez-vous'], sensitiveTopics: ['diagnostic', 'urgence', 'donnée de santé'],
  },
  immobilier: {
    id: 'immobilier', label: 'Agences Immobilières & Mandataires', shortLabel: 'Immobilier', emoji: '🏡', businessName: 'Agence Horizon Lille', city: 'Lille', description: 'Une agence ancrée dans ses quartiers, de l’estimation à la remise des clés.', hook: 'Le bon projet commence par une connaissance précise du quartier.', imageTheme: 'linear-gradient(135deg, #172435 0%, #38627a 55%, #d3ad6a 100%)', defaultImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=85', googleRating: 4.7, googleViewsChange: 46, hoursSaved: 8, alert: 'Hausse des recherches d’estimation dans votre secteur', alertDetail: 'Les quartiers de Lille-Centre et Vauban concentrent les nouvelles intentions.', geoScore: 81, geoQueries: ['agence immobilière à Lille', 'estimation maison Lille', 'agent immobilier près de moi'], reviewSources: ['Google Business Profile', 'Bien’ici', 'SeLoger'], reviewTopics: ['accompagnement', 'estimation', 'disponibilité', 'transaction'],
    reviews: [{ author: 'Julien V.', rating: 5, age: 'il y a 2 jours', text: 'Une équipe disponible et très claire sur chaque étape de la vente. Leur connaissance du quartier a fait la différence.', response: 'Merci Julien pour votre confiance ! Chez Agence Horizon Lille, nous sommes heureux d’avoir pu vous accompagner avec transparence et une connaissance fine du marché local. Nous vous souhaitons une belle continuation dans votre nouveau projet.', }, { author: 'Sophie R.', rating: 4, age: 'il y a 9 jours', text: 'Très bon suivi de dossier. J’aurais aimé recevoir quelques nouvelles plus régulièrement.', response: 'Merci Sophie pour ce retour constructif. Nous sommes ravis de la qualité globale de votre accompagnement et prenons note de votre remarque sur la fréquence des nouvelles. Elle nous aide à améliorer encore le suivi de nos clients lillois.', }],
    posts: [{ title: 'Vendu dans le quartier', text: 'Un nouveau projet abouti à Lille-Centre. Estimation, stratégie de mise en valeur et accompagnement jusqu’à la signature : chaque étape compte.', platform: 'LinkedIn', format: 'Étude de cas locale' }, { title: 'Estimer son bien', text: 'Vous envisagez de vendre à Lille ? Une estimation précise commence par l’analyse du quartier, de l’état du bien et du marché actuel.', platform: 'Facebook', format: 'Conseil vendeur' }],
    kpis: [{ label: 'Demandes d’estimation', value: '42', change: '+47%' }, { label: 'Visites planifiées', value: '28', change: '+29%' }, { label: 'Leads qualifiés', value: '63', change: '+38%' }], ctas: ['Demander une estimation', 'Planifier une visite'], contentPillars: ['Marché local', 'Biens & mandats', 'Conseils projet'], sensitiveTopics: ['discrimination', 'honoraires', 'litige'],
  },
  commerce: {
    id: 'commerce', label: 'Commerces de détail & Boutiques', shortLabel: 'Commerce', emoji: '🛍️', businessName: 'L’Atelier Central', city: 'Tours', description: 'Une boutique locale qui mêle sélection pointue, conseils humains et vie de quartier.', hook: 'Des trouvailles qui ont une histoire, juste à côté de chez vous.', imageTheme: 'linear-gradient(135deg, #392b1b 0%, #967044 55%, #e2c48d 100%)', defaultImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85', googleRating: 4.8, googleViewsChange: 55, hoursSaved: 5, alert: 'Nouvel arrivage tendance détecté dans votre calendrier éditorial', alertDetail: 'L’IA propose un post nouveauté et une publication “stock disponible”.', geoScore: 87, geoQueries: ['boutique locale à Tours', 'magasin près de moi ouvert aujourd’hui', 'acheter localement à Tours'], reviewSources: ['Google Business Profile', 'Facebook', 'site e-commerce'], reviewTopics: ['conseil', 'disponibilité', 'horaires', 'retour'],
    reviews: [{ author: 'Anaïs C.', rating: 5, age: 'il y a 1 jour', text: 'Une sélection originale et des conseils adorables. On prend le temps de vous aider sans pousser à l’achat.', response: 'Merci Anaïs pour ce retour qui nous touche ! L’Atelier Central aime faire découvrir des pièces choisies avec soin et prendre le temps de conseiller chaque visiteur à Tours. À bientôt en boutique.', }, { author: 'Hugo F.', rating: 4, age: 'il y a 4 jours', text: 'Très belle boutique. Dommage que certains produits vus en ligne n’étaient plus disponibles en rayon.', response: 'Merci Hugo pour votre remarque. Nous sommes heureux que la boutique vous plaise et travaillons à mieux afficher les disponibilités entre notre site et le magasin. N’hésitez pas à nous appeler avant votre visite à Tours.', }],
    posts: [{ title: 'Nouvel arrivage', text: 'Les nouveautés viennent d’arriver à L’Atelier Central. Passez découvrir notre sélection et demandez conseil à notre équipe en boutique à Tours.', platform: 'Instagram', format: 'Carrousel nouveautés' }, { title: 'Disponible en boutique', text: 'Une sélection locale, des idées cadeaux et un conseil personnalisé : venez nous rendre visite cette semaine au cœur de Tours.', platform: 'Google Business', format: 'Actualité boutique' }],
    kpis: [{ label: 'Itinéraires demandés', value: '286', change: '+55%' }, { label: 'Clics produits', value: '173', change: '+43%' }, { label: 'Visites estimées', value: '1 240', change: '+35%' }], ctas: ['Voir les nouveautés', 'Venir en boutique'], contentPillars: ['Nouveautés', 'Conseils produits', 'Vie de quartier'], sensitiveTopics: ['produit défectueux', 'commande', 'remboursement'],
  },
}

export const SECTOR_CATALOG = profiles
export const OFFICIAL_SECTORS = Object.values(profiles)

export const SECTOR_LABELS: Record<OfficialSector, string> = Object.fromEntries(
  OFFICIAL_SECTORS.map((profile) => [profile.id, profile.shortLabel]),
) as Record<OfficialSector, string>

export const LEGACY_SECTOR_MAP: Record<string, OfficialSector> = {
  beauty: 'beaute', beaute: 'beaute', wellness: 'beaute', medical: 'sante', sante: 'sante', restaurant: 'restaurant', auto: 'artisan', artisan: 'artisan', commerce: 'commerce', immobilier: 'immobilier',
}

export function normalizeOfficialSector(value?: string | null): OfficialSector {
  return (value && LEGACY_SECTOR_MAP[value.toLowerCase()]) || 'commerce'
}
