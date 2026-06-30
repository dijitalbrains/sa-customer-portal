export type TicketStatus = "OPENED" | "RESOLVED";

export interface TicketCategoryOption {
  id: number;
  key: string;
  title: string;
}

export interface TicketCustomerOption {
  id: number;
  name: string;
  email: string;
}

export interface TicketListItem {
  id: number;
  reference: string;
  title: string;
  categoryTitle: string;
  status: TicketStatus;
  date: string;
}

export interface FaqLink {
  title: string;
  url: string;
}

export interface FaqSuggestion {
  matched: boolean;
  answer: string | null;
  links: FaqLink[];
  suggestionId: number | null;
}

export interface SupportUser {
  id: number;
  name: string;
  email: string;
}

export interface SupportData {
  user: SupportUser;
  categories: TicketCategoryOption[];
  customers: TicketCustomerOption[];
  openTickets: TicketListItem[];
  resolvedTickets: TicketListItem[];
}

export interface SubmitTicketInput {
  title: string;
  categoryId: number;
  detail: string;
  customerId: number;
  images: string[];
  notifyMe: boolean;
  notifyCustomer: boolean;
  suggestionId: number | null;
}

export interface SubmitTicketResult {
  ticketId: number;
}

export type TicketMessageSide = "customer" | "support";

export interface TicketAttachment {
  name: string;
  url: string;
}

export interface TicketMessage {
  id: number;
  side: TicketMessageSide;
  authorName: string;
  initials: string;
  message: string;
  dateTime: string;
  attachments: TicketAttachment[];
}

export interface TicketNotificationPref {
  id: number;
  label: string;
  email: string;
  enabled: boolean;
}

export interface TicketDetail {
  id: number;
  reference: string;
  title: string;
  status: TicketStatus;
  categoryTitle: string;
  submittedAt: string;
  lastUpdatedAt: string;
  submittedForName: string;
  repliesLabel: string;
  assignedTo: string;
  messages: TicketMessage[];
  notifications: TicketNotificationPref[];
}

export interface ReplyTicketInput {
  ticketId: number;
  message: string;
  images: string[];
  notifications: { id: number; email: boolean }[];
}
