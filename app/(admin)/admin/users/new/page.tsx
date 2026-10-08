'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useCreateUser } from '@/lib/api/users';
import { publishToast } from '@/lib/toast-bus';
import { getErrorMessage, isValidEmail, mapErrorMessageToField } from '@/lib/validation';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type FormField = keyof FormState;

/**
 * Two entry points share this form:
 * - from an organisation page (`?organisationId=`): adds an Org Admin to that organisation;
 * - from the admin users list: adds a platform Super Admin.
 * The role is implied by where the user came from, so it is never picked here.
 */
function NewUserForm() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const tForm = useTranslations('admin.users.form');
  const tCommon = useTranslations('admin.common');
  const searchParams = useSearchParams();
  const presetOrgId = searchParams.get('organisationId') || '';
  const createUser = useCreateUser();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const phone = form.phone.trim();
    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      ...(phone ? { phone } : {}),
      ...(presetOrgId
        ? { role: 'ORG_ADMIN', organisationId: presetOrgId }
        : { role: 'SUPER_ADMIN' }),
    };

    try {
      await createUser.mutateAsync(data);
      publishToast({ type: 'success', message: t('created') });
      // Land where the new user is visible: the organisation's Users tab, or the admin users list.
      router.push(presetOrgId ? `/admin/organisations/${presetOrgId}?tab=users` : '/admin/users');
    } catch (error) {
      const message = getErrorMessage(error, t('validation.createFailed'));
      const mappedField = mapErrorMessageToField<FormField>(message, [
        { field: 'firstName', pattern: /first.?name/i },
        { field: 'lastName', pattern: /last.?name/i },
        { field: 'email', pattern: /email/i },
        { field: 'phone', pattern: /phone/i },
      ]);
      if (mappedField) {
        setErrors((prev) => ({ ...prev, [mappedField]: message }));
      } else {
        setSubmitError(message);
      }
    }
  }

  const title = presetOrgId ? t('addNew') : t('addNewAdminUser');

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/admin/users" className="hover:underline">{t('usersManagement')}</Link>
        {' > '}
        <span>{title}</span>
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border bg-white p-6">
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
          <Input
            label={tForm('phone')}
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={errors.phone}
          />
        </div>

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
