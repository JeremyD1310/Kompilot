/**
 * useFirebaseAnalytics — React hook for auto-tracking page views.
 * Import once in DashboardLayout to enable automatic page view tracking.
 */
import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { analyticsTrackPageView } from '../firebase/analytics';
import { isFirebaseConfigured } from '../firebase/client';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cockpit': 'Cockpit IA',
  '/calendar': 'Calendrier',
  '/inbox': 'Boîte de réception',
  '/performance': 'Performance & Avis',
  '/google-maps': 'Google Maps',
  '/reviews': 'Avis Google',
  '/growth': 'Croissance & SEA',
  '/geo-authority': 'Autorité GEO',
  '/agence/dashboard': 'Agence — Dashboard',
  '/agence/cowork': 'Agence — Claude Cowork',
  '/agence/lead-search': 'Agence — Lead Scraper',
  '/settings': 'Paramètres',
  '/account': 'Mon Compte',
  '/subscription': 'Abonnement',
  '/creative-factory': 'Créas Flash',
  '/ai-creative-studio': 'AI Creative Studio',
};

export function useFirebaseAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const path = location.pathname;
    const name = PAGE_NAMES[path] ?? path.replace(/^\//, '').replace(/-/g, ' ');
    analyticsTrackPageView(name, path);
  }, [location.pathname]);
}
