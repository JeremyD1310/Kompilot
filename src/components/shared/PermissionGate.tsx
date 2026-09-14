import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';
import { LoadingOverlay } from '@blinkdotnew/ui';
import { useUserRole } from '../../context/UserRoleContext';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: boolean;
}

export function PermissionGate({ permission, children, fallback = null, redirect = false }: PermissionGateProps) {
  const { can, isRbacReady } = useUserRole();
  if (!isRbacReady) return <LoadingOverlay loading />;
  if (!can(permission)) return redirect ? <Navigate to="/dashboard" /> : <>{fallback}</>;
  return <>{children}</>;
}

export function usePermission(permission: string) {
  const { can, isRbacReady } = useUserRole();
  return { allowed: isRbacReady && can(permission), isRbacReady };
}
