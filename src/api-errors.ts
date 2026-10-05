/**
 * I18N-06: every refusal a member can meet has a stable code, so the client
 * can say it in the member's language. The server still sends its English
 * `message`, rendered from the template below, so older clients, logs and
 * tests read exactly what they read before; a client that knows the code
 * translates it and falls back to `message` for one it does not.
 *
 * The templates are the server's English, word for word: `{name}` is replaced
 * by `params.name`. The frontend's English messages are held equal to them by
 * a test, so switching to codes changes no English on screen.
 *
 * Validation a well-behaved client never triggers (malformed cursors, ids that
 * belong to someone else, DTO shape errors) has no code on purpose: it keeps
 * its English message and is not worth a translation.
 */
export const API_ERROR_MESSAGES = {
  // ── Not found ──────────────────────────────────────────────────────────
  ROUTINE_NOT_FOUND: "Routine not found",
  ROUTINE_NOT_EDITABLE:
    "Routine not found or you do not have permission to edit it.",
  ROUTINE_NOT_MODIFIABLE:
    "Routine not found or you do not have permission to modify it.",
  ROUTINE_DAY_NOT_FOUND: "Routine day not found for this user/routine",
  ROUTINE_EXERCISE_NOT_FOUND: "Exercise not found in this routine",
  VERSION_NOT_FOUND: "Version not found",
  ROUTINE_VERSION_NOT_FOUND: "Routine version not found",
  TRAINING_BLOCK_NOT_FOUND: "Training block not found",
  DELOAD_NOT_FOUND: "Deload not found",
  WORKOUT_SESSION_NOT_FOUND: "Workout session not found",
  SET_LOG_NOT_FOUND: "Set log not found",
  SESSION_EXERCISE_NOT_FOUND: "That exercise is not part of this session",
  USER_NOT_FOUND: "User not found",
  MEMBER_NOT_FOUND: "Member not found",
  ACCOUNT_NOT_FOUND: "Account not found",
  ACTIVITY_NOT_FOUND: "Activity entry not found",
  COMMENT_NOT_FOUND: "Comment not found",
  EXERCISE_NOT_FOUND: "Exercise not found",
  REPORT_NOT_FOUND: "Report not found",
  REPORT_SUBJECT_NOT_FOUND: "Subject not found",
  REPORTED_CONTENT_GONE: "The reported content no longer exists",
  CONVERSATION_NOT_FOUND: "Conversation not found",
  MESSAGE_NOT_FOUND: "Message not found",
  SHARE_LINK_NOT_FOUND: "Share link not found",
  LINK_NOT_FOUND: "Link not found",
  SHARED_SESSION_NOT_FOUND: "Shared session not found",
  SHARED_SCHEDULE_NOT_FOUND: "Shared schedule not found",
  OVERRIDE_NOT_FOUND: "Override not found",
  BODY_ENTRY_NOT_FOUND: "No entry on that date",
  PARTNER_REQUEST_NOT_FOUND: "Training-partner request not found",
  PARTNER_RELATIONSHIP_NOT_FOUND: "Training-partner relationship not found",
  PARTNERSHIP_NOT_FOUND: "Training partnership not found",
  NO_EXERCISE_PERFORMANCE: "No completed performance found for this exercise",
  NO_STRENGTH_RECORDS: "No strength records found for this exercise",
  NO_COMPLETED_SESSIONS_FOR_DAY:
    "No completed sessions found for this routine day",

  // ── Training history being prepared ────────────────────────────────────
  ANALYTICS_NOT_READY: "Workout analytics projection is not ready",
  ANALYTICS_REBUILDING:
    "Your training history is being rebuilt. Try again in a few minutes.",
  ANALYTICS_SNAPSHOTS_PREPARING:
    "Historical snapshots are still being prepared; retry after analytics setup",
  RATE_LIMITED: "ThrottlerException: Too Many Requests",
  // PREF-04: the plan a workout trains is resolved in the account's zone.
  TIME_ZONE_LIVE_WORKOUT:
    "Finish or discard the workout in progress before changing your time zone.",

  // ── Routines ───────────────────────────────────────────────────────────
  ROUTINE_DAYS_MAX: "A routine has at most {max} days",
  ROUTINE_DAY_NAME_TOO_LONG: "Day names have at most {max} characters",
  EXERCISE_GROUP_TOO_LARGE: "A superset or circuit has at most {max} exercises",
  ROUTINE_ACTIVE_SESSION:
    "Finish the active session before changing the routine structure",
  ROUTINE_SHARE_LINKS_MAX: "A routine keeps at most {max} active links.",
  CLONE_SOURCE_REQUIRED:
    "SOURCE_REQUIRED: send either a share token or a routine id",
  CLONE_UNKNOWN_EXERCISE:
    "UNKNOWN_EXERCISE: an exercise in this routine is no longer in the catalog",
  ROUTINE_VERSIONS_MAX: "A routine keeps at most {max} versions; delete one first",
  ROUTINE_VERSION_EXERCISE_GONE:
    "An exercise in this version is no longer in the catalog",
  ROUTINE_VERSION_NAME_TOO_LONG: "Version names have at most {max} characters",

  // ── Training blocks ────────────────────────────────────────────────────
  TRAINING_BLOCKS_MAX:
    "A routine keeps at most {max} training blocks; delete a future block first",
  TRAINING_BLOCK_REVISIONS_MAX: "A training block keeps at most {max} revisions",
  TRAINING_BLOCK_COMPLETED: "A completed training block cannot change",
  TRAINING_BLOCK_START_LOCKED:
    "The start date of an active training block cannot change",
  TRAINING_BLOCK_END_IN_PAST: "An active training block cannot end before today",
  TRAINING_BLOCK_ACTIVE_SESSION:
    "Finish the active session of this training block before revising it",
  TRAINING_BLOCK_NOT_FUTURE: "Only a future training block can be deleted",
  TRAINING_BLOCK_VERSION_EXERCISE_GONE:
    "An exercise in this version is no longer available",
  TRAINING_BLOCK_NAME_REQUIRED: "Name is required",
  TRAINING_BLOCK_NAME_TOO_LONG: "Name must be at most {max} characters",
  TRAINING_BLOCK_ENDS_BEFORE_START: "The block ends before it starts",
  TRAINING_BLOCK_OVERLAP: "Training blocks cannot overlap",
  TRAINING_BLOCK_NOT_STARTED:
    "A training block that has not started has nothing to compare",

  // ── Deloads ────────────────────────────────────────────────────────────
  DELOAD_NOTHING_TO_LIGHTEN: "There is nothing to deload yet",
  DELOAD_NOT_LIGHTER:
    "Those options leave every set as it is: choose a lighter load or fewer sets",
  DELOAD_NOT_IN_PROGRESS: "Only a deload in progress can be ended early",
  DELOAD_ALREADY_STARTED: "Only a deload that has not started can be cancelled",
  DELOAD_ENDS_BEFORE_START: "The deload ends before it starts",
  DELOAD_STARTS_IN_PAST: "A deload starts today or later",
  DELOAD_TOO_LONG: "A deload lasts at most {max} days",
  DELOAD_OVERLAP: "Deloads of one routine cannot overlap",
  DELOAD_CROSSES_BLOCK:
    "A deload stays inside one plan: it cannot cross the start or end of a training block",
  DELOAD_PLANNED_IN_RANGE:
    "A deload is planned in those dates; end or cancel it first",
  DELOAD_LIGHTENS_BLOCK: "A deload lightens this training block; cancel it first",

  // ── Schedule ───────────────────────────────────────────────────────────
  SCHEDULE_NOT_WEEKLY: "Only weekly routines have dated workouts to change",
  SCHEDULE_NOT_PLANNED: "The routine is not planned on that date",
  SCHEDULE_SAME_DATE: "Choose a different date",
  SCHEDULE_MOVE_TOO_FAR: "A workout moves at most {max} days",
  SCHEDULE_PAST_MOVE: "Past workouts cannot be moved",
  SCHEDULE_DATE_TAKEN: "That date already has a workout of this routine",
  SCHEDULE_DATE_MOVED_INTO:
    "Another workout of this routine already moved to that date",
  SCHEDULE_SKIP_TOO_OLD: "A workout can be marked skipped up to {max} days back",

  // ── Starting and logging a workout ─────────────────────────────────────
  SESSION_ALREADY_ACTIVE: "Active workout session already exists",
  SESSION_DELOAD_IN_FORCE:
    "This routine is on a deload until {endDate}; start one of its days",
  SESSION_DELOAD_NOT_IN_FORCE:
    "That deload is not in force today; start a day of the plan in force",
  SESSION_BLOCK_IN_FORCE:
    'This routine follows the training block "{name}" until {endDate}; start one of its days',
  SESSION_BLOCK_NOT_IN_FORCE:
    "That training block is not in force today; start a day of the routine",
  SESSION_FINISHED: "Cannot modify set logs for a finished session",
  SESSION_ALREADY_FINISHED: "Session already finished with a different status",
  EXTRA_SETS_MAX: "An exercise can take at most {max} extra sets",
  EXTRA_SET_NOT_NEXT: "Extra sets are added after the last set",
  PRESCRIBED_SET_NOT_REMOVABLE: "A prescribed set cannot be removed",
  ONLY_LAST_EXTRA_SET_REMOVABLE: "Only the last added set can be removed",
  SWAP_SESSION_NOT_ACTIVE: "Exercises can only be swapped in an active session",
  SWAP_SETS_COMPLETED:
    "This exercise already has completed sets. Swap it before completing any.",
  NOTES_DISCARDED_SESSION: "A discarded workout cannot take notes",

  // ── Linear periodization (ROUT-17 to ROUT-19) ──────────────────────────
  LINEAR_BLOCK_INVALID: "This exercise's block is not valid: {reason}",
  LINEAR_BLOCK_EXTRA_SET: "An exercise on an 8-week block takes no extra sets",
  LINEAR_BLOCK_KIND_FIXED:
    "The working sets of an 8-week block cannot change kind",
  LINEAR_BLOCK_LOAD_FIXED:
    "The load of an 8-week block is prescribed and cannot be changed",
  LINEAR_BLOCK_SWAP_ROUTINE:
    "An exercise on an 8-week block can be swapped for this workout only",
  LINEAR_BLOCK_NOT_LINEAR: "This exercise is not on an 8-week block",
  LINEAR_BLOCK_NOT_FINISHED:
    "This exercise's block has not finished, so there is nothing to choose yet",

  // ── Corrections (LIVE-17) ──────────────────────────────────────────────
  CORRECTION_NOT_COMPLETED: "Only a completed workout can be corrected",
  CORRECTION_NOT_LATEST: "Only your most recent workout can be corrected",
  CORRECTION_LATER_SESSION:
    "This workout can no longer be corrected: another one has started since",
  CORRECTION_WINDOW_PASSED:
    "This workout can no longer be corrected: the correction window has passed",
  CORRECTION_LIMIT_REACHED:
    "This workout has been corrected as many times as allowed",
  CORRECTION_WEIGHT_RANGE: "Weight must be between 0 and {max} kg",
  CORRECTION_REPS_RANGE: "Reps must be a whole number between 0 and {max}",
  CORRECTION_RPE_RANGE: "RPE must be between {min} and {max}",
  CORRECTION_COMPLETED_NEEDS_REP: "A completed set needs at least one rep",
  CORRECTION_NOTHING_TO_CORRECT:
    "Nothing to correct: every set already reads that way",
  CORRECTION_KEEPS_ONE_SET: "A finished workout keeps at least one completed set",

  // ── Sharing a workout ──────────────────────────────────────────────────
  SESSION_SHARE_NOTHING_CHOSEN: "Choose at least one part of the recap to share",
  SESSION_SHARE_NOT_COMPLETED: "Only completed sessions can be shared",
  SESSION_SHARE_LINKS_MAX: "A session can have at most {max} active share links",

  // ── Exercises ──────────────────────────────────────────────────────────
  EXERCISE_STARS_MAX: "You can star at most {max} exercises",
  CUSTOM_EXERCISE_NAME_TAKEN:
    "NAME_TAKEN: you already have an exercise by that name, or the catalog does",
  CUSTOM_EXERCISE_LIMIT_REACHED:
    "LIMIT_REACHED: you can keep up to {max} custom exercises, archived ones included",
  CUSTOM_EXERCISE_NO_ROOM:
    "LIMIT_REACHED: this routine needs custom exercises you have no room for (up to {max})",
  CUSTOM_EXERCISE_IN_USE:
    "IN_USE: a routine or a workout uses this exercise, so it can be archived but not deleted",

  // ── Activity and moderation ────────────────────────────────────────────
  ACTIVITY_AUDIENCE_REQUIRED: "Choose an audience for at least one type",
  COMMENT_LENGTH:
    "A comment must not be empty and may be at most {max} characters.",
  COMMENTS_PER_DAY: "You can write at most {max} comments a day.",
  REACTION_OWN_ACTIVITY: "You cannot react to your own activity",
  REPORTS_PER_DAY: "You can file at most {max} reports a day.",
  REPORTED_CONTENT_ALREADY_HIDDEN: "The reported content is already hidden",
  REPORTED_CONTENT_NOT_HIDDEN: "The reported content is not hidden",
  REPORT_ALREADY_REVIEWED: "This report has already been reviewed",

  // ── Members, partners and blocks ───────────────────────────────────────
  USERNAME_TAKEN: "Username is already taken",
  USERNAME_RESERVED: "This username is reserved",
  USERNAME_INVALID:
    "Username must be 3-30 characters, use letters, numbers, underscores or hyphens, and start and end with a letter or number",
  FOLLOW_SELF: "You cannot follow yourself",
  UNFOLLOW_SELF: "You cannot unfollow yourself",
  BLOCK_SELF: "You cannot block yourself",
  BLOCKS_MAX: "You can block at most {max} members.",
  PARTNER_REQUEST_SELF: "You cannot send a training-partner request to yourself",
  PARTNER_REQUESTS_PER_DAY:
    "You can send at most {max} training-partner requests per day.",
  PARTNER_ALREADY_EXISTS:
    "A training-partner relationship already exists with this member.",
  PARTNERS_MAX: "An account can have at most {max} training partners.",
  ENCOURAGEMENTS_MAX:
    "You can send this partner at most {max} encouragements in 24 hours.",
  ENCOURAGEMENT_RETRY: "Please retry the encouragement.",

  // ── Direct messages (MSG-01) ───────────────────────────────────────────
  MESSAGE_SELF: "You cannot message yourself",
  MESSAGE_LENGTH:
    "A message must not be empty and may be at most {max} characters.",
  MESSAGES_PER_MINUTE: "You can send at most {max} messages a minute.",
  CONVERSATIONS_PER_DAY: "You can start at most {max} new conversations a day.",
  MESSAGE_NOT_ADMITTED: "This member is not taking messages from you.",
  CONVERSATION_CLOSED: "This conversation can no longer receive messages.",
  MESSAGING_UNAVAILABLE: "Messaging is not available for this account.",
  // ── Message moderation (MSG-09) ────────────────────────────────────────
  MESSAGING_RESTRICTED:
    "Moderation has restricted your messaging. You can still read and delete messages.",
  REPORT_OWN_MESSAGE: "You cannot report your own message",
  MESSAGING_ALREADY_RESTRICTED: "This member's messaging is already restricted",
  MESSAGING_NOT_RESTRICTED: "This member's messaging is not restricted",

  // ── Account and settings ───────────────────────────────────────────────
  ACCOUNT_CONFLICT: "Account conflict for this email",
  ACCOUNT_DELETE_CONFIRMATION:
    "Type your username exactly as it appears to confirm.",
  ACCOUNT_DELETE_MODERATOR:
    "A moderator account cannot be deleted while it holds moderator access.",
  ACCOUNT_DELETE_UNAVAILABLE:
    "Your account could not be deleted right now. Nothing was removed; try again shortly.",
  FEATURED_ITEM_UNAVAILABLE:
    "A featured item is not currently available to this account",
  FEATURED_ITEMS_MAX: "Choose at most {max} featured items",
  FEATURED_RANK_ONE: "Choose at most one featured rank",
  TRAINING_LOCATION_DEFAULT: "Exactly one training location must be the default.",
  TRAINING_LOCATION_NAMES_UNIQUE: "Training location names must be unique.",
  PLATE_WEIGHTS_UNIQUE: "Plate weights must be unique within {name}.",
  GOALS_MAX: "No more than {max} measurable goals are allowed",
  GOAL_DUPLICATE: "Duplicate measurable goal",
  GOAL_STRENGTH_NEEDS_EXERCISE: "Strength goals require an exercise",
  BODY_ENTRY_IN_FUTURE: "An entry cannot be dated in the future",
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_MESSAGES;

export const API_ERROR_CODES = Object.keys(
  API_ERROR_MESSAGES,
) as readonly ApiErrorCode[];

/** Values a template names, sent as they were substituted. */
export type ApiErrorParams = Record<string, string | number>;

/**
 * The body of every error response. `code` and `params` are present only for
 * a refusal listed above; `message` is always the English sentence.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  code?: ApiErrorCode;
  params?: ApiErrorParams;
  timestamp?: string;
  path?: string;
}

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(API_ERROR_MESSAGES, value)
  );
}

/** A template with its `{name}` placeholders filled from `params`. */
export function apiErrorMessage(
  code: ApiErrorCode,
  params: ApiErrorParams = {},
): string {
  return API_ERROR_MESSAGES[code].replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : whole,
  );
}

/**
 * What the server hands an exception constructor: Nest takes `message` as the
 * exception's own message and the error filter forwards `code` and `params`.
 */
export function apiError(
  code: ApiErrorCode,
  params?: ApiErrorParams,
): { code: ApiErrorCode; message: string; params?: ApiErrorParams } {
  return {
    code,
    message: apiErrorMessage(code, params),
    ...(params ? { params } : {}),
  };
}
