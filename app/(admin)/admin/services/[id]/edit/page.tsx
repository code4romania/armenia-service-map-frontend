'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { ALL_REGIONS, ServiceForm, type ServiceFormState } from '@/components/services/service-form';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useAdminService, useUpdateService } from '@/lib/api/services';
import { useOrganisations } from '@/lib/api/organisations';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('serviceForm');
  const tServices = useTranslations('admin.services');
  const tCommon = useTranslations('admin.common');
  const { data: service, isLoading } = useAdminService(id);
  const update = useUpdateService();
  const { data: orgs } = useOrganisations({ perPage: 100 });
  const organisationOptions = orgs?.data ?? [];

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
        organisationId: service.organisationId ?? '',
        isExternalOrganisation: Boolean(service.externalOrganisationName),
        externalOrganisationName: service.externalOrganisationName ?? '',
      }
    : undefined;

  return (
    <div className="mx-auto max-w-[1220px] pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 pt-8 text-sm text-[#6b7280]">
        <Link href="/admin/services" className="font-medium hover:underline">
          {tServices('title')}
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link href={`/admin/services/${id}`} className="font-medium hover:underline">
          {service ? getLocalizedServiceContent(service, locale).title : ''}
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="font-medium">{t('editBreadcrumb')}</span>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-[#111827]">{t('editTitle')}</h1>

      <ServiceForm
        mode="edit"
        initialValues={initialValues}
        showOrganisationField
        allowExternalOrganisation
        organisationOptions={organisationOptions}
        isSubmitting={update.isPending}
        submitLabel={tCommon('saveChanges')}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id, ...payload });
          router.push(`/admin/services/${id}`);
        }}
      />
    </div>
  );
}
