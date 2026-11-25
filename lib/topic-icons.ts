import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  LanguageIcon,
  LifebuoyIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { type ComponentType, type SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Icons an admin can pick for a topic. The key is what gets stored in `Topic.icon`, so never
// rename one; add new keys instead. Labels live under `admin.taxonomy.icons.<key>`.
export const TOPIC_ICONS = {
  legal: ScaleIcon,
  health: HeartIcon,
  mentalHealth: ChatBubbleLeftRightIcon,
  education: AcademicCapIcon,
  housing: HomeIcon,
  employment: BriefcaseIcon,
  economy: ArrowTrendingUpIcon,
  grants: BanknotesIcon,
  business: BuildingStorefrontIcon,
  socialCare: HandRaisedIcon,
  support: LifebuoyIcon,
  community: UserGroupIcon,
  family: UsersIcon,
  language: LanguageIcon,
  information: BookOpenIcon,
  documents: DocumentTextIcon,
  protection: ShieldCheckIcon,
  international: GlobeAltIcon,
  other: Squares2X2Icon,
} satisfies Record<string, IconComponent>;

export type TopicIconKey = keyof typeof TOPIC_ICONS;

export const TOPIC_ICON_KEYS = Object.keys(TOPIC_ICONS) as TopicIconKey[];

// Used, by position, for topics that have no icon picked yet (matches the old homepage order).
const FALLBACK_ICON_KEYS: TopicIconKey[] = ['legal', 'health', 'language', 'employment', 'housing', 'family', 'information', 'international'];

export function isTopicIconKey(value: string | null | undefined): value is TopicIconKey {
  return !!value && Object.prototype.hasOwnProperty.call(TOPIC_ICONS, value);
}

/** The icon for a topic: the one picked in admin, else a positional fallback. */
export function topicIcon(icon: string | null | undefined, index: number): IconComponent {
  if (isTopicIconKey(icon)) return TOPIC_ICONS[icon];
  return TOPIC_ICONS[FALLBACK_ICON_KEYS[index % FALLBACK_ICON_KEYS.length]];
}
