import type {
  IsoDateString,
  Sex,
  WeightUnit,
} from './shared';
import type { PersonalRecordEntry } from './analytics';
import type {
  ComebackRecognitionSummary,
  EarnedAchievement,
  RenaissanceRankDefinition,
} from './achievements';

// User contracts ----------------------------------------------------------

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN_SOURCE =
  '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$';
export const PROFILE_BIO_MAX_LENGTH = 500;
export const PROFILE_LOCATION_MAX_LENGTH = 100;
export const PROFILE_TRAINING_GOALS_MAX = 3;
export const PROFILE_TRAINING_DISCIPLINES_MAX = 3;
export const PROFILE_FAVORITE_EXERCISES_MAX = 5;
export const RESERVED_USERNAMES = [
  'achievements',
  'admin',
  'api',
  'auth',
  'dashboard',
  'edit',
  'exercises',
  'help',
  'login',
  'logout',
  'me',
  'new',
  'notifications',
  'privacy',
  'profile',
  'profiles',
  'progress',
  'register',
  'routines',
  'schedule',
  'search',
  'settings',
  'signup',
  'sunnsteel',
  'sunsteel',
  'support',
  'system',
  'terms',
  'users',
  'workouts',
] as const;

export const PROFILE_VISIBILITY_VALUES = [
  'PUBLIC',
  'FOLLOWERS',
  'PRIVATE',
] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY_VALUES)[number];

export const TRAINING_GOAL_VALUES = [
  'STRENGTH',
  'MUSCLE_GROWTH',
  'FAT_LOSS',
  'ENDURANCE',
  'GENERAL_FITNESS',
  'ATHLETIC_PERFORMANCE',
  'MOBILITY',
] as const;
export type TrainingGoal = (typeof TRAINING_GOAL_VALUES)[number];

export const TRAINING_EXPERIENCE_LEVEL_VALUES = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
] as const;
export type TrainingExperienceLevel =
  (typeof TRAINING_EXPERIENCE_LEVEL_VALUES)[number];

export const TRAINING_DISCIPLINE_VALUES = [
  'BODYBUILDING',
  'POWERLIFTING',
  'WEIGHTLIFTING',
  'CALISTHENICS',
  'STRONGMAN',
  'HYBRID_TRAINING',
  'GENERAL_STRENGTH',
] as const;
export type TrainingDiscipline = (typeof TRAINING_DISCIPLINE_VALUES)[number];

export const PREFERRED_TRAINING_STYLE_VALUES = [
  'FULL_BODY',
  'UPPER_LOWER',
  'PUSH_PULL_LEGS',
  'BODY_PART_SPLIT',
  'CIRCUIT',
] as const;
export type PreferredTrainingStyle =
  (typeof PREFERRED_TRAINING_STYLE_VALUES)[number];

export interface ProfileFavoriteExercise {
  id: string;
  name: string;
}

export interface TrainingIdentity {
  goals: TrainingGoal[];
  experienceLevel: TrainingExperienceLevel | null;
  disciplines: TrainingDiscipline[];
  preferredStyle: PreferredTrainingStyle | null;
  favoriteExercises: ProfileFavoriteExercise[];
}

export interface ProfilePrivacySettings {
  biography: ProfileVisibility;
  location: ProfileVisibility;
  trainingIdentity: ProfileVisibility;
  workoutHistory: ProfileVisibility;
  records: ProfileVisibility;
  routines: ProfileVisibility;
  achievements: ProfileVisibility;
  bodyMetrics: ProfileVisibility;
}

export interface ProfileDiscoverySettings {
  discoverableByName: boolean;
  discoverableByUsername: boolean;
  discoverableByContacts: boolean;
}

export interface ProfileViewerAccess {
  biography: boolean;
  location: boolean;
  trainingIdentity: boolean;
  workoutHistory: boolean;
  records: boolean;
  routines: boolean;
  achievements: boolean;
  bodyMetrics: boolean;
}

export interface PublicTrainingSummary {
  completedWorkouts: number;
  totalVolumeKg: number;
  currentStreakDays: number;
  bestStreakDays: number;
}

