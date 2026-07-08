import type {
  IsoDateString,
  MuscleGroup,
} from './shared';

// Exercise contracts ------------------------------------------------------

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
