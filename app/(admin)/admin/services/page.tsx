'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { AdminPageHeader, AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAdminServices } from '@/lib/api/services';
import { serviceOrgName } from '@/lib/services/org-name';
import type { Service } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { TableSearchInput, TableSelect } from '@/components/ui/table-controls';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';

export default function AdminServicesPage() {
  const router = useRouter();
  const t = useTranslations('admin.services');
  const tStatus = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | ''>('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useAdminServices({
    page,
    perPage,
    search,
    sortBy,
    sortOrder,
    status: status || undefined,
  });

  const columns: ColumnDef<Service, unknown>[] = [
    {
      accessorKey: 'title',
      header: t('columns.title'),
      enableSorting: true,
      cell: ({ row }) => getLocalizedServiceContent(row.original, locale).title,
    },
    {
      accessorFn: (row) => serviceOrgName(row),
      id: 'organisation',
      header: t('columns.organisation'),
      enableSorting: false,
      cell: ({ row }) =>
        !row.original.organisation && row.original.externalOrganisationName ? (
          <div className="flex flex-col items-start gap-1">
            <span>{serviceOrgName(row.original)}</span>
            <span className="w-fit whitespace-nowrap rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#E8922D]">
              {t('outsideNetworkBadge')}
            </span>
          </div>
        ) : (
          serviceOrgName(row.original)
        ),
    },
    {
      accessorFn: (row) => row.region?.name ?? t('allRegions'),
      id: 'location',
      header: t('columns.location'),
      enableSorting: true,
    },
    {
      accessorKey: 'isAvailable',
      header: t('columns.availability'),
      enableSorting: true,
      cell: ({ getValue }) => (
        getValue() ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-red-400" />
        )
      ),
    },
    {
      accessorKey: 'status',
      header: t('columns.state'),
      enableSorting: true,
      cell: ({ getValue }) => {
        const value = String(getValue());
        return (
          <Badge variant={value === 'PUBLISHED' ? 'success' : 'warning'}>
            {value === 'PUBLISHED' ? tStatus('published') : tStatus('draft')}
          </Badge>
        );
      },
    },
    {
      accessorFn: (row) => row.targetGroups?.map((item) => item.targetGroup.name).join(', ') ?? '',
      id: 'targetGroup',
      header: t('columns.targetGroup'),
      enableSorting: false,
    },
    {
      id: 'topics',
      header: t('columns.topics'),
      enableSorting: false,
      cell: ({ row }) => {
        const firstTopic = row.original.topics?.[0]?.topic;
        if (!firstTopic) return null;
        return (
          <span className="text-sm font-medium text-[#E8922D]">
            {firstTopic.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastUpdated'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/admin/services/${row.original.id}`)}
          className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#374151]"
        >
          <Cog6ToothIcon className="h-4 w-4" />
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
        <Button onClick={() => router.push('/admin/services/new')}>{t('addNew')}</Button>
      </AdminPageHeader>

      <AdminPanel className="mt-6 overflow-hidden">
        <AdminToolbar>
          <TableSelect
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'DRAFT' | 'PUBLISHED' | '');
              setPage(1);
            }}
            className="sm:w-[194px]"
          >
            <option value="">{tStatus('allStates')}</option>
            <option value="DRAFT">{tStatus('draft')}</option>
            <option value="PUBLISHED">{tStatus('published')}</option>
          </TableSelect>
          <TableSearchInput placeholder={tCommon('searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="sm:w-72" />
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
              onRowClick={(row) => router.push(`/admin/services/${row.id}`)}
              mobileCard={(row) => ({
                title: getLocalizedServiceContent(row, locale).title,
                badges: (
                  <>
                    <Badge variant={row.status === 'PUBLISHED' ? 'success' : 'warning'}>
                      {row.status === 'PUBLISHED' ? tStatus('published') : tStatus('draft')}
                    </Badge>
                    <Badge variant={row.isAvailable ? 'success' : 'danger'}>
                      {row.isAvailable ? tStatus('available') : tStatus('unavailable')}
                    </Badge>
                  </>
                ),
                fields: [
                  {
                    label: t('columns.organisation'),
                    value:
                      !row.organisation && row.externalOrganisationName ? (
                        <span className="inline-flex flex-col items-end gap-1">
                          {serviceOrgName(row)}
                          <span className="w-fit whitespace-nowrap rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#E8922D]">
                            {t('outsideNetworkBadge')}
                          </span>
                        </span>
                      ) : (
                        serviceOrgName(row)
                      ),
                  },
                  { label: t('columns.location'), value: row.region?.name || t('allRegions') },
                  { label: t('columns.targetGroup'), value: row.targetGroups?.map((item) => item.targetGroup.name).join(', ') || '—' },
                  { label: t('columns.topics'), value: row.topics?.length ? `${row.topics[0].topic.name}${row.topics.length > 1 ? ` +${row.topics.length - 1}` : ''}` : '—' },
                  { label: t('columns.lastUpdated'), value: new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                ],
                action: <button type="button" onClick={() => router.push(`/admin/services/${row.id}`)} className="admin-link-button">{tCommon('view')}</button>,
              })}
            />
            {data && (
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} perPage={data.meta.perPage} onPageChange={setPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />
            )}
          </>
        )}
      </AdminPanel>
    </div>
  );
}
