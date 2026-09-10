import type { WorkoutSession } from './workout';

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
