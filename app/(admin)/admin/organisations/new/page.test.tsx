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

  it('requires a contact email before submitting', async () => {
    render(<NewOrganisationPage />);

    fireEvent.change(screen.getByLabelText('form.nameRequired'), { target: { value: 'Bridge to Hope' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    expect(await screen.findByText('validation.emailRequired')).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('submits the API field names the backend accepts', async () => {
    render(<NewOrganisationPage />);

    fireEvent.change(screen.getByLabelText('form.nameRequired'), { target: { value: 'Bridge to Hope' } });
    fireEvent.change(screen.getByLabelText('form.contactEmailRequired'), { target: { value: 'mariam@example.com' } });
    fireEvent.change(screen.getByLabelText('form.contactPhone'), { target: { value: '+37477111222' } });
    fireEvent.change(screen.getByLabelText('form.address'), { target: { value: '1 Abovyan St' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      name: 'Bridge to Hope',
      contactPersonEmail: 'mariam@example.com',
      contactPersonPhone: '+37477111222',
      streetAddress: '1 Abovyan St',
    });
    expect(pushMock).toHaveBeenCalledWith('/admin/organisations');
  });
});
