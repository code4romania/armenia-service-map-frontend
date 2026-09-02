'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setupPassword } from '@/lib/api/auth';

// Mirrors PasswordSetupDto on the backend (@MinLength(8)).
const MIN_PASSWORD_LENGTH = 8;
const REDIRECT_DELAY_MS = 2500;

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetupPasswordContent />
    </Suspense>
  );
}

function SetupPasswordContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => router.push('/login'), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isDone, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('setupPassword.tooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('setupPassword.mismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await setupPassword({ token, password });
      setIsDone(true);
    } catch {
      setError(t('setupPassword.invalidToken'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_48%,#f9fafb_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[#dbe4f0] bg-white px-6 py-8 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] sm:px-8 lg:px-12 lg:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#155dfc]">
            {t('setupPassword.eyebrow')}
          </p>

          {!token ? (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#101828]">
                {t('setupPassword.errorTitle')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#4a5565]">{t('setupPassword.missingToken')}</p>
              <Link href="/login" className="mt-8 inline-block text-sm font-medium text-[#155dfc] hover:underline">
                {t('setupPassword.goToLogin')}
              </Link>
            </>
          ) : isDone ? (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#101828]">
                {t('setupPassword.successTitle')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#4a5565]">{t('setupPassword.successBody')}</p>
              <Link href="/login" className="mt-8 inline-block text-sm font-medium text-[#155dfc] hover:underline">
                {t('setupPassword.goToLogin')}
              </Link>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#101828]">
                {t('setupPassword.title')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#4a5565]">
                {t('setupPassword.subtitle', { min: MIN_PASSWORD_LENGTH })}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Input
                  type="password"
                  label={t('setupPassword.newPassword')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  label={t('setupPassword.confirmPassword')}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  autoComplete="new-password"
                />

                {error ? (
                  <p className="rounded-2xl border border-[#fecdca] bg-[#fff6ed] px-4 py-3 text-sm text-[#b42318]" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? '...' : t('setupPassword.submit')}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
