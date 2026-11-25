import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import en from '@/messages/en.json';
import { ApiError } from '@/lib/api/client';
import { FeedbackForm } from './feedback-form';

const submitFeedback = vi.fn();
vi.mock('@/lib/api/feedback', () => ({ submitFeedback: (p: unknown) => submitFeedback(p) }));

let mockLocale = 'en';
vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: (ns: string) => (key: string, values?: Record<string, string | number>) => {
    const node = (ns + '.' + key).split('.').reduce<unknown>((n, k) => (n as Record<string, unknown>)?.[k], en);
    let s = typeof node === 'string' ? node : `${ns}.${key}`;
    if (values) for (const [k, v] of Object.entries(values)) s = s.replace(`{${k}}`, String(v));
    return s;
  },
}));

const fb = en.feedback;

function setup(props: Partial<React.ComponentProps<typeof FeedbackForm>> = {}) {
  const onSubmitted = vi.fn();
  const onClose = vi.fn();
  render(<FeedbackForm pagePath="/services" onSubmitted={onSubmitted} onClose={onClose} {...props} />);
  return { onSubmitted, onClose, user: userEvent.setup() };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>, found = fb.q2Options.YES) {
  await user.click(screen.getByRole('radio', { name: fb.q1Options.VERY }));
  await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: found }));
  await user.click(within(screen.getByRole('radiogroup', { name: fb.q3 })).getByRole('radio', { name: fb.q3Options.NO }));
}

describe('FeedbackForm', () => {
  beforeEach(() => {
    submitFeedback.mockReset();
    mockLocale = 'en';
  });

  it('renders one radiogroup per question labelled by question text with exact option labels', () => {
    setup();
    for (const q of [fb.q1, fb.q2, fb.q3]) expect(screen.getByRole('radiogroup', { name: q })).toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3);
    expect(fb.q21).toBe('If you answered “Partly” or “No”: What were you looking for?');
    expect(within(screen.getByRole('radiogroup', { name: fb.q1 })).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Not at all useful', 'Slightly useful', 'Moderately useful', 'Very useful', 'Extremely useful',
    ]);
  });

  it('shows 2.1 textarea only for PARTLY/NO with maxLength 500 and live counter', async () => {
    const { user } = setup();
    expect(screen.queryByLabelText(fb.q21)).not.toBeInTheDocument();
    await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: fb.q2Options.YES }));
    expect(screen.queryByLabelText(fb.q21)).not.toBeInTheDocument();
    await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: fb.q2Options.PARTLY }));
    const ta = screen.getByLabelText(fb.q21);
    expect(ta).toHaveAttribute('maxlength', '500');
    expect(screen.getByText('0/500')).toBeInTheDocument();
    await user.type(ta, 'twelve chars');
    expect(screen.getByText('12/500')).toBeInTheDocument();
    await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: fb.q2Options.NO }));
    expect(screen.getByLabelText(fb.q21)).toBeInTheDocument();
  });

  it('shows three required errors and sends nothing when empty', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: fb.send }));
    expect(screen.getAllByText(fb.required)).toHaveLength(3);
    expect(submitFeedback).not.toHaveBeenCalled();
    const group = screen.getByRole('radiogroup', { name: fb.q1 });
    const errId = group.getAttribute('aria-describedby');
    expect(errId).toBeTruthy();
    expect(document.getElementById(errId!)).toHaveTextContent(fb.required);
  });

  it('omits lookingFor after switching from NO back to YES', async () => {
    submitFeedback.mockResolvedValue({ id: '1' });
    const { user } = setup({ serviceId: 's1' });
    await fillRequired(user, fb.q2Options.NO);
    await user.type(screen.getByLabelText(fb.q21), 'something');
    await user.click(within(screen.getByRole('radiogroup', { name: fb.q2 })).getByRole('radio', { name: fb.q2Options.YES }));
    await user.click(screen.getByRole('button', { name: fb.send }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalled());
    const payload = submitFeedback.mock.calls[0][0];
    expect(payload).not.toHaveProperty('lookingFor');
    expect(payload).toMatchObject({ usefulness: 'VERY', found: 'YES', fromKarabakh: 'NO', locale: 'en', pagePath: '/services', serviceId: 's1' });
  });

  it('sends trimmed lookingFor for NO and uses current locale', async () => {
    mockLocale = 'hy';
    submitFeedback.mockResolvedValue({ id: '1' });
    const { user, onSubmitted } = setup();
    await fillRequired(user, fb.q2Options.NO);
    await user.type(screen.getByLabelText(fb.q21), '  housing  ');
    await user.click(screen.getByRole('button', { name: fb.send }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(submitFeedback.mock.calls[0][0]).toMatchObject({ found: 'NO', lookingFor: 'housing', locale: 'hy' });
  });

  it('shows errorTooMany on 429 and keeps selections and Send enabled', async () => {
    submitFeedback.mockRejectedValue(new ApiError(429, 'x'));
    const { user, onSubmitted } = setup();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: fb.send }));
    expect(await screen.findByText(fb.errorTooMany)).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: fb.q1Options.VERY })).toBeChecked();
    expect(screen.getByRole('button', { name: fb.send })).toBeEnabled();
  });

  it('shows errorGeneric on other failures', async () => {
    submitFeedback.mockRejectedValue(new Error('network'));
    const { user } = setup();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: fb.send }));
    expect(await screen.findByText(fb.errorGeneric)).toBeInTheDocument();
  });

  it('calls onClose from the close button', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: fb.close }));
    expect(onClose).toHaveBeenCalled();
  });
});
