import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'owner' | 'admin' | 'team' | 'collaborateur';

interface UserRoleContextValue {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  /** Granular role for nav gating. 'owner' and 'admin' have full access. */
  role: UserRole;
  setRole: (r: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<UserRole>('owner');
  return (
    <UserRoleContext.Provider value={{ isAdmin, setIsAdmin, role, setRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

const USER_ROLE_FALLBACK: UserRoleContextValue = {
  isAdmin: false,
  setIsAdmin: () => { /* noop — no provider */ },
  role: 'owner',
  setRole: () => { /* noop — no provider */ },
};

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    console.warn('useUserRole must be used within UserRoleProvider — context missing, returning safe fallback');
    return USER_ROLE_FALLBACK;
  }
  return ctx;
}

/** Returns true when the user has restricted (collaborateur de terrain) access */
export function useIsTeamRole() {
  const { role } = useUserRole();
  return role === 'team' || role === 'collaborateur';
}
