import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decodeAutoLoginToken } from "@/lib/services/auto-login-token-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!process.env.LEGACY_PORTAL_URL || !process.env.HASHIDS_SALT) {
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const legacyLoginUrl = `${process.env.LEGACY_PORTAL_URL}/login`;
  const { token } = await params;

  const decoded = decodeAutoLoginToken(token);
  if (!decoded) {
    return NextResponse.redirect(legacyLoginUrl);
  }

  const { userId, adminId } = decoded;
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { firstname: true, email: true },
  });
  if (!user) {
    return NextResponse.redirect(legacyLoginUrl);
  }

  const homeUrl = buildHomeUrl(request);
  await signIn("auto-login", {
    userId: String(userId),
    adminId: String(adminId),
    userName: user.firstname ?? "",
    userEmail: user.email ?? "",
    redirectTo: homeUrl,
  });

  return NextResponse.redirect(homeUrl);
}

function buildHomeUrl(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}/`;
}
