import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function PublicFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e5e7eb] bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="flex flex-col items-center text-center">
          <p className="max-w-sm text-sm leading-6 text-[#4a5565]">{t('tagline')}</p>
          <div className="mt-5 flex items-center gap-3 text-[#6a7282]">
            <SocialLink href="https://www.facebook.com/DemocracyDevelopmentFoundation" label="Facebook" icon={<FacebookIcon />} />
            <SocialLink href="https://www.linkedin.com/company/demdevelopmet/?originalSubdomain=am" label="LinkedIn" icon={<LinkedInIcon />} />
            <SocialLink href="https://www.instagram.com/ddf_armenia?igsi=YWJjaGMwZTcxMnl4" label="Instagram" icon={<InstagramIcon />} />
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-10 text-center sm:grid-cols-3">
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
      target="_blank"
      rel="noopener noreferrer"
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

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
