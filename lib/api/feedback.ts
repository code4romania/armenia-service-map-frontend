import { useQuery } from '@tanstack/react-query';
import { apiClient, apiDownload } from './client';
import type {
  FeedbackFilters,
  FeedbackListItem,
  FeedbackSummary,
  PaginatedResponse,
  SubmitFeedbackPayload,
} from '@/types/api';

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function filterParams(filters: FeedbackFilters) {
  return {
    from: filters.from,
    to: filters.to,
    found: filters.found,
    fromKarabakh: filters.fromKarabakh,
  };
}

export function submitFeedback(payload: SubmitFeedbackPayload) {
  return apiClient<{ id: string }>('/public/feedback', { method: 'POST', body: payload });
}

export function useAdminFeedback(filters: FeedbackFilters & { page: number; perPage: number }) {
  return useQuery({
    queryKey: ['admin', 'feedback', 'list', filters],
    queryFn: () =>
      apiClient<PaginatedResponse<FeedbackListItem>>(
        withQuery('/admin/feedback', { page: filters.page, perPage: filters.perPage, ...filterParams(filters) }),
      ),
  });
}

export function useAdminFeedbackSummary(filters: FeedbackFilters) {
  return useQuery({
    queryKey: ['admin', 'feedback', 'summary', filters],
    queryFn: () => apiClient<FeedbackSummary>(withQuery('/admin/feedback/summary', filterParams(filters))),
  });
}

export async function downloadFeedbackCsv(filters: FeedbackFilters): Promise<void> {
  const { blob, filename } = await apiDownload(withQuery('/admin/feedback/export', filterParams(filters)));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? 'feedback.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
