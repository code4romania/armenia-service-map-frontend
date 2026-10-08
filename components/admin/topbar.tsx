'use client';

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bars3Icon,
  BellIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/auth-context';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/lib/api/notifications';
import { adminBreadcrumbKeys } from '@/components/admin/navigation';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';

function relativeDescriptor(dateString: string): { key: 'justNow' | 'minutesAgo' | 'hoursAgo' | 'daysAgo'; count: number } {
  const date = new Date(dateString).getTime();
  const diffMs = Date.now() - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return { key: 'justNow', count: 0 };
  if (diffMins < 60) return { key: 'minutesAgo', count: diffMins };
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { key: 'hoursAgo', count: diffHours };
  const diffDays = Math.floor(diffHours / 24);
  return { key: 'daysAgo', count: diffDays };
}

type AdminTopbarProps = {
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  showMobileNavTrigger: boolean;
};

export function AdminTopbar({ mobileNavOpen, onToggleMobileNav, showMobileNavTrigger }: AdminTopbarProps) {
  const t = useTranslations('admin.topbar');
  const tBreadcrumb = useTranslations('admin.breadcrumbs');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const { data: notifications } = useNotifications(1, 8);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsMenuId = useId();
  const profileMenuId = useId();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const usable = segments.slice(1);
    return usable.map((segment) => {
      const key = adminBreadcrumbKeys[segment];
      return key ? tBreadcrumb(key) : segment;
    });
  }, [pathname, tBreadcrumb]);

  const unreadCount = unreadData?.unreadCount ?? 0;

  function formatRelative(dateString: string) {
    const { key, count } = relativeDescriptor(dateString);
    return t(key, { count });
  }

  function getNeedReportIdFromNotification(item: { metadata?: Record<string, unknown> | null }) {
    const needReportId = item.metadata?.needReportId;
    return typeof needReportId === 'string' && needReportId.length > 0 ? needReportId : null;
  }

  function getNotificationRoute(item: { metadata?: Record<string, unknown> | null }) {
    const route = item.metadata?.route;
    if (typeof route === 'string' && route.startsWith('/')) {
      return route;
    }

    const redirectTo = item.metadata?.redirectTo;
    if (typeof redirectTo === 'string' && redirectTo.length > 0) {
      const normalized = redirectTo.replace(/^\/+/, '');
      if (normalized.startsWith('organizations/')) {
        return `/admin/organisations/${normalized.replace('organizations/', '')}`;
      }
      if (normalized.startsWith('organisations/')) {
        return `/admin/organisations/${normalized.replace('organisations/', '')}`;
      }
      return `/${normalized}`;
    }

    return null;
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-[#f0f0f0] bg-[#f7f9fc]/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {showMobileNavTrigger ? (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="text-[#6b7280] transition hover:text-[#111827] md:hidden"
              aria-label={mobileNavOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-navigation"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          ) : null}

          <nav aria-label={t('breadcrumb')} className="flex min-w-0 items-center gap-2 text-sm text-[#6b7280]">
            {breadcrumbs.map((label, index) => (
              <Fragment key={`${label}-${index}`}>
                {index > 0 ? <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#d1d5db]" /> : null}
                <span className={index === breadcrumbs.length - 1 ? 'truncate font-semibold text-[#111827]' : 'truncate'}>
                  {label}
                </span>
              </Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className="relative p-2 text-[#6b7280] transition hover:text-[#111827]"
              aria-label={notificationsOpen ? t('closeNotifications') : t('openNotifications')}
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              aria-controls={notificationsMenuId}
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8922D] px-1 text-xs font-semibold text-white">
                  {Math.min(unreadCount, 99)}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div
                id={notificationsMenuId}
                role="menu"
                aria-label={t('notificationsMenu')}
                className="absolute right-0 mt-2 w-96 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#111827]">{t('notifications')}</p>
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="text-xs font-medium text-[#E8922D] hover:text-[#d4801f]"
                    role="menuitem"
                  >
                    {t('markAllRead')}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications?.data.length ? (
                    notifications.data.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (!item.readAt) markRead.mutate(item.id);
                          const needReportId = getNeedReportIdFromNotification(item);
                          if (needReportId) {
                            setNotificationsOpen(false);
                            router.push(`/admin/needs/${needReportId}`);
                            return;
                          }
                          const targetRoute = getNotificationRoute(item);
                          if (targetRoute) {
                            setNotificationsOpen(false);
                            router.push(targetRoute);
                          }
                        }}
                        role="menuitem"
                        aria-label={item.readAt ? t('readNotification', { title: item.title }) : t('unreadNotification', { title: item.title })}
                        className={`w-full border-b border-[#f0f0f0] px-4 py-3 text-left transition hover:bg-[#fafafa] ${
                          item.readAt ? 'bg-white' : 'bg-[#fafafa]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#111827]">{item.title}</p>
                        <p className="mt-1 text-xs text-[#6b7280]">{item.message}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-[#9ca3af]">
                          {formatRelative(item.createdAt)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-[#6b7280]">{t('noNotifications')}</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-semibold text-white transition hover:bg-[#333]"
              aria-label={profileOpen ? t('closeProfile') : t('openProfile')}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-controls={profileMenuId}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </button>
            {profileOpen ? (
              <div
                id={profileMenuId}
                role="menu"
                aria-label={t('profileMenu')}
                className="absolute right-0 mt-2 w-56 rounded-lg border border-[#e5e5e5] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                <div className="rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold text-[#111827]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-[#6b7280]">{user?.email}</p>
                </div>
                <Link
                  href="/admin/dashboard"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#374151] hover:bg-[#fafafa]"
                  onClick={() => setProfileOpen(false)}
                >
                  <CheckIcon className="h-4 w-4" />
                  {t('goToDashboard')}
                </Link>
                <Link
                  href="/admin/account"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#374151] hover:bg-[#fafafa]"
                  onClick={() => setProfileOpen(false)}
                >
                  <UserCircleIcon className="h-4 w-4" />
                  {t('account')}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#dc2626] hover:bg-[#fef2f2]"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {t('signOut')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
