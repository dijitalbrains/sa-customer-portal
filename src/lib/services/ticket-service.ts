import "server-only";
import { prisma } from "@/lib/prisma";
import { formatShortDate, formatShortDateTime } from "@/lib/utils/date";
import { saApiFetch } from "@/lib/sa-api";
import type {
  FaqSuggestion,
  ReplyTicketInput,
  SubmitTicketInput,
  SubmitTicketResult,
  SupportData,
  SupportUser,
  TicketAttachment,
  TicketCategoryOption,
  TicketCustomerOption,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketNotificationPref,
} from "@/lib/types/ticket";

interface FaqSuggestionRequest {
  title: string;
  detail: string;
  categoryKey: string | null;
  userId: number;
}

export async function getSupportData(userId: number): Promise<SupportData> {
  const [user, categories, customers, tickets] = await Promise.all([
    fetchSupportUser(userId),
    fetchCategories(),
    fetchCustomers(userId),
    fetchTickets(userId),
  ]);

  return {
    user,
    categories,
    customers,
    openTickets: tickets.filter((ticket) => ticket.status === "OPENED"),
    resolvedTickets: tickets.filter((ticket) => ticket.status === "RESOLVED"),
  };
}

export async function suggestFaqAnswer(
  request: FaqSuggestionRequest,
): Promise<FaqSuggestion> {
  const response = await postSaApi("suggest-faq-answer", {
    title: request.title,
    detail: request.detail,
    category_key: request.categoryKey,
    user_id: request.userId,
  });

  const data = (await response.json()) as {
    matched?: boolean;
    answer?: string | null;
    links?: { title: string; url: string }[];
    suggestion_id?: number | null;
  };

  return toFaqSuggestion(data);
}

export async function sendFaqFeedback(
  suggestionId: number,
  userId: number,
  outcome: string,
): Promise<void> {
  await safe(() =>
    postSaApi("faq-feedback", {
      suggestion_id: suggestionId,
      user_id: userId,
      outcome,
    }),
  );
}

export async function submitTicket(
  userId: number,
  input: SubmitTicketInput,
): Promise<SubmitTicketResult> {
  const notifications = buildNotifications(userId, input);
  const imageBaseNames = input.images.map((_, index) => `${Date.now()}${index}`);

  const { ticketId, conversationId } = await prisma.$transaction(async (tx) => {
    const ticket = await tx.tickets.create({
      data: {
        ticket_category_id: input.categoryId,
        actor: "USER",
        actor_id: userId,
        submitted_for: input.customerId,
        title: input.title,
        status: "OPENED",
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: { id: true },
    });

    const conversation = await tx.ticket_conversations.create({
      data: {
        ticket_id: ticket.id,
        actor: "USER",
        actor_id: userId,
        message: input.detail,
        is_first_message: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: { id: true },
    });

    if (notifications.length > 0) {
      await tx.ticket_notifications.createMany({
        data: notifications.map((notification) => ({
          ticket_id: ticket.id,
          user_id: notification.userId,
          email: notification.email,
          text: false,
          app: false,
        })),
      });
    }

    if (imageBaseNames.length > 0) {
      await tx.ticket_conversation_images.createMany({
        data: imageBaseNames.map((base) => ({
          ticket_conversation_id: conversation.id,
          name: `${base}.jpg`,
        })),
      });
    }

    return { ticketId: ticket.id, conversationId: conversation.id };
  });

  await uploadConversationImages(Number(conversationId), input.images, imageBaseNames);
  await linkRecentAiSuggestions(userId, Number(ticketId));
  await analyzeTicket(Number(ticketId));
  await sendNewTicketPush(input.customerId, userId, input.title);

  return { ticketId: Number(ticketId) };
}

function buildNotifications(userId: number, input: SubmitTicketInput) {
  const notifications = [{ userId, email: input.notifyMe }];
  if (input.customerId !== userId) {
    notifications.push({ userId: input.customerId, email: input.notifyCustomer });
  }
  return notifications;
}

async function uploadConversationImages(
  conversationId: number,
  images: string[],
  baseNames: string[],
): Promise<void> {
  if (images.length === 0) return;

  const payload = images.map((base64, index) => ({
    base_64: base64,
    name: baseNames[index],
  }));

  await safe(() =>
    postSaApi(`upload-images/ticket/${conversationId}`, { images: payload }),
  );
}

async function analyzeTicket(ticketId: number): Promise<void> {
  await safe(() => postSaApi(`analyze-ticket/${ticketId}`, {}));
}

async function sendNewTicketPush(
  receiverId: number,
  subjectId: number,
  title: string,
): Promise<void> {
  const sender = await prisma.users
    .findUnique({ where: { id: subjectId }, select: { firstname: true } })
    .catch(() => null);

  await safe(() =>
    postSaApi("push/send", {
      receiver_id: receiverId,
      subject_id: subjectId,
      notification_type: "new-ticket",
      notification_data: { TITLE: title, FROM: sender?.firstname ?? "" },
      source: "Landing",
    }),
  );
}

async function linkRecentAiSuggestions(
  userId: number,
  ticketId: number,
): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await safe(() =>
    prisma.$executeRaw`UPDATE ticket_ai_suggestions SET ticket_id = ${ticketId} WHERE user_id = ${userId} AND type = 'customer_faq' AND ticket_id IS NULL AND created_at >= ${cutoff}`,
  );
}

function fetchSupportUser(userId: number): Promise<SupportUser> {
  return prisma.users
    .findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, firstname: true, lastname: true, email: true },
    })
    .then(toSupportUser);
}

