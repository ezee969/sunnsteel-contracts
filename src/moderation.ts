import type { IsoDateString } from './shared';
import type { UserSearchResponse } from './user';

// Blocking and reporting (PROF-10) -------------------------------------------
//
// The member-facing half of moderation: a block the server enforces, and a
// report that is recorded. The review queue, the enforcement actions and the
// audit trail are `TRUST-04` and deliberately absent here — a control that
// implied someone was reviewing on a timetable would be a promise this cannot
// keep.

/**
 * A block is **symmetric**. It removes any follow in both directions and
 * prevents a new one either way; neither account appears in the other's
 * search, suggestions, relationship lists or profile reads. Hiding only the
 * blocked account from the blocker would leave the blocker visible to them,
 * which is the half nobody asks for.
 *
 * It is **not retroactive over what was already handed out**: a `SOC-07`
 * session link and a `ROUT-04` routine link carry no viewer identity, so a
 * block cannot withdraw one. Revoking the link is that control.
 */
export interface BlockedMember {
  /** The blocked account's identity, as a search result carries it. */
  member: UserSearchResponse;
  blockedAt: IsoDateString;
}

/** Stable successful response of GET /users/me/blocks. */
export interface BlockedMembersResponse {
  blocks: BlockedMember[];
}

/** One account blocks at most this many others. */
export const BLOCKED_MEMBERS_MAX = 500;

/** What a viewer may do about one profile, so the UI never offers a no-op. */
export interface MemberModerationState {
  /** The viewer has blocked this member. */
  isBlocked: boolean;
}

export const REPORT_SUBJECT_KINDS = ['MEMBER', 'ROUTINE', 'SESSION'] as const;
export type ReportSubjectKind = (typeof REPORT_SUBJECT_KINDS)[number];

/**
 * Why something was reported. The list is short and fixed on purpose: a free
 * text field would collect personal data `TRUST-04` has nowhere to put yet.
 */
export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'IMPERSONATION',
  'UNSAFE_ADVICE',
  'SEXUAL_CONTENT',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_DETAILS_MAX_LENGTH = 500;
/** One account files at most this many reports a day. */
export const REPORTS_PER_DAY_MAX = 20;

/** POST /reports */
export interface CreateReportRequest {
  subjectKind: ReportSubjectKind;
  /** A member id or username, a routine id, or a session share token. */
  subjectId: string;
  reason: ReportReason;
  /** Optional context from the reporter, never required. */
  details?: string | null;
}

/**
 * Stable successful response of POST /reports. It confirms the report was
 * recorded and says nothing about review, because nothing reviews it yet.
 */
export interface CreateReportResponse {
  id: string;
  createdAt: IsoDateString;
}
