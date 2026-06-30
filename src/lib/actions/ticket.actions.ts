"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  markConversationsRead,
  replyToTicket as replyToTicketService,
  resolveTicket as resolveTicketService,
  sendFaqFeedback,
  submitTicket as createTicket,
  suggestFaqAnswer as requestFaqAnswer,
} from "@/lib/services/ticket-service";
import type {
  FaqSuggestion,
  ReplyTicketInput,
  SubmitTicketInput,
  SubmitTicketResult,
} from "@/lib/types/ticket";

export async function suggestFaqAnswer(input: {
  title: string;
  detail: string;
  categoryKey: string | null;
}): Promise<FaqSuggestion> {
  const { userId } = await getAuth();
  return requestFaqAnswer({ ...input, userId });
}

export async function faqFeedback(input: {
  suggestionId: number;
  outcome: string;
}): Promise<void> {
  const { userId } = await getAuth();
  await sendFaqFeedback(input.suggestionId, userId, input.outcome);
}

export async function submitTicket(
  input: SubmitTicketInput,
): Promise<SubmitTicketResult> {
  const { userId } = await getAuth();
  const result = await createTicket(userId, input);
  revalidatePath("/support");
  return result;
}

export async function replyToTicket(input: ReplyTicketInput): Promise<void> {
  const { userId } = await getAuth();
  await replyToTicketService(userId, input);
  revalidatePath(`/support/${input.ticketId}`);
}

export async function resolveTicket(input: { ticketId: number }): Promise<void> {
  const { userId } = await getAuth();
  await resolveTicketService(userId, input.ticketId);
  revalidatePath(`/support/${input.ticketId}`);
  revalidatePath("/support");
}

export async function markTicketRead(input: { ticketId: number }): Promise<void> {
  const { userId } = await getAuth();
  await markConversationsRead(userId, input.ticketId);
}
