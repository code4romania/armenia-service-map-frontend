import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import UsersPage from './page';

const pushMock = vi.fn();
const useUsersMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/users', () => ({
  useUsers: (params: unknown) => useUsersMock(params),
}));

const admin = {
  id: '9f1c2a3b-0000-4000-8000-000000000000',
  email: 'superadmin@example.com',
  firstName: 'Aram',
  lastName: 'Vardanyan',
  phone: null,
  status: 'ACTIVE',
  lastAccessAt: '2025-06-20T14:21:00.000Z',
  role: 'SUPER_ADMIN',
  organisationId: null,
  avatarUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  organisation: null,
};

describe('UsersPage (admin users)', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useUsersMock.mockReset().mockReturnValue({
      isLoading: false,
      data: { data: [admin], meta: { page: 1, perPage: 10, total: 1, totalPages: 1 } },
    });
  });

  it('lists only super admins', () => {
    render(<UsersPage />);

    expect(useUsersMock).toHaveBeenCalledWith(expect.objectContaining({ role: 'SUPER_ADMIN' }));
  });

  it('renders the admin-users columns from the design', () => {
    render(<UsersPage />);

    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['id', 'firstName', 'lastName', 'email', 'account', 'lastAccess', '']);
    expect(within(table).getByRole('cell', { name: '#9f1c2a' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'active' })).toBeInTheDocument();
    expect(within(table).queryByText('Aram Vardanyan')).not.toBeInTheDocument();
  });

  it('sits on the Users management page with the Admin users tab active', () => {
    render(<UsersPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'usersManagement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tabs.adminUsers' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'tabs.organisations' })).toHaveAttribute('href', '/admin/organisations');
  });

  it('opens the add-admin form', () => {
    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: 'addAdminUser' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/users/new');
  });
});
