import type {
  IsoDateString,
  MuscleGroup,
  ProgramStyle,
  ProgressionScheme,
  RepType,
} from './shared';
import type { RtfWeekGoals } from './rtf';

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
  programTMKg?: number;
  programRoundingKg?: number;
  programStyle?: ProgramStyle;
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
  programTMKg?: number;
  programRoundingKg?: number;
  programStyle?: ProgramStyle;
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
  programStyle?: ProgramStyle;
  programWithDeloads?: boolean;
  programDurationWeeks?: number;
  programStartWeek?: number;
  programStartDate?: IsoDateString;
  programEndDate?: IsoDateString;
  programTimezone?: string;
  rtfGoals?: RtfWeekGoals;
  days: RoutineDay[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  isPeriodized: boolean;
  programWithDeloads?: boolean;
  programStartDate?: IsoDateString;
  programTimezone?: string;
  programStartWeek?: number;
  programStyle?: ProgramStyle;
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineRequest = Partial<CreateRoutineRequest>;
