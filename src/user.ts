import type {
  IsoDateString,
  Sex,
  WeightUnit,
} from './shared';

// User contracts ----------------------------------------------------------

export interface UserProfile {
  timeZone?: string | null;
  id: string;
  email: string;
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
  name?: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  sex?: Sex | null;
  weight?: number | null;
  height?: number | null;
  weightUnit?: WeightUnit;
}

export interface UserSearchResponse {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
}
