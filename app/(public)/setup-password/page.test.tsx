import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetupPasswordPage from './page';
import { ApiError } from '@/lib/api/client';

const pushMock = vi.fn();
const setupPasswordMock = vi.fn();
let token: string | null = 'valid-token';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: () => token }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/auth', () => ({
  setupPassword: (...args: unknown[]) => setupPasswordMock(...args),
}));

function fill(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('setupPassword.newPassword'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('setupPassword.confirmPassword'), { target: { value: confirm } });
  fireEvent.submit(screen.getByRole('button', { name: 'setupPassword.submit' }).closest('form')!);
}

describe('SetupPasswordPage', () => {
  beforeEach(() => {
    token = 'valid-token';
    pushMock.mockReset();
    setupPasswordMock.mockReset().mockResolvedValue(undefined);
  });

  it('shows the missing-token state when the URL has no token', () => {
    token = null;
    render(<SetupPasswordPage />);
    expect(screen.getByText('setupPassword.missingToken')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'setupPassword.submit' })).not.toBeInTheDocument();
  });

  it('rejects passwords shorter than 8 characters without calling the API', async () => {
    render(<SetupPasswordPage />);
    fill('short', 'short');
    expect(await screen.findByText('setupPassword.tooShort')).toBeInTheDocument();
    expect(setupPasswordMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation without calling the API', async () => {
    render(<SetupPasswordPage />);
    fill('correct-horse', 'battery-staple');
    expect(await screen.findByText('setupPassword.mismatch')).toBeInTheDocument();
    expect(setupPasswordMock).not.toHaveBeenCalled();
  });

  it('submits the token and password, then sends the user to login', async () => {
    render(<SetupPasswordPage />);
    fill('correct-horse', 'correct-horse');
    await waitFor(() => expect(setupPasswordMock).toHaveBeenCalledWith({ token: 'valid-token', password: 'correct-horse' }));
    expect(await screen.findByText('setupPassword.successTitle')).toBeInTheDocument();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'), { timeout: 4000 });
  });

  it('shows the invalid-token message when the API rejects the token', async () => {
    setupPasswordMock.mockRejectedValue(new ApiError(400, 'Invalid or expired setup token'));
    render(<SetupPasswordPage />);
    fill('correct-horse', 'correct-horse');
    expect(await screen.findByText('setupPassword.invalidToken')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
