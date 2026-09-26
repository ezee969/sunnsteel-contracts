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
