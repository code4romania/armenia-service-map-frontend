'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { submitFeedback } from '@/lib/api/feedback';
import { ApiError } from '@/lib/api/client';
import type { FeedbackFound, FeedbackKarabakh, FeedbackUsefulness } from '@/types/api';

const MAX_LOOKING_FOR = 500;

const USEFULNESS: FeedbackUsefulness[] = ['NOT_AT_ALL', 'SLIGHTLY', 'MODERATELY', 'VERY', 'EXTREMELY'];
const FOUND: FeedbackFound[] = ['YES', 'PARTLY', 'NO'];
const KARABAKH: FeedbackKarabakh[] = ['YES', 'NO', 'PREFER_NOT_TO_SAY'];

interface FeedbackFormProps {
  pagePath: string;
  serviceId?: string;
  onSubmitted: () => void;
  onClose: () => void;
}

interface RadioQuestionProps<T extends string> {
  name: string;
  label: string;
  options: readonly T[];
  optionLabel: (value: T) => string;
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}

function RadioQuestion<T extends string>({ name, label, options, optionLabel, value, onChange, error }: RadioQuestionProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
      aria-required="true"
      className="flex flex-col gap-2"
    >
      <p id={labelId} className="text-sm font-semibold text-[#101828]">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#364153] hover:border-[#E8922D] has-[:checked]:border-[#E8922D] has-[:checked]:bg-[#fff7ed]"
          >
            <input
              type="radio"
              name={`${name}-${id}`}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-[#E8922D]"
            />
            {optionLabel(option)}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-[#dc2626]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FeedbackForm({ pagePath, serviceId, onSubmitted, onClose }: FeedbackFormProps) {
  const t = useTranslations('feedback');
  const locale = useLocale();
  const lookingForId = useId();

  const [usefulness, setUsefulness] = useState<FeedbackUsefulness | null>(null);
  const [found, setFound] = useState<FeedbackFound | null>(null);
  const [lookingFor, setLookingFor] = useState('');
  const [fromKarabakh, setFromKarabakh] = useState<FeedbackKarabakh | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const showLookingFor = found === 'PARTLY' || found === 'NO';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!usefulness || !found || !fromKarabakh) {
      setShowErrors(true);
      return;
    }
    setSubmitError('');
    setPending(true);
    const trimmed = lookingFor.trim();
    try {
      await submitFeedback({
        usefulness,
        found,
        ...(showLookingFor && trimmed ? { lookingFor: trimmed } : {}),
        fromKarabakh,
        locale: locale === 'en' ? 'en' : 'hy',
        pagePath,
        ...(serviceId ? { serviceId } : {}),
      });
      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof ApiError && err.status === 429 ? t('errorTooMany') : t('errorGeneric'));
    } finally {
      setPending(false);
    }
  }

  const requiredError = (value: unknown) => (showErrors && !value ? t('required') : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white pb-1 pt-5">
        <div>
          <h2 className="text-lg font-bold text-[#101828]">{t('title')}</h2>
          <p className="mt-1 text-sm text-[#4a5565]">{t('intro')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f5f5f4] hover:text-[#111827]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <RadioQuestion
        name="usefulness"
        label={t('q1')}
        options={USEFULNESS}
        optionLabel={(v) => t(`q1Options.${v}`)}
        value={usefulness}
        onChange={setUsefulness}
        error={requiredError(usefulness)}
      />

      <RadioQuestion
        name="found"
        label={t('q2')}
        options={FOUND}
        optionLabel={(v) => t(`q2Options.${v}`)}
        value={found}
        onChange={setFound}
        error={requiredError(found)}
      />

      {showLookingFor ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={lookingForId} className="text-sm font-semibold text-[#101828]">
            {t('q21')}
          </label>
          <textarea
            id={lookingForId}
            value={lookingFor}
            maxLength={MAX_LOOKING_FOR}
            rows={3}
            onChange={(e) => setLookingFor(e.target.value)}
            className="w-full rounded-lg border border-[#d7dde5] bg-white px-3 py-2 text-sm text-[#101828] focus:border-[#E8922D] focus:outline-none"
          />
          <p className="self-end text-xs text-[#6a7282]">{t('charCount', { count: lookingFor.length })}</p>
        </div>
      ) : null}

      <RadioQuestion
        name="karabakh"
        label={t('q3')}
        options={KARABAKH}
        optionLabel={(v) => t(`q3Options.${v}`)}
        value={fromKarabakh}
        onChange={setFromKarabakh}
        error={requiredError(fromKarabakh)}
      />

      {submitError ? (
        <p role="alert" className="text-sm text-[#dc2626]">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t('sending') : t('send')}
      </Button>
    </form>
  );
}
