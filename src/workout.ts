import type {
  IsoDateString,
  MuscleGroup,
  PaginatedResponse,
  ProgressionScheme,
  RepType,
  WorkoutSessionStatus,
} from './shared';

// Workout session contracts -----------------------------------------------

export interface SetLog {
  id: string;
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number | null;
  rpe?: number | null;
  isCompleted: boolean;
  completedAt?: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string;
  routineDayId: string;
  status: WorkoutSessionStatus;
  startedAt: IsoDateString;
  endedAt?: IsoDateString | null;
  durationSec?: number | null;
  notes?: string | null;
  lastActivityAt?: IsoDateString | null;
  setLogs?: SetLog[];
  reused?: boolean;
  routine?: {
    id: string;
    name: string;
    description?: string | null;
  };
  routineDay?: {
    id: string;
    name?: string | null;
    order?: number;
    dayOfWeek?: number;
    exercises: Array<{
      id: string;
      order: number;
      restSeconds?: number | null;
      note?: string | null;
      progressionScheme: ProgressionScheme;
      minWeightIncrement: number;
      exercise: {
        id: string;
        name: string;
        primaryMuscles: MuscleGroup[];
        secondaryMuscles?: MuscleGroup[];
      };
      sets: Array<{
        id: string;
        setNumber: number;
        repType: RepType;
        reps?: number | null;
        minReps?: number | null;
        maxReps?: number | null;
        weight?: number | null;
        rir?: number | null;
      }>;
    }>;
  };
}

/** Completed set from the latest earlier execution of the same routine day. */
export interface PreviousSetPerformance {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number | null;
  rpe?: number | null;
}

/** Stable successful response of GET /workouts/sessions/:id/previous-performance. */
export interface PreviousPerformanceResponse {
  sessionId: string;
  endedAt: IsoDateString;
  sets: PreviousSetPerformance[];
}

export interface StartWorkoutRequest {
  routineId: string;
  routineDayId: string;
  notes?: string;
}

export interface StartWorkoutResponse {
  id: string;
  routineId: string;
  routineDayId: string;
  status: WorkoutSessionStatus;
  startedAt: IsoDateString;
  endedAt?: IsoDateString | null;
  reused: boolean;
}

export type FinishStatus = Extract<WorkoutSessionStatus, 'COMPLETED' | 'ABORTED'>;

export interface FinishWorkoutRequest {
  status: FinishStatus;
  notes?: string;
}

export type ProgressionRule =
  | 'ALL_SETS_REACHED_TARGET'
  | 'SET_REACHED_TARGET';

export interface ProgressionSetChange {
  setNumber: number;
  targetReps: number;
  performedReps: number;
  previousWeightKg: number;
  newWeightKg: number;
}

/** An automatic prescription update produced while completing a session. */
export interface ProgressionChange {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  progressionScheme: Extract<
    ProgressionScheme,
    'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION'
  >;
  rule: ProgressionRule;
  minWeightIncrementKg: number;
  sets: ProgressionSetChange[];
}

/** Stable successful response of PATCH /workouts/sessions/:id/finish. */
export interface FinishWorkoutResponse {
  session: WorkoutSession;
  progressionChanges: ProgressionChange[];
  recap: WorkoutSessionRecap | null;
}

export interface UpsertSetLogRequest {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted?: boolean;
}

export type PersonalRecordKind =
  | 'WEIGHT'
  | 'REPS'
  | 'VOLUME'
  | 'ESTIMATED_1RM';

/** A record frontier crossed by the set mutation that produced this response. */
export interface EarnedPersonalRecord {
  kind: PersonalRecordKind;
  exerciseId: string;
  exerciseName: string;
  /** Canonical kg for every kind except REPS, where this is a repetition count. */
  value: number;
  /** Missing when this is the first completed result for that record kind. */
  previousBest?: number | null;
}

/** Stable successful response of PUT /workouts/sessions/:id/set-logs. */
export interface UpsertSetLogResponse {
  setLog: SetLog;
  earnedRecords: EarnedPersonalRecord[];
}

/** Final record frontier earned by one completed session. */
export interface SessionRecapRecord extends EarnedPersonalRecord {
  setNumber: number;
  achievedAt: IsoDateString;
}

/** Metrics from the latest earlier execution of the same routine day. */
export interface PreviousSessionRecap {
  sessionId: string;
  endedAt: IsoDateString;
  durationSec: number;
  totalVolumeKg: number;
  completedSets: number;
  durationDeltaSec: number;
  volumeDeltaKg: number;
  completedSetsDelta: number;
}

/** Stable successful response of GET /workouts/sessions/:id/recap. */
export interface WorkoutSessionRecap {
  sessionId: string;
  routineName: string;
  dayName?: string | null;
  startedAt: IsoDateString;
  endedAt: IsoDateString;
  durationSec: number;
  totalVolumeKg: number;
  completedSets: number;
  notes?: string | null;
  records: SessionRecapRecord[];
  progressionChanges: ProgressionChange[];
  previousSession: PreviousSessionRecap | null;
}

export interface WorkoutSessionSummary {
  id: string;
  status: WorkoutSessionStatus;
  startedAt: IsoDateString;
  endedAt?: IsoDateString | null;
  durationSec?: number | null;
  totalVolume?: number | null;
  totalSets?: number | null;
  totalExercises?: number | null;
  notes?: string | null;
  routine: {
    id: string;
    name: string;
    dayName?: string | null;
  };
}

export interface ListSessionsParams {
  status?: WorkoutSessionStatus;
  routineId?: string;
  from?: IsoDateString;
  to?: IsoDateString;
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: 'finishedAt:desc' | 'finishedAt:asc' | 'startedAt:desc' | 'startedAt:asc';
}

export type WorkoutSessionListResponse = PaginatedResponse<WorkoutSessionSummary>;

// Workout statistics contracts --------------------------------------------

export interface WorkoutStatsQuery {
  weekStart: IsoDateString;
  weekEnd: IsoDateString;
  timeZone: string;
}

export interface WorkoutStatsResponse {
  totalCompleted: number;
  completionRate: number;
  weeklyWorkoutsCount: number;
  activeDaysThisWeek: number;
}
