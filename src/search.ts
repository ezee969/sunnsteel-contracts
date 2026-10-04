import type { SharedRoutineOwner, SharedRoutineSummary } from './routine-sharing';
import type { UserSearchResponse } from './user';
import type { WorkoutSessionSummary } from './workout';

// Unified search (NAV-01) -----------------------------------------------------
//
// One header search finds members, exercises, routines and the member's own
// workouts. **Search is not a new visibility rule**: every category is found
// under a rule that already decides it elsewhere.
//
// - Members: the `PROF-09` discovery switches, name and username separately,
//   never the searcher, never an email, and neither party of a block nor a
//   member a moderator hid (`PROF-10`, `TRUST-04`).
// - Routines of other members: `ROUT-07`'s `canViewRoutine` candidate set --
//   public routines in accounts whose routines are public, followers-only
//   ones to followers -- without archived, empty or hidden routines.
// - Workouts: the searcher's own only.
//
// Exercises and the searcher's own routines are not read here. Both are
// already in the client's cache, and catalog exercise names exist in Spanish
// only in the frontend's message files, so the client matches them itself in
// both languages.

/** A query shorter than this, once trimmed, finds nothing and asks nothing. */
export const SEARCH_QUERY_MIN_LENGTH = 2;
/** Anything longer is cut to this before it is matched. */
export const SEARCH_QUERY_MAX_LENGTH = 100;
/** Each category's share of `GET /search`, the preview behind "All". */
export const SEARCH_PREVIEW_LIMIT = 4;
/** A page of one category unless the client asks for fewer. */
export const SEARCH_PAGE_SIZE = 20;
/** The most one page of one category may hold. */
export const SEARCH_PAGE_SIZE_MAX = 50;

/** The categories the server answers; the order is the order they are shown. */
export const SEARCH_SERVER_CATEGORIES = ['members', 'routines', 'workouts'] as const;
export type SearchServerCategory = (typeof SEARCH_SERVER_CATEGORIES)[number];

/**
 * The query as every reader matches it: trimmed, inner whitespace collapsed,
 * cut to `SEARCH_QUERY_MAX_LENGTH`. `null` when it is too short to search.
 */
export function normalizeSearchQuery(raw: string | null | undefined): string | null {
  const query = (raw ?? '').trim().replace(/\s+/g, ' ').slice(0, SEARCH_QUERY_MAX_LENGTH).trim();
  return query.length >= SEARCH_QUERY_MIN_LENGTH ? query : null;
}

/**
 * One routine another member shared, as a search result: the `ROUT-04`
 * summary every other reader of somebody else's routine gets, plus who wrote
 * it. It carries the prescription's size, never anything trained against it.
 */
export interface SharedRoutineSearchResult extends SharedRoutineSummary {
  author: SharedRoutineOwner;
}

/**
 * One page of one category. `nextCursor` is opaque and null when nothing
 * further matches, which is how the preview says a category has more.
 */
export interface SearchPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** GET /search?q= -- the first `SEARCH_PREVIEW_LIMIT` of each category. */
export interface SearchPreviewQuery {
  q: string;
}

export interface SearchPreviewResponse {
  /** The query as matched (`normalizeSearchQuery`), or null when too short. */
  query: string | null;
  members: SearchPage<UserSearchResponse>;
  routines: SearchPage<SharedRoutineSearchResult>;
  /** The searcher's own workouts, newest first, as the history list reads them. */
  workouts: SearchPage<WorkoutSessionSummary>;
}

/** GET /search/members|routines|workouts?q=&cursor=&limit= */
export interface SearchPageQuery {
  q: string;
  cursor?: string;
  limit?: number;
}

export type MemberSearchPage = SearchPage<UserSearchResponse>;
export type RoutineSearchPage = SearchPage<SharedRoutineSearchResult>;
export type WorkoutSearchPage = SearchPage<WorkoutSessionSummary>;

// Recent searches (NAV-03) ---------------------------------------------------
//
// The last results the member opened from search -- never what they typed --
// stored on the account so they follow the member across devices and leave
// nothing on a shared device after sign-out. A row is only a reference: every
// read resolves it again under the rule that governs its target, so a member
// who blocks the viewer or is hidden by a moderator, a routine the viewer may
// no longer read, or anything deleted simply drops out (and its row with it).

/** The most recent results an account keeps; opening another drops the oldest. */
export const RECENT_SEARCHES_MAX = 10;

/** What a recent result points at. A routine is the member's own or shared. */
export const RECENT_SEARCH_KINDS = ['MEMBER', 'EXERCISE', 'ROUTINE', 'WORKOUT'] as const;
export type RecentSearchKind = (typeof RECENT_SEARCH_KINDS)[number];

/** POST /search/recent -- the member opened this result from search. */
export interface RecordRecentSearchRequest {
  kind: RecentSearchKind;
  targetId: string;
}

/** The exercise as a recent result: enough to name it and open its page. */
export interface RecentExercise {
  id: string;
  /** The stored name; the client shows a catalog name in its language. */
  name: string;
  isCustom: boolean;
  archivedAt: string | null;
}

/** A routine as a recent result. `author` is null for the member's own. */
export interface RecentRoutine extends SharedRoutineSummary {
  author: SharedRoutineOwner | null;
  isArchived: boolean;
}

interface RecentSearchBase {
  openedAt: string;
}

export type RecentSearchItem = RecentSearchBase &
  (
    | { kind: 'MEMBER'; member: UserSearchResponse }
    | { kind: 'EXERCISE'; exercise: RecentExercise }
    | { kind: 'ROUTINE'; routine: RecentRoutine }
    | { kind: 'WORKOUT'; session: WorkoutSessionSummary }
  );

/** GET /search/recent, and the answer to every write: newest first. */
export interface RecentSearchesResponse {
  items: RecentSearchItem[];
}
