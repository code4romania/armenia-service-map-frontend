'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  useAllSearches,
  useFilterHeatmap,
  useLeastUsedFilters,
  useMostUsedFilters,
  useOverviewStats,
  useSearchFrequency,
  useTopQueries,
  useZeroResultQueries,
} from '@/lib/api/analytics';
import { AnalyticsLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useRegionName } from '@/lib/i18n/region-name';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const regionName = useRegionName();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [search, setSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useOverviewStats();
  const { data: topQueries, isLoading: topLoading } = useTopQueries(8);
  const { data: zeroQueries, isLoading: zeroLoading } = useZeroResultQueries(8);
  const { data: frequency, isLoading: frequencyLoading } = useSearchFrequency('day', 30);
  const { data: allSearches, isLoading: allSearchesLoading } = useAllSearches({
    page,
    perPage,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search,
  });
  const { data: mostUsedFilters, isLoading: mostUsedLoading } = useMostUsedFilters(8);
  const { data: leastUsedFilters, isLoading: leastUsedLoading } = useLeastUsedFilters(8);
  const { data: heatmapData, isLoading: heatmapLoading } = useFilterHeatmap();

  const loading =
    overviewLoading ||
    topLoading ||
    zeroLoading ||
    frequencyLoading ||
    allSearchesLoading ||
    mostUsedLoading ||
    leastUsedLoading ||
    heatmapLoading;

  const lineData = useMemo(() => {
    const labels = frequency?.map((item) => new Date(item.bucketStart).toLocaleDateString()) ?? [];
    const values = frequency?.map((item) => item.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: t('searchesLegend'),
          data: values,
          borderColor: '#d6761e',
          backgroundColor: '#f7c58f',
          pointBackgroundColor: '#c35e10',
          tension: 0.35,
        },
      ],
    };
  }, [frequency, t]);

  const heatmapLookup = useMemo(() => {
    const map = new Map<string, number>();
    (heatmapData?.matrix ?? []).forEach((entry) => {
      map.set(`${entry.topicId}:${entry.regionId}`, entry.count);
    });
    return map;
  }, [heatmapData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <AnalyticsLoadingSkeleton />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard title={t('totalSearches')} value={overview?.totalSearches ?? 0} tone="amber" />
            <StatCard title={t('totalUniqueSearches')} value={overview?.totalUniqueSearches ?? 0} tone="teal" />
            <StatCard title={t('zeroResultSearches')} value={overview?.totalZeroResultSearches ?? 0} tone="rose" />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Panel title={t('topQueries')} subtitle={t('topQueriesSubtitle')}>
              <QueryList rows={topQueries ?? []} empty={t('noSearches')} />
            </Panel>
            <Panel title={t('zeroResultQueries')} subtitle={t('zeroResultQueriesSubtitle')}>
              <QueryList rows={zeroQueries ?? []} empty={t('noZeroResults')} danger />
            </Panel>
            <Panel title={t('searchTrend')} subtitle={t('searchTrendSubtitle')}>
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </Panel>
          </section>

          <section className="admin-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f0] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">{t('allSearches')}</h2>
                <p className="text-xs text-[#6b7280]">{t('allSearchesSubtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="rounded-xl border border-[#d1d5db] px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#E8922D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const rows =
                      allSearches?.data.map((item) => ({
                        date: new Date(item.createdAt).toISOString(),
                        query: item.query,
                        resultsCount: item.resultsCount,
                      })) ?? [];
                    downloadCsv('analytics-searches.csv', rows);
                  }}
                  className="rounded-xl bg-[#E8922D] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#d4801f]"
                >
                  {t('downloadCsv')}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0f0] bg-white text-left text-[#6b7280]">
                    <th className="px-5 py-3 font-medium">{t('dateColumn')}</th>
                    <th className="px-5 py-3 font-medium">{t('queryColumn')}</th>
                    <th className="px-5 py-3 font-medium">{t('resultsColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allSearches?.data.map((item) => (
                    <tr key={item.id} className="border-b border-[#f0f0f0] text-[#374151]">
                      <td className="px-5 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3">{item.query}</td>
                      <td className="px-5 py-3">{item.resultsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allSearches ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-[#6b7280]">
                <span>
                  {t('pageInfo', {
                    page: allSearches.meta.page,
                    totalPages: allSearches.meta.totalPages,
                    total: allSearches.meta.total,
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={allSearches.meta.page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg border border-[#d1d5db] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('prev')}
                  </button>
                  <button
                    type="button"
                    disabled={allSearches.meta.page >= allSearches.meta.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-lg border border-[#d1d5db] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('next')}
                  </button>
                  <select
                    value={perPage}
                    onChange={(event) => {
                      setPerPage(Number(event.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-[#d1d5db] px-2 py-1 text-xs"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title={t('mostUsedFilters')} subtitle={t('mostUsedFiltersSubtitle')}>
              <Bar
                data={{
                  labels: [
                    ...(mostUsedFilters?.regionUsage.map((item) => t('regionLabel', { name: regionName({ name: item.regionName, svgPathId: item.svgPathId }) })) ?? []),
                    ...(mostUsedFilters?.topicUsage.map((item) => t('topicLabel', { name: item.topicName })) ?? []),
                  ],
                  datasets: [
                    {
                      label: t('usageCountLegend'),
                      data: [
                        ...(mostUsedFilters?.regionUsage.map((item) => item.count) ?? []),
                        ...(mostUsedFilters?.topicUsage.map((item) => item.count) ?? []),
                      ],
                      backgroundColor: '#f3a44f',
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </Panel>

            <Panel title={t('leastUsedFilters')} subtitle={t('leastUsedFiltersSubtitle')}>
              <Bar
                data={{
                  labels: [
                    ...(leastUsedFilters?.regionUsage.map((item) => t('regionLabel', { name: regionName({ name: item.regionName, svgPathId: item.svgPathId }) })) ?? []),
                    ...(leastUsedFilters?.topicUsage.map((item) => t('topicLabel', { name: item.topicName })) ?? []),
                  ],
                  datasets: [
                    {
                      label: t('usageCountLegend'),
                      data: [
                        ...(leastUsedFilters?.regionUsage.map((item) => item.count) ?? []),
                        ...(leastUsedFilters?.topicUsage.map((item) => item.count) ?? []),
                      ],
                      backgroundColor: '#ddb78a',
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </Panel>
          </section>

          <section className="admin-panel p-5">
            <h2 className="text-lg font-semibold text-[#111827]">{t('filterHeatmap')}</h2>
            <p className="mt-1 text-xs text-[#6b7280]">{t('filterHeatmapSubtitle')}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-[#6b7280]">{t('heatmapCorner')}</th>
                    {heatmapData?.regions.map((region) => (
                      <th key={region.id} className="px-2 py-1 text-left text-[#6b7280]">
                        {regionName(region)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData?.topics.map((topic) => (
                    <tr key={topic.id}>
                      <td className="px-2 py-1 font-medium text-[#374151]">{topic.name}</td>
                      {heatmapData.regions.map((region) => {
                        const count = heatmapLookup.get(`${topic.id}:${region.id}`) ?? 0;
                        const intensity = Math.min(count / 10, 1);
                        const background = `rgba(232, 124, 21, ${0.08 + intensity * 0.42})`;
                        return (
                          <td
                            key={`${topic.id}:${region.id}`}
                            className="rounded px-2 py-1 text-center text-[#374151]"
                            style={{ background }}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number; tone: 'amber' | 'teal' | 'rose' }) {
  return (
    <div className="rounded-xl border border-[#e8e8e8] bg-white p-5 text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="admin-panel p-5">
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      <p className="mt-1 text-xs text-[#6b7280]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QueryList({
  rows,
  empty,
  danger = false,
}: {
  rows: Array<{ query: string; count: number }>;
  empty: string;
  danger?: boolean;
}) {
  if (!rows.length) {
    return <p className="text-sm text-[#6b7280]">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((item) => (
        <div
          key={item.query}
          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
            danger ? 'border-[#f3d0d6] bg-[#fff1f2]' : 'border-[#e8e8e8] bg-white'
          }`}
        >
          <span className="truncate text-[#374151]">{item.query}</span>
          <span className={`ml-2 font-semibold ${danger ? 'text-[#be123c]' : 'text-[#111827]'}`}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}
