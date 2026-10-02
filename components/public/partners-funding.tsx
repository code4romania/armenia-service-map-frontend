'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { euFundedLogo, getLogoLocale, partnerLogos } from '@/components/public/partner-logos';

export function PartnersFunding() {
  const t = useTranslations('funding');
  const logoLocale = getLogoLocale(useLocale());
  const euLogo = euFundedLogo[logoLocale];

  return (
    <section aria-label={t('sectionAria')} className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ul className="grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-8 md:grid-cols-4">
          {partnerLogos[logoLocale].map((logo) => (
            <li key={logo.src}>
              <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="h-10 w-auto sm:h-12" />
            </li>
          ))}
        </ul>

        <hr className="my-8 border-t border-[#e5a800]" />

        <div className="flex flex-col items-center gap-6 text-center">
          <Image src={euLogo.src} alt={euLogo.alt} width={euLogo.width} height={euLogo.height} className="h-12 w-auto sm:h-14" />
          <p className="max-w-5xl text-sm italic leading-relaxed text-[#364153]">{t('euDisclaimer')}</p>
        </div>
      </div>
    </section>
  );
}
