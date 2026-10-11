import type { WorkoutAnalyticsStatus } from './analytics';
import type { CalendarDate } from './schedule';
import type { SetKind } from './set-kinds';
import type { WorkoutSession } from './workout';

// Workouts logged later (LIVE-23) -------------------------------------------
//
// A member who recreates a programme they already followed records the
// workouts they did before the routine existed in Sunnsteel. Each one is a
// session of a routine day, dated in the past, with the sets as they were
// lifted. It counts for the member (history, records, streaks, rank) and
// never socially, and it never moves the routine: no progression runs and
// an 8-week block's week is the member's own setting (ROUT-20).

/** LIVE is a workout trained in the app; LOGGED_LATER one recorded after. */
export const WORKOUT_SESSION_ORIGINS = ['LIVE', 'LOGGED_LATER'] as const;
export type WorkoutSessionOrigin = (typeof WORKOUT_SESSION_ORIGINS)[number];

/** How far back a past workout can be logged, in days before today. */
export const LOGGED_WORKOUT_LOOKBACK_DAYS = 84;
/** Logged workouts one routine can hold. */
export const LOGGED_WORKOUTS_PER_ROUTINE_MAX = 48;
/** The local start a logged workout takes when none is given: 12:00. */
export const LOGGED_WORKOUT_DEFAULT_START_MINUTE = 12 * 60;
/** The longest a logged workout can last, in seconds. */
export const LOGGED_WORKOUT_MAX_DURATION_SEC = 6 * 60 * 60;
/** The shortest, in seconds. */
export const LOGGED_WORKOUT_MIN_DURATION_SEC = 60;

/** One set as it was lifted. Weight in kilograms. */
export interface LoggedSetInput {
  routineExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number | null;
  isCompleted: boolean;
  kind?: SetKind;
}

/** The week an 8-week slot was on in this workout (ROUT-17). */
export interface LoggedBlockStep {
  routineExerciseId: string;
  step: number;
}

/** Body of `POST /workouts/sessions/logged`. */
export interface LogPastWorkoutRequest {
  routineId: string;
  routineDayId: string;
  date: CalendarDate;
  /** Local minute of the day it started, 0-1439; 12:00 when omitted. */
  startMinute?: number;
  /** Its length; the day's estimate when omitted. */
  durationSec?: number;
  notes?: string | null;
  lpSteps?: LoggedBlockStep[];
  sets: LoggedSetInput[];
}

/**
 * The answer to logging one (`POST /workouts/sessions/logged`) or removing
 * one (`DELETE /workouts/sessions/:id/logged`): the session (logging) and the
 * analytics status, BUILDING while the history it changed is replayed.
 */
export interface LogPastWorkoutResponse {
  session: WorkoutSession;
  analytics: WorkoutAnalyticsStatus;
}

export interface RemoveLoggedWorkoutResponse {
  analytics: WorkoutAnalyticsStatus;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar date as a UTC day number, or null when it is not one. */
function dayNumber(date: CalendarDate): number | null {
  if (!DATE.test(date)) return null;
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time)) return null;
  // Rejects 2026-02-30, which Date.parse rolls over.
  if (new Date(time).toISOString().slice(0, 10) !== date) return null;
  return Math.round(time / DAY_MS);
}

/** The calendar date `days` after `date` (before, when negative). */
export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const day = dayNumber(date);
  if (day === null) return date;
  return new Date((day + days) * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The dates a past workout of a routine can be logged on: from the lookback
 * to the day before the routine was created, both in the member's calendar.
 * Null when there is none (a routine created at the edge of the lookback).
 */
export function loggedWorkoutDateRange(input: {
  /** The member's local today. */
  today: CalendarDate;
  /** The member's local date the routine was created on. */
  createdOn: CalendarDate;
}): { first: CalendarDate; last: CalendarDate } | null {
  const first = addCalendarDays(input.today, -LOGGED_WORKOUT_LOOKBACK_DAYS);
  const last = addCalendarDays(input.createdOn, -1);
  const a = dayNumber(first);
  const b = dayNumber(last);
  if (a === null || b === null || b < a) return null;
  return { first, last };
}

/** Whether a past workout can be logged on `date`. */
export function canLogWorkoutOn(
  date: CalendarDate,
  input: { today: CalendarDate; createdOn: CalendarDate },
): boolean {
  const day = dayNumber(date);
  const range = loggedWorkoutDateRange(input);
  if (day === null || !range) return false;
  return day >= dayNumber(range.first)! && day <= dayNumber(range.last)!;
}
