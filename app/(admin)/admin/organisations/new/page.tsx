'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateOrganisation, type CreateOrganisationPayload } from '@/lib/api/organisations';
import { getErrorMessage, isValidEmail, isValidPhone, mapErrorMessageToField } from '@/lib/validation';

type FormState = {
  name: string;
  description: string;
  website: string;
  streetAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
};

type FormField = keyof FormState;

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  website: '',
  streetAddress: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
};

function toPayload(values: FormState): CreateOrganisationPayload {
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    name: values.name.trim(),
    description: optional(values.description),
    website: optional(values.website),
    streetAddress: optional(values.streetAddress),
    admin: {
      firstName: values.adminFirstName.trim(),
      lastName: values.adminLastName.trim(),
      email: values.adminEmail.trim(),
      phone: optional(values.adminPhone),
    },
  };
}

export default function NewOrganisationPage() {
  const router = useRouter();
  const t = useTranslations('admin.organisations');
  const tCommon = useTranslations('admin.common');
  const createOrg = useCreateOrganisation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  function validate(values: FormState) {
    const nextErrors: Partial<Record<FormField, string>> = {};
    if (!values.name.trim()) nextErrors.name = t('validation.nameRequired');
    if (!values.adminFirstName.trim()) nextErrors.adminFirstName = t('validation.firstNameRequired');
    if (!values.adminLastName.trim()) nextErrors.adminLastName = t('validation.lastNameRequired');
    if (!values.adminEmail.trim()) {
      nextErrors.adminEmail = t('validation.emailRequired');
    } else if (!isValidEmail(values.adminEmail)) {
      nextErrors.adminEmail = t('validation.invalidEmail');
    }
    if (values.adminPhone.trim() && !isValidPhone(values.adminPhone)) {
      nextErrors.adminPhone = t('validation.invalidPhone');
    }
    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await createOrg.mutateAsync(toPayload(form));
      router.push('/admin/organisations');
    } catch (error) {
      const message = getErrorMessage(error, t('validation.createFailed'));
      const mappedField = mapErrorMessageToField<FormField>(message, [
        { field: 'adminEmail', pattern: /email/i },
        { field: 'adminPhone', pattern: /phone|telephone/i },
        { field: 'adminFirstName', pattern: /firstName|first name/i },
        { field: 'adminLastName', pattern: /lastName|last name/i },
        { field: 'streetAddress', pattern: /address|street/i },
        { field: 'name', pattern: /name|organisation/i },
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
        <Link href="/admin/organisations" className="hover:underline">{t('title')}</Link>
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
            label={t('form.nameRequired')}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            aria-invalid={Boolean(errors.name)}
            required
          />
          <Input label={t('form.website')} value={form.website} onChange={(e) => updateField('website', e.target.value)} />
        </div>
        <Input
          label={t('form.address')}
          value={form.streetAddress}
          onChange={(e) => updateField('streetAddress', e.target.value)}
          error={errors.streetAddress}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">{t('form.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'org-description-error' : undefined}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.description ? (
            <p id="org-description-error" className="mt-1 text-xs text-red-600">{errors.description}</p>
          ) : null}
        </div>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-base font-semibold text-[#111827]">{t('form.adminSection')}</legend>
          <p className="-mt-2 text-sm text-[#6b7280]">{t('form.adminHint')}</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.adminFirstNameRequired')}
              value={form.adminFirstName}
              onChange={(e) => updateField('adminFirstName', e.target.value)}
              error={errors.adminFirstName}
              aria-invalid={Boolean(errors.adminFirstName)}
              autoComplete="off"
              required
            />
            <Input
              label={t('form.adminLastNameRequired')}
              value={form.adminLastName}
              onChange={(e) => updateField('adminLastName', e.target.value)}
              error={errors.adminLastName}
              aria-invalid={Boolean(errors.adminLastName)}
              autoComplete="off"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.adminEmailRequired')}
              type="email"
              value={form.adminEmail}
              onChange={(e) => updateField('adminEmail', e.target.value)}
              error={errors.adminEmail}
              aria-invalid={Boolean(errors.adminEmail)}
              autoComplete="off"
              required
            />
            <Input
              label={t('form.adminPhone')}
              value={form.adminPhone}
              onChange={(e) => updateField('adminPhone', e.target.value)}
              error={errors.adminPhone}
              aria-invalid={Boolean(errors.adminPhone)}
              autoComplete="off"
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => router.back()}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={createOrg.isPending}>
            {createOrg.isPending ? t('form.saving') : tCommon('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}
