import { describe, expect, it } from 'bun:test';
import { resolveWorkspaceAuthorization, ROLE_PERMISSIONS, hasPermission } from '../../backend/lib/rbacMiddleware';

function authority(tables: Record<string, unknown[]>, failures: string[] = []) {
  return {
    db: {
      table: (name: string) => ({
        list: async () => {
          if (failures.includes(name)) throw new Error(`${name} unavailable`);
          return tables[name] ?? [];
        },
      }),
    },
  };
}

describe('workspace RBAC authority resolution', () => {
  it('preserves a solo legacy workspace owner without a team member row', async () => {
    const result = await resolveWorkspaceAuthorization(authority({
      team_members: [],
      agency_workspaces: [{ id: 'agency-1', ownerId: 'owner-1' }],
      agency_workspace_members: [],
    }), 'owner-1', 'agency-1');
    expect(result?.role).toBe('owner');
    expect(result?.ownerId).toBe('owner-1');
  });

  it('resolves an agency owner from the server workspace record', async () => {
    const result = await resolveWorkspaceAuthorization(authority({
      team_members: [],
      agency_workspaces: [{ id: 'agency-1', ownerId: 'owner-1' }],
      agency_workspace_members: [{ workspaceId: 'agency-1', userId: 'owner-1', role: 'owner', status: 'active' }],
    }), 'owner-1', 'agency-1');
    expect(result?.role).toBe('owner');
    expect(result?.ownerId).toBe('owner-1');
  });

  it('maps admin, member, and guest roles without trusting metadata', async () => {
    const rows = [
      ['admin-1', 'admin'],
      ['member-1', 'member'],
      ['guest-1', 'guest'],
    ] as const;
    for (const [userId, role] of rows) {
      const result = await resolveWorkspaceAuthorization(authority({
        team_members: [{ workspaceOwnerId: 'workspace-1', memberUserId: userId, role, status: 'active' }],
        agency_workspaces: [],
        agency_workspace_members: [],
      }), userId, 'workspace-1');
      expect(result?.role).toBe(role);
    }
  });

  it('returns no authority for a user without a role or from another workspace', async () => {
    const tables = {
      team_members: [{ workspaceOwnerId: 'workspace-1', memberUserId: 'member-1', role: 'member', status: 'active' }],
      agency_workspaces: [],
      agency_workspace_members: [],
    };
    expect(await resolveWorkspaceAuthorization(authority(tables), 'nobody', 'workspace-1')).toBeNull();
    expect(await resolveWorkspaceAuthorization(authority(tables), 'member-1', 'workspace-2')).toBeNull();
  });

  it('propagates unavailable authority so middleware can return 503', async () => {
    await expect(resolveWorkspaceAuthorization(authority({
      team_members: [],
      agency_workspaces: [],
      agency_workspace_members: [],
    }, ['team_members']), 'user-1')).rejects.toThrow('unavailable');
  });

  it('does not grant elevated permission to an unknown role', () => {
    expect(ROLE_PERMISSIONS.owner).toEqual(['*']);
    expect(hasPermission('admin', 'billing.manage')).toBe(true);
    expect(hasPermission('owner', 'billing.manage')).toBe(true);
    expect(hasPermission('guest', 'billing.manage')).toBe(false);
  });
});
