/**
 * BottomNav — Mobile-only bottom navigation bar
 *
 * Renders the .nc-bottom-nav CSS component defined in src/index.css.
 * Shows 5 primary navigation items on mobile (< 768px), hidden on desktop.
 */
import { useLocation, Link } from '@tanstack/react-router';
import {
  LayoutDashboard, Calendar, MessageSquare,
  BarChart3, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/command-center', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/calendar', icon: Calendar, label: 'Calendrier' },
  { to: '/inbox', icon: MessageSquare, label: 'Messages' },
  { to: '/analytics', icon: BarChart3, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="nc-bottom-nav md:hidden" aria-label="Navigation principale">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = currentPath === to || currentPath.startsWith(to + '/');
        return (
          <Link
            key={to}
            to={to}
            data-active={String(isActive)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
