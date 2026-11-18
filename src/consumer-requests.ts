import type { IsoDateString } from './shared';

// Consumer-law requests (BILL-07) --------------------------------------------

/**
 * What a member, or anyone who bought, may ask without an account, as
 * Argentina's consumer law requires of an online seller: to revoke a purchase
 * within `REVOCATION_WINDOW_DAYS` (the "botón de arrepentimiento") or to
 * cancel a subscription (the "botón de baja"). Each is recorded with a code
 * shown at once; the owner acts on it by hand.
 */
export const CONSUMER_REQUEST_KINDS = ['REVOCATION', 'CANCELLATION'] as const;
export type ConsumerRequestKind = (typeof CONSUMER_REQUEST_KINDS)[number];

export const CONSUMER_REQUEST_STATUSES = ['OPEN', 'DONE'] as const;
export type ConsumerRequestStatus = (typeof CONSUMER_REQUEST_STATUSES)[number];

/** Days after a purchase in which it may be revoked. */
export const REVOCATION_WINDOW_DAYS = 10;

export const CONSUMER_REQUEST_NAME_MAX = 120;
export const CONSUMER_REQUEST_EMAIL_MAX = 254;
/** A payment number, an account handle: whatever helps find the purchase. */
export const CONSUMER_REQUEST_REFERENCE_MAX = 100;
export const CONSUMER_REQUEST_DETAILS_MAX = 500;

/** POST /consumer-requests -- no account needed. */
export interface CreateConsumerRequest {
  kind: ConsumerRequestKind;
  name: string;
  email: string;
  reference?: string;
  details?: string;
}

/** The answer: the code that proves the request was made, and when. */
export interface ConsumerRequestReceipt {
  kind: ConsumerRequestKind;
  code: string;
  createdAt: IsoDateString;
}

/** What a moderator reads: GET /moderation/consumer-requests. */
export interface ConsumerRequestSummary {
  id: string;
  kind: ConsumerRequestKind;
  status: ConsumerRequestStatus;
  code: string;
  name: string;
  email: string;
  reference: string | null;
  details: string | null;
  createdAt: IsoDateString;
  handledAt: IsoDateString | null;
}

export interface ConsumerRequestsResponse {
  /** Open ones first, then newest first; at most `CONSUMER_REQUESTS_LIST_MAX`. */
  requests: ConsumerRequestSummary[];
}

export const CONSUMER_REQUESTS_LIST_MAX = 100;

export type ConsumerRequestField = 'kind' | 'name' | 'email' | 'reference' | 'details';

/** Code points, as a member counts them. */
function length(value: string): number {
  return Array.from(value).length;
}

/** One `@`, something before it and a dotted domain after it, no spaces. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The request as stored: trimmed, empty optional fields left out. */
export function normalizeConsumerRequest(input: CreateConsumerRequest): CreateConsumerRequest {
  const reference = input.reference?.trim() ?? '';
  const details = input.details?.trim() ?? '';
  return {
    kind: input.kind,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    ...(reference ? { reference } : {}),
    ...(details ? { details } : {}),
  };
}

/**
 * The fields a request gets wrong, after `normalizeConsumerRequest`; empty
 * when it may be sent. The client and the server ask the same question.
 */
export function consumerRequestProblems(input: CreateConsumerRequest): ConsumerRequestField[] {
  const problems: ConsumerRequestField[] = [];
  if (!(CONSUMER_REQUEST_KINDS as readonly string[]).includes(input.kind)) problems.push('kind');
  if (!input.name || length(input.name) > CONSUMER_REQUEST_NAME_MAX) problems.push('name');
  if (!EMAIL.test(input.email) || input.email.length > CONSUMER_REQUEST_EMAIL_MAX) problems.push('email');
  if (input.reference !== undefined && length(input.reference) > CONSUMER_REQUEST_REFERENCE_MAX) {
    problems.push('reference');
  }
  if (input.details !== undefined && length(input.details) > CONSUMER_REQUEST_DETAILS_MAX) {
    problems.push('details');
  }
  return problems;
}
