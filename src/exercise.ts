import type {
  IsoDateString,
  MuscleGroup,
} from './shared';

// Exercise contracts ------------------------------------------------------

/**
 * How an exercise moves (EXER-09). Compound patterns first, then the
 * single-joint actions the catalog uses. Alternatives start from this plus
 * primary muscles; `substitutionGroup` is the narrower, near-identical set.
 */
export const MOVEMENT_PATTERNS = [
  'HORIZONTAL_PUSH',
  'VERTICAL_PUSH',
  'HORIZONTAL_PULL',
  'VERTICAL_PULL',
  'SQUAT',
  'HINGE',
  'LUNGE',
  'CHEST_FLY',
  'SHOULDER_ABDUCTION',
  'SHOULDER_FLEXION',
  'SHOULDER_HORIZONTAL_ABDUCTION',
  'SHOULDER_EXTENSION',
  'SCAPULAR_ELEVATION',
  'ELBOW_FLEXION',
  'ELBOW_EXTENSION',
  'KNEE_EXTENSION',
  'KNEE_FLEXION',
  'HIP_EXTENSION',
  'PLANTAR_FLEXION',
  'CORE_FLEXION',
  'CORE_ROTATION',
  'CORE_STABILITY',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const EXERCISE_MECHANICS = ['COMPOUND', 'ISOLATION'] as const;
export type ExerciseMechanic = (typeof EXERCISE_MECHANICS)[number];

/**
 * Closed, lowercase vocabulary for what an exercise needs. Lowercase so it can
 * be compared with the free-text equipment users list on a training location
 * (PREF-01), which is normalized to lowercase.
 */
export const EXERCISE_EQUIPMENT = [
  'barbell',
  'ez-bar',
  'dumbbell',
  'cable',
  'machine',
  'smith-machine',
  'bench',
  'incline-bench',
  'preacher-bench',
  'rack',
  'pull-up-bar',
  'dip-station',
  'bodyweight',
] as const;
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT)[number];

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** The primary implement, kept for existing displays. */
  equipment: string;
  /** Null for a custom exercise whose owner did not choose one. */
  movementPattern: MovementPattern | null;
  mechanic: ExerciseMechanic | null;
  /** Everything needed to perform the exercise, from `EXERCISE_EQUIPMENT`. */
  equipmentRequired: ExerciseEquipment[];
  /** Near-identical exercises share a group and can replace each other. */
  substitutionGroup: string | null;
  /** Ordered cues; empty until the content work in EXER-03 lands. */
  instructions: string[];
  /** Demonstration asset; null until EXER-04 supplies licensed media. */
  mediaUrl: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  /**
   * EXER-06: true for an exercise a member created. Only its owner is ever
   * served it in the catalog; absent or false for the shared catalog.
   */
  isCustom?: boolean;
  /** EXER-06: the owner's private note on a custom exercise. */
  note?: string | null;
  /** EXER-06: set while a custom exercise is archived (out of pickers, history kept). */
  archivedAt?: IsoDateString | null;
  /**
   * EXER-06: whether a routine or a workout uses the custom exercise. One that
   * is in use can be archived but not deleted.
   */
  inUse?: boolean;
}

// Custom exercises (EXER-06) -----------------------------------------------

/** The most custom exercises one account can hold, archived ones included. */
export const CUSTOM_EXERCISES_MAX = 100;
export const CUSTOM_EXERCISE_NAME_MAX = 60;
export const CUSTOM_EXERCISE_NOTE_MAX = 500;

/** A name as it is stored: trimmed, with inner whitespace collapsed. */
export const normalizeExerciseName = (name: string) =>
  name.trim().replace(/\s+/g, ' ');

/**
 * The key two names are compared by. A custom exercise may not share it with
 * another of its owner's exercises or with any catalog exercise, so a picker
 * or a template never meets two "Bench Press".
 */
export const exerciseNameKey = (name: string) =>
  normalizeExerciseName(name).toLocaleLowerCase('en');

