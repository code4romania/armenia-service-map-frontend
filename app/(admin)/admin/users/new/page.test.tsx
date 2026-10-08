import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewUserPage from './page';

const pushMock = vi.fn();
const toastMock = vi.fn();
const mutateAsyncMock = vi.fn();
let presetOrganisationId: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useSearchParams: () => ({ get: () => presetOrganisationId }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/users', () => ({
  useCreateUser: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));

vi.mock('@/lib/toast-bus', () => ({
  publishToast: (toast: unknown) => toastMock(toast),
}));

function fillPerson() {
  fireEvent.change(screen.getByLabelText('firstNameRequired'), { target: { value: 'Ani' } });
  fireEvent.change(screen.getByLabelText('lastNameRequired'), { target: { value: 'Petrosyan' } });
  fireEvent.change(screen.getByLabelText('emailRequired'), { target: { value: 'ani@example.com' } });
}

describe('NewUserPage', () => {
  beforeEach(() => {
    presetOrganisationId = null;
    pushMock.mockReset();
    toastMock.mockReset();
    mutateAsyncMock.mockReset().mockResolvedValue({ id: 'u1' });
  });

  it('adds an Org Admin without a role picker when opened from an organisation', async () => {
    presetOrganisationId = 'org-1';
    render(<NewUserPage />);

    expect(screen.queryByLabelText('role')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('organisationRequired')).not.toBeInTheDocument();

    fillPerson();
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      firstName: 'Ani',
      lastName: 'Petrosyan',
      email: 'ani@example.com',
      role: 'ORG_ADMIN',
      organisationId: 'org-1',
    });
    expect(toastMock).toHaveBeenCalledWith({ type: 'success', message: 'created' });
    expect(pushMock).toHaveBeenCalledWith('/admin/organisations/org-1?tab=users');
  });

  it('adds a Super Admin with no role or organisation picker when opened from the admin users list', async () => {
    render(<NewUserPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'addNewAdminUser' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'usersManagement' })).toHaveAttribute('href', '/admin/users');
    expect(screen.queryByLabelText('role')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('organisationRequired')).not.toBeInTheDocument();

    fillPerson();
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '+374 55 123456' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      firstName: 'Ani',
      lastName: 'Petrosyan',
      email: 'ani@example.com',
      phone: '+374 55 123456',
      role: 'SUPER_ADMIN',
    });
    expect(toastMock).toHaveBeenCalledWith({ type: 'success', message: 'created' });
    expect(pushMock).toHaveBeenCalledWith('/admin/users');
  });

  it('omits the phone number when left blank', async () => {
    render(<NewUserPage />);

    fillPerson();
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      firstName: 'Ani',
      lastName: 'Petrosyan',
      email: 'ani@example.com',
      role: 'SUPER_ADMIN',
    });
  });
});
