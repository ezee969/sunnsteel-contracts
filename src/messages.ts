import type { IsoDateString } from "./shared";

// Direct messages (MSG-01) -----------------------------------------------------
//
// One-to-one conversations of text. Messages are stored on the server and are
// not end-to-end encrypted, and the product says so. The server decides every
// read and write: a block hides a conversation from both participants while it
// lasts, a member hidden by moderation can be messaged by no one and messages
// no one, and who may *start* a conversation is the recipient's setting. An
// existing conversation keeps working whatever the setting says later.

/**
 * Who may start a conversation with a member. `FOLLOWED`: members they follow.
 * `MSG-02` adds `EVERYONE` (as requests).
 */
export const MESSAGE_PERMISSIONS = ["FOLLOWED", "NOBODY"] as const;
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
  /** Null once its author deleted it; the place stays as "Message deleted". */
  body: string | null;
  deleted: boolean;
  createdAt: IsoDateString;
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
   * account is gone, or the viewer's own messaging is unavailable.
   */
  canSend: boolean;
}

/** GET /conversations, newest activity first. */
export interface ConversationsResponse {
  conversations: ConversationSummary[];
  nextCursor: string | null;
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
}

export function isMessagePermission(value: unknown): value is MessagePermission {
  return (MESSAGE_PERMISSIONS as readonly unknown[]).includes(value);
}
