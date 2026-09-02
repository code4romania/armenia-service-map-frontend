'use client';

import { useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Shown when nothing is selected. */
  placeholder: string;
  /** Label for the trigger when some options are selected. */
  selectedLabel: (count: number) => string;
  /** When both labels are given, a "select all / clear" row is rendered above the options. */
  selectAllLabel?: string;
  clearAllLabel?: string;
  className?: string;
  /** Classes applied to the trigger button (border, padding, focus ring). */
  triggerClassName?: string;
  /** Classes applied to the checkbox inputs (e.g. `accent-*`). */
  checkboxClassName?: string;
  /** Classes applied to the select-all / clear button. */
  bulkActionClassName?: string;
  placeholderClassName?: string;
  chevron?: React.ReactNode;
  'aria-label'?: string;
}

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  selectedLabel,
  selectAllLabel,
  clearAllLabel,
  className,
  triggerClassName,
  checkboxClassName,
  bulkActionClassName,
  placeholderClassName = 'text-[#94a3b8]',
  chevron,
  'aria-label': ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  const allSelected = options.length > 0 && options.every((option) => selected.includes(option.value));
  const showBulkAction = Boolean(selectAllLabel && clearAllLabel) && options.length > 0;
  const triggerLabel = selected.length === 0 ? placeholder : selectedLabel(selected.length);

  return (
    <div ref={containerRef} className={joinClasses('relative w-full', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={joinClasses('flex w-full items-center justify-between text-left', triggerClassName)}
      >
        <span className={joinClasses('truncate', selected.length === 0 ? placeholderClassName : undefined)}>{triggerLabel}</span>
      </button>
      {chevron}
      {open ? (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#e8e8e8] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)]"
        >
          {showBulkAction ? (
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : options.map((option) => option.value))}
              className={joinClasses(
                'mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-[#f5f5f4]',
                bulkActionClassName,
              )}
            >
              {allSelected ? clearAllLabel : selectAllLabel}
            </button>
          ) : null}
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-[#9ca3af]">{placeholder}</p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#374151] hover:bg-[#f5f5f4]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className={checkboxClassName}
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
