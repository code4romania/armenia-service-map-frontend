'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { usePublicRegions, usePublicTargetGroups, usePublicTopics } from '@/lib/api/services';
import type { ServiceMutationInput } from '@/lib/api/services';
import { getErrorMessage, mapErrorMessageToField, toPlainText } from '@/lib/validation';

/** Sentinel select value meaning the service is available nationwide (persisted as `regionId: null`). */
export const ALL_REGIONS = 'all';

export type ServiceFormState = {
  title: string;
  titleHy: string;
  shortDescription: string;
  shortDescriptionHy: string;
  description: string;
  descriptionHy: string;
  howToAccess: string;
  howToAccessHy: string;
  organisationId: string;
  isExternalOrganisation: boolean;
  externalOrganisationName: string;
  status: 'DRAFT' | 'PUBLISHED';
  isAvailable: boolean;
  regionId: string;
  topicIds: string[];
  targetGroupIds: string[];
  availabilityStart: string;
  availabilityEnd: string;
};

type FieldErrorKey =
  | 'title'
  | 'shortDescription'
  | 'description'
  | 'howToAccess'
  | 'regionId'
  | 'organisationId'
  | 'externalOrganisationName'
  | 'topics'
  | 'targetGroups'
  | 'availabilityStart'
  | 'availabilityEnd';

// Each validation issue carries an `inline` message shown beneath its field and a
// `summary` message (which spells out the language for the bilingual fields) listed
// in the error box at the top of the form.
type ValidationIssue = {
  key: FieldErrorKey;
  inline: string;
  summary: string;
};

// Maps a server-side error message back onto a specific field so it surfaces inline
// and in the summary box instead of only as a generic top-level error. `shortDescription`
// must precede `description` because /description/i also matches "short description".
const SERVER_ERROR_FIELD_PATTERNS: Array<{ field: FieldErrorKey; pattern: RegExp }> = [
  { field: 'title', pattern: /title/i },
  { field: 'shortDescription', pattern: /short.?description/i },
  { field: 'description', pattern: /description/i },
  { field: 'regionId', pattern: /region|location/i },
  { field: 'availabilityStart', pattern: /start/i },
  { field: 'availabilityEnd', pattern: /end/i },
];

type ServiceFormProps = {
  /** 'edit' clears emptied English fields with `null` (vs `undefined`) so a PATCH wipes them. */
  mode?: 'create' | 'edit';
  /** Pre-populates the form. Only read on mount, so render the form after data has loaded. */
  initialValues?: Partial<ServiceFormState>;
  showOrganisationField: boolean;
  allowExternalOrganisation?: boolean;
  organisationOptions?: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: ServiceMutationInput) => Promise<void>;
};

const EMPTY_FORM: ServiceFormState = {
  title: '',
  titleHy: '',
  shortDescription: '',
  shortDescriptionHy: '',
  description: '',
  descriptionHy: '',
  howToAccess: '',
  howToAccessHy: '',
  organisationId: '',
  isExternalOrganisation: false,
  externalOrganisationName: '',
  status: 'DRAFT',
  isAvailable: true,
  regionId: '',
  topicIds: [],
  targetGroupIds: [],
  availabilityStart: '',
  availabilityEnd: '',
};

