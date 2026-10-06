import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicServiceDetailPage from '@/app/(public)/services/[id]/page';

const serviceState = {
  availabilityState: 'AVAILABLE' as string,
  region: null as { id: string; name: string } | null,
  targetGroup: [] as string[],
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 's1' }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace?: string) =>
    Object.assign(
      (key: string) => (namespace === 'regions' || namespace === 'targetGroups' ? `${namespace}.${key}` : key),
      { has: () => namespace === 'regions' || namespace === 'targetGroups' },
    ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/public/need-cta-banner', () => ({
  NeedCtaBanner: () => <div data-testid="need-cta-banner" />,
}));

vi.mock('@/lib/i18n/service-content', () => ({
  getLocalizedServiceContent: () => ({ title: 'T', shortDescription: 'S', description: 'D', howToAccess: '' }),
}));

vi.mock('@/lib/api/services', () => ({
  usePublicService: () => ({
    isLoading: false,
    data: {
      id: 's1',
      organisation: { id: 'o1', name: 'Org' },
      region: serviceState.region,
      topics: [],
      targetGroup: serviceState.targetGroup,
      availabilityStart: null,
      availabilityEnd: null,
      availabilityState: serviceState.availabilityState,
    },
  }),
}));

describe('PublicServiceDetailPage availability badge', () => {
  beforeEach(() => {
    serviceState.availabilityState = 'AVAILABLE';
    serviceState.region = null;
  });

  it('renders the Available badge for AVAILABLE state', () => {
    serviceState.availabilityState = 'AVAILABLE';
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('renders the Available soon badge for AVAILABLE_SOON state', () => {
    serviceState.availabilityState = 'AVAILABLE_SOON';
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('availableSoon')).toBeInTheDocument();
  });

  it('renders the Unavailable badge for UNAVAILABLE state', () => {
    serviceState.availabilityState = 'UNAVAILABLE';
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('unavailable')).toBeInTheDocument();
  });
});

describe('PublicServiceDetailPage region', () => {
  beforeEach(() => {
    serviceState.region = null;
  });

  it('localises the region name even though the nested region has no svgPathId', () => {
    serviceState.region = { id: 'r1', name: 'Vayots Dzor' };
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('regions.vayotsDzor')).toBeInTheDocument();
  });

  it('falls back to the all-regions label when the service has no region', () => {
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('allRegions')).toBeInTheDocument();
  });
});

describe('PublicServiceDetailPage target groups', () => {
  beforeEach(() => {
    serviceState.targetGroup = [];
  });

  it('localises the target group names', () => {
    serviceState.targetGroup = ['Women', 'Older Persons'];
    render(<PublicServiceDetailPage />);
    expect(screen.getByText('targetGroups.women, targetGroups.olderPersons')).toBeInTheDocument();
  });
});
