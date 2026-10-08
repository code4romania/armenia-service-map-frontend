'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { AdminSidebarMode } from '@/app/(admin)/layout';
import { adminNav } from '@/components/admin/navigation';
import { getActiveNavHref } from '@/lib/navigation/active-nav';

function SectionHeader({
  title,
  open,
  onToggle,
  controlsId,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-full items-center gap-3 px-3 text-sm font-semibold text-[#9ca3af]"
      aria-expanded={open}
      aria-controls={controlsId}
    >
      <span className="flex-1 text-left">{title}</span>
      <svg
        className={`h-3.5 w-3.5 text-[#d1d5db] transition-transform ${open ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}

type AdminSidebarProps = {
  mode: AdminSidebarMode;
  mobileNavOpen: boolean;
  onCloseMobileNav: () => void;
};

function SidebarNav({
  mode,
  pathname,
  openSections,
  onToggleSection,
  onNavigate,
}: {
  mode: AdminSidebarMode;
  pathname: string;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  onNavigate?: () => void;
}) {
  const t = useTranslations('admin.sidebar');
  const isRail = mode === 'rail';
  const items = isRail ? adminNav.flatMap((section) => section.items) : [];
  const activeHref = getActiveNavHref(
    pathname,
    isRail ? items : adminNav.flatMap((section) => section.items),
  );

  if (isRail) {
    return (
      <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-4" aria-label={t('navAriaLabel')}>
        {items.map((item) => {
          const isActive = activeHref === item.href;
          const Icon = item.icon;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              title={label}
              className={`flex h-10 w-10 items-center justify-center border-l-[3px] transition-colors ${
                isActive
                  ? 'border-l-[#E8922D] text-[#E8922D]'
                  : 'border-l-transparent text-[#9ca3af] hover:text-[#374151]'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#E8922D]' : 'text-[#9ca3af]'}`} />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      id={mode === 'drawer' ? 'admin-mobile-navigation' : undefined}
      className="flex-1 overflow-y-auto px-4 pb-6 pt-2"
      aria-label={t('navAriaLabel')}
    >
      {adminNav.map((section, i) => {
        const sectionId = section.id;
        const sectionTitle = section.titleKey ? t(section.titleKey) : undefined;
        const controlsId = sectionId ? `admin-sidebar-section-${sectionId}` : undefined;
        const isOpen = sectionId ? openSections[sectionId] !== false : true;

        return (
          <div key={i} className="py-3">
            {sectionId && sectionTitle ? (
              <SectionHeader
                title={sectionTitle}
                open={isOpen}
                controlsId={controlsId!}
                onToggle={() => onToggleSection(sectionId)}
              />
            ) : null}
            {isOpen ? (
              <div className="flex flex-col gap-1" id={controlsId}>
                {section.items.map((item) => {
                  const isActive = activeHref === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-[#E8922D] text-[#E8922D]'
                          : 'border-l-transparent text-[#374151] hover:text-[#111827]'
                      }`}
                      onClick={onNavigate}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#E8922D]' : 'text-[#9ca3af]'}`} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarPanel({
  mode,
  pathname,
  openSections,
  onToggleSection,
  onCloseMobileNav,
}: {
  mode: AdminSidebarMode;
  pathname: string;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  onCloseMobileNav: () => void;
}) {
  // Shared shell chrome (adminLabel, navigation, closeMenu) lives under admin.topbar by design.
  const t = useTranslations('admin.topbar');
  const isRail = mode === 'rail';

  return (
    <>
      <div className={isRail ? 'border-b border-[#e5e5e5] px-3 pb-4 pt-5' : 'border-b border-[#e5e5e5] px-5 pb-4 pt-5'}>
        {isRail ? (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">A</p>
        ) : (
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">{t('adminLabel')}</p>
        )}
      </div>

      <SidebarNav
        mode={mode}
        pathname={pathname}
        openSections={openSections}
        onToggleSection={onToggleSection}
        onNavigate={mode === 'drawer' ? onCloseMobileNav : undefined}
      />
    </>
  );
}

export function AdminSidebar({ mode, mobileNavOpen, onCloseMobileNav }: AdminSidebarProps) {
  // Shared shell chrome (adminLabel, navigation, closeMenu) lives under admin.topbar by design.
  const t = useTranslations('admin.topbar');
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (mode !== 'drawer' || !mobileNavOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMobileNav();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileNavOpen, mode, onCloseMobileNav]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !(prev[id] !== false) }));
  };

  if (mode === 'drawer') {
    if (!mobileNavOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-40 md:hidden">
        <button
          type="button"
          aria-label={t('closeMenu')}
          className="absolute inset-0 bg-black/20"
          onClick={onCloseMobileNav}
        />
        <aside
          id="admin-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label={t('adminNavigation')}
          className="relative z-10 flex h-full w-[18.5rem] max-w-[85vw] flex-col border-r border-[#e5e5e5] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
            <p className="text-sm font-semibold text-[#111827]">{t('navigation')}</p>
            <button
              type="button"
              onClick={onCloseMobileNav}
              className="text-[#6b7280] transition hover:text-[#111827]"
              aria-label={t('closeMenu')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <SidebarPanel
            mode={mode}
            pathname={pathname}

            openSections={openSections}
            onToggleSection={toggleSection}
            onCloseMobileNav={onCloseMobileNav}
          />
        </aside>
      </div>
    );
  }

  return (
    <aside
      className={
        mode === 'rail'
          ? 'hidden h-screen w-20 shrink-0 flex-col border-r border-[#e5e5e5] bg-white md:flex xl:hidden'
          : 'hidden h-screen w-80 shrink-0 flex-col border-r border-[#e5e5e5] bg-white xl:flex'
      }
    >
      <SidebarPanel
        mode={mode}
        pathname={pathname}
        openSections={openSections}
        onToggleSection={toggleSection}
        onCloseMobileNav={onCloseMobileNav}
      />
    </aside>
  );
}
