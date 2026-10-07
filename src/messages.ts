import type { SharedRoutineSummary } from "./routine-sharing";
import type { SetKind } from "./set-kinds";
import type { IsoDateString, WeightUnit } from "./shared";
import type { SessionRecapRecord, SharedSessionOwner } from "./workout";

// Direct messages (MSG-01) -----------------------------------------------------
//
// One-to-one conversations of text. Messages are stored on the server and are
// not end-to-end encrypted, and the product says so. The server decides every
// read and write: a block hides a conversation from both participants while it
// lasts, a member hidden by moderation can be messaged by no one and messages
// no one, and who may *start* a conversation is the recipient's setting. An
// existing conversation keeps working whatever the setting says later.
//
// MSG-09 adds the safety controls: a participant reports a message, which
// captures it and the few before it for a moderator; a moderator can hide one
// message from the other participant and restrict an account's messaging,
// which stops it sending and starting conversations until lifted.
//
// MSG-03 adds unread state: a read position per participant, for that reader
// only. Whether a message was read is never shown to its sender.
//
// MSG-07 lets a message carry one of the sender's routines. Sending it is the
// sender's consent: the other participant may open and clone that routine
// whatever its visibility, until the message is deleted. The card is resolved
// when it is read, never copied into the message.
//
// MSG-10 adds a finished workout the same way: sending it is the sender's
// consent, whatever their profile privacy, until the message is deleted.

/**
 * Who may start a conversation with a member. `FOLLOWED`: members they follow.
 * `EVERYONE` (MSG-02): members they follow reach the inbox, anyone else lands
 * in Requests. `NOBODY`: no one may start a new one.
 */
export const MESSAGE_PERMISSIONS = ["FOLLOWED", "EVERYONE", "NOBODY"] as const;
export type MessagePermission = (typeof MESSAGE_PERMISSIONS)[number];
export const DEFAULT_MESSAGE_PERMISSION: MessagePermission = "FOLLOWED";

/** Characters in one message, counted as code points. */
export const MESSAGE_BODY_MAX = 2000;
/** Messages one member may send in a rolling minute. */
export const MESSAGES_PER_MINUTE_MAX = 30;
/** Conversations one member may start in a rolling day. */
export const NEW_CONVERSATIONS_PER_DAY_MAX = 20;
export const CONVERSATIONS_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 30;

/** Length as a reader counts it: an emoji is one character, not two. */
export function messageBodyLength(body: string): number {
  return Array.from(body).length;
}

/**
 * The stored form of a typed message: line endings made `\n` and the ends
 * trimmed, the lines in between kept as written. Null when it is empty or too
 * long -- it is refused rather than cut, because a message clipped mid-sentence
 * would misrepresent its author.
 */
export function normalizeMessageBody(body: string): string | null {
  const text = body.replace(/\r\n?/g, "\n").trim();
  if (text.length === 0 || messageBodyLength(text) > MESSAGE_BODY_MAX) {
    return null;
  }
  return text;
}

/**
 * MSG-07: what a message, its text left empty or not, may carry -- one of
 * them, with an optional note. MSG-10 adds a finished workout.
 */
export const MESSAGE_ATTACHMENT_KINDS = ["ROUTINE", "WORKOUT"] as const;
export type MessageAttachmentKind = (typeof MESSAGE_ATTACHMENT_KINDS)[number];

/**
 * MSG-07: a routine in a message, as it is now. `routine` is null once it is
 * no longer available -- deleted, or hidden by moderation -- and the card
 * says so rather than showing what it once was.
 */
export interface MessageRoutineAttachment {
  kind: "ROUTINE";
  routine: SharedRoutineSummary | null;
}

/**
 * MSG-10: a finished workout in a card -- what was trained and its totals,
 * as the workout is now (a correction shows). Never its notes, RPE or the
 * comparison with the session before.
 */
