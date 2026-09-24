import type { EffortSignal, RepTargetPeriod } from "./training-signals";

/**
 * PROG-11: a training block beside the block before it on the same routine,
 * or, for the first block, beside the same number of days before it began.
 * A block still running is compared up to today, and the period before it is
 * cut to the same number of days. Only that routine's workouts count, placed
 * by the owner-local date they ended. The numbers are stated side by side and
 * never ranked: nothing here says which period was better.
 */
export const TRAINING_BLOCK_COMPARISON_MAX_DAYS = 365;

export type BlockComparisonPeriodKind = "TRAINING_BLOCK" | "BEFORE_BLOCK";

export interface BlockComparisonPeriod {
  kind: BlockComparisonPeriodKind;
  /** The block's name; null for the days before the first block. */
  name: string | null;
  seriesId: string | null;
  /** Owner-local calendar dates, inclusive. */
  startDate: string;
  endDate: string;
  days: number;
  /**
   * Days the plan in force had a workout on, up to today; null for a
   * rotation without training weekdays, which has no dated plan.
   */
  plannedWorkouts: number | null;
  /** Workouts with at least one completed set. */
  workouts: number;
  endedEarly: number;
  deloads: number;
  completedSets: number;
  /** External load x reps; bodyweight sets add nothing. */
  volumeKg: number;
  perWeek: {
    workouts: number;
    completedSets: number;
    volumeKg: number;
  };
  /** Sets short of their snapshot rep target, deload workouts left out. */
  repTargets: RepTargetPeriod;
}

export interface BlockComparisonLiftBest {
  estimated1rmKg: number;
  weightKg: number;
  reps: number;
}

export interface BlockComparisonLift {
  exerciseId: string;
  exerciseName: string;
  current: BlockComparisonLiftBest;
  previous: BlockComparisonLiftBest;
  /** current minus previous, one decimal. */
  changeKg: number;
  /** Relative to previous, one decimal. */
  changePercent: number;
}

/** Stable successful response of GET /routines/:id/training-blocks/:seriesId/comparison. */
export interface TrainingBlockComparisonResponse {
  routineId: string;
  /** The owner-local date the comparison was made on. */
  today: string;
  /** The block has not ended, so both periods stop at the days elapsed. */
  isRunning: boolean;
  /** A period was longer than the maximum and was cut to its latest days. */
  truncated: boolean;
  current: BlockComparisonPeriod;
  previous: BlockComparisonPeriod;
  /**
   * The PROG-10 effort rule across the two periods: average RPE on the lifts
   * rated in both, `recent` being the block.
   */
  effort: EffortSignal;
  /** Lifts trained in both periods, alphabetically. */
  lifts: BlockComparisonLift[];
}
