import { GoogleAnalytics } from '@next/third-parties/google';
import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';

const GA_MEASUREMENT_ID = 'G-1J9ENCV7V0';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#public-main-content" className="skip-link">Skip to main content</a>
      <PublicHeader />
      <main id="public-main-content" className="flex-1">{children}</main>
      <PublicFooter />
      {process.env.NODE_ENV === 'production' && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </div>
  );
}
