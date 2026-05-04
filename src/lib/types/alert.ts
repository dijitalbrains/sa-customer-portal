export type AlertChannel = "text_alerts" | "email_alerts" | "notification_alerts";

export interface AlertItem {
  id: number;
  productName: string;
  validityValue: number;
  validityType: "MONTHS" | "WEEKS";
  textAlerts: boolean;
  emailAlerts: boolean;
  notificationAlerts: boolean;
}

export interface AlertSubscription {
  id: number;
  title: string;
  productKey: string;
  items: AlertItem[];
}

export interface AlertOrder {
  id: number;
  subscriptions: AlertSubscription[];
}

export interface ReminderSettings {
  orders: AlertOrder[];
  hasPhone: boolean;
  hasEmail: boolean;
}