export interface MessageWorkoutSummary {
  sessionId: string;
  routineName: string;
  dayName: string | null;
  endedAt: IsoDateString;
  durationSec: number;
  totalVolumeKg: number;
  completedSets: number;
}

/** MSG-10: `workout` is null once it is no longer available (deleted). */
export interface MessageWorkoutAttachment {
  kind: "WORKOUT";
  workout: MessageWorkoutSummary | null;
}

export type MessageAttachment =
  | MessageRoutineAttachment
  | MessageWorkoutAttachment;

/** MSG-10: one completed set of a shared workout. Never its RPE. */
export interface SharedWorkoutSet {
  setNumber: number;
  kind: SetKind;
  /** Canonical kilograms; null for a set logged without a load. */
  weightKg: number | null;
  reps: number | null;
}

export interface SharedWorkoutExercise {
  exerciseId: string;
  /** The exercise as it was performed (a swapped slot by its substitute). */
  name: string;
  sets: SharedWorkoutSet[];
}

/**
 * MSG-10: GET /conversations/:id/messages/:messageId/workout. The workout a
 * message shared, opened: the summary, the records it set and each
 * exercise's completed sets, in the order they were trained. Nothing else of
 * the session -- no notes, no RPE, no previous-session comparison.
 */
export interface SharedWorkout extends MessageWorkoutSummary {
  owner: SharedSessionOwner;
  /** The owner's unit; a reader shows weights in their own. */
  weightUnit: WeightUnit;
  records: SessionRecapRecord[];
  exercises: SharedWorkoutExercise[];
}

/**
 * MSG-07: the stored text of a message. A message with a routine may leave it
 * empty (null); one without must say something. Undefined when the text is
 * refused: empty with nothing attached, or too long.
 */
export function messageNote(
  body: string | undefined | null,
  hasAttachment: boolean,
): string | null | undefined {
  if ((body ?? "").trim().length === 0) {
    return hasAttachment ? null : undefined;
  }
  return normalizeMessageBody(body ?? "") ?? undefined;
}

