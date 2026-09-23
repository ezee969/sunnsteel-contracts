import type {
  RoutineDay,
  RoutineScheduleMode,
  RoutineVersionSetup,
} from './routine';
import type { CalendarDate } from './schedule';
import type { IsoDateString } from './shared';

// Routine training blocks (ROUT-09) --------------------------------------

/** One routine may have this many current, non-overlapping planned blocks. */
export const ROUTINE_TRAINING_BLOCKS_MAX = 24;
/** A started block keeps at most this many immutable revisions. */
export const ROUTINE_TRAINING_BLOCK_REVISIONS_MAX = 20;
export const ROUTINE_TRAINING_BLOCK_NAME_MAX = 60;

export const ROUTINE_TRAINING_BLOCK_STATES = [
  'FUTURE',
  'ACTIVE',
  'COMPLETE',
] as const;
export type RoutineTrainingBlockState =
  (typeof ROUTINE_TRAINING_BLOCK_STATES)[number];

export const ROUTINE_TRAINING_BLOCK_SOURCE_KINDS = [
  'CURRENT_ROUTINE',
  'SAVED_VERSION',
] as const;
export type RoutineTrainingBlockSourceKind =
  (typeof ROUTINE_TRAINING_BLOCK_SOURCE_KINDS)[number];

/**
 * The origin is snapshotted so a later routine edit or ROUT-08 version
 * deletion cannot change what this block says it was authored from.
 */
export interface RoutineTrainingBlockSource {
  kind: RoutineTrainingBlockSourceKind;
  versionId: string | null;
  versionNumber: number | null;
  versionName: string | null;
}

/** One immutable revision of a named, dated setup. */
export interface RoutineTrainingBlockRevision {
  id: string;
  routineId: string;
  /** Stable across every replacement of the same logical block. */
  seriesId: string;
  /** 1, 2, 3… inside the series. */
  revision: number;
  name: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
  setup: RoutineVersionSetup;
  source: RoutineTrainingBlockSource;
  createdAt: IsoDateString;
  /** Null only on the current revision. */
  supersededAt: IsoDateString | null;
}

/** A current block in the routine timeline. State is relative to `today`. */
export interface RoutineTrainingBlock
  extends Omit<RoutineTrainingBlockRevision, 'supersededAt'> {
  state: RoutineTrainingBlockState;
  revisionCount: number;
}

/** `GET /routines/:id/training-blocks`, ordered by start date. */
export interface RoutineTrainingBlocksResponse {
  blocks: RoutineTrainingBlock[];
  max: number;
  revisionMax: number;
  /** The owner's local date used to derive every state in this response. */
  today: CalendarDate;
}

/** `GET /routines/:id/training-blocks/:blockId/revisions`, newest first. */
export interface RoutineTrainingBlockRevisionsResponse {
  seriesId: string;
  revisions: RoutineTrainingBlockRevision[];
  max: number;
}

/**
 * `POST /routines/:id/training-blocks` and
 * `PUT /routines/:id/training-blocks/:blockId`.
 * Null or omission captures the routine as it exists at request time.
 */
export interface UpsertRoutineTrainingBlockRequest {
  name: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
  sourceVersionId?: string | null;
}

// Phase-aware routine execution (ROUT-15) ---------------------------------

/**
 * A current block as a plan the schedule, the dashboard and a session start
 * use. Its days are the block's own working copy, with ids, kept apart from
 * the routine's baseline `days`: a session of a block day logs against them
 * and progression advances them, never the baseline, which resumes unchanged
 * once the block ends. A new revision starts again from its authored setup.
 */
export interface RoutineTrainingBlockPlan {
  /** The current revision's id. */
  id: string;
  seriesId: string;
  revision: number;
  name: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
  scheduleMode: RoutineScheduleMode;
  restDays: number[];
  rotationWeekdays: number[];
  /**
   * ROTATION only: the day after the last completed session of this block
   * (any revision), or its first day before any. Never a baseline day.
   */
  nextRotationDayId: string | null;
  days: RoutineDay[];
}

/** ROUT-15: the block a session trained, copied onto the session itself. */
export interface SessionTrainingBlock {
  /** The revision trained. */
  id: string;
  seriesId: string;
  revision: number;
  name: string;
}

type DatedBlock = { startDate: CalendarDate; endDate: CalendarDate };

/** Both ends are inclusive; dates compare as `YYYY-MM-DD` strings. */
export function trainingBlockCovers(
  block: DatedBlock,
  date: CalendarDate,
): boolean {
  return block.startDate <= date && date <= block.endDate;
}

/**
 * The one active block for a date, or null. Blocks of one routine never
 * overlap (ROUT-09), so the first cover is the only one.
 */
export function resolveActiveTrainingBlock<T extends DatedBlock>(
  blocks: readonly T[] | null | undefined,
  date: CalendarDate,
): T | null {
  return blocks?.find(block => trainingBlockCovers(block, date)) ?? null;
}

/** What a routine plans for one date: its active block, else its baseline. */
export interface ResolvedRoutinePlan<D> {
  block: SessionTrainingBlock & DatedBlock | null;
  scheduleMode: RoutineScheduleMode;
  restDays: number[];
  rotationWeekdays: number[];
  nextRotationDayId: string | null;
  days: D[];
}

export interface RoutinePlanSource<D> {
  scheduleMode: RoutineScheduleMode;
  restDays: number[];
  rotationWeekdays?: number[] | null;
  nextRotationDayId?: string | null;
  days: D[];
  trainingBlocks?: ReadonlyArray<
    DatedBlock &
      SessionTrainingBlock & {
        scheduleMode: RoutineScheduleMode;
        restDays: number[];
        rotationWeekdays: number[];
        nextRotationDayId: string | null;
        days: D[];
      }
  > | null;
}

/**
 * ROUT-15's single resolver. Every reader that decides what a routine trains
 * on a date - the schedule, the dashboard, a session start, reminders and the
 * partner schedule, on the frontend and the backend alike - asks this, so
 * weekly and rotation routines, and the baseline and a block, never disagree.
 */
export function resolveRoutinePlan<D>(
  routine: RoutinePlanSource<D>,
  date: CalendarDate,
): ResolvedRoutinePlan<D> {
  const block = resolveActiveTrainingBlock(routine.trainingBlocks, date);
  if (block) {
    return {
      block: {
        id: block.id,
        seriesId: block.seriesId,
        revision: block.revision,
        name: block.name,
        startDate: block.startDate,
        endDate: block.endDate,
      },
      scheduleMode: block.scheduleMode,
      restDays: block.restDays,
      rotationWeekdays: block.rotationWeekdays,
      nextRotationDayId: block.nextRotationDayId,
      days: block.days,
    };
  }
  return {
    block: null,
    scheduleMode: routine.scheduleMode,
    restDays: routine.restDays,
    rotationWeekdays: routine.rotationWeekdays ?? [],
    nextRotationDayId: routine.nextRotationDayId ?? null,
    days: routine.days,
  };
}
