'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { AdminPageHeader, AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { Badge } from '@/components/ui/badge';
import { TableSearchInput, TableSelect } from '@/components/ui/table-controls';
import { useAdminNeeds } from '@/lib/api/needs';
import { formatStatusLabel, NEED_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { NeedReport } from '@/types/api';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';

const statusVariant: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  NEW: 'neutral',
  IN_PROGRESS: 'warning',
  SOLVED: 'success',
  CLOSED: 'danger',
};

export default function AdminNeedsPage() {
  const router = useRouter();
  const t = useTranslations('admin.needs');
  const tStatuses = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useAdminNeeds({ page, perPage, search, sortBy, sortOrder, status: statusFilter || undefined });

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
        const labelKey = NEED_STATUS_LABEL_KEYS[s];
        return <Badge variant={statusVariant[s] || 'neutral'}>{labelKey ? tStatuses(labelKey) : formatStatusLabel(s)}</Badge>;
      },
    },
    {
      accessorFn: (row) => row.assignedOrganisation?.name || '—',
      id: 'assignedOrganisation',
      header: t('columns.assignedTo'),
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
        <button onClick={() => router.push(`/admin/needs/${row.original.id}`)} className="text-sm text-[#E8922D] hover:underline">
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
        <button onClick={() => router.push('/admin/needs/map')} className="admin-link-button self-start">{t('viewMap')}</button>
      </AdminPageHeader>

      <AdminPanel className="mt-6 overflow-hidden">
        <AdminToolbar>
          <TableSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="sm:w-[194px]">
            <option value="">{tStatuses('allStatuses')}</option>
            <option value="NEW">{tStatuses('new')}</option>
            <option value="IN_PROGRESS">{tStatuses('inProgress')}</option>
            <option value="SOLVED">{tStatuses('solved')}</option>
            <option value="CLOSED">{tStatuses('closed')}</option>
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
              onRowClick={(row) => router.push(`/admin/needs/${row.id}`)}
              mobileCard={(row) => ({
                eyebrow: String(row.id).slice(0, 8),
                title: row.title || row.description.slice(0, 60),
                badges: <Badge variant={statusVariant[row.status] || 'neutral'}>{NEED_STATUS_LABEL_KEYS[row.status] ? tStatuses(NEED_STATUS_LABEL_KEYS[row.status]) : formatStatusLabel(row.status)}</Badge>,
                fields: [
                  { label: t('columns.submittedBy'), value: row.fullName },
                  { label: t('columns.region'), value: row.region?.name || '—' },
                  { label: t('columns.assignedTo'), value: row.assignedOrganisation?.name || '—' },
                  { label: t('columns.submitted'), value: new Date(row.createdAt).toLocaleDateString() },
                ],
                action: <button type="button" onClick={() => router.push(`/admin/needs/${row.id}`)} className="admin-link-button">{tCommon('view')}</button>,
              })}
            />
            {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} perPage={data.meta.perPage} onPageChange={setPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />}
          </>
        )}
      </AdminPanel>
    </div>
  );
}
