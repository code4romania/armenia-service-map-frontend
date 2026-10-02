import { SITE_NAME } from '@/lib/site';

export default function Head() {
  return (
    <>
      <title>{`Join the Network | ${SITE_NAME}`}</title>
      <meta
        name="description"
        content={`Register your organization to join ${SITE_NAME} and provide verified services to refugees in Armenia.`}
      />
      <meta property="og:title" content={`Join the Network | ${SITE_NAME}`} />
      <meta
        property="og:description"
        content={`Organizations can register to publish services and support refugees through ${SITE_NAME}.`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/join-the-network.png" />
    </>
  );
}