/** The other participant, or null once their account was deleted. */
export interface ConversationMember {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface ConversationMessage {
  id: string;
  sentByMe: boolean;
  /**
   * Null once its author deleted it; the place stays as "Message deleted".
   * Also null for the other participant while moderation hides it (MSG-09),
   * and for a routine sent without a note (MSG-07).
   */
  body: string | null;
  deleted: boolean;
  /**
   * MSG-09: a moderator hid this message from the other participant. They read
   * "Removed by moderation" in its place; its author still reads the text and
   * is told it is hidden.
   */
  hiddenByModeration: boolean;
  /**
   * MSG-07: a routine it carries, resolved as it is now. Null when it carries
   * none, and whenever the text is withheld (deleted, or hidden from the
   * viewer by moderation).
   */
  attachment: MessageAttachment | null;
  createdAt: IsoDateString;
}

/**
 * MSG-02: a conversation that is still a request. `INCOMING`: the viewer may
 * accept, decline or block. `OUTGOING`: the viewer sent it and waits -- told
 * neither whether it was seen nor whether it was declined.
 */
export interface ConversationRequest {
  direction: "INCOMING" | "OUTGOING";
}

export interface ConversationSummary {
  id: string;
  /** Null when the other member deleted their account ("Deleted member"). */
  counterpart: ConversationMember | null;
  /** The newest message the viewer can see, or null when there is none. */
  lastMessage: ConversationMessage | null;
  lastMessageAt: IsoDateString | null;
  /**
   * Whether the viewer may write in it now. False when the other member's
   * account is gone, or the viewer's own messaging is unavailable or
   * restricted.
   */
  canSend: boolean;
  /**
   * MSG-09: a moderator restricted the viewer's messaging, which is why they
   * cannot write. Only ever about the viewer: nobody else is told.
   */
  messagingRestricted: boolean;
  /**
   * MSG-03: the other member wrote something the viewer has not seen -- a
   * message after the viewer's read position that is neither deleted nor
   * removed for them. The viewer's own messages never count.
   */
  unread: boolean;
  /**
   * MSG-03: the viewer's read position, where "new since you last looked"
   * starts. Null when they have never read the conversation. It is the
   * viewer's alone: no read receipts, so a sender never learns it.
   */
  lastReadAt: IsoDateString | null;
  /** MSG-02: null once accepted, or for a conversation that never was a request. */
  request: ConversationRequest | null;
}

/**
 * MSG-02: GET /conversations?box=. The inbox holds accepted conversations
 * and the viewer's own requests; Requests holds the ones waiting for them.
 */
export const CONVERSATION_BOXES = ["INBOX", "REQUESTS"] as const;
export type ConversationBox = (typeof CONVERSATION_BOXES)[number];

/**
 * MSG-02: after a decline, the same member's new request is refused for this
 * many days, unless the recipient follows them or writes first.
 */
export const MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS = 30;

/**
 * MSG-08: a message push waits this long and is dropped if the conversation
 * was read meanwhile, so two members talking live do not buzz each other.
 */
export const MESSAGE_PUSH_DELAY_SECONDS = 30;

/** GET /conversations, newest activity first. */
export interface ConversationsResponse {
  conversations: ConversationSummary[];
  nextCursor: string | null;
  /** MSG-09: the viewer's own messaging is restricted by moderation. */
  messagingRestricted: boolean;
}

/**
 * MSG-09: a report of a message captures it and at most this many messages
 * before it in its conversation, as the reporter could see them then.
 */
export const MESSAGE_REPORT_CONTEXT_BEFORE = 5;

/**
 * MSG-03: POST /conversations/:id/read. Moves the viewer's read position to
 * the message they have seen (`through`, the newest one on their screen),
 * never backwards, so a message that arrived after it stays unread.
 */
export interface MarkConversationReadRequest {
  through: string;
}

/** MSG-03: GET /conversations/unread, for the navigation's count. */
export interface UnreadConversationsResponse {
  /** Conversations with something new, not messages (owner, 2026-10-06). */
  unreadConversations: number;
  /**
   * MSG-02: requests waiting for the viewer. For the Requests tab only: they
   * never count in the navigation (owner, 2026-10-06).
   */
  requests: number;
}

/** GET /conversations/:id/messages, newest first; `cursor` pages older. */
export interface ConversationMessagesResponse {
  conversation: ConversationSummary;
  messages: ConversationMessage[];
  nextCursor: string | null;
}

/**
 * POST /conversations. Starts a conversation with its first message, so an
 * empty conversation never exists; when one with this member already exists
 * the message is sent there instead. `recipient` is a username or an id.
 */
export interface StartConversationRequest {
  recipient: string;
  /** Optional when the message carries a routine or a workout. */
  body?: string;
  /** MSG-07: one of the sender's own routines. */
  routineId?: string;
  /** MSG-10: one of the sender's own finished workouts. Not with a routine. */
  sessionId?: string;
}

/** POST /conversations/:id/messages. */
export interface SendMessageRequest {
  /** Optional when the message carries a routine or a workout. */
  body?: string;
  /** MSG-07: one of the sender's own routines. */
  routineId?: string;
  /** MSG-10: one of the sender's own finished workouts. Not with a routine. */
  sessionId?: string;
}

export interface SendMessageResponse {
  conversation: ConversationSummary;
  message: ConversationMessage;
}

/** PUT /users/preferences/messages. */
export interface UpdateMessagePermissionRequest {
  messagePermission: MessagePermission;
}

/**
 * On the authenticated member profile only: whether the viewer may start a
 * conversation, and the one they already have. The server decides; a viewer
 * who may not is told nothing more.
 */
export interface MemberMessagingState {
  canStart: boolean;
  conversationId: string | null;
  /** MSG-02: a first message would land in their Requests. */
  asRequest: boolean;
}

export function isMessagePermission(value: unknown): value is MessagePermission {
  return (MESSAGE_PERMISSIONS as readonly unknown[]).includes(value);
}
