'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { publishToast } from '@/lib/toast-bus';
import type { ColumnDef } from '@tanstack/react-table';
import { AdminPanel } from '@/components/admin/admin-surface';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { TableSelect } from '@/components/ui/table-controls';
import { downloadFeedbackCsv, useAdminFeedback, useAdminFeedbackSummary } from '@/lib/api/feedback';
import type {
  FeedbackFilters,
  FeedbackFound,
  FeedbackKarabakh,
  FeedbackListItem,
  FeedbackUsefulness,
} from '@/types/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Preset = 'last30' | 'last90' | 'all' | 'custom';

const USEFULNESS: FeedbackUsefulness[] = ['NOT_AT_ALL', 'SLIGHTLY', 'MODERATELY', 'VERY', 'EXTREMELY'];
const FOUND: FeedbackFound[] = ['YES', 'PARTLY', 'NO'];
const KARABAKH: FeedbackKarabakh[] = ['YES', 'NO', 'PREFER_NOT_TO_SAY'];
const TRUNCATE_AT = 80;

/** Today's calendar date (YYYY-MM-DD) in Asia/Yerevan (UTC+4, no DST). */
function todayInYerevan(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yerevan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function subtractDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

export default function AdminFeedbackPage() {
  const t = useTranslations('adminFeedback');
  const tf = useTranslations('feedback');
  const locale = useLocale();

  const [preset, setPreset] = useState<Preset>('last30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [found, setFound] = useState<FeedbackFound | ''>('');
  const [karabakh, setKarabakh] = useState<FeedbackKarabakh | ''>('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filters: FeedbackFilters = useMemo(() => {
    const today = todayInYerevan();
    let from: string | undefined;
    let to: string | undefined;
    if (preset === 'last30') {
      from = subtractDays(today, 29);
      to = today;
    } else if (preset === 'last90') {
      from = subtractDays(today, 89);
      to = today;
    } else if (preset === 'custom') {
      from = customFrom || undefined;
      to = customTo || undefined;
    }
    return {
      from,
      to,
      found: found || undefined,
      fromKarabakh: karabakh || undefined,
    };
  }, [preset, customFrom, customTo, found, karabakh]);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useAdminFeedbackSummary(filters);
  const { data: list, isLoading: listLoading, isError: listError } = useAdminFeedback({ ...filters, page, perPage });

  const resetPage = () => setPage(1);

  const formatDate = (iso: string) => new Date(iso).toLocaleString(locale === 'hy' ? 'hy-AM' : 'en-GB');

  const columns = useMemo<ColumnDef<FeedbackListItem, unknown>[]>(
    () => [
      {
        id: 'date',
        header: t('date'),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'usefulness',
        header: t('usefulness'),
        cell: ({ row }) => tf(`q1Options.${row.original.usefulness}`),
      },
      {
        id: 'found',
        header: t('found'),
        cell: ({ row }) => tf(`q2Options.${row.original.found}`),
      },
      {
        id: 'lookingFor',
        header: t('lookingFor'),
        cell: ({ row }) => (
          <LookingFor
            id={row.original.id}
            text={row.original.lookingFor}
            expanded={expanded.has(row.original.id)}
            onToggle={() =>
              setExpanded((prev) => {
                const next = new Set(prev);
                if (!next.delete(row.original.id)) next.add(row.original.id);
                return next;
              })
            }
          />
        ),
      },
      {
        id: 'karabakh',
        header: t('karabakh'),
        cell: ({ row }) => tf(`q3Options.${row.original.fromKarabakh}`),
      },
      {
        id: 'language',
        header: t('language'),
        cell: ({ row }) => row.original.locale.toUpperCase(),
      },
      {
        id: 'page',
        header: t('page'),
        cell: ({ row }) => <PageCell item={row.original} deletedLabel={t('deletedService')} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tf, expanded, locale],
  );

  const loading = summaryLoading || listLoading;
  const hasError = !loading && (summaryError || listError);
  const isEmpty = !loading && !hasError && (summary?.total ?? 0) === 0;

  async function handleDownload() {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadFeedbackCsv(filters);
    } catch {
      publishToast({ type: 'error', message: t('downloadError') });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#111827]">{t('title')}</h1>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={exporting}
          className="rounded-xl disabled:cursor-not-allowed disabled:opacity-60 bg-[#E8922D] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#d4801f]"
        >
          {t('downloadCsv')}
        </button>
      </div>

      <AdminPanel className="flex flex-wrap items-end gap-4 p-4">
        <label className="block min-w-[180px] text-sm text-[#374151]">
          <span className="mb-1 block text-xs text-[#6b7280]">{t('period')}</span>
          <TableSelect
            aria-label={t('period')}
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value as Preset);
              resetPage();
            }}
          >
            <option value="last30">{t('last30')}</option>
            <option value="last90">{t('last90')}</option>
            <option value="all">{t('all')}</option>
            <option value="custom">{t('custom')}</option>
          </TableSelect>
        </label>
        {preset === 'custom' ? (
          <>
            <label className="block text-sm text-[#374151]">
              <span className="mb-1 block text-xs text-[#6b7280]">{t('from')}</span>
              <input
                type="date"
                aria-label={t('from')}
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  resetPage();
                }}
                className="admin-control px-3 py-2.5 text-sm text-[#374151]"
              />
            </label>
            <label className="block text-sm text-[#374151]">
              <span className="mb-1 block text-xs text-[#6b7280]">{t('to')}</span>
              <input
                type="date"
                aria-label={t('to')}
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  resetPage();
                }}
                className="admin-control px-3 py-2.5 text-sm text-[#374151]"
              />
            </label>
          </>
        ) : null}
        <label className="block min-w-[180px] text-sm text-[#374151]">
          <span className="mb-1 block text-xs text-[#6b7280]">{t('filterFound')}</span>
          <TableSelect
            aria-label={t('filterFound')}
            value={found}
            onChange={(e) => {
              setFound(e.target.value as FeedbackFound | '');
              resetPage();
            }}
          >
            <option value="">{t('anyAnswer')}</option>
            {FOUND.map((v) => (
              <option key={v} value={v}>
                {tf(`q2Options.${v}`)}
              </option>
            ))}
          </TableSelect>
        </label>
        <label className="block min-w-[180px] text-sm text-[#374151]">
          <span className="mb-1 block text-xs text-[#6b7280]">{t('filterKarabakh')}</span>
          <TableSelect
            aria-label={t('filterKarabakh')}
            value={karabakh}
            onChange={(e) => {
              setKarabakh(e.target.value as FeedbackKarabakh | '');
              resetPage();
            }}
          >
            <option value="">{t('anyAnswer')}</option>
            {KARABAKH.map((v) => (
              <option key={v} value={v}>
                {tf(`q3Options.${v}`)}
              </option>
            ))}
          </TableSelect>
        </label>
      </AdminPanel>

      {hasError ? (
        <AdminPanel className="p-8 text-center text-sm text-[#991b1b]" role="alert">
          {t('loadError')}
        </AdminPanel>
      ) : isEmpty ? (
        <AdminPanel className="p-8 text-center text-sm text-[#6b7280]">{t('empty')}</AdminPanel>
      ) : summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-5 text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-medium">{t('total')}</p>
              <p className="mt-2 text-3xl font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-5 text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-medium">{t('withLookingFor')}</p>
              <p className="mt-2 text-3xl font-semibold">{summary.withLookingFor}</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <ChartPanel
              title={tf('q1')}
              total={summary.total}
              color="#E8922D"
              entries={USEFULNESS.map((v) => ({ label: tf(`q1Options.${v}`), count: summary.usefulness[v] ?? 0 }))}
            />
            <ChartPanel
              title={tf('q2')}
              total={summary.total}
              color="#2f9e8f"
              entries={FOUND.map((v) => ({ label: tf(`q2Options.${v}`), count: summary.found[v] ?? 0 }))}
            />
            <ChartPanel
              title={tf('q3')}
              total={summary.total}
              color="#6b7fd7"
              entries={KARABAKH.map((v) => ({ label: tf(`q3Options.${v}`), count: summary.fromKarabakh[v] ?? 0 }))}
            />
          </section>
        </>
      ) : null}

      {!isEmpty && !hasError ? (
        <AdminPanel>
          <DataTable
            columns={columns}
            data={list?.data ?? []}
            emptyLabel={t('empty')}
            mobileCard={(row) => ({
              eyebrow: formatDate(row.createdAt),
              title: tf(`q1Options.${row.usefulness}`),
              fields: [
                { label: t('found'), value: tf(`q2Options.${row.found}`) },
                {
                  label: t('lookingFor'),
                  value: (
                    <LookingFor
                      id={row.id}
                      text={row.lookingFor}
                      expanded={expanded.has(row.id)}
                      onToggle={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (!next.delete(row.id)) next.add(row.id);
                          return next;
                        })
                      }
                    />
                  ),
                },
                { label: t('karabakh'), value: tf(`q3Options.${row.fromKarabakh}`) },
                { label: t('language'), value: row.locale.toUpperCase() },
                { label: t('page'), value: <PageCell item={row} deletedLabel={t('deletedService')} /> },
              ],
            })}
          />
          {list && list.meta.total > 0 ? (
            <Pagination
              page={list.meta.page}
              totalPages={list.meta.totalPages}
              total={list.meta.total}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          ) : null}
        </AdminPanel>
      ) : null}
    </div>
  );
}

