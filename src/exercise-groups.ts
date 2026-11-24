// ROUT-12: exercises of a day done in rounds. A group is stored as a link from
// each member to the next one, so a setup without ids (versions, blocks,
// sharing) carries it by order alone, and a group is always one unbroken run.

/** Two linked exercises are a superset; three to this many, a circuit. */
export const EXERCISE_GROUP_MAX = 6;

export type ExerciseGroupKind = 'SUPERSET' | 'CIRCUIT';

export const EXERCISE_GROUP_KIND_LABELS: Record<ExerciseGroupKind, string> = {
  SUPERSET: 'Superset',
  CIRCUIT: 'Circuit',
};

type Linkable = { linkedToNext?: boolean | null };

export interface ExerciseGroup {
  /** A, B, C… in the order the groups appear in the day. */
  letter: string;
  kind: ExerciseGroupKind;
  /** Positions of the members in the day's exercise list, in order. */
  indices: number[];
}

const letterFor = (index: number): string =>
  index < 26
    ? String.fromCharCode(65 + index)
    : letterFor(Math.floor(index / 26) - 1) + letterFor(index % 26);

/**
 * The day's groups, in order. An exercise linked to nothing, and the link of
 * a day's last exercise, belong to no group.
 */
export function exerciseGroups(
  exercises: readonly Linkable[],
): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  let index = 0;
  while (index < exercises.length) {
    const indices = [index];
    while (
      exercises[indices[indices.length - 1]].linkedToNext &&
      indices[indices.length - 1] + 1 < exercises.length
    ) {
      indices.push(indices[indices.length - 1] + 1);
    }
    if (indices.length > 1) {
      groups.push({
        letter: letterFor(groups.length),
        kind: indices.length === 2 ? 'SUPERSET' : 'CIRCUIT',
        indices,
      });
    }
    index = indices[indices.length - 1] + 1;
  }
  return groups;
}

export interface ExerciseGroupPosition {
  group: ExerciseGroup;
  /** 1-based place in the round: A1, A2… */
  position: number;
}

/** Where one exercise of the day stands, or null when it is on its own. */
export function exerciseGroupPosition(
  exercises: readonly Linkable[],
  index: number,
): ExerciseGroupPosition | null {
  for (const group of exerciseGroups(exercises)) {
    const at = group.indices.indexOf(index);
    if (at >= 0) return { group, position: at + 1 };
  }
  return null;
}

/** "Superset A1", "Circuit B3". */
export const exerciseGroupLabel = ({ group, position }: ExerciseGroupPosition) =>
  `${EXERCISE_GROUP_KIND_LABELS[group.kind]} ${group.letter}${position}`;

/** Whether linking exercise `index` to the next would make a group too large. */
export function canLinkToNext(exercises: readonly Linkable[], index: number) {
  if (index < 0 || index >= exercises.length - 1) return false;
  let start = index;
  while (start > 0 && exercises[start - 1].linkedToNext) start -= 1;
  let end = index + 1;
  while (end < exercises.length - 1 && exercises[end].linkedToNext) end += 1;
  return end - start + 1 <= EXERCISE_GROUP_MAX;
}

/** A day's links as they may be stored: the last exercise never links. */
export function normalizeExerciseLinks<T extends Linkable>(exercises: readonly T[]): T[] {
  return exercises.map((exercise, index) =>
    exercise.linkedToNext && index === exercises.length - 1
      ? { ...exercise, linkedToNext: false }
      : exercise,
  );
}

/** A group larger than `EXERCISE_GROUP_MAX`, which no day may hold. */
export function hasOversizedGroup(exercises: readonly Linkable[]): boolean {
  return exerciseGroups(exercises).some(
    (group) => group.indices.length > EXERCISE_GROUP_MAX,
  );
}

/**
 * LIVE-25: a day's exercises in a new order, each keeping its link only while
 * the exercise it linked to is still right after it -- a pair is kept only
 * while side by side -- and the last never linking.
 */
export function reorderExerciseLinks<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  orderedIds: readonly string[],
): T[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const nextOf = new Map<string, string>();
  exercises.forEach((exercise, index) => {
    const next = exercises[index + 1];
    if (exercise.linkedToNext && next) nextOf.set(exercise.id, next.id);
  });
  const ordered = orderedIds.map((id) => byId.get(id)).filter((e): e is T => Boolean(e));
  return ordered.map((exercise, index) => {
    const next = nextOf.get(exercise.id);
    const linked = next !== undefined && next === ordered[index + 1]?.id;
    return Boolean(exercise.linkedToNext) === linked
      ? exercise
      : { ...exercise, linkedToNext: linked };
  });
}

/** LIVE-25: whether that new order would break a superset or circuit link. */
export function reorderBreaksLinks<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  orderedIds: readonly string[],
): boolean {
  const before = exercises.filter((exercise, index) => exercise.linkedToNext && index < exercises.length - 1).length;
  const after = reorderExerciseLinks(exercises, orderedIds).filter((exercise) => exercise.linkedToNext).length;
  return after < before;
}

