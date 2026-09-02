import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewOrganisationPage from './page';

const pushMock = vi.fn();
const mutateAsyncMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api/organisations', () => ({
  useCreateOrganisation: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));

describe('NewOrganisationPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mutateAsyncMock.mockReset().mockResolvedValue({ id: 'org-1' });
  });

  it('requires the administrator name and email before submitting', async () => {
    render(<NewOrganisationPage />);

    fireEvent.change(screen.getByLabelText('form.nameRequired'), { target: { value: 'Bridge to Hope' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    expect(await screen.findByText('validation.firstNameRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.lastNameRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.emailRequired')).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('posts the organisation with a nested admin object, in backend field names', async () => {
    render(<NewOrganisationPage />);

    fireEvent.change(screen.getByLabelText('form.nameRequired'), { target: { value: 'Bridge to Hope' } });
    fireEvent.change(screen.getByLabelText('form.address'), { target: { value: '1 Abovyan St' } });
    fireEvent.change(screen.getByLabelText('form.adminFirstNameRequired'), { target: { value: 'Mariam' } });
    fireEvent.change(screen.getByLabelText('form.adminLastNameRequired'), { target: { value: 'Hakobyan' } });
    fireEvent.change(screen.getByLabelText('form.adminEmailRequired'), { target: { value: 'mariam@example.com' } });
    fireEvent.change(screen.getByLabelText('form.adminPhone'), { target: { value: '+37477111222' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      name: 'Bridge to Hope',
      streetAddress: '1 Abovyan St',
      admin: { firstName: 'Mariam', lastName: 'Hakobyan', email: 'mariam@example.com', phone: '+37477111222' },
    });
    expect(pushMock).toHaveBeenCalledWith('/admin/organisations');
  });
});
