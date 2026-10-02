import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`Service Details | ${SITE_NAME}`}</title>
      <meta
        name="description"
        content="Read detailed information about a verified support service and connect with the provider."
      />
      <meta property="og:title" content={`Service Details | ${SITE_NAME}`} />
      <meta
        property="og:description"
        content="Explore full service details, availability, target groups, and organization information."
      />
      <meta property="og:type" content="article" />
      <meta property="og:image" content="/hero-support.jpg" />
    </>
  );
}
