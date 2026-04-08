import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await signOut({ redirect: false });
  } catch {
    // signOut may throw NEXT_REDIRECT — ignore
  }

  const landingUrl = process.env.LANDING_URL || "http://springa.test";
  return NextResponse.redirect(new URL("/login", landingUrl));
}
