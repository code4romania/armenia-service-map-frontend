import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`Report a Need | ${SITE_NAME}`}</title>
      <meta
        name="description"
        content="Submit a need report and get connected with available support services in Armenia."
      />
      <meta property="og:title" content={`Report a Need | ${SITE_NAME}`} />
      <meta
        property="og:description"
        content={`Share your needs and ${SITE_NAME} will help connect you with trusted providers.`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/report-need-banner.jpg" />
    </>
  );
}
