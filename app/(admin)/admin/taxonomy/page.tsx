'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { AdminPanel, AdminToolbar } from '@/components/admin/admin-surface';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSearchInput } from '@/components/ui/table-controls';
import { useTopics, useNeedTags, useTargetGroups } from '@/lib/api/taxonomy';
import { useTranslations } from 'next-intl';
import type { NeedTag, TargetGroup, Topic } from '@/types/api';

type Tab = 'topics' | 'need-tags' | 'target-groups';

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('topics');
  const t = useTranslations('admin.taxonomy');

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <AdminTabs
        ariaLabel={t('tabsAriaLabel')}
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'topics', label: t('serviceTopics') },
          { id: 'need-tags', label: t('needTags') },
          { id: 'target-groups', label: t('targetGroups') },
        ]}
      />

      <div className="mt-6">
        {activeTab === 'topics' ? <TopicsSection /> : null}
        {activeTab === 'need-tags' ? <NeedTagsSection /> : null}
        {activeTab === 'target-groups' ? <TargetGroupsSection /> : null}
      </div>
    </div>
  );
}

function TopicsSection() {
  const router = useRouter();
  const t = useTranslations('admin.taxonomy');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useTopics({ page, perPage, search, sortBy, sortOrder });

  const columns: ColumnDef<Topic, unknown>[] = [
    { accessorKey: 'id', header: t('columns.id'), enableSorting: false },
    { accessorKey: 'name', header: t('columns.topics'), enableSorting: true },
    {
      accessorFn: (row) => row._count.services,
      id: 'usage',
      header: t('columns.usage'),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.original.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastUpdate'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link href={`/admin/taxonomy/topics/${row.original.id}`} className="admin-link-button">
          {tCommon('view')}
        </Link>
      ),
    },
  ];

  return (
    <AdminPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f0f0f0] p-4">
        <h2 className="text-lg font-semibold">{t('serviceTopics')}</h2>
        <Button onClick={() => router.push('/admin/taxonomy/topics/new')}>{t('addTopic')}</Button>
      </div>
      <AdminToolbar layout="compact-end">
        <TableSearchInput
          placeholder={tCommon('searchPlaceholder')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="compact"
          className="sm:w-64"
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
            onRowClick={(row) => router.push(`/admin/taxonomy/topics/${row.id}`)}
            mobileCard={(row) => ({
              eyebrow: row.id,
              title: row.name,
              badges: (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {row.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
                </Badge>
              ),
              fields: [
                { label: t('columns.usage'), value: row._count.services },
                { label: t('columns.lastUpdate'), value: new Date(row.updatedAt).toLocaleDateString() },
              ],
              action: (
                <Link href={`/admin/taxonomy/topics/${row.id}`} className="admin-link-button">
                  {tCommon('view')}
                </Link>
              ),
            })}
          />
          {data ? (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              perPage={data.meta.perPage}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}
    </AdminPanel>
  );
}

function NeedTagsSection() {
  const router = useRouter();
  const t = useTranslations('admin.taxonomy');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useNeedTags({ page, perPage, search, sortBy, sortOrder });

  const columns: ColumnDef<NeedTag, unknown>[] = [
    { accessorKey: 'id', header: t('columns.id'), enableSorting: false },
    { accessorKey: 'name', header: t('columns.tag'), enableSorting: true },
    {
      accessorFn: (row) => row._count.needReports,
      id: 'usage',
      header: t('columns.usage'),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.original.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastUpdate'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link href={`/admin/taxonomy/need-tags/${row.original.id}`} className="admin-link-button">
          {tCommon('view')}
        </Link>
      ),
    },
  ];

  return (
    <AdminPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f0f0f0] p-4">
        <h2 className="text-lg font-semibold">{t('needTags')}</h2>
        <Button onClick={() => router.push('/admin/taxonomy/need-tags/new')}>{t('addTag')}</Button>
      </div>
      <AdminToolbar layout="compact-end">
        <TableSearchInput
          placeholder={tCommon('searchPlaceholder')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="compact"
          className="sm:w-64"
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
            onRowClick={(row) => router.push(`/admin/taxonomy/need-tags/${row.id}`)}
            mobileCard={(row) => ({
              eyebrow: row.id,
              title: row.name,
              badges: (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {row.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
                </Badge>
              ),
              fields: [
                { label: t('columns.usage'), value: row._count.needReports },
                { label: t('columns.lastUpdate'), value: new Date(row.updatedAt).toLocaleDateString() },
              ],
              action: (
                <Link href={`/admin/taxonomy/need-tags/${row.id}`} className="admin-link-button">
                  {tCommon('view')}
                </Link>
              ),
            })}
          />
          {data ? (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              perPage={data.meta.perPage}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}
    </AdminPanel>
  );
}

function TargetGroupsSection() {
  const router = useRouter();
  const t = useTranslations('admin.taxonomy');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const { data, isLoading } = useTargetGroups({ page, perPage, search, sortBy, sortOrder });

  const columns: ColumnDef<TargetGroup, unknown>[] = [
    { accessorKey: 'id', header: t('columns.id'), enableSorting: false },
    { accessorKey: 'name', header: t('columns.targetGroup'), enableSorting: true },
    {
      accessorFn: (row) => row._count.services,
      id: 'usage',
      header: t('columns.usage'),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.original.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastUpdate'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link href={`/admin/taxonomy/target-groups/${row.original.id}`} className="admin-link-button">
          {tCommon('view')}
        </Link>
      ),
    },
  ];

  return (
    <AdminPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f0f0f0] p-4">
        <h2 className="text-lg font-semibold">{t('targetGroups')}</h2>
        <Button onClick={() => router.push('/admin/taxonomy/target-groups/new')}>{t('addTargetGroup')}</Button>
      </div>
      <AdminToolbar layout="compact-end">
        <TableSearchInput
          placeholder={tCommon('searchPlaceholder')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="compact"
          className="sm:w-64"
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
            onRowClick={(row) => router.push(`/admin/taxonomy/target-groups/${row.id}`)}
            mobileCard={(row) => ({
              eyebrow: row.id,
              title: row.name,
              badges: (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {row.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
                </Badge>
              ),
              fields: [
                { label: t('columns.usage'), value: row._count.services },
                { label: t('columns.lastUpdate'), value: new Date(row.updatedAt).toLocaleDateString() },
              ],
              action: (
                <Link href={`/admin/taxonomy/target-groups/${row.id}`} className="admin-link-button">
                  {tCommon('view')}
                </Link>
              ),
            })}
          />
          {data ? (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              perPage={data.meta.perPage}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}
    </AdminPanel>
  );
}
