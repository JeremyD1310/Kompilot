/** Shared static data & types for the AntiNoShow module (no JSX — pure TypeScript) */

export const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
export const TIME_SLOTS = ['9h', '10h', '11h', '12h', '14h', '15h', '16h', '17h', '18h'] as const;

export const DEFAULT_HOT_SLOTS: Set<string> = new Set([
  'Sam-9h', 'Sam-10h', 'Sam-11h', 'Sam-14h', 'Sam-15h',
  'Dim-10h', 'Dim-11h', 'Ven-17h', 'Ven-18h',
]);

export interface AIAdviceCard {
  icon: string;
  title: string;
  text: string;
  color: 'amber' | 'teal' | 'violet';
}

export const STATIC_ADVICE: AIAdviceCard[] = [
  {
    icon: '⚠️',
    title: 'Événement saisonnier détecté',
    text: "Forte demande ce weekend en raison de la fête des mères. Votre copilote vous suggère de monter l'empreinte à 40% pour sécuriser votre planning.",
    color: 'amber',
  },
  {
    icon: '📈',
    title: 'Analyse concurrentielle',
    text: 'Vos concurrents directs à 2km appliquent en moyenne une empreinte de 20%. Rester à 25% vous protège sans décourager vos clients réguliers.',
    color: 'teal',
  },
  {
    icon: '💡',
    title: 'Historique de votre établissement',
    text: "Le créneau du samedi à 14h représente 60% de vos rendez-vous manqués le mois dernier. L'IA vous conseille d'activer l'empreinte à 30% sur ce créneau.",
    color: 'violet',
  },
];

export const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200 dark:border-amber-800/50',   text: 'text-amber-800 dark:text-amber-200'   },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-950/30',     border: 'border-teal-200 dark:border-teal-800/50',     text: 'text-teal-800 dark:text-teal-200'     },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/50', text: 'text-violet-800 dark:text-violet-200'  },
};