function fetchCategories(): Promise<TicketCategoryOption[]> {
  return prisma.ticket_categories
    .findMany({
      select: { id: true, key: true, title: true },
      orderBy: { id: "asc" },
    })
    .then((rows) => rows.map(toTicketCategoryOption));
}

function fetchCustomers(userId: number): Promise<TicketCustomerOption[]> {
  return prisma.users
    .findMany({
      where: {
        deleted_at: null,
        OR: [{ id: userId }, { parent_id: userId }],
      },
      select: { id: true, firstname: true, lastname: true, email: true },
      orderBy: { id: "asc" },
    })
    .then((rows) => rows.map(toTicketCustomerOption));
}

function fetchTickets(userId: number): Promise<TicketListItem[]> {
  return prisma.tickets
    .findMany({
      where: {
        deleted_at: null,
        OR: [{ submitted_for: userId }, { actor_id: userId }],
      },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true,
        ticket_categories: { select: { title: true } },
      },
      orderBy: { created_at: "desc" },
    })
    .then((rows) => rows.map(toTicketListItem));
}

function toSupportUser(row: {
  id: bigint;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
}): SupportUser {
  return {
    id: Number(row.id),
    name: `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
    email: row.email ?? "",
  };
}

function toTicketCategoryOption(row: {
  id: number;
  key: string;
  title: string;
}): TicketCategoryOption {
  return { id: row.id, key: row.key, title: row.title };
}

function toTicketCustomerOption(row: {
  id: bigint;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
}): TicketCustomerOption {
  return {
    id: Number(row.id),
    name: `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
    email: row.email ?? "",
  };
}

function toTicketListItem(row: {
  id: bigint;
  title: string | null;
  status: "OPENED" | "RESOLVED";
  created_at: Date | null;
  ticket_categories: { title: string } | null;
}): TicketListItem {
  return {
    id: Number(row.id),
    reference: `#TK-${row.id}`,
    title: row.title ?? "",
    categoryTitle: row.ticket_categories?.title ?? "",
    status: row.status,
    date: formatShortDate(row.created_at),
  };
}

function toFaqSuggestion(data: {
  matched?: boolean;
  answer?: string | null;
  links?: { title: string; url: string }[];
  suggestion_id?: number | null;
}): FaqSuggestion {
  return {
    matched: data.matched ?? false,
    answer: data.answer ?? null,
    links: data.links ?? [],
    suggestionId: data.suggestion_id ?? null,
  };
}

