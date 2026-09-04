'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const profile = await login({ email, password });
      router.push(profile.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/org/dashboard');
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_48%,#f9fafb_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid gap-8 overflow-hidden rounded-[32px] border border-[#dbe4f0] bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="flex items-center px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="w-full max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#155dfc]">
                {t('loginEyebrow')}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#101828]">
                {t('loginTitle')}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#4a5565]">
                {t('loginSubtitle')}
              </p>

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

                <Input
                  type="password"
                  label={t('password')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={t('password')}
                />

                {error ? (
                  <p className="rounded-2xl border border-[#fecdca] bg-[#fff6ed] px-4 py-3 text-sm text-[#b42318]" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? '...' : t('loginButton')}
                  </Button>
                  <Link href="/forgot-password" className="text-sm font-medium text-[#155dfc] hover:underline">
                    {t('forgotPasswordLink')}
                  </Link>
                </div>
              </form>
            </div>
          </div>

          <div className="relative min-h-[320px] border-t border-[#dbe4f0] lg:min-h-[100%] lg:border-l lg:border-t-0">
            <Image
              src="/hero-support.jpg"
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,37,64,0.18)_0%,rgba(8,47,73,0.68)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
              <div className="max-w-md rounded-[28px] border border-white/20 bg-white/12 p-6 text-white backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
                  RefugeeSupport.am
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  {t('loginPanelTitle')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/86">
                  {t('loginPanelBody')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
