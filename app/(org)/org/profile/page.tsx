'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DetailPageLoadingSkeleton, TableLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useAuth } from '@/lib/auth/auth-context';
import { useOrgProfile, useOrgProfileUsers, useUpdateOrgProfile } from '@/lib/api/org-profile';
import {
  formatStatusLabel,
  ORG_STATUS_LABEL_KEYS,
  USER_STATUS_LABEL_KEYS,
} from '@/lib/formatting/status-label';
import { getErrorMessage, isValidEmail, isValidPhone, mapErrorMessageToField } from '@/lib/validation';
import type { User } from '@/types/api';

type Tab = 'details' | 'users';
type ProfileFormState = {
  name: string;
  description: string;
  website: string;
  location: string;
  category: string;
  activityDomain: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
};

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  description: '',
  website: '',
  location: '',
  category: '',
  activityDomain: '',
  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
};

export default function OrgProfilePage() {
  const t = useTranslations('org.profile');
  const tCommon = useTranslations('admin.common');
  const tStatuses = useTranslations('admin.statuses');
  const { user } = useAuth();
  const canEdit = user?.role === 'ORG_ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  const { data: profile, isLoading } = useOrgProfile();
  const usersQuery = useOrgProfileUsers({
    page: usersPage,
    perPage: usersPerPage,
    sortBy: 'firstName',
    sortOrder: 'asc',
  });
  const updateProfile = useUpdateOrgProfile();

  const [draftForm, setDraftForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const getBaseForm = (): ProfileFormState => {
    if (!profile) return EMPTY_PROFILE_FORM;
    return {
      name: profile.name ?? '',
      description: profile.description ?? '',
      website: profile.website ?? '',
      location: profile.location ?? '',
      category: profile.category ?? '',
      activityDomain: profile.activityDomain ?? '',
      contactPersonName: profile.contactPersonName ?? '',
      contactPersonEmail: profile.contactPersonEmail ?? '',
      contactPersonPhone: profile.contactPersonPhone ?? '',
    };
  };
  const form = draftForm ?? getBaseForm();
  const updateField = (field: keyof ProfileFormState, value: string) =>
    setDraftForm((previous) => ({ ...(previous ?? getBaseForm()), [field]: value }));

  function handleFieldChange(field: keyof ProfileFormState, value: string) {
    updateField(field, value);
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError(null);
  }

  function validate(values: ProfileFormState) {
    const nextErrors: Partial<Record<keyof ProfileFormState, string>> = {};
    if (!values.name.trim()) nextErrors.name = t('validation.nameRequired');
    if (values.contactPersonEmail.trim() && !isValidEmail(values.contactPersonEmail)) {
      nextErrors.contactPersonEmail = t('validation.invalidEmail');
    }
    if (values.contactPersonPhone.trim() && !isValidPhone(values.contactPersonPhone)) {
      nextErrors.contactPersonPhone = t('validation.invalidPhone');
    }
    return nextErrors;
  }

  const userColumns: ColumnDef<User, unknown>[] = [
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: 'name',
      header: t('users.columns.name'),
    },
    {
      accessorKey: 'email',
      header: t('users.columns.email'),
    },
    {
      accessorKey: 'phone',
      header: t('users.columns.phone'),
      cell: ({ getValue }) => (getValue() as string | null) || '—',
    },
    {
      accessorKey: 'status',
      header: t('users.columns.status'),
      cell: ({ getValue }) => {
        const status = String(getValue());
        return USER_STATUS_LABEL_KEYS[status]
          ? tStatuses(USER_STATUS_LABEL_KEYS[status])
          : formatStatusLabel(status);
      },
    },
    {
      accessorKey: 'lastAccessAt',
      header: t('users.columns.lastAccess'),
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? new Date(value).toLocaleString() : '—';
      },
    },
  ];

  async function handleSave() {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await updateProfile.mutateAsync({
        name: form.name || undefined,
        description: form.description || undefined,
        website: form.website || undefined,
        location: form.location || undefined,
        category: form.category || undefined,
        activityDomain: form.activityDomain || undefined,
        contactPersonName: form.contactPersonName || undefined,
        contactPersonEmail: form.contactPersonEmail || undefined,
        contactPersonPhone: form.contactPersonPhone || undefined,
      });
    } catch (error) {
      const message = getErrorMessage(error, t('updateError'));
      const mappedField = mapErrorMessageToField<keyof ProfileFormState>(message, [
        { field: 'name', pattern: /name|organisation/i },
        { field: 'website', pattern: /website|url/i },
        { field: 'contactPersonEmail', pattern: /email/i },
        { field: 'contactPersonPhone', pattern: /phone|telephone/i },
      ]);
      if (mappedField) {
        setErrors((previous) => ({ ...previous, [mappedField]: message }));
      } else {
        setSubmitError(message);
      }
    }
  }

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!profile) return <div className="admin-panel p-6 text-sm text-[#6b7280]">{t('unavailable')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111827]">{t('title')}</h1>
      <p className="mt-1 text-sm text-[#6b7280]">{t('description')}</p>

      <div
        className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1"
        style={{ width: 'fit-content' }}
        role="tablist"
        aria-label={t('sectionsLabel')}
      >
        <button
          type="button"
          role="tab"
          id="org-profile-tab-details"
          aria-selected={activeTab === 'details'}
          aria-controls="org-profile-panel-details"
          onClick={() => setActiveTab('details')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'details' ? 'bg-white text-emerald-700 shadow-sm' : 'text-[#6b7280] hover:text-gray-800'
          }`}
        >
          {t('tabs.details')}
        </button>
        <button
          type="button"
          role="tab"
          id="org-profile-tab-users"
          aria-selected={activeTab === 'users'}
          aria-controls="org-profile-panel-users"
          onClick={() => setActiveTab('users')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-white text-emerald-700 shadow-sm' : 'text-[#6b7280] hover:text-gray-800'
          }`}
        >
          {t('tabs.users')}
        </button>
      </div>

      {activeTab === 'details' ? (
        <section
          id="org-profile-panel-details"
          role="tabpanel"
          aria-labelledby="org-profile-tab-details"
          className="admin-panel mt-6 p-6"
        >
          {submitError ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('fields.name')}
              value={form.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              error={errors.name}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.website')}
              value={form.website}
              onChange={(event) => handleFieldChange('website', event.target.value)}
              error={errors.website}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.location')}
              value={form.location}
              onChange={(event) => handleFieldChange('location', event.target.value)}
              error={errors.location}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.category')}
              value={form.category}
              onChange={(event) => handleFieldChange('category', event.target.value)}
              error={errors.category}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.activityDomain')}
              value={form.activityDomain}
              onChange={(event) => handleFieldChange('activityDomain', event.target.value)}
              error={errors.activityDomain}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.contactPersonName')}
              value={form.contactPersonName}
              onChange={(event) => handleFieldChange('contactPersonName', event.target.value)}
              error={errors.contactPersonName}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.contactPersonEmail')}
              value={form.contactPersonEmail}
              onChange={(event) => handleFieldChange('contactPersonEmail', event.target.value)}
              error={errors.contactPersonEmail}
              disabled={!canEdit}
            />
            <Input
              label={t('fields.contactPersonPhone')}
              value={form.contactPersonPhone}
              onChange={(event) => handleFieldChange('contactPersonPhone', event.target.value)}
              error={errors.contactPersonPhone}
              disabled={!canEdit}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="org-profile-description" className="mb-1 block text-sm font-medium text-[#374151]">{t('fields.description')}</label>
            <textarea
              id="org-profile-description"
              value={form.description}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              rows={4}
              disabled={!canEdit}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
            {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description}</p> : null}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-[#6b7280]">
              {t('accountStatus')}{' '}
              <span className="font-medium text-[#374151]">
                {ORG_STATUS_LABEL_KEYS[profile.status]
                  ? tStatuses(ORG_STATUS_LABEL_KEYS[profile.status])
                  : formatStatusLabel(profile.status)}
              </span>
            </p>
            {canEdit ? (
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? t('saving') : tCommon('saveChanges')}
              </Button>
            ) : (
              <p className="text-xs text-[#6b7280]">{t('editRestricted')}</p>
            )}
          </div>
        </section>
      ) : (
        <section
          id="org-profile-panel-users"
          role="tabpanel"
          aria-labelledby="org-profile-tab-users"
          className="admin-panel mt-6 overflow-hidden"
        >
          <div className="border-b border-[#e5e5e5] p-4">
            <h2 className="text-lg font-semibold text-[#111827]">{t('users.heading')}</h2>
            <p className="text-sm text-[#6b7280]">{t('users.subtitle')}</p>
          </div>

          {usersQuery.isLoading ? (
            <div className="p-4">
              <TableLoadingSkeleton />
            </div>
          ) : (
            <>
              <DataTable columns={userColumns} data={usersQuery.data?.data ?? []} />
              {usersQuery.data ? (
                <Pagination
                  page={usersQuery.data.meta.page}
                  totalPages={usersQuery.data.meta.totalPages}
                  total={usersQuery.data.meta.total}
                  perPage={usersQuery.data.meta.perPage}
                  onPageChange={setUsersPage}
                  onPerPageChange={(pp) => {
                    setUsersPerPage(pp);
                    setUsersPage(1);
                  }}
                />
              ) : null}
            </>
          )}
        </section>
      )}
    </div>
  );
}
