import type { SessionTrainingBlock } from './training-blocks';
import type {
  IsoDateString,
  MuscleGroup,
  PaginatedResponse,
  ProgressionScheme,
  RepType,
  WeightUnit,
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
  /**
   * LIVE-11: slots performed with a different exercise in this session. The
   * routine day (snapshot) keeps the original prescription; set logs for a
   * substituted slot carry the substitute's `exerciseId`.
   */
  exerciseSubstitutions?: SessionExerciseSubstitution[];
  /**
   * LIVE-16: what the owner noted about one exercise in this workout. The
   * routine's own note (`routineDay.exercises[].note`) is the standing
   * instruction and is never written from a session.
   */
  exerciseNotes?: SessionExerciseNote[];
  reused?: boolean;
  /**
   * ROUT-15: the training block this session trained, or null when it
   * trained the routine's baseline. Copied at start, so a later revision or
   * the block's end never rewrites what the session was.
   */
  trainingBlock?: SessionTrainingBlock | null;
  routine?: {
    id: string;
    name: string;
    description?: string | null;
  };
  routineDay?: {
    id: string;
    name?: string | null;
    order?: number;
    /** Null on a ROTATION routine day (ROUT-11). */
    dayOfWeek?: number | null;
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

/**
 * LIVE-11: an exercise performed in place of one routine slot for a single
 * session. The substitute's muscles are captured when the swap is made, so
 * later catalog changes cannot rewrite what the session trained.
 */
export interface SessionExerciseSubstitution {
  /** The replaced slot, as in `routineDay.exercises[].id`. */
  routineExerciseId: string;
  exercise: {
    id: string;
    name: string;
    primaryMuscles: MuscleGroup[];
    secondaryMuscles: MuscleGroup[];
  };
  substitutedAt: IsoDateString;
}

// Session notes (LIVE-16) -------------------------------------------------

export const SESSION_NOTE_MAX_LENGTH = 2000;
export const SESSION_EXERCISE_NOTE_MAX_LENGTH = 500;

/** One exercise's note for one workout, keyed by its routine slot. */
export interface SessionExerciseNote {
  /** The slot, as in `routineDay.exercises[].id`. */
  routineExerciseId: string;
  note: string;
}

/**
 * Body of PUT /workouts/sessions/:id/notes. Partial: an omitted field keeps
 * what is stored, `null` or an empty string clears it. Exercise notes merge
 * by slot, so two notes saved moments apart cannot overwrite each other.
 */
export interface UpdateSessionNotesRequest {
  notes?: string | null;
  exerciseNotes?: Array<{ routineExerciseId: string; note: string | null }>;
}

export interface UpdateSessionNotesResponse {
  notes: string | null;
  exerciseNotes: SessionExerciseNote[];
}

/** Body of PUT /workouts/sessions/:id/exercises/:routineExerciseId/substitution. */
export interface SubstituteSessionExerciseRequest {
  exerciseId: string;
  /** Also use this exercise in the routine from the next session on. */
  applyToRoutine?: boolean;
}

/**
 * Stable successful response of the substitution PUT and DELETE. A swap is
 * refused once the slot has a completed set; incomplete drafts for the slot
 * are cleared because their values belonged to the other exercise.
 */
export interface SubstituteSessionExerciseResponse {
  session: WorkoutSession;
  /** True only when `applyToRoutine` was asked for and the routine still has the slot. */
  routineUpdated: boolean;
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
  /** LIVE-16: exercise notes of this workout, named, in the day's order. */
  exerciseNotes?: SessionRecapExerciseNote[];
  records: SessionRecapRecord[];
  progressionChanges: ProgressionChange[];
  previousSession: PreviousSessionRecap | null;
}

export interface SessionRecapExerciseNote {
  routineExerciseId: string;
  exerciseName: string;
  note: string;
}

// Session sharing (SOC-07) -------------------------------------------------

/** Parts of a completed session's recap the owner may choose to share. */
export const SESSION_SHARE_FIELDS = [
  'duration',
  'volume',
  'completedSets',
  'records',
  'progression',
  'notes',
] as const;
export type SessionShareField = (typeof SESSION_SHARE_FIELDS)[number];

/** Pre-selected when creating a link; notes and prescriptions are opt-in. */
export const SESSION_SHARE_DEFAULT_FIELDS: SessionShareField[] = [
  'duration',
  'volume',
  'completedSets',
  'records',
];

export const SESSION_SHARE_MAX_ACTIVE_LINKS = 10;

export interface CreateSessionShareRequest {
  fields: SessionShareField[];
}

/** An active share link, visible only to the session owner. */
export interface SessionShare {
  id: string;
  sessionId: string;
  /** Unguessable identifier used in the public `/shared/sessions/:token` URL. */
  token: string;
  fields: SessionShareField[];
  createdAt: IsoDateString;
  /**
   * TRUST-04: a moderator has hidden the shared workout, so the link stops
   * resolving for everyone but its owner. The link is not revoked and the
   * session is untouched; the owner is told because a live-looking link that
   * opens for nobody is worse than one that says why.
   */
  isHiddenByModeration?: boolean;
}

/** Stable successful response of GET /workouts/sessions/:id/shares. */
export interface SessionShareListResponse {
  items: SessionShare[];
}

export interface SharedSessionOwner {
  username: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Stable successful response of the unauthenticated
 * GET /shared/sessions/:token. Only the fields named in `fields` are present;
 * everything else is omitted rather than nulled. Weights are canonical kg and
 * `weightUnit` is the owner's display preference.
 */
export interface SharedSessionRecap {
  fields: SessionShareField[];
  owner: SharedSessionOwner;
  weightUnit: WeightUnit;
  routineName: string;
  dayName?: string | null;
  endedAt: IsoDateString;
  durationSec?: number;
  totalVolumeKg?: number;
  completedSets?: number;
  records?: SessionRecapRecord[];
  progressionChanges?: ProgressionChange[];
  notes?: string | null;
  /** LIVE-16: shared with the `notes` field. */
  exerciseNotes?: SessionRecapExerciseNote[];
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
    /** ROUT-15: the block trained, when it was one. */
    trainingBlockName?: string | null;
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
