'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NeedCtaBanner } from '@/components/public/need-cta-banner';
import { MultiSelect } from '@/components/ui/multi-select';
import { useJoinNetwork } from '@/lib/api/organisations';
import { usePublicRegions } from '@/lib/api/services';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FormState {
  organisationName: string;
  regionIds: string[];
  contactName: string;
  email: string;
  phone: string;
  servicesDescription: string;
}

const initialForm: FormState = {
  organisationName: '',
  regionIds: [],
  contactName: '',
  email: '',
  phone: '',
  servicesDescription: '',
};

export default function JoinTheNetworkPage() {
  const t = useTranslations('joinNetworkPage');
  const tHome = useTranslations('home');
  const router = useRouter();
  const { data: regions } = usePublicRegions();
  const joinNetwork = useJoinNetwork();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasRequiredFields = useMemo(() => {
    return (
      form.organisationName.trim() &&
      form.contactName.trim() &&
      form.email.trim() &&
      form.servicesDescription.trim()
    );
  }, [form]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.organisationName.trim()) nextErrors.organisationName = t('errors.organisationNameRequired');
    if (!form.contactName.trim()) nextErrors.contactName = t('errors.contactNameRequired');

    if (!form.email.trim()) {
      nextErrors.email = t('errors.emailRequired');
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = t('errors.emailInvalid');
    }

    if (form.phone.trim() && !isValidPhone(form.phone)) {
      nextErrors.phone = t('errors.phoneInvalid');
    }

    if (!form.servicesDescription.trim()) {
      nextErrors.servicesDescription = t('errors.servicesDescriptionRequired');
    } else if (form.servicesDescription.trim().length < 10) {
      nextErrors.servicesDescription = t('errors.servicesDescriptionTooShort');
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !hasRequiredFields) {
      return;
    }

    try {
      await joinNetwork.mutateAsync({
        organisationName: form.organisationName.trim(),
        regionIds: form.regionIds.length > 0 ? form.regionIds : undefined,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        servicesDescription: form.servicesDescription.trim(),
      });
      setForm(initialForm);
      setSubmitError(null);
      router.push('/join-the-network/success');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit your request right now.');
    }
  }

  return (
    <div className="bg-[#f9fafb]">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl font-bold text-[#101828]">{t('title')}</h1>
        <p className="mt-4 max-w-3xl text-lg text-[#4a5565]">{t('subtitle')}</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-8 rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-lg lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-[#101828]">{t('formTitle')}</h2>
            <p className="mt-2 text-sm text-[#6a7282]">{t('formSubtitle')}</p>

            {submitError ? (
              <p className="mt-6 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]" role="alert">
                {submitError}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label={t('organisationName')} required>
                <input
                  type="text"
                  value={form.organisationName}
                  onChange={(event) => updateField('organisationName', event.target.value)}
                  required
                  aria-invalid={Boolean(errors.organisationName)}
                  aria-describedby={errors.organisationName ? 'join-org-name-error' : undefined}
                  className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                {errors.organisationName ? (
                  <p id="join-org-name-error" className="mt-1 text-xs text-[#b91c1c]">
                    {errors.organisationName}
                  </p>
                ) : null}
              </Field>

              <Field label={t('regionsOfActivity')} as="div">
                <MultiSelect
                  aria-label={t('regionsOfActivity')}
                  options={(regions ?? []).map((region) => ({ value: region.id, label: region.name }))}
                  selected={form.regionIds}
                  onChange={(next) => updateField('regionIds', next)}
                  placeholder={t('selectRegions')}
                  selectedLabel={(count) => t('regionsSelected', { count })}
                  selectAllLabel={t('selectAllRegions')}
                  clearAllLabel={t('clearRegions')}
                  triggerClassName="rounded-md border border-[#d1d5db] bg-white px-3 py-2 pr-9 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  checkboxClassName="accent-[#155dfc]"
                  bulkActionClassName="text-[#155dfc]"
                  placeholderClassName="text-[#6a7282]"
                  chevron={<ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7282]" />}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('contactName')} required>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(event) => updateField('contactName', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.contactName)}
                    aria-describedby={errors.contactName ? 'join-contact-name-error' : undefined}
                    className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                  {errors.contactName ? (
                    <p id="join-contact-name-error" className="mt-1 text-xs text-[#b91c1c]">
                      {errors.contactName}
                    </p>
                  ) : null}
                </Field>

                <Field label={t('email')} required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'join-email-error' : undefined}
                    className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                  {errors.email ? (
                    <p id="join-email-error" className="mt-1 text-xs text-[#b91c1c]">
                      {errors.email}
                    </p>
                  ) : null}
                </Field>
              </div>

              <Field label={t('phone')}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'join-phone-error' : undefined}
                  className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                {errors.phone ? (
                  <p id="join-phone-error" className="mt-1 text-xs text-[#b91c1c]">
                    {errors.phone}
                  </p>
                ) : null}
              </Field>

              <Field label={t('servicesDescription')} required>
                <textarea
                  value={form.servicesDescription}
                  onChange={(event) => updateField('servicesDescription', event.target.value)}
                  rows={5}
                  required
                  aria-invalid={Boolean(errors.servicesDescription)}
                  aria-describedby={errors.servicesDescription ? 'join-services-description-error' : undefined}
                  className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                {errors.servicesDescription ? (
                  <p id="join-services-description-error" className="mt-1 text-xs text-[#b91c1c]">
                    {errors.servicesDescription}
                  </p>
                ) : null}
              </Field>

              <button
                type="submit"
                disabled={!hasRequiredFields || joinNetwork.isPending}
                className="rounded-md bg-[#155dfc] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-[#1447e6] disabled:opacity-50"
              >
                {joinNetwork.isPending ? 'Submitting...' : t('submit')}
              </button>
            </form>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-[#e5e7eb]">
            <Image
              src="/join-the-network.png"
              alt={t('imageAlt')}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <NeedCtaBanner
        title={tHome('ctaTitle')}
        subtitle={tHome('ctaSubtitle')}
        buttonLabel={tHome('reportNeed')}
      />
    </div>
  );
}

function Field({
  label,
  required = false,
  as: Wrapper = 'label',
  children,
}: {
  label: string;
  required?: boolean;
  /** Use `div` when the control is itself a button (a label wrapping a button is invalid HTML). */
  as?: 'label' | 'div';
  children: React.ReactNode;
}) {
  return (
    <Wrapper className="block">
      <span className="mb-1 block text-sm font-medium text-[#374151]">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </Wrapper>
  );
}
