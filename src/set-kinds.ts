// LIVE-12: what a set is for, so only intended work reaches progression and
// analytics. A set with no kind (anything stored before LIVE-12, or a
// snapshot captured before it) is a working set.

export const SET_KINDS = ['WORKING', 'WARMUP', 'DROP', 'OPTIONAL'] as const;
export type SetKind = (typeof SET_KINDS)[number];

export const SET_KIND_LABELS: Record<SetKind, string> = {
  WORKING: 'Working',
  WARMUP: 'Warm-up',
  DROP: 'Drop',
  OPTIONAL: 'Optional',
};

export function isSetKind(value: unknown): value is SetKind {
  return (SET_KINDS as readonly unknown[]).includes(value);
}

/** The kind of a set or set log, defaulting to a working set. */
export function setKindOf(item?: { kind?: SetKind | null } | null): SetKind {
  return item?.kind ?? 'WORKING';
}

/**
 * Whether a completed set counts as work: volume, completed sets, muscles,
 * records, achievements and every Progress read. A warm-up never does.
 */
export function countsAsWork(kind?: SetKind | null): boolean {
  return (kind ?? 'WORKING') !== 'WARMUP';
}

/**
 * Whether a set takes part in progression and the rep-target signals. Only
 * working and optional sets do; an optional set only once it was done.
 */
export function countsForProgression(kind?: SetKind | null): boolean {
  const k = kind ?? 'WORKING';
  return k === 'WORKING' || k === 'OPTIONAL';
}

/** Whether a set must be done before a workout finishes without a prompt. */
export function requiredToFinish(kind?: SetKind | null): boolean {
  const k = kind ?? 'WORKING';
  return k === 'WORKING' || k === 'DROP';
}