/**
 * LIVE-28: a day's exercises without `removedId`, its links as the builder
 * leaves them (ROUT-12): a member leaving the middle of a group bridges it,
 * the exercise before it keeps a link only to what it linked to, and the
 * last never links.
 */
export function removeExerciseLinks<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  removedId: string,
): T[] {
  const index = exercises.findIndex((exercise) => exercise.id === removedId);
  if (index === -1) return [...exercises];
  const removed = exercises[index];
  const kept = exercises.filter((exercise) => exercise.id !== removedId);
  return normalizeExerciseLinks(
    kept.map((exercise, at) =>
      at === index - 1 && exercise.linkedToNext && !removed.linkedToNext
        ? { ...exercise, linkedToNext: false }
        : exercise,
    ),
  );
}

/** LIVE-28: whether removing `removedId` shrinks or ends a superset or circuit. */
export function removalChangesGroup<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  removedId: string,
): boolean {
  const index = exercises.findIndex((exercise) => exercise.id === removedId);
  if (index === -1) return false;
  const last = exercises.length - 1;
  return (
    Boolean(exercises[index].linkedToNext && index < last) ||
    Boolean(index > 0 && exercises[index - 1].linkedToNext)
  );
}

/**
 * LIVE-29: a day's new order with the links it keeps, as a reorder asks for
 * them: `linkedToNext[i]` is the link of the exercise at `ids[i]`.
 */
export interface DayOrder {
  ids: string[];
  linkedToNext: boolean[];
}

/** The day in runs: each group whole, each exercise on its own alone. */
function dayRuns(exercises: readonly Linkable[]): number[][] {
  const runs: number[][] = [];
  const groups = new Map(exerciseGroups(exercises).map((group) => [group.indices[0], group]));
  for (let index = 0; index < exercises.length; ) {
    const indices = groups.get(index)?.indices ?? [index];
    runs.push(indices);
    index = indices[indices.length - 1] + 1;
  }
  return runs;
}

/** Runs back into an order: a run of several is one group, linked through. */
function orderOfRuns<T extends { id: string }>(
  exercises: readonly T[],
  runs: readonly number[][],
): DayOrder {
  const ids: string[] = [];
  const linkedToNext: boolean[] = [];
  for (const run of runs)
    run.forEach((index, at) => {
      ids.push(exercises[index].id);
      linkedToNext.push(at < run.length - 1);
    });
  return { ids, linkedToNext };
}

const indexOfId = <T extends { id: string }>(exercises: readonly T[], id: string) =>
  exercises.findIndex((exercise) => exercise.id === id);

/**
 * LIVE-29: one place up (-1) or down (+1) for an exercise. On its own, it
 * jumps a whole superset or circuit; inside one, it changes places with the
 * member beside it and the group stays. Null where it cannot go: the ends of
 * the day, and the ends of its group (leaving one is `ungroupedDay`).
 */
export function movedDay<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  id: string,
  delta: -1 | 1,
): DayOrder | null {
  const index = indexOfId(exercises, id);
  if (index === -1) return null;
  const runs = dayRuns(exercises);
  const at = runs.findIndex((run) => run.includes(index));
  const run = runs[at];
  if (run.length > 1) {
    const place = run.indexOf(index);
    const to = place + delta;
    if (to < 0 || to >= run.length) return null;
    const swapped = [...run];
    [swapped[place], swapped[to]] = [swapped[to], swapped[place]];
    return orderOfRuns(exercises, runs.map((each, i) => (i === at ? swapped : each)));
  }
  return movedRun(exercises, runs, at, delta);
}

/**
 * LIVE-29: a whole superset or circuit -- the one `id` belongs to -- one place
 * up or down, past the exercise or group beside it, its links kept. Null for
 * an exercise on its own and at the ends of the day.
 */
export function movedGroupDay<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  id: string,
  delta: -1 | 1,
): DayOrder | null {
  const index = indexOfId(exercises, id);
  if (index === -1) return null;
  const runs = dayRuns(exercises);
  const at = runs.findIndex((run) => run.includes(index));
  return runs[at].length > 1 ? movedRun(exercises, runs, at, delta) : null;
}

function movedRun<T extends { id: string }>(
  exercises: readonly T[],
  runs: readonly number[][],
  at: number,
  delta: -1 | 1,
): DayOrder | null {
  const to = at + delta;
  if (to < 0 || to >= runs.length) return null;
  const moved = [...runs];
  [moved[at], moved[to]] = [moved[to], moved[at]];
  return orderOfRuns(exercises, moved);
}

/**
 * LIVE-29: an exercise taken out of its superset or circuit on purpose: it
 * goes on its own right after what is left of the group, which keeps its
 * links (a pair left with one is no group). Null for one on its own.
 */
export function ungroupedDay<T extends Linkable & { id: string }>(
  exercises: readonly T[],
  id: string,
): DayOrder | null {
  const index = indexOfId(exercises, id);
  if (index === -1) return null;
  const runs = dayRuns(exercises);
  const at = runs.findIndex((run) => run.includes(index));
  if (runs[at].length < 2) return null;
  const rest = runs[at].filter((each) => each !== index);
  return orderOfRuns(exercises, [...runs.slice(0, at), rest, [index], ...runs.slice(at + 1)]);
}
