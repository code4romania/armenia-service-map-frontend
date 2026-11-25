import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminFeedbackPage from './page';

const state = vi.hoisted(() => ({
  summary: {
    total: 3,
    withLookingFor: 1,
    usefulness: { NOT_AT_ALL: 0, SLIGHTLY: 1, MODERATELY: 0, VERY: 2, EXTREMELY: 0 },
    found: { YES: 2, PARTLY: 1, NO: 0 },
    fromKarabakh: { YES: 1, NO: 2, PREFER_NOT_TO_SAY: 0 },
  },
  error: false,
  listCalls: [] as Array<Record<string, unknown>>,
  summaryCalls: [] as Array<Record<string, unknown>>,
}));

const LONG = 'a'.repeat(60) + ' ' + 'b'.repeat(120);

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => 'en',
}));

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: { data: { labels: string[] } }) => (
    <div data-testid="bar-chart">{data.labels.join('|')}</div>
  ),
}));

vi.mock('@/lib/toast-bus', () => ({ publishToast: vi.fn() }));

vi.mock('@/lib/api/feedback', () => ({
  useAdminFeedback: (filters: Record<string, unknown>) => {
    state.listCalls.push(filters);
    return {
      isLoading: false,
      isError: state.error,
      data: {
        data: [
          {
            id: 'f1',
            createdAt: '2026-11-20T10:00:00.000Z',
            usefulness: 'VERY',
            found: 'PARTLY',
            lookingFor: LONG,
            fromKarabakh: 'NO',
            locale: 'hy',
            pagePath: '/services/s1',
            service: { id: 's1', title: 'Live service', deleted: false },
          },
          {
            id: 'f2',
            createdAt: '2026-11-21T10:00:00.000Z',
            usefulness: 'SLIGHTLY',
            found: 'YES',
            lookingFor: null,
            fromKarabakh: 'YES',
            locale: 'en',
            pagePath: '/services/s2',
            service: { id: 's2', title: 'Gone service', deleted: true },
          },
        ],
        meta: { total: 25, page: (filters.page as number) ?? 1, perPage: 10, totalPages: 3 },
      },
    };
  },
  useAdminFeedbackSummary: (filters: Record<string, unknown>) => {
    state.summaryCalls.push(filters);
    return { isLoading: false, isError: state.error, data: state.error ? undefined : state.summary };
  },
  downloadFeedbackCsv: vi.fn().mockResolvedValue(undefined),
}));

import { publishToast } from '@/lib/toast-bus';
import { downloadFeedbackCsv } from '@/lib/api/feedback';

describe('AdminFeedbackPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 2026-11-25 10:00 in Yerevan
    vi.setSystemTime(new Date('2026-11-25T06:00:00.000Z'));
    state.listCalls.length = 0;
    state.summaryCalls.length = 0;
    state.summary.total = 3;
    state.error = false;
    vi.mocked(publishToast).mockClear();
    vi.mocked(downloadFeedbackCsv).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the total card, chart labels and defaults to last 30 days', () => {
    render(<AdminFeedbackPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'adminFeedback.title' })).toBeInTheDocument();
    expect(screen.getByText('adminFeedback.total')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(3);
    expect(screen.getByText('feedback.q1')).toBeInTheDocument();
    expect(screen.getByText('feedback.q2')).toBeInTheDocument();
    expect(screen.getByText('feedback.q3')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart')[0].textContent).toContain('feedback.q1Options.VERY');
    expect(state.summaryCalls.at(-1)).toMatchObject({ from: '2026-10-27', to: '2026-11-25' });
  });

  it('refetches with from = today-89 when switching to last90', () => {
    render(<AdminFeedbackPage />);
    fireEvent.change(screen.getByLabelText('adminFeedback.period'), { target: { value: 'last90' } });
    expect(state.listCalls.at(-1)).toMatchObject({ from: '2026-08-28', to: '2026-11-25', page: 1 });
    expect(state.summaryCalls.at(-1)).toMatchObject({ from: '2026-08-28', to: '2026-11-25' });
  });

  it('sends no dates for all time and uses custom date inputs', () => {
    render(<AdminFeedbackPage />);
    const period = screen.getByLabelText('adminFeedback.period');
    fireEvent.change(period, { target: { value: 'all' } });
    expect(state.summaryCalls.at(-1)).toMatchObject({ from: undefined, to: undefined });
    fireEvent.change(period, { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('adminFeedback.from'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('adminFeedback.to'), { target: { value: '2026-02-01' } });
    expect(state.summaryCalls.at(-1)).toMatchObject({ from: '2026-01-01', to: '2026-02-01' });
  });

  it('truncates lookingFor and expands on click', () => {
    render(<AdminFeedbackPage />);
    expect(screen.queryByText(LONG)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^a{20}/ })[0]);
    expect(screen.getAllByText(LONG).length).toBeGreaterThan(0);
  });

  it('links live services and marks deleted ones without a link', () => {
    render(<AdminFeedbackPage />);
    const link = screen.getAllByRole('link', { name: 'Live service' })[0];
    expect(link).toHaveAttribute('href', '/admin/services/s1');
    expect(screen.getAllByText(/Gone service/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Gone service/ })).not.toBeInTheDocument();
    expect(screen.getAllByText(/adminFeedback.deletedService/).length).toBeGreaterThan(0);
  });

  it('downloads CSV with the current filters', () => {
    render(<AdminFeedbackPage />);
    fireEvent.click(screen.getByRole('button', { name: 'adminFeedback.downloadCsv' }));
    expect(downloadFeedbackCsv).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-10-27', to: '2026-11-25' }),
    );
  });

  it('shows the empty state when there are no responses', () => {
    state.summary.total = 0;
    render(<AdminFeedbackPage />);
    expect(screen.getByText('adminFeedback.empty')).toBeInTheDocument();
  });

  it('toasts an error and re-enables the button when the CSV download fails', async () => {
    let reject!: (e: Error) => void;
    vi.mocked(downloadFeedbackCsv).mockReturnValueOnce(new Promise<void>((_, r) => (reject = r)));
    render(<AdminFeedbackPage />);
    const button = screen.getByRole('button', { name: 'adminFeedback.downloadCsv' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(downloadFeedbackCsv).toHaveBeenCalledTimes(1);
    reject(new Error('401'));
    await waitFor(() =>
      expect(publishToast).toHaveBeenCalledWith({ type: 'error', message: 'adminFeedback.downloadError' }),
    );
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('shows an error state instead of the empty state when loading fails', () => {
    state.error = true;
    render(<AdminFeedbackPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('adminFeedback.loadError');
    expect(screen.queryByText('adminFeedback.empty')).not.toBeInTheDocument();
  });

  it('resets to page 1 when a filter changes', () => {
    render(<AdminFeedbackPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'admin.pagination.goToPage' })[1]);
    expect(state.listCalls.at(-1)).toMatchObject({ page: 2 });
    fireEvent.change(screen.getByLabelText('adminFeedback.filterFound'), { target: { value: 'YES' } });
    expect(state.listCalls.at(-1)).toMatchObject({ page: 1, found: 'YES' });
  });
});
