import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agencyApi, uploadAgencyAsset, type AgencyResourceMap, type Workspace } from '../lib/agency/api';

export function useAgencyResource<K extends keyof AgencyResourceMap>(workspaceId: string | undefined, resource: K) {
  return useQuery({
    queryKey: ['agency', workspaceId, resource],
    queryFn: () => agencyApi.resource(workspaceId!, resource),
    enabled: Boolean(workspaceId),
  });
}

export function useAgency(workspaceId?: string) {
  const queryClient = useQueryClient();
  const workspaces = useQuery({ queryKey: ['agency-workspaces'], queryFn: agencyApi.workspaces });
  const summary = useQuery({ queryKey: ['agency', workspaceId, 'summary'], queryFn: () => agencyApi.summary(workspaceId!), enabled: Boolean(workspaceId) });
  const createWorkspace = useMutation({ mutationFn: agencyApi.createWorkspace, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency-workspaces'] }) });
  const create = useMutation({ mutationFn: ({ resource, data }: { resource: keyof AgencyResourceMap; data: Record<string, unknown> }) => agencyApi.create(workspaceId!, resource, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency', workspaceId] }) });
  const upload = useMutation({ mutationFn: (file: File) => uploadAgencyAsset(file, workspaceId!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency', workspaceId, 'assets'] }) });
  const setStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => agencyApi.status(workspaceId!, id, status), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency', workspaceId, 'content'] }) });
  const setApprovalStatus = useMutation({ mutationFn: ({ id, status, feedback }: { id: string; status: string; feedback?: string }) => agencyApi.approvalStatus(workspaceId!, id, status, feedback), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agency', workspaceId, 'approvals'] }); queryClient.invalidateQueries({ queryKey: ['agency', workspaceId, 'content'] }); queryClient.invalidateQueries({ queryKey: ['agency', workspaceId, 'summary'] }); } });
  return { workspaces: workspaces.data?.workspaces ?? [] as Workspace[], isLoading: workspaces.isLoading, summary, createWorkspace, create, upload, setStatus, setApprovalStatus };
}
