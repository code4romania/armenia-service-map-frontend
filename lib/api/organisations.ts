import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams, Organisation, OrganisationDetail } from '@/types/api';

export type JoinNetworkPayload = {
  organisationName: string;
  regionId?: string;
  contactName: string;
  email: string;
  phone?: string;
  servicesDescription: string;
};

export function useOrganisations(params: PaginationParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value));
  });
  const query = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'organisations', params],
    queryFn: () => apiClient<PaginatedResponse<Organisation>>(`/admin/organisations${query ? `?${query}` : ''}`),
  });
}

export function useOrganisation(id: string) {
  return useQuery({
    queryKey: ['admin', 'organisations', id],
    queryFn: () => apiClient<OrganisationDetail>(`/admin/organisations/${id}`),
    enabled: !!id,
  });
}

/** Mirrors the backend CreateOrganisationDto. `admin` becomes the organisation's ORG_ADMIN user. */
export type CreateOrganisationPayload = Partial<Omit<Organisation, 'id' | 'createdAt' | 'updatedAt' | 'region' | '_count'>> & {
  name: string;
  admin: { firstName: string; lastName: string; email: string; phone?: string };
};

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrganisationPayload) =>
      apiClient<Organisation>('/admin/organisations', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] }),
  });
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Organisation>) =>
      apiClient<Organisation>(`/admin/organisations/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations', variables.id] });
    },
  });
}

export function useDeleteOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient(`/admin/organisations/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] }),
  });
}

export function useJoinNetwork() {
  return useMutation({
    mutationFn: (data: JoinNetworkPayload) =>
      apiClient<Organisation>('/public/join-network', { method: 'POST', body: data }),
  });
}

export function useApproveOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<Organisation>(`/admin/organisations/${id}/approve`, { method: 'POST' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations', id] });
    },
  });
}

export function useRejectOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      apiClient<Organisation>(`/admin/organisations/${id}/reject`, {
        method: 'POST',
        body: rejectionReason ? { rejectionReason } : {},
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations', variables.id] });
    },
  });
}
