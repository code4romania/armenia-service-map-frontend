import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import en from '@/messages/en.json';
import { FeedbackWidget } from './feedback-widget';

const fb = en.feedback;

const submitFeedback = vi.fn();
vi.mock('@/lib/api/feedback', () => ({ submitFeedback: (p: unknown) => submitFeedback(p) }));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (ns: string) => (key: string, values?: Record<string, string | number>) => {
    const node = (ns + '.' + key).split('.').reduce<unknown>((n, k) => (n as Record<string, unknown>)?.[k], en);
    let s = typeof node === 'string' ? node : `${ns}.${key}`;
    if (values) for (const [k, v] of Object.entries(values)) s = s.replace(`{${k}}`, String(v));
    return s;
  },
}));

let mockPath = '/services';
vi.mock('next/navigation', () => ({ usePathname: () => mockPath }));

let auth = { isLoading: false, isAuthenticated: false };
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => auth }));

let triggered = false;
vi.mock('./feedback-engagement-context', () => ({
  useFeedbackEngagement: () => ({
    reportResultsInteraction: () => {},
    reportDetailView: () => {},
    leaveDetailView: () => {},
    triggered,
  }),
}));

let storedState: 'dismissed' | 'submitted' | null = null;
let autoOpened = false;
const setState = vi.fn((s: 'dismissed' | 'submitted') => {
  storedState = s;
});
const markAutoOpened = vi.fn(() => {
  autoOpened = true;
});
vi.mock('./feedback-storage', () => ({
  feedbackStorage: {
    getState: () => storedState,
    setState: (s: 'dismissed' | 'submitted') => setState(s),
    wasAutoOpened: () => autoOpened,
    markAutoOpened: () => markAutoOpened(),
    consumeOwnSearchFlag: () => false,
    markOwnSearch: () => {},
  },
}));

function renderWidget() {
  const utils = render(<FeedbackWidget />);
  return { ...utils, rerenderWidget: () => utils.rerender(<FeedbackWidget />) };
}

function fire(rerenderWidget: () => void) {
  triggered = true;
  rerenderWidget();
}

const pill = () => screen.queryByRole('button', { name: fb.button });
const dialog = () => screen.queryByRole('dialog', { name: fb.title });

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: fb.q1Options.VERY }));
  await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: fb.q2Options.YES }));
  await user.click(within(screen.getByRole('radiogroup', { name: fb.q3 })).getByRole('radio', { name: fb.q3Options.NO }));
}

describe('FeedbackWidget', () => {
  beforeEach(() => {
    mockPath = '/services';
    auth = { isLoading: false, isAuthenticated: false };
    triggered = false;
    storedState = null;
    autoOpened = false;
    setState.mockClear();
    markAutoOpened.mockClear();
    submitFeedback.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing before the trigger fires', () => {
    const { container } = renderWidget();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an authenticated user even when dismissed', () => {
    auth = { isLoading: false, isAuthenticated: true };
    storedState = 'dismissed';
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    expect(container).toBeEmptyDOMElement();
    expect(markAutoOpened).not.toHaveBeenCalled();
  });

  it('renders nothing while auth is loading', () => {
    auth = { isLoading: true, isAuthenticated: false };
    storedState = 'dismissed';
    const { container } = renderWidget();
    expect(container).toBeEmptyDOMElement();
  });

  it('disappears when the user logs in while the dialog is open', () => {
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    expect(dialog()).toBeInTheDocument();
    auth = { isLoading: false, isAuthenticated: true };
    rerenderWidget();
    expect(dialog()).not.toBeInTheDocument();
    expect(pill()).not.toBeInTheDocument();
  });

  it('auto-opens a non-modal labelled dialog on trigger and moves focus into it', () => {
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    const d = dialog();
    expect(d).toBeInTheDocument();
    expect(d).toHaveAttribute('aria-modal', 'false');
    expect(markAutoOpened).toHaveBeenCalledTimes(1);
    expect(d).toContainElement(document.activeElement as HTMLElement);
  });

  it('Esc collapses to the pill, stores dismissed and focuses the pill', async () => {
    const user = userEvent.setup();
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    await user.keyboard('{Escape}');
    expect(dialog()).not.toBeInTheDocument();
    expect(setState).toHaveBeenCalledWith('dismissed');
    expect(pill()).toBeInTheDocument();
    expect(pill()).toHaveFocus();
  });

  it('close button collapses and the pill reopens the dialog with previous answers', async () => {
    const user = userEvent.setup();
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    await user.click(screen.getByRole('radio', { name: fb.q1Options.VERY }));
    await user.click(screen.getByRole('button', { name: fb.close }));
    expect(setState).toHaveBeenCalledWith('dismissed');
    expect(dialog()).not.toBeInTheDocument();
    await user.click(pill()!);
    expect(dialog()).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: fb.q1Options.VERY })).toBeChecked();
    expect(pill()).not.toBeInTheDocument();
  });

  it('a pointerdown or scroll outside without a click does not dismiss', () => {
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    fireEvent.pointerDown(document.body);
    fireEvent.touchStart(document.body);
    fireEvent.scroll(window);
    expect(dialog()).toBeInTheDocument();
    expect(setState).not.toHaveBeenCalled();
  });

  it('clicking outside the dialog collapses it', () => {
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    fireEvent.click(document.body);
    expect(dialog()).not.toBeInTheDocument();
    expect(setState).toHaveBeenCalledWith('dismissed');
    expect(pill()).toBeInTheDocument();
  });

  it('shows only the pill when dismissed on load, without auto-opening on trigger', () => {
    storedState = 'dismissed';
    const { rerenderWidget } = renderWidget();
    expect(pill()).toBeInTheDocument();
    expect(pill()).not.toHaveFocus();
    fire(rerenderWidget);
    expect(dialog()).not.toBeInTheDocument();
    expect(markAutoOpened).not.toHaveBeenCalled();
  });

  it('ignores the trigger when already auto-opened this visit', () => {
    autoOpened = true;
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows thanks after submit, stores submitted, and disappears after 3 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    submitFeedback.mockResolvedValue({ id: 'x' });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: fb.send }));
    expect(await screen.findByText(fb.thanks)).toBeInTheDocument();
    expect(setState).toHaveBeenCalledWith('submitted');
    expect(submitFeedback).toHaveBeenCalledWith(expect.objectContaining({ pagePath: '/services' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('hides everything when a submit resolves after the user collapsed the dialog', async () => {
    let resolve: (v: { id: string }) => void = () => {};
    submitFeedback.mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: fb.send }));
    await user.keyboard('{Escape}');
    expect(pill()).toBeInTheDocument();
    await act(async () => {
      resolve({ id: 'x' });
    });
    expect(setState).toHaveBeenLastCalledWith('submitted');
    expect(screen.queryByText(fb.thanks)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('passes the service id on a service detail page', async () => {
    mockPath = '/services/abc-123';
    submitFeedback.mockResolvedValue({ id: 'x' });
    const user = userEvent.setup();
    const { rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: fb.send }));
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ pagePath: '/services/abc-123', serviceId: 'abc-123' }),
    );
  });

  it('renders nothing when already submitted', () => {
    storedState = 'submitted';
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(['/login', '/forgot-password', '/setup-password', '/unsubscribe'])('renders nothing on %s', (path) => {
    mockPath = path;
    storedState = 'dismissed';
    const { container, rerenderWidget } = renderWidget();
    fire(rerenderWidget);
    expect(container).toBeEmptyDOMElement();
    expect(markAutoOpened).not.toHaveBeenCalled();
  });
});
