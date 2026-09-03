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
import { useOrganisations } from '@/lib/api/organisations';
import { usePublicRegions } from '@/lib/api/services';
import { formatRegionNames } from '@/lib/formatting/region-names';
import { formatStatusLabel, ORG_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { Organisation } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';

const accountBadge: Record<Organisation['status'], 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

export default function OrganisationsPage() {
  const router = useRouter();
  const t = useTranslations('admin.organisations');
  const tUsers = useTranslations('admin.users');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useOrganisations({ page, perPage, search, sortBy, sortOrder });
  const { data: allRegions } = usePublicRegions();

  const columns: ColumnDef<Organisation, unknown>[] = [
    { accessorKey: 'name', header: t('columns.name'), enableSorting: true },
    {
      accessorKey: 'status',
      header: t('columns.account'),
      cell: ({ getValue }) => {
        const status = String(getValue());
        const labelKey = ORG_STATUS_LABEL_KEYS[status];
        return (
          <Badge variant={accountBadge[getValue() as Organisation['status']]}>
            {labelKey ? tStatuses(labelKey) : formatStatusLabel(status)}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastAccess'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/admin/organisations/${row.original.id}`)}
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
          <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('description')}</p>
        </div>
        <Button onClick={() => router.push('/admin/organisations/new')}>{t('addOrganisation')}</Button>
      </AdminPageHeader>

      <AdminTabs
        ariaLabel={tUsers('tabsAriaLabel')}
        active="organisations"
        tabs={[
          { id: 'organisations', label: tUsers('tabs.organisations'), href: '/admin/organisations' },
          { id: 'adminUsers', label: tUsers('tabs.adminUsers'), href: '/admin/users' },
        ]}
      />

      <AdminPanel className="mt-6 overflow-hidden">
        <div className="border-b border-[#f0f0f0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">{t('list')}</h2>
        </div>

        <AdminToolbar>
          <TableSearchInput
            placeholder={tCommon('searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              onRowClick={(row) => router.push(`/admin/organisations/${row.id}`)}
              mobileCard={(row) => ({
                title: row.name,
                badges: <Badge variant={accountBadge[row.status]}>{ORG_STATUS_LABEL_KEYS[row.status] ? tStatuses(ORG_STATUS_LABEL_KEYS[row.status]) : formatStatusLabel(row.status)}</Badge>,
                fields: [
                  { label: t('columns.lastAccess'), value: new Date(row.updatedAt).toLocaleDateString() },
                  { label: t('mobile.region'), value: formatRegionNames(row.regions, { totalRegions: allRegions?.length, allLabel: tCommon('allRegions') }) },
                  { label: t('mobile.users'), value: row._count.users },
                  { label: t('mobile.services'), value: row._count.services },
                ],
                action: <button type="button" onClick={() => router.push(`/admin/organisations/${row.id}`)} className="admin-link-button">{tCommon('view')}</button>,
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
