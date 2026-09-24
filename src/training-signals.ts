import type { IsoDateString } from "./shared";

/**
 * PROG-10: four measures from the owner's logged workouts, the last
 * `TRAINING_SIGNAL_PERIOD_DAYS` days beside the same number of days before.
 * They state what changed and never why: nothing here names a cause, and a
 * marked signal is a threshold crossed, not a conclusion.
 *
 * Every half is placed by when a workout ended, as `PROG-09` does. Deload
 * workouts (`ROUT-16`) are left out of effort, rep targets and declines,
 * because their lighter loads are planned; the workout count names them.
 */
export const TRAINING_SIGNAL_PERIOD_DAYS = 14;

/** Effort: RPE sets needed in each half, on lifts logged with RPE in both. */
export const TRAINING_SIGNAL_MIN_RPE_SETS = 10;
/** Effort is marked when the average RPE rises by at least this much. */
export const TRAINING_SIGNAL_RPE_RISE = 0.5;

/** Rep targets: completed sets with a target needed in each half. */
export const TRAINING_SIGNAL_MIN_TARGET_SETS = 10;
/** Marked when the short share rises by at least this many points... */
export const TRAINING_SIGNAL_SHORT_POINTS_RISE = 10;
/** ...and at least this many sets in the last period fell short. */
export const TRAINING_SIGNAL_MIN_SHORT_SETS = 3;
/** The lifts most often short in the last period, at most this many. */
export const TRAINING_SIGNAL_SHORT_LIFTS_MAX = 3;

/** Declines: a lift's latest sessions compared, oldest first. */
export const TRAINING_SIGNAL_DECLINE_SESSIONS = 3;
/** Listed when each session fell and the total fall is at least this share. */
export const TRAINING_SIGNAL_MIN_DECLINE = 0.025;
/** Largest fall first, at most this many lifts. */
export const TRAINING_SIGNAL_DECLINES_MAX = 5;

/** Workouts are marked when there were at least this many fewer. */
export const TRAINING_SIGNAL_WORKOUT_DROP = 2;

export interface TrainingSignalPeriod {
  /** Exclusive. */
  from: IsoDateString;
  /** Inclusive. */
  to: IsoDateString;
}

export interface EffortPeriod {
  /** Rounded to one decimal. */
  averageRpe: number;
  sets: number;
}

export interface EffortSignal {
  /** Null when either half has fewer than the minimum RPE sets. */
  comparison: {
    recent: EffortPeriod;
    previous: EffortPeriod;
    /** recent minus previous, both rounded first. */
    difference: number;
    /** Lifts logged with RPE in both halves: the only ones counted. */
    lifts: number;
  } | null;
  /** RPE sets on shared lifts, so a missing comparison can say how far off. */
  recentSets: number;
  previousSets: number;
  marked: boolean;
}

export interface RepTargetPeriod {
  /** Completed sets below their target's floor. */
  shortSets: number;
  /** Completed sets with a rep target in the workout's own prescription. */
  targetedSets: number;
  /** Whole percent of targeted sets that were short. */
  shortPercent: number;
}

export interface RepTargetSignal {
  recent: RepTargetPeriod;
  previous: RepTargetPeriod;
  /** Both halves reached the minimum targeted sets. */
  comparable: boolean;
  /** Most short sets first, in the last period only. */
  mostOften: Array<{
    exerciseId: string;
    exerciseName: string;
    shortSets: number;
  }>;
  marked: boolean;
}

export interface DecliningLiftSession {
  sessionId: string;
  performedAt: IsoDateString;
  /** The session's best estimated 1RM of the lift, and the set behind it. */
  estimated1rmKg: number;
  weightKg: number;
  reps: number;
}

export interface DecliningLift {
  exerciseId: string;
  exerciseName: string;
  /** Oldest first; each lower than the one before. */
  sessions: DecliningLiftSession[];
  /** (first - last) / first, to three decimals. */
  declineRatio: number;
}

export interface DeclineSignal {
  /** Lifts with at least the compared sessions across both halves. */
  checkedLifts: number;
  lifts: DecliningLift[];
  marked: boolean;
}

export interface WorkoutPeriod {
  /** Finished and ended-early workouts. */
  workouts: number;
  endedEarly: number;
  deloads: number;
}

export interface WorkoutSignal {
  recent: WorkoutPeriod;
  previous: WorkoutPeriod;
  marked: boolean;
}

/** Stable successful response of GET /workouts/progress/signals. */
export interface TrainingSignalsResponse {
  asOf: IsoDateString;
  periods: {
    recent: TrainingSignalPeriod;
    previous: TrainingSignalPeriod;
  };
  thresholds: {
    periodDays: number;
    minRpeSets: number;
    rpeRise: number;
    minTargetSets: number;
    shortPointsRise: number;
    minShortSets: number;
    declineSessions: number;
    minDecline: number;
    workoutDrop: number;
  };
  effort: EffortSignal;
  repTargets: RepTargetSignal;
  declines: DeclineSignal;
  workouts: WorkoutSignal;
}
