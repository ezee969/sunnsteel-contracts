import type { IsoDateString } from './shared';
import type { UserSearchResponse } from './user';

/** SOC-08: one explicit grant from a member to their active training partner. */
export interface TrainingPartnerPermissions {
  schedule: boolean;
  progress: boolean;
  activity: boolean;
  routines: boolean;
  encouragement: boolean;
}

export const TRAINING_PARTNER_PERMISSION_KEYS = [
  'schedule',
  'progress',
  'activity',
  'routines',
  'encouragement',
] as const satisfies readonly (keyof TrainingPartnerPermissions)[];

export const TRAINING_PARTNERS_MAX = 20;
export const TRAINING_PARTNER_REQUESTS_PER_DAY_MAX = 10;

/** SOC-09: the complete, non-free-text encouragement vocabulary. */
export const TRAINING_PARTNER_ENCOURAGEMENT_KINDS = [
  'READY_TO_TRAIN',
  'STRONG_SESSION',
  'GOOD_WORK',
  'KEEP_GOING',
] as const;
export type TrainingPartnerEncouragementKind =
  (typeof TRAINING_PARTNER_ENCOURAGEMENT_KINDS)[number];

/** Per sender/recipient pair over a rolling window, not a calendar boundary. */
export const TRAINING_PARTNER_ENCOURAGEMENTS_PER_24_HOURS_MAX = 4;

export const TRAINING_PARTNERSHIP_STATUSES = ['PENDING', 'ACTIVE'] as const;
export type TrainingPartnershipStatus =
  (typeof TRAINING_PARTNERSHIP_STATUSES)[number];

/** One relationship as seen by either of its two members. */
export interface TrainingPartnership {
  id: string;
  status: TrainingPartnershipStatus;
  member: UserSearchResponse;
  requestedByMe: boolean;
  permissionsGrantedByMe: TrainingPartnerPermissions;
  permissionsGrantedToMe: TrainingPartnerPermissions;
  createdAt: IsoDateString;
  acceptedAt?: IsoDateString;
}

export interface TrainingPartnershipsResponse {
  items: TrainingPartnership[];
}

export type UpdateTrainingPartnerPermissionsRequest =
  TrainingPartnerPermissions;

/**
 * Schedule access deliberately exposes dates and state, not routine names or
 * prescriptions. Those are governed independently by the routines grant.
 */
export interface TrainingPartnerScheduleDay {
  date: string;
  plannedWorkoutCount: number;
  trained: boolean;
}

export interface TrainingPartnerScheduleResponse {
  timeZone: string;
  days: TrainingPartnerScheduleDay[];
}

export interface SendTrainingPartnerEncouragementRequest {
  kind: TrainingPartnerEncouragementKind;
}

export interface SendTrainingPartnerEncouragementResponse {
  notificationId: string;
  sentAt: IsoDateString;
}
