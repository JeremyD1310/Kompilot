export type SportsStructure = 'club_football' | 'club_rugby' | 'crossfit' | 'club_tennis'
export type SportsObjective = 'home_match' | 'reaffiliate' | 'sponsors'

export interface SportsMember {
  name: string
  segment: string
  status: string
  statusTone: 'teal' | 'amber' | 'blue'
}

export interface SportsDemoData {
  structure: SportsStructure
  structureLabel: string
  clubName: string
  city: string
  objectiveLabel: string
  eventTitle: string
  eventDate: string
  eventDescription: string
  ticketLabel: string
  ticketFill: number
  ticketMeta: string
  campaignName: string
  campaignChannels: string
  campaignMessage: string
  members: SportsMember[]
  memberFunnel: { label: string; value: string; detail: string }[]
  sponsorTitle: string
  sponsorMessage: string
  sponsors: { name: string; contribution: string; visibility: string; status: string }[]
  posts: { label: string; title: string; text: string; channel: string }[]
}

const structures: Record<SportsStructure, { label: string; clubName: string; city: string; event: string; date: string }> = {
  club_football: { label: 'Club de Football', clubName: 'FC Horizon Nantes', city: 'Nantes', event: 'Derby de Loire à domicile', date: 'Dimanche · 15:00' },
  club_rugby: { label: 'Club de Rugby', clubName: 'Rugby Atlantique', city: 'La Rochelle', event: 'Match à domicile · journée 8', date: 'Samedi · 18:30' },
  crossfit: { label: 'Salle de CrossFit', clubName: 'Forge CrossFit Lyon', city: 'Lyon 7e', event: 'WOD Challenge · édition club', date: 'Samedi · 10:00' },
  club_tennis: { label: 'Club de Tennis', clubName: 'Tennis Club des Docks', city: 'Bordeaux', event: 'Finales du tournoi interne', date: 'Samedi · 14:00' },
}

const objectives: Record<SportsObjective, { label: string; campaign: string; message: string; ticketFill: number; ticketMeta: string }> = {
  home_match: { label: 'Match / événement à domicile', campaign: 'Relance supporters & billetterie', message: 'Le grand rendez-vous approche ! Réservez vos places et venez soutenir {club} à domicile. Billetterie ouverte jusqu’au coup d’envoi.', ticketFill: 85, ticketMeta: 'Jauge en bonne voie · dernière relance recommandée à J-2' },
  reaffiliate: { label: 'Campagne de ré-affiliation', campaign: 'Early Bird · Réinscription de saison', message: 'Votre licence vous attend pour la nouvelle saison. Profitez de la campagne Early Bird et revenez partager les prochains entraînements avec {club}.', ticketFill: 68, ticketMeta: 'Objectif ré-affiliation · relance des anciens licenciés active' },
  sponsors: { label: 'Recherche de sponsors', campaign: 'Pack partenaires locaux · nouvelle saison', message: 'Associez votre entreprise à la dynamique de {club}. Découvrez nos offres de visibilité locale autour des matchs, entraînements et événements du club.', ticketFill: 74, ticketMeta: 'Événement support · argumentaire partenaire prêt à envoyer' },
}

export function getSportsDemoData(structure: SportsStructure, objective: SportsObjective, customObjective = ''): SportsDemoData {
  const club = structures[structure]
  const goal = objectives[objective]
  const eventTitle = customObjective.trim() || goal.label
  const campaignMessage = goal.message.replaceAll('{club}', club.clubName)
  const memberWord = structure === 'crossfit' ? 'adhérent' : 'licencié'

  return {
    structure, structureLabel: club.label, clubName: club.clubName, city: club.city,
    objectiveLabel: eventTitle, eventTitle: club.event, eventDate: club.date,
    eventDescription: objective === 'home_match' ? `Une campagne locale pour remplir la tribune et mobiliser la communauté ${club.city}.` : objective === 'reaffiliate' ? `Un tunnel simple pour faire revenir les anciens ${memberWord}s avant le lancement de saison.` : `Un dispositif prêt à valoriser les partenaires et mécènes auprès de la communauté locale.`,
    ticketLabel: structure === 'crossfit' ? 'Jauge de l’événement' : 'Remplissage tribunes / jauge', ticketFill: goal.ticketFill, ticketMeta: goal.ticketMeta,
    campaignName: goal.campaign, campaignChannels: 'Email + SMS · segment local', campaignMessage,
    members: [
      { name: 'Lucas Martin', segment: `Ancien ${memberWord}`, status: objective === 'reaffiliate' ? 'Offre Early Bird envoyée' : 'Invitation événement envoyée', statusTone: 'teal' },
      { name: 'Sarah Benali', segment: `Nouveau ${memberWord}`, status: 'Bienvenue + calendrier partagé', statusTone: 'blue' },
      { name: 'Thomas Leroy', segment: 'Membre engagé', status: objective === 'sponsors' ? 'Profil ambassadeur identifié' : 'Offre de parrainage envoyée', statusTone: 'amber' },
    ],
    memberFunnel: [
      { label: 'Contacts ciblés', value: '428', detail: 'base membres active' },
      { label: 'Relances ouvertes', value: '71%', detail: 'sur les 7 derniers jours' },
      { label: 'Objectif conversion', value: objective === 'reaffiliate' ? '96 retours' : '120 actions', detail: 'suivi par Kompilot' },
    ],
    sponsorTitle: objective === 'sponsors' ? 'Pipeline partenaires & mécènes' : 'Visibilité partenaires locaux',
    sponsorMessage: `Merci à notre partenaire Café des Docks pour son soutien à ${club.clubName} ! Grâce à vous, la pratique sportive locale grandit et rassemble ${club.city}.`,
    sponsors: [
      { name: 'Café des Docks', contribution: 'Partenaire local', visibility: 'Panneaux LED · réseaux', status: 'À valoriser' },
      { name: 'Atelier Nova', contribution: 'Mécène équipement', visibility: 'Maillots · newsletter', status: 'Actif' },
    ],
    posts: [
      { label: 'MATCHDAY', title: `Jour de match · ${club.event}`, text: `${club.event} ⚡ Rendez-vous ${club.city} ${club.date.toLowerCase()}. Venez pousser derrière ${club.clubName} ! Billetterie et infos pratiques dans le lien du profil.`, channel: 'Instagram · Facebook' },
      { label: 'TEMPS FORT', title: 'Score final · merci aux supporters', text: `Quel moment ! Merci à toutes et tous pour votre énergie autour de ${club.clubName}. Le score restera dans les mémoires, mais votre soutien encore plus. 💙`, channel: 'Instagram · LinkedIn' },
    ],
  }
}

export const SPORTS_STRUCTURE_OPTIONS: { value: SportsStructure; label: string; emoji: string }[] = [
  { value: 'club_football', label: 'Club de Football', emoji: '⚽' },
  { value: 'club_rugby', label: 'Club de Rugby', emoji: '🏉' },
  { value: 'crossfit', label: 'Salle de CrossFit', emoji: '🏋️' },
  { value: 'club_tennis', label: 'Club de Tennis', emoji: '🎾' },
]
