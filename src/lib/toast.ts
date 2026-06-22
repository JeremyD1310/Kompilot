import { toast } from '@blinkdotnew/ui';

export const showToast = {
  saved: () => toast.success('Modifications enregistrées avec succès !', {
    description: 'Vos changements ont été sauvegardés.',
    duration: 3000,
  }),

  aiOptimized: () => toast.success('Post optimisé par l\'IA ✨', {
    description: 'Votre contenu a été amélioré.',
    duration: 3000,
  }),

  biometricEnabled: () => toast.success('Connexion biométrique activée ! 🔒', {
    description: 'Vous pouvez désormais déverrouiller votre cockpit instantanément.',
    duration: 4000,
  }),

  postScheduled: (date?: string) => toast.success('Post planifié avec succès !', {
    description: date ? `Publié le ${date}` : 'Votre contenu est dans le calendrier.',
    duration: 3000,
  }),

  postPublished: () => toast.success('Post publié !', {
    description: 'Votre contenu est maintenant visible.',
    duration: 3000,
  }),

  postDeleted: () => toast.success('Post supprimé.', {
    duration: 2000,
  }),

  copied: () => toast.success('Copié dans le presse-papier !', {
    duration: 2000,
  }),

  error: (message?: string) => toast.error(message ?? 'Une erreur est survenue, veuillez réessayer.', {
    duration: 4000,
  }),

  loading: (message: string) => toast.loading(message, {
    duration: 10000,
  }),

  passwordChanged: () => toast.success('Mot de passe mis à jour avec succès !', {
    duration: 3000,
  }),

  sessionRevoked: () => toast.success('Session révoquée avec succès.', {
    duration: 2500,
  }),

  pinSet: () => toast.success('Code PIN défini avec succès !', {
    duration: 3000,
  }),

  pinCleared: () => toast.success('Code PIN supprimé.', {
    duration: 2000,
  }),

  profileUpdated: () => toast.success('Profil mis à jour !', {
    description: 'Vos informations ont été enregistrées.',
    duration: 3000,
  }),

  loginSuccess: () => toast.success('Connexion réussie ! Bienvenue 👋', {
    duration: 3000,
  }),

  connected: (platform: string) => toast.success(`${platform} connecté avec succès !`, {
    duration: 3000,
  }),

  disconnected: (platform: string) => toast.success(`${platform} déconnecté.`, {
    duration: 2500,
  }),
};
