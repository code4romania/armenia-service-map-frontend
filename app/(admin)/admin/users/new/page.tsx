'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useCreateUser } from '@/lib/api/users';
import { useOrganisations } from '@/lib/api/organisations';
import { publishToast } from '@/lib/toast-bus';
import { getErrorMessage, isValidEmail, mapErrorMessageToField } from '@/lib/validation';

type Role = 'ORG_ADMIN' | 'SUPER_ADMIN';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  organisationId: string;
};

type FormField = keyof FormState;

const selectClassName =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500';

function NewUserForm() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const tForm = useTranslations('admin.users.form');
  const tRoles = useTranslations('admin.users.roles');
  const tCommon = useTranslations('admin.common');
  const searchParams = useSearchParams();
  // Arriving from an organisation page: the user always becomes that organisation's Org Admin.
  const presetOrgId = searchParams.get('organisationId') || '';
  const createUser = useCreateUser();
  const organisations = useOrganisations(
    presetOrgId ? {} : { perPage: 200, sortBy: 'name', sortOrder: 'asc' },
  );

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'ORG_ADMIN',
    organisationId: presetOrgId,
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const needsOrganisation = form.role === 'ORG_ADMIN';

  const updateField = (field: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  function validate(values: FormState) {
    const nextErrors: Partial<Record<FormField, string>> = {};
    if (!values.firstName.trim()) nextErrors.firstName = t('validation.firstNameRequired');
    if (!values.lastName.trim()) nextErrors.lastName = t('validation.lastNameRequired');
    if (!values.email.trim()) {
      nextErrors.email = t('validation.emailRequired');
    } else if (!isValidEmail(values.email)) {
      nextErrors.email = t('validation.invalidEmail');
    }
    if (values.role === 'ORG_ADMIN' && !values.organisationId) {
      nextErrors.organisationId = t('validation.organisationRequired');
    }
    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      ...(needsOrganisation ? { organisationId: form.organisationId } : {}),
    };

    try {
      await createUser.mutateAsync(data);
      publishToast({ type: 'success', message: t('created') });
      // Land where the new user is visible: the organisation's Users tab, or the users list.
      router.push(presetOrgId ? `/admin/organisations/${presetOrgId}?tab=users` : '/admin/users');
    } catch (error) {
      const message = getErrorMessage(error, t('validation.createFailed'));
      const mappedField = mapErrorMessageToField<FormField>(message, [
        { field: 'firstName', pattern: /first.?name/i },
        { field: 'lastName', pattern: /last.?name/i },
        { field: 'email', pattern: /email/i },
        { field: 'role', pattern: /role/i },
        { field: 'organisationId', pattern: /organisation|org/i },
      ]);
      if (mappedField) {
        setErrors((prev) => ({ ...prev, [mappedField]: message }));
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/admin/users" className="hover:underline">{t('usersManagement')}</Link>
        {' > '}
        <span>{t('addNew')}</span>
      </div>
      <h1 className="text-2xl font-bold">{t('addNew')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4 rounded-lg border bg-white p-6">
        {submitError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={tForm('firstNameRequired')}
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={errors.firstName}
            required
          />
          <Input
            label={tForm('lastNameRequired')}
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            error={errors.lastName}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={tForm('emailRequired')}
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            required
          />
          {presetOrgId ? null : (
            <div>
              <label htmlFor="new-user-role" className="mb-1 block text-sm font-medium text-[#374151]">
                {tForm('role')}
              </label>
              <select
                id="new-user-role"
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                aria-invalid={Boolean(errors.role)}
                aria-describedby={errors.role ? 'new-user-role-error' : undefined}
                className={selectClassName}
              >
                <option value="ORG_ADMIN">{tRoles('orgAdmin')}</option>
                <option value="SUPER_ADMIN">{tRoles('superAdmin')}</option>
              </select>
              {errors.role ? (
                <p id="new-user-role-error" className="mt-1 text-xs text-red-600">{errors.role}</p>
              ) : null}
            </div>
          )}
        </div>
        {!presetOrgId && needsOrganisation ? (
          <div>
            <label htmlFor="new-user-organisation" className="mb-1 block text-sm font-medium text-[#374151]">
              {tForm('organisationRequired')}
            </label>
            <select
              id="new-user-organisation"
              value={form.organisationId}
              onChange={(e) => updateField('organisationId', e.target.value)}
              aria-invalid={Boolean(errors.organisationId)}
              aria-describedby={errors.organisationId ? 'new-user-organisation-error' : undefined}
              className={selectClassName}
              required
            >
              <option value="">{tForm('selectOrganisation')}</option>
              {(organisations.data?.data ?? []).map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {errors.organisationId ? (
              <p id="new-user-organisation-error" className="mt-1 text-xs text-red-600">{errors.organisationId}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => router.back()}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? tForm('saving') : tCommon('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <Suspense fallback={<DetailPageLoadingSkeleton />}>
      <NewUserForm />
    </Suspense>
  );
}
