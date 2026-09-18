import type { RoutineLineage, RoutineVisibility } from './routine-sharing';
import type {
  IsoDateString,
  MuscleGroup,
  ProgressionScheme,
  RepType,
} from './shared';

// Routine contracts -------------------------------------------------------

/**
 * ROUT-11: a WEEKLY routine ties each day to a weekday; a ROTATION routine
 * runs its days in `order`, each after the last completed one, whatever the
 * weekday.
 */
export const ROUTINE_SCHEDULE_MODES = ['WEEKLY', 'ROTATION'] as const;
export type RoutineScheduleMode = (typeof ROUTINE_SCHEDULE_MODES)[number];

/** At most seven days in either mode. */
export const ROUTINE_DAYS_MAX = 7;
export const ROUTINE_DAY_NAME_MAX = 40;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * How a routine day is named everywhere, including history snapshots taken
 * before ROUT-11: its own name, else its weekday, else its rotation letter
 * ("Day A" for order 0).
 */
export function routineDayLabel(day: {
  name?: string | null;
  dayOfWeek?: number | null;
  order?: number | null;
}): string {
  const name = day.name?.trim();
  if (name) return name;
  if (typeof day.dayOfWeek === 'number') {
    return WEEKDAY_NAMES[day.dayOfWeek] ?? '';
  }
  if (typeof day.order === 'number' && day.order >= 0 && day.order < 26) {
    return `Day ${String.fromCharCode(65 + day.order)}`;
  }
  return '';
}

export interface RoutineSet {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weight?: number | null;
  rir?: number | null;
}

export interface RoutineExercise {
  id: string;
  order: number;
  restSeconds: number;
  note?: string | null;
  progressionScheme: ProgressionScheme;
  minWeightIncrement: number;
  exercise: {
    id: string;
    name: string;
    primaryMuscles?: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
  };
  sets: RoutineSet[];
}

export interface CreateRoutineExerciseInput {
  exerciseId: string;
  order?: number;
  restSeconds: number;
  note?: string;
  progressionScheme: ProgressionScheme;
  minWeightIncrement: number;
  sets: RoutineSet[];
}

export interface RoutineDay {
  id: string;
  /** 0=Sun..6=Sat on a WEEKLY routine; null on a ROTATION routine. */
  dayOfWeek: number | null;
  /** Optional label such as "Push" or "Upper A" (see `routineDayLabel`). */
  name: string | null;
  /** Rotation sequence, 0-based; also the display order. */
  order: number;
  exercises: RoutineExercise[];
}

export interface CreateRoutineDayInput {
  /** Required and unique on a WEEKLY routine; omitted or null on a ROTATION. */
  dayOfWeek?: number | null;
  name?: string | null;
  order?: number;
  exercises: CreateRoutineExerciseInput[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPeriodized: boolean;
  isFavorite: boolean;
  isCompleted: boolean;
  scheduleMode: RoutineScheduleMode;
  /**
   * ROTATION only: the day after the one of the last completed session (an
   * aborted session does not advance it), or the first day before any.
   */
  nextRotationDayId: string | null;
  /**
   * SCHED-07: weekdays (0=Sun..6=Sat) this weekly routine rests on by plan,
   * never one of its training weekdays; always empty on a ROTATION routine.
   */
  restDays: number[];
  /**
   * SCHED-06: weekdays (0=Sun..6=Sat) a ROTATION routine trains on, sorted; the
   * schedule places its days on them in order. Empty means any day, without
   * dates; always empty on a WEEKLY routine.
   */
  rotationWeekdays: number[];
  /**
   * ROUT-04: who may read this routine, bounded by the account-level
   * `PROF-06` routines rule. Owner-only field; it never appears in a shared
   * read, where visibility is the reason the reader is there.
   */
  visibility: RoutineVisibility;
  /**
   * ROUT-06: present only on a routine that was cloned, and only with what
   * this viewer is allowed to know about its source.
   */
  lineage?: RoutineLineage | null;
  days: RoutineDay[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  isPeriodized: boolean;
  /** Defaults to WEEKLY. Changing it on update requires `days`. */
  scheduleMode?: RoutineScheduleMode;
  /**
   * Weekly routines only. Omitted on update keeps the stored rest days, minus
   * any that became training weekdays.
   */
  restDays?: number[];
  /**
   * Rotation routines only. Omitted on update keeps the stored weekdays;
   * switching to WEEKLY clears them.
   */
  rotationWeekdays?: number[];
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineRequest = Partial<CreateRoutineRequest>;

// Routine versions (ROUT-08) ----------------------------------------------

/** A routine keeps at most this many versions; saving past it is refused. */
export const ROUTINE_VERSIONS_MAX = 20;
export const ROUTINE_VERSION_NAME_MAX = 60;

/**
 * SAVED is an intentional save; BEFORE_RESTORE is the setup a restore
 * replaced, saved automatically so the restore can be undone.
 */
export const ROUTINE_VERSION_KINDS = ['SAVED', 'BEFORE_RESTORE'] as const;
export type RoutineVersionKind = (typeof ROUTINE_VERSION_KINDS)[number];

export interface RoutineVersionExercise {
  /** The catalog exercise and its name when the version was saved. */
  exercise: { id: string; name: string };
  order: number;
  restSeconds: number;
  note: string | null;
  progressionScheme: ProgressionScheme;
  minWeightIncrement: number;
  sets: RoutineSet[];
}

export interface RoutineVersionDay {
  dayOfWeek: number | null;
  name: string | null;
  order: number;
  exercises: RoutineVersionExercise[];
}

/** Everything a routine edit can change, as it was when the version was saved. */
export interface RoutineVersionSetup {
  name: string;
  description: string | null;
  scheduleMode: RoutineScheduleMode;
  restDays: number[];
  /** SCHED-06; absent in versions saved before it, which means none. */
  rotationWeekdays?: number[];
  days: RoutineVersionDay[];
}

export interface RoutineVersion {
  id: string;
  routineId: string;
  /** 1, 2, 3… per routine, never reused after a deletion. */
  number: number;
  name: string | null;
  kind: RoutineVersionKind;
  /** BEFORE_RESTORE only: the number of the version that was restored. */
  restoredVersionNumber: number | null;
  createdAt: IsoDateString;
  setup: RoutineVersionSetup;
}

/** `GET /routines/:id/versions`, newest first. */
export interface RoutineVersionsResponse {
  versions: RoutineVersion[];
  max: number;
}

/** `POST /routines/:id/versions` */
export interface CreateRoutineVersionRequest {
  name?: string | null;
}

/** `POST /routines/:id/versions/:versionId/restore` */
export interface RestoreRoutineVersionResponse {
  routine: Routine;
  /** The replaced setup, saved as a BEFORE_RESTORE version. */
  savedVersion: RoutineVersion;
}
