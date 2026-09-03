'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { TableSearchInput, TableSelect } from '@/components/ui/table-controls';
import { useOrgNeeds } from '@/lib/api/needs';
import { formatStatusLabel, NEED_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { NeedReport } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';

const statusVariant: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  NEW: 'neutral',
  IN_PROGRESS: 'warning',
  SOLVED: 'success',
  CLOSED: 'danger',
};

export default function OrgNeedsPage() {
  const t = useTranslations('org.needs');
  const tStatuses = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useOrgNeeds({ page, perPage, search, sortBy, sortOrder, status: statusFilter || undefined });

  const columns: ColumnDef<NeedReport, unknown>[] = [
    {
      accessorKey: 'id',
      header: t('columns.id'),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[#6b7280]">{String(getValue()).slice(0, 8)}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: t('columns.title'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="line-clamp-1 font-medium text-[#111827]">
          {row.original.title || row.original.description.slice(0, 60)}
        </span>
      ),
    },
    {
      accessorFn: (row) => row.fullName,
      id: 'fullName',
      header: t('columns.submittedBy'),
      cell: ({ getValue }) => <span className="line-clamp-1">{String(getValue())}</span>,
    },
    {
      accessorFn: (row) => row.region?.name || '—',
      id: 'region',
      header: t('columns.region'),
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ getValue }) => {
        const s = getValue() as string;
        return (
          <Badge variant={statusVariant[s] || 'neutral'}>
            {NEED_STATUS_LABEL_KEYS[s] ? tStatuses(NEED_STATUS_LABEL_KEYS[s]) : formatStatusLabel(s)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.submitted'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button onClick={() => router.push(`/org/needs/${row.original.id}`)} className="text-sm text-[#E8922D] hover:underline">{tCommon('view')}</button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button onClick={() => router.push('/org/needs/map')} className="text-sm text-[#E8922D] hover:underline">{t('viewMap')}</button>
      </div>

      <AdminPanel className="mt-6 overflow-hidden">
        <AdminToolbar>
          <TableSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-48">
            <option value="">{tStatuses('allStatuses')}</option>
            <option value="IN_PROGRESS">{tStatuses('inProgress')}</option>
            <option value="SOLVED">{tStatuses('solved')}</option>
            <option value="CLOSED">{tStatuses('closed')}</option>
          </TableSelect>
          <TableSearchInput placeholder={tCommon('searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-64" />
        </AdminToolbar>

        {isLoading ? (
          <div className="p-4">
            <TableLoadingSkeleton />
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={data?.data ?? []} sorting={sorting} onSortingChange={setSorting} onRowClick={(row) => router.push(`/org/needs/${row.id}`)} />
            {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} perPage={data.meta.perPage} onPageChange={setPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />}
          </>
        )}
      </AdminPanel>
    </div>
  );
}
