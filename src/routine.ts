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
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineRequest = Partial<CreateRoutineRequest>;
