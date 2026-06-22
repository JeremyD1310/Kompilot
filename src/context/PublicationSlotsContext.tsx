import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { addDays, format, parseISO, isAfter, startOfToday } from 'date-fns';

export type DayOfWeek = 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim';

export interface PublicationSlot {
  day: DayOfWeek;
  time: string; // HH:mm
}

const DAY_TO_JS: Record<DayOfWeek, number> = {
  lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 0,
};

const DEFAULT_SLOTS: PublicationSlot[] = [
  { day: 'lun', time: '09:00' },
  { day: 'mer', time: '09:00' },
  { day: 'ven', time: '09:00' },
];

interface PublicationSlotsContextValue {
  slots: PublicationSlot[];
  setSlots: (slots: PublicationSlot[]) => void;
  getNextFreeSlot: (usedDates: string[]) => { date: string; time: string } | null;
}

const Ctx = createContext<PublicationSlotsContextValue | null>(null);

export function PublicationSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<PublicationSlot[]>(DEFAULT_SLOTS);

  const getNextFreeSlot = useCallback(
    (usedDates: string[]): { date: string; time: string } | null => {
      if (slots.length === 0) return null;

      const today = startOfToday();
      // Search up to 60 days ahead
      for (let offset = 0; offset <= 60; offset++) {
        const candidate = addDays(today, offset);
        const jsDay = candidate.getDay(); // 0 = Sunday

        for (const slot of slots) {
          if (DAY_TO_JS[slot.day] !== jsDay) continue;
          const dateStr = format(candidate, 'yyyy-MM-dd');
          const key = `${dateStr}@${slot.time}`;
          if (!usedDates.includes(key)) {
            return { date: dateStr, time: slot.time };
          }
        }
      }
      return null;
    },
    [slots]
  );

  return (
    <Ctx.Provider value={{ slots, setSlots, getNextFreeSlot }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePublicationSlots() {
  const ctx = useContext(Ctx);
  if (!ctx) { console.warn('usePublicationSlots must be used within PublicationSlotsProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