function LookingFor({
  text,
  expanded,
  onToggle,
}: {
  id: string;
  text: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!text) return <span className="text-[#9ca3af]">—</span>;
  if (text.length <= TRUNCATE_AT) return <span>{text}</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="max-w-md whitespace-pre-wrap break-words text-left hover:underline"
    >
      {expanded ? text : `${text.slice(0, TRUNCATE_AT)}…`}
    </button>
  );
}

function PageCell({ item, deletedLabel }: { item: FeedbackListItem; deletedLabel: string }) {
  if (item.service) {
    if (item.service.deleted) {
      return (
        <span className="text-[#6b7280]">
          {item.service.title} ({deletedLabel})
        </span>
      );
    }
    return (
      <Link href={`/admin/services/${item.service.id}`} className="text-[#b45f0a] hover:underline">
        {item.service.title}
      </Link>
    );
  }
  return <span className="break-all">{item.pagePath}</span>;
}

function ChartPanel({
  title,
  entries,
  total,
  color,
}: {
  title: string;
  entries: Array<{ label: string; count: number }>;
  total: number;
  color: string;
}) {
  const labels = entries.map((e) => {
    const pct = total > 0 ? Math.round((e.count / total) * 100) : 0;
    return `${e.label} (${e.count}, ${pct}%)`;
  });
  return (
    <section className="admin-panel p-5">
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      <div className="mt-4">
        <Bar
          data={{ labels, datasets: [{ label: title, data: entries.map((e) => e.count), backgroundColor: color }] }}
          options={{
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
          }}
        />
      </div>
    </section>
  );
}
