/**
 * useCoachTips — hooks for the Coach IA tips system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/blink/client';

const API_BASE = '/api/coach-tips';

async function fetchJson(url: string, options?: RequestInit) {
  const token = await blink.auth.getValidToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CoachTip {
  id: string;
  category: string;
  title: string;
  content: string;
  platform: string;
  priority: number;
  status: string;
  submittedBy: string;
  submittedByName: string;
  views: number;
  likes: number;
  clicks: number;
  isSystem: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface TipSettings {
  userId: string;
  enabledCategories: string[];
  frequencySeconds: number;
  isEnabled: boolean;
}

export interface TipAnalytics {
  totalTips: number;
  pendingCount: number;
  userSubmitted: number;
  totalViews: number;
  totalLikes: number;
  totalClicks: number;
  topTips: CoachTip[];
  categoryBreakdown: Record<string, { count: number; views: number; likes: number }>;
}

// ── Fetch approved tips ──────────────────────────────────────────────────────

export function useCoachTips(category?: string) {
  return useQuery({
    queryKey: ['coach-tips', category],
    queryFn: async () => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : '';
      const data = await fetchJson(`${API_BASE}${qs}`);
      return data.tips as CoachTip[];
    },
    staleTime: 60_000,
  });
}

// ── Fetch user settings ──────────────────────────────────────────────────────

export function useTipSettings() {
  return useQuery({
    queryKey: ['coach-tip-settings'],
    queryFn: async () => {
      const data = await fetchJson(`${API_BASE}/settings`);
      return data.settings as TipSettings;
    },
    staleTime: 300_000,
  });
}

// ── Update user settings ─────────────────────────────────────────────────────

export function useUpdateTipSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<TipSettings>) => {
      const data = await fetchJson(`${API_BASE}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      return data.settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-tip-settings'] }),
  });
}

// ── Submit a tip ─────────────────────────────────────────────────────────────

export function useSubmitTip() {
  return useMutation({
    mutationFn: async (tip: { category: string; title: string; content: string; platform?: string }) => {
      const data = await fetchJson(API_BASE, {
        method: 'POST',
        body: JSON.stringify(tip),
      });
      return data.tip;
    },
  });
}

// ── Track interaction ────────────────────────────────────────────────────────

export function useTrackTipInteraction() {
  return useMutation({
    mutationFn: async ({ tipId, type }: { tipId: string; type: 'view' | 'like' | 'click' }) => {
      await fetchJson(`${API_BASE}/${tipId}/interact`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
    },
  });
}

// ── Admin: fetch pending tips ────────────────────────────────────────────────

export function usePendingTips() {
  return useQuery({
    queryKey: ['coach-tips-pending'],
    queryFn: async () => {
      const data = await fetchJson(`${API_BASE}/pending`);
      return data.tips as CoachTip[];
    },
  });
}

// ── Admin: moderate a tip ────────────────────────────────────────────────────

export function useModerateTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const data = await fetchJson(`${API_BASE}/${id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return data.tip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-tips-pending'] });
      qc.invalidateQueries({ queryKey: ['coach-tips'] });
      qc.invalidateQueries({ queryKey: ['coach-tip-analytics'] });
    },
  });
}

// ── Admin: delete a tip ──────────────────────────────────────────────────────

export function useDeleteTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchJson(`${API_BASE}/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-tips-pending'] });
      qc.invalidateQueries({ queryKey: ['coach-tips'] });
      qc.invalidateQueries({ queryKey: ['coach-tip-analytics'] });
    },
  });
}

// ── Admin: analytics ─────────────────────────────────────────────────────────

export function useTipAnalytics() {
  return useQuery({
    queryKey: ['coach-tip-analytics'],
    queryFn: async () => {
      const data = await fetchJson(`${API_BASE}/analytics`);
      return data.analytics as TipAnalytics;
    },
    staleTime: 60_000,
  });
}
