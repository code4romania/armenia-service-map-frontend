'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/auth-context';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';

const segmentLabelKey: Record<string, string> = {
  org: 'dashboard',
  dashboard: 'dashboard',
  services: 'services',
  needs: 'needs',
  map: 'needsMap',
  profile: 'profile',
  account: 'account',
};

export function OrgTopbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations('org.topbar');
  const tCrumbs = useTranslations('org.breadcrumbs');

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const usable = segments.slice(1);
    return usable.map((segment) => {
      const key = segmentLabelKey[segment];
      return key ? tCrumbs(key) : segment;
    });
  }, [pathname, tCrumbs]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#f0f0f0] bg-white px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <nav aria-label={t('breadcrumbAria')} className="flex min-w-0 items-center gap-2 text-sm text-[#6b7280]">
          {breadcrumbs.map((label, index) => (
            <Fragment key={`${label}-${index}`}>
              {index > 0 ? <ChevronRightIcon className="h-4 w-4 text-[#d1d5db]" /> : null}
              <span className={index === breadcrumbs.length - 1 ? 'truncate font-semibold text-[#111827]' : 'truncate'}>
                {label}
              </span>
            </Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/org/account"
            aria-label={t('account')}
            title={t('account')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-semibold text-white transition hover:bg-[#333]"
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-[#6b7280] transition hover:text-[#111827]"
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
