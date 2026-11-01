'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTopicName } from '@/lib/i18n/topic-name';
import { AdminPanel } from '@/components/admin/admin-surface';
import { TopicSubtopicsTable } from '@/components/admin/taxonomy/topic-subtopics-table';
import { TaxonomyPageHeader } from '@/components/admin/taxonomy/taxonomy-page-header';
import { Badge } from '@/components/ui/badge';
import { DetailPageLoadingSkeleton } from '@/components/shared/loading-skeletons';
import { useTopic, useUpdateTopic } from '@/lib/api/taxonomy';

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data: topic, isLoading } = useTopic(id);
  const updateTopic = useUpdateTopic();
  const t = useTranslations('admin.taxonomy');
  const tStatuses = useTranslations('admin.statuses');
  const topicName = useTopicName();

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!topic) return <div className="p-8 text-[#6b7280]">{t('pages.topicNotFound')}</div>;

  return (
    <div className="space-y-6">
      <TaxonomyPageHeader
        title={topicName(topic)}
        action={{ href: `/admin/taxonomy/topics/${id}/edit`, label: t('pages.editTopicAction') }}
      />

      <AdminPanel className="rounded-xl border border-[#e8e8e8] bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge variant={topic.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {topic.status === 'ACTIVE' ? tStatuses('active') : tStatuses('inactive')}
          </Badge>
          <span className="text-sm text-[#6b7280]">{t('pages.servicesCount', { count: topic._count.services })}</span>
        </div>
        <h2 className="mb-4 text-lg font-semibold text-[#111827]">{t('form.subtopics')}</h2>
        <TopicSubtopicsTable
          rows={topic.children}
          pendingId={pendingId}
          onToggleStatus={async ({ id: subtopicId, status }) => {
            try {
              setPendingId(subtopicId);
              await updateTopic.mutateAsync({ id: subtopicId, status });
            } finally {
              setPendingId(null);
            }
          }}
        />
      </AdminPanel>
    </div>
  );
}
