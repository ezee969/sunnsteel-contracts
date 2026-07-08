import type {
  IsoDateString,
  MuscleGroup,
  ProgressionScheme,
  RepType,
} from './shared';

// Routine contracts -------------------------------------------------------

export interface RoutineSet {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weight?: number | null;
  rir?: number | null;
}

export interface RoutineExercise {
  id: string;
  order: number;
  restSeconds: number;
  note?: string | null;
  progressionScheme: ProgressionScheme;
  minWeightIncrement: number;
  exercise: {
    id: string;
    name: string;
    primaryMuscles?: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
  };
  sets: RoutineSet[];
}

export interface CreateRoutineExerciseInput {
  exerciseId: string;
  order?: number;
  restSeconds: number;
  note?: string;
  progressionScheme: ProgressionScheme;
  minWeightIncrement: number;
  sets: RoutineSet[];
}

export interface RoutineDay {
  id: string;
  dayOfWeek: number;
  order: number;
  exercises: RoutineExercise[];
}

export interface CreateRoutineDayInput {
  dayOfWeek: number;
  order?: number;
  exercises: CreateRoutineExerciseInput[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPeriodized: boolean;
  isFavorite: boolean;
  isCompleted: boolean;
  days: RoutineDay[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  isPeriodized: boolean;
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineRequest = Partial<CreateRoutineRequest>;
