'use client';

import Link from 'next/link';

export type AdminTab<T extends string> = {
  id: T;
  label: string;
  /** Present when the tab is its own route (rendered as a link); absent for in-page tabs. */
  href?: string;
  /** For in-page tabs: id of the panel this tab controls. */
  controlsId?: string;
};

type AdminTabsProps<T extends string> = {
  tabs: Array<AdminTab<T>>;
  active: T;
  ariaLabel: string;
  /** Required for in-page tabs; ignored when every tab has an `href`. */
  onChange?: (next: T) => void;
  className?: string;
};

const containerClass = 'admin-toolbar mt-4 flex gap-1 p-1.5';
const tabClass = (isActive: boolean) =>
  `rounded-xl border border-transparent px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'border-[#E8922D] bg-white text-[#E8922D]' : 'text-[#6b7280] hover:text-[#374151]'
  }`;

/**
 * The admin pill tab bar. Two flavours share one look:
 * - in-page tabs (`onChange`), e.g. an organisation's Details / Users sections;
 * - route tabs (`href`), e.g. Users management's Organisations / Admin users lists.
 */
export function AdminTabs<T extends string>({ tabs, active, ariaLabel, onChange, className = '' }: AdminTabsProps<T>) {
  const asLinks = tabs.every((tab) => tab.href);

  if (asLinks) {
    return (
      <nav className={`${containerClass} ${className}`} style={{ width: 'fit-content' }} aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href!}
              aria-current={isActive ? 'page' : undefined}
              className={tabClass(isActive)}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={`${containerClass} ${className}`} style={{ width: 'fit-content' }} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={tab.controlsId}
            onClick={() => onChange?.(tab.id)}
            className={tabClass(isActive)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
