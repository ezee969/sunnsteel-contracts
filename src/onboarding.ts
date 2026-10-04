import type { IsoDateString } from "./shared";

// Onboarding (ONBOARD-01) -----------------------------------------------------
//
// The steps themselves live in the frontend's registry, each naming the
// preference or route it configures. The server keeps only how far an account
// has come: the registry version it completed, the steps already done in the
// current run, and when the flow was first offered.

/** A step id as the registry names it: lowercase words joined by hyphens. */
export const ONBOARDING_STEP_ID_PATTERN_SOURCE = "^[a-z][a-z0-9-]{0,39}$";
export const ONBOARDING_STEPS_MAX = 30;
export const ONBOARDING_VERSION_MAX = 1000;

export interface OnboardingState {
  /**
   * The registry version the account completed. A new account starts at 0;
   * accounts that existed when onboarding shipped start at 1, so they are
   * offered only steps added later.
   */
  completedVersion: number;
  /** Steps answered or skipped since that version, so the flow resumes. */
  stepsDone: string[];
  /** When the flow first opened by itself; it never does again. */
  offeredAt: IsoDateString | null;
}

/**
 * PUT /users/preferences/onboarding. Partial: `stepsDone` is added to what is
 * stored (two devices never undo each other), `completedVersion` only ever
 * rises and clears the steps, and `offered` records the first opening once.
 */
export interface UpdateOnboardingRequest {
  stepsDone?: string[];
  completedVersion?: number;
  offered?: true;
}

export function isOnboardingStepId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    new RegExp(ONBOARDING_STEP_ID_PATTERN_SOURCE).test(value)
  );
}
