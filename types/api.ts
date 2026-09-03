export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: { id: string; name: string } | null;
  children?: Array<{ id: string; name: string; status: 'ACTIVE' | 'INACTIVE' }>;
  _count: { services: number };
}

export interface TopicChildDetail {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  createdAt?: string;
  updatedAt: string;
  _count: { services: number };
}

export interface TopicDetail extends Topic {
  children: TopicChildDetail[];
}

export interface TopicFormPayload {
  name: string;
  slug?: string;
  status: 'ACTIVE' | 'INACTIVE';
  subtopics: Array<{
    id?: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    sortOrder: number;
  }>;
  removedSubtopicIds?: string[];
}

export interface PublicTopic {
  id: string;
  name: string;
  slug: string;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    status?: string;
    sortOrder?: number;
  }>;
}

export interface NeedTag {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count: { needReports: number };
}

export interface TargetGroupOption {
  id: string;
  name: string;
  status: string;
}

export interface TargetGroup {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count: { services: number };
}

export interface TaxonomyEntityFormPayload {
  name: string;
  slug?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  svgPathId: string;
}

export interface Organisation {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  legalName?: string | null;
  country?: string | null;
  streetAddress?: string | null;
  location?: string | null;
  organisationType?: string | null;
  uniqueIdentifier?: string | null;
  category?: string | null;
  activityDomain?: string | null;
  legalRepName?: string | null;
  legalRepEmail?: string | null;
  legalRepPhone?: string | null;
  contactPersonName?: string | null;
  contactPersonEmail?: string | null;
  contactPersonPhone?: string | null;
  legalDocumentUrl?: string | null;
  observations?: string | null;
  tags?: string[];
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  submissionSource?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  regions: Region[];
  _count: { users: number; services: number };
}

export interface OrganisationDetail extends Organisation {
  users: UserSummary[];
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  lastAccessAt: string | null;
  role: string;
  organisationId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  organisation: { id: string; name: string } | null;
}

export interface ServiceTopic {
  topic: { id: string; name: string; slug: string };
}

export interface NeedReportTag {
  needTag: { id: string; name: string; slug: string };
}

export type NeedStatus = 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'CLOSED';

export interface NeedReport {
  id: string;
  title: string;
  description: string;
  fullName: string;
  contactMethod: string;
  contactValue: string;
  regionId: string | null;
  status: NeedStatus;
  assignedOrganisationId: string | null;
  createdAt: string;
  updatedAt: string;
  region: { id: string; name: string } | null;
  assignedOrganisation: { id: string; name: string } | null;
  tags: NeedReportTag[];
}

export type NeedReportEventType =
  | 'COMMENT'
  | 'STATUS_CHANGE'
  | 'TAG_ADDED'
  | 'TAG_REMOVED'
  | 'ASSIGNED'
  | 'TITLE_EDITED';

export interface NeedReportEvent {
  id: string;
  needReportId: string;
  userId: string;
  eventType: NeedReportEventType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface NeedsMapEntry {
  regionId: string;
  regionName: string;
  svgPathId: string;
  count: number;
}

export interface Service {
  id: string;
  title: string | null;
  titleHy: string | null;
  shortDescription: string | null;
  shortDescriptionHy: string | null;
  description: string | null;
  descriptionHy: string | null;
  howToAccess: string | null;
  howToAccessHy: string | null;
  organisationId: string | null;
  externalOrganisationName?: string | null;
  regionId: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  isAvailable: boolean;
  availabilityState: 'AVAILABLE' | 'AVAILABLE_SOON' | 'UNAVAILABLE';
  availabilityStart: string | null;
  availabilityEnd: string | null;
  targetGroup: string[];
  targetGroups: { targetGroup: { id: string; name: string; status: string } }[];
  createdAt: string;
  updatedAt: string;
  organisation?: { id: string; name: string } | null;
  region: { id: string; name: string } | null;
  topics: ServiceTopic[];
}

export interface OverviewStats {
  totalServices: number;
  totalOrganisations: number;
  totalNeedReports: number;
  totalSearches: number;
  totalZeroResultSearches?: number;
  totalUniqueSearches?: number;
  newNeeds: number;
  resolvedNeeds: number;
}

export interface SearchStats {
  topQueries: { query: string; count: number }[];
  zeroResultQueries: { query: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export interface FilterStats {
  regionUsage: { regionId: string; regionName: string; svgPathId: string; count: number }[];
  topicUsage: { topicId: string; topicName: string; count: number }[];
}

export interface QueryCount {
  query: string;
  count: number;
}

export interface SearchFrequencyPoint {
  period: 'day' | 'week' | 'month';
  bucketStart: string;
  count: number;
}

export interface DashboardTrendPoint {
  month: string;
  count: number;
}

export interface DashboardTrendsResponse {
  months: string[];
  needReports: DashboardTrendPoint[];
  services: DashboardTrendPoint[];
}

export interface SearchLogItem {
  id: string;
  query: string;
  regionId: string | null;
  topicIds: string[];
  resultsCount: number;
  createdAt: string;
}

export interface FilterUsageEntry {
  count: number;
}

export interface RegionFilterUsage extends FilterUsageEntry {
  regionId: string;
  regionName: string;
  svgPathId: string | null;
}

export interface TopicFilterUsage extends FilterUsageEntry {
  topicId: string;
  topicName: string;
}

export interface FilterUsageResponse {
  regionUsage: RegionFilterUsage[];
  topicUsage: TopicFilterUsage[];
}

export interface FilterHeatmapMatrixEntry {
  topicId: string;
  regionId: string;
  count: number;
}

export interface FilterHeatmapResponse {
  regions: { id: string; name: string }[];
  topics: { id: string; name: string }[];
  matrix: FilterHeatmapMatrixEntry[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface OrgOverviewStats {
  totalServices: number;
  activeServices: number;
  assignedNeeds: number;
  resolvedNeeds: number;
}
