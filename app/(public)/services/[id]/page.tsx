'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { NeedCtaBanner } from '@/components/public/need-cta-banner';
import { usePublicService } from '@/lib/api/services';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { useTopicName } from '@/lib/i18n/topic-name';
import { serviceOrgName } from '@/lib/services/org-name';
import { SITE_URL } from '@/lib/site';

export default function PublicServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = useTranslations('serviceDetail');
  const tServices = useTranslations('services');
  const tHome = useTranslations('home');
  const tNav = useTranslations('nav');
  const topicName = useTopicName();

  const { data: service, isLoading } = usePublicService(id);

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#101828]">{t('notFoundTitle')}</h1>
        <p className="mt-3 text-[#6a7282]">{t('notFoundText')}</p>
        <Link
          href="/services"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#155dfc] hover:text-[#1247cc]"
        >
          <BackIcon />
          {t('backToServices')}
        </Link>
      </div>
    );
  }

  const content = getLocalizedServiceContent(service, locale);

  const serviceJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: content.title,
    description: content.shortDescription?.replace(/<[^>]*>/g, ''),
    provider: {
      '@type': 'Organization',
      name: serviceOrgName(service),
    },
    areaServed: service.region?.name || t('allRegions'),
    url: `${SITE_URL}/services/${service.id}`,
  });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: serviceJsonLd }} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-[#6a7282]">
          <Link href="/" className="hover:text-[#155dfc]">{tNav('home')}</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-[#155dfc]">{tNav('services')}</Link>
          <span>/</span>
          <span className="line-clamp-1 text-[#101828]">{content.title}</span>
        </div>

        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-7 shadow-lg md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#6a7282]">
                <MapPinIcon />
                {serviceOrgName(service)}
              </div>

              <h1 className="mt-2 text-3xl font-bold text-[#101828]">{content.title}</h1>

              <div
                className="prose mt-4 max-w-none text-[#4a5565] prose-p:my-2"
                dangerouslySetInnerHTML={{ __html: content.shortDescription }}
              />
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              {service.availabilityState === 'AVAILABLE' ? (
                <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">{tServices('available')}</span>
              ) : service.availabilityState === 'AVAILABLE_SOON' ? (
                <span className="rounded-full bg-[#fef9c3] px-3 py-1 text-xs font-semibold text-[#854d0e]">{tServices('availableSoon')}</span>
              ) : (
                <span className="rounded-full bg-[#fee2e2] px-3 py-1 text-xs font-semibold text-[#b91c1c]">{tServices('unavailable')}</span>
              )}
              <div className="flex flex-wrap gap-2 md:justify-end">
                {service.topics.map((topicEntry) => (
                  <span key={topicEntry.topic.id} className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1447e6]">
                    {topicName(topicEntry.topic)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DetailCard label={t('organisation')} value={serviceOrgName(service)} />
            <DetailCard label={t('region')} value={service.region?.name || t('allRegions')} />
            {service.targetGroup.length > 0 ? (
              <DetailCard label={t('targetGroups')} value={service.targetGroup.join(', ')} />
            ) : null}
            {(service.availabilityStart || service.availabilityEnd) ? (
              <DetailCard
                label={t('availability')}
                value={`${service.availabilityStart ? formatDate(service.availabilityStart) : ''}${
                  service.availabilityStart && service.availabilityEnd ? ' - ' : ''
                }${service.availabilityEnd ? formatDate(service.availabilityEnd) : ''}`}
              />
            ) : null}
          </div>

          <section className="mt-7 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5 md:p-6">
            <h2 className="text-xl font-bold text-[#101828]">{t('aboutService')}</h2>
            <div className="prose mt-4 max-w-none text-[#4a5565] prose-p:my-2" dangerouslySetInnerHTML={{ __html: content.description }} />
          </section>

          {content.howToAccess ? (
            <section className="mt-7 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5 md:p-6">
              <h2 className="text-xl font-bold text-[#101828]">{t('howToAccess')}</h2>
              <div
                className="prose mt-4 max-w-none text-[#4a5565] prose-p:my-2"
                dangerouslySetInnerHTML={{ __html: content.howToAccess }}
              />
            </section>
          ) : null}

          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-base font-semibold text-[#155dfc] hover:text-[#1247cc]"
            >
              <BackIcon />
              {t('backToServices')}
            </Link>
          </div>
        </article>
      </div>

      <NeedCtaBanner
        title={tHome('ctaTitle')}
        subtitle={tHome('ctaSubtitle')}
        buttonLabel={tHome('reportNeed')}
      />
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-[#6a7282]">{label}</p>
      <p className="mt-1 font-semibold text-[#101828]">{value}</p>
    </div>
  );
}

function ServiceDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="h-4 w-72 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
        <div className="h-4 w-40 animate-pulse rounded bg-[#e5e7eb]" />
        <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-[#eef2f7]" />
        <div className="mt-4 h-5 w-full animate-pulse rounded bg-[#eef2f7]" />
        <div className="mt-2 h-5 w-5/6 animate-pulse rounded bg-[#eef2f7]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-xl bg-[#eef2f7]" />
          <div className="h-24 animate-pulse rounded-xl bg-[#eef2f7]" />
        </div>
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
