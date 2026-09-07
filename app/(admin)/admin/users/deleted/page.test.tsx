import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import DeletedUsersPage from './page';

const useUsersMock = vi.fn();
const restoreMutate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/users', () => ({
  useUsers: (params: unknown) => useUsersMock(params),
  useRestoreUser: () => ({ mutateAsync: restoreMutate, isPending: false }),
}));

const deleted = {
  id: '55295419-9689-408c-b9d1-ba8ff8b0d87a',
  email: 'andrew@example.com',
  firstName: 'Andrew',
  lastName: 'R',
  phone: null,
  status: 'PENDING',
  lastAccessAt: null,
  role: 'SUPER_ADMIN',
  organisationId: null,
  avatarUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt: '2026-09-07T07:29:00.000Z',
  organisation: null,
};

describe('DeletedUsersPage', () => {
  beforeEach(() => {
    restoreMutate.mockReset().mockResolvedValue(deleted);
    useUsersMock.mockReset().mockReturnValue({
      isLoading: false,
      data: { data: [deleted], meta: { page: 1, perPage: 10, total: 1, totalPages: 1 } },
    });
  });

  it('queries soft-deleted users of every role', () => {
    render(<DeletedUsersPage />);
    expect(useUsersMock).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
    expect(useUsersMock).not.toHaveBeenCalledWith(expect.objectContaining({ role: expect.anything() }));
  });

  it('shows the deleted user with role and deletion date and the Deleted tab active', () => {
    render(<DeletedUsersPage />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('cell', { name: 'andrew@example.com' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'superAdmin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tabs.deletedUsers' })).toHaveAttribute('aria-current', 'page');
  });

  it('restores a user and confirms it', async () => {
    render(<DeletedUsersPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'restore' })[0]);
    await waitFor(() => expect(restoreMutate).toHaveBeenCalledWith(deleted.id));
    expect(await screen.findByText('restored')).toBeInTheDocument();
  });
});
