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

/**
 * ROUT-06. Where a cloned routine came from. It is recorded on the clone and
 * never on the source, so a routine cannot learn who copied it. It is served
 * only to a viewer who could read the source anyway: lineage must not become
 * a way to discover that a private routine exists.
 */
export interface RoutineLineage {
  /** The routine this one was cloned from, when the viewer may read it. */
  sourceRoutineId: string | null;
  /** The original author's public identity, when they still have one. */
  author: SharedRoutineOwner | null;
  /**
   * True when the source exists but this viewer may not read it, or its author
   * is gone. The clone still says it was cloned; it just cannot say from what.
   */
  isSourceHidden: boolean;
  clonedAt: IsoDateString;
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

// Routine cloning (ROUT-05) ---------------------------------------------------
//
// A clone is a new routine of the viewer's own, built from the prescription
// they were allowed to read. It reuses `SharedRoutine.setup` — the same
// `RoutineVersionSetup` a `ROUT-08` version stores — so what is copied is
// exactly what was shared: the programme, never the original owner's training.
// The clone is independent from the moment it exists; changing either routine
// afterwards does nothing to the other. Recording where it came from is
// `ROUT-06`, deliberately not this.

/**
 * POST /routines/clones. Exactly one source, matching the two ways a routine
 * can be read: `token` for a private link, `routineId` for one the viewer may
 * already see. Sending both, or neither, is refused.
 */
export interface CloneRoutineRequest {
  /** The `/shared/routines/:token` link the reader followed. */
  token?: string;
  /** A routine the viewer may read under `ROUT-04` visibility. */
  routineId?: string;
}

/** The refusals a clone states by name rather than as a bare 4xx. */
export const CLONE_ROUTINE_REFUSALS = {
  /** Neither `token` nor `routineId`, or both at once. */
  SOURCE_REQUIRED: 'SOURCE_REQUIRED',
  /** An exercise the routine programs is no longer in the catalog. */
  UNKNOWN_EXERCISE: 'UNKNOWN_EXERCISE',
} as const;
export type CloneRoutineRefusal =
  (typeof CLONE_ROUTINE_REFUSALS)[keyof typeof CLONE_ROUTINE_REFUSALS];
