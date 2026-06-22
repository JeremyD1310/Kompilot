import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ContentPillar {
  id: string;
  emoji: string;
  label: string;
  color: string;
  description?: string; // optional keywords/description used by AI to generate targeted ideas
}

interface ContentPillarsContextType {
  pillars: ContentPillar[];
  setPillar: (id: string, patch: Partial<ContentPillar>) => void;
  sparkAngles: Record<string, any[]>;
  setSparkAngles: (id: string, angles: any[]) => void;
}

const STORAGE_KEY = 'kompilot_content_pillars';

const DEFAULT_PILLARS: ContentPillar[] = [
  { id: 'pillar-1', emoji: '🎓', label: 'Conseils Experts', color: 'from-blue-500 to-cyan-400' },
  { id: 'pillar-2', emoji: '🎬', label: 'Coulisses', color: 'from-violet-500 to-purple-400' },
  { id: 'pillar-3', emoji: '🎯', label: 'Promotion', color: 'from-amber-500 to-orange-400' },
];

const ContentPillarsContext = createContext<ContentPillarsContextType | undefined>(undefined);

export function ContentPillarsProvider({ children }: { children: React.ReactNode }) {
  const [pillars, setPillarsState] = useState<ContentPillar[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PILLARS;
  });

  const [sparkAngles, setSparkAnglesState] = useState<Record<string, any[]>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pillars));
  }, [pillars]);

  const setPillar = (id: string, patch: Partial<ContentPillar>) => {
    setPillarsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const setSparkAngles = (id: string, angles: any[]) => {
    setSparkAnglesState((prev) => ({ ...prev, [id]: angles }));
  };

  return (
    <ContentPillarsContext.Provider value={{ pillars, setPillar, sparkAngles, setSparkAngles }}>
      {children}
    </ContentPillarsContext.Provider>
  );
}

export function useContentPillars() {
  const context = useContext(ContentPillarsContext);
  if (!context) {
    console.warn('useContentPillars must be used within a ContentPillarsProvider — returning safe fallback');
    return {} as any;
  }
  return context;
}
