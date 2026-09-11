import type { ProgressionChange, WorkoutSession } from './workout';
import type {
  MuscleGroup,
  ProgressionScheme,
  RepType,
  WorkoutSessionStatus,
} from './shared';

export const TRAINING_EVENT_TYPES = [
  'SESSION_COMPLETED',
  'PERSONAL_RECORD',
  'PROGRESSION_CHANGED',
] as const;
export type TrainingEventType = (typeof TRAINING_EVENT_TYPES)[number];

/** Stable successful response of GET /workouts/progress. */
export interface WorkoutProgressQuery { timeZone: string }
export interface PersonalRecordEntry {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1rm: number;
  achievedAt: string;
}
export interface RecentActivityEntry {
  sessionId: string;
  routineId: string;
  routineName: string;
  dayName: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  totalVolumeKg: number;
  completedSets: number;
}
export interface WorkoutProgressResponse {
  totalVolumeKg: number;
  currentStreakDays: number;
  bestStreakDays: number;
  personalRecords: PersonalRecordEntry[];
  recentActivity: RecentActivityEntry[];
}

export interface ExerciseStrengthTrendQuery {
  exerciseId?: string;
  from?: string;
  to?: string;
}

export interface ExerciseStrengthSummary {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  estimated1rmKg: number;
  achievedAt: string;
}

export interface ExerciseStrengthTrendPoint {
  sessionId: string;
  achievedAt: string;
  weightKg: number;
  reps: number;
  estimated1rmKg: number;
}

/** Stable successful response of GET /workouts/progress/strength. */
export interface ExerciseStrengthTrendResponse {
  exercises: ExerciseStrengthSummary[];
  selectedExercise: ExerciseStrengthSummary | null;
  range: {
    from: string | null;
    to: string;
  };
  baseline: ExerciseStrengthTrendPoint | null;
  points: ExerciseStrengthTrendPoint[];
  truncated: boolean;
}

export interface ExercisePerformanceHistoryQuery {
  exerciseId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface ExercisePerformanceSummary {
  exerciseId: string;
  exerciseName: string;
  lastPerformedAt: string;
  hasStrengthTrend: boolean;
}

export interface ExercisePerformanceSet {
  routineExerciseId: string;
  setNumber: number;
  reps: number;
  weightKg?: number | null;
  rpe?: number | null;
}

export interface ExercisePerformancePrescriptionSet {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weightKg?: number | null;
  rir?: number | null;
}

export interface ExercisePerformancePrescription {
  routineExerciseId: string;
  restSeconds?: number | null;
  note?: string | null;
  progressionScheme: ProgressionScheme;
  minWeightIncrementKg: number;
  sets: ExercisePerformancePrescriptionSet[];
}

export interface ExercisePerformanceSession {
  sessionId: string;
  status: Extract<WorkoutSessionStatus, 'COMPLETED' | 'ABORTED'>;
  routineName: string;
  dayName?: string | null;
  startedAt: string;
  endedAt: string;
  durationSec?: number | null;
  sessionNotes?: string | null;
  sets: ExercisePerformanceSet[];
  prescriptions: ExercisePerformancePrescription[];
  progressionChanges: ProgressionChange[];
}

/** Stable successful response of GET /workouts/progress/performance. */
export interface ExercisePerformanceHistoryResponse {
  exercises: ExercisePerformanceSummary[];
  selectedExercise: ExercisePerformanceSummary | null;
  items: ExercisePerformanceSession[];
  nextCursor?: string;
}

export interface MuscleGroupHeatmapQuery {
  timeZone: string;
  /** Number of Monday-based calendar weeks to return, including this week. */
  weeks?: number;
}

export interface MuscleGroupHeatmapValue {
  muscle: MuscleGroup;
  /** Completed-set equivalents: primary muscles count 1, secondary count 0.5. */
  weightedSets: number;
}

export interface MuscleGroupHeatmapWeek {
  weekStart: string;
  isCurrentWeek: boolean;
  totalWeightedSets: number;
  muscles: MuscleGroupHeatmapValue[];
}

/** Stable successful response of GET /workouts/progress/muscles. */
export interface MuscleGroupHeatmapResponse {
  timeZone: string;
  weeks: MuscleGroupHeatmapWeek[];
  peakWeightedSets: number;
}

/** Immutable prescription captured before any sets or progression. */
export interface WorkoutSessionSnapshotV1 {
  schemaVersion: 1;
  sessionId: string;
  sourceRoutineId: string;
  sourceRoutineDayId: string;
  capturedAt: string;
  provenance: 'CAPTURED' | 'APPROXIMATED';
  notes: string | null;
  routine: NonNullable<WorkoutSession['routine']>;
  routineDay: NonNullable<WorkoutSession['routineDay']>;
}

export interface SetAccountTimeZoneRequest {
  timeZone: string;
  /** Bootstrap must not replace a zone registered by another device. */
  onlyIfUnset?: boolean;
}
export interface WorkoutAnalyticsStatus {
  timeZone: string | null;
  requestedTimeZone: string | null;
  state: 'UNINITIALIZED' | 'BUILDING' | 'READY' | 'FAILED';
  generationId: string | null;
}
