'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ColumnDef } from '@tanstack/react-table';
import { ArmeniaMap } from '@/components/shared/armenia-map';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TableSearchInput, TableSelect, TableMultiSelect } from '@/components/ui/table-controls';
import { NeedsMapLoadingSkeleton, TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useAdminNeeds, useAdminNeedsMap } from '@/lib/api/needs';
import { useNeedTags } from '@/lib/api/taxonomy';
import { formatStatusLabel, NEED_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { NeedReport } from '@/types/api';
import { useRegionName } from '@/lib/i18n/region-name';

const statusVariant: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  NEW: 'neutral',
  IN_PROGRESS: 'warning',
  SOLVED: 'success',
  CLOSED: 'danger',
};

export default function AdminNeedsMapPage() {
  const router = useRouter();
  const t = useTranslations('admin.needs');
  const regionName = useRegionName();
  const tMap = useTranslations('admin.needs.map');
  const tStatuses = useTranslations('admin.statuses');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: mapData, isLoading: mapLoading } = useAdminNeedsMap();
  const { data: tagsData } = useNeedTags({ perPage: 100 });
  const needsQuery = useAdminNeeds({
    page,
    perPage,
    search,
    regionId: selectedRegionId || undefined,
    status: statusFilter || undefined,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const tagOptions = useMemo(
    () => (tagsData?.data ?? []).map((tag) => ({ value: tag.id, label: tag.name })),
    [tagsData],
  );

  const hasActiveFilters = Boolean(
    search || statusFilter || tagIds.length > 0 || startDate || endDate,
  );

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setTagIds([]);
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mapData?.forEach((entry) => {
      counts[entry.svgPathId] = entry.count;
    });
    return counts;
  }, [mapData]);

  const selectedRegion = mapData?.find((entry) => entry.regionId === selectedRegionId) ?? null;

  const columns: ColumnDef<NeedReport, unknown>[] = [
    {
      accessorKey: 'id',
      header: t('columns.id'),
      cell: ({ getValue }) => <span className="font-mono text-xs text-[#6b7280]">{String(getValue()).slice(0, 8)}</span>,
    },
    {
      accessorKey: 'title',
      header: t('columns.title'),
      cell: ({ row }) => (
        <span className="line-clamp-1 font-medium text-[#111827]">
          {row.original.title || row.original.description.slice(0, 60)}
        </span>
      ),
    },
    {
      accessorFn: (row) => (row.region ? regionName(row.region) : '—'),
      id: 'region',
      header: tMap('columnLocation'),
    },
    {
      accessorFn: (row) => row.tags.map((tag) => tag.needTag.name).join(', ') || '—',
      id: 'tags',
      header: tMap('columnTags'),
      cell: ({ getValue }) => <span className="line-clamp-1 text-sm text-[#374151]">{String(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ getValue }) => {
        const value = String(getValue());
        const labelKey = NEED_STATUS_LABEL_KEYS[value];
        return <Badge variant={statusVariant[value] || 'neutral'}>{labelKey ? tStatuses(labelKey) : formatStatusLabel(value)}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: tMap('columnSubmittedAt'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      id: 'open',
      header: '',
      cell: ({ row }) => (
        <Link href={`/admin/needs/${row.original.id}`} className="text-sm text-[#E8922D] hover:underline">
          {tMap('open')}
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/admin/needs" className="hover:underline">{t('title')}</Link>{' > '}{t('breadcrumbMap')}
      </div>
      <h1 className="text-2xl font-bold">{tMap('title')}</h1>
      <p className="mt-2 text-[#6b7280]">
        {selectedRegion
          ? tMap('showingRegion', { region: regionName({ name: selectedRegion.regionName, svgPathId: selectedRegion.svgPathId }) })
          : tMap('showingAll')}
      </p>

      {selectedRegion ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#fef3e2] px-3 py-1 text-xs font-medium text-[#E8922D]">
            {tMap('regionChip', { region: regionName({ name: selectedRegion.regionName, svgPathId: selectedRegion.svgPathId }) })}
          </span>
          <button
            onClick={() => {
              setSelectedRegionId('');
              setPage(1);
            }}
            className="text-xs text-[#6b7280] underline hover:text-[#374151]"
          >
            {tMap('clearFilter')}
          </button>
        </div>
      ) : null}

      {mapLoading ? (
        <NeedsMapLoadingSkeleton />
      ) : (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-2/3">
            <AdminPanel className="overflow-hidden p-4">
              <ArmeniaMap
                regionCounts={regionCounts}
                selectedRegionId={selectedRegion?.svgPathId}
                countLabelSingular={tMap('needSingular')}
                countLabelPlural={tMap('needPlural')}
                densityMode
                onRegionClick={(svgPathId) => {
                  const region = mapData?.find((entry) => entry.svgPathId === svgPathId);
                  setSelectedRegionId((prev) => (prev === region?.regionId ? '' : region?.regionId || ''));
                  setPage(1);
                }}
              />
            </AdminPanel>
            <div className="mt-3 text-xs text-[#6b7280]">
              {tMap('colorScale')}
            </div>
          </div>

          <div className="lg:w-1/3">
            <AdminPanel className="p-4">
              <h3 className="text-sm font-semibold tracking-[0.14em] text-[#6b7280]">{tMap('regionCounts')}</h3>
              <div className="mt-3 space-y-2">
                {mapData
                  ?.slice()
                  .sort((a, b) => b.count - a.count)
                  .map((entry) => (
                    <button
                      key={entry.regionId}
                      onClick={() => {
                        setSelectedRegionId((prev) => (prev === entry.regionId ? '' : entry.regionId));
                        setPage(1);
                      }}
                      className={`admin-control flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                        selectedRegionId === entry.regionId
                          ? 'border-[#e8e8e8] bg-white text-[#111827] shadow-[0_6px_16px_rgba(15,23,42,0.05)]'
                          : 'text-[#6b7280] hover:bg-[#f5f5f4]'
                      }`}
                    >
                      <span>{regionName({ name: entry.regionName, svgPathId: entry.svgPathId })}</span>
                      <span className="font-semibold">{entry.count}</span>
                    </button>
                  ))}
              </div>
            </AdminPanel>
          </div>
        </div>
      )}

      <AdminPanel className="mt-8 overflow-hidden">
        <AdminToolbar layout="between">
          <h2 className="text-lg font-semibold text-[#111827]">{tMap('listHeader')}</h2>
          <TableSearchInput
            placeholder={tMap('searchPlaceholder')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="sm:w-72"
          />
        </AdminToolbar>

        <div className="mx-4 mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="sm:w-[190px]">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">{t('columns.status')}</label>
            <TableSelect
              aria-label={t('columns.status')}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{tStatuses('allStatuses')}</option>
              <option value="NEW">{tStatuses('new')}</option>
              <option value="IN_PROGRESS">{tStatuses('inProgress')}</option>
              <option value="SOLVED">{tStatuses('solved')}</option>
              <option value="CLOSED">{tStatuses('closed')}</option>
            </TableSelect>
          </div>

          <div className="sm:w-[200px]">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">{tMap('columnTags')}</label>
            <TableMultiSelect
              aria-label={tMap('columnTags')}
              options={tagOptions}
              selected={tagIds}
              onChange={(next) => {
                setTagIds(next);
                setPage(1);
              }}
              placeholder={tMap('allTags')}
              selectedLabel={(count) => tMap('tagsSelected', { count })}
            />
          </div>

          <Input
            label={tMap('startDate')}
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            className="sm:w-[160px]"
          />

          <Input
            label={tMap('endDate')}
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            className="sm:w-[160px]"
          />

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="admin-link-button self-start py-3 underline sm:self-end"
            >
              {tMap('clearFilters')}
            </button>
          ) : null}
        </div>

        {needsQuery.isLoading ? (
          <div className="p-4">
            <TableLoadingSkeleton />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={needsQuery.data?.data ?? []}
              onRowClick={(row) => router.push(`/admin/needs/${row.id}`)}
              mobileCard={(row) => ({
                eyebrow: String(row.id).slice(0, 8),
                title: row.title || row.description.slice(0, 60),
                badges: <Badge variant={statusVariant[row.status] || 'neutral'}>{NEED_STATUS_LABEL_KEYS[row.status] ? tStatuses(NEED_STATUS_LABEL_KEYS[row.status]) : formatStatusLabel(row.status)}</Badge>,
                fields: [
                  { label: tMap('columnLocation'), value: row.region ? regionName(row.region) : '—' },
                  { label: tMap('columnTags'), value: row.tags.map((tag) => tag.needTag.name).join(', ') || '—' },
                  { label: t('columns.submitted'), value: new Date(row.createdAt).toLocaleDateString() },
                ],
                action: <Link href={`/admin/needs/${row.id}`} className="admin-link-button">{tMap('open')}</Link>,
              })}
            />
            {needsQuery.data ? (
              <Pagination
                page={needsQuery.data.meta.page}
                totalPages={needsQuery.data.meta.totalPages}
                total={needsQuery.data.meta.total}
                perPage={needsQuery.data.meta.perPage}
                onPageChange={setPage}
                onPerPageChange={(pp) => {
                  setPerPage(pp);
                  setPage(1);
                }}
              />
            ) : null}
          </>
        )}
      </AdminPanel>
    </div>
  );
}
