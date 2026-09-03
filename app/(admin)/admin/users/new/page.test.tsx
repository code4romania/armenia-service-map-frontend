import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewUserPage from './page';

const backMock = vi.fn();
const mutateAsyncMock = vi.fn();
let presetOrganisationId: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: backMock }),
  useSearchParams: () => ({ get: () => presetOrganisationId }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/users', () => ({
  useCreateUser: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));

vi.mock('@/lib/api/organisations', () => ({
  useOrganisations: () => ({
    data: { data: [{ id: 'org-1', name: 'Mission Armenia' }, { id: 'org-2', name: 'Caritas' }] },
  }),
}));

function fillPerson() {
  fireEvent.change(screen.getByLabelText('firstNameRequired'), { target: { value: 'Ani' } });
  fireEvent.change(screen.getByLabelText('lastNameRequired'), { target: { value: 'Petrosyan' } });
  fireEvent.change(screen.getByLabelText('emailRequired'), { target: { value: 'ani@example.com' } });
}

describe('NewUserPage', () => {
  beforeEach(() => {
    presetOrganisationId = null;
    backMock.mockReset();
    mutateAsyncMock.mockReset().mockResolvedValue({ id: 'u1' });
  });

  it('adds an Org Admin without a role picker when opened from an organisation', async () => {
    presetOrganisationId = 'org-1';
    render(<NewUserPage />);

    expect(screen.queryByLabelText('role')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('organisationRequired')).not.toBeInTheDocument();
    expect(screen.getByText('orgAdminHint')).toBeInTheDocument();

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
    expect(backMock).toHaveBeenCalled();
  });

  it('offers only Org Admin and Super Admin, and requires an organisation for an Org Admin', async () => {
    render(<NewUserPage />);

    const roleSelect = screen.getByLabelText('role') as HTMLSelectElement;
    expect(Array.from(roleSelect.options).map((o) => o.value)).toEqual(['ORG_ADMIN', 'SUPER_ADMIN']);
    expect(roleSelect.value).toBe('ORG_ADMIN');

    fillPerson();
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    expect(await screen.findByText('validation.organisationRequired')).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('organisationRequired'), { target: { value: 'org-2' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith(expect.objectContaining({ role: 'ORG_ADMIN', organisationId: 'org-2' }));
  });

  it('creates a Super Admin without an organisation', async () => {
    render(<NewUserPage />);

    fireEvent.change(screen.getByLabelText('role'), { target: { value: 'SUPER_ADMIN' } });
    expect(screen.queryByLabelText('organisationRequired')).not.toBeInTheDocument();

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
