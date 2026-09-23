import type { IsoDateString } from "./shared";

/**
 * LIVE-17. Correcting a finished workout: the owner fixes a mistyped weight,
 * reps or RPE, or a set left unticked, and everything the workout fed --
 * records, totals, achievements, its own load changes and the activity built
 * from them -- is re-derived from the corrected sets.
 *
 * Only the most recent completed workout can be corrected, for a bounded time
 * and until another workout starts, because the next workout is built on this
 * one: its "last time", the loads it prescribes and the records it is measured
 * against. Every saved correction is kept, with the values before and after.
 */

/** How long after finishing a workout it can still be corrected. */
export const SESSION_CORRECTION_WINDOW_HOURS = 48;

/** Saved corrections per workout, so the trail stays readable. */
export const SESSION_CORRECTIONS_MAX = 10;

/**
 * Bounds a corrected value must respect. Weight is kilograms. The live logging
 * path is looser; a correction exists to replace an implausible value, so it
 * does not accept one.
 */
export const SESSION_CORRECTION_LIMITS = {
  weightKgMax: 1500,
  repsMax: 1000,
  rpeMin: 0,
  rpeMax: 10,
} as const;

/** The four things a correction can change on one logged set. */
export interface SetLogValues {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  isCompleted: boolean;
}

/** One changed set, as it was and as it became. */
export interface SessionSetCorrection {
  setLogId: string;
  exerciseId: string;
  /** As named when the correction was saved. */
  exerciseName: string;
  setNumber: number;
  before: SetLogValues;
  after: SetLogValues;
}

/** One saved correction. Never edited or deleted once written. */
export interface SessionCorrection {
  id: string;
  createdAt: IsoDateString;
  changes: SessionSetCorrection[];
}

export type SessionCorrectionClosedReason =
  | "NOT_COMPLETED"
  | "NOT_LATEST"
  | "LATER_SESSION"
  | "WINDOW_PASSED"
  | "LIMIT_REACHED";

/**
 * Whether the workout can be corrected now. `correctableUntil` is set only
 * while it can; `closedReason` says why it cannot.
 */
export interface SessionCorrectionWindow {
  correctableUntil: IsoDateString | null;
  closedReason: SessionCorrectionClosedReason | null;
}

/** GET /workouts/sessions/:id/corrections */
export interface SessionCorrectionsResponse {
  window: SessionCorrectionWindow;
  /** Oldest first. */
  corrections: SessionCorrection[];
}

export interface CorrectSessionSetRequest extends SetLogValues {
  setLogId: string;
}

/**
 * POST /workouts/sessions/:id/corrections. Each set carries all four values
 * as they should now read; sets that end up unchanged are ignored, and a
 * request that changes nothing is refused.
 */
export interface CorrectSessionRequest {
  sets: CorrectSessionSetRequest[];
}

export interface CorrectSessionResponse {
  correction: SessionCorrection;
  window: SessionCorrectionWindow;
  /**
   * Exercises whose load change from this workout was left as it is, because
   * the routine was edited after the workout and re-deriving it would undo
   * that edit.
   */
  progressionKept: Array<{ exerciseId: string; exerciseName: string }>;
}

/**
 * The window rule, shared so the server and the page state it the same way.
 * `isLatest` means no other completed workout ended later; `laterSessionStarted`
 * means any workout started after this one ended.
 */
export function sessionCorrectionWindow(
  input: {
    status: string;
    endedAt: IsoDateString | Date | null | undefined;
    isLatest: boolean;
    laterSessionStarted: boolean;
    correctionCount: number;
  },
  now: Date = new Date(),
): SessionCorrectionWindow {
  const closed = (
    closedReason: SessionCorrectionClosedReason,
  ): SessionCorrectionWindow => ({ correctableUntil: null, closedReason });
  if (input.status !== "COMPLETED" || !input.endedAt)
    return closed("NOT_COMPLETED");
  if (!input.isLatest) return closed("NOT_LATEST");
  if (input.laterSessionStarted) return closed("LATER_SESSION");
  const until = new Date(
    new Date(input.endedAt).getTime() +
      SESSION_CORRECTION_WINDOW_HOURS * 3600 * 1000,
  );
  if (now.getTime() >= until.getTime()) return closed("WINDOW_PASSED");
  if (input.correctionCount >= SESSION_CORRECTIONS_MAX)
    return closed("LIMIT_REACHED");
  return { correctableUntil: until.toISOString(), closedReason: null };
}

/** Whether two sets of values differ in anything a correction records. */
export function setLogValuesDiffer(a: SetLogValues, b: SetLogValues): boolean {
  return (
    a.weight !== b.weight ||
    a.reps !== b.reps ||
    a.rpe !== b.rpe ||
    a.isCompleted !== b.isCompleted
  );
}
