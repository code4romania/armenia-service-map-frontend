import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { NeedCtaBanner } from '@/components/public/need-cta-banner';
import { SITE_NAME } from '@/lib/site';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="bg-[#f9fafb]">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-black">
          {t('title', { siteName: SITE_NAME })}
        </h1>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Text */}
          <div className="flex flex-1 flex-col gap-5">
            <p className="text-lg leading-7 text-[#374151]">
              {t('intro', { siteName: SITE_NAME })}
            </p>

            <div className="space-y-5">
              <p className="leading-7 text-[#374151]">
                {t('missionText')}
              </p>

              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-black">{t('howItWorks')}</h2>
                <ul className="space-y-2">
                  {[
                    { title: t('step1Title'), text: t('step1Text') },
                    { title: t('step2Title'), text: t('step2Text') },
                    { title: t('step3Title'), text: t('step3Text') },
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-4 pl-1">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#374151]" />
                      <span className="leading-7 text-[#374151]">
                        <strong>{step.title}:</strong> {step.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="leading-7 text-[#374151]">
                {t('builtBy')}
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="shrink-0 md:w-[560px]">
            <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
              <Image
                src="/illustrations/about.svg"
                alt="About RefugeeSupport"
                width={858}
                height={880}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <NeedCtaBanner
        title={t('ctaTitle')}
        subtitle={t('ctaSubtitle')}
        buttonLabel={t('reportNeed')}
      />
    </div>
  );
}
