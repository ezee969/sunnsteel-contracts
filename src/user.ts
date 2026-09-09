import type {
  IsoDateString,
  Sex,
  WeightUnit,
} from './shared';
import type { PersonalRecordEntry } from './analytics';

// User contracts ----------------------------------------------------------

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN_SOURCE =
  '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$';
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

export interface ProfilePrivacySettings {
  workoutHistory: ProfileVisibility;
  records: ProfileVisibility;
  routines: ProfileVisibility;
  achievements: ProfileVisibility;
  bodyMetrics: ProfileVisibility;
}

export interface ProfileViewerAccess {
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

export interface UserProfile {
  timeZone?: string | null;
  id: string;
  email: string;
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  sex?: Sex | null;
  weight?: number | null;
  height?: number | null;
  weightUnit: WeightUnit;
  privacySettings: ProfilePrivacySettings;
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
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  followerCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  viewerAccess: ProfileViewerAccess;
  trainingSummary?: PublicTrainingSummary;
  personalRecords?: PersonalRecordEntry[];
  bodyMetrics?: PublicBodyMetrics;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  sex?: Sex | null;
  weight?: number | null;
  height?: number | null;
  weightUnit?: WeightUnit;
}

export type UpdateProfilePrivacyRequest = ProfilePrivacySettings;

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
