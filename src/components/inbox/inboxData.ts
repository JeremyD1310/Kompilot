export type Channel = 'website' | 'linkedin' | 'instagram' | 'facebook' | 'google';

export interface InboxMessage {
  id: string;
  channel: Channel;
  senderName: string;
  senderHandle: string; // email or @handle
  subject: string;
  preview: string;
  body: string;
  date: string;
  isRead: boolean;
  isArchived?: boolean;
  isStarred?: boolean;
  replies: Reply[];
}

export interface Reply {
  id: string;
  from: 'me' | 'sender';
  text: string;
  date: string;
}

export const MOCK_MESSAGES: InboxMessage[] = [
  {
    id: '1',
    channel: 'website',
    senderName: 'Jean Dupont',
    senderHandle: 'jean.dupont@client.fr',
    subject: 'Demande de devis – prestation annuelle',
    preview: 'Bonjour, je souhaiterais obtenir un devis pour une prestation annuelle...',
    body: `Bonjour,

Je vous contacte suite à la visite de votre site web. Je souhaiterais obtenir un devis détaillé pour une prestation annuelle couvrant la gestion de votre présence en ligne.

Pourriez-vous me préciser vos tarifs ainsi que les modalités de collaboration ?

Dans l'attente de votre retour,
Jean Dupont`,
    date: 'Aujourd\'hui, 09:45',
    isRead: false,
    replies: [],
  },
  {
    id: '2',
    channel: 'linkedin',
    senderName: 'Marie Martin',
    senderHandle: '@marie.martin',
    subject: 'Proposition de partenariat',
    preview: 'Bonjour, j\'ai découvert votre profil et je pense que nous pourrions collaborer...',
    body: `Bonjour,

J'ai découvert votre profil LinkedIn et je pense que nous pourrions avoir une collaboration intéressante.

Je dirige une agence de communication et nous cherchons des partenaires pour compléter notre offre. Seriez-vous disponible pour un appel de 20 minutes cette semaine ?

Cordialement,
Marie Martin`,
    date: 'Hier, 16:30',
    isRead: true,
    replies: [
      {
        id: 'r1',
        from: 'me',
        text: 'Bonjour Marie, merci pour votre message ! Avec plaisir pour un appel. Je suis disponible jeudi ou vendredi matin. Dites-moi ce qui vous convient le mieux.',
        date: 'Hier, 17:05',
      },
    ],
  },
  {
    id: '3',
    channel: 'instagram',
    senderName: 'Thomas Lefebvre',
    senderHandle: '@thomas_lef',
    subject: 'Question sur votre offre',
    preview: 'Salut ! J\'ai vu votre post et j\'ai une question rapide sur votre offre...',
    body: `Salut ! 👋

J'ai vu votre dernier post et j'ai une question rapide : est-ce que vous proposez aussi des forfaits pour les indépendants ? 

Votre interface a l'air super sympa, je cherche exactement ce genre d'outil depuis un moment 🔥

Thomas`,
    date: '15 Mai, 11:20',
    isRead: true,
    replies: [],
  },
  {
    id: '4',
    channel: 'website',
    senderName: 'Agence Lumière',
    senderHandle: 'contact@agence-lumiere.fr',
    subject: 'Bug signalé sur le formulaire de contact',
    preview: 'Nous avons remarqué un problème lors de la soumission du formulaire...',
    body: `Bonjour,

Nous avons remarqué un problème lors de la soumission du formulaire de contact sur votre site. Le bouton "Envoyer" ne semble pas fonctionner sur Safari mobile.

Pouvez-vous vérifier cela ?

Merci,
L'équipe Agence Lumière`,
    date: '14 Mai, 09:00',
    isRead: false,
    replies: [],
  },
  {
    id: '5',
    channel: 'linkedin',
    senderName: 'Sophie Bernard',
    senderHandle: '@sophie.bernard.pro',
    subject: 'Invitation à un événement networking',
    preview: 'Bonjour, nous organisons un événement networking le 25 mai prochain...',
    body: `Bonjour,

Nous organisons un événement networking dédié aux dirigeants de TPE/PME le 25 mai prochain à Paris (8e).

Ce sera l'occasion d'échanger avec d'autres entrepreneurs et de découvrir des outils pour développer votre présence digitale.

Souhaiteriez-vous nous rejoindre ?

Bonne journée,
Sophie Bernard`,
    date: '13 Mai, 14:15',
    isRead: true,
    replies: [],
  },
  {
    id: '6',
    channel: 'facebook',
    senderName: 'Claire Rousseau',
    senderHandle: 'Claire Rousseau',
    subject: 'Question via Facebook',
    preview: 'Bonjour ! Vous êtes ouverts le dimanche ? Je voudrais passer avec ma famille...',
    body: `Bonjour ! 😊\n\nVous êtes ouverts le dimanche ? Je voudrais passer avec ma famille ce week-end.\n\nMerci d'avance,\nClaire`,
    date: 'Aujourd\'hui, 10:12',
    isRead: false,
    replies: [],
  },
  {
    id: '7',
    channel: 'google',
    senderName: 'Marc Fontaine',
    senderHandle: 'Marc Fontaine (Google)',
    subject: 'Question via Google Business',
    preview: 'Bonjour, quels sont vos horaires pour ce soir ? J\'ai vu votre établissement sur Maps...',
    body: `Bonjour,\n\nJ'ai trouvé votre établissement sur Google Maps et je voudrais savoir si vous êtes ouverts ce soir jusqu'à 20h.\n\nMerci,\nMarc`,
    date: 'Hier, 19:44',
    isRead: true,
    replies: [],
  },
];