export interface PublicBodyMetrics {
  age?: number | null;
  sex?: Sex | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export const FEATURED_PROFILE_ITEM_KINDS = [
  'RECORD',
  'ACHIEVEMENT',
  'RANK',
] as const;
export type FeaturedProfileItemKind =
  (typeof FEATURED_PROFILE_ITEM_KINDS)[number];

export const FEATURED_PROFILE_ITEMS_MAX = 6;
export const FEATURED_PROFILE_REFERENCE_MAX_LENGTH = 100;

/** Owner-supplied selection. Array order becomes the public display order. */
export interface FeaturedProfileSelectionInput {
  kind: FeaturedProfileItemKind;
  referenceId: string;
}

/** Stored selection returned to its owner, ordered by `position`. */
export interface FeaturedProfileSelection
  extends FeaturedProfileSelectionInput {
  position: number;
}

export interface FeaturedProfileSelectionsResponse {
  items: FeaturedProfileSelection[];
}

export interface ReplaceFeaturedProfileItemsRequest {
  items: FeaturedProfileSelectionInput[];
}

type FeaturedProfileItemBase = FeaturedProfileSelection;

export interface FeaturedProfileRecordItem extends FeaturedProfileItemBase {
  kind: 'RECORD';
  record: PersonalRecordEntry;
}

export interface FeaturedProfileAchievementItem extends FeaturedProfileItemBase {
  kind: 'ACHIEVEMENT';
  achievement: EarnedAchievement;
}

export interface FeaturedProfileRankItem extends FeaturedProfileItemBase {
  kind: 'RANK';
  rank: RenaissanceRankDefinition;
}

/** Privacy-filtered, currently valid selections in owner-defined order. */
export type FeaturedProfileItem =
  | FeaturedProfileRecordItem
  | FeaturedProfileAchievementItem
  | FeaturedProfileRankItem;

/** Complete earned ledger allowed by the profile achievements privacy rule. */
export interface PublicProfileAchievements {
  rank: RenaissanceRankDefinition | null;
  achievements: EarnedAchievement[];
  comeback: ComebackRecognitionSummary | null;
}

export interface UserProfile {
  timeZone?: string | null;
  id: string;
  email: string;
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  trainingIdentity: TrainingIdentity;
  age?: number | null;
  sex?: Sex | null;
  weight?: number | null;
  height?: number | null;
  weightUnit: WeightUnit;
  privacySettings: ProfilePrivacySettings;
  discoverySettings: ProfileDiscoverySettings;
  followerCount: number;
  followingCount: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  trainingIdentity?: TrainingIdentity;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  followerCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  viewerAccess: ProfileViewerAccess;
  trainingSummary?: PublicTrainingSummary;
  personalRecords?: PersonalRecordEntry[];
  featuredItems: FeaturedProfileItem[];
  achievements?: PublicProfileAchievements;
  bodyMetrics?: PublicBodyMetrics;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  trainingGoals?: TrainingGoal[];
  trainingExperienceLevel?: TrainingExperienceLevel | null;
  trainingDisciplines?: TrainingDiscipline[];
  preferredTrainingStyle?: PreferredTrainingStyle | null;
  favoriteExerciseIds?: string[];
  age?: number | null;
  sex?: Sex | null;
  weight?: number | null;
  height?: number | null;
  weightUnit?: WeightUnit;
}

export type UpdateProfilePrivacyRequest = Omit<
  ProfilePrivacySettings,
  'biography' | 'location' | 'trainingIdentity'
> &
  Partial<
    Pick<ProfilePrivacySettings, 'biography' | 'location' | 'trainingIdentity'>
  >;

export type UpdateProfileDiscoveryRequest = ProfileDiscoverySettings;

// Equipment preferences -------------------------------------------------

export interface PlatePairInventory {
  weightKg: number;
  pairCount: number;
}

export interface TrainingLocationPreference {
  id: string;
  name: string;
  isDefault: boolean;
  barWeightKg: number;
  availablePlatePairs: PlatePairInventory[];
  equipment: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface TrainingLocationPreferenceInput {
  id?: string;
  name: string;
  isDefault: boolean;
  barWeightKg: number;
  availablePlatePairs: PlatePairInventory[];
  equipment: string[];
}

export interface ReplaceTrainingLocationsRequest {
  locations: TrainingLocationPreferenceInput[];
}

export interface UserSearchResponse {
  id: string;
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
}

// Relationship lists ----------------------------------------------------

/**
 * `followers` and `following` are the profile's own relations. `mutuals` is
 * relative to the viewer: accounts that follow the profile and that the viewer
 * follows. On the viewer's own profile that is the set of mutual follows.
 */
export const RELATIONSHIP_LIST_KINDS = [
  'followers',
  'following',
  'mutuals',
] as const;
export type RelationshipListKind = (typeof RELATIONSHIP_LIST_KINDS)[number];

export const RELATIONSHIP_LIST_DEFAULT_LIMIT = 20;
export const RELATIONSHIP_LIST_MAX_LIMIT = 50;
export const FOLLOW_SUGGESTIONS_DEFAULT_LIMIT = 10;
export const FOLLOW_SUGGESTIONS_MAX_LIMIT = 20;

/** A member as seen by the signed-in viewer. Never carries email. */
export interface RelationshipMember extends UserSearchResponse {
  isFollowedByMe: boolean;
  followsMe: boolean;
}

export interface RelationshipListQuery {
  /** Opaque value returned as `nextCursor` by the previous page. */
  cursor?: string;
  limit?: number;
}

/**
 * Stable successful response of GET /users/:identifier/followers, /following
 * and /mutuals. Items are ordered by the date the relation was created, newest
 * first.
 */
export interface RelationshipListResponse {
  kind: RelationshipListKind;
  items: RelationshipMember[];
  nextCursor?: string;
}

export const FOLLOW_SUGGESTION_REASONS = [
  'FOLLOWS_YOU',
  'FOLLOWED_BY_PEOPLE_YOU_FOLLOW',
] as const;
export type FollowSuggestionReason =
  (typeof FOLLOW_SUGGESTION_REASONS)[number];

export interface FollowSuggestion extends RelationshipMember {
  reason: FollowSuggestionReason;
  /** How many accounts the viewer follows also follow this member. */
  mutualCount: number;
}

/** Stable successful response of GET /users/me/suggestions. */
export interface FollowSuggestionsResponse {
  items: FollowSuggestion[];
}
