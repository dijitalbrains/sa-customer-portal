import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  await signOut({ redirect: false });
  
  const landingUrl = process.env.LANDING_URL || "http://springa.test";
  return NextResponse.redirect(new URL("/login", landingUrl));
}
