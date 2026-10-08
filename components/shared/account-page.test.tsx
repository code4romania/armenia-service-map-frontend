import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountPage } from './account-page';
import { ApiError } from '@/lib/api/client';

const updateProfileMock = vi.fn();
const changePasswordMock = vi.fn();
const logoutMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'ann@example.com', firstName: 'Ann', lastName: 'Lee', phone: '+374', role: 'ORG_ADMIN' },
    logout: logoutMock,
  }),
}));

vi.mock('@/lib/api/auth', () => ({
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));

function submitProfile() {
  fireEvent.submit(screen.getByRole('button', { name: 'profile.save' }).closest('form')!);
}

function submitPassword(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('password.current'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('password.new'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('password.confirm'), { target: { value: confirm } });
  fireEvent.submit(screen.getByRole('button', { name: 'password.save' }).closest('form')!);
}

describe('AccountPage', () => {
  beforeEach(() => {
    updateProfileMock.mockReset().mockResolvedValue({});
    changePasswordMock.mockReset().mockResolvedValue(undefined);
    logoutMock.mockReset().mockResolvedValue(undefined);
    invalidateQueriesMock.mockReset();
  });

  it('pre-fills the profile form from the signed-in user and keeps email read-only', () => {
    render(<AccountPage />);
    expect(screen.getByLabelText('profile.firstName')).toHaveValue('Ann');
    expect(screen.getByLabelText('profile.lastName')).toHaveValue('Lee');
    expect(screen.getByLabelText('profile.phone')).toHaveValue('+374');
    expect(screen.getByLabelText('profile.email')).toHaveValue('ann@example.com');
    expect(screen.getByLabelText('profile.email')).toBeDisabled();
  });

  it('saves name changes and refreshes the cached profile', async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText('profile.firstName'), { target: { value: 'Anna' } });
    submitProfile();
    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith({ firstName: 'Anna', lastName: 'Lee', phone: '+374' }),
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['auth', 'profile'] });
    expect(await screen.findByText('profile.saved')).toBeInTheDocument();
  });

  it('requires a first and last name before saving', async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText('profile.firstName'), { target: { value: '   ' } });
    submitProfile();
    expect(await screen.findByText('profile.firstNameRequired')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('rejects a short new password without calling the API', async () => {
    render(<AccountPage />);
    submitPassword('oldpass123', 'short', 'short');
    expect(await screen.findByText('password.tooShort')).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation without calling the API', async () => {
    render(<AccountPage />);
    submitPassword('oldpass123', 'correct-horse', 'battery-staple');
    expect(await screen.findByText('password.mismatch')).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('changes the password and clears the form', async () => {
    render(<AccountPage />);
    submitPassword('oldpass123', 'correct-horse', 'correct-horse');
    await waitFor(() =>
      expect(changePasswordMock).toHaveBeenCalledWith({ currentPassword: 'oldpass123', newPassword: 'correct-horse' }),
    );
    expect(await screen.findByText('password.saved')).toBeInTheDocument();
    expect(screen.getByLabelText('password.current')).toHaveValue('');
    expect(screen.getByLabelText('password.new')).toHaveValue('');
  });

  it('shows the wrong-password message when the API rejects the current password', async () => {
    changePasswordMock.mockRejectedValue(new ApiError(401, 'Current password is incorrect'));
    render(<AccountPage />);
    submitPassword('wrong', 'correct-horse', 'correct-horse');
    expect(await screen.findByText('password.wrongCurrent')).toBeInTheDocument();
  });

  it('signs the user out from the account page', async () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: 'signOut' }));
    await waitFor(() => expect(logoutMock).toHaveBeenCalled());
  });
});
