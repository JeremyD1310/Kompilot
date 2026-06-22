import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { toast } from '@blinkdotnew/ui';
import { useCredits } from './CreditsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PendingPost {
  id: string;
  text: string;
  channels: string[];
  date: string;
  time: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
}

interface TeamModeContextValue {
  teamModeEnabled: boolean;
  setTeamModeEnabled: (v: boolean) => void;
  creatorName: string;
  setCreatorName: (v: string) => void;
  validatorName: string;
  setValidatorName: (v: string) => void;
  collaborators: Collaborator[];
  addCollaborator: (c: Omit<Collaborator, 'id'>) => void;
  removeCollaborator: (id: string) => void;
  pendingPosts: PendingPost[];
  submitForValidation: (post: Omit<PendingPost, 'id' | 'submittedAt' | 'status'>) => void;
  validatePost: (id: string) => void;
  rejectPost: (id: string) => void;
  clearApproved: () => void;
}

const TEAM_KEY           = 'kompilot_team_mode';
const TEAM_PREFS_KEY     = 'kompilot_team_prefs';
const PENDING_POSTS_KEY  = 'kompilot_pending_posts';
const COLLABORATORS_KEY  = 'kompilot_collaborators';

// ── Context ───────────────────────────────────────────────────────────────────

const TeamModeContext = createContext<TeamModeContextValue | null>(null);

export function TeamModeProvider({ children }: { children: ReactNode }) {
  const { deductCredit } = useCredits();

  const [teamModeEnabled, setTeamModeEnabledRaw] = useState(() =>
    localStorage.getItem(TEAM_KEY) === 'true'
  );
  const [creatorName, setCreatorNameRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TEAM_PREFS_KEY) ?? '{}').creator ?? 'Marine'; }
    catch { return 'Marine'; }
  });
  const [validatorName, setValidatorNameRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TEAM_PREFS_KEY) ?? '{}').validator ?? 'Joan'; }
    catch { return 'Joan'; }
  });
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>(() => {
    try {
      const raw = localStorage.getItem(PENDING_POSTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    try {
      const raw = localStorage.getItem(COLLABORATORS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(TEAM_KEY, String(teamModeEnabled)); }, [teamModeEnabled]);
  useEffect(() => {
    localStorage.setItem(TEAM_PREFS_KEY, JSON.stringify({ creator: creatorName, validator: validatorName }));
  }, [creatorName, validatorName]);
  useEffect(() => {
    localStorage.setItem(PENDING_POSTS_KEY, JSON.stringify(pendingPosts));
  }, [pendingPosts]);
  useEffect(() => {
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(collaborators));
  }, [collaborators]);

  const setTeamModeEnabled = (v: boolean) => {
    setTeamModeEnabledRaw(v);
    if (v) toast.success(`Mode Équipe activé — Les posts seront envoyés à ${validatorName} pour validation.`);
    else toast('Mode Équipe désactivé — Publication directe réactivée.');
  };
  const setCreatorName   = (v: string) => setCreatorNameRaw(v);
  const setValidatorName = (v: string) => setValidatorNameRaw(v);

  const addCollaborator = (c: Omit<Collaborator, 'id'>) => {
    const newC: Collaborator = { ...c, id: Date.now().toString() };
    setCollaborators(prev => [...prev, newC]);
    toast.success(`${c.name} ajouté comme collaborateur !`, {
      description: 'Ses posts seront en attente de validation.',
    });
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    toast("Collaborateur retiré de l'équipe.");
  };

  const submitForValidation = (post: Omit<PendingPost, 'id' | 'submittedAt' | 'status'>) => {
    const newPost: PendingPost = {
      ...post,
      id: Date.now().toString(),
      submittedAt: new Date().toLocaleString('fr-FR'),
      status: 'pending',
    };
    setPendingPosts(prev => [newPost, ...prev]);
    toast.success(`Post envoyé à ${validatorName} pour validation !`, {
      description: "Statut : En attente d'approbation",
    });
  };

  const validatePost = (id: string) => {
    const ok = deductCredit();
    if (!ok) {
      toast.error('Solde insuffisant pour publier.');
      return;
    }
    setPendingPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    toast.success(`Publication approuvée par ${validatorName} ✓`, {
      description: '1 crédit débité. Publication planifiée.',
    });
  };

  const rejectPost = (id: string) => {
    setPendingPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    toast('Publication refusée. Le créateur sera notifié.');
  };

  const clearApproved = () => {
    setPendingPosts(prev => prev.filter(p => p.status === 'pending'));
  };

  return (
    <TeamModeContext.Provider value={{
      teamModeEnabled, setTeamModeEnabled,
      creatorName, setCreatorName,
      validatorName, setValidatorName,
      collaborators, addCollaborator, removeCollaborator,
      pendingPosts, submitForValidation, validatePost, rejectPost, clearApproved,
    }}>
      {children}
    </TeamModeContext.Provider>
  );
}

export function useTeamMode() {
  const ctx = useContext(TeamModeContext);
  if (!ctx) { console.warn('useTeamMode must be used within TeamModeProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