export function ServiceForm({
  mode = 'create',
  initialValues,
  showOrganisationField,
  allowExternalOrganisation = false,
  organisationOptions = [],
  isSubmitting,
  submitLabel,
  onCancel,
  onSubmit,
}: ServiceFormProps) {
  const t = useTranslations('serviceForm');
  const [form, setForm] = useState<ServiceFormState>(() => ({ ...EMPTY_FORM, ...initialValues }));
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'hy'>('hy');
  const languageLabel = activeLanguage === 'en' ? t('english') : t('armenian');
  const [errors, setErrors] = useState<ValidationIssue[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const errorMap = useMemo(
    () =>
      errors.reduce<Partial<Record<FieldErrorKey, string>>>((acc, issue) => {
        acc[issue.key] = issue.inline;
        return acc;
      }, {}),
    [errors],
  );
  const { data: topics } = usePublicTopics();
  const { data: regions } = usePublicRegions();
  const { data: targetGroups } = usePublicTargetGroups();

  const topicOptions = useMemo(
    () =>
      (topics ?? []).flatMap((topic) => [
        { id: topic.id, name: topic.name },
        ...((topic.children ?? []).map((child) => ({
          id: child.id,
          name: `${topic.name} / ${child.name}`,
        })) || []),
      ]),
    [topics],
  );

  const selectClasses =
    'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none';

  // Visual-only required marker; aria-hidden keeps it out of the field's accessible name.
  const requiredMark = <span aria-hidden="true"> *</span>;

  function validate(values: ServiceFormState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // Armenian is the canonical language: the *Hy fields are required and their
    // summary spells out "(Armenian)" so the user knows which tab to fix even when
    // they filled in the English tab instead.
    const armenian = t('armenian');
    if (!values.titleHy.trim()) {
      issues.push({
        key: 'title',
        inline: t('validation.titleRequired'),
        summary: t('validation.required', { field: t('titleField', { language: armenian }) }),
      });
    }
    if (!toPlainText(values.shortDescriptionHy)) {
      issues.push({
        key: 'shortDescription',
        inline: t('validation.shortDescriptionRequired'),
        summary: t('validation.required', { field: t('shortDescriptionField', { language: armenian }) }),
      });
    }
    if (!toPlainText(values.descriptionHy)) {
      issues.push({
        key: 'description',
        inline: t('validation.descriptionRequired'),
        summary: t('validation.required', { field: t('descriptionField', { language: armenian }) }),
      });
    }
    if (!toPlainText(values.howToAccessHy)) {
      issues.push({
        key: 'howToAccess',
        inline: t('validation.howToAccessRequired'),
        summary: t('validation.required', { field: t('howToAccessField', { language: armenian }) }),
      });
    }
    if (!values.regionId) {
      const message = t('validation.required', { field: t('location') });
      issues.push({ key: 'regionId', inline: message, summary: message });
    }
    if (showOrganisationField) {
      if (values.isExternalOrganisation) {
        if (!values.externalOrganisationName.trim()) {
          issues.push({
            key: 'externalOrganisationName',
            inline: t('validation.organisationNameRequired'),
            summary: t('validation.required', { field: t('organisationName') }),
          });
        }
      } else if (!values.organisationId) {
        issues.push({
          key: 'organisationId',
          inline: t('validation.organisationRequired'),
          summary: t('validation.required', { field: t('organisation') }),
        });
      }
    }
    if (values.topicIds.length === 0) {
      const message = t('validation.required', { field: t('topics') });
      issues.push({ key: 'topics', inline: message, summary: message });
    }
    if (values.targetGroupIds.length === 0) {
      const message = t('validation.required', { field: t('targetGroups') });
      issues.push({ key: 'targetGroups', inline: message, summary: message });
    }
    // Dates are optional, but if both are set the end cannot precede the start.
    if (values.availabilityStart && values.availabilityEnd && values.availabilityEnd < values.availabilityStart) {
      const message = t('validation.endBeforeStart');
      issues.push({ key: 'availabilityEnd', inline: message, summary: message });
    }
    return issues;
  }

  // Once errors are shown, re-validate on every change and drop any issue that has been
  // resolved — but never surface NEW issues for untouched fields before the user submits.
  const reconcileErrors = (nextForm: ServiceFormState) => {
    setErrors((previous) => {
      if (previous.length === 0) return previous;
      const stillInvalid = new Set(validate(nextForm).map((issue) => issue.key));
      return previous.filter((issue) => stillInvalid.has(issue.key));
    });
  };

  const updateField = <K extends keyof ServiceFormState>(field: K, value: ServiceFormState[K]) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setSubmitError(null);
    reconcileErrors(next);
  };

  const handleExternalToggle = (checked: boolean) => {
    const next: ServiceFormState = {
      ...form,
      isExternalOrganisation: checked,
      organisationId: checked ? '' : form.organisationId,
      externalOrganisationName: checked ? form.externalOrganisationName : '',
    };
    setForm(next);
    setSubmitError(null);
    reconcileErrors(next);
  };

  const scrollToErrorSummary = () => {
    // Runs after the summary box is committed to the DOM. Guarded because scrollIntoView
    // is not implemented in jsdom (test environment).
    requestAnimationFrame(() => {
      try {
        errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        /* no-op */
      }
    });
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      scrollToErrorSummary();
      return;
    }

    // On edit, an emptied English field is sent as `null` to clear it; on create it is
    // omitted with `undefined`.
    const emptyEnglish = mode === 'edit' ? null : undefined;
    try {
      await onSubmit({
        title: form.title.trim() ? form.title : emptyEnglish,
        titleHy: form.titleHy,
        shortDescription: toPlainText(form.shortDescription) ? form.shortDescription : emptyEnglish,
        shortDescriptionHy: form.shortDescriptionHy,
        description: toPlainText(form.description) ? form.description : emptyEnglish,
        descriptionHy: form.descriptionHy,
        howToAccess: toPlainText(form.howToAccess) ? form.howToAccess : emptyEnglish,
        howToAccessHy: form.howToAccessHy,
        organisationId:
          showOrganisationField && !form.isExternalOrganisation ? form.organisationId : undefined,
        externalOrganisationName:
          showOrganisationField && form.isExternalOrganisation
            ? form.externalOrganisationName.trim()
            : undefined,
        status: form.status,
        isAvailable: form.isAvailable,
        regionId: form.regionId === ALL_REGIONS ? null : form.regionId || undefined,
        targetGroupIds: form.targetGroupIds,
        topicIds: form.topicIds,
        availabilityStart: form.availabilityStart || undefined,
        availabilityEnd: form.availabilityEnd || undefined,
      });
    } catch (error) {
      const message = getErrorMessage(error, t(mode === 'edit' ? 'updateError' : 'saveError'));
      const mappedField = mapErrorMessageToField<FieldErrorKey>(message, SERVER_ERROR_FIELD_PATTERNS);
      if (mappedField) {
        setSubmitError(null);
        setErrors([{ key: mappedField, inline: message, summary: message }]);
      } else {
        setSubmitError(message);
      }
      scrollToErrorSummary();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate /* custom validate() handles all errors; suppress native browser validation */ className="mt-8 space-y-6">
      {errors.length > 0 || submitError ? (
        <div ref={errorSummaryRef} role="alert" data-testid="service-form-errors" className="scroll-mt-24 space-y-3">
          {errors.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{t('errorSummaryTitle')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((issue) => (
                  <li key={issue.key}>{issue.summary}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {submitError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-10 rounded-xl bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06),0px_0px_0px_0px_#ececee]">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111827]">{t('language')}</label>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setActiveLanguage('hy')}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                activeLanguage === 'hy' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              {t('armenian')}
            </button>
            <button
              type="button"
              onClick={() => setActiveLanguage('en')}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                activeLanguage === 'en' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              {t('english')}
            </button>
          </div>
        </div>

        {showOrganisationField ? (
          allowExternalOrganisation ? (
            // Two-column layout: org select + optional external-org name field
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#111827]">
                  {t('organisation')}
                  {!form.isExternalOrganisation ? requiredMark : null}
                </label>
                <select
                  aria-label={t('organisation')}
                  value={form.organisationId}
                  onChange={(event) => updateField('organisationId', event.target.value)}
                  disabled={form.isExternalOrganisation}
                  className={`${selectClasses} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                >
                  <option value="">{t('selectOrganisation')}</option>
                  {organisationOptions.map((organisation) => (
                    <option key={organisation.id} value={organisation.id}>
                      {organisation.name}
                    </option>
                  ))}
                </select>
                {errorMap.organisationId ? <p className="mt-1 text-xs text-red-600">{errorMap.organisationId}</p> : null}
                <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                  <input
                    type="checkbox"
                    checked={form.isExternalOrganisation}
                    onChange={(event) => handleExternalToggle(event.target.checked)}
                  />
                  {t('outsideNetwork')}
                </label>
              </div>
              {form.isExternalOrganisation ? (
                <Input
                  label={`${t('organisationName')} *`}
                  value={form.externalOrganisationName}
                  onChange={(event) => updateField('externalOrganisationName', event.target.value)}
                  required
                  error={errorMap.externalOrganisationName}
                />
              ) : (
                <div />
              )}
            </div>
          ) : (
            // Single-column layout (original appearance for org-create / admin-create consumers)
            <div className="max-w-[492px]">
              <label className="mb-2 block text-sm font-medium text-[#111827]">
                {t('organisation')}
                {requiredMark}
              </label>
              <select
                aria-label={t('organisation')}
                value={form.organisationId}
                onChange={(event) => updateField('organisationId', event.target.value)}
                className={selectClasses}
              >
                <option value="">{t('selectOrganisation')}</option>
                {organisationOptions.map((organisation) => (
                  <option key={organisation.id} value={organisation.id}>
                    {organisation.name}
                  </option>
                ))}
              </select>
              {errorMap.organisationId ? <p className="mt-1 text-xs text-red-600">{errorMap.organisationId}</p> : null}
            </div>
          )
        ) : null}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111827]">{t('status')}</label>
            <select
              value={form.status}
              onChange={(event) => updateField('status', event.target.value as 'DRAFT' | 'PUBLISHED')}
              className={selectClasses}
            >
              <option value="DRAFT">{t('draft')}</option>
              <option value="PUBLISHED">{t('published')}</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) => updateField('isAvailable', event.target.checked)}
              />
              {t('serviceCurrentlyAvailable')}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input
            label={`${t('titleField', { language: languageLabel })}${activeLanguage === 'hy' ? ' *' : ''}`}
            value={activeLanguage === 'en' ? form.title : form.titleHy}
            onChange={(event) =>
              updateField(activeLanguage === 'en' ? 'title' : 'titleHy', event.target.value)
            }
            required={activeLanguage === 'hy'}
            error={activeLanguage === 'hy' ? errorMap.title : undefined}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111827]">
              {t('location')}
              {requiredMark}
            </label>
            <select
              aria-label={t('location')}
              value={form.regionId}
              onChange={(event) => updateField('regionId', event.target.value)}
              className={selectClasses}
            >
              <option value="">{t('whereAvailable')}</option>
              <option value={ALL_REGIONS}>{t('allRegions')}</option>
              {regions?.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {errorMap.regionId ? <p className="mt-1 text-xs text-red-600">{errorMap.regionId}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111827]">
              {t('topics')}
              {requiredMark}
            </label>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 p-3">
              <div className="flex flex-col gap-2">
                {topicOptions.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 text-sm text-[#374151]">
                    <input
                      type="checkbox"
                      checked={form.topicIds.includes(topic.id)}
                      onChange={(event) =>
                        updateField(
                          'topicIds',
                          event.target.checked
                            ? [...form.topicIds, topic.id]
                            : form.topicIds.filter((id) => id !== topic.id),
                        )
                      }
                    />
                    {topic.name}
                  </label>
                ))}
              </div>
            </div>
            {errorMap.topics ? <p className="mt-1 text-xs text-red-600">{errorMap.topics}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111827]">
              {t('targetGroups')}
              {requiredMark}
            </label>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 p-3">
              <div className="flex flex-col gap-2">
                {(targetGroups ?? []).map((targetGroup) => (
                  <label key={targetGroup.id} className="flex items-center gap-2 text-sm text-[#374151]">
                    <input
                      type="checkbox"
                      checked={form.targetGroupIds.includes(targetGroup.id)}
                      onChange={(event) =>
                        updateField(
                          'targetGroupIds',
                          event.target.checked
                            ? [...form.targetGroupIds, targetGroup.id]
                            : form.targetGroupIds.filter((id) => id !== targetGroup.id),
                        )
                      }
                    />
                    {targetGroup.name}
                  </label>
                ))}
              </div>
            </div>
            {errorMap.targetGroups ? <p className="mt-1 text-xs text-red-600">{errorMap.targetGroups}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input
            label={t('startDate')}
            type="date"
            value={form.availabilityStart}
            onChange={(event) => updateField('availabilityStart', event.target.value)}
            error={errorMap.availabilityStart}
          />
          <Input
            label={t('endDate')}
            type="date"
            value={form.availabilityEnd}
            onChange={(event) => updateField('availabilityEnd', event.target.value)}
            error={errorMap.availabilityEnd}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111827]">
            {t('shortDescriptionField', { language: languageLabel })}
            {activeLanguage === 'hy' ? requiredMark : null}
          </label>
          <RichTextEditor
            content={activeLanguage === 'en' ? form.shortDescription : form.shortDescriptionHy}
            onChange={(html) =>
              updateField(activeLanguage === 'en' ? 'shortDescription' : 'shortDescriptionHy', html)
            }
          />
          {activeLanguage === 'hy' && errorMap.shortDescription ? (
            <p className="mt-1 text-xs text-red-600">{errorMap.shortDescription}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111827]">
            {t('descriptionField', { language: languageLabel })}
            {activeLanguage === 'hy' ? requiredMark : null}
          </label>
          <RichTextEditor
            content={activeLanguage === 'en' ? form.description : form.descriptionHy}
            onChange={(html) => updateField(activeLanguage === 'en' ? 'description' : 'descriptionHy', html)}
          />
          {activeLanguage === 'hy' && errorMap.description ? (
            <p className="mt-1 text-xs text-red-600">{errorMap.description}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111827]">
            {t('howToAccessField', { language: languageLabel })}
            {activeLanguage === 'hy' ? requiredMark : null}
          </label>
          <RichTextEditor
            content={activeLanguage === 'en' ? form.howToAccess : form.howToAccessHy}
            onChange={(html) =>
              updateField(activeLanguage === 'en' ? 'howToAccess' : 'howToAccessHy', html)
            }
          />
          {activeLanguage === 'hy' && errorMap.howToAccess ? (
            <p className="mt-1 text-xs text-red-600">{errorMap.howToAccess}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('saving') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
