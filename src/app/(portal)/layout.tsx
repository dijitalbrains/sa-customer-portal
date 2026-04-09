import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppLayout from "@/layouts/app-layout";

const LEGACY_PORTAL_URL = process.env.LEGACY_PORTAL_URL!;

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect(`${LEGACY_PORTAL_URL}/login`);
  }

  return (
    <AppLayout
      userName={session.user.name}
      adminId={session.adminId}
      legacyPortalUrl={LEGACY_PORTAL_URL}
    >
      {children}
    </AppLayout>
  );
}
