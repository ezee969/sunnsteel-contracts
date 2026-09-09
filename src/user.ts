import type {
  IsoDateString,
  Sex,
  WeightUnit,
} from './shared';

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
