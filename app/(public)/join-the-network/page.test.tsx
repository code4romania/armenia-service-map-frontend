import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JoinTheNetworkPage from './page';

const push = vi.fn();
const mutateAsync = vi.fn().mockResolvedValue({ id: 'org-1' });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? '')} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key,
}));

vi.mock('@/components/public/need-cta-banner', () => ({
  NeedCtaBanner: () => null,
}));

vi.mock('@/lib/api/services', () => ({
  usePublicRegions: () => ({
    data: [
      { id: 'r-yerevan', name: 'Yerevan', slug: 'yerevan', svgPathId: 'AM-ER' },
      { id: 'r-shirak', name: 'Shirak', slug: 'shirak', svgPathId: 'AM-SH' },
    ],
  }),
}));

vi.mock('@/lib/api/organisations', () => ({
  useJoinNetwork: () => ({ mutateAsync, isPending: false }),
}));

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('organisationName *'), { target: { value: 'Bridge to Hope' } });
  fireEvent.change(screen.getByLabelText('contactName *'), { target: { value: 'Mariam' } });
  fireEvent.change(screen.getByLabelText('email *'), { target: { value: 'mariam@example.com' } });
  fireEvent.change(screen.getByLabelText('servicesDescription *'), {
    target: { value: 'Legal aid and psychosocial support.' },
  });
}

describe('JoinTheNetworkPage regions', () => {
  it('lets the user pick several regions and submits them as regionIds', async () => {
    render(<JoinTheNetworkPage />);
    fillRequiredFields();

    fireEvent.click(screen.getByLabelText('regionsOfActivity'));
    fireEvent.click(screen.getByLabelText('Yerevan'));
    fireEvent.click(screen.getByLabelText('Shirak'));
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ regionIds: ['r-yerevan', 'r-shirak'] }),
    );
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('regionId');
  });

  it('submits without regionIds when none are selected (regions stay optional)', async () => {
    mutateAsync.mockClear();
    render(<JoinTheNetworkPage />);
    fillRequiredFields();
    expect(screen.getByLabelText('regionsOfActivity')).toHaveTextContent('selectRegions');

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].regionIds).toBeUndefined();
  });
});
