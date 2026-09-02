'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { AdminPanel } from '@/components/admin/admin-surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DetailPageLoadingSkeleton, TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useApproveOrganisation, useOrganisation, useRejectOrganisation, useUpdateOrganisation } from '@/lib/api/organisations';
import { useUsers } from '@/lib/api/users';
import { formatStatusLabel, ORG_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { User } from '@/types/api';

type Tab = 'details' | 'users';
const statusVariant: Record<'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED', 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

export default function OrganisationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('admin.organisations');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const { data: org, isLoading } = useOrganisation(id);
  const updateOrg = useUpdateOrganisation();
  const approveOrg = useApproveOrganisation();
  const rejectOrg = useRejectOrganisation();

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!org) return <div className="p-8 text-[#6b7280]">{t('notFound')}</div>;

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/admin/organisations" className="hover:underline">{t('title')}</Link>
        {' > '}
        <span>{org.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <Badge variant={statusVariant[org.status]}>
            {ORG_STATUS_LABEL_KEYS[org.status] ? tStatuses(ORG_STATUS_LABEL_KEYS[org.status]) : formatStatusLabel(org.status)}
          </Badge>
        </div>
        {org.status === 'PENDING' ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => approveOrg.mutate(org.id)}
              disabled={approveOrg.isPending || rejectOrg.isPending}
            >
              {approveOrg.isPending ? t('actions.approving') : t('actions.approve')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsRejectModalOpen(true)}
              disabled={approveOrg.isPending || rejectOrg.isPending}
            >
              {rejectOrg.isPending ? t('actions.rejecting') : t('actions.reject')}
            </Button>
          </div>
        ) : org.status === 'ACTIVE' || org.status === 'SUSPENDED' ? (
          <Button
            variant="danger"
            onClick={() => {
              updateOrg.mutate({
                id: org.id,
                status: org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
              });
            }}
          >
            {org.status === 'SUSPENDED'
              ? (updateOrg.isPending ? t('actions.activating') : t('activate'))
              : (updateOrg.isPending ? t('actions.deactivating') : t('deactivate'))}
          </Button>
        ) : null}
      </div>

      <div
        className="admin-toolbar mt-4 flex gap-1 p-1.5"
        style={{ width: 'fit-content' }}
        role="tablist"
        aria-label={t('detailSectionsAria')}
      >
        <button
          type="button"
          role="tab"
          id="admin-org-tab-details"
          aria-selected={activeTab === 'details'}
          aria-controls="admin-org-panel-details"
          onClick={() => setActiveTab('details')}
            className={`rounded-xl border border-transparent px-4 py-2 text-sm font-medium ${
            activeTab === 'details'
              ? 'border-[#E8922D] bg-white text-[#E8922D]'
              : 'text-[#6b7280] hover:text-[#374151]'
          }`}
        >
          {t('details')}
        </button>
        <button
          type="button"
          role="tab"
          id="admin-org-tab-users"
          aria-selected={activeTab === 'users'}
          aria-controls="admin-org-panel-users"
          onClick={() => setActiveTab('users')}
            className={`rounded-xl border border-transparent px-4 py-2 text-sm font-medium ${
            activeTab === 'users'
              ? 'border-[#E8922D] bg-white text-[#E8922D]'
              : 'text-[#6b7280] hover:text-[#374151]'
          }`}
        >
          {t('users')}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'details' ? (
          <section
            id="admin-org-panel-details"
            role="tabpanel"
            aria-labelledby="admin-org-tab-details"
            className="admin-panel p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('details')}</h2>
            </div>
            {org.status === 'PENDING' ? (
              <div className="mb-6 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4">
                <p className="text-sm font-medium text-[#92400e]">{t('pendingNotice')}</p>
              </div>
            ) : null}
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.name')}</div>
                <div className="mt-1">{org.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.location')}</div>
                <div className="mt-1">{org.region?.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.contactEmail')}</div>
                <div className="mt-1">{org.contactPersonEmail || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.contactPerson')}</div>
                <div className="mt-1">{org.contactPersonName || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.contactPhone')}</div>
                <div className="mt-1">{org.contactPersonPhone || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.website')}</div>
                <div className="mt-1">{org.website || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.address')}</div>
                <div className="mt-1">{org.streetAddress || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-[#6b7280]">{t('form.description')}</div>
                <div className="mt-1">{org.description || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.submittedVia')}</div>
                <div className="mt-1">{!org.submissionSource || org.submissionSource === 'ADMIN' ? t('values.submittedViaAdmin') : org.submissionSource}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('form.reviewedAt')}</div>
                <div className="mt-1">{org.reviewedAt ? new Date(org.reviewedAt).toLocaleString() : t('values.awaitingReview')}</div>
              </div>
              {org.status === 'REJECTED' ? (
                <div className="col-span-2">
                  <div className="text-sm font-medium text-[#6b7280]">{t('form.rejectionReason')}</div>
                  <div className="mt-1">{org.rejectionReason || t('values.noReasonProvided')}</div>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section
            id="admin-org-panel-users"
            role="tabpanel"
            aria-labelledby="admin-org-tab-users"
          >
            <OrgUsersTab organisationId={org.id} />
          </section>
        )}
      </div>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={t('rejectionModal.title')}
      >
        <label className="block text-sm font-medium text-[#6b7280]">
          {t('rejectionModal.reasonLabel')}
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            placeholder={t('rejectionModal.reasonPlaceholder')}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              rejectOrg.mutate({ id: org.id, rejectionReason: rejectionReason.trim() || undefined });
              setIsRejectModalOpen(false);
            }}
            disabled={rejectOrg.isPending}
          >
            {rejectOrg.isPending ? t('actions.rejecting') : t('rejectionModal.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function OrgUsersTab({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const tUsers = useTranslations('admin.users');
  const tCommon = useTranslations('admin.common');
  const { data, isLoading } = useUsers({ organisationId });

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'firstName', header: tUsers('columns.firstName'), enableSorting: true },
    { accessorKey: 'lastName', header: tUsers('columns.lastName'), enableSorting: true },
    {
      accessorKey: 'role',
      header: tUsers('columns.role'),
      cell: ({ getValue }) => (
        <Badge variant="neutral">{(getValue() as string).replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: tUsers('columns.joined'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
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
    <AdminPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f0f0f0] p-4">
        <h2 className="text-lg font-semibold">{tUsers('allUsers')}</h2>
        <Button onClick={() => router.push(`/admin/users/new?organisationId=${organisationId}`)}>
          {tUsers('addUser')}
        </Button>
      </div>
      {isLoading ? (
        <div className="p-4">
          <TableLoadingSkeleton />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          mobileCard={(row) => ({
            title: `${row.firstName} ${row.lastName}`.trim(),
            badges: <Badge variant="neutral">{row.role.replace(/_/g, ' ')}</Badge>,
            fields: [
              { label: tUsers('columns.email'), value: row.email },
              { label: tUsers('columns.joined'), value: new Date(row.createdAt).toLocaleDateString() },
            ],
            action: <button type="button" onClick={() => router.push(`/admin/users/${row.id}`)} className="admin-link-button">{tCommon('view')}</button>,
          })}
        />
      )}
    </AdminPanel>
  );
}
