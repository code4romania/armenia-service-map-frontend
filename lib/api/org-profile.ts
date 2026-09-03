import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { OrganisationDetail, PaginatedResponse, PaginationParams, User } from '@/types/api';

export interface OrgProfileUpdatePayload {
  name?: string;
  legalName?: string;
  description?: string;
  website?: string;
  country?: string;
  streetAddress?: string;
  location?: string;
  organisationType?: string;
  uniqueIdentifier?: string;
  category?: string;
  activityDomain?: string;
  legalRepName?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  legalDocumentUrl?: string;
  logoUrl?: string;
  observations?: string;
  tags?: string[];
  regionIds?: string[];
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function useOrgProfile() {
  return useQuery({
    queryKey: ['org', 'profile'],
    queryFn: () => apiClient<OrganisationDetail>('/org/profile'),
  });
}

export function useOrgProfileUsers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: ['org', 'profile', 'users', params],
    queryFn: () =>
      apiClient<PaginatedResponse<User>>(
        withQuery('/org/profile/users', {
          page: params.page,
          perPage: params.perPage,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          search: params.search,
        }),
      ),
  });
}

export function useUpdateOrgProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrgProfileUpdatePayload) =>
      apiClient<OrganisationDetail>('/org/profile', { method: 'PATCH', body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'profile'] });
    },
  });
}
