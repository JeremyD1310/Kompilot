/**
 * SectorizedFAQ — FAQ adaptative par profil métier.
 * Affiche des questions spécifiques au masterProfile de l'utilisateur.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, HelpCircle, AlertTriangle, ChevronDown, 
  MessageCircle, LifeBuoy, Zap, Sparkles
} from 'lucide-react';
import { useUserProfile } from '../../context/UserProfileContext';
import { useLexicon } from '../../hooks/useLexicon';
import { Button, Input, Badge } from '@blinkdotnew/ui';

interface SectorizedFAQProps {
  open?: boolean;
  onClose?: () => void;
}

const FAQ_DATA: Record<string, { category: string; questions: { q: string; a: string }[] }[]> = {
  flux: [
    {
      category: "Anti-No Show",
      questions: [
        { q: "Comment activer l'empreinte bancaire ?", a: "Allez dans Paramètres > Paiements et activez l'option 'Empreinte de garantie'." },
        { q: "Que se passe-t-il si un client ne vient pas ?", a: "Vous pouvez déclencher le prélèvement manuel de l'empreinte depuis votre tableau de bord." },
        { q: "Comment libérer une empreinte ?", a: "Les empreintes sont automatiquement libérées après le passage du client ou manuellement si besoin." }
      ]
    },
    {
      category: "Météo & Événements",
      questions: [
        { q: "Comment fonctionne l'alerte météo ?", a: "Kompilot analyse les prévisions et vous suggère des posts adaptés (ex: terrasse s'il fait beau)." },
        { q: "Puis-je désactiver les suggestions d'événements ?", a: "Oui, dans Paramètres > Préférences d'IA." }
      ]
    }
  ],
  chantier: [
    {
      category: "Acomptes BTP",
      questions: [
        { q: "L'acompte BTP est-il légal ?", a: "Oui, il est fortement recommandé pour sécuriser vos déplacements et réservations de créneaux." },
        { q: "Comment gérer un litige Stripe pour déplacement ?", a: "Stripe gère les preuves de passage. Kompilot archive vos photos de chantier comme preuve." },
        { q: "Quid des frais de déplacement annulés ?", a: "Vous pouvez configurer une retenue automatique en cas d'annulation tardive." }
      ]
    },
    {
      category: "Photos & IA",
      questions: [
        { q: "Comment qualifier un chantier par photo ?", a: "L'IA analyse les dimensions et l'état des surfaces pour pré-remplir vos fiches chantiers." },
        { q: "L'IA peut-elle générer un devis ?", a: "Elle génère un brouillon structuré que vous devez valider avant envoi." }
      ]
    }
  ],
  services_b2b: [
    {
      category: "Leads & Contrats",
      questions: [
        { q: "Comment configurer le formulaire IA de qualification ?", a: "Rendez-vous dans Website Widget > Qualification Leads pour définir vos questions." },
        { q: "Comment programmer les relances automatiques ?", a: "Utilisez le module CRM pour définir des séquences de relance par email ou SMS." }
      ]
    },
    {
      category: "Réputation Corporate",
      questions: [
        { q: "Comment améliorer mon score de confiance pro ?", a: "Augmentez votre volume d'avis certifiés et optimisez votre profil LinkedIn via le Cockpit." }
      ]
    }
  ],
  produits: [
    {
      category: "Coupons Flash",
      questions: [
        { q: "Comment créer un coupon surstock ?", a: "Sélectionnez vos produits, fixez la remise, et l'IA génère la campagne SMS/Social." },
        { q: "Comment mesurer le ROI d'un coupon ?", a: "Le tableau de bord 'Produits' traque l'utilisation des codes promo en temps réel." }
      ]
    },
    {
      category: "Avis Produits",
      questions: [
        { q: "Comment analyser les avis par produit ?", a: "L'IA regroupe les feedbacks par référence pour identifier les points d'amélioration." }
      ]
    }
  ],
  agence: [
    {
      category: "Marque Blanche",
      questions: [
        { q: "Comment téléverser mon logo ?", a: "Dans Paramètres Agence > Branding, importez vos logos light/dark." },
        { q: "Comment configurer un domaine personnalisé ?", a: "Ajoutez un CNAME dans vos DNS pointant vers app.kompilot.com." }
      ]
    },
    {
      category: "Sous-comptes",
      questions: [
        { q: "Comment créer un sous-compte client ?", a: "Depuis le dashboard Agence, cliquez sur 'Ajouter un client' et suivez le wizard." },
        { q: "Comment générer un rapport G.E.O. ?", a: "Allez dans l'onglet Analytics du client et cliquez sur 'Exporter Rapport G.E.O.'." }
      ]
    }
  ]
};

const SOS_QUESTIONS = [
  { 
    q: "Que se passe-t-il quand je clique sur SOS Crise ?", 
    a: "Le mode SOS envoie immédiatement une alerte à vos clients avec un message personnalisé, libère toutes les empreintes bancaires en attente, et active un statut de fermeture temporaire dans Google." 
  },
  { 
    q: "Puis-je personnaliser le message SOS ?", 
    a: "Oui, depuis Paramètres > Mode SOS, vous pouvez pré-configurer le message." 
  }
];

const V2V3_QUESTIONS = [
  {
    q: "Mes données financières sont-elles partagées avec mes concurrents ?",
    a: "Absolument pas. Toutes les données sont chiffrées, agrégées et totalement anonymisées. Le Kompilot Index sert uniquement à vous donner les tendances de performance de votre marché pour vous aider à optimiser vos marges. Chaque établissement opère dans un espace isolé et chiffré : aucune donnée individuelle (chiffre d'affaires, no-show, nom du commerce) n'est partagée, ni même techniquement accessible à un concurrent. Seuls des agrégats sectoriels anonymisés sont utilisés, conformément au RGPD.",
  },
  {
    q: "Comment fonctionne l'import par URL lors de l'inscription ?",
    a: "Collez l'URL de votre site internet ou de votre fiche Google sur la page d'inscription. L'IA analyse les données publiques et pré-remplit automatiquement votre secteur d'activité, le nom de votre commerce, vos services et votre couleur principale. Aucune donnée privée n'est collectée. Si l'URL n'est pas accessible, cliquez sur 'Saisir manuellement'.",
  },
  {
    q: "Est-ce que Kompilot respecte le RGPD quand il analyse mon site web ?",
    a: "Oui. L'analyse URL se limite aux données publiques déjà indexées par Google. Aucun cookie, identifiant ou donnée personnelle n'est collecté. Le résultat sert uniquement à pré-configurer votre interface et n'est jamais stocké ou partagé.",
  },
  {
    q: "Comment activer le thème sombre Obsidian & Gold ?",
    a: "Allez dans Paramètres > Apparence > Thème Élite. Activez le mode 'Obsidian & Gold' : fond noir profond + accents or mat. Ce thème est idéal pour économiser la batterie sur écrans OLED et améliore la lisibilité en extérieur sur chantier.",
  },
  {
    q: "Comment fonctionne la vitesse d'exécution instantanée (Optimistic UI) en zone réseau faible ?",
    a: "Chaque action (valider un coupon, sauvegarder une note, activer une relance) applique immédiatement l'état visuel de réussite sur votre écran, sans attendre la réponse du serveur. Si le réseau est lent, l'action est synchronisée dès que la connexion revient. En cas d'erreur définitive, un retour arrière automatique s'effectue avec une notification discrète.",
  },
  {
    q: "Mon agenda est saturé — comment l'IA m'aide à augmenter mes tarifs ?",
    a: "Dans Croissance > Moteur de Rendement, si votre taux d'occupation dépasse 85%, l'IA génère un conseil maïeutique personnalisé : augmentation tarifaire de 10-25% sur les créneaux de pointe, ou élévation du montant d'empreinte Stripe pour filtrer les clients moins rentables. Vous gardez le contrôle total sur chaque décision.",
  },
  {
    q: "Comment les agences utilisent le Live Cloning Engine pour closer des prospects ?",
    a: "Dans l'espace Agence, saisissez le nom d'un prospect (et optionnellement son URL). L'IA génère en 10 secondes : score GEO estimé, perte de CA mensuelle estimée, liste des faiblesses digitales et un script de closing maïeutique avec question rhétorique. Le lien de démo personnalisé se copie en 1 clic pour être envoyé au prospect.",
  },
  {
    q: "Comment fonctionne le Kompilot Index et comment dépasser la moyenne de mon secteur ?",
    a: "Le Kompilot Index compare vos gains financiers (No-Show bloqués, DMs convertis, avis collectés) avec la médiane anonymisée des professionnels de votre secteur et zone géographique. Si vous êtes sous la moyenne, le Mentor IA identifie automatiquement le levier le plus rentable à activer en priorité — et vous propose de l'activer en un clic. Accédez-y dans l'onglet Croissance > Kompilot Index."
  },
  {
    q: "Que signifie 'Privilège client honoré' affiché sur l'écran caissier ?",
    a: "C'est le message premium qui s'affiche à chaque validation réussie d'un coupon. Il est conçu pour valoriser le travail des équipes en temps réel et ancrer positivement chaque transaction. Le montant exact de CA enregistré s'affiche en complément. L'animation dorée subtile est volontairement discrète — sans effet casino.",
  },
  {
    q: "Pourquoi Kompilot affiche une animation dorée quand je valide un coupon en caisse ?",
    a: "Cette animation — scintillement or mat et message 'Privilège client honoré. Trésorerie augmentée de X €.' — est conçue pour valoriser chaque gain financier en temps réel sur l'écran caissier. Elle rappelle aux équipes terrain que chaque coupon scanné a un impact direct et mesurable sur la trésorerie. Le but est de créer une récompense visuelle positive : le travail opérationnel quotidien est directement connecté à la santé financière de l'établissement. C'est une micro-célébration, pas une distraction.",
  },
  {
    q: "Que se passe-t-il sur le tableau de bord quand un no-show est récupéré ou un devis relancé est signé ?",
    a: "Le compteur 'No-Show bloqués' et le widget 'Chiffre d'Affaires Sécurisé' sur le tableau de bord se mettent à jour avec le montant récupéré. Une notification premium s'affiche automatiquement : 'Bouclier activé. [X]€ de chiffre d'affaires qui restent là où ils doivent être : chez vous.' Cela rend visible et gratifiant un gain qui, sans Kompilot, serait passé inaperçu — le temps perdu sur un RDV fantôme ou un devis sans suite.",
  },
  {
    q: "Comment l'écran caissier aide mes employés à comprendre l'impact de leur travail ?",
    a: "L'écran caissier Terminal (accessible sur /caissier) est conçu pour être utilisé par les équipes en contact direct avec les clients. Chaque coupon validé déclenche un retour visuel immédiat : animation dorée + message de valorisation avec le montant exact. Cela crée un ancrage positif : l'employé comprend en temps réel que son action a un impact financier mesurable. La configuration (panier moyen, taux de conversion) est paramétrable par le gérant dans l'onglet ⚙️ du terminal.",
  },
  {
    q: "Comment lancer un test A/B sur une offre flash depuis Kompilot ?",
    a: "Dans l'onglet Croissance > Experimentation Engine, sélectionnez 'Coupons / Offres'. Définissez la Variante A (ex: -20% bienvenue) et la Variante B (ex: livraison offerte). Kompilot diffuse chaque variante à 50% de votre audience pendant 48h. L'IA déclare automatiquement le gagnant dès qu'une variante affiche +15% de conversions. Cliquez 'Appliquer le gagnant' pour basculer toute la diffusion sur la variante victorieuse.",
  },
  {
    q: "Comment le test A/B mesure-t-il la rentabilité réelle et non juste les clics ?",
    a: "Kompilot mesure le taux de conversion en CA réel : chaque coupon scanné en caisse est tracé jusqu'à son montant. Le calcul est : (CA généré variante X / budget alloué variante X) comparé à l'autre variante. Un test est statistiquement significatif à partir de 30 conversions par variante. En dessous, le système affiche 'Données insuffisantes' et recommande d'étendre la durée du test.",
  },
  {
    q: "Comment configurer le Brand Book IA pour protéger mon image de marque ?",
    a: "Accédez à Communication > Brand Shield > Brand Book IA. Définissez : le ton de voix (ex: Premium & Élégant), les mots interdits (ex: 'promo', 'pas cher'), votre promesse de marque (ex: 'L'excellence artisanale accessible'), votre audience cible et vos phrases types. L'IA intègre ces règles dans tous les posts générés, les réponses aux avis et les scripts d'outreach. Un aperçu de charte s'affiche en temps réel.",
  },
  {
    q: "Comment la Cellule de Crise Réputationnelle détecte-t-elle les signaux négatifs ?",
    a: "Le système analyse en continu vos avis Google (notes < 3/5), vos commentaires Instagram et Facebook (mots-clés négatifs : 'déçu', 'mauvais', 'qualité', 'jamais rappelé'). Dès qu'un signal est détecté, une notification est envoyée et une réponse maïeutique est générée : elle valide le ressenti du client, l'invite à un échange privé et préserve l'autorité publique de votre établissement. Aucune réponse défensive — uniquement une communication haute-gamme.",
  },
  {
    q: "Qu'est-ce qu'une réponse maïeutique et pourquoi est-elle plus efficace qu'une réponse classique ?",
    a: "Une réponse maïeutique (inspirée de la méthode socratique) pose des questions ouvertes pour faire exprimer le client plutôt que de contre-argumenter. Elle réduit l'escalade publique, montre l'empathie et déplace la conversation en privé. Résultat : 73% des avis négatifs qui reçoivent une réponse maïeutique sont soit retirés, soit accompagnés d'un avis positif ultérieur (source : études plateformes review).",
  },
  {
    q: "Comment générer un script d'outreach pour démarcher un influenceur ou partenaire local ?",
    a: "Dans Communication > Relations Locales, choisissez le type de cible (Partenaire Local, Influenceur de Zone, Micro-Média). Renseignez le nom, le contexte et la valeur proposée (échange de visibilité, commission, invitation exclusive). L'IA génère un script en français élégant, sans ton commercial agressif, avec un CTA doux. Cliquez 'Copier le script' pour l'envoyer directement via votre messagerie.",
  },
  {
    q: "Est-ce que l'IA peut publier ou envoyer des messages sans que je le demande ?",
    a: "Jamais. Kompilot applique un principe de Contrôle Total : toute action générée automatiquement (réponse de crise, campagne CRM, publication anti-vide) est d'abord placée dans votre File d'attente de visa ⚡ (bouton en bas à droite). Vous lisez la carte, vous appuyez sur Approuver ou Refuser. Aucune diffusion externe ne s'effectue sans votre validation humaine. C'est une garantie de sécurité pour les profils Agences et Grands Comptes.",
  },
  {
    q: "Comment fonctionne la File d'attente de validation IA (Guardrail Queue) ?",
    a: "Le bouton '⚡ Actions en attente' (coin bas-droit) ouvre le panneau de visa. Chaque carte affiche : le type d'action (crise, CRM, publication), l'aperçu du contenu généré, le canal cible et l'heure de génération. Deux boutons : Approuver (diffuse immédiatement) ou Refuser (supprime). Vous pouvez aussi tout approuver en une fois. Ce panneau est le seul point de passage avant toute exécution externe.",
  },
  {
    q: "Qu'est-ce que la Séquence de Conversion et comment lire mon attribution ?",
    a: "La Séquence de Conversion est un graphique visible sur votre Dashboard qui retrace les 4 points de contact Kompilot ayant mené à l'encaissement : Référencement Local (GEO) ➔ Réseaux Sociaux ➔ Message Direct (DM) ➔ Caissier. Chaque étape affiche le chiffre d'affaires attribué et le pourcentage des conversions. En dessous, l'IA identifie votre canal le plus rentable du mois et formule une recommandation maïeutique pour amplifier ce levier.",
  },
  {
    q: "Comment exporter un rapport de rentabilité en 1 page pour mon client ou mon associé ?",
    a: "Depuis Croissance > Rapport de Tendance Sectorielle (compte Agency) ou depuis l'onglet Analyses & ROI > bouton Exporter (tous comptes), vous générez un résumé exécutif 1 page incluant : CA sécurisé, no-shows bloqués, meilleur canal du mois, taux de rétention et recommandation prioritaire. Format PDF, données anonymisées et conformes RGPD. Idéal pour présenter vos résultats en moins de 2 minutes.",
  },
  {
    q: "Comment Kompilot suit-il le retour sur investissement (ROI) de mes actions ?",
    a: "Ici, on ne suit pas les likes inutiles. Chaque euro généré par un coupon, sauvé par un blocage de no-show ou activé par une relance IA est tracé en direct sur votre écran principal. Le widget 'Chiffre d'Affaires Sécurisé / Généré' totalise en temps réel : (1) les pénalités no-show encaissées via Stripe, (2) la valeur des coupons validés en caisse, (3) les estimations de devis relancés par l'IA. Chaque euro est attribué à l'action Kompilot qui l'a généré. C'est de la comptabilité de croissance, pas de la vanité metric.",
  },
  {
    q: "Puis-je couper les notifications de Kompilot ?",
    a: "Oui, mais Kompilot n'envoie aucune notification inutile ou publicitaire. Vous ne recevez des alertes que lorsque du chiffre d'affaires est directement en jeu ou à sécuriser : empreinte Stripe manquante sur un RDV imminent, note client arrivant à échéance de relance, ou coordonnée capturée via Comment-to-DM. Pour désactiver ou personnaliser : Paramètres > Notifications > Alertes de trésorerie. Chaque type d'alerte (No-Show, CRM, Social) peut être activé ou désactivé indépendamment.",
  },
  {
    q: "Quelles sont les 3 types d'alertes financières push que Kompilot envoie ?",
    a: "Kompilot envoie exclusivement des alertes à valeur financière directe : (1) Alerte Anti No-Show — si une empreinte bancaire Stripe est manquante sur un rendez-vous dans les prochaines 24h. (2) Opportunité CRM — dès qu'une note client intelligente arrive à échéance de relance (ex: fin de chantier, renouvellement contrat). (3) Conversion Sociale — notification récapitulative dès qu'un lead Comment-to-DM capture une coordonnée client (email/téléphone). Chaque notification inclut un message pré-rédigé par l'IA et un bouton d'action directe vers la fiche ou l'action concernée.",
  },
  {
    q: "Comment l'IA adapte-t-elle son ton selon l'urgence de la situation ?",
    a: "Kompilot intègre un Moteur de Copywriting Contextuel qui détecte automatiquement le niveau d'urgence de votre écran : (1) Écran de crise (Boîte de réception, Brand Shield) : phrases courtes, ton chirurgical et sécurisant, 1 action immédiate. (2) Écran de succès (Caissier validé, rapports de gains) : ton valorisant, vocabulaire financier premium, projection vers la prochaine performance. (3) Écran de configuration (Paramètres, Calendrier) : ton maïeutique, questions ouvertes stratégiques. Ce moteur est actif en permanence — aucun réglage nécessaire.",
  },
  {
    q: "Comment Kompilot protège-t-il la réputation de mes clients lors des réponses de crise ?",
    a: "Lors des réponses à des avis négatifs ou commentaires critiques, l'IA applique obligatoirement la séquence maïeutique premium : (1) Validation du ressenti sans être défensif ('Nous comprenons votre déception...'), (2) Invitation à l'échange privé pour résolution personnalisée, (3) Préservation de l'autorité publique de l'établissement devant tous les lecteurs. Les formulations agressives, défensives ou légalistes sont automatiquement bannies — elles dégradent la note publique et font fuir de nouveaux clients. Taux de résolution sans escalade : 73%.",
  },
  {
    q: "Comment générer un post de prospection B2B pour mon agence en 1 clic ?",
    a: "Dans Tableau de bord Agence > Kit PR & Vente > onglet 'Scripts prospection' : (1) Sélectionnez le secteur de votre prospect (Restauration, Beauté, BTP, Santé, Commerce), (2) Choisissez le style de script (Urgence & Chiffres, Preuve Sociale, Maïeutique, Newsletter Pro), (3) Cliquez 'Copier le script' — prêt à publier sur LinkedIn/Instagram ou à envoyer par email. Bouton 'Variante IA' disponible pour générer un script personnalisé avec les métriques sectorielles réelles anonymisées.",
  },
  {
    q: "Comment utiliser les études de cas anonymisées pour convaincre un prospect ?",
    a: "Dans Tableau de bord Agence > Kit PR & Vente > onglet 'Étude de cas', sélectionnez le secteur du prospect. L'étude présente les chiffres sectoriels médianes (no-show évités, CA récupéré, ROI abonnement) sans aucune donnée client individuelle — conformes RGPD. Intégrez l'étude dans votre signature email, vos DMs LinkedIn ou votre newsletter d'agence. Les données sont mises à jour trimestriellement.",
  },
];

const SOCIAL_GROWTH_QUESTIONS = [
  {
    q: "Comment l'IA de Kompilot évite-t-elle de faire des réponses génériques ou robotiques sur mes réseaux ?",
    a: "Chaque réponse est générée en temps réel avec le dictionnaire lexical de votre secteur (ex: 'tables' pour resto, 'chantier' pour BTP) et se termine par une question ouverte unique. L'IA varie les formulations pour paraître naturelle et humaine.",
  },
  {
    q: "Est-ce que l'automatisation des DMs respecte les règles de sécurité de Meta et Instagram ?",
    a: "Oui. Kompilot n'envoie qu'1 DM automatique par utilisateur par post, uniquement en réponse à un commentaire volontaire. Nous respectons le quota Meta de 200 messages automatisés / jour et n'utilisons jamais de DMs non sollicités.",
  },
  {
    q: "Comment modifier le mot-clé qui déclenche l'envoi de mon catalogue de devis ou de mon menu ?",
    a: "Allez dans Croissance > Active Audience > onglet 'Comment-to-DM'. Cliquez sur la règle à modifier, changez le mot-clé déclencheur et enregistrez. La nouvelle règle est active en temps réel.",
  },
];

export default function SectorizedFAQ({ open, onClose }: SectorizedFAQProps) {
  const { masterProfile } = useUserProfile();
  const lexicon = useLexicon();
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!masterProfile) return [];
    const baseData = FAQ_DATA[masterProfile] || [];
    
    if (!search) return baseData;

    const searchTerm = search.toLowerCase();
    return baseData.map(cat => ({
      ...cat,
      questions: cat.questions.filter(q => 
        q.q.toLowerCase().includes(searchTerm) || q.a.toLowerCase().includes(searchTerm)
      )
    })).filter(cat => cat.questions.length > 0);
  }, [masterProfile, search]);

  const filteredSOS = useMemo(() => {
    if (!search) return SOS_QUESTIONS;
    const searchTerm = search.toLowerCase();
    return SOS_QUESTIONS.filter(q => 
      q.q.toLowerCase().includes(searchTerm) || q.a.toLowerCase().includes(searchTerm)
    );
  }, [search]);

  const filteredSocialGrowth = useMemo(() => {
    if (!search) return SOCIAL_GROWTH_QUESTIONS;
    const searchTerm = search.toLowerCase();
    return SOCIAL_GROWTH_QUESTIONS.filter(q =>
      q.q.toLowerCase().includes(searchTerm) || q.a.toLowerCase().includes(searchTerm)
    );
  }, [search]);

  const filteredV2V3 = useMemo(() => {
    if (!search) return V2V3_QUESTIONS;
    const searchTerm = search.toLowerCase();
    return V2V3_QUESTIONS.filter(q =>
      q.q.toLowerCase().includes(searchTerm) || q.a.toLowerCase().includes(searchTerm)
    );
  }, [search]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 z-[1000] w-96 max-w-full bg-[#0F172A] text-slate-200 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#1E293B]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <LifeBuoy className="text-teal-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Centre d'Aide</h2>
                <p className="text-xs text-slate-400">Questions fréquentes</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input 
              placeholder="Rechercher une réponse..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0F172A] border-slate-700 text-slate-200 placeholder:text-slate-600 focus:ring-teal-500/50"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <h3 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} />
                  {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.questions.map((q, qIdx) => {
                    const id = `cat-${catIdx}-q-${qIdx}`;
                    const isExpanded = expandedIndex === id;
                    return (
                      <div 
                        key={qIdx} 
                        className={`rounded-xl border transition-all duration-200 ${
                          isExpanded ? 'bg-slate-800/50 border-teal-500/30' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : id)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left"
                        >
                          <span className="text-sm font-medium text-slate-200 leading-snug">{q.q}</span>
                          <ChevronDown 
                            size={16} 
                            className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                                {q.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : !search && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-sm text-slate-500">Aucune question spécifique à votre profil.</p>
            </div>
          )}

          {search && filteredCategories.length === 0 && filteredSOS.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-sm text-slate-500">Aucun résultat pour "{search}"</p>
            </div>
          )}
        </div>

        {/* SOS Pinned Section */}
        {filteredSOS.length > 0 && (
          <div className="shrink-0 p-6 border-t border-slate-800 bg-[#1E293B]/50">
            <div className="mb-4">
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1.5 w-fit">
                <AlertTriangle size={12} />
                MODE SOS CRISE
              </Badge>
            </div>
            <div className="space-y-2">
              {filteredSOS.map((q, idx) => {
                const id = `sos-${idx}`;
                const isExpanded = expandedIndex === id;
                return (
                  <div 
                    key={idx} 
                    className={`rounded-xl border transition-all duration-200 ${
                      isExpanded ? 'bg-red-500/5 border-red-500/30' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-medium text-slate-200 leading-snug">{q.q}</span>
                      <ChevronDown 
                        size={16} 
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                            {q.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            
            <Button className="w-full mt-6 bg-teal-600 hover:bg-teal-500 text-white gap-2 h-11">
              <MessageCircle size={18} />
              Contacter le support
            </Button>
          </div>
        )}

        {/* Social Growth FAQ Section */}
        {filteredSocialGrowth.length > 0 && (
          <div className="shrink-0 px-6 pb-6 pt-4 border-t border-slate-800 bg-violet-900/10">
            <div className="mb-3">
              <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1.5 w-fit text-[10px]">
                <Zap size={11} />
                CROISSANCE SOCIALE · Comment-to-DM & Bot
              </Badge>
            </div>
            <div className="space-y-2">
              {filteredSocialGrowth.map((q, idx) => {
                const id = `social-${idx}`;
                const isExpanded = expandedIndex === id;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all duration-200 ${
                      isExpanded ? 'bg-violet-500/5 border-violet-500/30' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-medium text-slate-200 leading-snug">{q.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                            {q.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* V2/V3 Features FAQ */}
        {filteredV2V3.length > 0 && (
          <div className="shrink-0 px-6 pb-6 pt-4 border-t border-slate-800 bg-amber-900/5">
            <div className="mb-3">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1.5 w-fit text-[10px]">
                <Sparkles size={11} />
                KOMPILOT V2/V3 · Nouvelles fonctionnalités
              </Badge>
            </div>
            <div className="space-y-2">
              {filteredV2V3.map((q, idx) => {
                const id = `v2v3-${idx}`;
                const isExpanded = expandedIndex === id;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all duration-200 ${
                      isExpanded ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-medium text-slate-200 leading-snug">{q.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                            {q.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
