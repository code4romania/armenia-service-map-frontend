'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AdminPanel } from '@/components/admin/admin-surface';
import { Badge } from '@/components/ui/badge';
import { ActionButton } from '@/components/ui/action-button';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useAdminService, useDeleteService, usePublishService, useUnpublishService } from '@/lib/api/services';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { serviceOrgName } from '@/lib/services/org-name';
import { useRegionName } from '@/lib/i18n/region-name';
import { useTargetGroupName } from '@/lib/i18n/target-group-name';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.services');
  const regionName = useRegionName();
  const targetGroupName = useTargetGroupName();
  const tStatus = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const { data: service, isLoading } = useAdminService(id);
  const deleteService = useDeleteService();
  const publishService = usePublishService();
  const unpublishService = useUnpublishService();

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!service) return <div className="p-8 text-[#6b7280]">{t('notFound')}</div>;

  const content = getLocalizedServiceContent(service, locale);

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/admin/services" className="hover:underline">{t('title')}</Link>{' > '}{content.title}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <Badge variant={service.status === 'PUBLISHED' ? 'success' : 'warning'}>
            {service.status === 'PUBLISHED' ? tStatus('published') : tStatus('draft')}
          </Badge>
        </div>
        <div className="flex gap-4">
          <ActionButton variant="edit" onClick={() => router.push(`/admin/services/${id}/edit`)} />
          <ActionButton variant="delete" onClick={() => { if (confirm(tCommon('confirmDeleteService'))) { deleteService.mutate(id); router.push('/admin/services'); } }} />
          {service.status === 'PUBLISHED' ? (
            <ActionButton variant="publish" onClick={() => unpublishService.mutate(id)}>
              {t('unpublish')}
            </ActionButton>
          ) : (
            <ActionButton variant="publish" onClick={() => publishService.mutate(id)}>
              {t('publish')}
            </ActionButton>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3 sm:space-y-4">
        <AdminPanel className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('organisation')}</div>
              <div className="mt-1 flex items-center gap-2">
                {serviceOrgName(service)}
                {!service.organisation && service.externalOrganisationName ? (
                  <Badge variant="warning">{t('outsideNetworkBadge')}</Badge>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('region')}</div>
              <div className="mt-1">{service.region ? regionName(service.region) : t('allRegions')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('columns.availability')}</div>
              <div className="mt-1"><Badge variant={service.isAvailable ? 'success' : 'danger'}>{service.isAvailable ? t('available') : t('unavailable')}</Badge></div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('topics')}</div>
              <div className="mt-1 flex flex-wrap gap-1">{service.topics.map((entry) => <Badge key={entry.topic.id} variant="neutral">{entry.topic.name}</Badge>)}</div>
            </div>
            {service.targetGroup.length > 0 && (
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('targetGroups')}</div>
                <div className="mt-1">{service.targetGroup.map((name) => targetGroupName({ name })).join(', ')}</div>
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-[#6b7280] mb-2">{t('shortDescription')}</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.shortDescription }} />
        </AdminPanel>

        <AdminPanel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-[#6b7280] mb-2">{t('descriptionLabel')}</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.description }} />
        </AdminPanel>

        {content.howToAccess ? (
          <AdminPanel className="p-4 sm:p-5">
            <div className="text-sm font-medium text-[#6b7280] mb-2">{t('howToAccess')}</div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.howToAccess }} />
          </AdminPanel>
        ) : null}
      </div>
    </div>
  );
}
