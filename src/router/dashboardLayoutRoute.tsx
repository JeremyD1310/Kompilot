/**
 * dashboardLayoutRoute.tsx
 * The protected layout route that wraps all dashboard pages.
 */
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './rootRoute';
import { AuthGuard } from './guards';
import { DashboardLayout } from '../layouts/DashboardLayout';

export const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboard-layout',
  component: () => (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
});
