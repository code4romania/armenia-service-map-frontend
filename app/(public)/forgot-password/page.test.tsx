import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';
import { ApiError } from '@/lib/api/client';

const forgotPasswordMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/auth', () => ({
  forgotPassword: (...args: unknown[]) => forgotPasswordMock(...args),
}));

function submit(email: string) {
  fireEvent.change(screen.getByLabelText('email'), { target: { value: email } });
  fireEvent.submit(screen.getByRole('button', { name: 'forgotPassword.submit' }).closest('form')!);
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset().mockResolvedValue(undefined);
  });

  it('sends the email and shows the generic success state', async () => {
    render(<ForgotPasswordPage />);
    submit('someone@example.com');
    await waitFor(() => expect(forgotPasswordMock).toHaveBeenCalledWith({ email: 'someone@example.com' }));
    expect(await screen.findByText('forgotPassword.successTitle')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'forgotPassword.submit' })).not.toBeInTheDocument();
  });

  it('shows a generic error when the request fails', async () => {
    forgotPasswordMock.mockRejectedValue(new ApiError(500, 'boom'));
    render(<ForgotPasswordPage />);
    submit('someone@example.com');
    expect(await screen.findByText('forgotPassword.error')).toBeInTheDocument();
  });

  it('links back to the login page', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: 'forgotPassword.backToLogin' })).toHaveAttribute('href', '/login');
  });
});
