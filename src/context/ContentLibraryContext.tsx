import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface LibraryPost {
  id: string;
  text: string;
  channels: string[];
  date: string;
  time: string;
  addedAt: string;        // ISO date string
  publishedAt?: string;   // ISO date string, undefined if not published yet
  autoRepublish: boolean;
  status: 'published' | 'scheduled' | 'draft';
  performance?: {
    views: number;
    likes: number;
    shares: number;
    reach: number;
    score: 'top' | 'good' | 'average' | 'low';  // 'top' if views>2000, 'good' if>500
  };
  isRecycled?: boolean;   // true if this is a recycled version
  originalId?: string;    // id of the original post if recycled
}

interface ContentLibraryContextValue {
  library: LibraryPost[];
  addToLibrary: (post: Omit<LibraryPost, 'id' | 'addedAt' | 'autoRepublish' | 'status'>) => void;
  removeFromLibrary: (id: string) => void;
  toggleAutoRepublish: (id: string) => void;
  recyclePost: (id: string, newText: string) => LibraryPost;
  getRecentPosts: (days: number) => LibraryPost[];
}

const ContentLibraryContext = createContext<ContentLibraryContextValue | null>(null);

const STORAGE_KEY = 'kompilot_library_posts';

const SAMPLE_DATA: LibraryPost[] = [
  {
    id: 'post-1',
    text: "Pourquoi le SEO local est-il vital pour votre PME en 2024 ? 📍\n\nBeaucoup d'entreprises oublient que 46% des recherches Google ont une intention locale. Si vous ne travaillez pas votre fiche Google Business Profile, vous laissez de l'argent sur la table.",
    channels: ['linkedin', 'instagram'],
    date: '2024-03-01',
    time: '09:00',
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: true,
    status: 'published',
    performance: { views: 5420, likes: 245, shares: 42, reach: 12000, score: 'top' }
  },
  {
    id: 'post-2',
    text: "L'art du storytelling pour vendre sans prospecter. 📖\n\nArrêtez de vendre des caractéristiques, vendez des transformations. Vos clients ne veulent pas une perceuse, ils veulent un trou dans le mur pour accrocher les photos de leurs enfants.",
    channels: ['linkedin', 'facebook'],
    date: '2024-03-05',
    time: '11:00',
    addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: true,
    status: 'published',
    performance: { views: 3850, likes: 180, shares: 15, reach: 8500, score: 'top' }
  },
  {
    id: 'post-3',
    text: "3 erreurs fatales en marketing digital que font les TPE. 🚫\n\n1. Vouloir être partout à la fois.\n2. Ne pas mesurer ses résultats.\n3. Oublier de répondre aux commentaires.\n\nConcentrez-vous sur un canal et maîtrisez-le avant de passer au suivant.",
    channels: ['linkedin', 'instagram', 'facebook'],
    date: '2024-03-10',
    time: '14:00',
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: false,
    status: 'published',
    performance: { views: 7200, likes: 412, shares: 89, reach: 15000, score: 'top' }
  },
  {
    id: 'post-4',
    text: "Le guide ultime pour créer une newsletter qui convertit. 📧\n\nVotre base mail est votre actif le plus précieux. Contrairement aux réseaux sociaux, vous en êtes le propriétaire. Voici comment engager votre audience chaque semaine.",
    channels: ['linkedin'],
    date: '2024-03-12',
    time: '08:30',
    addedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: true,
    status: 'published',
    performance: { views: 1250, likes: 65, shares: 8, reach: 4500, score: 'good' }
  },
  {
    id: 'post-5',
    text: "Comment utiliser LinkedIn pour le B2B sans être intrusif ? 💼\n\nL'approche directe ne fonctionne plus. Apportez de la valeur, partagez vos succès (et vos échecs) et devenez une autorité dans votre domaine.",
    channels: ['linkedin'],
    date: '2024-03-15',
    time: '10:00',
    addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: true,
    status: 'published',
    performance: { views: 980, likes: 45, shares: 4, reach: 3200, score: 'good' }
  },
  {
    id: 'post-6',
    text: "Pourquoi vous devriez recycler vos anciens contenus. ♻️\n\nUn post qui a bien fonctionné il y a 3 mois mérite d'être revu et corrigé pour toucher ceux qui l'ont raté la première fois.",
    channels: ['instagram', 'facebook'],
    date: '2024-03-18',
    time: '18:00',
    addedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: false,
    status: 'published',
    performance: { views: 1550, likes: 92, shares: 12, reach: 5100, score: 'good' }
  },
  {
    id: 'post-7',
    text: "Mes outils préférés pour gagner du temps en 2024. 🛠️\n\nLa productivité n'est pas une question d'outils, mais de processus. Cependant, certains logiciels peuvent vraiment faire la différence pour une petite équipe.",
    channels: ['linkedin', 'facebook'],
    date: '2024-03-20',
    time: '12:00',
    addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: false,
    status: 'published',
    performance: { views: 320, likes: 21, shares: 2, reach: 1100, score: 'average' }
  },
  {
    id: 'post-8',
    text: "Une journée type d'un entrepreneur débordé. 🏃‍♂️\n\nApprendre à déléguer est la compétence la plus difficile mais la plus nécessaire pour passer de freelance à chef d'entreprise.",
    channels: ['facebook', 'instagram'],
    date: '2024-03-22',
    time: '15:30',
    addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    autoRepublish: true,
    status: 'published',
    performance: { views: 180, likes: 12, shares: 1, reach: 600, score: 'average' }
  }
];

export function ContentLibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryPost[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored library', e);
      }
    }
    return SAMPLE_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const addToLibrary = (post: Omit<LibraryPost, 'id' | 'addedAt' | 'autoRepublish' | 'status'>) => {
    const entry: LibraryPost = {
      ...post,
      id: `post-${Date.now()}`,
      addedAt: new Date().toISOString(),
      autoRepublish: true,
      status: 'draft',
    };
    setLibrary(prev => [entry, ...prev]);
  };

  const removeFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(p => p.id !== id));
  };

  const toggleAutoRepublish = (id: string) => {
    setLibrary(prev => prev.map(p =>
      p.id === id ? { ...p, autoRepublish: !p.autoRepublish } : p
    ));
  };

  const recyclePost = (id: string, newText: string): LibraryPost => {
    const original = library.find(p => p.id === id);
    if (!original) throw new Error(`Post ${id} not found`);

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const recycled: LibraryPost = {
      id: `recycled-${Date.now()}`,
      text: newText,
      channels: [...original.channels],
      date: threeMonthsFromNow.toISOString().split('T')[0],
      time: original.time,
      addedAt: new Date().toISOString(),
      publishedAt: threeMonthsFromNow.toISOString(),
      autoRepublish: false,
      status: 'scheduled',
      isRecycled: true,
      originalId: id
    };

    setLibrary(prev => [recycled, ...prev]);
    return recycled;
  };

  const getRecentPosts = (days: number): LibraryPost[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return library.filter(p => p.publishedAt && new Date(p.publishedAt) >= cutoff);
  };

  return (
    <ContentLibraryContext.Provider value={{ 
      library, 
      addToLibrary, 
      removeFromLibrary, 
      toggleAutoRepublish,
      recyclePost,
      getRecentPosts
    }}>
      {children}
    </ContentLibraryContext.Provider>
  );
}

export function useContentLibrary() {
  const ctx = useContext(ContentLibraryContext);
  if (!ctx) { console.warn('useContentLibrary must be used within ContentLibraryProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
