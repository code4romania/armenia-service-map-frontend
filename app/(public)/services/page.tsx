'use client';

import { Suspense, useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArmeniaMap } from '@/components/shared/armenia-map';
import { Pagination } from '@/components/admin/pagination';
import { NeedCtaBanner } from '@/components/public/need-cta-banner';
import { SubscribeNotifyCard } from '@/components/public/subscribe-notify-card';
import { OverflowChipRow } from '@/components/ui/overflow-chip-row';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { sendPublicSearchLogBatchBeacon, useLogPublicSearchBatch } from '@/lib/api/analytics';
import { usePublicRegionServiceCounts, usePublicRegions, usePublicServices, usePublicTopics } from '@/lib/api/services';
import { useRegionName } from '@/lib/i18n/region-name';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { serviceOrgName } from '@/lib/services/org-name';
import type { PaginatedResponse, Service } from '@/types/api';
import { SITE_URL } from '@/lib/site';

type ViewMode = 'list' | 'map';
type QueuedSearchLog = {
  query: string;
  regionId: string | null;
  topicIds: string[];
  resultsCount: number;
};

const SEARCH_LOG_QUEUE_STORAGE_KEY = 'public-search-log-queue';
const SEARCH_LOG_DEBOUNCE_MS = 5000;
const SEARCH_LOG_FLUSH_MS = 20000;
const SEARCH_LOG_MAX_QUEUE_SIZE = 100;
const SEARCH_LOG_FLUSH_THRESHOLD = 10;

export default function PublicServicesPage() {
  return (
    <Suspense fallback={<ServicesPageSkeleton />}>
      <ServicesContent />
    </Suspense>
  );
}

function ServicesContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('services');
  const tHome = useTranslations('home');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  const [view, setView] = useState<ViewMode>('map');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedTopicId, setSelectedTopicId] = useState(searchParams.get('topicId') || '');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState(searchParams.get('regionId') || '');
  const [onlyAvailable, setOnlyAvailable] = useState(searchParams.get('available') === 'true');
  const [analyticsQueue, setAnalyticsQueue] = useState<QueuedSearchLog[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const storedQueue = window.localStorage.getItem(SEARCH_LOG_QUEUE_STORAGE_KEY);
    if (!storedQueue) {
      return [];
    }

    try {
      const parsedQueue = JSON.parse(storedQueue) as QueuedSearchLog[];
      return Array.isArray(parsedQueue) ? parsedQueue : [];
    } catch {
      window.localStorage.removeItem(SEARCH_LOG_QUEUE_STORAGE_KEY);
      return [];
    }
  });
  const lastQueuedSnapshotRef = useRef<string | null>(null);
  const queueRef = useRef<QueuedSearchLog[]>([]);
  const isFlushingRef = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToAnchor = (ref: React.RefObject<HTMLDivElement | null>) => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // The site header is sticky and its height varies by breakpoint (the partner
    // bar wraps on mobile), so measure it instead of using a fixed offset.
    const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const gap = 16;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - gap;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const { data: topics } = usePublicTopics();
  const { data: regions } = usePublicRegions();
  const regionName = useRegionName();
  const { data: regionServiceCounts } = usePublicRegionServiceCounts();
  const logPublicSearchBatch = useLogPublicSearchBatch();
  const trimmedSearch = search.trim();
  // Union of the selected parent topic and its selected subtopic (a service matches either).
  const activeTopicIds = [selectedTopicId, selectedSubtopicId].filter(Boolean);
  const { data, isLoading } = usePublicServices({
    page,
    perPage,
    search: trimmedSearch,
    topicIds: activeTopicIds.length ? activeTopicIds.join(',') : undefined,
    regionId: selectedRegionId || undefined,
    isAvailable: onlyAvailable || undefined,
  });

  // Subtopics of the currently selected parent (only shown once a parent is picked).
  const subtopics = selectedTopicId
    ? topics?.find((topic) => topic.id === selectedTopicId)?.children ?? []
    : [];
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    queueRef.current = analyticsQueue;

    if (typeof window === 'undefined') {
      return;
    }

    if (!analyticsQueue.length) {
      window.localStorage.removeItem(SEARCH_LOG_QUEUE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SEARCH_LOG_QUEUE_STORAGE_KEY, JSON.stringify(analyticsQueue));
  }, [analyticsQueue]);

  useEffect(() => {
    if (isLoading || !data) {
      return;
    }

    const hasIntent = Boolean(trimmedSearch || selectedRegionId || selectedTopicId || onlyAvailable);
    if (!hasIntent) {
      lastQueuedSnapshotRef.current = null;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextEvent: QueuedSearchLog = {
        query: trimmedSearch,
        regionId: selectedRegionId || null,
        topicIds: [selectedTopicId, selectedSubtopicId].filter(Boolean),
        resultsCount: data.meta.total,
      };
      const snapshotKey = JSON.stringify(nextEvent);
      if (snapshotKey === lastQueuedSnapshotRef.current) {
        return;
      }

      lastQueuedSnapshotRef.current = snapshotKey;
      setAnalyticsQueue((current) => [...current, nextEvent].slice(-SEARCH_LOG_MAX_QUEUE_SIZE));
    }, SEARCH_LOG_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedSearch, selectedRegionId, selectedTopicId, selectedSubtopicId, onlyAvailable, data, isLoading]);

  const flushQueue = useEffectEvent((preferBeacon = false) => {
    const currentQueue = queueRef.current;
    if (!currentQueue.length || isFlushingRef.current) {
      return;
    }

    const payload = { events: currentQueue };

    if (preferBeacon && sendPublicSearchLogBatchBeacon(currentQueue)) {
      setAnalyticsQueue((existingQueue) => existingQueue.slice(currentQueue.length));
      return;
    }

    isFlushingRef.current = true;
    logPublicSearchBatch.mutate(payload, {
      onSuccess: () => {
        setAnalyticsQueue((existingQueue) => existingQueue.slice(currentQueue.length));
      },
      onSettled: () => {
        isFlushingRef.current = false;
      },
    });
  });

  useEffect(() => {
    if (analyticsQueue.length < SEARCH_LOG_FLUSH_THRESHOLD) {
      return;
    }

    flushQueue();
  }, [analyticsQueue]);

  useEffect(() => {
    if (!analyticsQueue.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      flushQueue();
    }, SEARCH_LOG_FLUSH_MS);

    return () => window.clearTimeout(timeoutId);
  }, [analyticsQueue]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushQueue();
      }
    };

    const handlePageHide = () => {
      flushQueue(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [analyticsQueue]);

  const hasActiveFilters = Boolean(trimmedSearch || selectedRegionId || selectedTopicId || selectedSubtopicId || onlyAvailable);
  const handleClearFilters = () => {
    setSearch('');
    setSelectedTopicId('');
    setSelectedSubtopicId('');
    setSelectedRegionId('');
    setOnlyAvailable(false);
    setPage(1);
  };

  // In map view the list is a separate block from the (sticky) map, so we land on
  // the list itself; in list view the results region top already is the list.
  const scrollToPaginationTarget = () => scrollToAnchor(view === 'map' ? listRef : resultsRef);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    scrollToPaginationTarget();
  };

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
    scrollToPaginationTarget();
  };

  const handleRegionClick = (svgPathId: string) => {
    const region = regions?.find((entry) => entry.svgPathId === svgPathId);
    setSelectedRegionId(region?.id === selectedRegionId ? '' : (region?.id || ''));
    setPage(1);
    scrollToAnchor(listRef);
  };

  const totalServices = data?.meta.total ?? 0;
  const selectedRegion = regions?.find((region) => region.id === selectedRegionId);
  const selectedRegionName = selectedRegion ? regionName(selectedRegion) : undefined;
  const selectedTopicName = topics?.find((topic) => topic.id === selectedTopicId)?.name;
  const servicesJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'RefugeeSupport Services',
    itemListElement:
      data?.data.map((service, index) => {
        const content = getLocalizedServiceContent(service, locale);
        return {
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/services/${service.id}`,
          name: content.title,
        };
      }) ?? [],
  });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: servicesJsonLd }} />
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-[#6a7282]">
          <Link href="/" className="hover:text-[#155dfc]">{tNav('home')}</Link>
          <span>/</span>
          <span className="text-[#101828]">{t('title')}</span>
        </div>

        <h1 className="text-4xl font-bold text-[#101828]">{t('title')}</h1>
        <p className="mt-3 max-w-4xl text-lg leading-7 text-[#4a5565]">{t('subtitle')}</p>
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
              <MapPinIcon />
              <select
                value={selectedRegionId}
                onChange={(event) => {
                  setSelectedRegionId(event.target.value);
                  setPage(1);
                }}
                aria-label={t('allRegions')}
                className="flex-1 bg-transparent text-[#364153] outline-none"
              >
                <option value="">{t('allRegions')}</option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>{regionName(region)}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="flex-1 bg-transparent text-[#364153] outline-none placeholder:text-[#6a7282]"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#364153]">
              <FilterIcon />
              {t('filterByTopic')}
            </div>
            <div className="flex flex-wrap gap-2">
              {topics?.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={selectedTopicId === topic.id}
                  onClick={() => {
                    setSelectedTopicId((current) => (current === topic.id ? '' : topic.id));
                    setSelectedSubtopicId('');
                    setPage(1);
                  }}
                  className={`rounded-[10px] border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedTopicId === topic.id
                      ? 'border-[#155dfc] bg-[#eff6ff] text-[#155dfc]'
                      : 'border-[#d1d5db] bg-white text-[#364153] hover:border-[#9ca3af]'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>

            {subtopics.length > 0 ? (
              <div className="relative mt-2 border-t border-[#eef1f5] pt-3">
                <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-[#8a94a6]">
                  {t('refineWithin', { topic: selectedTopicName ?? '' })}
                </p>
                <OverflowChipRow
                  items={subtopics}
                  getKey={(subtopic) => subtopic.id}
                  maxRows={isDesktop ? 1 : 2}
                  moreLabel={(hidden) => t('moreSubtopics', { count: hidden })}
                  lessLabel={t('showLess')}
                  renderChip={(subtopic) => (
                    <button
                      type="button"
                      aria-pressed={selectedSubtopicId === subtopic.id}
                      onClick={() => {
                        setSelectedSubtopicId((current) => (current === subtopic.id ? '' : subtopic.id));
                        setPage(1);
                      }}
                      className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
                        selectedSubtopicId === subtopic.id
                          ? 'border-[#155dfc] bg-[#eff6ff] text-[#155dfc]'
                          : 'border-[#e5e7eb] bg-[#f9fafb] text-[#6a7282] hover:border-[#c3cad6] hover:text-[#364153]'
                      }`}
                    >
                      {subtopic.name}
                    </button>
                  )}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-[#e5e7eb] pt-4 md:flex-row md:items-center md:justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-[#364153]">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(event) => {
                  setOnlyAvailable(event.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-[#9ca3af] text-[#155dfc] focus:ring-[#155dfc]"
                aria-label={t('onlyAvailable')}
              />
              {t('onlyAvailable')}
            </label>

            <div className="flex items-center justify-between gap-4 md:justify-end">
              <p className="text-sm text-[#4a5565]">
                <span className="font-bold">{totalServices}</span> {t('servicesFound')}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label={t('list')}
                  aria-pressed={view === 'list'}
                  className={`inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
                    view === 'list' ? 'bg-[#155dfc] text-white' : 'bg-[#f3f4f6] text-[#364153]'
                  }`}
                >
                  <ListIcon />
                  {t('list')}
                </button>
                <button
                  type="button"
                  onClick={() => setView('map')}
                  aria-label={t('map')}
                  aria-pressed={view === 'map'}
                  className={`inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
                    view === 'map' ? 'bg-[#155dfc] text-white' : 'bg-[#f3f4f6] text-[#364153]'
                  }`}
                >
                  <MapIcon />
                  {t('map')}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollToAnchor(listRef)}
            className="mt-4 w-full rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1247cc] md:hidden"
          >
            {t('viewResults', { count: totalServices })}
          </button>
        </div>
      </div>

      <div ref={resultsRef} className="mx-auto max-w-7xl px-6 py-8">
        {view === 'map' ? (
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex flex-col gap-4 lg:w-3/5 lg:self-start lg:sticky lg:top-24">
              <div
                className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-lg"
                style={{ background: 'linear-gradient(134deg, #eff6ff 0%, #eef2ff 50%, #dbeafe 100%)' }}
              >
                <ArmeniaMap
                  regionCounts={regionServiceCounts || {}}
                  selectedRegionId={regions?.find((region) => region.id === selectedRegionId)?.svgPathId}
                  countLabelSingular={t('serviceSingular')}
                  countLabelPlural={t('servicePlural')}
                  onRegionClick={handleRegionClick}
                />
              </div>

              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-lg">
                <h4 className="text-sm font-bold text-[#101828]">{t('mapLegendTitle')}</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <LegendItem color="bg-[#51a2ff]" label={t('legendWithServices')} opacity="opacity-70" />
                  <LegendItem color="bg-[#155dfc]" label={t('legendSelected')} opacity="opacity-90" />
                  <LegendItem color="bg-[#d1d5dc]" label={t('legendWithoutServices')} opacity="opacity-50" />
                </div>
              </div>
            </div>

            <div ref={listRef} className="lg:w-2/5">
              <h3 className="mb-4 text-lg font-semibold text-[#101828]">
                {selectedRegionName
                  ? t('regionalServicesTitle', { region: selectedRegionName, count: totalServices })
                  : t('nationwideServices')}
              </h3>
              <ServiceList
                data={data}
                isLoading={isLoading}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        ) : (
          <div ref={listRef}>
            <ServiceList
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {data && data.meta.totalPages > 1 ? (
          <div className="mt-7">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              perPage={data.meta.perPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </div>
        ) : null}
      </div>

      <SubscribeNotifyCard
        regionId={selectedRegionId || undefined}
        regionName={selectedRegionName}
        topicId={selectedTopicId || undefined}
        topicName={selectedTopicName}
      />

      <NeedCtaBanner
        title={tHome('ctaTitle')}
        subtitle={tHome('ctaSubtitle')}
        buttonLabel={tHome('reportNeed')}
      />
    </div>
  );
}

function ServiceList({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: {
  data: PaginatedResponse<Service> | undefined;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const t = useTranslations('services');

  if (isLoading) {
    return <ServiceCardSkeleton />;
  }

  if (!data || data.data.length === 0) {
    if (hasActiveFilters) {
      return <EmptyResultsCta onClearFilters={onClearFilters} />;
    }

    return <p className="py-12 text-center text-[#6a7282]">{t('noResults')}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.data.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}

function EmptyResultsCta({ onClearFilters }: { onClearFilters: () => void }) {
  const t = useTranslations('services');
  const tHome = useTranslations('home');

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl bg-gradient-to-r from-[#155dfc] to-[#4f39f6] px-6 py-10 text-center shadow-lg">
      <div>
        <h3 className="text-2xl font-bold text-white">{tHome('ctaTitle')}</h3>
        <p className="mx-auto mt-2 max-w-md text-base text-[#dbeafe]">{tHome('ctaSubtitle')}</p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/report-a-need"
          className="inline-flex items-center justify-center rounded-[14px] bg-white px-6 py-2.5 text-sm font-semibold text-[#155dfc] shadow-lg transition-colors hover:bg-[#f8fafc]"
        >
          {tHome('reportNeed')}
        </Link>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center justify-center rounded-[14px] border border-white/70 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          {t('clearFilters')}
        </button>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const t = useTranslations('services');
  const locale = useLocale();
  const badgeTopics = service.topics.slice(0, 3);
  const content = getLocalizedServiceContent(service, locale);

  return (
    <article className="relative rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#155dfc]/40 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#6a7282]">
            <MapPinIcon />
            {serviceOrgName(service)}
          </div>
          <h3 className="mt-2 text-xl font-bold text-[#101828]">{content.title}</h3>
        </div>

        {service.availabilityState === 'AVAILABLE' ? (
          <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">{t('available')}</span>
        ) : service.availabilityState === 'AVAILABLE_SOON' ? (
          <span className="rounded-full bg-[#fef9c3] px-3 py-1 text-xs font-semibold text-[#854d0e]">{t('availableSoon')}</span>
        ) : (
          <span className="rounded-full bg-[#fee2e2] px-3 py-1 text-xs font-semibold text-[#b91c1c]">{t('unavailable')}</span>
        )}
      </div>

      <p className="mt-4 text-base leading-6 text-[#4a5565] line-clamp-2">
        {content.shortDescription?.replace(/<[^>]*>/g, '')}
      </p>

      {badgeTopics.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {badgeTopics.map((topic) => (
            <span key={topic.topic.id} className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1447e6]">
              {topic.topic.name}
            </span>
          ))}
        </div>
      ) : null}

      {service.targetGroup.length > 0 ? (
        <p className="mt-4 text-sm text-[#6a7282]">
          {t('whoFor')}: {service.targetGroup.join(', ')}
        </p>
      ) : null}

      <Link
        href={`/services/${service.id}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#155dfc] hover:text-[#1247cc] after:absolute after:inset-0 after:content-['']"
      >
        {t('open')}
        <ArrowRightMiniIcon />
      </Link>
    </article>
  );
}

function ServicesPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="h-8 w-56 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="mt-3 h-5 w-full max-w-3xl animate-pulse rounded bg-[#eef2f7]" />
      <div className="mt-6 h-44 animate-pulse rounded-2xl bg-[#eef2f7]" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-[#eef2f7]" />
        <div className="h-48 animate-pulse rounded-2xl bg-[#eef2f7]" />
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg">
          <div className="h-4 w-40 animate-pulse rounded bg-[#e5e7eb]" />
          <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-[#e5e7eb]" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-[#eef2f7]" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-[#eef2f7]" />
          <div className="mt-5 h-4 w-28 animate-pulse rounded bg-[#dbeafe]" />
        </div>
      ))}
    </div>
  );
}

function LegendItem({
  color,
  label,
  opacity,
}: {
  color: string;
  label: string;
  opacity: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-4 rounded ${color} ${opacity}`} />
      <span className="text-xs text-[#364153]">{label}</span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function ArrowRightMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
