/**
 * offlineDashboard — Helpers de haut niveau pour le cache des données dashboard
 *
 * Sauvegarde en IndexedDB les données critiques chargées depuis l'API
 * (Planning du jour, Contacts récents, Chantiers/Tables, Messages inbox)
 * pour permettre leur lecture hors-ligne.
 *
 * Usage (dans un composant / hook de fetch) :
 *   import { offlineDashboard } from '@/lib/offlineDashboard';
 *
 *   // Après fetch réussi :
 *   offlineDashboard.savePosts(posts);
 *   offlineDashboard.saveContacts(contacts);
 *
 *   // Avant fetch, si hors-ligne :
 *   const cachedPosts = await offlineDashboard.getPosts();
 */

import { offlineDB } from '@/lib/offlineDB';

/* ── Types minimaux ──────────────────────────────────────────── */
export interface CachedPost {
  id: string;
  title?: string;
  content?: string;
  status?: string;
  scheduledAt?: string | null;
}

export interface CachedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CachedChantier {
  id: string;
  label: string;
  status?: string;
  amount?: string | number;
}

export interface CachedMessage {
  id: string;
  senderName: string;
  subject: string;
  isRead?: boolean;
  createdAt?: string;
}

/* ── API ─────────────────────────────────────────────────────── */
export const offlineDashboard = {
  /* Posts / publications programmées */
  savePosts:    (data: CachedPost[])    => offlineDB.saveCache('dashboard_posts', data),
  getPosts:     ()                       => offlineDB.getCache<CachedPost[]>('dashboard_posts'),

  /* Planning du jour / chantiers / tables */
  saveSchedule: (data: CachedChantier[]) => offlineDB.saveCache('dashboard_schedule', data),
  getSchedule:  ()                        => offlineDB.getCache<CachedChantier[]>('dashboard_schedule'),

  /* Contacts clients récents */
  saveContacts: (data: CachedContact[]) => offlineDB.saveCache('dashboard_contacts', data),
  getContacts:  ()                       => offlineDB.getCache<CachedContact[]>('dashboard_contacts'),

  /* Messages inbox */
  saveMessages: (data: CachedMessage[]) => offlineDB.saveCache('inbox_messages', data),
  getMessages:  ()                       => offlineDB.getCache<CachedMessage[]>('inbox_messages'),

  /* Purge complète */
  clear: () => Promise.all([
    offlineDB.clearCache('dashboard_posts'),
    offlineDB.clearCache('dashboard_schedule'),
    offlineDB.clearCache('dashboard_contacts'),
    offlineDB.clearCache('inbox_messages'),
  ]),
} as const;
