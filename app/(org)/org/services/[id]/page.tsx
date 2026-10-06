'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AdminPanel } from '@/components/admin/admin-surface';
import { Badge } from '@/components/ui/badge';
import { ActionButton } from '@/components/ui/action-button';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useOrgService, usePublishOrgService, useUnpublishOrgService, useDeleteOrgService } from '@/lib/api/services';
import { getLocalizedServiceContent } from '@/lib/i18n/service-content';
import { useRegionName } from '@/lib/i18n/region-name';
import { useTargetGroupName } from '@/lib/i18n/target-group-name';

export default function OrgServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('org.services');
  const regionName = useRegionName();
  const targetGroupName = useTargetGroupName();
  const tStatuses = useTranslations('admin.statuses');
  const tCommon = useTranslations('admin.common');
  const { data: service, isLoading } = useOrgService(id);
  const publishService = usePublishOrgService();
  const unpublishService = useUnpublishOrgService();
  const deleteService = useDeleteOrgService();

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!service) return <div className="p-8 text-[#6b7280]">{t('notFound')}</div>;

  const content = getLocalizedServiceContent(service, locale);

  return (
    <div>
      <div className="mb-2 text-sm text-[#6b7280]">
        <Link href="/org/services" className="hover:underline">{t('breadcrumb')}</Link>{' > '}{content.title}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <Badge variant={service.status === 'PUBLISHED' ? 'success' : 'warning'}>
            {service.status === 'PUBLISHED' ? tStatuses('published') : tStatuses('draft')}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton variant="edit" onClick={() => router.push(`/org/services/${id}/edit`)} />
          <ActionButton
            variant="delete"
            onClick={() => {
              if (confirm(tCommon('confirmDeleteService'))) {
                deleteService.mutate(id, { onSuccess: () => router.push('/org/services') });
              }
            }}
          />
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
              <div className="text-sm font-medium text-[#6b7280]">{t('detail.region')}</div>
              <div className="mt-1">{service.region ? regionName(service.region) : t('allRegions')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('detail.availability')}</div>
              <div className="mt-1"><Badge variant={service.isAvailable ? 'success' : 'danger'}>{service.isAvailable ? tStatuses('available') : tStatuses('unavailable')}</Badge></div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#6b7280]">{t('detail.topics')}</div>
              <div className="mt-1 flex flex-wrap gap-1">{service.topics.map((t) => <Badge key={t.topic.id} variant="neutral">{t.topic.name}</Badge>)}</div>
            </div>
            {(service.targetGroups?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium text-[#6b7280]">{t('detail.targetGroups')}</div>
                <div className="mt-1">
                  {service.targetGroups.map((entry) => targetGroupName(entry.targetGroup)).join(', ')}
                </div>
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-[#6b7280] mb-2">{t('detail.shortDescription')}</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.shortDescription }} />
        </AdminPanel>

        <AdminPanel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-[#6b7280] mb-2">{t('detail.description')}</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.description }} />
        </AdminPanel>

        {content.howToAccess ? (
          <AdminPanel className="p-4 sm:p-5">
            <div className="text-sm font-medium text-[#6b7280] mb-2">{t('detail.howToAccess')}</div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.howToAccess }} />
          </AdminPanel>
        ) : null}
      </div>
    </div>
  );
}
