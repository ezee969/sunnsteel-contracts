import type { RoutineScheduleMode, RoutineVersionSetup } from './routine';
import type { IsoDateString } from './shared';

// Routine sharing (ROUT-04) --------------------------------------------------
//
// A shared routine is the **prescription**: days, exercises, sets, reps, rest,
// target loads and progression. It is never the owner's training — no sessions,
// records, notes or logs travel with it, and nothing here can express them.
// That is why the payload reuses `RoutineVersionSetup`, the shape the product
// already uses for "a routine as data", instead of a parallel one that could
// drift into carrying performance.

/**
 * Per-routine visibility. The account-level `PROF-06` routines rule is the
 * upper bound: a routine marked `PUBLIC` inside an account whose routines are
 * `FOLLOWERS` is visible to followers only, the same way `SOC-04` bounds
 * activity by the profile section it comes from.
 */
export const ROUTINE_VISIBILITY_VALUES = [
  'PRIVATE',
  'FOLLOWERS',
  'PUBLIC',
] as const;
export type RoutineVisibility = (typeof ROUTINE_VISIBILITY_VALUES)[number];

/** One routine keeps at most this many active links. */
export const ROUTINE_SHARE_MAX_ACTIVE_LINKS = 10;

/** PUT /routines/:id/visibility */
export interface UpdateRoutineVisibilityRequest {
  visibility: RoutineVisibility;
}

/** An active share link, visible only to the routine's owner. */
export interface RoutineShare {
  id: string;
  routineId: string;
  /** Unguessable identifier used in the public `/shared/routines/:token` URL. */
  token: string;
  createdAt: IsoDateString;
}

/** Stable successful response of GET /routines/:id/shares. */
export interface RoutineShareListResponse {
  items: RoutineShare[];
}

export interface SharedRoutineOwner {
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * How a reader reached a routine. A link is the owner's explicit consent for
 * that one routine and ignores visibility; a visibility read is governed by
 * both the routine's own rule and the account's.
 */
export const SHARED_ROUTINE_SOURCES = ['LINK', 'VISIBILITY'] as const;
export type SharedRoutineSource = (typeof SHARED_ROUTINE_SOURCES)[number];

/**
 * Stable successful response of the unauthenticated
 * GET /shared/routines/:token, and of the authenticated member read.
 */
export interface SharedRoutine {
  /** Kept so a future clone (`ROUT-05`) can record what it came from. */
  routineId: string;
  setup: RoutineVersionSetup;
  owner: SharedRoutineOwner;
  source: SharedRoutineSource;
  /** When the routine was last changed, not when it was shared. */
  updatedAt: IsoDateString;
}

/** A routine in a member's visible list, without loading its whole setup. */
export interface SharedRoutineSummary {
  routineId: string;
  name: string;
  description: string | null;
  scheduleMode: RoutineScheduleMode;
  dayCount: number;
  exerciseCount: number;
  updatedAt: IsoDateString;
}

/** Stable successful response of GET /users/:identifier/routines. */
export interface MemberRoutinesResponse {
  routines: SharedRoutineSummary[];
}
