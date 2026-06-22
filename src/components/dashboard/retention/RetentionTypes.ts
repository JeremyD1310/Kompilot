export interface CampaignType {
  id: string;
  emoji: string;
  icon: string; // lucide icon name, resolved in components
  iconColor: string;
  title: string;
  statsLabel: string;
  clientCount: number;
  description: string;
  urgencyScore: number;
  urgencyColor: string;
  defaultSms: string;
  variables: string[];
}

export interface GeneratedSms {
  sms: string;
  variables: string[];
}

export const CAMPAIGNS: CampaignType[] = [
  {
    id: 'absent',
    emoji: '🔴',
    icon: 'AlertCircle',
    iconColor: 'text-red-500',
    title: 'Clients absents +30 jours',
    statsLabel: '8 clients détectés',
    clientCount: 8,
    description: 'Clients non vus depuis 30+ jours',
    urgencyScore: 85,
    urgencyColor: 'bg-red-500',
    defaultSms: 'Bonjour [Prénom] ! Vous nous manquez 💙 Profitez de -10% sur votre prochain passage → [lien_reservation_anti_noshow]',
    variables: ['[Prénom]', '[lien_reservation]'],
  },
  {
    id: 'loyal',
    emoji: '⭐',
    icon: 'Star',
    iconColor: 'text-amber-500',
    title: 'Clients fidèles à récompenser',
    statsLabel: '12 clients VIP',
    clientCount: 12,
    description: 'Clients avec 3+ visites ce mois',
    urgencyScore: 70,
    urgencyColor: 'bg-amber-500',
    defaultSms: 'Bonjour [Prénom] ! 🌟 En remerciement de votre fidélité, voici -15% exclusif → [lien_reservation_anti_noshow]',
    variables: ['[Prénom]', '[offre_fidélité]'],
  },
  {
    id: 'seasonal',
    emoji: '🌸',
    icon: 'Calendar',
    iconColor: 'text-violet-500',
    title: 'Réactivation saisonnière',
    statsLabel: 'Prochain : Été',
    clientCount: 20,
    description: 'Campagnes liées aux événements (été, Noël, etc.)',
    urgencyScore: 55,
    urgencyColor: 'bg-violet-500',
    defaultSms: 'Bonjour [Prénom] ! ☀️ L\'été arrive — préparez-vous avec nous ! Offre spéciale saison → [lien_reservation_anti_noshow]',
    variables: ['[Prénom]', '[événement_saison]'],
  },
];

export const SMS_COST_PER_UNIT = 0.08;
export const SMS_DEFAULT_AUDIENCE = 8;
