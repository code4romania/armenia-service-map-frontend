import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PublicServicesPage from '@/app/(public)/services/page';

const servicesHookState = {
  total: 7,
  empty: false,
  totalPages: 1,
};

const scrollToMock = vi.fn();
window.scrollTo = scrollToMock;
const usePublicServicesMock = vi.fn();
const logSearchBatchMutate = vi.fn((payload: unknown, options?: { onSuccess?: () => void }) => {
  options?.onSuccess?.();
});

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () =>
    Object.assign(
      (key: string, values?: Record<string, string | number>) => {
        if (key === 'regionalServicesTitle') return `${values?.region}:${values?.count}`;
        if (key === 'viewResults') return `viewResults:${values?.count}`;
        if (key === 'refineWithin') return `Refine within ${values?.topic}`;
        return key;
      },
      { has: () => false },
    ),
}));

vi.mock('@/components/shared/armenia-map', () => ({
  ArmeniaMap: ({ onRegionClick }: { onRegionClick: (svgPathId: string) => void }) => (
    <div data-testid="armenia-map">
      <button type="button" onClick={() => onRegionClick('AM-ER')}>region-click</button>
    </div>
  ),
}));

vi.mock('@/components/admin/pagination', () => ({
  Pagination: ({
    onPageChange,
    onPerPageChange,
  }: {
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
  }) => (
    <div data-testid="pagination">
      <button type="button" onClick={() => onPageChange(2)}>page-change</button>
      <button type="button" onClick={() => onPerPageChange(25)}>per-page-change</button>
    </div>
  ),
}));

vi.mock('@/components/public/need-cta-banner', () => ({
  NeedCtaBanner: () => <div data-testid="need-cta-banner" />,
}));

vi.mock('@/components/public/subscribe-notify-card', () => ({
  SubscribeNotifyCard: () => <div data-testid="subscribe-notify-card" />,
}));

vi.mock('@/lib/i18n/service-content', () => ({
  getLocalizedServiceContent: (service: { title: string; shortDescription: string }) => ({
    title: service.title,
    shortDescription: service.shortDescription,
  }),
}));

vi.mock('@/lib/api/services', () => ({
  usePublicTopics: () => ({
    data: [
      {
        id: 'topic-1',
        name: 'Health',
        slug: 'health',
        children: [
          { id: 'sub-1', name: 'Emergency shelter', slug: 'emergency' },
          { id: 'sub-2', name: 'Long-term housing', slug: 'long-term' },
        ],
      },
      { id: 'topic-2', name: 'Legal', slug: 'legal' },
    ],
  }),
  usePublicRegions: () => ({ data: [{ id: 'region-1', name: 'Yerevan', slug: 'yerevan', svgPathId: 'AM-ER' }] }),
  usePublicRegionServiceCounts: () => ({ data: {} }),
  usePublicServices: (params: unknown) => {
    usePublicServicesMock(params);
    return {
      data: {
        data: servicesHookState.empty
          ? []
          : [
              { id: 's1', title: 'A1', shortDescription: 'd', organisation: { id: 'o1', name: 'Org' }, region: null, topics: [], targetGroup: [], availabilityState: 'AVAILABLE' },
              { id: 's2', title: 'A2', shortDescription: 'd', organisation: { id: 'o1', name: 'Org' }, region: null, topics: [], targetGroup: [], availabilityState: 'AVAILABLE_SOON' },
              { id: 's3', title: 'A3', shortDescription: 'd', organisation: { id: 'o1', name: 'Org' }, region: null, topics: [], targetGroup: [], availabilityState: 'UNAVAILABLE' },
            ],
        meta: {
          total: servicesHookState.empty ? 0 : servicesHookState.total,
          page: 1,
          perPage: 10,
          totalPages: servicesHookState.totalPages,
        },
      },
      isLoading: false,
    };
  },
}));

vi.mock('@/lib/api/analytics', () => ({
  sendPublicSearchLogBatchBeacon: () => false,
  useLogPublicSearchBatch: () => ({
    mutate: logSearchBatchMutate,
  }),
}));