/** Body of POST /exercises/custom; PATCH /exercises/custom/:id takes any part of it. */
export interface CustomExerciseInput {
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** At least one item; `bodyweight` for none. */
  equipmentRequired: ExerciseEquipment[];
  movementPattern: MovementPattern | null;
  mechanic: ExerciseMechanic | null;
  note: string | null;
}

export type UpdateCustomExerciseRequest = Partial<CustomExerciseInput>;

/**
 * Why the server refused a custom-exercise write (409), as the leading code
 * of its message: `NAME_TAKEN: ...`.
 */
export const CUSTOM_EXERCISE_REFUSALS = {
  /** The owner has an exercise by that name, or the catalog does. */
  NAME_TAKEN: 'NAME_TAKEN',
  /** `CUSTOM_EXERCISES_MAX` reached, archived ones counted. */
  LIMIT_REACHED: 'LIMIT_REACHED',
  /** A routine or a workout uses it: archive it instead. */
  IN_USE: 'IN_USE',
} as const;
export type CustomExerciseRefusal = keyof typeof CUSTOM_EXERCISE_REFUSALS;

export type CustomExerciseProblem =
  | 'NAME_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'PRIMARY_MUSCLE_REQUIRED'
  | 'MUSCLE_LISTED_TWICE'
  | 'EQUIPMENT_REQUIRED'
  | 'NOTE_TOO_LONG';

export const CUSTOM_EXERCISE_PROBLEM_MESSAGES: Record<CustomExerciseProblem, string> = {
  NAME_REQUIRED: 'Give the exercise a name.',
  NAME_TOO_LONG: `Keep the name to ${CUSTOM_EXERCISE_NAME_MAX} characters.`,
  PRIMARY_MUSCLE_REQUIRED: 'Choose at least one primary muscle.',
  MUSCLE_LISTED_TWICE: 'A muscle can be primary or secondary, not both.',
  EQUIPMENT_REQUIRED: 'Choose the equipment it needs, or bodyweight.',
  NOTE_TOO_LONG: `Keep the note to ${CUSTOM_EXERCISE_NOTE_MAX} characters.`,
};

/**
 * The first rule a complete custom exercise breaks, or null. The builder and
 * the server both ask it; names already taken are the server's to check.
 */
export function customExerciseProblem(
  input: CustomExerciseInput,
): CustomExerciseProblem | null {
  const name = normalizeExerciseName(input.name);
  if (!name) return 'NAME_REQUIRED';
  if (name.length > CUSTOM_EXERCISE_NAME_MAX) return 'NAME_TOO_LONG';
  if (input.primaryMuscles.length === 0) return 'PRIMARY_MUSCLE_REQUIRED';
  if (input.secondaryMuscles.some((m) => input.primaryMuscles.includes(m)))
    return 'MUSCLE_LISTED_TWICE';
  if (input.equipmentRequired.length === 0) return 'EQUIPMENT_REQUIRED';
  if ((input.note ?? '').trim().length > CUSTOM_EXERCISE_NOTE_MAX)
    return 'NOTE_TOO_LONG';
  return null;
}

const PRIMARY_EQUIPMENT_ORDER: readonly ExerciseEquipment[] = [
  'barbell',
  'ez-bar',
  'smith-machine',
  'dumbbell',
  'cable',
  'machine',
  'pull-up-bar',
  'dip-station',
  'bodyweight',
];

/** The single implement a custom exercise is labelled with, like the catalog's `equipment`. */
export function primaryEquipment(equipmentRequired: readonly ExerciseEquipment[]): string {
  return (
    PRIMARY_EQUIPMENT_ORDER.find((item) => equipmentRequired.includes(item)) ??
    equipmentRequired[0] ??
    'bodyweight'
  );
}

// Starred exercises (EXER-07) ---------------------------------------------

/**
 * The most catalog exercises one account can star. Starring is a private
 * working preference that orders pickers; it is separate from the public
 * favorite exercises on the training identity.
 */
export const STARRED_EXERCISES_MAX = 100;

export interface StarredExercise {
  exerciseId: string;
  starredAt: IsoDateString;
}

/**
 * Response of GET /exercises/starred and of PUT/DELETE
 * /exercises/:id/star. Newest first.
 */
export interface StarredExercisesResponse {
  items: StarredExercise[];
}
