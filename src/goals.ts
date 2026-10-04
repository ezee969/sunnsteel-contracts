import type { IsoDateString } from "./shared";

export const MEASURABLE_GOAL_TYPES = [
  "WEEKLY_SESSIONS",
  "WEEKLY_VOLUME",
  "STREAK_DAYS",
  "EXERCISE_ESTIMATED_1RM",
  "BODY_WEIGHT",
] as const;
export type MeasurableGoalType = (typeof MEASURABLE_GOAL_TYPES)[number];

export const MEASURABLE_GOAL_DIRECTIONS = ["AT_LEAST", "AT_MOST"] as const;
export type MeasurableGoalDirection =
  (typeof MEASURABLE_GOAL_DIRECTIONS)[number];

export const MEASURABLE_GOALS_MAX = 8;

export interface MeasurableGoalExercise {
  id: string;
  name: string;
}

/** A private target stored in canonical units (kg where applicable). */
export interface MeasurableGoal {
  id: string;
  type: MeasurableGoalType;
  targetValue: number;
  direction: MeasurableGoalDirection;
  exercise?: MeasurableGoalExercise | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface MeasurableGoalInput {
  id?: string;
  type: MeasurableGoalType;
  targetValue: number;
  /** Only BODY_WEIGHT may use AT_MOST; every other goal is AT_LEAST. */
  direction?: MeasurableGoalDirection;
  /** Required only for EXERCISE_ESTIMATED_1RM. */
  exerciseId?: string;
}

export interface ReplaceMeasurableGoalsRequest {
  goals: MeasurableGoalInput[];
}

export interface PersonalGoalProgress extends MeasurableGoal {
  currentValue: number | null;
  remainingValue: number | null;
  progressPercent: number | null;
  achieved: boolean | null;
  /** Monday-based local week for WEEKLY_SESSIONS and WEEKLY_VOLUME. */
  periodStart?: string;
}

/** Stable successful response of GET /workouts/progress/goals. */
export interface PersonalGoalsResponse {
  timeZone: string;
  asOf: IsoDateString;
  goals: PersonalGoalProgress[];
}

// Goal suggestions (ACH-06) ---------------------------------------------------
//
// The product proposes, the member accepts, and an accepted suggestion is an
// ordinary goal with no end date: there is no second target system. Every
// number comes from the member's own data, and a suggestion is offered only
// for a goal type the member does not have yet. Body weight and streaks are
// never suggested.

/** At most this many suggestions, and never more than the free goal slots. */
export const GOAL_SUGGESTIONS_MAX = 3;
/** Weekly volume is suggested at the average of this many complete weeks. */
export const GOAL_SUGGESTION_VOLUME_WEEKS = 4;
/** ...and only when at least this many of them had any volume. */
export const GOAL_SUGGESTION_MIN_ACTIVE_WEEKS = 2;
/** The most-trained lift is chosen from this many days of finished workouts. */
export const GOAL_SUGGESTION_LIFT_WINDOW_DAYS = 56;
/** ...from lifts trained in at least this many of those workouts. */
export const GOAL_SUGGESTION_LIFT_MIN_SESSIONS = 3;
/** The strength suggestion is the current best estimated 1RM plus this share. */
export const GOAL_SUGGESTION_STRENGTH_STEP = 0.025;
/** Dismissals kept per account; the oldest go first. */
export const GOAL_SUGGESTION_DISMISSALS_MAX = 20;

export const GOAL_SUGGESTION_TYPES = [
  "WEEKLY_SESSIONS",
  "WEEKLY_VOLUME",
  "EXERCISE_ESTIMATED_1RM",
] as const;
export type GoalSuggestionType = (typeof GOAL_SUGGESTION_TYPES)[number];

/** Where a suggested number came from, so the screen can say it. */
export type GoalSuggestionBasis =
  | {
      kind: "PLAN";
      /** Workouts the member's routines plan in the current week. */
      plannedWorkouts: number;
      weekStart: string;
    }
  | {
      kind: "RECENT_VOLUME";
      /** kg, averaged over `weeks` complete weeks before this one. */
      averageVolumeKg: number;
      weeks: number;
      activeWeeks: number;
    }
  | {
      kind: "BEST_ESTIMATED_1RM";
      /** kg, the member's current best for the lift. */
      bestEstimated1rmKg: number;
      /** Finished workouts with the lift in the window. */
      sessions: number;
      windowDays: number;
    };

export interface GoalSuggestion {
  /** Stable per suggestion: the type, and the exercise for a strength goal. */
  key: string;
  type: GoalSuggestionType;
  /** Canonical units, as a goal stores it (kg for volume and strength). */
  targetValue: number;
  direction: "AT_LEAST";
  exercise: MeasurableGoalExercise | null;
  basis: GoalSuggestionBasis;
}

/** GET /workouts/progress/goal-suggestions */
export interface GoalSuggestionsResponse {
  timeZone: string;
  asOf: IsoDateString;
  /** Goal slots left under MEASURABLE_GOALS_MAX. */
  freeSlots: number;
  suggestions: GoalSuggestion[];
}

/**
 * POST /workouts/progress/goal-suggestions/dismissals. "Not now" hides the
 * suggestion with this key while it would suggest this same number.
 */
export interface DismissGoalSuggestionRequest {
  key: string;
  targetValue: number;
}

export function goalSuggestionKey(
  type: GoalSuggestionType,
  exerciseId?: string | null,
): string {
  return type === "EXERCISE_ESTIMATED_1RM" ? `${type}:${exerciseId ?? ""}` : type;
}

/** Whether a key names a suggestion this version can make. */
export function isGoalSuggestionKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 120) return false;
  if (value === "WEEKLY_SESSIONS" || value === "WEEKLY_VOLUME") return true;
  return /^EXERCISE_ESTIMATED_1RM:[A-Za-z0-9-]{1,80}$/.test(value);
}
