import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams, User } from '@/types/api';

export function useUsers(
  params: PaginationParams & {
    organisationId?: string;
    role?: 'SUPER_ADMIN' | 'ORG_ADMIN';
    /** List soft-deleted users instead of live ones. */
    deleted?: boolean;
  } = {},
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value));
  });
  const query = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => apiClient<PaginatedResponse<User>>(`/admin/users${query ? `?${query}` : ''}`),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => apiClient<User>(`/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: string;
      organisationId?: string;
    }) => apiClient<User>('/admin/users', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; firstName?: string; lastName?: string; role?: string }) =>
      apiClient<User>(`/admin/users/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

function useUserAction(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<User>(`/admin/users/${id}/${path}`, { method: 'POST' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', id] });
    },
  });
}

/** Suspends the account (status SUSPENDED); the user can no longer sign in. Reversible via activate. */
export function useDeactivateUser() {
  return useUserAction('deactivate');
}

export function useActivateUser() {
  return useUserAction('activate');
}

/** Emails a set-password link; doubles as "resend invitation" for PENDING users. */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  });
}

/** Undoes a soft delete; the user reappears in the live lists. */
export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<User>(`/admin/users/${id}/restore`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
