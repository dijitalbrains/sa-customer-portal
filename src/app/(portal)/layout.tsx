import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppLayout from "@/layouts/app-layout";

export default async function PortalLayout({
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
