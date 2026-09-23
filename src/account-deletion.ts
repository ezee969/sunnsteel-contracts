import type { IsoDateString } from "./shared";

/**
 * TRUST-01. Deleting an account is immediate and cannot be undone: the
 * member's data, their Supabase sign-in and any stored avatar go together.
 *
 * The owner confirms by typing their current username. It is a statement of
 * intent, not a credential -- the bearer token already proves who is asking,
 * and a Google account has no password to re-enter.
 */
export interface DeleteAccountRequest {
  confirmUsername: string;
}

export interface DeleteAccountResponse {
  deletedAt: IsoDateString;
}

/**
 * Whether what the owner typed confirms deleting the account with this
 * username. Usernames are lowercase public identifiers, so the comparison
 * ignores case, surrounding whitespace and a leading `@`, and nothing else.
 */
export function matchesDeletionConfirmation(
  typed: string,
  username: string,
): boolean {
  const normalized = typed.trim().replace(/^@/, "").toLowerCase();
  return normalized.length > 0 && normalized === username.toLowerCase();
}
