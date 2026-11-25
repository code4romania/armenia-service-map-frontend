'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { NeedCtaBanner } from '@/components/public/need-cta-banner';
import { JoinNetworkCta } from '@/components/public/join-network-cta';
import { PartnersFunding } from '@/components/public/partners-funding';
import { usePublicRegions, usePublicServices, usePublicTopics } from '@/lib/api/services';
import { useRegionName } from '@/lib/i18n/region-name';
import { useTopicName } from '@/lib/i18n/topic-name';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { topicIcon } from '@/lib/topic-icons';
import type { Service } from '@/types/api';

const topicGradients = [
  'from-[#2b7fff] to-[#155dfc]',
  'from-[#ff2056] to-[#ec003f]',
  'from-[#ad46ff] to-[#9810fa]',
  'from-[#00bc7d] to-[#009966]',
  'from-[#fe9a00] to-[#e17100]',
  'from-[#615fff] to-[#4f39f6]',
  'from-[#00b8db] to-[#0092b8]',
  'from-[#8e51ff] to-[#7f22fe]',
];

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [regionId, setRegionId] = useState('');

  const { data: topics } = usePublicTopics();
  const topicName = useTopicName();
  const { data: regions } = usePublicRegions();
  const regionName = useRegionName();
  const { data: latestServices } = usePublicServices({
    perPage: 3,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (regionId) params.set('regionId', regionId);
    router.push(`/services${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="bg-[#f6f8ff]">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="max-w-xl text-base font-bold leading-relaxed text-[#101828] sm:text-lg">{t('heroWelcome')}</h1>
            <div className="mt-4 max-w-xl space-y-3 text-base leading-relaxed text-[#4a5565] sm:text-lg">
              <p>{t('heroText1')}</p>
              <p>{t('heroText2')}</p>
              <p>{t('heroText3')}</p>
            </div>
            <Link
              href="/services"
              className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#155dfc] to-[#4f39f6] px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {t('findServices')}
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#51a2ff4d] to-[#7c86ff4d] blur-[64px]" />
            <div className="relative overflow-hidden rounded-3xl bg-white px-6 pt-6 shadow-2xl sm:px-10 sm:pt-10">
              <Image
                src="/illustrations/home.svg"
                alt="Refugee support services"
                width={800}
                height={546}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-[#155dfc] to-[#4f39f6] px-5 py-8 shadow-2xl sm:px-8 sm:py-10 md:px-12 md:py-12">
          <h2 className="text-center text-xl font-bold text-white sm:text-2xl md:text-3xl">{t('searchTitle')}</h2>
          <form onSubmit={handleSearch} className="mx-auto mt-7 grid max-w-4xl gap-4 md:grid-cols-[1fr_1.2fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 shadow-lg">
              <MapPinIcon />
              <select
                value={regionId}
                onChange={(event) => setRegionId(event.target.value)}
                className="w-full bg-transparent font-medium text-[#364153] outline-none"
              >
                <option value="">{t('allRegions')}</option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>{regionName(region)}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 shadow-lg">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent text-[#364153] outline-none placeholder:text-[#6a7282]"
              />
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-[#155dfc] shadow-lg transition-colors hover:bg-[#eef2ff]"
            >
              {t('findServices')}
            </button>
          </form>
        </div>
      </section>

      {topics && topics.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#101828] sm:text-4xl">{t('browseTopics')}</h2>
            <p className="mt-4 text-base text-[#4a5565] sm:text-lg">{t('browseTopicsSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topics.slice(0, 8).map((topic, index) => {
              const gradient = topicGradients[index % topicGradients.length];
              const IconComponent = topicIcon(topic.icon, index);

              return (
                <Link
                  key={topic.id}
                  href={`/services?topicId=${topic.id}`}
                  className="group rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br ${gradient} shadow-lg`}>
                    <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[#101828]">{topicName(topic)}</h3>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#155dfc]">
                    {t('learnMore')}
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {latestServices && latestServices.data.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#101828] sm:text-4xl">{t('latestServices')}</h2>
            <p className="mt-4 text-base text-[#4a5565] sm:text-lg">{t('latestServicesSubtitle')}</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {latestServices.data.map((service: Service) => {
              const content = getLocalizedServiceContent(service, locale);
              return (
              <article key={service.id} className="relative flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-7 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#155dfc]/40 hover:shadow-xl">
                <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                  <MapPinIcon />
                  <span>{service.regions.length ? service.regions.map(regionName).join(', ') : t('anywhereInArmenia')}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#101828]">{content.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#4a5565] line-clamp-4">
                  {content.shortDescription.replace(/<[^>]*>/g, '')}
                </p>
                <Link
                  href={`/services/${service.id}`}
                  className="mt-5 inline-flex items-center justify-center rounded-[14px] border border-[#d1d5db] bg-[#f9fafb] px-5 py-2.5 text-sm font-semibold text-[#364153] transition-colors hover:bg-[#eef2ff] after:absolute after:inset-0 after:content-['']"
                >
                  {t('seeDetails')}
                </Link>
              </article>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center rounded-[14px] bg-[#dbeafe] px-8 py-3 text-base font-semibold text-[#1447e6] transition-colors hover:bg-[#bfdbfe]"
            >
              {t('viewAllServices')}
            </Link>
          </div>
        </section>
      ) : null}

      <JoinNetworkCta />

      <NeedCtaBanner
        title={t('ctaTitle')}
        subtitle={t('ctaSubtitle')}
        buttonLabel={t('reportNeed')}
      />

      <PartnersFunding />
    </div>
  );
}

function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

