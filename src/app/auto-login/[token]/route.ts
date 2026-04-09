import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import HashidsService from "@/lib/hashids";
import { prisma } from "@/lib/prisma";

const LEGACY_LOGIN_URL =
  (process.env.LEGACY_PORTAL_URL) + "/login";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Step 1: Decode hashids token → [userId, adminId, random]
  const decoded = HashidsService.decode(token);
  if (decoded.length < 2) {
    return NextResponse.redirect(LEGACY_LOGIN_URL);
  }

  const [userId, adminId] = decoded;

  // Step 2: Verify user exists in database
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.redirect(LEGACY_LOGIN_URL);
  }

  // Step 3: Create Auth.js session via signIn
  try {
    await signIn("auto-login", {
      userId: String(userId),
      adminId: String(adminId),
      userName: user.firstname || "",
      userEmail: user.email || "",
      redirect: false,
    });
  } catch (error: unknown) {
    if (error instanceof Error && "digest" in error) {
      const digest = (error as Record<string, unknown>).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    return NextResponse.redirect(LEGACY_LOGIN_URL);
  }

  // Step 4: Redirect to dashboard
  return NextResponse.redirect(new URL("/", request.url));
}
