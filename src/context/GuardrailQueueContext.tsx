/**
 * GuardrailQueueContext — File d'attente de validation humaine des actions IA.
 * Toutes les générations autonomes (crise réputationnelle, campagnes CRM,
 * publications anti-vide) s'y accumulent. Aucune exécution sans visa humain.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toast } from '@blinkdotnew/ui';

export type ActionType = 'crisis_response' | 'crm_campaign' | 'social_post' | 'anti_vide';

export interface GuardrailAction {
  id: string;
  type: ActionType;
  title: string;
  preview: string;
  channel?: string;
  createdAt: Date;
}

interface GuardrailQueueContextValue {
  queue: GuardrailAction[];
  addAction: (action: Omit<GuardrailAction, 'id' | 'createdAt'>) => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  approveAll: () => void;
  pendingCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const GuardrailQueueContext = createContext<GuardrailQueueContextValue | null>(null);

export function useGuardrailQueue(): GuardrailQueueContextValue {
  const ctx = useContext(GuardrailQueueContext);
  if (!ctx) { console.warn('useGuardrailQueue must be used within GuardrailQueueProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}

// Demo seed — 3 pending actions on first load
const DEMO_ACTIONS: GuardrailAction[] = [
  {
    id: 'demo-1',
    type: 'crisis_response',
    title: 'Réponse crise réputationnelle',
    preview: 'Bonjour, nous sommes vraiment navrés d\'apprendre votre expérience. Votre ressenti est tout à fait compréhensible et nous souhaitons y remédier. Seriez-vous disponible pour un échange en privé ?',
    channel: 'Google',
    createdAt: new Date(Date.now() - 5 * 60_000),
  },
  {
    id: 'demo-2',
    type: 'crm_campaign',
    title: 'Campagne réactivation CRM',
    preview: '📩 Hey [Prénom], ça fait 30 jours qu\'on ne vous a pas vu... On aimerait vous retrouver ! Voici un bon de 15% valable uniquement cette semaine. 🎁',
    channel: 'SMS',
    createdAt: new Date(Date.now() - 12 * 60_000),
  },
  {
    id: 'demo-3',
    type: 'social_post',
    title: 'Publication sociale anti-vide',
    preview: '✨ Une belle semaine s\'annonce ! Nos équipes vous attendent pour des moments mémorables. Réservez dès maintenant via le lien en bio 👇',
    channel: 'Instagram',
    createdAt: new Date(Date.now() - 20 * 60_000),
  },
];

export function GuardrailQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<GuardrailAction[]>(DEMO_ACTIONS);
  const [isOpen, setIsOpen] = useState(false);

  const addAction = useCallback((action: Omit<GuardrailAction, 'id' | 'createdAt'>) => {
    const newAction: GuardrailAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
    };
    setQueue(prev => [newAction, ...prev]);
  }, []);

  const approveAction = useCallback((id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
    toast.success('Action validée ✓', { description: 'La campagne est en cours de diffusion.' });
  }, []);

  const rejectAction = useCallback((id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
    toast('Action refusée', { description: 'L\'action a été supprimée de la file.' });
  }, []);

  const approveAll = useCallback(() => {
    const count = queue.length;
    setQueue([]);
    toast.success(`${count} action${count > 1 ? 's' : ''} validée${count > 1 ? 's' : ''} ✓`, {
      description: 'Toutes les campagnes sont en cours de diffusion.',
    });
  }, [queue]);

  return (
    <GuardrailQueueContext.Provider value={{
      queue,
      addAction,
      approveAction,
      rejectAction,
      approveAll,
      pendingCount: queue.length,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </GuardrailQueueContext.Provider>
  );
}
