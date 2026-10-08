import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminTabs } from './admin-tabs';

describe('AdminTabs', () => {
  it('renders in-page tabs as a tablist and reports selection', () => {
    const onChange = vi.fn();
    render(
      <AdminTabs
        ariaLabel="Sections"
        active="details"
        onChange={onChange}
        tabs={[
          { id: 'details', label: 'Details', controlsId: 'panel-details' },
          { id: 'users', label: 'Users', controlsId: 'panel-users' },
        ]}
      />,
    );

    const details = screen.getByRole('tab', { name: 'Details' });
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    expect(details).toHaveAttribute('aria-selected', 'true');
    expect(details).toHaveAttribute('aria-controls', 'panel-details');
    expect(details.id).toBe('tab-details');

    fireEvent.click(screen.getByRole('tab', { name: 'Users' }));
    expect(onChange).toHaveBeenCalledWith('users');
  });

  it('renders route tabs as links and marks the current one', () => {
    render(
      <AdminTabs
        ariaLabel="Lists"
        active="adminUsers"
        tabs={[
          { id: 'organisations', label: 'Organisations', href: '/admin/organisations' },
          { id: 'adminUsers', label: 'Admin users', href: '/admin/users' },
        ]}
      />,
    );

    const adminUsers = screen.getByRole('link', { name: 'Admin users' });
    expect(adminUsers).toHaveAttribute('href', '/admin/users');
    expect(adminUsers).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Organisations' })).not.toHaveAttribute('aria-current');
  });
});
