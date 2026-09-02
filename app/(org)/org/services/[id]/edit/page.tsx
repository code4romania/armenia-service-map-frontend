'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ALL_REGIONS, ServiceForm, type ServiceFormState } from '@/components/services/service-form';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useOrgService, useUpdateOrgService } from '@/lib/api/services';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';

export default function EditOrgServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('org.services');
  const tForm = useTranslations('serviceForm');
  const tCommon = useTranslations('admin.common');
  const { data: service, isLoading } = useOrgService(id);
  const update = useUpdateOrgService();

  if (isLoading) return <DetailPageLoadingSkeleton />;

  const initialValues: Partial<ServiceFormState> | undefined = service
    ? {
        title: service.title ?? '',
        titleHy: service.titleHy ?? '',
        shortDescription: service.shortDescription ?? '',
        shortDescriptionHy: service.shortDescriptionHy ?? '',
        description: service.description ?? '',
        descriptionHy: service.descriptionHy ?? '',
        howToAccess: service.howToAccess ?? '',
        howToAccessHy: service.howToAccessHy ?? '',
        status: service.status,
        regionId: service.regionId ?? ALL_REGIONS,
        isAvailable: service.isAvailable,
        targetGroupIds: service.targetGroups.map((entry) => entry.targetGroup.id),
        topicIds: service.topics.map((entry) => entry.topic.id),
        availabilityStart: service.availabilityStart?.split('T')[0] ?? '',
        availabilityEnd: service.availabilityEnd?.split('T')[0] ?? '',
      }
    : undefined;

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/org/services" className="hover:underline">
          {t('breadcrumb')}
        </Link>
        {' > '}
        <Link href={`/org/services/${id}`} className="hover:underline">
          {service ? getLocalizedServiceContent(service, locale).title : ''}
        </Link>
        {' > '}
        {tForm('editBreadcrumb')}
      </div>
      <h1 className="text-2xl font-bold">{tForm('editTitle')}</h1>

      <ServiceForm
        mode="edit"
        initialValues={initialValues}
        showOrganisationField={false}
        isSubmitting={update.isPending}
        submitLabel={tCommon('saveChanges')}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id, ...payload });
          router.push(`/org/services/${id}`);
        }}
      />
    </div>
  );
}
