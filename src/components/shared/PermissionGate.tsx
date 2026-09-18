import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useUserRole } from '../../context/UserRoleContext';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: boolean;
}

export function PermissionGate({ permission: _permission, children, fallback = null, redirect = false }: PermissionGateProps) {
  const { role } = useUserRole();
  const allowed = role === 'owner' || role === 'admin';
  if (!allowed) return redirect ? <Navigate to="/dashboard" /> : <>{fallback}</>;
  return <>{children}</>;
}

export function usePermission(permission: string) {
  void permission;
  const { role } = useUserRole();
  return { allowed: role === 'owner' || role === 'admin', isRbacReady: true };
}
