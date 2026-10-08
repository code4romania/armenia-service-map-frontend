import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserDetailPage from './page';

const pushMock = vi.fn();
const useUserMock = vi.fn();
const deleteMutate = vi.fn();
const deactivateMutate = vi.fn();
const activateMutate = vi.fn();
const resetPasswordMutate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'u1' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/users', () => ({
  useUser: () => useUserMock(),
  useDeleteUser: () => ({ mutateAsync: deleteMutate, isPending: false }),
  useDeactivateUser: () => ({ mutateAsync: deactivateMutate, isPending: false }),
  useActivateUser: () => ({ mutateAsync: activateMutate, isPending: false }),
  useResetUserPassword: () => ({ mutateAsync: resetPasswordMutate, isPending: false }),
}));

const baseUser = {
  id: 'u1',
  email: 'ann@example.com',
  firstName: 'Ann',
  lastName: 'Lee',
  phone: null,
  status: 'ACTIVE',
  lastAccessAt: null,
  role: 'SUPER_ADMIN',
  organisationId: null,
  avatarUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  organisation: null,
};

describe('UserDetailPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    deleteMutate.mockReset().mockResolvedValue(undefined);
    deactivateMutate.mockReset().mockResolvedValue(undefined);
    activateMutate.mockReset().mockResolvedValue(undefined);
    resetPasswordMutate.mockReset().mockResolvedValue(undefined);
    useUserMock.mockReset().mockReturnValue({ isLoading: false, data: baseUser });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('deactivates an active user via the deactivate endpoint, not delete', async () => {
    render(<UserDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'deactivateAccount' }));
    await waitFor(() => expect(deactivateMutate).toHaveBeenCalledWith('u1'));
    expect(deleteMutate).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('offers to activate a suspended user instead', async () => {
    useUserMock.mockReturnValue({ isLoading: false, data: { ...baseUser, status: 'SUSPENDED' } });
    render(<UserDetailPage />);
    expect(screen.queryByRole('button', { name: 'deactivateAccount' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'activateAccount' }));
    await waitFor(() => expect(activateMutate).toHaveBeenCalledWith('u1'));
  });

  it('sends a reset / invitation email', async () => {
    render(<UserDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'resetPassword' }));
    await waitFor(() => expect(resetPasswordMutate).toHaveBeenCalledWith('u1'));
    expect(await screen.findByText('resetPasswordSent')).toBeInTheDocument();
  });

  it('deletes after confirmation and returns to the users list', async () => {
    render(<UserDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'deleteAccount' }));
    await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith('u1'));
    expect(pushMock).toHaveBeenCalledWith('/admin/users');
  });

  it('does not delete when the confirmation is dismissed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<UserDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'deleteAccount' }));
    expect(deleteMutate).not.toHaveBeenCalled();
  });
});
