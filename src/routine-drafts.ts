import type { AppLocale } from "./locale";
import type { RoutineScheduleMode } from "./routine";

/**
 * INTEL-03: a Pro member describes what they want and receives a routine
 * draft for the wizard. The server asks the model, checks the answer against
 * the catalog and these bounds, and hands back a draft; **nothing is stored
 * until the member presses Create**, through the ordinary routine write.
 */

/** What the member may type. */
export const ROUTINE_DRAFT_REQUEST_MIN = 10;
export const ROUTINE_DRAFT_REQUEST_MAX = 1000;

/** The bounds a draft must keep, so a sane request cannot open an insane plan. */
export const ROUTINE_DRAFT_NAME_MAX = 60;
export const ROUTINE_DRAFT_DESCRIPTION_MAX = 280;
export const ROUTINE_DRAFT_EXERCISES_PER_DAY_MAX = 10;
export const ROUTINE_DRAFT_SETS_PER_EXERCISE_MAX = 6;
export const ROUTINE_DRAFT_SETS_PER_DAY_MAX = 30;
/** Direct sets a week for one muscle, counting primary muscles only. */
export const ROUTINE_DRAFT_WEEKLY_MUSCLE_SETS_MAX = 30;
export const ROUTINE_DRAFT_REPS_MIN = 1;
export const ROUTINE_DRAFT_REPS_MAX = 30;
export const ROUTINE_DRAFT_REST_SECONDS_MIN = 30;
export const ROUTINE_DRAFT_REST_SECONDS_MAX = 300;

/** `POST /routine-drafts`. */
export interface CreateRoutineDraftRequest {
  /** The member's own words. Never stored. */
  request: string;
  /** The language the draft's name and day names are written in. */
  locale: AppLocale;
}

/** One exercise of a draft: a catalog id and working sets, never a load. */
export interface RoutineDraftExercise {
  exerciseId: string;
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
  minWeightIncrement: number;
}

export interface RoutineDraftDay {
  /** The weekday (0=Sun..6=Sat) on a weekly routine; the position on a rotation. */
  slot: number;
  name: string;
  exercises: RoutineDraftExercise[];
}

export interface RoutineDraft {
  name: string;
  description: string;
  scheduleMode: RoutineScheduleMode;
  days: RoutineDraftDay[];
}

/**
 * Whether a draft can be asked for now. QUOTA_REACHED is this member's month;
 * PAUSED is the month's cost ceiling across all members; UNAVAILABLE means no
 * model is configured.
 */
export const ROUTINE_DRAFT_STATES = [
  "READY",
  "QUOTA_REACHED",
  "PAUSED",
  "UNAVAILABLE",
] as const;
export type RoutineDraftState = (typeof ROUTINE_DRAFT_STATES)[number];

/** `GET /routine-drafts/usage`. Only a delivered draft counts. */
export interface RoutineDraftUsage {
  state: RoutineDraftState;
  used: number;
  /** The plan's monthly drafts. */
  limit: number;
  /** When the month ends: the first of the next month, UTC. */
  resetsAt: string;
}

export interface RoutineDraftResult {
  draft: RoutineDraft;
  usage: RoutineDraftUsage;
}
