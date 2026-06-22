/**
 * DemoViewRedirector — Listens to the demo view role and navigates
 * between /dashboard (Pro) and /agence/dashboard (Agency) whenever
 * the toggle is switched.
 *
 * This component lives inside DashboardLayout so it always has access
 * to the router. It only fires a navigation when the current path
 * doesn't already match the expected destination.
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useDemoView } from '../../context/DemoViewContext';

export function DemoViewRedirector() {
  const { demoViewRole, showSwitcher } = useDemoView();
  const navigate = useNavigate();
  const location = useLocation();
  const prevRoleRef = useRef(demoViewRole);

  useEffect(() => {
    // Only fire when the role actually *changed* (not on initial mount)
    if (prevRoleRef.current === demoViewRole) return;
    prevRoleRef.current = demoViewRole;

    if (!showSwitcher) return;

    const currentPath = location.pathname;

    if (demoViewRole === 'agency' && currentPath !== '/agence/dashboard') {
      navigate({ to: '/agence/dashboard' });
    } else if (demoViewRole === 'pro' && currentPath === '/agence/dashboard') {
      navigate({ to: '/dashboard' });
    }
  }, [demoViewRole, showSwitcher, navigate, location.pathname]);

  return null;
}
