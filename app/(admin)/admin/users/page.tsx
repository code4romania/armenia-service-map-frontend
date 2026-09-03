'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { AdminPageHeader, AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSearchInput } from '@/components/ui/table-controls';
import { useUsers } from '@/lib/api/users';
import type { User } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { USER_STATUS_LABEL_KEYS, formatStatusLabel } from '@/lib/formatting/status-label';

const accountBadge: Record<User['status'], 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'danger',
};

/** Users are keyed by UUID; the table shows a short, stable prefix as the visible ID. */
function shortId(id: string) {
  return `#${id.slice(0, 6)}`;
}

function formatLastAccess(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

/** Platform (super admin) accounts. Organisation admins live under each organisation. */
export default function UsersPage() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const tCols = useTranslations('admin.users.columns');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useUsers({ page, perPage, search, sortBy, sortOrder, role: 'SUPER_ADMIN' });

  const statusLabel = (status: string) =>
    USER_STATUS_LABEL_KEYS[status] ? tStatuses(USER_STATUS_LABEL_KEYS[status]) : formatStatusLabel(status);
  const statusBadge = (status: User['status']) => (
    <Badge variant={accountBadge[status]}>{statusLabel(status)}</Badge>
  );

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: 'id',
      header: tCols('id'),
      cell: ({ getValue }) => shortId(getValue() as string),
    },
    { accessorKey: 'firstName', header: tCols('firstName'), enableSorting: true },
    { accessorKey: 'lastName', header: tCols('lastName'), enableSorting: true },
    { accessorKey: 'email', header: tCols('email'), enableSorting: true },
    {
      accessorKey: 'status',
      header: tCols('account'),
      cell: ({ getValue }) => statusBadge(getValue() as User['status']),
      enableSorting: true,
    },
    {
      accessorKey: 'lastAccessAt',
      header: tCols('lastAccess'),
      cell: ({ getValue }) => formatLastAccess(getValue() as string | null),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/admin/users/${row.original.id}`)}
          className="text-sm text-[#E8922D] hover:underline"
        >
          {tCommon('view')}
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">{t('usersManagement')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('description')}</p>
        </div>
      </AdminPageHeader>

      <AdminTabs
        ariaLabel={t('tabsAriaLabel')}
        active="adminUsers"
        tabs={[
          { id: 'organisations', label: t('tabs.organisations'), href: '/admin/organisations' },
          { id: 'adminUsers', label: t('tabs.adminUsers'), href: '/admin/users' },
        ]}
      />

      <AdminPanel className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">{t('adminUsers')}</h2>
          <Button onClick={() => router.push('/admin/users/new')}>{t('addAdminUser')}</Button>
        </div>

        <AdminToolbar layout="compact-end">
          <TableSearchInput
            placeholder={tCommon('searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="compact"
            className="sm:w-72"
          />
        </AdminToolbar>

        {isLoading ? (
          <div className="p-4">
            <TableLoadingSkeleton />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              sorting={sorting}
              onSortingChange={setSorting}
              onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
              mobileCard={(row) => ({
                title: `${row.firstName} ${row.lastName}`.trim(),
                badges: statusBadge(row.status),
                fields: [
                  { label: tCols('id'), value: shortId(row.id) },
                  { label: tCols('email'), value: row.email },
                  { label: tCols('lastAccess'), value: formatLastAccess(row.lastAccessAt) },
                ],
                action: <button type="button" onClick={() => router.push(`/admin/users/${row.id}`)} className="admin-link-button">{tCommon('view')}</button>,
              })}
            />
            {data && (
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                perPage={data.meta.perPage}
                onPageChange={setPage}
                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
              />
            )}
          </>
        )}
      </AdminPanel>
    </div>
  );
}
