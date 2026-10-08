import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`Explore Services | ${SITE_NAME}`}</title>
      <meta
        name="description"
        content="Browse verified support services in Armenia by region, topic, and availability."
      />
      <meta property="og:title" content={`Explore Services | ${SITE_NAME}`} />
      <meta
        property="og:description"
        content="Search verified services for housing, healthcare, legal support, education, and more."
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/armenia-map.svg" />
    </>
  );
}
