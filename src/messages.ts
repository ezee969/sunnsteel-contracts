import type { IsoDateString } from "./shared";

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
   * Also null for the other participant while moderation hides it (MSG-09).
   */
  body: string | null;
  deleted: boolean;
  /**
   * MSG-09: a moderator hid this message from the other participant. They read
   * "Removed by moderation" in its place; its author still reads the text and
   * is told it is hidden.
   */
  hiddenByModeration: boolean;
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
  body: string;
}

/** POST /conversations/:id/messages. */
export interface SendMessageRequest {
  body: string;
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
