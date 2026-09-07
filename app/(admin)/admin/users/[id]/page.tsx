'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useActivateUser,
  useDeactivateUser,
  useDeleteUser,
  useResetUserPassword,
  useUser,
} from '@/lib/api/users';
import { getErrorMessage } from '@/lib/validation';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import {
  USER_ROLE_LABEL_KEYS,
  USER_STATUS_LABEL_KEYS,
  formatStatusLabel,
} from '@/lib/formatting/status-label';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useUser(id);
  const deleteUser = useDeleteUser();
  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();
  const resetPassword = useResetUserPassword();
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const t = useTranslations('admin.users');
  const tCols = useTranslations('admin.users.columns');
  const tForm = useTranslations('admin.users.form');
  const tRoles = useTranslations('admin.users.roles');
  const tStatuses = useTranslations('admin.statuses');

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!user) return <div className="p-8 text-gray-500">{t('notFound')}</div>;

  const statusKey = USER_STATUS_LABEL_KEYS[user.status];
  const statusLabel = statusKey ? tStatuses(statusKey) : formatStatusLabel(user.status);
  const roleKey = USER_ROLE_LABEL_KEYS[user.role];
  const roleLabel = roleKey ? tRoles(roleKey) : formatStatusLabel(user.role);
  const isSuspended = user.status === 'SUSPENDED';
  const isBusy =
    deleteUser.isPending || deactivateUser.isPending || activateUser.isPending || resetPassword.isPending;

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setNotice(null);
    try {
      await action();
      setNotice({ kind: 'success', message: successMessage });
    } catch (error) {
      setNotice({ kind: 'error', message: getErrorMessage(error, t('actionFailed')) });
    }
  }

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return;
    setNotice(null);
    try {
      await deleteUser.mutateAsync(id);
      router.push('/admin/users');
    } catch (error) {
      setNotice({ kind: 'error', message: getErrorMessage(error, t('actionFailed')) });
    }
  }

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">
        <Link href="/admin/users" className="hover:underline">{t('usersManagement')}</Link>
        {user.organisation && (
          <>
            {' > '}
            <Link href={`/admin/organisations/${user.organisationId}`} className="hover:underline">
              {user.organisation.name}
            </Link>
          </>
        )}
        {' > '}
        <span>{user.firstName} {user.lastName}</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={isBusy}
            onClick={() => void run(() => resetPassword.mutateAsync(id), t('resetPasswordSent'))}
          >
            {t('resetPassword')}
          </Button>
          {isSuspended ? (
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => void run(() => activateUser.mutateAsync(id), t('activated'))}
            >
              {t('activateAccount')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => {
                if (confirm(t('deactivateConfirm'))) void run(() => deactivateUser.mutateAsync(id), t('deactivated'));
              }}
            >
              {t('deactivateAccount')}
            </Button>
          )}
          <Button variant="danger" disabled={isBusy} onClick={() => void handleDelete()}>
            {t('deleteAccount')}
          </Button>
        </div>
      </div>

      {notice ? (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <div className="mt-6 rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500">{t('status')}</div>
            <Badge variant="success">{statusLabel}</Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{tCols('created')}</div>
            <div className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('userDetails')}</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <div className="text-sm font-medium text-gray-500">{tCols('firstName')}</div>
            <div className="mt-1">{user.firstName}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{tCols('lastName')}</div>
            <div className="mt-1">{user.lastName}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{tForm('email')}</div>
            <div className="mt-1">{user.email}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{tCols('role')}</div>
            <div className="mt-1">{roleLabel}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{tCols('organisation')}</div>
            <div className="mt-1">{user.organisation?.name || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
