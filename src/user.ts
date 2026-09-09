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
