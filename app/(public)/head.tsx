import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`${SITE_NAME} | Find Trusted Services in Armenia`}</title>
      <meta
        name="description"
        content="Find trusted housing, healthcare, legal aid, education, and social support services for refugees and displaced people in Armenia."
      />
      <meta property="og:title" content={`${SITE_NAME} | Find Trusted Services in Armenia`} />
      <meta
        property="og:description"
        content="Discover verified support services across Armenia and connect directly with organizations."
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/hero-support.jpg" />
    </>
  );
}
