import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`About ${SITE_NAME} | Project Mission`}</title>
      <meta
        name="description"
        content={`Learn how ${SITE_NAME} helps refugees and displaced people in Armenia access verified support services.`}
      />
      <meta property="og:title" content={`About ${SITE_NAME} | Project Mission`} />
      <meta
        property="og:description"
        content={`Understand the mission, process, and partnerships behind ${SITE_NAME}.`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/about-image.jpg" />
    </>
  );
}
