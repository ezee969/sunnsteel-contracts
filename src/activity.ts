import type { AchievementCategory } from './achievements';
import type { SharedRoutineOwner } from './routine-sharing';
import type { IsoDateString } from './shared';
import type {
  ProfilePrivacySettings,
  ProfileVisibility,
  UserSearchResponse,
} from './user';
import type { ProgressionSetChange } from './workout';

// Generated activity (SOC-03) and selective sharing (SOC-04) -----------------
//
// **Activity comes from doing, not posting.** Every entry is one fact the
// product already verified — a completed session, a personal record, a load
// progression, an earned achievement, a streak milestone, a comeback, a
// routine its owner shared — generated on read and never stored. There is no
// composer, and nothing here could carry free text.
//
// **Visibility is never implicit.** Every type starts at `PRIVATE`, and the
// profile section a type's data comes from is the upper bound: a private
// records section cannot produce a public record entry, whatever the entry's
// own audience says.
//
// Rank progression is not a type yet: nothing records when a rank was
// reached, and deriving it would replay a member's whole history on every
// read. Challenges arrive with `SOC-13`.

export const ACTIVITY_TYPES = [
  'SESSION_COMPLETED',
  'PERSONAL_RECORD',
  'PROGRESSION_CHANGED',
  'ACHIEVEMENT_UNLOCKED',
  'STREAK_MILESTONE',
  'COMEBACK',
  'ROUTINE_SHARED',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** The `PROF-06` sections activity can come from. */
export type ActivitySection = keyof Pick<
  ProfilePrivacySettings,
  'workoutHistory' | 'records' | 'achievements' | 'routines'
>;

/**
 * The one section each type's data comes from. An entry can never be seen by
 * someone that section is hidden from.
 */
export const ACTIVITY_TYPE_SECTIONS: Record<ActivityType, ActivitySection> = {
  SESSION_COMPLETED: 'workoutHistory',
  PERSONAL_RECORD: 'records',
  PROGRESSION_CHANGED: 'workoutHistory',
  ACHIEVEMENT_UNLOCKED: 'achievements',
  STREAK_MILESTONE: 'achievements',
  COMEBACK: 'achievements',
  ROUTINE_SHARED: 'routines',
};

/** Who may see an entry: the `PROF-06` values, so there is one vocabulary. */
export type ActivityAudience = ProfileVisibility;

/** Every type starts here until its owner chooses otherwise. */
export const ACTIVITY_DEFAULT_AUDIENCE: ActivityAudience = 'PRIVATE';

// Themed reactions (SOC-05) ------------------------------------------------
//
// An acknowledgement of one activity entry, never a score. The catalog is
// deliberately four: they say "this was work", and nothing in the product
// counts, ranks or orders by them. Blocking and the entry's own visibility
// are settled before one is shown or accepted, by the activity read itself.

export const ACTIVITY_REACTIONS = [
  'STRENGTH',
  'DISCIPLINE',
  'RESPECT',
  'INSPIRING',
] as const;
export type ActivityReaction = (typeof ACTIVITY_REACTIONS)[number];

/**
 * What a viewer may see of an entry's reactions: how many of each, and their
 * own, so the control can show what they chose. **Deliberately no list of who
 * reacted** -- that is an identity surface with its own privacy question, and
 * a name beside an entry would say more about the reactor than the work.
 * Members either side of a block are absent from the counts, so a number
 * cannot reveal one of them.
 */
export interface ActivityReactionSummary {
  counts: Record<ActivityReaction, number>;
  /** The viewer's own reaction, or null; always null on the viewer's own entry. */
  viewerReaction: ActivityReaction | null;
}

/**
 * PUT /activity/entries/reaction. `null` removes the viewer's reaction, and
 * choosing the one already chosen removes it too, so there is one per member
 * per entry and nothing to accumulate. Reacting to your own entry is refused.
 */
export interface SetActivityReactionRequest {
  entryId: string;
  reaction: ActivityReaction | null;
}

/** Stable successful response of PUT /activity/entries/reaction. */
export interface SetActivityReactionResponse {
  entryId: string;
  reactions: ActivityReactionSummary;
}

/**
 * Where the viewer may open the record an entry came from. The server decides
 * it, so the client never judges what a viewer may read; an entry whose
 * record has no such place for this viewer has `link: null` and still names
 * the record.
 */
export type ActivityLink =
  | { kind: 'OWN_SESSION'; sessionId: string }
  | { kind: 'OWN_EXERCISE'; exerciseId: string }
  | { kind: 'OWN_ACHIEVEMENTS' }
  | { kind: 'OWN_ROUTINE'; routineId: string }
  | { kind: 'MEMBER_RECORDS'; username: string }
  | { kind: 'MEMBER_ACHIEVEMENTS'; username: string }
  | { kind: 'MEMBER_ROUTINE'; username: string; routineId: string };

interface ActivityEntryBase {
  /**
   * Stable across reads and opaque to clients. It is the key an override is
   * stored under, so it must be sent back unchanged.
   */
  id: string;
  occurredAt: IsoDateString;
  author: SharedRoutineOwner;
  link: ActivityLink | null;
  /**
   * Shared by the facts of one workout, so a session and the records it set
   * can be shown together; null for a fact that belongs to no workout.
   */
  groupKey: string | null;
  /**
   * `SOC-05`. Travels inside the entry on purpose: a reaction can then never
   * be shown on an entry this viewer was not allowed to see, because the same
   * read decides both.
   */
  reactions: ActivityReactionSummary;
  /**
   * `SOC-06`. Travels inside the entry for the same reason reactions do. Only
   * the count and what this viewer may do; the comments themselves are a
   * separate read, because a feed page must not carry every comment on every
   * entry.
   */
  comments: ActivityCommentSummary;
}

export interface SessionCompletedActivity extends ActivityEntryBase {
  type: 'SESSION_COMPLETED';
  session: {
    routineName: string;
    dayName: string | null;
    completedSets: number;
    /** External load × reps, canonical kilograms. */
    volumeKg: number;
    durationSec: number | null;
  };
}

export interface PersonalRecordActivity extends ActivityEntryBase {
  type: 'PERSONAL_RECORD';
  record: {
    exerciseId: string;
    exerciseName: string;
    weightKg: number;
    reps: number;
    estimated1rmKg: number;
  };
}

export interface ProgressionActivity extends ActivityEntryBase {
  type: 'PROGRESSION_CHANGED';
  progression: {
    exerciseId: string;
    exerciseName: string;
    sets: ProgressionSetChange[];
  };
}

export interface AchievementActivity extends ActivityEntryBase {
  type: 'ACHIEVEMENT_UNLOCKED';
  achievement: {
    id: string;
    title: string;
    description: string;
    category: AchievementCategory;
  };
}

export interface StreakMilestoneActivity extends ActivityEntryBase {
  type: 'STREAK_MILESTONE';
  streak: {
    achievementId: string;
    title: string;
    streakDays: number;
  };
}

export interface ComebackActivity extends ActivityEntryBase {
  type: 'COMEBACK';
  comeback: {
    /** Full local-calendar days without a completed session before it. */
    inactiveDays: number;
    activeDays: number;
    windowDays: number;
    returnedAt: IsoDateString;
  };
}

export interface RoutineSharedActivity extends ActivityEntryBase {
  type: 'ROUTINE_SHARED';
  routine: {
    routineId: string;
    name: string;
    dayCount: number;
    exerciseCount: number;
  };
}

export type ActivityEntry =
  | SessionCompletedActivity
  | PersonalRecordActivity
  | ProgressionActivity
  | AchievementActivity
  | StreakMilestoneActivity
  | ComebackActivity
  | RoutineSharedActivity;

export const ACTIVITY_PAGE_DEFAULT_LIMIT = 20;
export const ACTIVITY_PAGE_MAX_LIMIT = 50;

/**
 * The feed considers at most this many followed members, and says so when it
 * reached the ceiling rather than presenting a partial feed as a whole one.
 */
export const ACTIVITY_FEED_FOLLOWED_MAX = 500;

/** Entry ids are opaque but bounded; anything longer is refused. */
export const ACTIVITY_ENTRY_ID_MAX_LENGTH = 200;

export interface ActivityPageQuery {
  limit?: number;
  /** Opaque; from the previous page's `nextCursor`. */
  cursor?: string;
}

export interface ActivityPage<Entry = ActivityEntry> {
  entries: Entry[];
  nextCursor?: string;
}

/**
 * GET /activity/feed: activity of the members the viewer follows that each
 * member's audiences allow the viewer to see, newest first.
 */
export interface ActivityFeedResponse extends ActivityPage {
  /**
   * How many members the viewer follows, so an empty feed can say whether
   * there is nobody to hear from or nothing they were allowed to see.
   */
  followedCount: number;
  /** True when the viewer follows more than `ACTIVITY_FEED_FOLLOWED_MAX`. */
  followedTruncated: boolean;
}

/** GET /activity/members/:identifier — one member's activity, as this viewer may see it. */
export type MemberActivityResponse = ActivityPage;

/** What narrowed an entry below the audience its owner chose. */
export const ACTIVITY_CAPS = ['SECTION', 'ROUTINE'] as const;
export type ActivityCap = (typeof ACTIVITY_CAPS)[number];

/** How one of the owner's own entries is shared. */
export interface ActivityEntrySharing {
  section: ActivitySection;
  /** The owner's current rule for that section. */
  sectionRule: ProfileVisibility;
  /** The type's default audience. */
  defaultAudience: ActivityAudience;
  /** This entry's own audience, or null when it follows the default. */
  override: ActivityAudience | null;
  /**
   * Who can actually see it: the narrowest of the section rule, the chosen
   * audience and, for a shared routine, the routine's own visibility.
   */
  effectiveAudience: ActivityAudience;
  /** Set when the effective audience is narrower than the one chosen. */
  cappedBy: ActivityCap | null;
}

export type OwnActivityEntry = ActivityEntry & { sharing: ActivityEntrySharing };

/** GET /activity/mine — every entry of the owner's, whoever may see it. */
export type OwnActivityResponse = ActivityPage<OwnActivityEntry>;

/**
 * The audiences the owner can preview. `FOLLOWERS` is a member who follows
 * them; `PUBLIC` is any other signed-in member. Activity is never shown
 * signed out.
 */
export const ACTIVITY_PREVIEW_AUDIENCES = ['FOLLOWERS', 'PUBLIC'] as const;
export type ActivityPreviewAudience =
  (typeof ACTIVITY_PREVIEW_AUDIENCES)[number];

/**
 * GET /activity/mine/preview — the owner's activity exactly as that audience
 * would receive it, through the same read, links included.
 */
export interface ActivityPreviewQuery extends ActivityPageQuery {
  audience: ActivityPreviewAudience;
}

/** GET and PUT /activity/sharing */
export interface ActivitySharingSettings {
  /** The default audience of every type. */
  defaults: Record<ActivityType, ActivityAudience>;
  /** The section rules that cap them, so the UI can say when one does. */
  sections: Record<ActivitySection, ProfileVisibility>;
}

/**
 * PUT /activity/sharing. A partial write: an omitted type keeps its stored
 * default. A default applies to past entries of the type as well as future
 * ones, except those with their own audience.
 */
export interface UpdateActivitySharingRequest {
  defaults: Partial<Record<ActivityType, ActivityAudience>>;
}

/**
 * PUT /activity/entries/audience. `null` returns the entry to its type's
 * default; `PRIVATE` withdraws it from everyone but its owner. Either way it
 * can never exceed its section.
 */
export interface SetActivityEntryAudienceRequest {
  entryId: string;
  audience: ActivityAudience | null;
}

/** Stable successful response of PUT /activity/entries/audience. */
export interface SetActivityEntryAudienceResponse {
  entryId: string;
  sharing: ActivityEntrySharing;
}

// Activity comments (SOC-06) --------------------------------------------------
//
// The first free text one member writes for another to read. Everything before
// it is derived: an activity entry comes from verified training, a `SOC-05`
// reaction is one of four fixed values, and a `PROF-10` report goes only to a
// moderator. A comment is none of those, and the shape below is bounded
// accordingly.
//
// It is **discussion attached to one verified thing**, not a posting surface.
// There are no threads, no mentions, no editing, no reactions on comments, no
// comment timeline and no per-member comment page; adding any of them is a new
// decision rather than an extension of this one. Nothing else in the product
// reads these rows -- no total, no rank, no ordering input -- the guard
// `SOC-05` established so acknowledgement cannot become a score.

/** One comment may be at most this long. Enforced by the server. */
export const ACTIVITY_COMMENT_MAX_LENGTH = 500;

/** One account writes at most this many comments a day, across all entries. */
export const ACTIVITY_COMMENTS_PER_DAY_MAX = 100;

/** One page of comments on one entry. */
export const ACTIVITY_COMMENTS_PAGE_SIZE = 20;

/**
 * What a viewer may see of an entry's comments without reading them: how many,
 * and whether they may add one. The count excludes members either side of a
 * block and any comment a moderator has hidden, so it always matches what a
 * read of the list would return for this viewer -- a count that disagreed
 * would advertise a comment they cannot see.
 */
export interface ActivityCommentSummary {
  count: number;
  /**
   * False on your own entry only because the server still accepts it -- an
   * owner may reply on their own activity. It is false when the viewer has
   * spent `ACTIVITY_COMMENTS_PER_DAY_MAX`.
   */
  canComment: boolean;
}

/**
 * One comment as a viewer receives it. `canDelete` is resolved server-side and
 * is true for two people: the comment's author, and the owner of the activity
 * it hangs from -- it is their workout it is attached to.
 */
export interface ActivityComment {
  id: string;
  entryId: string;
  author: UserSearchResponse;
  body: string;
  createdAt: IsoDateString;
  canDelete: boolean;
}

export interface ActivityCommentsQuery {
  entryId: string;
  cursor?: string;
  limit?: number;
}

/** Stable successful response of GET /activity/entries/comments. */
export interface ActivityCommentsResponse {
  entryId: string;
  comments: ActivityComment[];
  nextCursor: string | null;
  /** Repeated here so a reader of the list needs no second request. */
  summary: ActivityCommentSummary;
}

/**
 * POST /activity/entries/comments. The entry is identified the way `SOC-05`
 * identifies it, by the stable activity key, and the same read decides whether
 * this viewer may comment at all: an entry they may not see answers **404**,
 * never 403, which would confirm it exists.
 */
export interface CreateActivityCommentRequest {
  entryId: string;
  body: string;
}

export interface CreateActivityCommentResponse {
  comment: ActivityComment;
  summary: ActivityCommentSummary;
}

/** DELETE /activity/entries/comments/:id. A real delete, not a flag. */
export interface DeleteActivityCommentResponse {
  entryId: string;
  summary: ActivityCommentSummary;
}
