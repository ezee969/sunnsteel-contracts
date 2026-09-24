import type {
  RoutineDay,
  RoutineScheduleMode,
  RoutineVersionSetup,
} from './routine';
import type { CalendarDate } from './schedule';
import type { IsoDateString } from './shared';

// Temporary deload overrides (ROUT-16) ------------------------------------

/** The longest deload, inclusive of both ends. */
export const DELOAD_MAX_DAYS = 14;
/** The length a new deload is offered with. */
export const DELOAD_DEFAULT_DAYS = 7;

/** How much lighter each set's load is, in percent. */
export const DELOAD_LOAD_REDUCTIONS = [0, 10, 20, 30, 40] as const;
export type DeloadLoadReduction = (typeof DELOAD_LOAD_REDUCTIONS)[number];
export const DELOAD_DEFAULT_LOAD_REDUCTION: DeloadLoadReduction = 10;

/** `HALF` keeps the first half of each exercise's sets, rounded up. */
export const DELOAD_SET_MODES = ['ALL', 'HALF'] as const;
export type DeloadSetMode = (typeof DELOAD_SET_MODES)[number];
export const DELOAD_DEFAULT_SET_MODE: DeloadSetMode = 'HALF';

export const TEMPORARY_OVERRIDE_KINDS = ['DELOAD'] as const;
export type TemporaryOverrideKind = (typeof TEMPORARY_OVERRIDE_KINDS)[number];

export const TEMPORARY_OVERRIDE_SOURCE_KINDS = [
  'BASELINE',
  'TRAINING_BLOCK',
] as const;
export type TemporaryOverrideSourceKind =
  (typeof TEMPORARY_OVERRIDE_SOURCE_KINDS)[number];

export interface DeloadOptions {
  loadReductionPercent: DeloadLoadReduction;
  setMode: DeloadSetMode;
}

/** Why a deload cannot be made from a prescription with these options. */
export const DELOAD_NOT_LIGHTER =
  'Those options leave every set as it is: choose a lighter load or fewer sets';

/**
 * The reduced load on the exercise's own increment grid: the step nearest the
 * exact percentage. When that step is not lighter -- a small load whose grid
 * is too coarse -- the set keeps its weight rather than dropping a whole step.
 */
const lighterOnGrid = (original: number, target: number, increment: number) => {
  const step = increment > 0 ? increment : 2.5;
  const stepped = Math.round(Math.round(target / step) * step * 1000) / 1000;
  return stepped > 0 && stepped < original ? stepped : original;
};

/**
 * ROUT-16's one rule for what a deload is, shared so the preview the owner
 * reviews and the prescription the server stores cannot disagree: every load
 * drops by the chosen percentage, rounded to the exercise's own increment
 * (a load whose grid cannot express the cut keeps its weight), and `HALF` keeps the first half of each
 * exercise's sets (rounded up, so one set stays one). Reps, RIR, rest and everything else are
 * untouched. Returns null when nothing would be lighter -- the override is an
 * explicitly lighter prescription, never an unchanged copy.
 */
export function applyDeload(
  setup: RoutineVersionSetup,
  options: DeloadOptions,
): RoutineVersionSetup | null {
  const factor = 1 - options.loadReductionPercent / 100;
  let lighter = false;
  const days = setup.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => {
      const kept =
        options.setMode === 'HALF'
          ? exercise.sets.slice(0, Math.ceil(exercise.sets.length / 2))
          : exercise.sets;
      if (kept.length < exercise.sets.length) lighter = true;
      return {
        ...exercise,
        sets: kept.map((set) => {
          if (typeof set.weight !== 'number' || set.weight <= 0) {
            return { ...set };
          }
          if (factor === 1) return { ...set };
          const weight = lighterOnGrid(
            set.weight,
            set.weight * factor,
            exercise.minWeightIncrement,
          );
          if (weight < set.weight) lighter = true;
          return { ...set, weight };
        }),
      };
    }),
  }));
  return lighter ? { ...setup, days } : null;
}

/** Days from `start` to `end`, both included. */
export function deloadLengthDays(
  startDate: CalendarDate,
  endDate: CalendarDate,
): number {
  const ms = (date: CalendarDate) => Date.parse(`${date}T00:00:00Z`);
  return Math.round((ms(endDate) - ms(startDate)) / 86_400_000) + 1;
}

/** Where a deload's prescription was copied from. */
export interface TemporaryOverrideSource {
  kind: TemporaryOverrideSourceKind;
  trainingBlockId: string | null;
  trainingBlockName: string | null;
}

/** One deload of a routine. State is relative to `today`. */
export interface RoutineTemporaryOverride {
  id: string;
  routineId: string;
  kind: TemporaryOverrideKind;
  startDate: CalendarDate;
  /** Moves to the day before it was ended when it is ended early. */
  endDate: CalendarDate;
  loadReductionPercent: DeloadLoadReduction;
  setMode: DeloadSetMode;
  source: TemporaryOverrideSource;
  /** The prescription in force when the deload was created. */
  originalSetup: RoutineVersionSetup;
  /** The lighter prescription the deload trains. */
  setup: RoutineVersionSetup;
  endedEarlyAt: IsoDateString | null;
  createdAt: IsoDateString;
  state: 'FUTURE' | 'ACTIVE' | 'COMPLETE';
}

/** `GET /routines/:id/deloads`, newest start first. */
export interface RoutineTemporaryOverridesResponse {
  overrides: RoutineTemporaryOverride[];
  maxDays: number;
  /** The owner's local date every state is relative to. */
  today: CalendarDate;
}

/** `POST /routines/:id/deloads` */
export interface CreateDeloadRequest extends DeloadOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
}

/**
 * A deload as a plan the resolver can place: its working-copy days (real ids,
 * apart from the baseline and from any block) and the schedule of the plan it
 * lightened. Owner-only, on `Routine.temporaryOverrides`.
 */
export interface RoutineTemporaryOverridePlan {
  id: string;
  kind: TemporaryOverrideKind;
  startDate: CalendarDate;
  endDate: CalendarDate;
  scheduleMode: RoutineScheduleMode;
  restDays: number[];
  rotationWeekdays: number[];
  /** ROTATION only: the underlying plan's next day, in this copy. */
  nextRotationDayId: string | null;
  days: RoutineDay[];
}

/** ROUT-16: the temporary override a session trained, copied onto it. */
export interface SessionTemporaryOverride {
  id: string;
  kind: TemporaryOverrideKind;
}
