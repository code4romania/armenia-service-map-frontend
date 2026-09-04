'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setIsDone(true);
    } catch {
      setError(t('forgotPassword.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_48%,#f9fafb_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[#dbe4f0] bg-white px-6 py-8 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] sm:px-8 lg:px-12 lg:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#155dfc]">
            {t('forgotPassword.eyebrow')}
          </p>

          {isDone ? (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#101828]">
                {t('forgotPassword.successTitle')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#4a5565]">{t('forgotPassword.successBody')}</p>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#101828]">
                {t('forgotPassword.title')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#4a5565]">{t('forgotPassword.subtitle')}</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Input
                  type="email"
                  label={t('email')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder={t('email')}
                />

                {error ? (
                  <p className="rounded-2xl border border-[#fecdca] bg-[#fff6ed] px-4 py-3 text-sm text-[#b42318]" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? '...' : t('forgotPassword.submit')}
                </Button>
              </form>
            </>
          )}

          <Link href="/login" className="mt-8 inline-block text-sm font-medium text-[#155dfc] hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </section>
    </div>
  );
}
