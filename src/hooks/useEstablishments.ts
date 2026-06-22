import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';

export interface Establishment {
  id: string;
  userId: string;
  name: string;
  activity: string;
  city: string;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  logoUrl?: string;
  description?: string;
  website?: string;
  phone?: string;
  bookingUrl?: string;   // Lien de réservation (Planity, ZenChef, site web…)
  googleMapsUrl?: string; // Lien Google Maps de l'établissement
  createdAt?: string;
  updatedAt?: string;
}

export type EstablishmentCreate = Omit<Establishment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type EstablishmentUpdate = Partial<EstablishmentCreate>;

const QUERY_KEY = 'establishments';

export function useEstablishments(userId: string) {
  const queryClient = useQueryClient();

  const { data: establishments = [], isLoading } = useQuery<Establishment[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const rows = await blink.db.establishments.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return rows as Establishment[];
    },
    enabled: !!userId,
  });

  const createEstablishment = useMutation({
    mutationFn: async (data: EstablishmentCreate) => {
      return blink.db.establishments.create({ ...data, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });

  const updateEstablishment = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: EstablishmentUpdate }) => {
      return blink.db.establishments.update(id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });

  const deleteEstablishment = useMutation({
    mutationFn: async (id: string) => {
      return blink.db.establishments.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });

  return {
    establishments,
    isLoading,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
  };
}
