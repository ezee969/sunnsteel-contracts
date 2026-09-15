import type { IsoDateString } from './shared';

// Schedule overrides (SCHED-04) -------------------------------------------

/** A local calendar date, YYYY-MM-DD. */
export type CalendarDate = string;

/**
 * The schedule-instance model: per-date overrides of a routine's plan. MOVE
 * puts one weekly occurrence on another date (SCHED-04); SCHED-05 adds its
 * own kinds. Overrides are kept by calendar date, not by routine day, because
 * routine edits replace the days.
 */
export const SCHEDULE_OVERRIDE_KINDS = ['MOVE'] as const;
export type ScheduleOverrideKind = (typeof SCHEDULE_OVERRIDE_KINDS)[number];

/** A move goes at most this many days before or after the planned date. */
export const SCHEDULE_MOVE_MAX_DAYS = 6;

/** Overrides are read for at most this many days at once. */
export const SCHEDULE_OVERRIDES_MAX_RANGE_DAYS = 62;

export interface ScheduleOverride {
  id: string;
  routineId: string;
  /** The planned date this override changes. */
  date: CalendarDate;
  kind: ScheduleOverrideKind;
  /** MOVE: the date the occurrence now falls on. */
  toDate: CalendarDate | null;
  createdAt: IsoDateString;
}

/**
 * `GET /schedule/overrides?from&to`: the owner's overrides whose date or
 * target falls in the range, both ends included.
 */
export interface ScheduleOverridesQuery {
  from: CalendarDate;
  to: CalendarDate;
}

export interface ScheduleOverridesResponse {
  overrides: ScheduleOverride[];
}

/** `PUT /schedule/overrides/move`: moves one occurrence, or moves it again. */
export interface MoveOccurrenceRequest {
  routineId: string;
  date: CalendarDate;
  toDate: CalendarDate;
}
