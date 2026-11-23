// LIVE-12: what a set is for, so only intended work reaches progression and
// analytics. A set with no kind (anything stored before LIVE-12, or a
// snapshot captured before it) is a working set.
//
// LIVE-26: a MATCH set is myo-rep match -- after a full rest it lifts its
// target set's load and, short of the target set's reps, adds mini-sets a few
// breaths apart until they add up. Its first effort is `reps`; the mini-sets
// are `matchReps`.

export const SET_KINDS = ['WORKING', 'WARMUP', 'DROP', 'OPTIONAL', 'MATCH'] as const;
export type SetKind = (typeof SET_KINDS)[number];

export const SET_KIND_LABELS: Record<SetKind, string> = {
  WORKING: 'Working',
  WARMUP: 'Warm-up',
  DROP: 'Drop',
  OPTIONAL: 'Optional',
  MATCH: 'Match',
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
 * working and optional sets do; an optional set only once it was done. A
 * match set never does: its target is set by the same workout.
 */
export function countsForProgression(kind?: SetKind | null): boolean {
  const k = kind ?? 'WORKING';
  return k === 'WORKING' || k === 'OPTIONAL';
}

/** Whether a set must be done before a workout finishes without a prompt. */
export function requiredToFinish(kind?: SetKind | null): boolean {
  const k = kind ?? 'WORKING';
  return k === 'WORKING' || k === 'DROP' || k === 'MATCH';
}

// Myo-rep match (LIVE-26) --------------------------------------------------

/** The most match sets one target set takes in the builder. */
export const MATCH_SETS_MAX = 3;

/**
 * The server's sanity limit on mini-sets in one match set. Not a method cap:
 * the method stops when the reps add up, and a set can stay short.
 */
export const MATCH_MINI_SETS_MAX = 10;

/** The most reps one mini-set may record. */
export const MATCH_MINI_SET_REPS_MAX = 100;

type RepsDone = { reps?: number | null; matchReps?: readonly number[] | null };

/**
 * Every rep a set did: its first effort plus, on a match set, its mini-sets.
 * Volume reads this; records, the estimated 1RM and plateaus read `reps`,
 * the first effort, since a mini-set after a few breaths is not a fresh set.
 */
export function repsDone(set: RepsDone): number {
  const mini = (set.matchReps ?? []).reduce(
    (sum, reps) => sum + (Number.isFinite(reps) && reps > 0 ? reps : 0),
    0,
  );
  return Math.max(0, set.reps ?? 0) + mini;
}

/** "13 + 3 + 2" for a match set with mini-sets, else the reps alone. */
export function formatRepsDone(set: RepsDone): string {
  const mini = (set.matchReps ?? []).filter((reps) => reps > 0);
  const first = Math.max(0, set.reps ?? 0);
  return mini.length ? [first, ...mini].join(' + ') : String(first);
}

type NumberedKind = { setNumber: number; kind?: SetKind | null };

/**
 * The set number a match set is matched against: the last working set before
 * it, past any match sets in between. Null when there is none, which a valid
 * prescription never leaves.
 */
export function matchTargetSetNumber(
  sets: readonly NumberedKind[],
  setNumber: number,
): number | null {
  const before = [...sets]
    .filter((set) => set.setNumber < setNumber)
    .sort((a, b) => b.setNumber - a.setNumber);
  for (const set of before) {
    const kind = setKindOf(set);
    if (kind === 'MATCH') continue;
    return kind === 'WORKING' ? set.setNumber : null;
  }
  return null;
}

/**
 * A match set's target: its target set's logged reps. Null until that set
 * has reps.
 */
export function matchTarget(
  sets: ReadonlyArray<NumberedKind & { reps?: number | null }>,
  setNumber: number,
): number | null {
  const target = matchTargetSetNumber(sets, setNumber);
  if (target === null) return null;
  const reps = sets.find((set) => set.setNumber === target)?.reps ?? 0;
  return reps > 0 ? reps : null;
}

export type MatchSetRefusal =
  | 'MATCH_SET_PLACEMENT'
  | 'MATCH_SETS_MAX'
  | 'MATCH_SET_LINEAR_BLOCK';

/**
 * Why a prescription's match sets cannot be stored, or null. A match set
 * follows a working set (or another match set after one), at most
 * `MATCH_SETS_MAX` in a row, and never on an 8-week block, which prescribes
 * its own sets.
 */
export function matchSetRefusal(
  sets: readonly NumberedKind[],
  linearBlock: boolean,
): MatchSetRefusal | null {
  const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  let run = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    if (setKindOf(ordered[i]) !== 'MATCH') {
      run = 0;
      continue;
    }
    if (linearBlock) return 'MATCH_SET_LINEAR_BLOCK';
    if (matchTargetSetNumber(ordered, ordered[i].setNumber) === null)
      return 'MATCH_SET_PLACEMENT';
    run += 1;
    if (run > MATCH_SETS_MAX) return 'MATCH_SETS_MAX';
  }
  return null;
}
