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

export interface UpsertSetLogRequest {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted?: boolean;
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
