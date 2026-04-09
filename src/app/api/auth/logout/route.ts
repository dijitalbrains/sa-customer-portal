import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  await signOut({ redirect: false });
  
  const landingUrl = process.env.LANDING_URL!;
  return NextResponse.redirect(new URL("/login", landingUrl));
}
