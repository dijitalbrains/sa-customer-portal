/**
 * Auto-Login Route Handler
 *
 * Flow: sa-portal → /auto-login/{hashids_token} → decode → verify user → create session → redirect
 *
 * The hashids token contains [userId, adminId, random] encoded with a shared salt.
 * On failure, redirects to the legacy portal login page.
 */

import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { decodeAutoLoginToken } from "@/lib/auth/hashids";
import { prisma } from "@/lib/prisma";

const LEGACY_LOGIN_URL =
  (process.env.LEGACY_PORTAL_URL || "http://sa-portal.test") + "/login";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Step 1: Decode hashids token → [userId, adminId]
  const decoded = decodeAutoLoginToken(token);
  if (!decoded) {
    return NextResponse.redirect(LEGACY_LOGIN_URL);
  }

  // Step 2: Verify user exists in database
  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return NextResponse.redirect(LEGACY_LOGIN_URL);
  }

  // Step 3: Create Auth.js session via signIn
  try {
    await signIn("auto-login", {
      userId: String(decoded.userId),
      adminId: String(decoded.adminId),
      userName: user.firstname || "",
      userEmail: user.email || "",
      redirect: false,
    });
  } catch (error: unknown) {
    // Auth.js throws NEXT_REDIRECT on successful signIn — let it through
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
