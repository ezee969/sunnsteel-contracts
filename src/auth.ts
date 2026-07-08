import type {
  IsoDateString,
  WeightUnit,
} from './shared';

// Auth contracts ----------------------------------------------------------

export interface SupabaseAuthUser {
  id: string;
  email: string;
  name: string;
  supabaseUserId?: string | null;
  weightUnit: WeightUnit;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
}

export interface SupabaseAuthResponse {
  user: SupabaseAuthUser;
  message?: string;
  requiresEmailVerification?: boolean;
}

export interface SupabaseMigrationResponse {
  message: string;
  userId: string;
  email: string;
}
