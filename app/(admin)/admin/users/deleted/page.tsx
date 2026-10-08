'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { AdminPageHeader, AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { Button } from '@/components/ui/button';
import { TableSearchInput } from '@/components/ui/table-controls';
import { useRestoreUser, useUsers } from '@/lib/api/users';
import type { User } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { USER_ROLE_LABEL_KEYS, formatStatusLabel } from '@/lib/formatting/status-label';
import { getErrorMessage } from '@/lib/validation';

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

/** Soft-deleted accounts of every role, with a one-click restore. */
export default function DeletedUsersPage() {
  const t = useTranslations('admin.users');
  const tCols = useTranslations('admin.users.columns');
  const tCommon = useTranslations('admin.common');
  const tRoles = useTranslations('admin.users.roles');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useUsers({ page, perPage, search, sortBy, sortOrder, deleted: true });
  const restoreUser = useRestoreUser();

  const roleLabel = (role: string) =>
    USER_ROLE_LABEL_KEYS[role] ? tRoles(USER_ROLE_LABEL_KEYS[role]) : formatStatusLabel(role);

  async function handleRestore(user: User) {
    setNotice(null);
    try {
      await restoreUser.mutateAsync(user.id);
      setNotice({ kind: 'success', message: t('restored') });
    } catch (error) {
      setNotice({ kind: 'error', message: getErrorMessage(error, t('actionFailed')) });
    }
  }

  const restoreButton = (user: User) => (
    <Button size="sm" variant="secondary" disabled={restoreUser.isPending} onClick={() => void handleRestore(user)}>
      {t('restore')}
    </Button>
  );

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'firstName', header: tCols('firstName'), enableSorting: true },
    { accessorKey: 'lastName', header: tCols('lastName'), enableSorting: true },
    { accessorKey: 'email', header: tCols('email'), enableSorting: true },
    {
      accessorKey: 'role',
      header: tCols('role'),
      cell: ({ getValue }) => roleLabel(getValue() as string),
      enableSorting: true,
    },
    {
      accessorKey: 'organisation',
      header: tCols('organisation'),
      cell: ({ row }) => row.original.organisation?.name ?? '—',
    },
    {
      accessorKey: 'deletedAt',
      header: tCols('deletedAt'),
      cell: ({ getValue }) => formatDate(getValue() as string | null | undefined),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => restoreButton(row.original),
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
        active="deletedUsers"
        tabs={[
          { id: 'organisations', label: t('tabs.organisations'), href: '/admin/organisations' },
          { id: 'adminUsers', label: t('tabs.adminUsers'), href: '/admin/users' },
          { id: 'deletedUsers', label: t('tabs.deletedUsers'), href: '/admin/users/deleted' },
        ]}
      />

      <AdminPanel className="mt-6 overflow-hidden">
        <div className="border-b border-[#f0f0f0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">{t('deletedUsers')}</h2>
          <p className="mt-1 text-sm text-[#6b7280]">{t('deletedUsersDescription')}</p>
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

        {notice ? (
          <p
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mx-5 mt-4 rounded-md border px-3 py-2 text-sm ${
              notice.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.message}
          </p>
        ) : null}

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
              emptyLabel={t('noDeletedUsers')}
              mobileCard={(row) => ({
                title: `${row.firstName} ${row.lastName}`.trim(),
                fields: [
                  { label: tCols('email'), value: row.email },
                  { label: tCols('role'), value: roleLabel(row.role) },
                  { label: tCols('deletedAt'), value: formatDate(row.deletedAt) },
                ],
                action: restoreButton(row),
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
