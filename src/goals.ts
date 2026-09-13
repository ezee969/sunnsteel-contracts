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
