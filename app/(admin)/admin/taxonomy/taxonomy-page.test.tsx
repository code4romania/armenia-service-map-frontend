import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaxonomyPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () =>
    Object.assign(
      (key: string, values?: Record<string, string | number>) =>
        values ? `${key}:${Object.values(values).join(',')}` : key,
      { has: () => false },
    ),
}));

vi.mock('@/lib/api/taxonomy', () => ({
  useTopics: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 'topic-1',
          name: 'Psychological help',
          slug: 'psychological-help',
          icon: null,
          status: 'ACTIVE',
          sortOrder: 0,
          createdAt: '2026-04-06T00:00:00.000Z',
          updatedAt: '2026-04-06T00:00:00.000Z',
          _count: { services: 3 },
        },
      ],
      meta: { page: 1, perPage: 10, total: 1, totalPages: 1 },
    },
  }),
  useNeedTags: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 'tag-1',
          name: 'Housing',
          slug: 'housing',
          status: 'ACTIVE',
          createdAt: '2026-04-06T00:00:00.000Z',
          updatedAt: '2026-04-06T00:00:00.000Z',
          _count: { needReports: 2 },
        },
      ],
      meta: { page: 1, perPage: 10, total: 1, totalPages: 1 },
    },
  }),
  useTargetGroups: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 'group-1',
          name: 'Children',
          status: 'ACTIVE',
          createdAt: '2026-04-06T00:00:00.000Z',
          updatedAt: '2026-04-06T00:00:00.000Z',
          _count: { services: 4 },
        },
      ],
      meta: { page: 1, perPage: 10, total: 1, totalPages: 1 },
    },
  }),
}));

describe('TaxonomyPage', () => {
  it('shows route-oriented topic actions instead of topic edit modals', () => {
    render(<TaxonomyPage />);

    expect(screen.getByRole('button', { name: 'addTopic' })).toBeVisible();
    expect(screen.getAllByText('view').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('table-search-icon').length).toBeGreaterThan(0);
    expect(screen.queryByText('editTopic')).not.toBeInTheDocument();
  });
});
