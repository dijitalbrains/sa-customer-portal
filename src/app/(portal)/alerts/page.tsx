import { getReminderSettings } from "@/lib/actions/alert.actions";
import RemindersList from "./_components/reminders-list";

export default async function AlertsPage() {
  const settings = await getReminderSettings();
  return <RemindersList settings={settings} />;
}
