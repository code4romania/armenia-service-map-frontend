'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, Cog6ToothIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { TableSearchInput, TableSelect } from '@/components/ui/table-controls';
import { useOrgServices } from '@/lib/api/services';
import type { Service } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';

export default function OrgServicesPage() {
  const router = useRouter();
  const t = useTranslations('org.services');
  const tStatuses = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | ''>('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useOrgServices({ page, perPage, search, sortBy, sortOrder, status: status || undefined });

  const columns: ColumnDef<Service, unknown>[] = [
    {
      accessorKey: 'title',
      header: t('columns.title'),
      enableSorting: true,
      cell: ({ row }) => getLocalizedServiceContent(row.original, locale).title,
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
      accessorFn: (row) => row.topics.map((t) => t.topic.name).join(', '),
      id: 'topics',
      header: t('columns.topics'),
      cell: ({ row }) => {
        const firstTopic = row.original.topics?.[0]?.topic;
        if (!firstTopic) return null;
        return (
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {firstTopic.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('columns.state'),
      cell: ({ getValue }) => {
        const value = String(getValue());
        return (
          <Badge variant={value === 'PUBLISHED' ? 'success' : 'warning'}>
            {value === 'PUBLISHED' ? tStatuses('published') : tStatuses('draft')}
          </Badge>
        );
      },
    },
    {
      accessorFn: (row) => row.targetGroups?.map((entry) => entry.targetGroup.name).join(', ') ?? '',
      id: 'targetGroup',
      header: t('columns.targetGroup'),
      enableSorting: false,
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
          onClick={() => router.push(`/org/services/${row.original.id}`)}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => router.push('/org/services/new')}>{t('addNew')}</Button>
      </div>
      <div className="mt-6 rounded-lg border bg-white">
        <div className="flex items-center justify-end gap-2 p-4 pb-0">
          <TableSelect
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'DRAFT' | 'PUBLISHED' | '');
              setPage(1);
            }}
            className="w-48"
          >
            <option value="">{tStatuses('allStates')}</option>
            <option value="DRAFT">{tStatuses('draft')}</option>
            <option value="PUBLISHED">{tStatuses('published')}</option>
          </TableSelect>
          <TableSearchInput placeholder={tCommon('searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-64" />
        </div>
        {isLoading ? (
          <div className="p-4">
            <TableLoadingSkeleton />
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={data?.data ?? []} sorting={sorting} onSortingChange={setSorting} onRowClick={(row) => router.push(`/org/services/${row.id}`)} />
            {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} perPage={data.meta.perPage} onPageChange={setPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />}
          </>
        )}
      </div>
    </div>
  );
}
