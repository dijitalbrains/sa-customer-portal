import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppLayout from "@/layouts/app-layout";
import { getCreditBalance } from "@/lib/services/user-credits-service";
import { getCartItemCount } from "@/lib/services/cart-service";

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

  const userId = Number(session.user.id);
  const isAdmin = session.adminId != null && session.adminId > 0;
  const [credits, cartItemCount] = await Promise.all([
    getCreditBalance(userId),
    getCartItemCount(userId).catch(() => 0),
  ]);

  return (
    <AppLayout
      userName={session.user.name}
      adminId={session.adminId}
      legacyPortalUrl={LEGACY_PORTAL_URL}
      credits={credits}
      isAdmin={isAdmin}
      cartItemCount={cartItemCount}
    >
      {children}
    </AppLayout>
  );
}
