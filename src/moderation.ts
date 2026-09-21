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

export const REPORT_SUBJECT_KINDS = [
  'MEMBER',
  'ROUTINE',
  'SESSION',
  // SOC-06. The first reportable thing a member wrote rather than did, and the
  // first one the TRUST-04 queue is likely to see in volume: everything above
  // is content its owner created for themselves and shared, where a comment is
  // aimed at somebody else.
  'COMMENT',
] as const;
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

// Moderation review (TRUST-04) ------------------------------------------------
//
// The review side of the controls above. A report becomes something a
// moderator reads, and every power a moderator has leaves an immutable record
// of who used it and when — reading a reported subject included, because an
// unlogged read is the one moderation power nobody could audit afterwards.
//
// What is deliberately absent is as important as what is here. There is no
// deletion: a member's routines, sessions and account survive a moderation
// decision intact, and the strongest action is to stop everyone else seeing
// them. There is no reviewer bypass: the queue resolves a subject through the
// shipped `PROF-06`/`PROF-10` rules as the reviewer, and says a subject is
// withheld rather than revealing it. And there is still no timetable — the
// `PROF-10` receipt is unchanged, because a queue existing is not a promise
// about when anyone reaches a row in it.

/** Whether the signed-in account may open the queue at all. */
export interface ModeratorState {
  isModerator: boolean;
}

export const REPORT_STATUSES = ['OPEN', 'DISMISSED', 'ACTIONED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * Every moderator power, each one a record. `VIEW_SUBJECT` is here for the
 * same reason the others are: it is a thing a moderator did to somebody's
 * content, and it is the only one that leaves no other trace.
 */
export const MODERATION_ACTION_KINDS = [
  'VIEW_SUBJECT',
  'DISMISS_REPORT',
  'HIDE_SUBJECT',
  'RESTORE_SUBJECT',
] as const;
export type ModerationActionKind = (typeof MODERATION_ACTION_KINDS)[number];

export const MODERATION_NOTE_MAX_LENGTH = 500;
export const MODERATION_QUEUE_PAGE_SIZE = 20;
export const MODERATION_HISTORY_PAGE_SIZE = 20;

/**
 * What the reviewer may actually learn about a reported subject, resolved
 * server-side through the rules that already govern the subject. A reviewer
 * who may not read it is told so; the queue never fills the gap in.
 */
export interface ReportSubjectPreview {
  kind: ReportSubjectKind;
  /** As the reporter named it: a member id or username, a routine id, a token. */
  id: string;
  /**
   * The member id, routine id or session-share token this resolves to, which
   * is what a review action is recorded against. Null when the subject is
   * gone.
   */
  resolvedId: string | null;
  /** Present only when the reviewer may read the subject. */
  title: string | null;
  /** The subject's owner, when the reviewer may read the subject. */
  owner: UserSearchResponse | null;
  /** The subject no longer exists; only dismissing is left. */
  isMissing: boolean;
  /**
   * The shipped `PROF-06`/`PROF-10` rules deny this reviewer this subject.
   * It can still be hidden or dismissed on the strength of the report; it
   * cannot be read, and no moderator flag changes that.
   */
  isWithheld: boolean;
  /** A `HIDE_SUBJECT` is currently in force. */
  isHidden: boolean;
}

/** One row of the queue. */
export interface ModerationReport {
  id: string;
  status: ReportStatus;
  reason: ReportReason;
  details: string | null;
  createdAt: IsoDateString;
  reporter: UserSearchResponse;
  subject: ReportSubjectPreview;
  /** Other reports still open about the same subject, this one excluded. */
  otherOpenReports: number;
  resolvedAt: IsoDateString | null;
}

export interface ModerationQueueQuery {
  /** Omitted means `OPEN`, which is the queue's reason to exist. */
  status?: ReportStatus;
  cursor?: string;
  limit?: number;
}

/** Stable successful response of GET /moderation/queue. */
export interface ModerationQueueResponse {
  reports: ModerationReport[];
  nextCursor: string | null;
  /** Open reports in total, independent of the page or the filter. */
  openCount: number;
}

/**
 * One enforcement record. It is written once and never updated or deleted —
 * including when a hide is undone, which appends a `RESTORE_SUBJECT` record
 * rather than editing the `HIDE_SUBJECT` one.
 */
export interface ModerationActionRecord {
  id: string;
  kind: ModerationActionKind;
  moderator: UserSearchResponse;
  /** The report the action was taken from, when it was taken from one. */
  reportId: string | null;
  subjectKind: ReportSubjectKind;
  subjectId: string;
  note: string | null;
  createdAt: IsoDateString;
}

export interface ModerationHistoryQuery {
  cursor?: string;
  limit?: number;
  /** Narrow to one subject's records, newest first. */
  subjectKind?: ReportSubjectKind;
  subjectId?: string;
}

/** Stable successful response of GET /moderation/actions. */
export interface ModerationHistoryResponse {
  actions: ModerationActionRecord[];
  nextCursor: string | null;
}

/**
 * POST /moderation/reports/:id/dismiss, /hide and /restore. The note is the
 * reviewer's own record of why; it is never shown to the reporter or to the
 * subject's owner, because neither is promised an explanation.
 */
export interface ReviewReportRequest {
  note?: string | null;
}

/** Stable successful response of every review action, including a view. */
export interface ReviewReportResponse {
  report: ModerationReport;
  action: ModerationActionRecord;
}