describe('PublicServicesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    usePublicServicesMock.mockClear();
    logSearchBatchMutate.mockClear();
    scrollToMock.mockClear();
    window.scrollTo = scrollToMock;
    servicesHookState.total = 7;
    servicesHookState.empty = false;
    servicesHookState.totalPages = 1;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true, // desktop by default
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders a badge per availability state', () => {
    render(<PublicServicesPage />);
    // The next-intl mock returns the key as-is, so badges render their key text.
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('availableSoon')).toBeInTheDocument();
    expect(screen.getByText('unavailable')).toBeInTheDocument();
  });

  it('shows the report-a-need CTA and a clear-selection button when filters yield no results', () => {
    servicesHookState.empty = true;
    render(<PublicServicesPage />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'searchPlaceholder' }), {
      target: { value: 'nothing-matches' },
    });

    expect(screen.getByRole('button', { name: 'clearFilters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'reportNeed' })).toHaveAttribute('href', '/report-a-need');
    expect(screen.queryByText('noResults')).not.toBeInTheDocument();
  });

  it('resets the search when clear-selection is clicked', () => {
    servicesHookState.empty = true;
    render(<PublicServicesPage />);

    const searchBox = screen.getByRole('searchbox', { name: 'searchPlaceholder' });
    fireEvent.change(searchBox, { target: { value: 'nothing-matches' } });
    expect(searchBox).toHaveValue('nothing-matches');

    fireEvent.click(screen.getByRole('button', { name: 'clearFilters' }));

    expect(searchBox).toHaveValue('');
  });

  it('shows the plain no-results message and no clear button when empty without active filters', () => {
    servicesHookState.empty = true;
    render(<PublicServicesPage />);

    expect(screen.getByText('noResults')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'clearFilters' })).not.toBeInTheDocument();
  });

  it('updates live service results immediately while typing', async () => {
    render(<PublicServicesPage />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'searchPlaceholder' }), {
      target: { value: 'healthcare' },
    });

    expect(usePublicServicesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'healthcare',
      }),
    );
  });

  it('queues a settled search after 5 seconds and flushes it when the tab is hidden', async () => {
    render(<PublicServicesPage />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'searchPlaceholder' }), {
      target: { value: 'healthcare' },
    });

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(logSearchBatchMutate).not.toHaveBeenCalled();
    expect(localStorage.getItem('public-search-log-queue')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(logSearchBatchMutate).not.toHaveBeenCalled();

    expect(JSON.parse(localStorage.getItem('public-search-log-queue') ?? '[]')).toEqual([
      {
        query: 'healthcare',
        regionId: null,
        topicIds: [],
        resultsCount: 7,
      },
    ]);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(logSearchBatchMutate).toHaveBeenCalledWith(
      {
        events: [
          {
            query: 'healthcare',
            regionId: null,
            topicIds: [],
            resultsCount: 7,
          },
        ],
      },
      expect.any(Object),
    );
    expect(localStorage.getItem('public-search-log-queue')).toBeNull();
  });

  it('scrolls to the results when the pagination page changes', () => {
    servicesHookState.totalPages = 2;
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'page-change' }));

    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the results when the per-page size changes', () => {
    servicesHookState.totalPages = 2;
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'per-page-change' }));

    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the service list when a region is clicked on the map', () => {
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'region-click' }));

    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the service list when the mobile View results button is clicked', () => {
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'viewResults:7' }));

    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it('labels the mobile View results button with the live result count', () => {
    servicesHookState.total = 12;
    render(<PublicServicesPage />);

    expect(screen.getByRole('button', { name: 'viewResults:12' })).toBeInTheDocument();
  });

  it('reveals subtopic chips only after a parent topic is selected', () => {
    render(<PublicServicesPage />);

    expect(screen.queryByRole('button', { name: 'Emergency shelter' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Health' }));

    expect(screen.getByRole('button', { name: 'Emergency shelter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Long-term housing' })).toBeInTheDocument();
  });

  it('labels the subtopic row with the selected parent topic name', () => {
    render(<PublicServicesPage />);

    expect(screen.queryByText('Refine within Health')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Health' }));

    expect(screen.getByText('Refine within Health')).toBeInTheDocument();
  });

  it('adds the selected subtopic id to the search query alongside its parent', () => {
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    fireEvent.click(screen.getByRole('button', { name: 'Emergency shelter' }));

    expect(usePublicServicesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ topicIds: 'topic-1,sub-1' }),
    );
  });

  it('filters by only the parent when no subtopic is selected', () => {
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Health' }));

    expect(usePublicServicesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ topicIds: 'topic-1' }),
    );
  });

  it('clears the selected subtopic when the parent is deselected', () => {
    render(<PublicServicesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    fireEvent.click(screen.getByRole('button', { name: 'Emergency shelter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Health' })); // toggle parent off

    expect(screen.queryByRole('button', { name: 'Emergency shelter' })).not.toBeInTheDocument();
    expect(usePublicServicesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ topicIds: undefined }),
    );
  });

  it('does not scroll when changing filters', () => {
    render(<PublicServicesPage />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'searchPlaceholder' }), {
      target: { value: 'healthcare' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'onlyAvailable' }));

    expect(scrollToMock).not.toHaveBeenCalled();
  });
});
