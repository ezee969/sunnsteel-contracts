import type { IsoDateString } from "./shared";

/**
 * LIVE-24. When a workout ended. Finishing used to stamp the moment Finish was
 * pressed, so a workout finished hours after its last set read as hours long.
 * Finish now takes the end time, and a finished workout's end time can be
 * moved earlier as a LIVE-17 correction. One rule bounds both, so the page
 * offers exactly what the server accepts.
 */

/**
 * Finish asks when the workout ended once its last set was saved this long
 * ago; sooner than that it finishes at once, as it always has.
 */
export const FINISH_PAUSE_MINUTES = 30;

/**
 * An end time this far ahead of the server's clock is taken as now: a phone's
 * clock running slightly fast must not refuse a finish.
 */
export const WORKOUT_END_CLOCK_SLACK_SECONDS = 120;

type Instant = IsoDateString | Date;

const ms = (value: Instant) => new Date(value).getTime();

/**
 * The earliest a workout can end: its start, or its last completed set when
 * that is later. A set ticked by a correction was stamped with the end itself
 * (`movesWithEnd`), so it moves with the end rather than holding it back.
 */
export function earliestWorkoutEnd(input: {
  startedAt: Instant;
  completedAts: Array<Instant | null | undefined>;
  movesWithEnd?: Instant | null;
}): Date {
  const skip = input.movesWithEnd ? ms(input.movesWithEnd) : null;
  let earliest = ms(input.startedAt);
  for (const value of input.completedAts) {
    if (!value) continue;
    const at = ms(value);
    if (Number.isFinite(at) && at !== skip && at > earliest) earliest = at;
  }
  return new Date(earliest);
}

/**
 * The end a finish records: now when none is given, the given time when it
 * falls between the earliest end and now (a little past now reads as now),
 * and null when it falls outside them.
 */
export function finishEndTime(
  requested: Instant | null | undefined,
  earliest: Date,
  now: Date = new Date(),
): Date | null {
  if (requested == null) return now;
  const at = ms(requested);
  if (!Number.isFinite(at) || at < earliest.getTime()) return null;
  if (at > now.getTime() + WORKOUT_END_CLOCK_SLACK_SECONDS * 1000) return null;
  return new Date(Math.min(at, now.getTime()));
}

/**
 * A corrected end only moves earlier: between the earliest end and the end
 * recorded. Null when it falls outside them.
 */
export function correctedEndTime(
  requested: Instant,
  earliest: Date,
  endedAt: Instant,
): Date | null {
  const at = ms(requested);
  if (!Number.isFinite(at)) return null;
  if (at < earliest.getTime() || at > ms(endedAt)) return null;
  return new Date(at);
}

/**
 * Whether Finish should ask when the workout ended: the last saved activity
 * (the last set ticked, else the start) is at least `FINISH_PAUSE_MINUTES`
 * old.
 */
export function finishNeedsEndTime(
  lastActivityAt: Instant,
  now: Date = new Date(),
): boolean {
  return now.getTime() - ms(lastActivityAt) >= FINISH_PAUSE_MINUTES * 60 * 1000;
}
