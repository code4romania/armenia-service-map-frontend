import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function PublicFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e5e7eb] bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image src="/project-logo.svg" alt="RefugeeSupport" width={215} height={48} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#4a5565]">{t('tagline')}</p>
            <div className="mt-5 flex items-center gap-3 text-[#6a7282]">
              <SocialLink href="#" label="LinkedIn" icon={<LinkedInIcon />} />
              <SocialLink href="#" label="Facebook" icon={<FacebookIcon />} />
              <SocialLink href="#" label="YouTube" icon={<YoutubeIcon />} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#101828]">{t('company')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#4a5565]">
              <li><Link href="/about" className="hover:text-[#101828]">{t('about')}</Link></li>
              <li><Link href="/join-the-network" className="hover:text-[#101828]">{t('joinNetwork')}</Link></li>
              <li><Link href="/services" className="hover:text-[#101828]">{t('services')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#101828]">{t('support')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#4a5565]">
              <li><Link href="/services" className="hover:text-[#101828]">{t('exploreServices')}</Link></li>
              <li><Link href="/report-a-need" className="hover:text-[#101828]">{t('reportNeed')}</Link></li>
              <li><Link href="/about" className="hover:text-[#101828]">{t('howItWorks')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#101828]">{t('contact')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#4a5565]">
              <li><a href="mailto:info@demdev.org" className="hover:text-[#101828]">info@demdev.org</a></li>
              <li><a href="tel:+37477533862" className="hover:text-[#101828]">+374 77533862</a></li>
              <li>Yerevan, Armenia</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#e5e7eb] pt-6 text-center text-xs text-[#6a7282]">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d1d5db] bg-white transition-colors hover:border-[#9ca3af] hover:text-[#101828]"
    >
      {icon}
    </a>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
