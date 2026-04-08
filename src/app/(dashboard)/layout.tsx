import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppLayout from "@/components/layout/app-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    const legacyLogin =
      (process.env.LEGACY_PORTAL_URL) + "/login";
    redirect(legacyLogin);
  }

  return (
    <AppLayout userName={session.user.name} adminId={session.adminId}>
      {children}
    </AppLayout>
  );
}
