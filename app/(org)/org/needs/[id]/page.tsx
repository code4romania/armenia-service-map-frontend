'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NeedEventsTimeline } from '@/components/shared/need-events-timeline';
import { DetailPageLoadingSkeleton, TimelineLoadingSkeleton } from '@/components/shared/loading-skeletons';
import {
  useOrgNeed,
  useUpdateOrgNeed,
  useOrgNeedEvents,
  useAddOrgNeedComment,
} from '@/lib/api/needs';
import { formatStatusLabel, NEED_STATUS_LABEL_KEYS } from '@/lib/formatting/status-label';
import type { NeedStatus } from '@/types/api';

const statusVariant: Record<NeedStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  NEW: 'neutral',
  IN_PROGRESS: 'warning',
  SOLVED: 'success',
  CLOSED: 'danger',
};

const STATUS_OPTION_VALUES: NeedStatus[] = ['IN_PROGRESS', 'SOLVED', 'CLOSED'];

export default function OrgNeedDetailPage() {
  const t = useTranslations('org.needs');
  const tStatuses = useTranslations('admin.statuses');
  const { id } = useParams<{ id: string }>();
  const { data: need, isLoading } = useOrgNeed(id);
  const { data: events, isLoading: eventsLoading } = useOrgNeedEvents(id);
  const updateNeed = useUpdateOrgNeed();
  const addComment = useAddOrgNeedComment();

  const [draftStatus, setDraftStatus] = useState<NeedStatus | null>(null);
  const [comment, setComment] = useState('');
  const status = draftStatus ?? need?.status ?? 'IN_PROGRESS';

  if (isLoading) return <DetailPageLoadingSkeleton />;
  if (!need) return <div className="p-8 text-[#6b7280]">{t('notFound')}</div>;

  const statusLabel = (s: NeedStatus) =>
    NEED_STATUS_LABEL_KEYS[s] ? tStatuses(NEED_STATUS_LABEL_KEYS[s]) : formatStatusLabel(s);

  async function handleSaveStatus() {
    await updateNeed.mutateAsync({ id, status });
  }

  async function handleAddComment() {
    const content = comment.trim();
    if (!content) return;
    await addComment.mutateAsync({ id, content });
    setComment('');
  }

  return (
    <div>
      <div className="mb-3 text-sm text-[#6b7280]">
        <Link href="/org/needs" className="hover:underline">{t('breadcrumb')}</Link>{' > '}
        {need.title || t('needFallback', { id: need.id.slice(0, 8) })}
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">{need.title || t('needReportFallback', { id: need.id.slice(0, 8) })}</h1>
        <Badge variant={statusVariant[need.status]}>{statusLabel(need.status)}</Badge>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="space-y-4">
          <div className="admin-panel p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">{t('detail.descriptionHeading')}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#374151]">{need.description}</p>
            <div className="mt-4 grid gap-3 text-sm text-[#6b7280] md:grid-cols-2">
              <div><span className="font-medium text-[#111827]">{t('detail.submittedByLabel')}</span> {need.fullName}</div>
              <div><span className="font-medium text-[#111827]">{t('detail.contactLabel')}</span> {need.contactMethod} - {need.contactValue}</div>
            </div>
          </div>

          <div className="admin-panel p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">{t('detail.addCommentHeading')}</h2>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder={t('detail.commentPlaceholder')}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleAddComment} disabled={addComment.isPending || !comment.trim()}>
                {addComment.isPending ? t('detail.submittingComment') : t('detail.submitComment')}
              </Button>
            </div>
          </div>

          <div className="admin-panel p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">{t('detail.timelineHeading')}</h2>
            <div className="mt-3">
              {eventsLoading ? (
                <TimelineLoadingSkeleton />
              ) : (
                <NeedEventsTimeline events={events ?? []} emptyLabel={t('detail.timelineEmpty')} />
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="admin-panel p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">{t('detail.detailsHeading')}</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium text-[#374151]">{t('detail.statusLabel')}</label>
                <select
                  value={status}
                  onChange={(event) => setDraftStatus(event.target.value as NeedStatus)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {STATUS_OPTION_VALUES.map((value) => (
                    <option key={value} value={value}>{statusLabel(value)}</option>
                  ))}
                </select>
                <Button onClick={handleSaveStatus} disabled={updateNeed.isPending || status === need.status} className="mt-2 w-full">
                  {updateNeed.isPending ? t('detail.savingStatus') : t('detail.saveStatus')}
                </Button>
              </div>

              <div className="rounded-md bg-gray-50 p-3 text-xs text-[#6b7280]">
                <div>{t('detail.assigneeLabel')} {need.assignedOrganisation?.name || t('detail.unassigned')}</div>
                <div>{t('detail.submittedLabel')} {new Date(need.createdAt).toLocaleString()}</div>
                <div>{t('detail.lastUpdatedLabel')} {new Date(need.updatedAt).toLocaleString()}</div>
                <div>{t('detail.regionLabel')} {need.region?.name || t('detail.regionNotProvided')}</div>
              </div>

              <div>
                <p className="mb-2 font-medium text-[#374151]">{t('detail.tagsLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {need.tags.length ? (
                    need.tags.map((tag) => (
                      <Badge key={tag.needTag.id} variant="neutral">{tag.needTag.name}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#6b7280]">{t('detail.noTags')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
