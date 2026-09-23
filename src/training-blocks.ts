import type { RoutineVersionSetup } from './routine';
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