export async function getTicketDetail(
  userId: number,
  ticketId: number,
): Promise<TicketDetail | null> {
  const ticket = await prisma.tickets.findFirst({
    where: {
      id: ticketId,
      deleted_at: null,
      OR: [{ submitted_for: userId }, { actor_id: userId }],
    },
    select: {
      id: true,
      title: true,
      status: true,
      created_at: true,
      updated_at: true,
      ticket_categories: { select: { title: true } },
      users_tickets_submitted_forTousers: {
        select: { firstname: true, lastname: true },
      },
      ticket_conversations: {
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          actor: true,
          message: true,
          created_at: true,
          users: { select: { firstname: true, lastname: true } },
          ticket_conversation_images: { select: { name: true } },
        },
      },
      ticket_notifications: {
        select: {
          id: true,
          user_id: true,
          email: true,
          users: { select: { firstname: true, email: true } },
        },
      },
    },
  });

  if (!ticket) return null;
  return toTicketDetail(ticket, userId);
}

export async function replyToTicket(
  userId: number,
  input: ReplyTicketInput,
): Promise<void> {
  const imageBaseNames = input.images.map((_, index) => `${Date.now()}${index}`);

  const conversationId = await prisma.$transaction(async (tx) => {
    const conversation = await tx.ticket_conversations.create({
      data: {
        ticket_id: input.ticketId,
        actor: "USER",
        actor_id: userId,
        message: input.message,
        is_first_message: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: { id: true },
    });

    if (imageBaseNames.length > 0) {
      await tx.ticket_conversation_images.createMany({
        data: imageBaseNames.map((base) => ({
          ticket_conversation_id: conversation.id,
          name: `${base}.jpg`,
        })),
      });
    }

    for (const notification of input.notifications) {
      await tx.ticket_notifications.update({
        where: { id: notification.id },
        data: { email: notification.email },
      });
    }

    return conversation.id;
  });

  await uploadConversationImages(Number(conversationId), input.images, imageBaseNames);
  await sendReplyPush(input.ticketId, userId);
  await analyzeTicket(input.ticketId);
}

export async function resolveTicket(
  userId: number,
  ticketId: number,
): Promise<void> {
  await prisma.tickets.updateMany({
    where: {
      id: ticketId,
      OR: [{ submitted_for: userId }, { actor_id: userId }],
    },
    data: {
      status: "RESOLVED",
      resolved_by: "USER",
      resolved_by_id: userId,
      resolved_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function markConversationsRead(
  userId: number,
  ticketId: number,
): Promise<void> {
  const conversations = await prisma.ticket_conversations.findMany({
    where: { ticket_id: ticketId, actor_id: { not: userId } },
    select: { id: true },
  });
  if (conversations.length === 0) return;

  const ids = conversations.map((conversation) => conversation.id);
  const reads = await prisma.ticket_conversation_reads.findMany({
    where: { ticket_conversation_id: { in: ids }, actor_id: userId },
    select: { ticket_conversation_id: true },
  });

  const readSet = new Set(reads.map((read) => String(read.ticket_conversation_id)));
  const unread = ids.filter((id) => !readSet.has(String(id)));
  if (unread.length === 0) return;

  await prisma.ticket_conversation_reads.createMany({
    data: unread.map((id) => ({
      ticket_conversation_id: id,
      actor: "USER",
      actor_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });
}

async function sendReplyPush(ticketId: number, subjectId: number): Promise<void> {
  const [ticket, sender, recipients] = await Promise.all([
    prisma.tickets
      .findUnique({ where: { id: ticketId }, select: { title: true } })
      .catch(() => null),
    prisma.users
      .findUnique({ where: { id: subjectId }, select: { firstname: true } })
      .catch(() => null),
    prisma.ticket_notifications
      .findMany({
        where: { ticket_id: ticketId, email: true },
        select: { user_id: true },
      })
      .catch(() => []),
  ]);

  const data = { TITLE: ticket?.title ?? "", FROM: sender?.firstname ?? "" };

  for (const recipient of recipients) {
    if (recipient.user_id == null) continue;
    await safe(() =>
      postSaApi("push/send", {
        receiver_id: Number(recipient.user_id),
        subject_id: subjectId,
        notification_type: "new-reply",
        notification_data: data,
        source: "Landing",
      }),
    );
  }
}

function toTicketDetail(
  ticket: {
    id: bigint;
    title: string | null;
    status: "OPENED" | "RESOLVED";
    created_at: Date | null;
    updated_at: Date | null;
    ticket_categories: { title: string } | null;
    users_tickets_submitted_forTousers: {
      firstname: string;
      lastname: string | null;
    } | null;
    ticket_conversations: ConversationRow[];
    ticket_notifications: NotificationRow[];
  },
  userId: number,
): TicketDetail {
  const messages = ticket.ticket_conversations.map(toTicketMessage);
  const lastConversation =
    ticket.ticket_conversations[ticket.ticket_conversations.length - 1];
  const lastUpdated =
    lastConversation?.created_at ?? ticket.updated_at ?? ticket.created_at;

  return {
    id: Number(ticket.id),
    reference: `#TK-${ticket.id}`,
    title: ticket.title ?? "",
    status: ticket.status,
    categoryTitle: ticket.ticket_categories?.title ?? "",
    submittedAt: formatShortDateTime(ticket.created_at),
    lastUpdatedAt: formatShortDateTime(lastUpdated),
    submittedForName: personName(ticket.users_tickets_submitted_forTousers),
    repliesLabel: `${messages.length} ${messages.length === 1 ? "message" : "messages"}`,
    assignedTo: "Support Team",
    messages,
    notifications: ticket.ticket_notifications.map((notification) =>
      toNotificationPref(notification, userId),
    ),
  };
}

interface ConversationRow {
  id: bigint;
  actor: "USER" | "IBO" | "ADMIN" | null;
  message: string | null;
  created_at: Date | null;
  users: { firstname: string; lastname: string | null } | null;
  ticket_conversation_images: { name: string | null }[];
}

interface NotificationRow {
  id: bigint;
  user_id: bigint | null;
  email: boolean;
  users: { firstname: string; email: string | null } | null;
}

function toTicketMessage(conversation: ConversationRow): TicketMessage {
  const isCustomer = conversation.actor === "USER";
  const authorName = isCustomer
    ? personName(conversation.users)
    : "Spring Aqua Support";

  return {
    id: Number(conversation.id),
    side: isCustomer ? "customer" : "support",
    authorName,
    initials: isCustomer ? toInitials(authorName) : "SA",
    message: conversation.message ?? "",
    dateTime: formatShortDateTime(conversation.created_at),
    attachments: conversation.ticket_conversation_images.map((image) =>
      toTicketAttachment(Number(conversation.id), image.name ?? ""),
    ),
  };
}

function toTicketAttachment(conversationId: number, name: string): TicketAttachment {
  const base = process.env.API_ASSET ?? "";
  return { name, url: `${base}ticket/${conversationId}/${name}` };
}

function toNotificationPref(
  notification: NotificationRow,
  userId: number,
): TicketNotificationPref {
  const isSelf = Number(notification.user_id) === userId;
  const firstname = notification.users?.firstname ?? "customer";

  return {
    id: Number(notification.id),
    label: isSelf ? "Notify me of updates" : `Notify ${firstname} of updates`,
    email: notification.users?.email ?? "",
    enabled: notification.email,
  };
}

function personName(person: {
  firstname: string;
  lastname?: string | null;
} | null): string {
  if (!person) return "";
  return `${person.firstname ?? ""} ${person.lastname ?? ""}`.trim();
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function postSaApi(path: string, body: unknown): Promise<Response> {
  return saApiFetch(path, { method: "POST", body: JSON.stringify(body) });
}

async function safe(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }
}
